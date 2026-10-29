# Review: Episode 2, "AASIST back-end" (round 1)

**Total: 61 / 100. Verdict: rework the failing scenes (< 70).**

The reviewer had a fresh context and used only the rubric and this folder. All 15 storyboards, all 15 motion strips, cut-01 to cut-14 and metrics.md were opened, and details were zoomed from 2x crops. All times below are **scene-relative** (the storyboard tile time), unless marked "abs".

Short version: every number on screen matches the authors' code, and the scene order builds the pipeline sensibly. The two things that drag the score down are how ideas are pictured and how the HUD is timed:

- The central idea (graph attention aggregating neighbours, softmax, temperature) is shown as formula cards and a map that never changes.
- The HUD tensor bar regularly runs 5–10 s ahead of the narration, and once it skips a stage.
- There are 53 measured dead stretches, eight of them longer than 14 s.
- Several mid-video scenes are text tables with no picture.

---

## 1. Defects (Step 1)

| # | Defect | Result | Evidence (file, scene time) |
|---|---|---|---|
| E1 | Narration not on screen at that moment / shown much earlier or later | **FAIL** | **storyboard-01-a_overview 14.6–25 s.** Voice: "A linear layer shrinks each frame to 128". HUD already reads "03/08 Pool 3×3 · B×1×42×67". motion-01 b1 shows the "Linear" label for about one frame (+0.25) before it flips to "Pool 3×3" (+0.38), so the (B, 201, 128) stage is never held.<br>**storyboard-05-a_res 21.0 s.** "There are six blocks" is spoken over an **empty frame**; the table appears at 23.2 s with only 2 rows.<br>**storyboard-07-a_gat 54.9–57.2 s.** "A higher temperature makes the weights more even; a lower one sharper". Nothing on screen changes.<br>**storyboard-06-a_nodes 51.7 s.** HUD already shows B×67×64 about 9 s before it is derived. At 60.5 s the voice says "B by 64 by 67", the canvas shows (B, 64, 67) and the HUD shows (B, 67, 64) in the same frame.<br>**storyboard-12-a_orig 3.3–16.5 s.** HUD stage label "01/08 XLS-R" during the sinc conv of a model that has no XLS-R.<br>HUD early elsewhere: a_image 3.3 s (B×1×128×201 before transpose or unsqueeze is spoken), a_pool 14.4 s (B×21×64, 7 s before "42 become 21"), a_branch 1.1 s (final 16/10 before the pooling is spoken at 7.9 s), a_readout 16.6 s (B×160 when only 3 of the 5 vectors exist). |
| E2 | Spoken shape not written / too small | **FAIL** | **storyboard-13-a_code 5.7–15 s.** The voice says the stub is "B by 201 by 1024". The terminal shows only `input (2, 64600) → output (2, 2)` and the HUD shows `2 × 2`. (2, 201, 1024) first appears at 17.2 s in the LL row.<br>Secondary: the box shape labels in storyboard-01-a_overview are about 18–20 px (metrics flags "frames × features", "6 residual blocks", "spectral + temporal", "GAT, pool, HS-GAL ×2", "max, mean → Linear" at 18 px). |
| E3 | Transformation without clear before → after axis | **FAIL** | **storyboard-07-a_gat 45.9–57.2 s.** "Softmax across the node axis", but no row or column of the 42×42 map is highlighted and the map does not change after the softmax.<br>**a_gat 59.4–72.8 s.** For `out = W₁(A·X) + W₂X`, X (42×64) and out (42×64) sit apart with text between them. A is not drawn, and nothing shows the node axis being mixed.<br>**storyboard-11-a_readout 3.3–21 s.** The arrows "max \|·\| over nodes" and "mean over nodes" end at text labels. The 16-node axis is not highlighted as collapsing, and the result boxes appear elsewhere. |
| E4 | Concept used before explained / one sentence, no picture | **FAIL** | **a_gat 34.7 s.** "Pair vector → linear + tanh → dot with a learned vector → single score" is one sentence. The 42×42 map pops in with no link from the highlighted pair (2, 6) to a cell.<br>**a_gat 54.9 s.** Temperature effect: no picture.<br>**storyboard-04-a_conv2d 45.5–58.8 s.** "Pads by one on every side" is formula only; no padded grid is ever drawn.<br>**storyboard-03-a_image 72–78 s.** Batch norm is one text line.<br>**storyboard-12-a_orig 7.7–14.3 s.** "Seventy band-pass filters" is a table row only, with no filter drawn. |
| E5 | > ~3 new ideas/numbers in 10 s, beat > 175 wpm, or brief meaningful text | **FAIL** | **storyboard-11-a_readout 34.3–45.4 s.** One sentence packs cross-entropy, 0.1, 0.9, Adam, 1e-6 and batch 14 (6 new items). On screen they appear only as one small grey line, which also adds "RawBoost", a seventh item that is never narrated.<br>**storyboard-12-a_orig 38.6–51.8 s** (21,490 → 7,163 → … → 29, then (B, 64, 23, 29)) and **58.4–69.4 s** (23, 29, 11, 20, 297 K).<br>Beat wpm peaks at 172 (a_gat beat 3), so no beat is above 175. The "too brief" items are all chapter flashes or title-card words, which are not counted. |
| E6 | Camera move / 3-D perspective while reading | PASS | No camera moves or perspective in any motion strip. The "× 64 channels" stacked-card offset (a_nodes) is static. |
| E7 | Text over text/shapes; cut off by frame/HUD | **FAIL** | **storyboard-04-a_conv2d 10–37 s.** "output: 3 × 5 / (4 − 2 + 1) × (7 − 3 + 1)" is printed over the right column of the output grid (over cells −0.05 and −0.50; clear at 32.2 s).<br>**storyboard-02-a_start 36.9–73 s.** The LL output arrow runs into the "201" label of the output grid ("→201").<br>**storyboard-03-a_image 67.5–90 s.** The SELU curve leaves the plot panel at the top right, and the curve crosses the "SELU" label.<br>**storyboard-06-a_nodes 58.3–67 s.** The "67" label sits on the down-arrow.<br>**storyboard-09-a_hsgal 59.5 s.** The HUD's master chip row slides over the new chip row and pokes out of the HUD bar. |
| E8 | Dead stretch > 6 s / cluttered frame | **FAIL** | metrics.md lists 53 dead stretches. The worst ones, scene-relative:<br>a_code 1.8–21.3 s (19.5 s)<br>a_nodes 2.9–21.4 s (18.5 s)<br>a_orig 5.0–22.8 s (17.8 s)<br>a_recap 54.1–70 s (16 s)<br>a_hsgal 60.5–76 s (15.5 s)<br>a_res 5.1–20.6 s (15.5 s)<br>a_conv2d 44.8–60 s (15.2 s)<br>a_start 59.5–73.7 s (14.2 s) and 46–59 s (13 s)<br>a_readout 34.8–47 s and 47.3–59.5 s (12.2 s each)<br>a_overview: every box sits 8–11 s (2.5–13.3, 32.5–43, 43.5–52.7, 63–73.8 s). |
| E9 | Pop-in fully formed, jitter, broken-looking motion | **FAIL** | **The HUD scrubs through stages at chapter cuts.** cut-02 shows Readout → HS-GAL → Pool 3×3 → blank stage label within 0.3 s. cut-12 flashes "Pool 3×3" on the way back to the sinc stage. cut-04, cut-09 and cut-11 show chips sliding with ghost rows.<br>motion-01 b1 shows a one-frame "Linear" label.<br>The a_gat score map at 34.7 s (motion-07 b2) and the a_res table rows pop in fully formed (cross-fade of about 0.25 s). |

Caps from failures: Clarity ≤ 6 (E3, E4, E8), Shapes ≤ 6 (E2, E3), Sync ≤ 6 (E1), Pacing ≤ 6 (E5), Motion ≤ 6 (E9), Polish ≤ 6 (E7).

---

## 2. Scorecard (Step 2)

| Dimension | Weight | Score /10 | Cap | Points | Why |
|---|---|---|---|---|---|
| Concept clarity | ×3 | 6 | ≤ 6 | **18 / 30** | Scene order is right and several scenes really build the idea: a_image (transpose/unsqueeze/pool with real numbers), a_conv2d (numeric kernel slide), a_pool (score bars → top half), a_hsgal (54-node stack → block map → master). The core GAT mechanism, the softmax target in a_nodes, padding, BN and the sinc conv are formula or text only. a_overview, a_orig, a_code and a_recap are text-heavy. |
| Tensor-shape legibility | ×2 | 6 | ≤ 6 | **12 / 20** | The HUD is always present with colour-coded chips, and most shapes are also written on canvas in large mono type. But the HUD is often early or skips a stage, and it shows only one of two parallel tensors (a_nodes/a_gat show only B×42×64). The promised purple N axis is barely used (see #10), and the overview sub-labels are about 18 px. |
| Narration–visual sync | ×2 | 5 | ≤ 6 | **10 / 20** | The main canvas usually matches the sentence. The HUD leads by 5–10 s in at least 7 scenes, and there are several narrated-but-not-shown moments (a_res 21 s, a_gat 54.9 s, a_code 5.7 s). |
| Pacing | ×2 | 5 | ≤ 6 | **10 / 20** | Speech rate is comfortable (≤ 172 wpm per beat). But 53 dead stretches make the video feel padded: about 17 min for content that could run 12–13 min. One over-dense sentence sits in a_readout. |
| Motion quality | ×1 | 5 | ≤ 6 | **5 / 10** | Almost everything is a cross-fade. Carried motion exists only for the conv kernel slide, pool compaction, the HS-GAL node merge and the transpose. Plus the HUD scrub at cuts. |
| Visual polish | ×1 | 6 | ≤ 6 | **6 / 10** | Consistent dark style and good type hierarchy. Against that: overlaps (conv label, SELU, a_start arrow), 18 px labels, frames using only a top band (a_overview, a_branch), and long text-table scenes. |
| **Total** | | | | **61 / 100** | **Rework the failing scenes** |

No dimension scores 8 or more, so no file citation for a high score is needed.

---

## 3. Per scene (what a viewer understands, and the biggest gap)

- **a_intro (49.5 s):** The viewer understands that AASIST sits after XLS-R and that it turns a 42×67 grid into spectral and temporal nodes plus a master node.
  - Gap: 447 K / 109 / 160 appear at 10–12 s, unnarrated. The F/N legend (39.4 s) is two abstract chips, not tied to the teaser grid or nodes; the 42 rows aren't tinted teal and the nodes aren't purple.
  - 40.5–49.3 s is static.
- **a_overview (74 s):** The viewer gets the 7-stage pipeline with a shape under each box.
  - Gap: a slideshow of tiny boxes in the top third of the frame. Each box holds 8–11 s with nothing else moving.
  - At 14.6–25 s the HUD says Pool 3×3 / B×1×42×67 while the voice says "linear layer → 128".
  - At 61.7–73.8 s the log-scale parameter bar draws AASIST at about 2/3 of XLS-R's length while the voice says "tiny".
- **a_start (73.9 s):** The viewer understands 64,600 samples → XLS-R → (B, 201, 1024) → LL → (B, 201, 128) and the (128, 1024) weight.
  - Gap: "output: (B, 201, 1024)" appears only at 25.7 s, although it is spoken at 16.8 s.
  - 46–73.7 s is one frame for 27 s (only a caption is added at 59.3 s).
  - The arrow collides with the "201" label. "Longer clips are cut" (12.3 s) is not shown.
- **a_image (90.8 s):** The viewer understands transpose → (B, 128, 201), unsqueeze → (B, 1, 128, 201), 3×3 max-pool → (B, 1, 42, 67), then BN + SELU.
  - Gap: the HUD shows B×1×128×201 from 3.3 s, before either op is spoken.
  - The pooling demo (43–66 s) is a 6×6 toy that is never related back to the 128×201 grid; the real grid never shrinks to 42×67.
  - The SELU card is static for 20 s (69.9–90.6 s) and the curve overflows its panel.
- **a_conv2d (73.2 s):** The viewer can follow a 2×3 kernel sliding over a 4×7 grid (the arithmetic checks out) and the (32, 32, 2, 3) weight.
  - Gap: the output-size label overlaps the output grid (10–37 s).
  - Padding is explained as formula cards only (43–72 s, static 44.8–60 s); no zero ring is ever drawn.
  - The 1 → 32 channel jump happens in the HUD at the cut, before any narration.
- **a_res (75 s):** The viewer understands the residual block with its 1×3 skip conv, the 6-block table 1 → 32 → 64 with H and W unchanged, the conv1(x) code quirk and the 211,072-parameter bar.
  - Gap: an empty frame at 20.5–22.5 s while "There are six blocks" is spoken, and a near-static block diagram from 5.1 to 20.6 s.
- **a_nodes (83.6 s):** The viewer understands that a softmax over time + weighted sum gives (B, 64, 42) → transpose → 42 spectral nodes (+ pos_S), that the same over F gives 67 temporal nodes, and that the original AASIST used max.
  - Gap: the x → 1×1 conv → w diagram is static for 18.5 s (2.9–21.4 s).
  - From 23 s the softmax highlight is drawn on **x** (teal/pink) after w (purple) has vanished, so the viewer can't tell which tensor is normalised and which is summed.
  - HUD B×67×64 contradicts the canvas (B, 64, 67) at 60.5 s.
- **a_gat (85.2 s):** The viewer knows the words: fully connected, pairwise product (B, 42, 42, 64), score map, temperature-2 softmax, W₁(A·X) + W₂X, BN, SELU.
  - Gap: the mechanism is never seen. The map pops in at 34.7 s and doesn't change at the softmax (45.9 s). Temperature (54.9 s) has no picture, and A·X (59.4–72.8 s) has no picture of neighbours flowing into a node.
  - The closing GAT_S/GAT_T card is static for 9 s (75.8–85 s).
- **a_pool (37.8 s):** Clear: sigmoid score bars, top half kept, 42 → 21 and 67 → 33, final shapes written.
  - Gap: "each kept node is multiplied by its score" (14.4 s) is not shown. The node circles don't dim or scale.
  - 23–37.6 s is mostly static.
- **a_hsgal (76.3 s):** The viewer understands that 33 temporal + 21 spectral nodes are stacked into 54, that the 54×54 map has T–T / S–S / cross blocks with their own scoring vectors and T = 100, that a master node collects a summary, and that the output is (B, 33, 32), (B, 21, 32) and (B, 1, 32).
  - Gap: 60.5–76 s is a single static projection card while a 3-shape sentence plays.
  - The "own linear layer per type" step (12.3 s) is not drawn.
  - The master's update to (B, 1, 32) isn't shown.
- **a_branch (47.2 s):** The viewer understands pool 21 → 10 and 33 → 16, HS-GAL 32 → 32 with a residual, two branches and an element-wise max.
  - Gap: small boxes in the top 40 % of the frame. The two branches start from separate "T 33, S 21" boxes instead of one input forking.
  - Element-wise max (32.6 s) is never shown on numbers.
- **a_readout (59.8 s):** The viewer understands max|·| and mean over nodes, 5 × 32 = 160, dropout → Linear → 2, and class 0 = spoof.
  - Gap: only out_T is drawn. S_max, S_avg and master appear as boxes with no source tensor.
  - The 34.3 s training sentence carries 6 facts.
  - "Two logits" is spoken over bars showing 0.12/0.88, which are probabilities.
  - 34.8–59.5 s is static.
- **a_orig (74.9 s):** The viewer can read the original AASIST shape table (sinc → (B, 1, 23, 21490) → … → (B, 64, 23, 29) → 11/20 nodes, 297,866 parameters).
  - Gap: the whole scene is a growing text table. The sinc filter bank is never drawn.
  - 5.0–22.8 s shows two rows for 18 s.
  - The HUD stage reads "XLS-R" during the sinc conv.
- **a_code (43.5 s):** The trace confirms every derived shape.
  - Gap: 1.8–21.3 s shows one terminal line while the narration describes the (B, 201, 1024) stub.
  - The trace text is about 18 px green-on-black with no colour coding.
- **a_recap (75.6 s):** A correct 9-row shape table plus a one-line key idea.
  - Gap: text only, with no return to the intro's grid → two node sets → master picture.
  - 54–70 s is static.

---

## 4. Factual check

The ground truth is the stubbed SSL-AASIST run. Every shape and count shown on screen was checked against it, and against the code the reviewer knows (SSL_Anti-spoofing model.py, clovaai AASIST.py, AASIST.conf).

| On screen | Truth | OK? |
|---|---|---|
| 64,600 samples ≈ 4.04 s; ⌊(64600 − 400)/320⌋ + 1 = 201; (B, 201, 1024) | 64600/16000 = 4.0375; 200.6 → 200 + 1 = 201 | ✓ |
| LL 1024 → 128, weight (128, 1024), 131,200 weights, (B, 201, 128) | 1024·128 + 128 = 131,200 | ✓ |
| transpose (B, 128, 201), unsqueeze (B, 1, 128, 201), max_pool (3, 3) → (B, 1, 42, 67) | ⌊128/3⌋ = 42, ⌊201/3⌋ = 67 | ✓ |
| first_bn BatchNorm2d(1) + SELU; λ 1.0507, α 1.6733, floor −1.758 | −λα = −1.7581 | ✓ |
| "each pooled cell covers 3 frames ≈ 60 ms" | 20 ms stride × 3 | ✓ |
| Toy conv 4×7 ⊛ 2×3 → 3×5 values (1.10, 1.25, 0.10, 0.85, −0.05, 0.15, … 1.75) | recomputed 7 cells, all correct | ✓ |
| conv1.weight (32, 32, 2, 3), 6,176 params; pad (1, 1) → 43, pad (0, 1) → 42 | 6144 + 32; 42 + 2 − 2 + 1 = 43, 43 − 2 + 1 = 42 | ✓ |
| Encoder filters 1 → 32 → 32 → 64 → 64 → 64 → 64, 1×3 skip conv on blocks 1 and 3, (B, 64, 42, 67), 211,072 | matches | ✓ |
| conv1 reads x, not bn1/selu output; "same in original AASIST" | true in both repos | ✓ |
| first_bn1 BatchNorm2d(64) + SELU after the encoder | matches | ✓ |
| Attention: 1×1 conv 64 → 128, SELU, BN, 1×1 128 → 64; 16,832 params | 8,320 + 256 + 8,256 | ✓ |
| e_S = Σ softmax(w, −1)·x over time → (B, 64, 42) → (B, 42, 64) + pos_S (1, 42, 64) | dim −1 = time | ✓ |
| e_T = Σ softmax(w, −2)·x over F → (B, 64, 67) → (B, 67, 64), no pos embedding | matches | ✓ |
| Original AASIST: max\|·\| over time / F | matches | ✓ |
| GAT: pairwise product (B, 42, 42, 64), tanh(Linear 64 → 64)·a, ÷ T = 2, softmax over nodes, W₁(A·X) + W₂X, BN1d(64), SELU, 12,672 params; GAT_T same with 67 | 4 × 4,160 + 64 + 128 = 12,672; ×2 = 25,344 | ✓ |
| Pool: sigmoid(Linear 64 → 1), top-k ratio 0.5, h·score; 42 → 21, 67 → 33 | int(21.0), int(33.5) | ✓ (see note 1) |
| HS-GAL: T first then S, separate proj_type1/2, 54 nodes, att_weight11/22/12 (12 shared by T–S and S–T), T = 100, master learned (1, 1, 64), out (B, 33, 32), (B, 21, 32), (B, 1, 32) | matches the ST11 call order | ✓ |
| HS-GAL ×4 = 59,264 params | 20,992 (64 → 32) + 8,640 (32 → 32), ×2 branches | ✓ |
| Branch: pool 21 → 10, 33 → 16; ST12 32 → 32 + residual (nodes and master); 2 branches, element-wise max | matches | ✓ |
| Readout: [T_max, T_avg, S_max, S_avg, master] = 160; dropout 0.5; Linear(160, 2); class 0 spoof / 1 bona fide | matches | ✓ (see note 2) |
| CE weights [0.1, 0.9], Adam lr 1e-6, batch 14, RawBoost | SSL recipe | ✓ |
| Parameter breakdown 211,072 + 131,200 + 59,264 + 25,344 + 16,832 + 3,530 = 447,242 | sums exactly | ✓ |
| Intro 447 K / 109 = 42 + 67 / 160; overview "16 + 10 + 1", (B, 2) | matches | ✓ |
| Original AASIST: sinc 70 × 129 taps → (B, 70, 64472); \|·\| + pool 3×3 → (B, 1, 23, 21490); per-block (1, 3) pool 21490 → 7163 → 2387 → 795 → 265 → 88 → 29; (B, 64, 23, 29); e_S (B, 23, 64), e_T (B, 29, 64); pool 0.5/0.7 → 11 and 20; 297,866 params | 128 taps made odd → 129; int(29 × 0.7) = 20 | ✓ |
| Code trace (a_code 37.8 s) | identical to the ground-truth listing | ✓ |
| XLS-R 300M = 315,438,720 (a_overview 61.7 s) | not in the ground truth; plausible (≈ 315 M) but unverified here | ? |

Notes:
1. `torch.topk` returns the kept indices **sorted by score**, so after pooling the nodes come out in score order, not time/row order. The a_pool and a_branch animations keep the original order. This is harmless for the shapes but worth a footnote, because it means temporal nodes lose their time ordering after pooling.
2. a_readout 25.5 s: the narration says "two logits" but the bars show 0.12 / 0.88, which sum to 1 and are therefore softmax probabilities. Either show raw logits and then a "softmax →" step, or say "two scores".

No factual errors in the shapes or parameter counts. Pronunciation and the name "A-assist" were not judged (audio only).

---

## 5. Ten worst problems (worst first), each with a concrete fix

1. **a_gat 34.7–72.8 s: the core of graph attention is never pictured** (E3/E4/E1). The score map pops in, the softmax and temperature change nothing, and A·X is two static grids.
   - **Fix:** use the 8-node graph throughout and put an **8×8** map beside it, labelled "real model: 42×42".
   - **34.7 s:** the 6-cell pair vector (node 2 ⊙ node 6) flies through a small "tanh(Linear)" box, then "· a" collapses it to one number. That number lands in cell (2, 6) of the map, which lights up, and the yellow edge 2–6 is drawn with that value.
   - **45.9 s:** highlight one column of the map with a vertical box labelled "softmax over this axis". Replace it with bars that sum to 1, and scale the edge widths in the graph to match.
   - **54.9 s:** show that column twice, as "T = 2" (one tall bar) and "T = 100" (flat bars).
   - **59.4 s:** pick node 3. Draw arrows from every node into it, thickness = weight, and form A·X row 3 as a weighted sum of X's rows. Then add W₂·x₃ as a separate skip arrow, then BN → SELU.
2. **The HUD is out of sync across the video** (E1/E9). It skips Linear in a_overview at 14.6 s and leads by 5–10 s at a_image 3.3, a_nodes 23.1/51.7, a_pool 14.4, a_branch 1.1, a_readout 16.6 and a_orig 58.4 s. It scrubs through stages at cuts (cut-02, cut-12). It contradicts the canvas at a_nodes 60.5 s.
   - **Fix:** key every HUD change to the word timestamp where the new shape is spoken, or to the moment the canvas draws it, whichever is later.
   - In a_overview, step the HUD through all 7 boxes as each box lights up (include B×201×128).
   - At chapter cuts, cut the HUD to the new value while the chapter card is opaque; don't tween through intermediate stages.
   - In a_nodes, keep the HUD on (B, 64, 67) until the transpose is shown at 62.7 s.
3. **Long dead stretches** (E8; 53 listed). Give each a new visual at least every 5 s:
   - a_code 1.8–21.3 s: print trace lines in step with the words (see #8).
   - a_nodes 2.9–21.4 s: animate one pixel's 64-value column passing through 64 → 128 → 64 and becoming one purple cell of w; then sweep the conv across the grid.
   - a_orig 5–22.8 s: draw the sinc filters (see #9).
   - a_res 5.1–20.6 s: run a mini tensor along the block's main path and the skip path, meeting at ⊕.
   - a_hsgal 60.5–76 s: split the 54-row output into 33 and 21 as each is spoken, then drop the master in.
   - a_conv2d 44.8–60 s: animate the padding (see #6).
   - a_start 46–73.7 s and a_recap 54–70 s: cut the holds or add the end-to-end tensor flow.
4. **a_nodes 22–67 s: the softmax is drawn on x instead of w, so "weights × features, summed" is never visible** (E3).
   - **Fix:** at 23.1 s keep w (purple) above and x (teal/pink) below, aligned. Highlight a row of w labelled "softmax → sums to 1", multiply it cell by cell with the same row of x, and collapse the product to one cell of the result column labelled "Σ over 67 frames".
   - Draw the result as a 42-tall column stacked ×64 deep, labelled (B, 64, 42), so the channel axis doesn't vanish.
   - Repeat with a column of w for the temporal view at 51.7 s.
5. **a_overview 0–74 s: a slideshow of tiny boxes in the top third, with a misleading parameter bar.**
   - **Fix:** double the box size and centre the row vertically. Under each box draw a 60 px thumbnail of its tensor (sequence strip, small image, node dots, 160-strip). Dim inactive boxes, and keep sub-labels ≥ 24 px.
   - At 61.7 s replace the log-scale bars with a linear comparison (a 1-px AASIST sliver next to a full XLS-R bar, "0.14 %"), or label the axis "log scale: AASIST is 700× smaller".
6. **a_conv2d: overlapping label at 10–37 s, and padding never pictured at 43–72 s** (E7/E4).
   - **Fix:** move "output: 3 × 5 = (4 − 2 + 1) × (7 − 3 + 1)" under the output grid, at least 16 px clear.
   - **49.9 s:** put a ring of grey "0" cells around the 4×7 toy grid (pad (1, 1)), slide the 2×3 kernel and count 5 output rows → "height + 1". Then at 61 s remove the top and bottom zero rows (pad (0, 1)) → height back. Let the HUD's 43/42 change at those two moments.
7. **a_readout: an over-dense training sentence at 34.3–45.4 s (E5), "logits" shown as probabilities at 25.5 s, and the spectral/master readout not drawn at 16.6 s.**
   - **Fix:** split the sentence into "loss" and "optimiser" halves. Reveal a 4-row card at ≥ 24 px (loss: cross-entropy, weights spoof 0.1 / bona fide 0.9; Adam, lr 1e-6; batch 14 clips; RawBoost augmentation), one row per phrase. Narrate RawBoost or drop it.
   - Show two raw logits (e.g. −1.3, +0.7) → "softmax" → 0.12 / 0.88.
   - At 16.6 s slide out_T out and bring in out_S (10×32) and the master (1×32) grid, each with its own arrows into S_max, S_avg and master.
8. **a_code 1.8–21.3 s: the stub shape is spoken but not shown (E2), on a near-empty terminal.**
   - **Fix:** at 5.7 s type `xls_r = stub → (2, 201, 1024)` as the second line, then print each trace line as it is mentioned (LL / first_bn / encoder at 17 s, nodes at 24 s, HS-GAL at 28.6 s).
   - Colour the dims with the episode palette (B green, 201 blue, 1024 orange, 42 teal, 67 blue) and raise the trace font to ≥ 22 px.
9. **a_orig 0–75 s: a text-only comparison; the sinc conv is never drawn; the HUD stage label is wrong** (E4/E1).
   - **Fix:** at 7.7 s draw 4 example sinc kernels (wiggly time-domain shapes) next to their frequency bands on a 0–8 kHz axis. Slide one over the waveform to produce one row, then stack 70 rows into a 70×64472 "spectrogram-like" image. Only then add the table row.
   - Add a right-hand column with the SSL-AASIST value per row and highlight the differences (sinc vs XLS-R, max vs learned attention, 0.7 vs 0.5 pool).
   - Rename the HUD stages for this scene ("Sinc conv", not "XLS-R"/"Linear").
10. **The axis colour legend is inconsistent** (Shapes).
    - The intro (39.4 s) promises "teal F = feature rows, purple N = graph nodes". After that, spectral node counts are teal (42, 21, 10), temporal counts are blue (67, 33, 16) and only 54 is purple. "Feature" is used both for the F rows (42) and for the 64 numbers per node (orange).
    - **Fix:** once a set becomes nodes, colour its count purple everywhere (HUD and canvas: (B, **42**, 64), (B, **67**, 64), B×**42**×**42**×1, …). Optionally use a teal or blue outline to say which view the nodes came from.
    - Name the orange 64 "channels" (not "features") every time. In a_nodes 51.7 s say "along the F axis (the feature rows)".
    - In the intro, tint the teaser grid's rows teal and its nodes purple while the legend is read.

---

## 6. Also worth fixing

- **a_res 20.5–22.5 s:** empty frame on "There are six blocks". Shrink the block diagram into row 1 of the table instead of fading out.
- **a_start 17–26 s:** the XLS-R box appears at 19 s and "output: (B, 201, 1024)" at 25.7 s, but both are spoken at 16.8 s. "Longer clips are cut" (12.3 s) is never shown; draw a long clip with the excess greyed out.
- **a_start 36.9–73 s:** shorten the LL output arrow so it stops before the "201" label.
- **a_image 67.5–90 s:** clip the SELU curve to its panel, move the "SELU" label off the curve and enlarge the "−1.758" floor label. BN is a one-line text: add a 3-bar "per-channel mean/variance → normalise" mini picture or a histogram before and after.
- **a_image 43–66 s:** after the 6×6 toy, morph the real 128×201 grid into 42×67 so the pooling applies to *our* tensor.
- **a_image HUD:** it shows stage "02/08 Linear" while holding the post-transpose image shape. Rename the stage or advance it.
- **a_conv2d at the cut (cut-04):** the HUD jumps from 1 to 32 channels without narration. Say "the first block lifts 1 channel to 32" or keep B×1×42×67 until a_res.
- **a_nodes 58.3–67 s:** move "67" off the arrow. The temporal nodes are bare circles while the spectral nodes showed feature rows; draw them consistently.
- **a_nodes / a_gat HUD:** shows only the spectral tensor (B×42×64) while two parallel streams exist. Show both chips, as a_hsgal does.
- **a_gat:** the graph has 8 nodes but the map is labelled 42×42. Add "8 shown / 42 real". The closing GAT_S/GAT_T card (75.8–85 s) is static for 9 s; cut it to 3 s.
- **a_pool 14.4 s:** visibly scale or dim each kept node by its score. Optional footnote: top-k returns nodes sorted by score.
- **a_hsgal 12.3 s:** draw two small "Linear (T)" and "Linear (S)" boxes the two groups pass through before stacking. Show the master update: master + attention-weighted sum → (B, 1, 32).
- **a_hsgal 59.5 s:** the HUD chip transition overlaps and pokes out of the bar; use a cross-fade in place.
- **a_branch:** draw one "T 33, S 21" input that forks into the two branches. At 32.6 s show the element-wise max on two 4-number vectors (e.g. [0.2, 0.9, −0.1, 0.4] vs [0.5, 0.3, 0.0, 0.1] → [0.5, 0.9, 0.0, 0.4]). Use the lower 60 % of the frame and enlarge the boxes; sub-labels are 18.7 px ("32 → 32, + residual").
- **a_readout 3.3–21 s:** end the "max \|·\| over nodes" and "mean over nodes" arrows on the T_max and T_avg boxes, and highlight the 16-axis as it collapses.
- **a_overview 52.7 s and other HUD transitions:** ghost chips stack above the bar during slides.
- **Metrics small text:** "SELU · BN · 1×1 conv 128→64" (a_nodes, 17.3 px), "→ BN → SELU (64 → 32)" (a_hsgal, 18.7 px), "ORIGINAL AASIST" HUD tag (a_orig, 15 px), "24 layers · hidden 1024" (a_start, 18.7 px). Raise to ≥ 22 px. The dim grey parameter numbers inside the a_res bar (73.9 s) are nearly invisible.
- **a_intro 10–12 s:** 447 K / 109 / 160 appear without narration. Either name them in one clause or hold them until the overview.
- **a_recap:** end on the intro picture (grid → spectral + temporal nodes → master → 160 → 2) with the shapes attached, rather than only a table. 54–70 s can lose 10 s.
- **Total runtime:** cutting the dead tails listed in E8 alone would remove about 3–4 minutes with no loss of content.
