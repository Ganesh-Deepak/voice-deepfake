"""Shape and parameter check for video 1 (wav2vec 2.0).

Builds the models from their published configs with random weights (no download),
so every number on screen can be reproduced offline:

    pip install torch transformers
    python verify/w2v2_shapes.py
"""
import torch
from transformers import Wav2Vec2Config, Wav2Vec2Model


def conv_frames(n, layers=((10, 5),) + ((3, 2),) * 4 + ((2, 2),) * 2):
    out = [n]
    for k, s in layers:
        n = (n - k) // s + 1
        out.append(n)
    return out


def millions(m):
    return sum(p.numel() for p in m.parameters()) / 1e6


torch.manual_seed(0)
base = Wav2Vec2Model(Wav2Vec2Config()).eval()  # the default config is wav2vec 2.0 base
x = torch.randn(1, 16000)  # B = 1 clip, one second at 16 kHz
with torch.no_grad():
    out = base(x, output_hidden_states=True)

print("== wav2vec 2.0 base, one second ==")
print("frame lengths per conv layer :", conv_frames(16000))
print("input                        :", tuple(x.shape))
print("extract_features             :", tuple(out.extract_features.shape))
print("last_hidden_state            :", tuple(out.last_hidden_state.shape))
print("hidden_states                :", len(out.hidden_states), "x", tuple(out.hidden_states[0].shape))
print("conv0 weight                 :", tuple(base.feature_extractor.conv_layers[0].conv.weight.shape))
print("conv1 weight                 :", tuple(base.feature_extractor.conv_layers[1].conv.weight.shape))
print("projection weight            :", tuple(base.feature_projection.projection.weight.shape))
print("pos_conv groups / kernel     :", base.encoder.pos_conv_embed.conv.groups, base.encoder.pos_conv_embed.conv.kernel_size)
print("feature encoder params (M)   : %.3f" % millions(base.feature_extractor))
print("feature projection params (M): %.3f" % millions(base.feature_projection))
print("pos conv params (M)          : %.3f" % millions(base.encoder.pos_conv_embed))
print("transformer layers params (M): %.3f" % millions(base.encoder.layers))
print("one layer params (M)         : %.3f" % millions(base.encoder.layers[0]))
print("total params (M)             : %.2f" % millions(base))

xlsr_cfg = Wav2Vec2Config(
    hidden_size=1024, num_hidden_layers=24, num_attention_heads=16, intermediate_size=4096,
    feat_extract_norm="layer", do_stable_layer_norm=True, conv_bias=True,
)
xlsr = Wav2Vec2Model(xlsr_cfg).eval()
print("\n== XLS-R 300M config ==")
for n in (64600, 66800):
    with torch.no_grad():
        h = xlsr(torch.randn(1, n), output_hidden_states=True)
    print(f"{n} samples -> last_hidden_state {tuple(h.last_hidden_state.shape)}, {len(h.hidden_states)} hidden states")
print("total params (M)             : %.2f" % millions(xlsr))
