# Review: XLS-R 300M (episode 1), round 4

**Total: 69 / 100. Verdict: rework the failing scenes (< 70).**

The total is one point below the "ship after fixing" band. The content is strong: every number checked is correct, and the shape capsule tracks the tensor through the whole video. Four things hold it back:

- **Sync:** the picture runs ahead of or behind the voice by 2–13 s in about a dozen places (conv, deepfake, x_layer, quant, mha, encoder).
- **Dead time:** `metrics.md` lists 83 stretches of 6 s or more with nothing new, about 790 s of the 31.5 min.
- **Overlaps:** a few labels overlap or are clipped.
- **Contradiction:** one on-screen contradiction in the deepfake padding beat.

I reviewed the round-4 folder only. I opened every storyboard, motion and cut file, read `metrics.md`, and cropped with PIL into `scratchpad/review_crops/xlsr4/`. All times are scene-relative, as in the storyboards.

---

## 1. Defects

| # | Defect | Result | Evidence (file, scene time) |
|---|---|---|---|
| E1 | Narration vs screen out of step | **FAIL** | `storyboard-04-conv` 80.5–93.7 s: "With five hundred and twelve kernels, one input row becomes five hundred and twelve output rows" plays over the 4-kernel / 4-channel picture. "512" is first drawn at 93.7 s. `storyboard-16-deepfake` 27.7 s: "spoof (0) 0.07 / bona fide (1) 0.93" is on screen while only "a linear layer maps ten twenty-four to two scores" is said. The class mapping is said at 32.2 s and softmax at 38.8 s. `storyboard-11-x_layer` 65.8 s: the FFN bar appears (said at 70.3 s). At 68.0–70.3 s the LayerNorm 4,096 bar and "one layer 12,596,224" appear (said at 79.2 s). `storyboard-14-quant` 54.0–56.2 s: "the entry with the highest score is picked", but nothing is highlighted until 58.4 s. `storyboard-10-mha` 104.7 s: "One might track neighbouring frames" over an empty canvas; the pattern appears at 106.9 s. `storyboard-04-conv` 36.4 s: "We got four output numbers" with three on screen. `storyboard-05-encoder` 9.9–12.1 s: all seven kernel/stride rows are shown while the voice is still on layer one. |
| E2 | Spoken shape not written / unreadable | PASS | Every spoken shape is in the HUD capsule and on the canvas in coloured mono at a readable size. Examples: `storyboard-10-mha` 27.6–98.1 s (q.view(B,49,16,64), transpose, (B,16,49,49), (B,16,49,64), (B,49,1024)), `storyboard-17-recap` 52.6 s, `storyboard-14-quant` 49.6 s (reshape → (B,49,2,320)). Caveat: the spoken "2,401 / 40,401 scores per head" at `mha` 122.4 s is dim grey. |
| E3 | Transformation without the axis that changes | PASS | Before → after is written each time. `projection` 10.0 s: "(B,512,49) → x.transpose(1,2) → (B,49,512)". `projection` 123.1 s: "only the last axis changes". `mha` 87.1 s: the full transpose/reshape chain. `deepfake` 18.9 s: "(B,T,1024) → mean(dim=1) → (B,1024)". `outputs` 37.2 s: "torch.stack → (25,B,49,1024)". Caveat: the posconv transposes at 34.3 s and 51.9 s are text only and the grid does not move (problem 7). |
| E4 | Concept used before explained / one sentence, no picture | **FAIL** | `contrast` 36.8 s: "divide by a temperature of zero point one" is one clause, and κ is never shown doing anything. `deepfake` 52.2 s: "the front end is fine-tuned too, with a very small learning rate" is one sentence plus tiny text "(~1e-5 … 1e-6)"; learning rate is never introduced. `audio` 81.3 s: "artifacts left behind by a vocoder", and "vocoder" is never defined. `deepfake` 32.2 s: "ASVspoof recipes" is never introduced. `posconv` 5.5 s: the argument rests on attention's order-blindness two chapters before attention is built. This one is mitigated by the shuffle picture. |
| E5 | > 3 new ideas or numbers in 10 s / beat > 175 wpm / meaningful text too brief | **FAIL** | `x_intro` 34.4–45.6 s: four numbers in one sentence (300 M, 24 layers, 1,024 wide, 16 heads), right after 436 K hours and 128 languages at 21–30 s. `quant` 32.0–42.0 s: 2 codebooks, 320 entries, 384 numbers, 512 → 640, 320 per codebook. `deepfake` 38.8 s: softmax, cross-entropy, 0.1/0.9 weights and class imbalance in one sentence. `metrics.md` lists "pre-norm: LN before each part" (x_layer) at 2.5 s against 3.0 s needed, and that label carries meaning. Beat speed is fine (max 165 wpm, encoder beat 0). |
| E6 | Camera / 3-D motion while reading | PASS | No camera moves. The 3-D stacks are static with flat labels: `mha` 36.4 s (16 heads, 49, 64), `outputs` 28.2–37.2 s, `x_layer` 85.9 s. The only tilt is a ~0.5 s transition in `motion-10-mha` b3 (+0.88 to +1.12), before any text is up. |
| E7 | Overlap / clipping | **FAIL** | `storyboard-02-tensors` 61.9–68.7 s: the "only C changed" box sits right of "1024". It cuts through the 2 and covers ")" plus empty space (`tn_61.jpg`). `storyboard-04-conv` 109.2–113.6 s: "+ bias: (512,) one learned number per output channel" starts on top of the 512×3199 grid's right edge and runs past the panel border, so "channel" is clipped (`cv_109.jpg`). `storyboard-15-contrast` 77.0–85.9 s: the red X is drawn through the words "Quantizer" and "Projection heads". `cut-13.jpg` +0.05 to +0.60: the code-window frame shows under the chapter-13 title. |
| E8 | Dead stretch > 6 s / cluttered frame | **FAIL** | `metrics.md` lists 83 dead stretches. The worst, all checked in the storyboards: quant 41.3 s (16.5 s), code 55.5 s (14.8), conv 133.2 s (14.2), x_layer 69.2 s (14.2), mha 123.0 s (13.5), encoder 10.9 s (13.2), contrast 2.8 s (13.0), audio 11.1 s (13.0), projection 127.4 s (12.0), posconv 107.5 s (11.8). Clutter: `quant` 69.4–98.1 s has about 12 labelled parts, most labels about 10 px at tile scale ("group 1: 320 scores", "codebook 1 · 320 entries", "concat = 768"). |
| E9 | Pop-in / jitter / broken motion | PASS | All 18 motion strips show fades and draw-ons over 0.25–0.6 s, with no jitter. Examples: the kernel slide in `motion-04-conv` b1–b4 and the LayerNorm bars in `motion-06` b2. Minor: the Gumbel panel at `quant` 58.4–60.6 s is an empty frame for 2 s before its content draws in. |

## 2. Scorecard

| Dimension | Score | Cap | × | Points | Basis |
|---|---|---|---|---|---|
| Concept clarity | 6 | ≤ 6 (E4, E8) | 3 | 18 | The from-scratch build is excellent: tensors → samples → toy conv → stride formula → 7 real layers → linear from scratch → toy attention → real MHA. It is capped by the unexplained terms and the long dead holds. Uncapped it would be about 7. |
| Tensor-shape legibility | 8 | none | 2 | 16 | From `storyboard-10-mha.jpg`: the HUD goes B×49×1024 → B×49×16×64 → B×16×49×64 → B×16×49×49 → B×16×49×64 → B×49×1024 in step, 27–98 s. From `storyboard-06-projection.jpg` 3–139 s, and from `storyboard-17-recap.jpg` 52.6 s, which has every row correct and colour-coded. Weak spots: the posconv transposes are not drawn, the quant HUD runs early, and grid orientation flips between scenes. |
| Narration–visual sync | 6 | ≤ 6 (E1) | 2 | 12 | Mostly tight (intro, overview, conv toy, encoder lengths, recap), but there are about a dozen 2–13 s offsets (see E1). |
| Pacing | 5 | ≤ 6 (E5) | 2 | 10 | Speech rate is fine, but about 42 % of the runtime has nothing new for 6 s or more. The intro, quant and deepfake have dense number bursts. The runtime is 31.5 min. |
| Motion quality | 7 | none | 1 | 7 | Smooth and purposeful in conv (kernel slides), projection (transpose rows, LayerNorm bars) and masking (spans). Most scene changes are fade-out/fade-in rather than carrying an element forward. The posconv kernel never moves. The intro has decorative 3-D cube, sphere and slab. |
| Visual polish | 6 | ≤ 6 (E7) | 1 | 6 | Consistent type, palette and HUD. Against it: the E7 overlaps, dim grey secondary numbers, and the cluttered quant frame. |
| **Total** | | | | **69** | **rework the failing scenes** |

## 3. Per scene

- **x_intro**: The viewer learns XLS-R = 315.4 M parameters, 24 layers, 1,024 wide, 16 heads, 128 languages and 436 K hours, and what the HUD capsule is for (52–59 s, good). Gap: 34.4–45.6 s puts four numbers in one sentence. "wav2vec 2.0" is spoken at 30.0 s but never written or explained. The "24 transformer layers" label sits on a decorative cube from 12.2 s, 22 s before "24" is said.
- **overview**: The viewer sees the pipeline raw audio (B,16000) → encoder (B,512,49) → projection (B,49,1024) → transformer → context vectors, plus the pre-training branch and the 4 s crop → 201 frames. Gap: the lower 60 % of the frame is empty for 54–105 s. `metrics.md` has dead stretches at 2.8, 14.8, 22.5 (12.5 s), 35.8 and 43.3 s.
- **tensors**: The viewer gets scalar → vector → matrix → 3-D tensor and the coloured B/T/C/H axes. Gap: the legend is wiped at about 57 s, seconds after it is complete. The "only C changed" box is misaligned at 61.9–68.7 s. The C label appears at 43.9 s, before it is said at 48.4 s.
- **audio**: The viewer gets 16 kHz samples, 62.5 µs spacing, a vector of 16000, (B,16000), per-clip normalisation and raw waveform vs spectrogram. Gap: 11.1–24.1 s, the waveform is static while samples are explained (the zoom comes at 25.6 s). "Shape unchanged (B,16000)" is up at 61.3 s but said at 70.2 s. "Vocoder" at 81.3 s is never defined.
- **conv**: An excellent toy: −0.7, 1.2, −0.1, −0.9 and L_out = ⌊(L_in−k)/s⌋+1 worked out to 4. Kernels → channels, (B,1,16000) → (B,512,3199), weight (512,1,10), the 512×3 kernel and 786,432 weights. Gap: 80.5–93.7 s, "512 kernels → 512 output rows" is spoken over a 4-channel picture. At 62.9–65.1 s the kernel [1,0,−1] is described while only the input row is on screen. The bias text overlaps and is clipped at 109–114 s.
- **encoder**: The viewer gets 7 layers, lengths 3199 → … → 49, channels 1 → 512, total stride 320 = 20 ms, 49 not 50, receptive field 400 = 25 ms, GELU, GroupNorm (base) vs LayerNorm (XLS-R) and 4.2 M weights. Gap: 9.9–24.1 s, all kernel/stride rows are shown at once with no row highlight while the voice walks them, then nothing new for 13 s. The LayerNorm panel appears at 139.9 s while the voice is still on the base model (146.5 s).
- **projection**: The viewer gets the transpose (same numbers, new order), LayerNorm per frame across 512 features, a 4→3 linear built from scratch, W 512×1024, (49×512)(512×1024) = (49×1024) and 525,312 weights. Gap: 54.3 s, "Then a linear layer" plays over an empty screen. 78.7–98.7 s, "PyTorch stores it transposed (1024, 512)" is text only and never drawn, and the panel is static for 18 s (dead at 80.7 and 89.9 s).
- **masking**: The viewer gets p = 0.065, spans of 10, overlaps, the learned vector m ∈ ℝ¹⁰²⁴, 26 of 49 masked (≈ 49 % on average) and shape unchanged. Gap: the grid is now 1024 rows × 49 columns (frames as columns), while projection drew frames as rows. Nothing says so. 2.8–11.3 s is dead.
- **posconv**: The viewer gets the shuffle demo (position must be injected), kernel 128 = 2.56 s, 64 zeros each side, 177 → 50 → trim → 49, groups 16 (8.39 M vs 134 M) and the residual x + GELU(conv(x)). Gap: the 128-frame kernel is a static rectangle from 21 to 52 s and never slides. Both transposes (34.3 s, 51.9 s) leave the picture unchanged. 91.5–119 s is almost static.
- **attn**: The viewer gets a 4×2 toy: Q/K/V, q₁·k₃ = 0.92, the score grid, ÷√d (toy 1.41, XLS-R 8), softmax 0.46/0.44/0.07/0.03, out₁ = [1.23, 0.45], and "data-dependent weighted average". All the arithmetic checks out. Gap: 2.8–12.0 s shows only X and "frame 1 asks…" for 9 s. W_Q/W_K/W_V are dashed placeholders with no numbers, so the Q/K/V values appear from nowhere.
- **mha**: The viewer gets W_Q/K/V 1024×1024 → (B,49,1024), split 16×64, view → transpose → (B,16,49,64), per-head 49×49 scores, ÷8, softmax, A·V, merge, W_O (4.2 M) and the T² cost (2,401 vs 40,401). Gap: 100.3–106.9 s, three sentences play over a headline on an empty canvas, and each head pattern lags its sentence by about 2 s. 123.0–136.5 s is static.
- **x_layer**: The viewer gets the pre-norm residual layer x = x + Attn(LN(x)), x = x + FFN(LN(x)), FFN 1024 → 4096 → 1024, the weights per layer and ×24 = 302 M (96 %). Gap: 63.6–79.2 s, the count panel runs 5–9 s ahead of the voice and then holds for 14 s. "pre-norm: LN before each part" is on screen for 2.5 s.
- **outputs**: The viewer gets last_hidden_state = LayerNorm(layer-24 output), 25 hidden states (h₀ = after pos-conv, h₁…h₂₄ = layer outputs), the 4.x footnote, stack → (25,B,49,1024) and the parameter budget of 315,438,720. Gap: the deepfake-use box appears at 48.5 s, about 4 s before it is narrated. 72.9–85.4 s is a static parameter bar (12.5 s), and the bar segments sum to 3,072 less than the printed total.
- **code**: Real HF code reproduces (2,49,512), (2,49,1024), 25 hidden states, (512,1,10), (1024,512) and 315,438,720, with each line highlighted as it is discussed. Gap: 55.5–70.3 s is static (14.8 s). The "# (B, samples): two 1-second clips" comment is nearly invisible grey.
- **quant**: The viewer gets unmasked Z (B,49,512), Linear 512 → 640, 2×320 scores, two codebooks of 320 × 384, argmax pick, Gumbel softmax, concat 768 → Linear → q (B,49,768) and 320² = 102,400. Gap: 41.3–57.8 s, nothing new for 16.5 s. The pick is highlighted 4 s late (58.4 s). The HUD shows (B,49,2,320) from 40.8 s, before the reshape is said at 49.6 s. The frame at 69–98 s is the densest in the video, and the HUD stage label still says "02/07 Conv encoder".
- **contrast**: The viewer gets c_t = Linear 1024 → 768, the true q_t plus 100 distractors from the same clip, cosine similarity (with an angle picture), softmax with κ = 0.1, −log p, + 0.1·L_diversity, and which parts are kept or discarded. Gap: 2.8–15.8 s is static. "The transformer's output there" points to a masked position that this scene never shows. 52.4–63.6 s has an unlabelled purple histogram. κ is never shown doing anything.
- **deepfake**: The viewer gets mean-pool → Linear 1024 → 2, class 0 = spoof, softmax/CE with 0.1/0.9 weights, fine-tuning, the weighted layer sum, 64,600 → (B,201,1024) → Linear 1024 → 128 → AASIST, the frames formula, padding, attention_mask and masked pooling. Gap: the probabilities show 11 s before softmax is said (27.7 vs 38.8 s). At 129.8–141 s the frame mask still ends in zeros after repeat-padding. The softmax(w) chart peaking at layers 4–6 has no "illustrative" label. The scene has 77 s of dead time.
- **recap**: The table builds row by row exactly in step with the voice, every shape is correct, and the two key rows are highlighted ("shrinks time / never changes the shape"). Gap: 9.3–20.1 s, one feature-encoder sentence holds for 10 s on a single new row. The "frames = ⌊(samples−400)/320⌋+1" line at 61.6 s is small compared with the rows.

## 4. Factual check (against the HF 5.21 / PyTorch ground truth)

**Correct (checked on screen):**
- Conv lengths 16000 → 3199, 1599, 799, 399, 199, 99, 49.
- Formula ⌊(64600−400)/320⌋+1 = 201 and ⌊(16000−400)/320⌋+1 = 49.
- Total stride 320 = 20 ms. Receptive field 10 + 2·5 + 2·10 + 2·20 + 2·40 + 1·80 + 1·160 = 400 = 25 ms.
- conv0 weight (512,1,10) + bias (512,). LayerNorm after every conv in XLS-R vs GroupNorm on the first conv only in base wav2vec 2.0.
- 512×512×3 = 786,432. Feature encoder ≈ 4.21 M.
- Projection LayerNorm(512) + Linear, weight (1024,512), 525,312.
- mask_time_prob 0.065, span 10, learned 1024-d vector, ≈ 49 % masked.
- Pos-conv k = 128, pad 64, groups 16, weight (1024,64,128), 177 → 50 → trim → 49, 8.39 M. No LayerNorm after pos-conv in the stable-layer-norm encoder.
- 16 heads × 64, ÷8, scores (B,16,T,T). q_proj 1024×1024. Attention 4,198,400, FFN 8,393,728, 2 LayerNorms 4,096, one layer 12,596,224, 24 layers 302,309,376.
- last_hidden_state = LN(layer-24 output) in 5.x, and the 4.x footnote is correct. 25 hidden states with h₀ = after pos-conv.
- Total 315,438,720.
- Quantizer 512 → 640, 2×320, entries 384, concat 768, project_q 768 → 768. project_hid 1024 → 768.
- 100 negatives, κ = 0.1, diversity weight 0.1.
- softmax(−0.5, 2.1) = 0.07/0.93 and −log 0.93 = 0.07.
- Toy conv outputs and toy attention numbers (q₁·k₃ = 1.58·(−0.27) + 1.04·1.29 = 0.92; weights 0.46/0.44/0.07/0.03; out₁ = [1.23, 0.45]).

**Problems:**
1. `deepfake` 129.8–141 s is a contradiction. With repeat-padding the attention-mask rows become all ones, but "frame mask m: (B,201) = 1 1 … 1 0 … 0" and "average over real frames only" stay on screen.
2. `deepfake` 69.9–76.6 s: the softmax(w) bar chart peaks at layers 4–6 and is not labelled illustrative. The mha patterns are labelled "illustrative patterns, not measured ones", so a viewer will read this one as a measured result.
3. `outputs` 72.9 s: the bar segments (4.21 + 0.53 + 8.39 + 302.31 M = 315,435,648) omit the final LayerNorm (2,048) and masked_spec_embed (1,024). The printed total of 315,438,720 is right, but the bar does not add up to it.
4. `quant` throughout: the HUD stage label says "02/07 Conv encoder". This is defensible (the quantizer reads the encoder output) but looks like a bug.

## 5. Ten worst problems (worst first)

1. **conv 80.5–93.7 s.** The voice says "512 kernels, one input row becomes 512 output rows" while the screen shows 4 kernels and 4 channels. "512" first appears at 93.7 s, so the viewer hears 512 and sees 4 for 13 s.
   **Fix:** at 80.5 s collapse the 4 rows into a deep stack labelled "×512 kernels → 512 channels" and update the HUD. Show the (B,1,16000) code panel only after that.
2. **deepfake 27.7–38.8 s.** "spoof (0) 0.07 / bona fide (1) 0.93" sits next to the logits from 27.7 s. The voice reaches class indices at 32.2 s and softmax at 38.8 s, so the viewer sees probabilities before learning what they are.
   **Fix:** show only the logits (−0.5, 2.1) and "(B, 2)" at 27.7 s. Add the class labels at 32.2 s. Draw the softmax arrow and 0.07/0.93 at 38.8 s.
3. **deepfake 129.8–141 s.** After "repeat short clips", the mask rows are all ones but the frame mask still reads "1 1…1 0…0" and pooling still says "real frames only".
   **Fix:** split into two labelled cases, (a) zero-pad + mask → masked mean and (b) repeat-pad → all-ones mask, plain mean. Alternatively, update the m line to all ones when the repeat animation plays.
4. **x_layer 63.6–83.4 s.** The weight-count panel runs ahead: the FFN bar shows at 65.8 s (said at 70.3 s), and the LayerNorm 4,096 bar and "one layer 12,596,224" show at 68–70 s (said at 79.2 s). Then it holds for 14 s.
   **Fix:** reveal the attention bar at 63.6 s, the FFN bar at 70.3 s, and the LayerNorms plus total at 79.2 s. Trim the hold to about 3 s.
5. **quant 41.3–60.6 s.** Nothing new for 16.5 s. The HUD shows (B,49,2,320) from 40.8 s, but the reshape is said at 49.6 s. "The entry with the highest score is picked" (54.0 s) has no highlight until 58.4 s, and the Gumbel panel is an empty box until 60.6 s.
   **Fix:** at 49.6 s animate the 640-bar strip splitting into 2×320 and switch the HUD then. At 54.0 s light up the tallest bar in each group and draw an arrow to the chosen codebook row. Draw the Gumbel box together with its contents.
6. **encoder 9.9–24.1 s.** All seven kernel/stride rows are visible by 12.1 s while the voice walks "first layer… next four… last two" (up to 16.5 s). No row is highlighted, and nothing changes until 25.3 s.
   **Fix:** reveal or highlight conv 1 at 9.9 s, conv 2–5 at 14.3 s and conv 6–7 at 16.5 s. Cut the remaining hold to 3 s.
7. **posconv 18.8–52 s and 91.5–119 s.** The 128-frame kernel is a static rectangle and never slides. The transposes to (B,1024,49) at 34.3 s and back at 51.9 s change only a text label, because the grid was already drawn 1024 rows high. Then 28 s are nearly static.
   **Fix:** draw the grid frames-as-rows until 34.3 s and rotate it on each transpose. Slide the 128-wide window along the 177 padded frames, emitting 50 outputs, and strike out the 50th at "the last one is trimmed".
8. **tensors 61.9–68.7 s.** The "only C changed" box is offset right, cutting through "1024" and covering ")" (E7). This is the very first "a change is highlighted" example, and the B/T/C/H legend was wiped at about 57 s, just before it is needed.
   **Fix:** fit the box to the glyph bounds of "1024". Keep a compact B/T/C/H legend docked at the side through the example.
9. **conv 109.2–113.6 s.** "+ bias: (512,) one learned number per output channel" starts on top of the output grid's right edge and is clipped by the panel border.
   **Fix:** set the bias line on its own row under "weight: (512, 1, 10)", left-aligned with it and inside the panel, with at least a 24 px right margin. Shorten it to "bias: (512,): one per output channel".
10. **mha 100.3–111.4 s.** "Why multiple heads?", "Each head can learn its own notion of relevance" and "One might track neighbouring frames" play over a headline on an empty canvas. The neighbouring pattern lands at 106.9 s and the sound-alike pattern at 109.1 s, each about 2 s after its sentence. 123.0–136.5 s is a static T² comparison.
    **Fix:** at 100.3 s show a 4×4 grid of small head thumbnails, then enlarge one per sentence on its first word. After the 201-frame square lands, cut the hold to 3 s.

## 6. Also worth fixing

**Sync and timing**
- `contrast` 52.4–63.6 s: the purple histogram has no label for about 9 s. "L = L_contrastive + 0.1·L_diversity" appears at 61.4 s, before the diversity loss is said at 65.8 s. Add "codebook usage" when the histogram first appears.
- `contrast` 2.8–15.8 s: only the c_t column is on screen for 13 s, and "output there" refers to a masked position that is not drawn. Add a small 49-frame strip with the masked span and an arrow to t.
- `x_intro` 34.4–45.6 s: four numbers in one sentence. Split it in two and let each tile land on its number. Write "wav2vec 2.0" when it is said (30.0 s), with a one-line "Meta's 2020 self-supervised speech model".
- `conv` 36.4 s: "We got four output numbers" shows three. Move the fourth output to 36.4 s.
- `conv` 62.9–65.1 s: the kernel [1,0,−1] is described while only the input row is on screen. Keep the kernel visible.
- `encoder` 139.9 s: the LayerNorm panel appears while the voice is still on GroupNorm. Delay it to 146.5 s.
- `audio` 61.3 s: "shape unchanged" appears 9 s before it is said. Delay it to 70.2 s.
- `tensors` 43.9 s and 50.7 s: the C and H labels appear 2–4 s before they are narrated.
- `outputs` 48.5 s: the deepfake box appears about 4 s early.
- `x_intro` 12.2 s: the "24 transformer layers" label sits on the decorative cube 22 s before 24 is said.

**Concepts that need a picture or a definition**
- `contrast` 36.8 s: κ = 0.1 needs a picture. Show the softmax bars at κ = 1 next to κ = 0.1 for one second.
- `deepfake` 52.2 s: either explain fine-tuning and learning rate in a picture, or drop the "1e-5 … 1e-6" detail.
- `audio` 81.3 s and `deepfake` 32.2 s: define "vocoder" and "ASVspoof" in a few words each.

**Legibility and layout**
- `deepfake` 69.9 s: label the softmax(w) chart "illustrative", or use real learned weights.
- `outputs` 72.9 s: add a 3,072 sliver to the parameter bar ("final LN + mask embedding") so it sums to the printed total.
- `x_layer`: show "pre-norm: LN before each part" for at least 3.5 s. Hold `masking` "(pre-training)" and `contrast` "contrastive" for at least 2 s.
- `projection` 54.3 s: "Then a linear layer" plays over an empty screen; carry the LayerNorm result in instead. At 78.7–98.7 s, actually rotate the W grid into a (1024, 512) block when "stored transposed" is said.
- `masking` 3.3 s: add "columns = frames" (posconv has it), or keep frames-as-rows across scenes.
- `quant`: change the HUD stage to "pre-training branch". Split the 69–98 s frame into two steps, with the codebook pick and then concat → q, so the labels can be bigger.
- `contrast` 77.0–85.9 s: put the red X beside the discarded boxes, or dim them, instead of drawing it through their names.
- `mha` 122.4 s: "2,401 scores / head" and "40,401 scores / head" are the spoken numbers. Make them bright, not dim grey.
- `code`: brighten the "# (B, samples): two 1-second clips" comment. Cut the 55.5–70.3 s hold.
- `cut-13`: fade the code window in after the chapter-13 title card clears.
- `recap` 61.6 s: enlarge the frames-formula line to row size.
- `attn` 14–19 s: show the 2×2 W_Q/W_K/W_V numbers once, so Q = X·W_Q can be checked by eye.

**Runtime**
- Overall: about 790 s of dead time. Trimming every hold to at most 4 s after its result would cut about 5 min from the 31.5 min runtime without losing content.
