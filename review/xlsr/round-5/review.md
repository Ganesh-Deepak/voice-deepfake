# Review: episode 1, "XLS-R 300M" (round 5)

Reviewer: fresh context. I watched only `review/xlsr/round-5/` (all 18 storyboards, all 18 motion strips, all 17 cut strips, metrics.md) against `tools/review/rubric.md`.
Persona: knows some Python, has never seen wav2vec 2.0 or XLS-R.
Times are scene-local storyboard stamps. Absolute times are in brackets where the metrics use them.
Scene starts (absolute s): x_intro 0, overview 63.2, tensors 169.1, audio 238.9, conv 330.3, encoder 479.1, projection 655.3, masking 795.0, posconv 852.8, attn 972.2, mha 1073.8, x_layer 1210.5, outputs 1313.1, code 1398.8, quant 1469.2, contrast 1568.4, deepfake 1655.4, recap 1797.4 (end 1892.5 = 31.54 min).

---

## 1. Defects

| # | Defect | Result | Evidence (file, time) |
|---|---|---|---|
| E1 | Narration describes what is not on screen / shown much earlier or later | **FAIL** → Sync ≤ 6 | `storyboard-05-encoder` 131.0–137.6 s [≈610–617 s]: the frame is **completely empty** while the narration says "There's also normalization, and here XLS-R differs from the original wav2vec 2.0 base model". The GroupNorm/LayerNorm comparison only arrives at 139.9 s. `storyboard-08-posconv` 16.6–25.4 s: the narration says the convolution is "sliding along the time axis", but the screen shows a static yellow kernel box over empty space. Nothing slides until the output counter starts at 47.5 s, about 30 s later. Smaller lags: projection 67.7 s "Collect all the weights into a matrix", matrix appears at 69.9 s. Audio 36.8 s: blank frame under "one second of audio is a vector of 16,000 numbers". Conv 63.3 s: "One kernel detects one kind of pattern" plays over a bare input strip. |
| E2 | Spoken shape not written, or unreadable | PASS | Every spoken shape is written, inline and in the HUD capsule. Conv 87.7–98.8 s shows (B,16000) → x[:, None] → (B,1,16000) → (B,512,3199) and weight (512,1,10). Mha 29.8 s shows q.view(B,49,16,64), and 58.4 s shows scores (B,16,49,49). Outputs 37.2 s shows (25,B,49,1024). Deepfake 94.3 s shows (B,201,1024). The six sub-20 px items in metrics.md are not spoken shapes. |
| E3 | Transformation without clear before → after axis | PASS (borderline) | Each transpose or reshape has a written before → after: projection 10.0 s, mha 29.8/36.4/87.1 s, posconv 34.3/49.7 s, quant 60.6 s. The exception is close to a fail. At posconv 34.3–56.4 s the text says (B,49,1024) → (B,1024,49), but the grid on screen does not change (it was already drawn channels-as-rows), and the HUD keeps showing **B · 49 · 1024** for about 22 s. See problems 3 and 6. |
| E4 | Concept used before explained, or explained in one sentence with no picture | **FAIL** → Clarity ≤ 6 | `storyboard-08-posconv` 103–119 s [≈956–972 s]: the point of the scene is "because this positional signal comes from a convolution, rather than a fixed table of positions, it's relative … works for clips of any length". It gets one text box and no picture. "Fixed table of positions" is never shown, and nothing demonstrates that two identical frames at different positions now differ. Also `storyboard-14-quant` ≈60–67 s: "temperature τ annealed" (18 px) is never explained. κ is only explained later, in contrast. |
| E5 | > ~3 new ideas or numbers in 10 s, beat > 175 wpm, or meaningful text shown too briefly | **FAIL** → Pacing ≤ 6 | `storyboard-14-quant` ≈45–67 s [≈1514–1536 s] crams Linear 512→640, 640 scores per frame, two groups of 320, reshape (B,49,2,320), argmax per group, 384-wide codebook entries, Gumbel softmax with one-hot forward and smooth backward, and "τ annealed" into about 20 s, in one frame. Metrics: the third conv window equation "−0.3×(1) + −0.8×(0) + −0.2×(−1) =" is on screen 2.25 s but needs 3.6 s. Encoder 45–52 s reads out 799 → 399 → 199 → 99 → 49 in about 7 s while the formula box flashes. Beat wpm peaks at 165 (encoder b0), so the 175-wpm rule is not triggered. |
| E6 | Camera move or 3-D while text must be read | PASS | The 3-D stacks (mha 36–47 s, x_layer FFN 30–59 s and ×24 stack 85–101 s, outputs 25–62 s, intro slabs) are static oblique views with flat, upright labels. There are no camera moves. |
| E7 | Text overlap / clipping by frame or HUD | PASS | No overlaps or edge clipping in settled frames. Only transitional ghosts, e.g. a faint "Z (unmasked)" label at quant 16.5 s before its grid is drawn. |
| E8 | Dead stretch > 6 s while narration moves on, or cluttered frame | **FAIL** → Clarity ≤ 6 | Encoder 131.0–137.6 s: empty frame for about 7 s. Mha 118–127 s [≈1192–1201 s]: near-empty frame, just a ~25 px 49×49 square bottom-left, under "Note the cost…". Posconv 103–119 s: about 16 s with only one text box added under two sentences. Contrast 52–65 s [≈1620–1634 s]: a large dark panel, about 60 % empty, holding two lines of text. Metrics lists 88 static stretches ≥ 6 s. Many are deliberate holds on a finished result, but the four above are real dead time. |
| E9 | Pop-in, jitter, broken-looking motion | PASS (borderline) | Nothing pops in fully formed and nothing jitters (no hectic stretches). Two weak spots. Most sub-beat changes fade the whole picture to the empty background for 0.3–1 s before the next drawing fades in (motion-04 b5, motion-05 b5/b7/b8, motion-06 b2/b3/b5, motion-08 b1/b3, motion-10 b2–b7, motion-11 b4, motion-12 b1/b3). The projection transpose at 7.8 s sprays cells diagonally off the grid, with no labels mid-flight. |

---

## 2. Scorecard

| Dimension | Weight | Score | Cap | Weighted | Basis |
|---|---|---|---|---|---|
| Concept clarity | ×3 | **6** | ≤ 6 (E4, E8) | 18 | Uncapped I'd give 7. Conv, encoder, projection, attention and x_layer build cleanly from earlier scenes. Posconv's "why", quant's Gumbel step and the encoder's normalization intro do not. |
| Tensor-shape legibility | ×2 | **7** | none | 14 | Strong. A colour-coded HUD capsule is always present (B green, T blue, C orange, H purple), and changes are boxed ("only C changed", "inner sizes match → they disappear", projection 107–138 s). It is held below 8 because the posconv HUD shows the wrong shape for about 22 s and the 49×1024 tensor flips orientation between projection, masking and posconv without comment. |
| Narration–visual sync | ×2 | **6** | ≤ 6 (E1) | 12 | Uncapped 8. Reveals are often word-accurate: the conv L_out formula (`storyboard-04-conv` 41–54 s), encoder table rows (`storyboard-05-encoder` 9.9–51.8 s), and Q/K/V on "query / key / value" (`storyboard-09-attn` 23–28 s). The cap comes from the encoder norm intro and the posconv "sliding" claim. |
| Pacing | ×2 | **6** | ≤ 6 (E5) | 12 | Beats sit at 111–165 wpm, but speech-only rate reaches 188–192 wpm in tensors and attn. There are long static holds (88 flagged) and overloaded pockets (quant). At 31.5 min the episode is long for its content. |
| Motion quality | ×1 | **6** | none | 6 | Some motion does explain: the conv kernel slides, the multi-channel window slides, encoder bars shrink, the posconv output counter runs, projection rows pass through "same W". But the key shape operations (mha split, transpose and merge; posconv transpose) are fade-cuts through an empty frame, and the intro 3-D slabs are decorative. |
| Visual polish | ×1 | **6** | none | 6 | The style is consistent and the hierarchy clear. Against that: many dim gray fine-print lines carry real facts at roughly 15–18 px (1080p estimate), large empty areas (attn bottom half, contrast panel, mha cost frame, deepfake 12–25 s right half), a mismatched code tag in conv, and a "07/07 Output" stage label on the pre-training contrast scene. |

**Raw weighted sum: 68 / 110.** The rubric's weights add up to 110, not 100.
**Scaled to 100: 68 × 100/110 = 61.8 / 100.**
**Verdict: < 70, so rework the failing scenes** (posconv, encoder 109–140 s, quant, mha transitions, contrast mid-section). Without the caps the score would be 75/110 = 68.2/100, which still misses "ship after fixes".

---

## 3. Per scene (what a viewer understands after it, and the biggest gap)

- **x_intro 0–63 s:** XLS-R is wav2vec 2.0 scaled up: 315.4 M weights, 24 layers, 1024 hidden, 16 heads, 436K h of audio in 128 languages, used as a deepfake front end. *Gap:* 12–19 s holds a decorative grid → 3-D slab stack whose implied tensor is never named (metrics: 8.2 s static).
- **overview 63–169 s:** The pipeline with a shape under every box: (B,16000) → (B,512,49) → (B,49,1024) → context vectors, plus the pre-training branch and the 4 s → 201-frame detector crop. *Gap:* the transpose is spoken around 85 s but has no box in the pipeline. Several 8–12 s holds (metrics 66 s/11 s, 85.75 s/12.5 s).
- **tensors 169–239 s:** Scalar → vector → matrix → 3-D, and the B/T/C/H colour code. "Linear changes only C" is boxed. *Gap:* the 3-D (3,3,5) cube's cells are small, and "Most operations…" appears about 2 s before it is spoken (57.4 vs 59.7 s).
- **audio 239–330 s:** 16 kHz samples, a clip as 16,000 numbers, batching to (B,16000), per-clip normalization, raw waveform instead of a spectrogram. *Gap:* blank frame at 36.8 s under the key "vector of 16,000 numbers" sentence. The time-axis ticks and "B = 1 → (1, 16000)" are tiny gray. The zoom box covers about 480 samples, but the inset shows about 40 dots.
- **conv 330–479 s:** The best scene. A toy convolution worked by hand (−0.7, 1.2, −0.1, −0.9), L_out = ⌊(L−k)/s⌋+1 synced word by word, kernels → channels, (B,1,16000) → (B,512,3199), and multi-input-channel kernels 512×3 (786,432 weights). *Gap:* the header tag reads `nn.Conv1d(1, 512, kernel_size=10, stride=5)` throughout the k=3, s=2 toy (3–61 s). The third window's equation is on screen only 2.25 s.
- **encoder 479–655 s:** The viewer can derive 16000 → 3199 → 1599 → 799 → 399 → 199 → 99 → 49, total stride 320 = 20 ms, receptive field 400 = 25 ms, GELU, GroupNorm (base) vs per-frame LayerNorm (XLS-R), and 4.2 M weights. *Gap:* 131.0–137.6 s is an empty frame under the normalization intro. The 45–52 s countdown reads 4–5 numbers in about 7 s.
- **projection 655–795 s:** Transpose to (B,49,512), per-frame LayerNorm, a linear layer built from a 4-in/3-out network up to 49×512 @ 512×1024, "only the last axis changes", 525,312 weights, and PyTorch storing (1024,512). *Gap:* the transpose at 7.8 s sprays cells off the grid. The matrix arrives 2 s after "collect the weights into a matrix". 54.3 s is an empty frame.
- **masking 795–853 s:** Start probability 0.065, span 10, overlapping spans, one learned vector m in place of masked frames, 26/49 masked (≈49 % on average), "predict the gap", shape unchanged. *Gap:* the tensor is now drawn 1024 rows × 49 columns, the opposite of projection's frames-as-rows, with no comment. "m ∈ ℝ1024" is missing its superscript.
- **posconv 853–972 s:** Attention ignores order. A 128-frame grouped convolution (8.39 M instead of 134.2 M) with 64-frame padding, trimming 50 → 49, GELU and a residual adds position information. *Gap:* the viewer cannot say **how** this gives position (103–119 s is a single text box). The kernel box sits over empty space for about 20 s before padding is explained. The transpose changes nothing on screen, and the HUD stays B·49·1024.
- **attn 972–1074 s:** A fully worked toy: Q/K/V, q₁·k₃ = 0.92, the 4×4 score grid, ÷√d (toy 1.41, XLS-R 8), softmax rows summing to 1, out₁ = [1.23, 0.45]. All numbers check out. *Gap:* W_Q/W_K/W_V appear only as dashed "learned 2×2" boxes, so the viewer cannot see where Q's numbers come from. The bottom half of the frame stays empty, and dimmed low-weight cells are hard to read.
- **mha 1074–1210 s:** Real shapes: (B,49,1024) → (B,49,16,64) → (B,16,49,64) → scores (B,16,49,49) → (B,16,49,64) → (B,49,1024), then W_O and 4.2 M weights per layer. Cost ∝ T² (2,401 vs 40,401 scores per head). *Gap:* the split, transpose and merge are fade-cuts, so the 1024 columns are never seen becoming 16 slabs (motion-10 b2–b7). 118–127 s is a near-empty frame.
- **x_layer 1210–1313 s:** A pre-norm block on a residual stream: x = x + Attn(LN(x)), x = x + FFN(LN(x)), FFN 1024 → 4096 → 1024 per frame, 12,596,224 weights per layer, ×24 = 302 M (96 %). *Gap:* the FFN slabs are 3-D with small chips. Otherwise clear.
- **outputs 1313–1399 s:** last_hidden_state = LN(layer 24) is (B,49,1024). The 25 hidden_states stack to (25,B,49,1024). Lower layers are acoustic, higher layers abstract. The parameter bar totals 315,438,720. *Gap:* the transformers 4.x/5.x caveat and the "bars leave out 3,072" note are dim gray at roughly 15–18 px. 21.4 s is a near-empty frame, and the h₀/h₁₂/h₂₄ tags are tiny.
- **code 1399–1469 s:** Ties every shape to a Hugging Face attribute: extract_features (2,49,512), last_hidden_state (2,49,1024), 25 hidden states, conv0 (512,1,10), projection (1024,512), 315,438,720. *Gap:* a 14.8 s static hold at the end (metrics 1454 s).
- **quant 1469–1568 s:** Targets come from the audio itself. Z (B,49,512) → 640 scores → 2 × 320 → one pick per group → concatenate 768 → q (B,49,768), giving 102,400 combinations. *Gap:* 45–67 s is overloaded, the Gumbel step gets one sentence, and τ is never explained.
- **contrast 1568–1655 s:** c_t (1024 → 768) must pick the true q_t among 1 + 100 distractors, using cosine similarity, a softmax with κ = 0.1, the loss, and diversity loss ×0.1. *Gap:* 52–65 s replaces the loss with a near-empty panel of two text lines. The HUD stage label reads "07/07 Output" in a pre-training scene.
- **deepfake 1655–1797 s:** Mean over T → Linear 1024→2 → softmax → weighted CE (0.1/0.9), an optional learned layer weighting over the 25 states, SSL-AASIST (64,600 samples → (B,201,1024) → Linear 1024→128 → AASIST), padding with attention_mask and a masked mean. *Gap:* the "spoof 0 / bona fide 1" class labels and the batch-weight line are about 15 px. 12–25 s leaves two-thirds of the frame empty. The HUD seems to show (B,1024) at 14.4 s, before the mean is drawn.
- **recap 1797–1892 s:** A full shape table built row by row in sync, plus the frame formula (16000 → 49, 64600 → 201). *Gap:* the table is dense and its text small. Acceptable for a recap.

---

## 4. Factual check (against the supplied transformers 5.21 ground truth)

All numbers on screen match:
- **Conv lengths:** 16000 → 3199/1599/799/399/199/99/49; 64,600 → 201 (frames = ⌊(n−400)/320⌋+1).
- **Feature encoder:** conv0 (512,1,10) with bias. LayerNorm(512) after every conv, before GELU. 4.21 M weights.
- **Projection:** (1024,512), 525,312 weights in the bar. With its LayerNorm this is the 526,336 in the ground truth, and the 0.53 M bar is consistent.
- **Positional conv:** kernel 128, padding 64, groups 16, weight (1024,64,128), trim the last frame, 8.39 M. No LayerNorm after it, which is correct for the stable-layer-norm variant.
- **Attention:** 4 × (1024² + 1024) = 4,198,400. Heads 16 × 64, √64 = 8.
- **Shapes:** scores (B,16,49,49); 201² = 40,401.
- **FFN:** 1024 → 4096 → 1024, 8,393,728. LNs 4,096. One layer 12,596,224. ×24 = 302,309,376.
- **Total:** 315,438,720. The bars omit 3,072 = final LN 2,048 + mask 1,024, which is correct.
- **Masking:** p = 0.065, M = 10, ≈49 % masked, learned mask vector of 1024.
- **Quantizer:** 512 → 640, 2 × 320 × 384, concat 768, project_q 768 → 768, project_hid 1024 → 768. 100 distractors from the same clip. κ = 0.1, diversity weight 0.1.
- **Hidden states:** last_hidden_state = final LN(output of layer 24). hidden_states[0] is the input to layer 1, after the positional conv. The 4.x caveat is stated correctly.
- **Attention toy:** I recomputed it and every value checks out (scores 3.56/3.53/0.92/−0.25, ÷√2, softmax 0.46/0.44/0.07/0.03, out₁ = [1.23, 0.45]). The conv toy and the softmax example [2,1,0.1] → [0.66,0.24,0.10] also check out.

I found **no factual errors**. Three precision issues:
- Conv header tag `kernel_size=10, stride=5` shown during the k=3, s=2 toy.
- Posconv HUD shows B·49·1024 while the tensor is (B,1024,49).
- "Layer-wise studies find lower and middle layers most useful" (outputs 53 s) cannot be checked against the supplied ground truth. It is plausible, but it is presented without a source.

---

## 5. Ten worst problems (worst first), with fixes

1. **posconv 103–119 s [≈956–972 s]: the scene never shows why a convolution gives position (E4).** One text box carries the scene's whole purpose.
   *Fix:* take two frames with identical content at different positions, e.g. frame 3 next to the zero padding and frame 30 in the middle. Run both through the kernel and show that they receive different added vectors because their neighbourhoods differ. Then show a fixed position table (rows 0…48 added by index) for contrast, and say "relative" over that picture.
2. **encoder 131.0–137.6 s [≈610–617 s]: empty frame for about 7 s under "There's also normalization, and here XLS-R differs…" (E1/E8).**
   *Fix:* bring in the two-panel GroupNorm | LayerNorm layout at 131 s, with headers "wav2vec 2.0 base" | "XLS-R", so the sentence lands on the comparison. Or cut the GELU → norm fade gap to under 0.5 s and move the sentence onto the panel.
3. **posconv 16.6–56.4 s: kernel, padding and sliding are out of order, and the HUD shows the wrong shape (E1, near-E3).** The 128-frame box is drawn 2.6× wider than the 49 real frames, over empty space. "Sliding along the time axis" is said at 16.6 s, padding appears at 40.9 s, and sliding (the output counter) at 47.5 s. The HUD stays B·49·1024 through the transposed section.
   *Fix:* show the 64-zero padding first, then sweep the kernel box left to right while the output counter ticks during the "sliding" sentence. Switch the HUD to B·1024·49 on the transpose and back at 49.7 s.
4. **quant ≈45–67 s [≈1514–1536 s]: too many new ideas in one crowded frame (E5).** Linear 512→640, 2 × 320 groups, (B,49,2,320), argmax, 384-wide entries, Gumbel softmax forward and backward, and "τ annealed" (18 px).
   *Fix:* split it into two beats. (a) Scores → two groups → pick → concatenate to 768 → (B,49,768), with a 2 s hold on (B,49,2,320). (b) A cleared frame showing only the Gumbel softmax: soft bars vs one-hot, a forward arrow and a gradient arrow. Either explain temperature there with one picture (sharp vs flat bars) or drop τ.
5. **mha 20.9–48 s and 82.7–91.5 s: the split, transpose and merge are fade-cuts through an empty frame (motion-10 b2–b7).** The viewer never sees the 1024 columns become 16 head slabs or merge back, which is the core shape idea of the scene.
   *Fix:* slide the 16 labelled column blocks (h1…h16) apart and rotate them into the stack, then run the reverse at 84.9 s. Keep the labels attached throughout.
6. **The 49×1024 tensor flips orientation, and one transpose does nothing on screen.** Projection 118–138 s draws (B,49,1024) as 49 rows × 1024 columns. Masking 3.3 s and posconv 18.8 s draw the same tensor as 1024 rows × 49 columns. Posconv's "transpose to (B,1024,49)" at 34.3 s changes nothing visually. A viewer who just learned "transpose swaps rows and columns" sees a transpose that does nothing.
   *Fix:* keep frames-as-rows through masking and posconv. In posconv, rotate the grid on the transpose as projection does, and rotate it back after the conv.
7. **mha 118–127 s [≈1192–1201 s]: near-empty frame (a ~25 px square bottom-left) under "Note the cost: the score matrix grows with the square of the number of frames" (E8).**
   *Fix:* from 118 s, show the 49×49 and 201×201 squares side by side at a true area ratio (×16.8). Grow the second square while the narration says "square". Add "× 16 heads × 24 layers".
8. **contrast 52–65 s [≈1620–1634 s]: the loss formula is replaced by a large dark panel, about 60 % empty, with two lines of text (E8).**
   *Fix:* keep the loss visible and illustrate "infer from context" on the strip itself. Draw arcs from unmasked frames into c_t, and put example labels (phoneme, speaker, rhythm) over the context frames.
9. **Dim gray fine print carries real facts at roughly 15–18 px (1080p estimate) and low contrast.** Outputs 28–62 s: "In transformers 4.x, h₂₄ comes back after the final LayerNorm…". Outputs 73–85 s: "the bars leave out 3,072…". Deepfake 43–52 s: "spoof 0 / bona fide 1" and "batch average weights spoof 0.1, bona fide 0.9". Audio 81–90 s: the vocoder definition. Plus the metrics' sub-20 px list: encoder "400 samples = 25 ms", quant "temperature τ annealed", contrast HUD "C = PROJECT_HID(H)", deepfake "24 layers · 1024" and "graph attention → score".
   *Fix:* use at least 22 px and contrast of at least 4.5:1. For the 4.x/5.x caveat and the class-index mapping, either promote them to body text or say them in the narration.
10. **Fade-through-empty transitions and long static holds stretch the episode to 31.5 min.** Most sub-beat changes blank the screen for 0.3–1 s (motion-04 b5, 05 b5/b7/b8, 06 b2/b3/b5, 08 b1/b3, 11 b4, 12 b1/b3), and metrics lists 88 static stretches ≥ 6 s (e.g. conv 464.5 s/14.2 s, code 1454 s/14.8 s, deepfake 1696 s/14.2 s).
    *Fix:* carry the shared element into the next layout, e.g. keep the (B,512,49) grid on screen from GELU into the norm comparison, instead of fading out and in. Cap the hold after any result at about 3 s unless the narration is still talking about it.

## 6. Also worth fixing

- conv 3–61 s: change the header tag to "toy: kernel 3, stride 2" until the real layer appears. Hold the third window's equation for at least 3.6 s.
- Close the small blank or late frames: audio 36.8 s, conv 63.3 s, projection 54.3 s, outputs 21.4 s (keep the previous element until the next one draws). Projection W: 69.9 → 67.7 s. Tensors text: 57.4 → 59.7 s.
- projection 7.8 s: the transpose cells fly out to the upper right and back. Move them along straight row-to-column paths so they stay inside the grid area.
- attn 18–28 s: show the 2×2 W_Q/W_K/W_V numbers once, so the viewer can verify one Q entry by hand.
- encoder 109–129 s: the Φ(x) caption wraps and leaves a lone "x." on its own line.
- masking 30–41 s: "m ∈ ℝ1024" → "m ∈ ℝ¹⁰²⁴". The faint column outlines at 3.3–10 s hint at masking before it is explained.
- contrast and deepfake HUD stage label "07/07 Output" is inconsistent with quant's "05/07 Pre-training branch". Label contrast as pre-training.
- deepfake 14.4 s: the HUD appears to show (B,1024) before the mean-over-T step is drawn. Update it when the mean is drawn.
- quant 16.5 s: a ghost "Z (unmasked)" label is visible before its grid draws.
- overview: add a "transpose" box to the pipeline where it is spoken (≈85 s).
- outputs 25–62 s: the h₀/h₁₂/h₂₄ bubble tags on the 3-D stack are tiny. Make them larger and pull them outside the stack.
- x_intro 12–19 s: replace the decorative slab stack with something named (e.g. the HUD capsule's first shape), or shorten it.
- audio 9–35 s: label the zoom scale, or make the inset match the box (~480 samples). Time-axis ticks and "B = 1 → (1, 16000)" need at least 22 px.
- deepfake 12–25 s: the mean-pool section uses one-third of the frame. Center or enlarge it.
- tensors 3-D (3,3,5) cube: cells are small. Enlarge the cube.
