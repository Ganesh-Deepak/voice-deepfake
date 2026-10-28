# Review: XLS-R 300M episode, round 1 (A), compared with wav2vec 2.0 round 0 (B)

Reviewer: fresh context, first-time viewer. I worked only from the storyboards, motion strips, cut strips and B's `metrics.md`. A has no `metrics.md`, so A's words-per-minute figures below are estimates from caption timing in the storyboards. I checked text legibility on native-resolution crops of the storyboard tiles.

Runtime: A is about 21.8 min (sum of the last storyboard timestamps) and B is 27.85 min. A covers a bigger model in 6 fewer minutes. Per scene, A has conv 85 s (B 129 s), encoder 101 s (B 162 s), projection 80 s (B 130 s), MHA 93 s (B 125 s) and pos-conv 76 s (B 101 s).

**Verdict: A scores 52/100 and the failing scenes need rework. B scores 78/100 and could ship after fixes.** A looks more polished in a single still, but it explains less, and its tensor shapes are clearly harder to read than B's. The client is right.

---

## 1. A: defect table

| # | Defect | A | Evidence (file, scene time) |
|---|---|---|---|
| E1 | Narration and picture out of sync | **FAIL** | `storyboard-09-x_attn` 3.3–12.2 s: all four matrices are on screen with numbers about 9 s before Q, K and V are named (12.2/14.4/16.6/18.8 s). `storyboard-00-x_intro` 25.7 s: all six stats appear together, but layers, width and heads are only spoken at 34.7 s. `storyboard-15-x_contrast` 7.7 s: q_t appears about 7 s before "the right answer is q_t" (14.4 s). `storyboard-06-x_project` 57.3 s: the voice says "the inner sizes match, and disappear" and nothing on screen is highlighted or removed. `storyboard-10-x_mha` 28.1 s: the voice says "swap the time and head axes" and the picture does not change. |
| E2 | Shape spoken but unreadable, missing or wrong | **FAIL** | `storyboard-10-x_mha` 61.8–75 s: the merged tensor is tagged **C 64** while the voice says "merge sixteen times sixty-four into 1024" and the HUD shows B·201·1024, so the label is wrong for about 13 s. `storyboard-12-x_stack` 30–64 s: the 25-state stack has no axis labels; (25, B, 201, 1024) exists only as a code line. `storyboard-05-x_encoder` 25.6/88.1 s: the tiny mono tags use a dotted zero that reads as 8 ("T 806" reads "T 886", "(B, 512, 201)" reads "281"). `storyboard-01-x_overview` 61.6–72.8 s: the full-pipeline labels are about one third of normal size. `storyboard-16-x_detect` 12.2 s: "B by 1024" is spoken but never written; there is only a "C 1,024" pill. |
| E3 | Transformation without the changed axis made clear | **FAIL** | `storyboard-10-x_mha` 19.1 s and 28.1 s are identical frames: (B,201,16,64) becomes (B,16,201,64) with no visual change. `storyboard-06-x_project` 70.7 s: "only touches the last axis" has no axis highlight, only a grey line "B and T untouched". `storyboard-08-x_posconv` 21–35 s: the transpose to channels-first appears only in the HUD. `storyboard-14-x_quant` 27.8–45 s: the reshape of 640 scores to (2, 320) appears only in the HUD. |
| E4 | Concept used before it is explained, or one sentence with no picture | **FAIL** | `storyboard-02-x_tensors` 52.2 s: the key rule "most operations change one axis" is spoken over the log-scale panel with no example. `storyboard-08-x_posconv` 5.7 s: shuffle invariance is a red caption over an unchanged block. `storyboard-08-x_posconv` 55.5 s: the residual add shows two slabs side by side with no ⊕ and no arrow. `storyboard-08-x_posconv` 60–76 s: "pre-norm" is used here but only explained in x_layer at 12 s. `storyboard-04-x_conv` 45.3 s: the scene jumps from one toy kernel to a 512-channel 3-D slab with no few-kernels step. |
| E5 | Over 3 numbers in 10 s, over 175 wpm, or text shown too briefly | **FAIL** | `storyboard-05-x_encoder` 23.4–34.6 s: six layer lengths in one roughly 12 s sentence. `storyboard-13-x_budget` 3.5–16 s: four parameter counts in one 41-word sentence, about 180 wpm (estimated). `storyboard-00-x_intro` 25.7 s: six stats appear at once. (No metrics.md for A, so wpm is not measured.) |
| E6 | Camera or 3-D perspective while text must be read | **FAIL** | `storyboard-01-x_overview` 61.6–72.8 s: the camera pulls back until labels are unreadable. `motion-01-x_overview` b2/b4: a pan cuts the waveform and labels off at the left edge, and the layer stack rotates. `storyboard-10-x_mha` 19–75 s: the head slab is in perspective, and at 61.8 s it is edge-on, a sliver. `storyboard-07-x_mask`: the whole scene is a skewed trapezoid. `storyboard-02-x_tensors` 16.7–41 s: after a pan, the matrix sits cut off at the left edge. `motion-04-x_conv` b3/b4: the 3-D rod and the slab turn. |
| E7 | Text over text or shapes, or content cut off | **FAIL** | `storyboard-00-x_intro` 45.9 s: concept pills drawn over "315.4 M / 24 / 1,024". `storyboard-01-x_overview` 63.8 s: "pre-training only" over "targets q" and "contrastive loss". `storyboard-02-x_tensors` 5.6 s: vector numbers overflow their cubes ("0.42-0.170.88"). `storyboard-04-x_conv` 1.1 s and `storyboard-09-x_attn` 1.1 s (also `cut-04`, `cut-09`): chapter titles printed over live content. `storyboard-05-x_encoder` 88.1 s: weights panel over the T 403/T 201 tags. `storyboard-08-x_posconv` 37.4 s: panel over the 3-D block. `storyboard-14-x_quant` 30–45 s: histograms over codebook 1 and its K 320 tag, and the B pill over "Linear 512 → 640". `storyboard-10-x_mha` 5.6 s: K covers Q. `storyboard-10-x_mha` 61.8 s: two captions cross-fade on top of each other. `storyboard-15-x_contrast` 43.1 s: diversity panel over "88 more distractors". `storyboard-15-x_contrast` 60.8 s: "codebook574,080". `storyboard-16-x_detect` 41.2 s: "66,800 sampl201". |
| E8 | Dead stretch over 6 s, or cluttered frame | **FAIL** | `storyboard-08-x_posconv` 7.9–19.2 s (static block) and 60–76 s (static block plus a grey note). `storyboard-06-x_project` 59.5–79.7 s: 20 s of the same frame. `storyboard-14-x_quant` 5.6–18.9 s. `storyboard-11-x_layer` 3.3–14.3 s: a bare vertical line while "complete layer" and "pre-norm" are spoken. `storyboard-16-x_detect` 65.6–81 s. Clutter: `storyboard-16-x_detect` 36.7–45.6 s, three back-ends crammed into the top-left third. |
| E9 | Pop-in, jitter, broken motion | **FAIL** | `motion-10-x_mha` b2 +0.50 → +0.62: the 201×201×16 score cube replaces the slab in one frame. `motion-09-x_attn` b0 +1.00 and b1 +1.00: the X and Q matrices blink out and come back. `motion-10-x_mha` b1 +0.38 → +0.50: K and V vanish and only Q remains, rotated. |

All nine fail, so every capped dimension is limited to 6.

### A: scorecard

| Dimension | Score | Cap | Weighted | Why |
|---|---|---|---|---|
| Concept clarity ×3 | 5 | ≤6 (E3, E4, E8) | 15 | Toy conv (`x_conv` 0–43 s) and toy attention (`x_attn`) work. MHA, pos-conv and the hidden-state stack do not build the idea step by step. |
| Tensor-shape legibility ×2 | 4 | ≤6 (E2, E3, E6) | 8 | The HUD always shows chips. In-scene tags are tiny pills on 3-D corners, one shape label is wrong (C 64), the 25-stack is unlabelled, and dotted zeros read as 8. |
| Narration–visual sync ×2 | 5 | ≤6 (E1) | 10 | Roughly synced per sentence, but early reveals, and the highlighted moments ("inner sizes disappear", "swap axes") never happen on screen. |
| Pacing ×2 | 5 | ≤6 (E5) | 10 | Compressed (about 22 min for a bigger model), number dumps in single sentences, and 11–20 s static stretches. |
| Motion quality ×1 | 4 | ≤6 (E6, E9) | 4 | Pans and pull-backs while text must be read, a pop-in score cube, blinking matrices. Fades are smooth. |
| Visual polish ×1 | 5 | ≤6 (E7) | 5 | Consistent, attractive style, but at least 12 overlaps, tiny grey annotation text and content cut at the frame edge. |
| **Total** | | | **52 / 100** | **Under 70: rework the failing scenes.** |

---

## 2. B: defect table and scorecard

| # | B | Evidence |
|---|---|---|
| E1 | PASS | `storyboard-09-attn`: Q, K and V each appear with their sentence, and q₁/k₃ are boxed at 27.8 s as they are spoken. Minor: `storyboard-14-quant`, "vocabulary" at 23.5 s, codebooks at 32.5 s. |
| E2 | PASS | `storyboard-10-mha`: every tensor has edge lengths and a tuple. Minor: metrics lists "24 layers · 1024" at 18.7 px (deepfake). |
| E3 | PASS | `storyboard-02-tensors` 55 s: "only C changed". `storyboard-10-mha` 36.8 s: `.transpose(1, 2): (B,49,12,64) → (B,12,49,64)`. `storyboard-06-projection` 115 s: "only the last axis changes". |
| E4 | PASS (minor) | Gumbel softmax is one text box (`storyboard-14-quant` 50.4 s); pre-LN/post-LN is a single table row (`storyboard-11-layer` 86.3 s). |
| E5 | **FAIL** | `metrics.md`: beats at 206 wpm (intro), 196 (conv), 201 (attn), 183 (tensors). "attention weights: 4 × (768×768 + 768) ≈ 2.36 M" is shown 3.75 s and needs 5.0 s. The conv arithmetic is shown 1.0 s and needs 3.6 s. |
| E6 | PASS | `motion-10-mha`, `motion-06-projection`: fixed camera, flat layouts; only a slight tilt of the 12-head card stack. |
| E7 | PASS (minor) | `storyboard-13-code` 1.1 s: the chapter number sits on the window's traffic-light dots. |
| E8 | **FAIL** | `metrics.md` lists 70 dead stretches of 6 s or more. Examples: `storyboard-14-quant` 5.6–19 s shows only a header line; `storyboard-04-conv` 72–99 s holds the same 4-channel diagram through five sentences; projection from 641.75 s for 13.2 s; layer from 1145.5 s for 13.5 s. |
| E9 | PASS | `motion-10-mha`: cross-fades throughout. Nit: about 1 s of empty frame at b7. |

| Dimension | Score | Cap | Weighted | Judged from |
|---|---|---|---|---|
| Concept clarity ×3 | 6 | ≤6 (E8) | 18 | Would be 8 uncapped (`storyboard-10-mha`, `storyboard-04-conv`). |
| Tensor-shape legibility ×2 | 9 | none | 18 | `storyboard-10-mha.jpg`, `storyboard-06-projection.jpg`: edge lengths on every matrix and a tuple under every step. |
| Narration–visual sync ×2 | 8 | none | 16 | `storyboard-09-attn.jpg`: reveal-on-mention and operand highlighting. |
| Pacing ×2 | 5 | ≤6 (E5) | 10 | `metrics.md`: 70 dead stretches plus several beats above 175 wpm. |
| Motion quality ×1 | 8 | none | 8 | `motion-06-projection.jpg`, `motion-10-mha.jpg`: no camera moves; elements cross-fade into place. |
| Visual polish ×1 | 8 | none | 8 | `storyboard-11-layer.jpg`: clear hierarchy, large type, no overlaps. |
| **Total** | | | **78 / 100** | **70–79: ship after fixing the listed problems** (dead stretches, fast beats). |

---

## 3. A: one line per scene

| Scene | What a viewer understands afterwards | Biggest gap |
|---|---|---|
| x_intro | XLS-R is a 300 M-parameter, 24-layer speech front end, and the bottom capsule tracks the shape. | 25.7 s: six stats pop in about 9 s before they are spoken. 45.9 s: concept pills drawn over the stats row. |
| x_overview | The stage order, and that the shape stays (B,201,1024) through the transformer. | 61.6–72.8 s: the camera pulls back until the whole pipeline is tiny and unreadable, and branch labels collide (63.8 s). There is never one frame with all the shapes in a row. |
| x_tensors | Scalar, vector, matrix, 3-D tensor; B/T/C/H colours; log-scale lengths. | 16.7–41 s: the vector and matrix sit cut off at the left edge. 52.2 s: the core rule "change one axis, leave the others" has no example. |
| x_audio | 16 kHz samples, 62.5 µs spacing, 64,600-sample crops (cut or repeat), per-clip normalisation. | 58.0 s: "the shape doesn't change" is not written in the frame. "No spectrogram" is just a caption, with nothing to contrast. |
| x_conv | Toy kernel, stride, and the output-length formula (good). | 45.3–63 s: jumps from one kernel to a tilted 3-D rod and a 512×12,919 slab with no "4 kernels give 4 rows" step. 1.1 s: title over the signal row. |
| x_encoder | Seven convs, 64,600 → 201, 320-sample hop, 400-sample receptive field, LN + GELU. | 23.4–34.6 s: six lengths read in one sentence while 3-D blocks slide past with tiny dotted-zero tags ("T 806" reads "T 886"). No table holds the numbers. |
| x_project | Transpose, per-frame LayerNorm, X·W = Y with (201×512)·(512×1024). | 57.3 s: "the inner sizes match and disappear" with nothing highlighted. 59.5–79.7 s: 20 s of the same frame. |
| x_mask | Spans of 10, about 50% hidden, one learned vector m. | Whole scene skewed in 3-D, and masked purple barely contrasts with the purple-tinted cells, so "≈50%" cannot be checked by eye. |
| x_posconv | 128-frame grouped conv, padding 64, trim to 201, 8.39 M weights. | 5.7 s: shuffle invariance is only a caption. 55.5 s: the residual has no ⊕. 7.9–19.2 s and 60–76 s are static. "Pre-norm" is used before x_layer explains it. |
| x_attn | Q·K dot product, score grid, ÷√d, softmax, weighted average. This is A's best scene. | 3.3–12.2 s: all four matrices visible (and blinking) before they are named. No f1–f4 row labels, so "row i = frame i" (34.3 s) is not anchored. The q₁ and k₃ rows are never boxed. |
| x_mha | There are 16 heads, 201×201 scores per head, and the cost grows quadratically. | 19.1–37.1 s: the split and the axis swap are one unchanged 3-D slab under a floating "16 heads" label, so the viewer can't tell heads from frames. 61.8–75 s: the merged block is labelled C 64 while the voice says 1024. |
| x_layer | Pre-norm layer x + Attn(LN(x)), x + FFN(LN(x)); FFN 1024 → 4096 → 1024; 12.6 M weights. | 3.3–14.3 s: a bare vertical line while "here's the complete layer" and "pre-norm" are spoken. The FFN blocks are crammed bottom-right at about a tenth of the frame. |
| x_stack | 24 layers, shape unchanged, final LN, 25 hidden states, lower layers useful for spoof detection. | 3.4–12.4 s: the tensor is a sliver inside near-invisible wireframes. 30–64 s: the 25-stack has no axis labels. |
| x_budget | Where the 315.4 M weights live (96% transformer, two thirds of each layer FFN). | 3.5–16 s: four counts in one sentence (about 180 wpm estimated), tiny legend, a ghost count-up "64,569,043" mid-grid (17.6 s). |
| x_quant | Two codebooks of 320 × 384, Gumbel pick, 768-d targets, 102,400 units. | 30–45 s: histograms drawn over codebook 1 and its tag; the 640 → (2, 320) reshape appears only in the HUD; 5.6–18.9 s static. |
| x_contrast | c_t versus q_t versus 100 distractors, cosine/κ/softmax loss, diversity loss, what gets discarded. | 7.7 s: q_t shown before it is introduced. c_t and q_t are thin slivers with tiny labels. 43.1 s: the panel covers "88 more distractors". |
| x_detect | Mean-pool → linear → 2 classes; SSL-AASIST and Mamba exist; the training recipe; padding masks. | 36.7–45.6 s: three pipelines crammed into the top-left third with colliding tags. "(B, 1024)" and "(B, 2)" never appear on the canvas. |
| x_code | The HF code reproduces the shapes. | The newest line is never highlighted; acceptable otherwise. |
| x_recap | One table of steps and shapes, and the takeaway. | 3.3 s: empty panel. The mini pipeline is too small to map to the rows, and the two takeaway rows are not highlighted (B highlighted them). |

---

## 4. A: the ten worst problems, worst first

1. **x_mha 19.1–37.1 s: the head split and the axis swap are invisible.** The 3-D slab is identical at 19.1 s and 28.1 s, and "16 heads" floats unattached.
   *Fix:* Use a flat Q matrix 201 × 1024 with 16 vertical dividers labelled h1…h16 and "1024 = 16 × 64" plus `q.view(B, 201, 16, 64)`. Animate the 16 chunks lifting into a stack of 16 frontal cards, each labelled 201 × 64, under `.transpose(1, 2): (B,201,16,64) → (B,16,201,64)`, with the moved axis glowing. Then show one head flat: Q_h 201×64 × K_hᵀ 64×201 = S_h 201×201.
2. **x_mha 61.8–75 s: wrong shape label.** The merged tensor reads C 64 while the voice and HUD say 1024, and at 61.8 s two captions overprint.
   *Fix:* Label it C 1,024 and draw it as 16 coloured 64-wide bands (h1…h16) so the merge is visible. Cut between captions instead of cross-fading. Then show W_O 1024 × 1024 → (B, 201, 1024).
3. **x_overview 28–72.8 s: pan and pull-back destroy legibility.** The end frame is about 40% of the screen, and "pre-training only" collides with "targets q" and "contrastive loss".
   *Fix:* Lock the camera. End on a flat row of five boxes with the shape under each, (B,64600) (B,512,201) (B,201,1024) (B,201,1024) (B,201,1024), plus a one-line summary. Put the pre-training branch in its own dashed box below, with labels that don't overlap.
4. **x_encoder 10–46 s: number dump on sliding 3-D blocks.**
   *Fix:* Use B's table (layer | kernel | stride | length | channels) and fill one row per sentence, with that row's formula underneath. Split the narration into three sentences. Use a mono font with an undotted (or slashed) zero, with tags at 28 px or more at 1080p.
5. **x_stack 3.4–64 s: tiny tensor in invisible layers, and an unlabelled 25-stack.**
   *Fix:* For the 24-layer pass, use readable layer slabs and a large counter. For the hidden states, use 25 flat cards offset diagonally and labelled h₀…h₂₄. Put "201" and "1024" on the first card's edges and a brace "25" along the stack, with `(25, B, 201, 1024)` directly under it.
6. **x_posconv 5.7, 55.5 and 60–76 s: claims without pictures, plus static stretches.**
   *Fix:* Show numbered frame cards 1–6 next to a shuffled row with "attention sees the same set". Draw a flat flow (B,201,1024) → Conv1d k128 g16 → GELU → ⊕ with a green residual arrow. Replace the "pre-norm" note with "LayerNorm comes later, inside each layer". Fill 7.9–19.2 s with the time-sliding kernel.
7. **x_tensors 52.2 s, x_project 57.3/70.7 s: the axis-change rule is never shown.**
   *Fix:* Show (B,201,512) → linear → (B,201,1024) with only the C slot boxed "only C changed". In the matmul, box both 512s and strike them through as "disappear" is spoken. Glow the C edge of X and Y at 70.7 s.
8. **x_attn 3.3–12.2 s: early reveal, blinking, no row labels.**
   *Fix:* Start with X alone. Reveal Q, K and V as each is named. Label rows f1–f4 on every matrix and score columns f1–f4. Box the q₁ row and k₃ row during the dot product. Remove the blink (motion-09 b0/b1).
9. **Overlaps across the video** (x_intro 45.9, x_conv 1.1, x_attn 1.1, x_encoder 88.1, x_posconv 37.4, x_quant 30–45, x_contrast 43.1/60.8, x_detect 41.2).
   *Fix:* Show chapter titles on a clean frame before any content. Never lay a panel over a live tensor; move or dim the tensor first. Put the histograms between the Linear box and the codebooks, as B does. Add a per-frame bounding-box overlap check to the render.
10. **x_detect 0–46 s: three back-ends crammed together, key shapes unwritten.**
    *Fix:* Show one recipe per beat at full size: (B,201,1024) → mean(dim=1) → (B,1024) → Linear 1024→2 → (B,2) → softmax bars. Clear the frame, then show SSL-AASIST alone ((B,201,1024) → Linear → (B,201,128) → graph), then Mamba alone (66,800 samples → 208 frames).

(Also fix: `x_mask` should be frontal with flat uniform masked blocks and a count "≈ n of 201 masked", and `x_budget` needs its sentence split in two.)

---

## 5. What B does better than A

1. **Flat, frontal, fixed camera for anything that must be read.**
   B: `storyboard-06-projection.jpg` (X 49×512 × W 512×768 = Y 49×768, all frontal) and `motion-06-projection.jpg` (zero camera moves).
   A: perspective and moves exactly where reading matters: `x_mha` 19–75 s, all of `x_mask`, `x_overview` 61–73 s, `x_conv` 45–85 s.
   Rule: 3-D only as a brief establishing shot, never while a label or number is being read.
2. **Every matrix edge carries its length, and the tuple sits under the picture.**
   B: `storyboard-10-mha.jpg`, where Q_h 49×64 × K_hᵀ 64×49 = S_h 49×49 sits beside "(49×64)·(64×49) = (49×49) per head" and "scores: (B,12,49,49)".
   A: small pills on 3-D corners, an unlabelled 25-stack (`x_stack` 35 s) and a wrong C 64 tag (`x_mha` 64 s).
3. **Show the change and mark the axis that changed.**
   B: `storyboard-02-tensors.jpg` 55 s, "(B,49,512) → linear → (B,49,768)" with only the 768 boxed and "only C changed". `storyboard-06-projection.jpg` 106.7 s boxes the inner 512s with "inner sizes match → they disappear". 115.5 s says "only the last axis changes".
   A: says all three (`x_tensors` 52.2 s, `x_project` 57.3/70.7 s) and shows none.
4. **One sentence, one visual change; long number lists go into a table filled row by row.**
   B: `storyboard-05-encoder.jpg`, where the layer table fills one row per sentence with that row's formula beneath (18.8–58.6 s), ending with a boxed "output: (B, 512, 49)".
   A: `x_encoder` 23.4 s reads six lengths in one sentence over moving blocks; `x_budget` 3.5 s reads four counts in one sentence.
5. **Bridge toy and real with an intermediate step.**
   B: `storyboard-04-conv.jpg` 54–99 s: 1 channel → 4 kernels → 4 output rows → "number of kernels = number of output channels" → a 512-kernel bar diagram with "(B, 1, 16000) → (B, 512, 3199)" and "weight: (512, 1, 10) ← (out, in, kernel)".
   A: `x_conv` 45.3 s jumps from one toy kernel to a tilted 3-D 512-channel slab.
6. **Reveal only what is being talked about, and highlight the operands.**
   B: `storyboard-09-attn.jpg`: Q at 14.4 s, K and V at 18.9 s, f1–f4 row labels on every matrix, the q₁ and k₃ rows boxed at 27.8 s while the arithmetic is written, Σ=1 beside each softmax row.
   A: `x_attn` 3.3 s shows all matrices before they are named, with no row labels and no operand boxes; `x_contrast` 7.7 s shows q_t early.
7. **Make every abstract claim concrete with a small picture.**
   B: `storyboard-08-posconv.jpg` (ordered frames 1–6 next to shuffled; Conv → GELU → ⊕ → LayerNorm with a green "residual: keep the original x"), `storyboard-03-audio.jpg` (crossed-out spectrogram next to the raw waveform), `storyboard-05-encoder.jpg` 125–142 s (GroupNorm normalises a row, LayerNorm a column).
   A: `x_posconv` 5.7 s and 55.5 s and `x_audio` 60 s are captions only.
8. **Show the whole structure first, then move a highlight.**
   B: `storyboard-11-layer.jpg` shows the full layer at 5.6 s and the highlight follows the narration. `storyboard-17-recap.jpg` 58–67 s highlights the two takeaway rows.
   A: `x_layer` 3.3–14.3 s is a bare line while "here's the complete layer" is spoken, and the `x_recap` table has no highlight.
9. **Large type and an unambiguous HUD.**
   B: every storyboard (for example `storyboard-07-masking.jpg`) has a breadcrumb of all stages plus "tensor shape (B, 49, 768)" as one readable tuple. In-scene text is large and has no dotted-zero confusion.
   A: separate small chips with the current stage only. In-scene tags are about a third of B's size, and the dotted zero reads as 8 (`x_encoder` 25.6 s).
10. **Give each idea time.** B spends 129 s on conv, 162 s on the encoder and 125 s on MHA, against A's 85, 101 and 93 s for a larger model.
    Caveat: B wastes time in dead stretches (70 in `metrics.md`). The transferable rule is to keep B's sentences-per-idea and cut B's idle holds, not to copy B's runtime.

Credit where due: A adds useful content B lacks, namely crop cut-or-repeat (`x_audio` 28–44 s), the full parameter grid (`x_budget`), the discarded-versus-kept panel (`x_contrast` 58–67 s) and the SSL-AASIST training recipe (`x_detect` 47–63 s). Keep that content and rebuild its presentation on B's grammar.
