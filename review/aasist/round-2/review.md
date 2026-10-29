# Review: Episode 2, "AASIST back-end" (round 2)

**Total: 67 / 100. Verdict: rework the failing scenes (< 70).**

Reviewer: fresh context. I watched only `review/aasist/round-2/` (15 storyboards, 15 motion strips, 14 cut strips, metrics.md) and the rubric. Times below are scene-relative unless marked "global".

What the score means: the content is very good. Every number on screen matches the authors' code, the HUD shows a colour-coded shape at every step, and the toy examples are worked out correctly. But five rubric caps fire, and each one comes from a small, local problem: long static stretches, a few visuals that arrive early or late, one spoken shape that is never written, short-lived footnotes that carry meaning, and one moving element covering a label. Without the caps this would score about 84 (Clarity 8, Shapes 9, Sync 7, Pacing 7, Motion 7, Polish 7). Fixing the ten problems listed below should move it into "ship".

---

## 1. Defects

| # | Defect | Result | Evidence (file · time) |
|---|---|---|---|
| E1 | Narration and picture out of sync | **FAIL** | `storyboard-07-a_gat` 16.8 s: the node 2 ⊙ node 6 product row appears while the narrator is still saying "Graph attention decides how much each connection matters…". The sentence that describes it ("multiplies their two vectors element by element") only starts at 21.3 s, so the picture is 4.5 s early. `storyboard-09-a_hsgal` 5.6–10.2 s: the narrator says HS-GAL "puts the spectral and temporal nodes into one graph", but two separate node sets stay on screen until the merge at 16.9 s. The 54×54 graph map only arrives at 28.2 s. `storyboard-06-a_nodes` 69.3–80.3 s: the comparison cards are empty while their sentences are spoken; each fills 2–4 s late. Smaller lags of about 2 s: `a_orig` 16.5 s (B,70,64472 appears at 18.7 s), `a_conv2d` 38.8 s (the frame is fading while "The length rule applies to each axis separately" is spoken; the formula arrives at 41.1 s), `a_overview` 52.7 s (the readout box arrives at 54.9 s), `a_image` 68.3 s and `a_gat` 77.3 s (fully blank frames under the sentence). |
| E2 | A shape is spoken but not written, or written too small | **FAIL** | `storyboard-01-a_overview` 52.7–61.7 s: "squeezes everything into one hundred and sixty numbers" is spoken, but the Readout box only says "max, mean → Linear" and "(B, 2)", and the HUD reads B·2. The number 160 never appears in this scene. Borderline size: box subtitles such as "1024 → 128" and "6 residual blocks" are dim grey at about 13–15 px (1080p), and the `a_code` trace text is about 15 px inside a mostly empty panel. Every other spoken shape in the episode is written on screen. |
| E3 | A transformation with no clear before → after axis | PASS | This is handled well throughout. `a_image` 3.4→7.8 s: the grid rotates from 201×128 to height 128 × width 201. `a_start` 51.8 s: "frame 7 stays frame 7: only its 1024 numbers become 128". `a_image` 54.9→61.6 s: the thumbnail shrinks 128×201 → 42×201 → 42×67, one axis at a time. `a_nodes` 23–34 s: the row softmax and "Σ over 67 frames" are highlighted. One note: in `a_gat` the softmax is labelled down a column, but the aggregation then uses a row (see factual check, item F1). |
| E4 | A concept used before it is explained, or explained in one sentence with no picture | **FAIL** (minor) | `storyboard-11-a_readout` 25.6 s: "After dropout" and the box "dropout(0.5)" are never explained. 43.4 s: "RawBoost data augmentation" is never explained. `storyboard-05-a_res` 70.4 s: the parameter legend names "pos_S" and "masters" before either is introduced (`a_nodes` 42.9 s and `a_hsgal` 50.8 s). The legend also says "HS-GAL ×4", while the overview (43.7 s) says "HS-GAL ×2". |
| E5 | > 3 new numbers in 10 s, a beat > 175 wpm, or meaningful text shown too briefly | **FAIL** | The highest beat rate is 158 wpm (`a_res`, `a_intro`, `a_gat`, `a_code`), which is fine. `storyboard-05-a_res` 66.0–70.4 s: seven numbers land in about 4 s (211,072 · 131,200 · 59,264 · 25,344 · 16,832 · 3,530 · 447,242). metrics.md lists meaningful text shown too briefly: `a_image` "each pooled cell covers 3 frames = 60 ms" (2.75 s on screen, needs 3.8 s, not narrated) and "before: mean 1.38, std 0.49" (2.25 s, needs 2.8 s); `a_pool` "topk returns the kept nodes sorted by score…" (7.5 s, needs 7.8 s, tiny grey, not narrated). |
| E6 | Camera moves or 3-D perspective while text must be read | PASS | No camera moves in any motion strip. The only depth effect is the static "×64 channels" stack in `a_nodes`. |
| E7 | Text overlapping text or shapes, or content cut off | **FAIL** (minor) | `storyboard-06-a_nodes` 7.7 s: the moving channel vector sits on "1×1 conv 128 → 64" and covers the "64" exactly as "…to sixty-four channels" is spoken. `motion-00-a_intro` b2 +0.25: the pipeline line "waveform → XLS-R → AASIST…" crossfades under the HUD. `cut-13` +0.15–0.60: the chapter-13 title sits inside the faint outline of the code panel. |
| E8 | A dead stretch > 6 s, or a cluttered frame | **FAIL** | metrics.md lists 33 stretches. The ones that happen while the narration moves on: `a_gat` 2.7–14.5 s (11.8 s: the 8-node graph does not change across two sentences) and 15.45–26.65 s (11.2 s: the same product row stays up across three sentences); `a_hsgal` 2.75–12.75 s (10 s) and 28.25–37.75 s (9.5 s: the block map is static, with three empty legend squares, while the blocks are named); `a_overview` 2.95–13.15 s (10.2 s: only the XLS-R box); `a_start` 60.2–74.7 s (14.5 s: the end-to-end box with one late label). Most of the other stretches are end-of-scene holds, which are fine. |
| E9 | An element pops in fully formed, jitters, or moves brokenly | PASS | Elements fade or scale in. The kernel window steps cell by cell. Nothing jitters in any motion strip. The only small colour pop is `motion-11-a_readout` b1 +0.75→+1.00, where the out_S tile is tinted teal and then recolours. |

## 2. Scorecard

| Dimension | Raw | Cap | Score | × | Points |
|---|---|---|---|---|---|
| Concept clarity | 8 | ≤ 6 (E4, E8) | 6 | 3 | 18 |
| Tensor-shape legibility | 9 | ≤ 6 (E2) | 6 | 2 | 12 |
| Narration–visual sync | 7 | ≤ 6 (E1) | 6 | 2 | 12 |
| Pacing | 6 | ≤ 6 (E5) | 6 | 2 | 12 |
| Motion quality | 7 | — | 7 | 1 | 7 |
| Visual polish | 6 | ≤ 6 (E7) | 6 | 1 | 6 |
| **Total** | | | | | **67** |

Where the raw scores come from:
- **Clarity 8.** Each scene builds on the one before, from LL to image to conv to residual to nodes to GAT to pool to HS-GAL to branches to readout, and the toy examples are all correct. Judged from `storyboard-04-a_conv2d`, `storyboard-06-a_nodes` and `storyboard-07-a_gat`.
- **Shapes 9.** The HUD is always present, and F (teal), T (blue), N (purple) and C (orange) are colour-coded consistently. Judged from `storyboard-03-a_image` and `storyboard-13-a_code`.
- **Sync 7.** Usually tight, but with the misses listed under E1.
- **Pacing 6.** Many mid-explanation static stretches, plus the a_res number dump.
- **Motion 7.** Good, purposeful moves: the transposing grid, travelling dots on the arrows, the sliding kernel, branch 1 sliding up as branch 2 appears (`motion-10` b2). But layout changes usually fade to an empty frame instead of carrying elements to their new place (`motion-05` b1–b3, `motion-06` b1/b4, `motion-09` b2–b4, `motion-12` b2–b3).
- **Polish 6.** The style is consistent and the cuts are clean (`cut-01`…`cut-14`). Against that: empty placeholder panels, tiny grey footnotes that carry meaning, 17 px HUD labels, a 9-box HUD in a_hsgal and a_branch, and many frames that only use the top half.

## 3. Per scene (what a viewer takes away · biggest gap)

- **a_intro**: AASIST is a small (447 K) graph-attention back-end on top of XLS-R, with new axes F and N. Gap: from 3.4 s a "42 rows × 67 frames" grid sits next to a HUD reading B·201·1024 with nothing connecting the two, and 8.75–15 s is static while the citations are read.
- **a_overview**: the 8-stage pipeline with a shape under each box, and the back-end is about 700× smaller than XLS-R. Gap: 52.7–61.7 s, "one hundred and sixty numbers" is never written. The graph box says "HS-GAL ×2", which conflicts with "HS-GAL ×4" in a_res 70.4 s. 3–13 s is one box for 10 s.
- **a_start**: the 64,600-sample crop, cut or repeat, ⌊(64600−400)/320⌋+1 = 201, LL 1024→128 with "frame 7 stays frame 7", and 131,200 weights. Gap: 60.6–69.4 s the end-to-end fine-tuning box is static, and the gradient label only appears at 69.4 s.
- **a_image**: transpose to (B,128,201), unsqueeze to (B,1,128,201), the (batch, channels, height, width) layout, why the code says "spectral", a 3×3 max-pool toy, then 42×67, BN and SELU. Gap: 66–68.7 s the 60 ms-per-cell note is visible 2.75 s and not narrated; 68.3 s is blank under "Then batch normalization and a SELU activation"; 19–25.7 s the info box is shown empty.
- **a_conv2d**: a 2-D conv on a toy 4×7 input with a 2×3 kernel gives 3×5; weight (32,32,2,3) has 6,176 numbers; padding takes 42→43→42. Gap: 38.8–41 s the formula sentence plays over a fading frame. From 23.3 s the HUD shows B·32·42·67 for an example layer, while the real encoder input is B·1·42·67; the explaining label "A 32 → 32 LAYER" is 17 px.
- **a_res**: the residual block, the 1×3 skip conv when channels change, the six-block table (all at 42×67), the bn1/selu code quirk, first_bn1, encoder 211,072 of 447,242. Gap: 66–70.4 s seven numbers arrive at once with a small grey legend that uses terms not yet defined.
- **a_nodes**: the attention map from 1×1 convs; spectral = softmax over T, sum → (B,64,42) → 42 nodes + pos_S; temporal = softmax over F → 67 nodes; the original AASIST uses max instead. Gap: at 7.7 s the moving vector covers "→ 64"; 69.3–80.3 s the comparison cards fill 2–4 s after their sentences.
- **a_gat**: a fully connected graph, pairwise products, tanh(Linear)·a → score, a 42×42 map, ÷T with a softmax and the T = 0.5 / 2 / 100 comparison, W₁(A·X) + W₂X, BN + SELU, 12,672 params. Gap: 2.7–26.7 s is mostly static and the product row comes 4.5 s early. The weights are labelled "softmax down this column" for node 6, then the aggregation uses "A·X, row 3" for node 3, so a newcomer can't tell whether a node's weights are its row or its column.
- **a_pool**: a sigmoid score per node, keep the top half, multiply by the score, 42→21 and 67→33 (rounded down). Gap: the point that the survivors come out in score order, not time order, is only a tiny grey footnote at 31–38.5 s.
- **a_hsgal**: 33 + 21 nodes stacked into 54, a 54×54 block map with three scoring vectors, temperature 100, the master node, 64→32, then split back into (B,33,32), (B,21,32), (B,1,32). Gap: 3.4–16.9 s says "one graph" while two separate sets sit static. At 28–37.75 s the blocks are named but never highlighted. The pair-product / tanh(Linear 64→32) step is not shown, so "32 → 1" in the legend has no visible 32.
- **a_branch**: HS-GAL → pool (21→10, 33→16) → HS-GAL 32→32 + residual, built twice, combined by element-wise max (correct toy). Gap: small. "master updated the same way" is only small grey text, and the HUD holds 9 boxes.
- **a_readout**: max|·| and mean over T and S, plus the master, gives 160; then dropout, Linear 160→2, softmax 0.12 / 0.88, class 0 = spoof; the training recipe; the output is always 160 whatever the node count. Gap: the "training" panel is empty for 25.6–36.7 s, and dropout and RawBoost are named without explanation.
- **a_orig**: the original AASIST reads raw audio: sinc 70×129 → (B,70,64472) → (B,1,23,21490), width ÷3 per block down to 29, 23+29 nodes, pools 0.5 / 0.7 → 11 / 20, 297,866 params; then a side-by-side table. Gap: 16.5 s and 23.1 s, the shapes land about 2 s after they are spoken, and the table text is small.
- **a_code**: a batch-2 trace from the authors' code reproduces every shape and 447,242. Gap: the code panel is empty from 3.4–8.0 s, the trace text is about 15 px, and at 17.2 s the HUD jumps to ResBlocks before the LL, first_bn and encoder lines are printed (19.5–21.7 s).
- **a_recap**: one row per step with shapes, the key-idea diagram, and the teaser for the next episode. Gap: 5.6–12.4 s shows a single row for about 7 s; the bottom half of the frame is empty while the table text is small; at 59.7 s the arrows around "M — 160 — 2 scores" make the flow direction unclear.

## 4. Factual check (against the authors' SSL-AASIST code)

Correct on screen:
- input (B,201,1024)
- LL 1024→128, with 131,200 weights
- transpose + unsqueeze → (B,1,128,201), max_pool (3,3) → (B,1,42,67), BatchNorm2d(1) + SELU (λ 1.0507, α 1.6733, floor −1.758)
- encoder filters 1→32, 32→32, 32→64, 64→64 ×3; kernels (2,3); conv1 pad (1,1), conv2 pad (0,1); 42→43→42; 1×3 skip conv in blocks 1 and 3; the "conv1 reads x" quirk, present in both codebases
- encoder 211,072 params, (B,64,42,67)
- attention 1×1 64→128, SELU, BN, 1×1 128→64 (16,832 params); softmax over T for spectral and over F for temporal; pos_S (1,42,64) on spectral only
- GAT: pair products, tanh(Linear 64→64)·a, ÷2, W₁(A·X) + W₂X, BN, SELU; 12,672 per layer (25,344 for both)
- pool k = 0.5 by sigmoid score, kept × score: 42→21, 67→33; top-k sorted order
- HS-GAL: proj_type1/2, 54 nodes, att_weight11/22/12, temperature 100, master (1,1,64), 64→32, (B,33,32) (B,21,32) (B,1,32)
- pool_hS1/hT1 10 / 16; ST12 with residual, including the master
- two branches with separate weights and masters, element-wise max
- readout [T_max, T_avg, S_max, S_avg, master] = 160, dropout 0.5, Linear 160→2; class 0 = spoof
- CE weights 0.1 / 0.9, Adam 1e-6, batch 14, RawBoost
- back-end 447,242; original AASIST 297,866; HS-GAL ×4 = 59,264 and "pools, BN, pos_S, masters, out" = 3,530, both of which add up
- original AASIST: sinc 70×129, 64,472, 23×21,490, widths 7,163 / 2,387 / 795 / 265 / 88 / 29, 23 + 29 nodes, ratios 0.5 / 0.7 → 11 / 20
- toy arithmetic checked: the conv outputs (1.10, 1.25, 0.15, 1.75), the max-pool (9, 9, 9, 8), the pair product row, the branch max, and softmax(−1.3, 0.7) = 0.12 / 0.88
- citations: Jung et al. ICASSP 2022; Tak et al. Odyssey 2022

Problems:
- **F1 (a_gat 48.2–75 s): softmax axis.** The code's softmax runs over dim −2 of a (B,N,N,1) tensor, which is the j axis, so each row i sums to 1. The aggregation A·X then uses row i, and the video's own "A·X, row 3" matches that. But the map is labelled "softmax down this column: sums to 1", with a column highlighted. Because the scores are symmetric, the numbers shown happen to be right, but the picture is the transpose of the code and contradicts the next beat. Change it to "softmax along row i".
- **F2 (a_gat 61.6 s): toy weights.** The eight toy weights for node 3 sum to 0.96 (0.13 + 0.05 + 0.06 + 0.04 + 0.03 + 0.15 + 0.22 + 0.28), not 1.00. The focus node also switches from node 6 to node 3 without comment.
- **F3 (a_overview 43.7 s): HS-GAL count.** "HS-GAL ×2" understates the four HS-GAL layers. a_res says ×4. Write "2 branches × 2 HS-GAL".
- **F4 (a_hsgal 37–46 s): missing projection step.** The scoring vectors are shown as "(32 → 1)", but the step that makes the 32-dim pair vectors (pair product → tanh(att_proj 64→32)) is never shown.
- **F5 (a_res 61.5 s): first_bn1.** This step is not in the ground-truth listing. It is consistent with the 3,530 parameter remainder, so I treat it as correct.

## 5. Ten worst problems (worst first)

1. **a_gat 2.7–26.7 s: static graph, then the product arrives early.** About 23 s of almost no change across five sentences. The node 2 ⊙ node 6 row appears at 16.8 s, 4.5 s before "multiplies their two vectors element by element" (21.3 s). **Fix:** draw the edges on "connections between them" (3.4 s) and pulse random edges during "every node may exchange information". Hold the product row until 21.3 s, then multiply it cell by cell in time with the sentence. Then sweep the highlight over several other pairs as "all pairs: (B, 42, 42, 64)" appears.
2. **a_hsgal 3.4–16.9 s: the narration says "one graph" but the screen shows two separate sets for about 13 s.** **Fix:** at 5.6 s pass each set through its proj_type box and slide both into the single 54-node row, with a few cross-type edges. Bring the stacked label "(B, 54, 64)" in at the end of the "stacked along the node axis" sentence, not after it.
3. **a_gat 48.2–75 s: row/column contradiction (F1, F2).** **Fix:** use one node, say node 3, in both beats. Highlight row 3 with "softmax along row i: node i's weights over every j sum to 1", then reuse that same row as the Σ weights in "A·X, row 3". Make the toy weights sum to exactly 1.00.
4. **a_hsgal 28.2–37.75 s: static block map with empty legend squares while the blocks are named.** **Fix:** light up the T-T block, then S-S, then both cross blocks, as each is spoken. Fill each legend row at the same moment and delete the empty squares. Before the legend, insert a 3 s beat: pair product → tanh(Linear 64→32) → · att_weight (F4).
5. **a_res 66.0–74.9 s: seven parameter counts in about 4 s, plus a small grey legend that uses undefined terms (E5, E4).** **Fix:** here, reveal only "encoder 211,072 of 447,242" while it is narrated. Move the full breakdown (LL, HS-GAL ×4, GAT ×2, attention convs, remainder) to a_code or the recap, revealed one segment per beat, with labels on the thin segments. Drop "pos_S" and "masters" from this scene.
6. **a_image 66.0–75 s: briefly shown meaningful text and a blank frame.** "each pooled cell covers 3 frames = 60 ms" is up 2.75 s and not narrated; "before: mean 1.38, std 0.49" is up 2.25 s; the frame at 68.3 s is empty under "Then batch normalization and a SELU activation". **Fix:** narrate the 60 ms point or hold it for at least 4 s. Show the "before" and "after" stats side by side for the whole BN beat. Start fading the BN/SELU panel in 0.5 s before its sentence.
7. **a_overview 52.7–61.7 s: "160" spoken but never written (E2), the readout box about 2 s late, and the "HS-GAL ×2" mismatch (F3).** **Fix:** make the box read "max, mean, master → 160 → Linear → (B, 2)", time its entrance to "Finally, a readout…", and relabel the graph box "GAT, pool, 2 branches × 2 HS-GAL".
8. **Empty placeholder panels across scenes (polish and sync):** a_image 19.0–25.7 s (empty info box); a_readout 25.6–36.7 s (empty "training" panel); a_nodes 71.5–80.3 s (empty comparison cards, each filled 2–4 s after its sentence); a_code 3.4–8.0 s (empty code panel). **Fix:** fade each panel in together with its first line of content, at the start of the sentence that fills it.
9. **a_nodes 7.7 s: the moving channel vector covers "→ 64" exactly as it is spoken (E7). At b1, w jumps from the right to the top left through a fade.** **Fix:** route the vector above or below the box, or draw it behind the text layer. Animate w physically sliding into its stacked position above x, so the viewer sees it is the same tensor.
10. **Fade-to-empty beat changes cause repeated lags of about 2 s:** a_conv2d 38.8 s (formula at 41.1 s), a_gat 77.3 s (blank under "temporal nodes get their own…"), a_orig 16.5 s and 23.1 s (shapes after the words), a_code 17.2 s (the HUD runs ahead of the trace). **Fix:** overlap the outgoing and incoming beats by about 0.3 s instead of passing through an empty frame, start each beat's visual 0.3–0.5 s before its sentence, and update the HUD only when the matching shape appears on the canvas.

## 6. Also worth fixing

- **a_pool 31–38.5 s:** narrate "top-k returns survivors in score order, not time order" or make the footnote readable (it is currently tiny grey text). The score labels under the bars are about 13 px.
- **HUD:** raise the 17 px labels (A 32 → 32 LAYER, SPECTRAL / TEMPORAL SUMMARY, ATTENTION WEIGHTS, TEMPORAL · SPECTRAL, ORIGINAL AASIST, TRACE, BATCH OF 2) to at least 22 px. In a_hsgal and a_branch, group the 9-box HUD by set (T · S · M) with a small tag on each group.
- **a_conv2d 23.3–73 s:** the HUD shows B·32·42·67 for an example layer. Either keep the real encoder input in the HUD or make "example 32→32 layer" prominent on the canvas.
- **a_readout 25.6 s and 43.4 s:** give dropout and RawBoost one picture each. For dropout, grey out a random half of the 160 cells with "training only". For RawBoost, show the waveform with random filtering and noise added.
- **a_nodes 80.3 s:** `softmaxₜ` uses a near-invisible Unicode subscript next to `softmax_F`. Use `softmax_T` and `softmax_F`.
- **a_res 41.4 s:** add the `if not self.first:` line to the code excerpt so that "each block after the first" is visible in the code.
- **a_intro 3.4 s:** label the preview grid "after pooling: 42 × 67", or introduce it after the HUD's B·201·1024, so the two shapes don't compete.
- **a_overview 3–13 s and a_recap 5.6–12.4 s:** a single element sits for 7–10 s. Bring the next box or row in sooner, or animate the 201×1024 grid while the frame counts are read.
- **a_start 60.6 s:** show the gradient arrow and its label together with "fine-tuned together", not 9 s later.
- **a_recap 59.7 s:** make the arrows flow one way (nodes + master → 160 → 2 scores).
- **Layout:** the overview, code panel and recap table use only the top 40–50 % of the frame. Scale them up and centre them so the text can grow.
- **a_orig:** mention the first_bn + SELU after the 3×3 pool so it matches the SSL path shown in a_image.
- **a_hsgal 50.8–57.6 s:** add "the master reads all nodes; nodes don't read the master in this layer", so the viewer doesn't assume it works both ways.
- **a_branch 23.6 s:** "master updated the same way" deserves a visible residual arrow on a master chip, not just small grey text.
