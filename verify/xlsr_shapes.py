"""Shape and parameter check for episode 1 (XLS-R 300M).

Builds facebook/wav2vec2-xls-r-300m from its published config (verify/xlsr_300m_config.json,
copied from the Hugging Face hub) with random weights, so it runs offline on CPU:

    pip install torch transformers
    python verify/xlsr_shapes.py
"""
import json
import os

import torch
from transformers import Wav2Vec2Config, Wav2Vec2ForPreTraining

here = os.path.dirname(os.path.abspath(__file__))
cfg = Wav2Vec2Config(**json.load(open(os.path.join(here, "xlsr_300m_config.json"))))
cfg._attn_implementation = "eager"  # so the attention weights can be returned
torch.manual_seed(0)
pre = Wav2Vec2ForPreTraining(cfg).eval()
m = pre.wav2vec2
count = lambda mod: sum(p.numel() for p in mod.parameters())


def frames(n):
    out = [n]
    for k, s in zip(cfg.conv_kernel, cfg.conv_stride):
        n = (n - k) // s + 1
        out.append(n)
    return out


for n in (16000, 64600, 66800):
    print(f"{n} samples -> conv lengths {frames(n)}")

x = torch.randn(2, 64600)  # B = 2 clips, the 4.04 s crop used by SSL-AASIST
shapes = {}


def keep(name, pick=lambda o: o):
    def hook(mod, inp, out):
        shapes.setdefault(name, tuple(pick(out).shape))  # returns None, so the output is untouched
    return hook


m.feature_extractor.register_forward_hook(keep("feature_extractor (B, C, T)"))
m.encoder.pos_conv_embed.register_forward_hook(keep("pos_conv_embed"))
blk = m.encoder.layers[0]
blk.attention.register_forward_hook(keep("attention out", lambda o: o[0]))
blk.feed_forward.intermediate_dense.register_forward_hook(keep("FFN hidden"))
with torch.no_grad():
    out = m(x, output_hidden_states=True, output_attentions=True)
print("\n== forward, x =", tuple(x.shape))
for k, v in shapes.items():
    print(f"{k:28s} {v}")
print(f"{'extract_features':28s} {tuple(out.extract_features.shape)}")
print(f"{'attention weights, layer 1':28s} {tuple(out.attentions[0].shape)}")
print(f"{'last_hidden_state':28s} {tuple(out.last_hidden_state.shape)}")
print(f"{'hidden_states':28s} {len(out.hidden_states)} x {tuple(out.hidden_states[0].shape)}")


print("\n== weights")
print("conv0 weight / bias         ", tuple(m.feature_extractor.conv_layers[0].conv.weight.shape), tuple(m.feature_extractor.conv_layers[0].conv.bias.shape))
print("conv0 layer norm            ", type(m.feature_extractor.conv_layers[0].layer_norm).__name__, tuple(m.feature_extractor.conv_layers[0].layer_norm.weight.shape))
print("projection weight           ", tuple(m.feature_projection.projection.weight.shape))
print("pos conv weight             ", tuple(m.encoder.pos_conv_embed.conv.weight.shape), "groups", m.encoder.pos_conv_embed.conv.groups)
print("q_proj weight               ", tuple(blk.attention.q_proj.weight.shape))
print("FFN up / down               ", tuple(blk.feed_forward.intermediate_dense.weight.shape), tuple(blk.feed_forward.output_dense.weight.shape))
print("quantizer weight_proj       ", tuple(pre.quantizer.weight_proj.weight.shape), "codevectors", tuple(pre.quantizer.codevectors.shape))
print("project_q / project_hid     ", tuple(pre.project_q.weight.shape), tuple(pre.project_hid.weight.shape))

print("\n== parameters")
parts = {
    "feature encoder (7 convs)": m.feature_extractor,
    "feature projection": m.feature_projection,
    "positional conv": m.encoder.pos_conv_embed,
    "24 transformer layers": m.encoder.layers,
    "final layer norm": m.encoder.layer_norm,
}
for k, v in parts.items():
    print(f"{k:28s} {count(v):>12,}")
print(f"{'one transformer layer':28s} {count(m.encoder.layers[0]):>12,}")
print(f"{'  attention':28s} {count(blk.attention):>12,}")
print(f"{'  feed-forward':28s} {count(blk.feed_forward):>12,}")
print(f"{'masked_spec_embed':28s} {m.masked_spec_embed.numel():>12,}")
print(f"{'Wav2Vec2Model total':28s} {count(m):>12,}")
print(f"{'pre-training heads':28s} {count(pre) - count(m):>12,}")

# the 25th hidden state is layer 24's raw output; last_hidden_state adds the encoder's final LayerNorm
with torch.no_grad():
    normed = m.encoder.layer_norm(out.hidden_states[-1])
print("last_hidden_state == final_layer_norm(hidden_states[24]):", torch.allclose(out.last_hidden_state, normed, atol=1e-5))
