# Deepfake detectors, shape by shape

Three animated explainers that follow the tensors through the models behind modern
voice-deepfake detection. Watch them at **https://ganesh-deepak.github.io/voice-deepfake/**.

| # | Episode | What you follow |
|---|---------|-----------------|
| 1 | **wav2vec 2.0** (`#w2v2`) | 16,000 samples → 7 convolutions → projection → 12 transformer layers → `(B, 49, 768)`; pre-training (quantizer, contrastive loss); using it as a spoofing front end |
| 2 | **AASIST back-end** (`#aasist`) | XLS-R `(B, 201, 1024)` → features as an image → residual encoder → spectral and temporal nodes → graph attention, HS-GAL, readout → 2 logits |
| 3 | **XLSR-MamBo** (`#mambo`) | XLS-R `(B, 208, 1024)` → 5 MamBo layers (Hydra ×3, SwiGLU, attention, SwiGLU) → gated attention pooling → 2 logits |

The player tracks the tensor shape in a bar at the bottom of every frame, has chapters,
karaoke captions, a music toggle and keyboard controls (Space, ←/→, C, M, F).

## Every number is checked

Each shape and parameter count on screen was traced in PyTorch (CPU is enough):

```bash
pip install torch transformers
python verify/w2v2_shapes.py     # HF Wav2Vec2Model: (1, 49, 768), 13 hidden states, 94.37M params; XLS-R: 201 / 208 frames
python verify/aasist_shapes.py   # the SSL-AASIST authors' back-end, XLS-R stubbed: 447,242 params
python verify/mambo_shapes.py    # plain-PyTorch replica of the official code: 3.93M back-end, 319.37M with XLS-R
```

Sources: Baevski et al. 2020 (wav2vec 2.0), Jung et al. 2022 (AASIST), Tak et al. 2022
(SSL-AASIST, [code](https://github.com/TakHemlata/SSL_Anti-spoofing)), Ng et al., Findings of
ACL 2026 (XLSR-MamBo, [code](https://github.com/saki-ciallo/XLSR-MamBo)).

## How it is made

- `src/engine.js` is a deterministic canvas engine: `renderAt(t)` draws the frame for time `t`,
  so the web player, scrubbing, and the MP4 renderer all show the same frame.
- **Motion layer.** Primitives know when they are entering (their alpha comes from a running
  tween) and perform a real entrance: text rises behind a mask wipe, panels trace their border
  with a pen tip, matrices materialise cell by cell, chips spring in. Scene boundaries are
  velocity-matched "cut the curve" moves and each chapter opens on a title card that docks into
  the header (after HeyGen HyperFrames' *motion doctrine*); springs follow the MIT
  *motion-graphic* skill. The HUD's stage indicator stretches as it travels and the shape
  readout rolls when it changes.
- `videos/<id>/scenes*.js` hold each episode: narration beats plus a `draw(ctx, S)` per scene.
- `build/<id>/timeline.js` and `narration.mp3` are generated (below); `build/music.mp3` is a
  synthesized 64 s ambient loop the player ducks under the voice.

## Rebuilding

```bash
# narration (Kokoro TTS, voice af_heart) -> build/<id>/timeline.js + a voice WAV
pip install kokoro-onnx soundfile numpy
python tools/tts.py w2v2 --models <dir with kokoro-v1.0.onnx, voices-v1.0.bin> --cache .tts --wav .out/voice_w2v2.wav

# voice polish + synthesized SFX -> build/<id>/narration.mp3 ; ambient loop -> build/music.mp3
pip install scipy pyloudnorm
python tools/sound.py mix w2v2 --voice .out/voice_w2v2.wav --out build/w2v2/narration.mp3
python tools/sound.py music --out build/music.mp3

# MP4 (1080p30, same frames as the site)
pip install playwright && playwright install chromium
python tools/render.py w2v2 --out .out/ep1-wav2vec2.mp4
```

Serve the folder with any static server (`python -m http.server`) and open `index.html`.
