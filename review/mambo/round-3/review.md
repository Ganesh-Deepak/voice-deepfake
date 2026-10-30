# Review: Episode 3 "XLSR-MamBo", round 3

Reviewer with a fresh context. I looked only at this folder and `tools/review/rubric.md`: all 15 storyboards, all 15 motion strips, cut-01 to cut-14, and metrics.md/json. Small details were checked in PIL crops in the scratchpad (`review_crops/mambo3/`).
Times are **scene-relative** (the storyboard tile stamps) unless marked "abs". Scene starts (abs): intro 0, overview 54.3, front 143.5, inproj 182.3, stream 232.5, ssm 299.9, hydra 440.4, hshapes 503.4, swiglu 626.9, mha 670.6, stack 753.3, pool 784.1, train 838.2, code 893.9, recap 938.7. Total 16.95 min.

Not counted, as instructed: the CHAPTER NN/14 flashes, the storyboard's black timestamp box over the header, and the title-card words. That includes the "02" overlapping "Input and…" during each chapter-card animation.

---

## 1. Defects

| # | Defect | Verdict | Evidence |
|---|---|---|---|
| E1 | Narration vs. screen out of step | **PASS** (minor early reveals) | Mostly tight: every split label in storyboard-07 lands on its sentence (23.2–34.2 s), the trace lines in storyboard-13 land one per clause, and the recap rows in storyboard-14 land on their sentences. The misses are small and early, never late. swiglu 1.1–5.7 s: the HUD already reads B·208·**682** before "682" is said. hshapes 87.1 s: the side panel says "flip back, add, **+ D·x**" 6.7 s before D is explained (93.8 s). stream 55.0 s: the MamBo-1…4 rows appear 4.5 s before "MamBo one, two and four". hydra 32.7 s: the whole three-colour matrix is up before the voice fills it region by region (see E9). |
| E2 | Spoken shape not on screen / too small | **FAIL** | ssm 79.5–81.4 s (abs ≈380 s). metrics: "one frame: (" is shown **0.5 s, needs 1.8 s**. motion-05 b4 shows the "one frame: (128)" strip growing at once. By 81.4 s, while the voice says "each frame's one hundred and twenty-eight numbers are first expanded to 256", the only label left is "expanded × 2: (256)" and the HUD reads "MAMBA-2 4 × 64 per frame". No 128 is visible when 128 is spoken. Everywhere else shapes are written and legible: the HUD chips are about 24 px at 1080p, and metrics report 0 message texts under 20 px. |
| E3 | Transformation without the changing axis made clear | **FAIL** | hshapes 84.9 → 89.3 s. The HUD jumps from "SCAN OUTPUT **2B · 208 · 4 · 64**" to "FLIPPED BACK, ADDED **B · 208 · 256**" (crop hs_e). Two axes change at once. The voice explains only the flip-and-add (2B → B). The heads merging back (4 × 64 → 256) is never said or drawn. The scan-output rows at 84.9 s don't show the 4 head bands from "view as heads" (69.5 s), and "y" at 89.3 s has no axis labels. Second case: ssm 81 s, 128 → 256, where the before shape is gone before the after shape is discussed. |
| E4 | Concept used before it is explained | **FAIL** | ssm 63.6–79 s. "B_t (64): how x_t is written into the state" and "C_t (64): how the state is read out" appear as 64-long vectors while the state on screen is still **one number per frame** (the h row 0.30 … 1.27). The 64-dim, matrix-valued state is only introduced at 90.3 s ("state h (head 1) 64 × 64"), so a newcomer can't see what a 64-vector B writes into. Also stream 55 s: "Mamer" (MamBo-2/4 rows) is never defined, and "MLP" appears as a third name for SwiGLU/feed-forward ("N = 3 Hydra + MLP"). |
| E5 | > 3 new ideas or numbers per 10 s / > 175 wpm beat / meaningful text shorter than its reading time | **FAIL** | metrics "shorter than reading time": ssm "big Δ: decay 0.20, the old state is mostly forgotten…" **4.5 s vs 7.1 s**; ssm "one frame: (128)" **0.5 vs 1.8 s**; hshapes "y = forward + flip(backward)…" **4.75 vs 5.3 s**; ssm "small Δ: decay 0.74…" 5.0 vs 5.3 s. All carry meaning. Density: hshapes 16.5–36 s gives 128 → 776, z 256, xBC 512, Δ 8, "4 heads × 2 directions" in about 18 s. hshapes 45–60 s gives depthwise/512 own kernels, x 256, B/C 256, 64 each, fwd/bwd in about 13 s. ssm 81–100 s gives 128, 256, 4 heads, 64, 64 × 64 state. Beat wpm stays ≤ 164, but speech-only rates are 178–181 in m_inproj, m_ssm, m_hydra, m_hshapes and m_pool. |
| E6 | Camera move / 3-D while reading | **PASS** | No camera moves anywhere. The MHA score stack (mha 34.7–57 s) is a flat offset stack with upright labels. |
| E7 | Text overlapping text/shapes; cut off by frame/HUD | **FAIL** | swiglu 17.2–43 s (about 26 s): the "element by element" label runs through the purple 341 output bar (crop sw_a). swiglu 37.9–43 s: "128·682 + 341·128 + 128 (its RMSNorm)" ends about 4 px (tile) / 12 px (1080p) from the right frame edge, against a ~40 px margin everywhere else. It shows no total, though the voice says "about 131 thousand" (crops sw_d, sw_e). code 19–44 s: "hydra: x as heads, both directions" butts into its "(4, 208, 4, 64)" column (crop cd_a). Transient crossfade collisions: inproj 30.8 s "SiLU(x) = x" ghost over the RMSNorm panel; hydra 25.9 s yellow D-dot over "frame t sees frames before t"; hshapes 87.1 s "forward scan" and "y" overprint ("forward scay"). |
| E8 | Dead stretch > 6 s while narration moves on / clutter | **FAIL** | hydra 2.6–11.6 s (abs 443, 9 s): a static row of 15 boxes while the voice argues "no reason to only look backwards". Nothing shows looking backwards versus both ways. inproj 31.7–41 s (abs 214, 9.2 s): a static SiLU plot while the voice moves on to "smooth, like GELU" and "dips below zero". No GELU curve is shown, the dashed reference line is unlabeled (it is ReLU), and the dip is never pointed at. train 6–14.5 s (abs 841, 13 s with the curve draw): only the dashed cross-entropy curve while the (1−p)^γ factor is explained. No cluttered frames anywhere. |
| E9 | Pop-in fully formed / jitter / broken-looking motion | **FAIL** (mild) | hydra 32.7 s: the 24 × 24 lower/upper/diagonal matrix fades in complete in about 0.25 s (motion-06 b2 +0.38 → +0.62), then the voice fills "lower… upper… diagonal" one at a time. ssm 112–115 s: the M triangle pops in the same way (motion-05 b6 +0.5 → +0.62). stream 41.6 s: empty braces draw for about 2 s before any block exists, which looks unfinished. No jitter or spinning anywhere. |

Cuts: cut-01 to cut-14 are all clean. Each scene fades to near-black at −0.05 s, the chapter number comes in at +0.05 s, and the HUD keeps its continuity. There are no flashes and no overlaps across scenes.

---

## 2. Scorecard

| Dimension | Score | Weighted | Cap applied | Note (uncapped view) |
|---|---|---|---|---|
| Concept clarity ×3 | **6** | 18 | E3, E4, E8 → ≤ 6 | Uncapped 7. The SSM chapter is a real from-scratch build (toy recurrence → selective Δ → outer-product state → SSD), and Hydra's shift/flip/D is pictured. It falls down at the gaps above. |
| Tensor-shape legibility ×2 | **6** | 12 | E2, E3 → ≤ 6 | Uncapped 8 (storyboard-07, storyboard-13). The HUD always carries the current shape, S/E/H/P are colour-coded consistently, and the right-hand checklist in m_hshapes is excellent. |
| Narration–visual sync ×2 | **7** | 14 | none | Good overall, with several small early reveals (E1 notes) and the hydra matrix arriving before its narration. |
| Pacing ×2 | **6** | 12 | E5 → ≤ 6 | m_ssm and m_hshapes are dense. 37 dead stretches are flagged, though most are acceptable holds. |
| Motion quality ×1 | **6** | 6 | E9 → ≤ 6 | Uncapped 7. Purposeful pulses along scans, sliding shift rows, conv windows that slide, frames collapsing into the pooled vector. Most beat changes are crossfades of fully formed diagrams. |
| Visual polish ×1 | **6** | 6 | E7 → ≤ 6 | Uncapped 7. A consistent style. Many layouts use only the top 40–60% of the frame (overview, ssm toy, hshapes), leaving small content in large empty areas. |
| **Total** | | **68** | | Uncapped ≈ 79 |

The rubric's weights sum to 110 maximum (30+20+20+20+10+10), although its text says "out of 100". 68/110 is 62/100 normalised. Either way the result is under 70.

**Verdict: < 70, rework the failing scenes.** The failures are local and cheap. Fixing the ten items below removes every cap and should put the episode at about 80 ("ship").

---

## 3. Per scene (what a newcomer understands → biggest gap)

- **m_intro (0–54 s)**: understands that this episode traces XLSR-MamBo, a back-end of forward/backward scans plus attention, rebuilt in PyTorch with a parameter count matching the paper, and that four new axis letters are coming. **Gap:** 39–53 s, S/E/H/P are introduced as bare words ("state size", "inner width", …) with nothing they measure on screen. The "replica parameters 319,373,323 = paper 319.37 M" line (35 s) is small and low-contrast.
- **m_overview (0–89 s)**: understands the whole pipeline waveform → XLS-R → 128 → 30 shape-preserving blocks → pool → 2 logits, plus the parameter budget and the three EERs. **Gap:** 17.5–26.6 s, "128 is the model dimension for the entire back-end" over a static row, with no highlight carrying 128 forward. The diagram sits in the top ~35% of the frame with tiny shape labels under the boxes.
- **m_front (0–39 s)**: understands the 66,800-sample crop, repeat padding, ⌊(66800−400)/320⌋+1 = 208, and the final XLS-R layer (B, 208, 1024), frozen or fine-tuned. **Gap:** 400 and 320 are never named (window/hop). The repeated segments appear about 2 s after "Clips shorter than that are repeated".
- **m_inproj (0–50 s)**: understands Linear 1024→128 (weight (128, 1024)), per-frame RMSNorm with a worked RMS = 1.33, SiLU, and output (B, 208, 128). **Gap:** 31.7–41 s, a static SiLU plot. "Like GELU" has no GELU curve, and the dashed line is unlabeled (it is ReLU).
- **m_stream (0–67 s)**: understands that every block is wrapped as residual = h + residual; h = mixer(RMSNorm(residual)), the block order, and that MamBo-3/N3 means 3 Hydra + MLP then MHA + MLP. **Gap:** the wrapper diagram (8–40 s) is never traced step by step; only faint sparks move while the voice walks ⊕ → RMSNorm → mixer → h. "Mamer" and "MLP" are undefined. Braces draw before the blocks at 41.6 s.
- **m_ssm (0–140 s)**: understands T² attention versus a one-pass state, the toy recurrence with verified numbers, input-dependent Δ (big Δ forgets, small Δ keeps), B/C, the 4 × 64 heads with a 64 × 64 state updated by an outer product, and y = M x with a lower-triangular M (SSD). **Gap:** 63–80 s, B_t/C_t are "(64)" vectors while the state is still one number per frame (the 64-dim state only arrives at 90 s). At 81 s the "128" is gone before it is spoken. The big-Δ caption is up 4.5 s against the 7.1 s it needs.
- **m_hydra (0–63 s)**: understands the forward scan plus the flipped backward scan, shift by one, the D·x diagonal, the quasiseparable matrix (lower = forward, upper = backward, diagonal = D), and the torch.cat of x and flip(x) into 2B. **Gap:** 2.6–11.6 s, a dead row of frames during the motivation. At 32.7 s the tri-colour matrix pops in complete instead of filling as narrated.
- **m_hshapes (0–124 s)**: can name every tensor in one Hydra block (128 → 776 = z 256 | xBC 512 | Δ 8 → conv 512 → x 256 + B/C 4 × 64 → 2B → (2B, 208, 4, 64) → scan → (B, 208, 256) → gated norm → 128) and its 137,612 parameters. **Gap:** 84.9→89.3 s, (2B, 208, 4, 64) → (B, 208, 256) with the head merge never said or drawn. 16–60 s is too dense to absorb.
- **m_swiglu (0–44 s)**: understands 128 → 682 split into gate/value 341, SiLU(gate) ⊙ value, 341 → 128, and why ⌊8·128/3⌋. **Gap:** "element by element" overprints the 341 bar for 26 s. The parameter line hugs the right edge and never shows 131,072. "Four times wider classic FFN" is not pictured.
- **m_mha (0–83 s)**: understands in_proj 128 → 384, the causal depthwise conv k=4 as a positional cue, q/k/v as 4 × 32, scores (B, 4, 208, 208) non-causal, concat → out_proj, and why attention is kept. **Gap:** 61.5–80 s, the "Hydra (SSM)" panel shows the artifact fading one way only, right after m_hydra taught that Hydra sees both ways, so the argument looks contradictory. Also, weights·v "208 × 32 per head" is drawn as one-row strips.
- **m_stack (0–31 s)**: understands 743,076 per layer × 5 = 3,715,380, a constant (B, 208, 128), and the final RMSNorm(h + residual). **Gap:** 3.72 M here against the 3.93 M back-end from the overview; the missing 0.22 M (input projection, pooling, head) is never reconciled.
- **m_pool (0–54 s)**: understands per-frame scores from a SwiGLU-style net, softmax over time to (B, 1, 208), bmm to (B, 128), dropout → Linear 128 → 2, and softmax 0.10 / 0.90. **Gap:** minor. The logit chips (teal/pink) don't match the class colours (red spoof / green bona fide).
- **m_train (0–56 s)**: understands focal loss (CE 0.105 → focal 0.001 at p = 0.9), α = [0.1, 0.9], AdamW 1e-5, warm-up 10% then cosine to 1e-6, 32 clips, ≤ 20 epochs, RawBoost, ASVspoof 2019 LA. **Gap:** 6–14.5 s, nothing new while (1−p)^γ is explained. The plot has no y-axis label.
- **m_code (0–45 s)**: sees the replica trace confirm every shape and the 319,373,323 total. **Gap:** a label runs into its shape column at "x as heads, both directions". There is no Hydra block-output line (2, 208, 128).
- **m_recap (0–78 s)**: gets a step/what/shape table and a three-card comparison (315.4 M / 447 K / 3.93 M) with the key contrast "MamBo keeps every frame until the final pooling, AASIST folds time into its spectral nodes early". **Gap:** 0–5.5 s is an empty table header with no narration (beat at 54 wpm).

---

## 4. Factual check (against the supplied ground truth)

All checked numbers are correct:
- XLS-R (B, 208, 1024), with trace (2, 208, 1024); ⌊66,400/320⌋+1 = 208; 66,800 samples = 4.175 s; 201 frames for 64,600 samples.
- input_proj Linear 1024→128 no bias, weight (128, 1024) = 131,072, RMSNorm, SiLU (min −0.28 at −1.28 is right).
- Hydra: expand 2 → 256; in_proj 776 = 256 + 512 + 8; depthwise conv k=7 → 512; x (2B, 208, 4, 64), trace (4, 208, 4, 64); B/C (2B, 208, 64), state 64; fc_D 256→4; out (B, 208, 128); block 137,612 = 99,328 + 32,768 + 4,096 + 1,420.
- SwiGLU 682 → 341 + 341, ⌊8·128/3⌋ = 341, 128·682 + 341·128 + 128 = 131,072.
- MHA in_proj 384, causal conv k=4, 4 × 32, scores (B, 4, 208, 208), out_proj 128→128, 68,096.
- Stack: layer 743,076 (3·137,612 + 2·131,072 + 68,096); × 5 = 3,715,380; 30 blocks + final RMSNorm.
- Pool: weights (B, 1, 208), pooled (B, 128), logits (B, 2); softmax(−1.1, 1.1) = 0.10 / 0.90.
- Parameters: back-end 3,934,603 + XLS-R 315,438,720 = 319,373,323 (paper 319.37 M).
- EER 0.81 % / 1.70 % / 4.97 %, labelled "best of the top-5 checkpoints, as reported".
- Paper credited as Ng et al., Findings of ACL 2026.
- Toy SSM: h = 1.00, 0.70, 0.49, 2.34, 1.64, 1.15, 0.80, 1.56 with a = 0.7.
- Selective toy: decay e^{−0.3} = 0.74 and e^{−1.6} = 0.20; h = 0.30 … 1.27.
- M_ij formula, and the highlighted cell (18, 9) with "decays of frames 10…18", which I counted in crop ss_e.
- Hydra formula shift(SS(x)) + flip(shift(SS(flip(x)))) + D·x.
- Focal: CE(0.9) = 0.105, focal = 0.001.
- The AASIST contrast is stated correctly.

Wording and unverifiable items:
- "exactly the number reported in the paper" (overview 63.6 s, code 34.7 s): the paper gives 319.37 M, so the match is to 5 significant figures. Say "matches the paper's 319.37 M".
- AASIST-SSL "447 K" (recap 47.9 s) and the training hyper-parameters (m_train) are not in the supplied ground truth, so I could not check them here.
- hshapes 87.1 s: "y = forward + flip(backward)" leaves out the shift that m_hydra stressed. Write "shift(fwd) + flip(shift(bwd))".

---

## 5. Ten worst problems (worst first, each with a concrete fix)

1. **m_hshapes 84.9–89.3 s: the silent head merge (E3).** The HUD goes (2B, 208, 4, 64) → (B, 208, 256) with only "flipped back and added" said. **Fix:** split it into two beats. (a) Flip back and add: slide the teal backward half onto the purple forward half, keep the 4 head bands, set the HUD to B·208·4·64, and say "two B becomes B". (b) Merge heads: the 4 bands close into one 256-tall block, the HUD reads B·208·256, and the narration adds "and the four heads of sixty-four are joined back into two hundred and fifty-six". Draw the head bands on the scan-output rows at 84.9 s too.
2. **m_ssm 63.6–80 s: B_t/C_t (64) appear before the 64-slot state exists (E4).** **Fix:** when "B and C also come from the input, as vectors" starts, grow the scalar h cell of one frame into a 64-cell column labelled "real state: 64 slots (S)". Add a caption: "B writes x into the 64 slots, C reads them out". Alternatively, move the "expanded to 256 / 4 heads / 64 × 64 state" beat (81–108 s) before the B/C beat.
3. **m_ssm 79.5–82 s: the 128 label lasts 0.5 s and is gone when spoken (E2, E5).** **Fix:** hold "one frame: (128)" for at least 2 s. Start the growth to 256 on the word "expanded", and leave a ghost bracket "128 → 256" beside "expanded × 2: (256)" for the rest of the beat.
4. **m_mha 61.5–80 s: the "Hydra (SSM)" panel contradicts m_hydra.** It shows the artifact fading in one direction only. **Fix:** retitle it "a scan's state", show the red bars decaying both left and right from the artifact, and caption it "squeezed into a fixed-size state: fades with distance, in both directions". Keep the attention panel's "jumps straight to it".
5. **m_hydra 32.7–41 s: the quasiseparable matrix pops in complete (E9, sync).** **Fix:** start with an empty grid. Fill the purple lower triangle row by row on "the forward scan fills the lower triangle", the teal upper on "the backward scan…", then sweep the yellow diagonal on "and D fills the diagonal". Use the same row-by-row wipe for M in m_ssm at 112 s, on "unrolled over all frames".
6. **m_ssm 54–63 s and m_hshapes 16–60 s: captions shorter than reading time, and number bursts (E5).** **Fix:** extend "big Δ…" to at least 7 s and "small Δ…" to at least 5.5 s with a 1.5–2 s narration pause after each, and shorten them ("big Δ → decay 0.20: forget, write strongly"). In m_hshapes add a 1–1.5 s pause after "five hundred and twelve" (29.8 s), after "sixty-four each" (49.6–58 s) and after "two B by 208 by 256" (60.7 s). Lengthen "y = forward + flip(backward)" to at least 5.5 s.
7. **m_swiglu 17–43 s: overlap, edge-hugging and a missing total (E7).** **Fix:** move "element by element" below the ⊙ (about +20 px) so it clears the 341 bar. Wrap the parameter line onto two lines inside the 40 px margin, and append "= 131,072" on "about one hundred and thirty-one thousand". Also set the HUD to B·208·128 until "six hundred and eighty-two" is spoken (it shows 682 from 1.1 s).
8. **m_hydra 2.6–11.6 s: dead stretch during the motivation (E8).** **Fix:** on "no reason to only look backwards", draw causal arcs from a highlighted frame t to past frames only, with future frames dimmed and labelled "a causal scan can't see these". Then un-dim them with "the whole clip is available". Bring in the forward-scan arrow by about 7 s.
9. **m_stream 8–40 s: the pre-norm wrapper is explained over a static diagram.** **Fix:** trace one pass with a moving highlight. On "adds its input to that residual" the h line and ⊕ glow. On "normalizes" RMSNorm glows. On "runs its mixer" the mixer glows. On "becomes the next block's input" the orange h path to the next ⊕ glows. Have the formula's matching term light up each time.
10. **m_train 2.8–15.8 s: 13 s with only the CE curve while (1−p)^γ is explained (E8).** **Fix:** at "scaled by one minus p to the power gamma", plot the small (1−p)^γ weight curve or shade the gap between CE and focal, and bring the focal curve in at about 9 s. Add a y-axis label ("loss") and a tick at p = 0.9 for the "easy" example.

## 6. Also worth fixing

- **m_inproj 31.7–41 s:** label the dashed line "ReLU", add a faint GELU curve on "like GELU", and pulse a dot at (−1.28, −0.28) on "dips slightly below zero".
- **m_stack 12–20 s:** reconcile 3.72 M with 3.93 M. Add a line: "+ input proj 131 K + pooling + head = 3.93 M back-end".
- **m_stream 48–66 s:** define "Mamer" (SSM + MHA layer) or drop it from the table. Use one name, SwiGLU or feed-forward, rather than also "MLP". Draw the blocks before their braces (41.6 s).
- **m_code 19–44 s:** shorten the label to "hydra: x heads, both dirs" or widen the label column. Add a "hydra: out (2, 208, 128)" line.
- **m_hshapes 87.1 s:** don't show "+ D·x" in the side panel until 93.8 s.
- **m_ssm 25.7 s:** "The output is c times the state" shows only the formula. Add a y row (= h, since c = 1) or a note saying so. The "softplus: smooth, > 0" and "a = 0.7, b = c = 1" annotations are very dim grey; raise their contrast.
- **m_mha 45.8 s:** draw weights·v as four 208 × 32 slabs, not one-row strips, to match the "208 × 32 per head" label.
- **m_overview / m_ssm toy / m_hshapes:** content uses the top 40–60% of the frame and the lower part is empty. Scale the diagrams up about 1.3× so labels like "(B, 66800)" and the toy-cell values read comfortably.
- **m_pool 41–53 s:** colour the logit chips to match their classes (red spoof, green bona fide).
- **m_recap 0–5.5 s:** start the first row (or the narration) sooner. The opening beat runs at 54 wpm over an empty header.
- **Overview 63.6 s, code 34.7 s:** say "matches the paper's 319.37 M" instead of "exactly".
- **Transient crossfade collisions:** inproj 30.8 s, hydra 25.9 s, hshapes 87.1 s. Use a short fade-out-then-in, or move the outgoing label before the incoming one lands.
- **m_front 10–19 s:** name the 400 (window) and 320 (hop) in the formula.
