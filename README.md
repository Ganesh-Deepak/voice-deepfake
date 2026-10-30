# Deepfake detectors, shape by shape

Three animated explainers that follow the tensors through the models behind modern
voice-deepfake detection. Watch them at **https://ganesh-deepak.github.io/voice-deepfake/**.

| # | Episode | What you follow |
|---|---------|-----------------|
| 1 | **XLS-R 300M** (`#xlsr`) | 1 s = 16,000 samples → 7 convolutions (LayerNorm + GELU) → projection → positional conv → 24 pre-norm transformer layers (16 heads, FFN 4096) → `(B, 49, 1024)`, and a 4 s detector crop of 64,600 samples → `(B, 201, 1024)`; 25 hidden states; pre-training (quantizer, contrastive loss); using it as a spoofing front end |
| 2 | **AASIST back-end** (`#aasist`) | XLS-R `(B, 201, 1024)` → features as an image → residual encoder → spectral and temporal nodes → graph attention, HS-GAL, readout → 2 logits |
| 3 | **XLSR-MamBo** (`#mambo`) | XLS-R `(B, 208, 1024)` → 5 MamBo layers (Hydra ×3, SwiGLU, attention, SwiGLU) → gated attention pooling → 2 logits |

The player tracks the tensor shape in a bar at the bottom of every frame, has chapters,
karaoke captions, a music toggle, full screen (the ⛶ button, F or a double-click; on phones it
turns to landscape) and keyboard controls (Space, ←/→, C, M, F).

## Every number is checked

Each shape and parameter count on screen was traced in PyTorch (CPU is enough):

```bash
pip install torch transformers
python verify/xlsr_shapes.py     # XLS-R 300M from its published config: (2, 201, 1024), 25 hidden states, (2, 16, 201, 201) attention, 315,438,720 params
python verify/aasist_shapes.py   # the SSL-AASIST authors' back-end, XLS-R stubbed: 447,242 params
python verify/mambo_shapes.py    # plain-PyTorch replica of the official code: 3.93M back-end, 319.37M with XLS-R
```

Sources: Babu et al. 2022 (XLS-R), Baevski et al. 2020 (wav2vec 2.0), Jung et al. 2022 (AASIST), Tak et al. 2022
(SSL-AASIST, [code](https://github.com/TakHemlata/SSL_Anti-spoofing)), Ng et al., Findings of
ACL 2026 (XLSR-MamBo, [code](https://github.com/saki-ciallo/XLSR-MamBo)).

## How it is made

- `src/engine.js` is a deterministic canvas engine: `renderAt(t)` draws the frame for time `t`,
  so the web player, scrubbing, and the MP4 renderer all show the same frame. `src/space.js` is a
  small 3-D layer (perspective camera, shaded tensor blocks) kept for the cold open and the FFN;
  the teaching scenes are flat, so every shape stays readable.
- Reveals are tied to the narration: `S.ps(beat, sentence)` fades an element in on the sentence
  that names it, and the shape bar changes when the voice states the new shape.
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
python tools/tts.py xlsr --models <dir with kokoro-v1.0.onnx, voices-v1.0.bin> --cache .tts --wav .out/voice_xlsr.wav

# voice polish + synthesized SFX -> build/<id>/narration.mp3 ; ambient loop -> build/music.mp3
pip install scipy pyloudnorm
python tools/sound.py mix xlsr --voice .out/voice_xlsr.wav --out build/xlsr/narration.mp3
python tools/sound.py music --out build/music.mp3

# MP4 (1080p30, same frames as the site)
pip install playwright && playwright install chromium
python tools/render.py xlsr --out .out/ep1-xlsr-300m.mp4
```

A sentence that starts with `[+1.5]` in a beat gets an extra 1.5 s pause before it, so a result
can sit on screen before the next idea.

Serve the folder with any static server (`python -m http.server`) and open `index.html`.

## Reviewing an episode

The builder is the worst judge of their own video, so each episode is watched as images and
numbers and scored by a separate reviewer before it ships
(`.claude/skills/explainer-review/SKILL.md`, rubric in `tools/review/rubric.md`, adapted from
*nl-video-score* and the *motion-graphic* skill's critique loop):

```bash
python tools/review/review.py xlsr --out review/xlsr/round-1   # storyboards with the spoken line under each frame,
                                                              # 8 fps motion strips, cuts, pacing/readability metrics
```

The reviewer checks nine defects (narration out of sync with the picture, shapes spoken but not
shown, ideas used before they are explained, rushed or dead stretches, overlaps, broken motion)
and scores clarity, shape legibility, sync, pacing, motion and polish out of 100.
Each round's `review.md` and `metrics.md` are kept in `review/`.

Review history. The rubric's weights sum to 110; early rounds reported that raw sum as if it were
out of 100, so both are given. Every round was scored by a new reviewer, which moves totals by a
few points on its own; what each round fixed is in the next commit.

| Episode | Round | What was reviewed | Raw / 110 | / 100 |
|---|---|---|---|---|
| wav2vec 2.0 (old flat version) | 0 | the first series, for reference | 78 | 71 |
| XLS-R 300M | 1 | 3-D version | 52 | 47 |
| XLS-R 300M | 2 | flat scenes ported to XLS-R | 62 | 56 |
| XLS-R 300M | 3 | sync and pacing fixes | 71 | 65 |
| XLS-R 300M | 4 | round-3 fixes | 69 | 63 |
| XLS-R 300M | 5 | round-4 fixes | 68 | 62 |
| AASIST | 1 | first review | 61 | 55 |
| AASIST | 2 | most scenes rebuilt | 67 | 61 |
| AASIST | 3 | round-2 fixes | 71 | 65 |
| XLSR-MamBo | 1 | first review | 63 | 57 |
| XLSR-MamBo | 2 | Hydra block and pooling rebuilt | 60 | 55 |
| XLSR-MamBo | 3 | round-2 fixes | 68 | 62 |

No round found a factual error in the shapes or parameter counts after AASIST round 2 (which
caught the row-wise softmax in graph attention). The fixes made after each episode's last round
above have not been scored yet.
