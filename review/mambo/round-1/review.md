# Review: Episode 3, XLSR-MamBo (round 1)

**Total: 63 / 100. Verdict: rework the failing scenes (< 70).**

Reviewer: fresh context. I watched only through the storyboard, motion, cut and metrics files in this folder.
Viewer persona: knows some Python and basic attention, has seen XLS-R (ep. 1) and AASIST (ep. 2), and has never seen an SSM, Mamba or Hydra.
All times are scene-relative seconds, read from the storyboard and motion timestamps.

The numbers are correct and the HUD always carries a shape. The first half of the SSM chapter (toy recurrence with real values) is the best teaching in the episode.
The episode fails on four things:
- the most complex block (`m_hshapes`, 118 s) is a scrolling text ledger with no tensor picture;
- several spoken shapes are never written down;
- the key "time axis disappears" moment in pooling is a formula, not a picture;
- there are 40 dead stretches, and two beats run above 175 wpm.

---

## 1. Defects

| # | Defect | Result | Evidence (file, scene time) |
|---|---|---|---|
| E1 | Narration not on screen / screen much earlier or later | **FAIL** | `storyboard-07-m_hshapes` 10.0–14.4 s: "width is expanded two times, to 256". The screen shows only the `input (B, 208, 128)` row; 256 first appears at 21.1 s. · `storyboard-07` 76.7–78.9 s: "B and C are 2B by 208 by 64". No row or label shows it. · `storyboard-05-m_ssm` 95.8 s: "lower-triangular: causal" is on screen 18 s before it is spoken (113.5 s), and the "Same form as masked attention…" paragraph appears at 102.5 s during silence. · `storyboard-14-m_recap` 50.2 s: the caption "time is removed only at the very end, by pooling" is shown 11 s before it is spoken (61.3 s). · `storyboard-09-m_mha` 30.3 s: `out_proj 128 → 128` is shown 13 s before it is spoken (43.8 s). · `storyboard-07` 61.1 s: the HUD already reads (2B, 208, 4, 64) while the voice and row say (2B, 208, 256); "view as heads" is spoken at 70.0 s. · `storyboard-10-m_stack` 3.3 s: "743 thousand parameters" is spoken, but `743,076` appears at 9.9 s. |
| E2 | Shape spoken but not written, or too small | **FAIL** | `storyboard-07` 76.7 s: B/C (2B, 208, 64) is never written. · `storyboard-11-m_pool` 10.3–19.4 s: "128 to 341" is spoken; 341 is nowhere on screen (only `to_score(SiLU(gate) ⊙ value)`). · `storyboard-07` 10.0 s: 256 is spoken and not shown. · The `m_hshapes` ledger shapes are right-aligned 1-line mono text in dimmed rows, readable only on zoom (`storyboard-07` 61–117 s). · `metrics.md`: three overview box labels are 18 px. |
| E3 | Transformation without the changing axis made clear | **FAIL** | `storyboard-07` 21.1–34.4 s: (B, 208, 776) → z 256 · xBC 512 · Δ 8 is one text row. No slab is cut along the last axis, and nothing highlights the part being named at 25.6 / 30.0 / 32.2 s. · `storyboard-07` 65.6–74.5 s: "view as heads" (2B, 208, 256) → (2B, 208, 4, 64) is text only. · `storyboard-11` 28.5–37.7 s: the weighted sum (B, 208, 128) → (B, 128) is only the formula line; the frame strip never collapses. · `storyboard-09` 43.8 s: scores → ·V → concat 4×32 → 128 → out_proj is not drawn. |
| E4 | Concept used before explained, or one sentence and no picture | **FAIL** | `storyboard-05` 62.8 s ("Δ step size (one per head)") and 78.2–93.6 s (x_t (64), "each head's state"): SSM heads are used before the viewer has seen 256 split into 4 × 64, which first appears at `storyboard-07` 65.6 s. · `storyboard-07` 43.3–47.8 s: "Depthwise means each of the 512 channels has its own small kernel" is one sentence with no picture. · `storyboard-06-m_hydra` 14.8–28.5 s: `SS(·)` is never named on screen, and `shift` is explained only in narration plus a tiny grey caption. · `storyboard-05` 115.7 s: "state space duality" is spoken but never written, yet "SSD" is later used on screen (`storyboard-07` 83.3 s "SSD scan", `storyboard-14` 30 s "bidirectional SSD"). |
| E5 | > 3 new ideas / 10 s, beat > 175 wpm, or meaningful text too brief | **FAIL** | `metrics.md`: `m_hshapes` beat 5 at **184 wpm** (≈ 81–101 s: scan returns, flip back, add, D gain computed from x, back to 256). `m_hydra` beat 4 at **180 wpm** (≈ 49–61 s: stack on batch, single call, 2B). · `storyboard-05` 38.6–58 s packs Δ, softplus, A < 0 learned, exp(ΔA), large Δ and small Δ into about 20 s. (The short-text items in metrics are chapter or title-card words and are not counted.) |
| E6 | Camera move / 3-D while reading | PASS | No camera moves or perspective anywhere. The MHA 4-head slabs (`storyboard-09` 30.3 s) are flat offsets and stay legible. |
| E7 | Text over text/shapes; content cut off | **FAIL** | `storyboard-08-m_swiglu` 17.2–42.5 s: `SiLU(gate) ⊙ value` sits on top of the `gate 341` label. · `cut-11.jpg` +0.30/+0.60 and `storyboard-11` 1.1 s: the chapter title "Gated attention pooling" is drawn over the already-visible frame strip. · `storyboard-05` 45.2–76.0 s: the "small Δ: keep memory" label is crossed by the decay curve. · `storyboard-09` 48.3 s and `motion-09` b3 +0.25: two HUD shape rows are stacked on top of each other. |
| E8 | Dead stretch > 6 s while narration moves on / cluttered frame | **FAIL** | `metrics.md` lists 40 dead stretches. The worst ones with narration running: `m_recap` 50.6–68.4 s (17.8 s, three sentences); `m_ssm` 108.2–123.2 s (15 s); `m_front` 23.8–38.6 s (14.8 s); `m_hshapes` 3.1–15.3 s and 103.6–117.6 s; `m_overview` 4.5–16.7 s; `m_mha` 59.8–71.8 s; `m_train` 42.0–54.0 s. |
| E9 | Pop-in, jitter, broken-looking motion | **FAIL** | `motion-01-m_overview` b3 +0.25→+0.50: the HUD stage label flicks SwiGLU → Pool → Head in 0.25 s. · `motion-09-m_mha` b3 +0.25 and `storyboard-09` 48.3 s: the HUD cross-fades by stacking two chip rows. · `storyboard-00-m_intro` 12.3 s: the EER counter shows **0.67 %** mid count-up before settling at 0.81 %. |

## 2. Scorecard

| Dimension | Weight | Score | Cap applied | Points |
|---|---|---|---|---|
| Concept clarity | ×3 | 6 | ≤ 6 (E3, E4, E8) | 18 |
| Tensor-shape legibility | ×2 | 6 | ≤ 6 (E2, E3) | 12 |
| Narration–visual sync | ×2 | 6 | ≤ 6 (E1) | 12 |
| Pacing | ×2 | 5 | ≤ 6 (E5) | 10 |
| Motion quality | ×1 | 5 | ≤ 6 (E9) | 5 |
| Visual polish | ×1 | 6 | ≤ 6 (E7) | 6 |
| **Total** | | | | **63 / 100** |

Why each score sits where it does:
- **Clarity 6, at the cap.** `m_front`, `m_inproj`, the toy recurrence in `m_ssm` and the Hydra matrix would rate 8 on their own. `m_hshapes` (a 2-minute text table) and `m_pool` (no collapse) pull the score down.
- **Pacing 5.** The episode is both padded (40 dead stretches) and rushed (184 and 180 wpm beats). That combination puts it below the cap.
- **Motion 5.** Almost everything fades in where it sits. Only three moments carry elements somewhere: the MHA conv window sweep, the Hydra stacking, and the SSM h-row filling.
- No score is 8 or above, so no evidence file is needed for a high score.

## 3. Per scene

- **m_intro (53.7 s)**
  - Viewer understands: ep. 3, an SSM + attention back-end, rebuilt in plain PyTorch, and new axis colours for S/E/H/P.
  - Biggest gap: at 12.3–36.9 s the stat panel (3.93 M, 30, 0.81 %) is never explained while it is shown, and the counter passes 0.67 %. The S/E/H/P letters (41–50 s) never reappear on any later shape, only their colours.
- **m_overview (88.2 s)**
  - Viewer understands: the six-box pipeline with a shape under each box, every block (B, 208, 128) → (B, 208, 128), 319,373,323 parameters, the EER bars.
  - Biggest gap:
    - 4.5–16.7 s: two static boxes for a 12 s sentence.
    - 47.4 s: the HUD jumps to B × 2 while the voice is still describing pooling to (B, 128).
    - Box subtitles are 18 px.
- **m_front (38.8 s)**
  - Viewer understands: 66,800 samples → ⌊(66800 − 400)/320⌋ + 1 = 208 frames → XLS-R final layer (B, 208, 1024).
  - Biggest gap: 23.8–38.6 s is dead while "only its final layer" and "frozen or fine-tuned" are spoken. "Repeated to fill it" (5.7 s) has no picture.
- **m_inproj (50.2 s)**
  - Viewer understands: the 208×1024 → 208×128 Linear (weight (128, 1024)), RMSNorm, and SiLU with its −0.28 dip.
  - Biggest gap: RMSNorm at 17.1–30.8 s shows before/after bars that look almost identical. No RMS reference line and no learned g are drawn. 37.8–50 s holds the SiLU plot for 12 s.
- **m_stream (67.4 s)**
  - Viewer understands: the pre-norm wrapper `residual = h + residual; h = mixer(RMSNorm(residual))`, the 6-block order, and MamBo-3 / N = 3.
  - Biggest gap: the green residual line carries no (B, 208, 128) label. The MamBo-1/2/4 list (55.0–67.4 s) is small grey text on a 12 s hold.
- **m_ssm (123.4 s)**
  - Viewer understands: T² vs T cost, h_t = a·h_{t−1} + b·x_t with real values, input-dependent Δ, a 64×64 head state, and y = Mx lower-triangular.
  - Biggest gap:
    - 62.8–93.6 s: "per head" and x_t (64) arrive before the viewer knows what an SSM head is or where 64 comes from.
    - 95.8 s: the causal label is 18 s early.
    - 108–123 s is dead.
    - "state space duality" is never written.
- **m_hydra (61.5 s)**
  - Viewer understands: forward plus backward scan, the lower/upper/diagonal quasiseparable matrix, and the stacking into (2B, 208, 256).
  - Biggest gap: 14.8–30.8 s explains `shift` and `D·x` only in words; the 14-frame row never shows a one-step shift. 51.3 s introduces 256 before its origin (expand 2 × 128) is shown. The beat runs at 180 wpm.
- **m_hshapes (117.8 s)**
  - Viewer understands: a correct list of shapes, read rather than seen.
  - Biggest gap: no tensor is drawn for the whole scene (21–75 s splits and reshapes are text rows). 256 at 10 s and B/C (2B, 208, 64) at 76.7 s are never written. 81–101 s runs at 184 wpm.
- **m_swiglu (43.7 s)**
  - Viewer understands: 128 → 682 → split 341/341 → SiLU(gate) ⊙ value → 341 → 128, and ⌊8·128/3⌋ = 341 with 130,944 + 128 parameters.
  - Biggest gap: 17.2–42.5 s the formula overlaps "gate 341". There is no ⊙ node where the arrows meet. The (B, 208, 128) line appears only at 31.0 s.
- **m_mha (71.8 s)**
  - Viewer understands: in_proj into q|k|v 128 each, the causal 4-frame conv sweeping time (16.8–28 s, the best motion in the episode), and scores (B, 4, 208, 208).
  - Biggest gap: scores × V, concatenating 4 × 32 heads back to 128, and out_proj are never drawn, and the out_proj label is 13 s early. 50.5–71.8 s is two static text cards, with the parameter line in tiny grey mono.
- **m_stack (30.8 s)**
  - Viewer understands: a 5 × 6 grid of 30 blocks, 743,076 × 5 = 3,715,380, and the final RMSNorm → (B, 208, 128).
  - Biggest gap: "743 thousand" is spoken at 3.3 s but written at 9.9 s. 21.8–30.8 s is a hold.
- **m_pool (50.2 s)**
  - Viewer understands: one score per frame, softmax weights that sum to 1, the `weights (B,1,208) @ frames (B,208,128)` formula, and the head 128 → 2.
  - Biggest gap: 28.5–37.7 s, the moment the time axis disappears is only a formula; the frames never merge into one (B, 128) vector. 341 is never shown. The title overlaps the strip at 0–1.5 s.
- **m_train (54.1 s)**
  - Viewer understands: focal vs cross-entropy (p = 0.9: 0.105 vs 0.001), α = [0.1, 0.9], and the hyperparameter table.
  - Biggest gap: 42–54 s is a static table. Rows appear ahead of narration (augmentation at 32.7 s, spoken at 41.7 s). RawBoost is named and never explained.
- **m_code (44.8 s)**
  - Viewer understands: the replica trace reproduces every shape and 319,373,323 vs the paper's 319.37 M.
  - Biggest gap: 7.8–14.6 s only 2 lines are visible while narration runs ahead. The mono text is small and the header dim. The FFN is labelled "mlp:" here but "SwiGLU" everywhere else.
- **m_recap (73.6 s)**
  - Viewer understands: a step/shape table, and the three-model comparison (315.4 M / 447 K / 3.93 M).
  - Biggest gap:
    - The cards appear at 39–43 s before they are discussed, and none is highlighted as spoken.
    - 50.6–68.4 s is dead.
    - The XLS-R and AASIST cards say (B, 201, 1024) while this whole episode used 208, unexplained.

## 4. Factual check (against the replica ground truth)

| Item | On screen / spoken | Ground truth | OK? |
|---|---|---|---|
| XLS-R output | (B, 208, 1024); trace (2, 208, 1024) | (2, 208, 1024) | ✓ |
| Frame count | ⌊(66800 − 400)/320⌋ + 1 = 208 | 208 | ✓ |
| input_proj | Linear 1024 → 128, RMSNorm, SiLU → (B, 208, 128) | (2, 208, 128) | ✓ |
| hydra.in_proj | 128 → 776 = z 256 + xBC 512 + Δ 8 | (2, 208, 776) | ✓ |
| hydra.conv1d | depthwise k = 7 → (B, 208, 512) | (2, 208, 512) | ✓ |
| hydra.x | (2B, 208, 4, 64); trace (4, 208, 4, 64) | (4, 208, 4, 64) | ✓ |
| hydra.B / C | spoken only "2B × 208 × 64"; per step B_t, C_t (64) | (4, 208, 64), state 64 | ✓ spoken, **not written** |
| hydra.out | out_proj 256 → 128 → (B, 208, 128) | (2, 208, 128) | ✓ |
| SwiGLU | 682 → 341 / 341 → 128 | gate/value (2, 208, 341) | ✓ |
| mha.in_proj | q 128 · k 128 · v 128; HUD B × 208 × 384 | (2, 208, 384) | ✓ |
| mha.scores | (B, 4, 208, 208), 4 heads × 32 | (2, 4, 208, 208) | ✓ |
| After 30 blocks + final RMSNorm | (B, 208, 128); 5 × [3 Hydra, SwiGLU, MHA, SwiGLU] | (2, 208, 128), 30 blocks | ✓ |
| Pool scores / weights | (B, 208) in HUD; weights (B, 1, 208) | (2, 208) / (2, 1, 208) | ✓ |
| Pooled / logits | (B, 128) / (B, 2) | (2, 128) / (2, 2) | ✓ |
| Hydra block params | spoken "about 138 thousand"; written 137,612 (only in `m_mha` footer) | 137,612 | ✓ (not written in its own scene) |
| SwiGLU params | 130,944 (+128 norm) = 131,072 | 131,072 | ✓ |
| MHA params | 68,096 | 68,096 | ✓ |
| One layer | 743,076 | 743,076 | ✓ |
| Back-end | 3,934,603 / 3.93 M | 3.93 M | ✓ |
| With XLS-R | 319,373,323 vs paper 319.37 M | 319.37 M | ✓ |
| Paper / config / EER | Ng et al., Findings of ACL 2026; MamBo-3-Hydra-N3; 0.81 % 2021 LA | same | ✓ |

Not verifiable from the ground truth: 1.70 % (2021 DF), 4.97 % (In-the-Wild), AASIST 447 K, and the training hyperparameters. They look plausible.

Wrong or misleading:
- **m_pool 40.0–49.1 s:** the narration says "two logits", but the head shows **0.10 / 0.90**, which are softmax probabilities. Label them "softmax(logits)" or show logit values.
- **m_recap 39–68 s:** the XLS-R and AASIST cards show **(B, 201, 1024)** "per 4 s", but this episode used 208 frames for 4.175 s. That is correct for the ep. 1–2 crop (64,600 samples) but reads as a contradiction here.
- **m_intro 12.3 s:** the counter briefly shows an EER of **0.67 %**.
- **m_overview / m_code:** the same block is called "MLP" or "mlp:" and "SwiGLU" in different places.

## 5. Ten worst problems (worst first)

1. **m_hshapes 0–117.8 s: the hardest block in the series is a text table.**
   - Fix: draw a horizontal (B, 208, 776) slab, with time across and features down, and annotate it as follows:
     - 23.3–34.4 s: cut its feature axis into three coloured bands, lavender z 256, grey xBC 512 and a thin Δ 8, each lighting up on its word (25.6 / 30.0 / 32.2 s).
     - 36.7 s: move the xBC band forward and sweep a 7-frame window along time over it (reuse the `m_mha` 16.8 s conv window).
     - 50.0 s: split 512 into x 256 | B_fwd 64 | C_fwd 64 | B_bwd 64 | C_bwd 64.
     - 61.1 s: reuse the `m_hydra` 51.3 s stacking picture.
     - 70.0 s: fold the 256 band into 4 pink-bordered blocks of 64.
   - Keep the ledger as a narrow column on the right that ticks each row as it lands.
2. **m_hshapes 10.0–14.4 s and 76.7–81 s: spoken shapes never written.**
   - At 10.0 s add a chip under the input row: "expand 2 → inner width E = 256" in lavender.
   - At 76.7 s add a row "B, C (2B, 208, 64), shared by all 4 heads", with 64 in yellow (S).
   - At 110.0 s write "137,612 params", with the in_proj (128 × 776 ≈ 99 k) and out_proj (256 × 128 ≈ 33 k) shares.
3. **m_pool 28.5–37.7 s: the time axis disappears without a picture.**
   - Multiply each frame column by its gold weight, so the column brightness scales.
   - Then slide all 28 columns into one centre column labelled (B, 128) while "frames (208)" fades out.
   - At 10.3–19.4 s draw the per-frame 128 → 341 gate/value → 1 score path as small bars, with 341 written.
4. **m_ssm 62.8–93.6 s: SSM "heads" used before they are explained.**
   - At 76.0 s, before the 64×64 state, show the 256-wide x of one frame (lavender E) splitting into 4 heads × 64 (purple H, pink P), and highlight head 1.
   - Then grow it into the H matrix with x_t (64) as its column.
   - Change "Δ step size (one per head)" at 62.8 s to read "one per head (4 heads, next)".
5. **m_ssm 95.8–123.2 s: labels early, then a 15 s dead tail.**
   - Reveal "lower-triangular: causal" at 113.5 s, not 95.8 s.
   - At 115.7 s write "state space duality (SSD)" over the triangle and bring back the small attention-arcs row from 3.3 s beside it, with a ≈ sign.
   - Either speak the "masked attention / never built / T steps" paragraph or cut it.
   - Trim the hold to ≤ 3 s.
6. **m_hydra 14.8–30.8 s: shift, SS and D·x only in words.**
   - On the 14-frame row, run the forward scan output and nudge it one box right: frame t now holds the state up to t − 1, so draw an empty slot at frame 0.
   - Do the mirror for the backward row, nudged one box left.
   - Drop a yellow D·x dot onto frame t at 23.9 s.
   - Label `SS` as "selective scan (ch. 5)" in the formula, and enlarge the grey caption to ≥ 22 px.
7. **m_recap 39–68.4 s: cards early, no highlight, 17.8 s dead, 201 vs 208.**
   - Bring the cards in one at a time on their sentences: XLS-R at 41.2 s, AASIST at 47.9 s, MamBo at 52.4 s.
   - In each back-end card, draw a thin time bar that stays full-length until a "pool" tick at the right end, and show the caption at 61.3 s.
   - Add a footnote: "201 frames = 64,600-sample crop (ep. 1–2); 208 = 66,800 (this ep.)".
8. **Pacing hot spots.** The `m_hshapes` beat at ≈ 81–101 s runs 184 wpm and the `m_hydra` beat at ≈ 49–61 s runs 180 wpm; `m_ssm` 38.6–58 s packs six ideas.
   - Split the `m_hshapes` beat at "We're back to B by 208 by 256", with a 1.5 s hold.
   - Move "a gain for each head that is itself computed from x" into its own beat with a small x → Linear → D(4) picture.
   - In `m_ssm`, insert a 2 s hold after the decay formula (38.6 s) before Δ is introduced at 43.0 s.
9. **Overlaps.**
   - `m_swiglu` 17.2–42.5 s: move `SiLU(gate) ⊙ value` to where the two arrows meet, as a drawn ⊙ node, clear of "gate 341".
   - `m_pool` 0–1.5 s: start the frame strip after the title card clears (`cut-11`).
   - `m_ssm` 45.2 s: put "small Δ: keep memory" to the right of the curve's top with a leader line.
   - `m_mha` 48.3 s: cross-fade HUD chips in place instead of stacking them.
10. **Dead stretches where narration moves on.**
    - `m_front` 23.8–38.6 s: at 33.1 s, toggle a snowflake / flame badge on the XLS-R box for "frozen or fine-tuned", and highlight the last of 24 layer ticks for "final layer only".
    - `m_overview` 4.5–16.7 s: animate the waveform box shrinking into a 208-column strip under the XLS-R box.
    - `m_mha` 59.8–71.8 s: highlight the "global retrieval" card and draw an arc from one frame to a far frame on a small strip.
    - `m_train` 42–54 s: shorten the hold to ≤ 4 s.

## Also worth fixing

- `m_mha` 43.8 s: draw scores (208×208) × V (208×32) → 208×32 per head, then the 4 heads concatenated → 128 → out_proj. Show `out_proj 128 → 128` at 43.8 s, not 30.3 s.
- `m_overview` 47.4 s: keep the HUD at (B, 208, 128) → (B, 128) through the pool sentence, and reach B × 2 only on "two logits". Remove the SwiGLU → Pool → Head label flicker (`motion-01` b3).
- `m_overview`: enlarge the 18 px box subtitles to ≥ 22 px. Rename "MLP" to "SwiGLU" in the overview box and in the `m_code` trace ("mlp:").
- `m_intro` 12.3 s: start the EER counter at 0.81 % (no count-up through 0.67 %). Have the narration name the three stats, or show them only in `m_overview`.
- `m_intro` 41–50 s: the S/E/H/P letters are introduced and never used again. Either put the letters on the HUD chips (e.g. "H 4 · P 64"), or drop the letters and keep the colours.
- `m_pool` 40.0–49.1 s: relabel 0.10 / 0.90 as "softmax → p", or show the actual two logits.
- `m_ssm` 20.9–36.4 s: add the y = c·h row under the h row so both equations are shown. Enlarge formula subscripts (H_t, B_tᵀ, Δ_j), which are near-invisible.
- `m_inproj` 17.1–30.8 s: draw a horizontal RMS = 1.33 line on the left panel and a 1.0 line on the right, and show g as a learned per-feature multiplier.
- `m_stream`: label the green residual line "(B, 208, 128)". Raise the MamBo-1/2/4 descriptions from grey to body contrast.
- `m_stack` 3.3 s: show 743,076 on the narration word, or reorder so the grid builds first.
- `m_train`: reveal each hyperparameter row on its phrase. Give RawBoost a one-line gloss ("random filtering and noise on the raw waveform").
- `m_code`: add the missing trace lines `hydra: B, C (4, 208, 64)` and `mha: in_proj (2, 208, 384)`, enlarge the mono text, and brighten the `$ python …` header.
- `m_front` 5.7 s: show the short clip tiling to 66,800 samples for "repeated to fill it".
- `m_hydra` 51.3 s: say or write where 256 comes from (2 × 128) before the stacking shape uses it.
- `m_recap` 1.1–3.3 s: the table header appears with no rows for about 2 s. Start the first row with it.
