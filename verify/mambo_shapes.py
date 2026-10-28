"""Shape and parameter check for video 3 (XLSR-MamBo, MamBo-3-Hydra-N3).

The official code (https://github.com/saki-ciallo/XLSR-MamBo, MIT License) needs the
CUDA kernels from mamba_ssm and Hydra. This is a plain-PyTorch replica of the same
modules (same layer sizes, same order, same parameter names where possible), with a
slow reference scan instead of the fused kernel. It runs on CPU:

    pip install torch
    python verify/mambo_shapes.py

The XLS-R front-end is replaced by a random (B, 208, 1024) tensor; its parameter count
(315.44M, see verify/w2v2_shapes.py) is added at the end.
"""
import math

import torch
import torch.nn as nn
import torch.nn.functional as F

D_MODEL, D_STATE, EXPAND, HEADDIM, HYDRA_CONV = 128, 64, 2, 64, 7
MHA_HEADS, MHA_CONV = 4, 4
LAYERS, N_HYDRA = 5, 3
XLSR_PARAMS = 315_438_720  # Wav2Vec2Model with the XLS-R 300M config

TRACE = []


def log(name, *tensors):
    TRACE.append((name, [tuple(t.shape) for t in tensors]))


class RMSNorm(nn.Module):
    def __init__(self, d, eps=1e-5):
        super().__init__()
        self.eps, self.weight = eps, nn.Parameter(torch.ones(d))

    def forward(self, x, z=None):  # gated variant: normalize first, then multiply by SiLU(z)
        y = x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps) * self.weight
        return y if z is None else y * F.silu(z)


class Hydra(nn.Module):
    """Bidirectional Mamba-2 (quasiseparable matrix mixer), as in modules/hydra/modules/hydra.py."""

    def __init__(self, d_model=D_MODEL, d_state=D_STATE, d_conv=HYDRA_CONV, expand=EXPAND, headdim=HEADDIM):
        super().__init__()
        self.d_inner = expand * d_model
        self.d_state, self.headdim = d_state, headdim
        self.nheads = self.d_inner // headdim
        d_in_proj = 2 * self.d_inner + 2 * (2 * d_state) + 2 * self.nheads
        conv_dim = self.d_inner + 2 * (2 * d_state)
        self.in_proj = nn.Linear(d_model, d_in_proj, bias=False)
        self.conv1d = nn.Conv1d(conv_dim, conv_dim, d_conv, groups=conv_dim, padding=d_conv // 2)
        self.dt_bias = nn.Parameter(torch.zeros(self.nheads))
        self.A_log = nn.Parameter(torch.zeros(self.nheads))
        self.D = nn.Parameter(torch.ones(self.nheads))
        self.fc_D = nn.Linear(self.d_inner, self.nheads, bias=False)
        self.norm = RMSNorm(self.d_inner)
        self.out_proj = nn.Linear(self.d_inner, d_model, bias=False)

    @staticmethod
    def scan(x, dt, A, B, C):
        # x: (b, l, h, p)  dt: (b, l, h)  B, C: (b, l, n)  ->  y: (b, l, h, p)
        b, l, h, p = x.shape
        state = x.new_zeros(b, h, p, B.shape[-1])
        ys = []
        for t in range(l):
            decay = torch.exp(dt[:, t] * A)                                    # (b, h)
            state = state * decay[..., None, None] + (dt[:, t, :, None] * x[:, t])[..., None] * B[:, t, None, None, :]
            ys.append((state * C[:, t, None, None, :]).sum(-1))
        return torch.stack(ys, 1)

    def forward(self, u):
        batch, seqlen, _ = u.shape
        zxbcdt = self.in_proj(u)
        log("hydra.in_proj", zxbcdt)
        z, xBC, dt = torch.split(zxbcdt, [self.d_inner, self.d_inner + 4 * self.d_state, 2 * self.nheads], -1)
        dt = torch.cat((dt[..., :self.nheads], torch.flip(dt[..., self.nheads:], (1,))), 0)
        dt = F.softplus(dt + self.dt_bias)
        xBC = F.silu(self.conv1d(xBC.transpose(1, 2)).transpose(1, 2))
        log("hydra.conv1d", xBC)
        x, BC = torch.split(xBC, [self.d_inner, 4 * self.d_state], -1)
        x_og = x
        x = torch.cat((x, torch.flip(x, (1,))), 0)
        BC = torch.cat((BC[..., :2 * self.d_state], torch.flip(BC[..., 2 * self.d_state:], (1,))), 0)
        B, C = torch.split(BC, [self.d_state, self.d_state], -1)
        xh = x.view(2 * batch, seqlen, self.nheads, self.headdim)
        log("hydra.x (2B, L, heads, headdim)", xh)
        log("hydra.B / C", B, C)
        y = self.scan(xh, dt, -torch.exp(self.A_log), B, C).reshape(2 * batch, seqlen, self.d_inner)
        y = torch.roll(y, shifts=1, dims=1)
        y[:, 0] = 0.0
        y = y[:batch] + torch.flip(y[batch:], (1,))
        gain = F.linear(x_og, self.fc_D.weight, self.D)                       # (B, L, heads): input-dependent
        y = y + x_og * gain.repeat_interleave(self.headdim, -1)
        out = self.out_proj(self.norm(y, z))
        log("hydra.out", out)
        return out


class SwiGLU(nn.Module):
    def __init__(self, d=D_MODEL):
        super().__init__()
        hidden = int(8 * d / 3)  # 341
        self.w1_w3_combined = nn.Linear(d, 2 * hidden, bias=False)
        self.w2_out = nn.Linear(hidden, d, bias=False)

    def forward(self, x):
        gate, value = self.w1_w3_combined(x).chunk(2, -1)
        log("swiglu gate / value", gate, value)
        return self.w2_out(F.silu(gate) * value)


class MHA(nn.Module):
    """mamba_ssm.modules.mha.MHA(embed_dim=128, num_heads=4, d_conv=4), causal=False."""

    def __init__(self, d=D_MODEL, heads=MHA_HEADS, d_conv=MHA_CONV):
        super().__init__()
        self.heads, self.d_conv = heads, d_conv
        self.in_proj = nn.Linear(d, 3 * d)
        self.conv1d = nn.Conv1d(3 * d, 3 * d, d_conv, padding=d_conv - 1, groups=3 * d)
        self.out_proj = nn.Linear(d, d)

    def forward(self, x):
        b, l, d = x.shape
        qkv = self.in_proj(x)
        log("mha.in_proj", qkv)
        qkv = self.conv1d(qkv.transpose(1, 2))[..., :-(self.d_conv - 1)].transpose(1, 2)  # causal depthwise conv
        q, k, v = qkv.view(b, l, 3, self.heads, d // self.heads).permute(2, 0, 3, 1, 4)
        scores = q @ k.transpose(-1, -2) / math.sqrt(d // self.heads)
        log("mha.scores", scores)
        y = (scores.softmax(-1) @ v).transpose(1, 2).reshape(b, l, d)
        return self.out_proj(y)


class Block(nn.Module):
    """Add -> RMSNorm -> mixer; the residual stream is carried separately (pre-norm)."""

    def __init__(self, mixer):
        super().__init__()
        self.norm, self.mixer = RMSNorm(D_MODEL), mixer

    def forward(self, h, residual):
        residual = h if residual is None else h + residual
        return self.mixer(self.norm(residual)), residual


class GatedAttentionPool(nn.Module):
    def __init__(self, d=D_MODEL):
        super().__init__()
        hidden = int(8 * d // 3)
        self.gate_value_proj = nn.Linear(d, 2 * hidden, bias=False)
        self.to_score = nn.Linear(hidden, 1, bias=False)

    def forward(self, x):
        gate, value = self.gate_value_proj(x).chunk(2, -1)
        scores = self.to_score(F.silu(gate) * value).squeeze(-1)
        w = scores.softmax(1).unsqueeze(1)
        log("pool scores / weights", scores, w)
        return torch.bmm(w, x).squeeze(1)


class MamBo(nn.Module):
    def __init__(self):
        super().__init__()
        self.input_proj = nn.Linear(1024, D_MODEL, bias=False)
        self.input_norm = RMSNorm(D_MODEL)
        blocks = []
        for _ in range(LAYERS):  # MamBo-3: [Hydra x N, SwiGLU, MHA, SwiGLU]
            blocks += [Block(Hydra()) for _ in range(N_HYDRA)]
            blocks += [Block(SwiGLU()), Block(MHA()), Block(SwiGLU())]
        self.blocks = nn.ModuleList(blocks)
        self.norm_f = RMSNorm(D_MODEL)
        self.attention_pool = GatedAttentionPool()
        self.classifier = nn.Linear(D_MODEL, 2)

    def forward(self, feats):
        h = F.silu(self.input_norm(self.input_proj(feats)))
        log("input_proj", h)
        residual = None
        for blk in self.blocks:
            h, residual = blk(h, residual)
        h = self.norm_f(h + residual)
        log("after 30 blocks + final RMSNorm", h)
        pooled = self.attention_pool(h)
        log("pooled", pooled)
        return self.classifier(pooled)


if __name__ == "__main__":
    torch.manual_seed(0)
    model = MamBo().eval()
    feats = torch.randn(2, 208, 1024)  # XLS-R output for 66,800 samples
    with torch.no_grad():
        logits = model(feats)
    seen = set()
    for name, shapes in TRACE:
        if name in seen:
            continue
        seen.add(name)
        print(f"{name:34s}", " ".join(str(s) for s in shapes))
    print(f"{'logits':34s}", tuple(logits.shape))
    count = lambda m: sum(p.numel() for p in m.parameters())
    print("\nHydra block   :", count(model.blocks[0]))
    print("SwiGLU block  :", count(model.blocks[3]))
    print("MHA block     :", count(model.blocks[4]))
    print("one MamBo layer:", sum(count(b) for b in model.blocks[:6]))
    print("back-end      : %.2fM" % (count(model) / 1e6))
    print("with XLS-R    : %.2fM" % ((count(model) + XLSR_PARAMS) / 1e6))
