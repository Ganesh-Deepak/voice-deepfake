# Review: Episode 3 "XLSR-MamBo", round 2

**Total: 60 / 100. Verdict: rework the failing scenes (< 70).**

Reviewer: fresh context. Judged only from `review/mambo/round-2/` (all 15 storyboards, all 15 motion strips, 14 cut strips, metrics.md) and `tools/review/rubric.md`. Times are scene-relative (storyboard timestamps). Where metrics.md gives global times, I converted them to scene-relative using the scene durations in metrics.md.

The shape arithmetic is excellent: every number I could check matches the ground truth. The HUD shape chip is always present and colour-coded, and the code trace closes the loop. What fails is teaching and timing. The core new idea (selective SSM → Mamba-2 heads → Hydra) loses the toy example's context at the moment the narration refers back to it. Two numbers are used chapters before they are derived. Letters collide (B for batch and for the SSM input matrix; H for heads and for the state). There are 36 dead stretches of 6 s or more. Nearly every beat fades to an empty frame and rebuilds instead of morphing.

---

## 1. Defects

| # | Defect | Result | Evidence (file, scene time) |
|---|---|---|---|
| E1 | Narration describes something not on screen / shown much earlier or later | **FAIL** | `storyboard-05-m_ssm` 38.6–45.2 s: "Mamba's key idea is to make *these numbers* depend on the input". The toy recurrence (a, b, c, x/h rows) has been wiped and only an empty "decay" axis box is shown. `storyboard-09-m_mha` 61.5–72.7 s: the narration is about pure SSMs struggling, but only the Attention panel fills ("global retrieval, finds a pattern anywhere", from 63.7 s). The Hydra panel stays empty until 72.7 s, and attention isn't named until 70.4 s. Lesser cases: `storyboard-03-m_inproj` 37.7 s shows "output: (B, 208, 128)" 4.6 s before it is spoken (42.3 s). `storyboard-04-m_stream` 41.6 s has empty braces while the six blocks are being named (they appear 43.8–46.1 s). `storyboard-05-m_ssm` 7.7 s shows the SSM panel ~4 s before the SSM sentence (12.1 s). `storyboard-07-m_hshapes` 103.1 s is an empty main area during "Finally, a gated RMSNorm". |
| E2 | Spoken shape not written, or too small to read | PASS (marginal) | Every spoken shape appears in the HUD chip and/or on the mosaic labels. Notes: the side-log sublines are under 20 px (metrics: "· xBC 512 · Δ 8" 18 px, `storyboard-07-m_hshapes` 23–35 s), but the same numbers are on the mosaic labels ("z 256", "xBC 512", "Δ 8") at a readable size. |
| E3 | Transformation shown without making clear which axis changes | **FAIL** | `storyboard-09-m_mha` 28.0–34.7 s: "four heads of thirty-two". The q/k/v columns stay 128 wide and a 4-slab score stack appears, with only the HUD jumping to B×4×208×32. The 128 → 4×32 split is never drawn. Supporting case: `motion-07-m_hshapes` b1: the (B,208,128) mosaic fades to an empty frame and the 776 mosaic fades in, so before and after are never on screen together. |
| E4 | Concept used before explained, or one sentence with no picture | **FAIL** | `storyboard-05-m_ssm` 80.5 s: "each frame's vector of two hundred and fifty-six numbers". 256 = expand×2 is first derived in `m_hshapes` 10.0 s, and `storyboard-06-m_hydra` 50.7 s even says on screen "256 = 2 × 128: the inner width, explained next". Also in `m_ssm`: "per direction" at 104.7 s comes before bidirectionality (m_hydra); softplus at 43.0 s is named, never shown; B and C at 65.0–80.3 s get a text list only, no picture of them as vectors. `storyboard-12-m_train` 28–57 s: warm-up, cosine decay, RawBoost and early stopping are each one clause over a text table. `storyboard-00-m_intro` 39.6–51 s: S/E/H/P are introduced as bare letters with nothing to attach them to. |
| E5 | > ~3 new ideas/numbers in 10 s, beat > 175 wpm, meaningful text under reading time | **FAIL** | `storyboard-05-m_ssm` 98.1–108 s: in about 10 s it adds the decay×state update, Δ·x·Bᵀ, the 64×64 outer product, y = H·C → (64) per head, per-step shapes x(64)/B,C(64)/Δ(1), and "4 heads × (64×64) state, per direction". `storyboard-12-m_train` 28–41 s packs six numbers into one sentence (1e-5, 0.9, 0.95, 0.05, 10 % warm-up, cosine to 10 %). metrics.md lists two meaning-carrying texts shown too briefly: "4 heads × (64 × 64) state, per direction" for 3.25 s (needs 3.8) and "y = forward + flip(backward)…" for 4.75 s (needs 5.3). Beat wpm peaks at 165, so that criterion passes. |
| E6 | Camera move / 3-D perspective while text must be read | PASS | No camera moves in any motion strip. The MHA score stack (`storyboard-09-m_mha` 30.2 s+) is a static 2.5-D offset with flat labels. |
| E7 | Text overlapping text/shapes; content cut off | **FAIL** | `storyboard-04-m_stream` 5.6–39.3 s: the first ⊕ node sits on top of "(B," in "residual stream (B, 208, 128)" (zoom confirmed). `storyboard-03-m_inproj` 30.8 s: the "SiLU(x) = x ·" ghost overlaps the RMSNorm "divided by RMS" panel. `motion-03-m_inproj` b2 +0.38: the "× g, learned scale" strip lingers over the new SiLU frame after everything else has faded. |
| E8 | Dead stretch > 6 s, or cluttered frame | **FAIL** | metrics.md: 36 dead stretches of 6 s or more. Worst: `m_inproj` 31.7–49.9 s (18.2 s, static SiLU curve while "the result is B by 208 by 128…" is spoken); `m_ssm` 46.9–63.6 s (16.8 s, decay curve); `m_ssm` 107.4–122.9 s (15.5 s, M triangle static during "Entry i, j of M is…"); `m_train` 2.9–15.7 s (12.8 s); `m_mha` 2.8–14.8 s (12 s, q/k/v static); `m_ssm` 7.6–19.6 s (12 s); `m_overview` 77.5–89 s (11.5 s on three bars). |
| E9 | Element pops in fully formed, jitters, looks broken | **FAIL** (minor) | `motion-08-m_swiglu` b1 +0.25→+0.38: the output "128" box pops in fully opaque within one 8-fps frame, before the SiLU / ⊙ / 341 path that feeds it. `motion-03-m_inproj` b2 +0.38→+0.50: the leftover ×g strip vanishes in one frame. |

---

## 2. Scorecard

| Dimension | Weight | Score | Cap applied | Points | Why |
|---|---|---|---|---|---|
| Concept clarity | ×3 | 5 | ≤ 6 (E3, E4, E8) | 15 | Pipeline, front-end, projection, SwiGLU, pooling and the code trace are clear. The SSM chapter breaks its own chain: the toy is wiped, a→exp(ΔA) and b→Δ·B are never connected, B and C are text only, 256 is unexplained, and the letters collide. |
| Tensor-shape legibility | ×2 | 6 | ≤ 6 (E3) | 12 | The HUD chip is always readable and colour-coded, and the side log is a good running record. But the heads split in MHA is not drawn, the mosaic orientation flips between scenes, B (batch) and B (SSM) collide, and the sublines are under 20 px. |
| Narration–visual sync | ×2 | 6 | ≤ 6 (E1) | 12 | Most beats land within ~2 s. Two real mismatches (m_ssm 38.6 s, m_mha 61.5–72.7 s) and half a dozen early or late reveals. |
| Pacing | ×2 | 5 | ≤ 6 (E5) | 10 | Rushed in m_ssm 98–108 s and m_train 28–41 s, padded almost everywhere else (36 dead stretches, 16.8 min of video for ~2,370 words). |
| Motion quality | ×1 | 5 | ≤ 6 (E9) | 5 | Nearly every beat fades out to an empty frame, then fades the next picture in. Only a few motions carry an element: the conv window slides, forward and backward scans merge (m_hshapes 85.3 s), frames collapse to one vector (m_pool 30–33 s). |
| Visual polish | ×1 | 6 | ≤ 6 (E7) | 6 | Consistent palette and type. Problems: overlaps (above), unbalanced frames (m_ssm 82.7–87 s heads bar alone at the bottom of an empty frame; m_inproj SiLU panel with an empty right half), and the HUD stage reading "06/08 SwiGLU" for all of m_stack. |
| **Total** | | | | **60** | |

No dimension scored 8 or more, so no evidence files are needed for high scores.

---

## 3. Per scene

| Scene | What a viewer understands afterwards | Biggest gap |
|---|---|---|
| m_intro | Name, "SSM scans + attention", configuration MamBo-3-Hydra-N3, the parameter count matches the paper. | 39.6–51 s: the S/E/H/P legend is four bare letters with no tensor to attach them to; 45–54 s dead (8.8 s). |
| m_overview | Full pipeline with a shape under every box; 30 blocks keep (B,208,128); 3.93 M + 315.4 M = 319.37 M; three EERs. | 9.4–16.9 s, 61–71 s and 77.5–89 s are static holds; 16 s spent revealing three bars. |
| m_front | 66,800 samples (4.175 s); repeat padding; ⌊(66800−400)/320⌋+1 = 208; XLS-R final layer (B,208,1024); frozen or fine-tuned flag. | 5.7 s: "repeated to fill it" is spoken before the repeated strip appears (8.0 s); 25–34.5 s static; double-headed arrow at 35–38 s. |
| m_inproj | Linear 1024→128 (weight (128,1024), 131,072); RMSNorm as per-frame bars ÷ RMS × g; SiLU curve. | 31.7–49.9 s: SiLU is a 1-D curve and is never applied back to the 208×128 mosaic; "(B,208,128)… the stream" is spoken over an unchanged graph for 12 s. |
| m_stream | Pre-norm wrapper residual = h + residual, h = mixer(RMSNorm(residual)); block order; MamBo-1…4 variants. | ⊕ node covers "(B," of the stream label for 34 s; h's own shape is never labelled; MamBo table is text only (55–67 s). |
| m_ssm | Attention is T², an SSM is T; the toy h_t = a·h + b·x with real numbers; Δ controls forget vs keep; heads of 64; 64×64 state, outer-product update; y = Mx, lower-triangular M, "SSD". | 38.6 s: the toy is wiped while the narration says "these numbers", and a/b/c are never morphed into exp(ΔA)/Δ·B/C. 80.5 s: 256 is unexplained. 98–108 s is overloaded. 107–123 s: M is static while the entry formula is read. |
| m_hydra | Run the scan forwards and on flip(x); shift both and add D·x; matrix = lower + upper + diagonal; stack on batch → 2B. | 2.6–11.6 s: static row of boxes during the motivation sentence; the one-step shift rows (16.9–30.4 s) are hard to see; "256 … explained next" admits the order problem. |
| m_hshapes | The real walk: 128→776 (z 256 / xBC 512 / Δ 8) → conv k=7 → x 256 + B,C 4×64 → (2B,208,256) → (2B,208,4,64) → scan → merge → +D·x → gated norm → out 128; 137,612 params. | 76.5–83 s: "B and C are two B by…" (letter collision). Frames run horizontally here but vertically in m_front/m_inproj/m_mha. Every beat fades to empty instead of morphing (motion-07). |
| m_swiglu | 128→682 → gate 341 / value 341 → SiLU(gate)⊙value → 341→128; ⌊8·128/3⌋ = 341; 131,072. | "+ 128" in 128·682 + 341·128 + 128 is unlabelled; the B and 208 axes never appear in the diagram; the output box pops in first. |
| m_mha | in_proj 128→384 (q,k,v); causal depthwise conv over 4 frames; scores (B,4,208,208), not causal; concat → out_proj; why keep attention; 68,096 params. | 28–34.7 s: the 128 → 4×32 head split is not drawn (E3). 61.5–72.7 s: the SSM-weakness sentence plays over an empty Hydra panel. "Before they're split" is spoken while q/k/v are already drawn split. |
| m_stack | 5 layers × 6 blocks; 743,076 per layer ×5 = 3,715,380; shape never changes; final RMSNorm. | The final-RMSNorm sentence repeats m_stream 23–28 s; the HUD stage reads "06/08 SwiGLU" for the whole scene. |
| m_pool | Per-frame score via SwiGLU-style scorer → softmax over time → (B,1,208) @ (B,208,128) → (B,128); dropout → Linear 128→2 → softmax spoof/bona fide. | The scorer is four text boxes only; 22–30 s hold; otherwise one of the clearest scenes. |
| m_train | Focal loss vs CE curve (CE 0.105 → focal 0.001 at p = 0.9); α = [0.1, 0.9]. | 28–57 s: a five-row text table is read aloud, six numbers in one sentence, no LR-schedule picture; 2.9–15.7 s static curve. |
| m_code | A plain-PyTorch trace prints every shape just taught; params land on 319,373,323. | Lines lag their sentence by ~2 s (14.6–25.8 s); 35–44.8 s end hold. |
| m_recap | Step table with shapes; three cards (XLS-R 315.4 M, AASIST 447 K, MamBo 3.93 M); time is pooled away only at the end. | The "in both cases" claim is doubtful for AASIST (see factual check); 3.4 s empty opening; 41.8–46.3 s a single card on screen. |

---

## 4. Factual check

| Item | On screen / spoken | Ground truth | OK? |
|---|---|---|---|
| XLS-R output | (B, 208, 1024); trace (2, 208, 1024) | (2, 208, 1024) | ✓ |
| Frame count | ⌊(66800 − 400)/320⌋ + 1 = 208; 66,800 = 4.175 s | 208 | ✓ |
| input_proj | Linear 1024→128, no bias; weight (128,1024), 131,072; RMSNorm, SiLU → (B,208,128) | same | ✓ |
| Hydra in_proj | 128→776 = z 256 + xBC 512 + Δ 8 | 776 = 256 + 512 + 8 | ✓ |
| Hydra conv | depthwise conv1d k=7 + SiLU → (B,208,512) | (2,208,512), k=7 | ✓ |
| Hydra x / B,C | (2B,208,4,64); B,C (2B,208,64) | (4,208,4,64); (4,208,64) | ✓ |
| Hydra out | out_proj 256→128 → (B,208,128) | (2,208,128) | ✓ |
| Hydra params | 137,612 = in_proj 99,328 + out_proj 32,768 + conv 4,096 + rest 1,420; fc_D 256→4 | same | ✓ |
| SwiGLU | gate/value 341; 131,072 | (2,208,341) ×2; 131,072 | ✓ |
| MHA | in_proj 384; causal conv k=4; scores (B,4,208,208); 68,096 | same | ✓ |
| Layer / stack | [3 Hydra, SwiGLU, MHA, SwiGLU] ×5; 743,076; ×5 = 3,715,380; final RMSNorm (B,208,128) | same | ✓ |
| Pool / head | scores (B,208); weights (B,1,208); pooled (B,128); logits (B,2) | same | ✓ |
| Params | back-end 3,934,603 + XLS-R 315,438,720 = 319,373,323 (paper 319.37 M) | same | ✓ |
| Paper / EER | Ng et al., Findings of ACL 2026; 0.81 % on 2021 LA | same | ✓ |
| EER DF 1.70 %, In-the-Wild 4.97 % | m_overview 74.7–88 s | not in the ground truth I was given | **verify against the paper's table** |
| Toy recurrence | a = 0.7, x = [1,0,0,2,0,0,0,1] → h = 1.00, 0.70, 0.49, 2.34, 1.64, 1.15, 0.80, 1.56 | recomputed | ✓ |
| SSD formulas | Hₜ = e^(ΔₜA)Hₜ₋₁ + Δₜ xₜBₜᵀ; M_ij = (Cᵢ·Bⱼ)Δⱼ e^(A(Δⱼ₊₁+…+Δᵢ)), j ≤ i | Mamba-2 SSD | ✓ |
| Hydra formula | y = shift(SS(x)) + flip(shift(SS(flip(x)))) + D·x | Hydra paper | ✓ |
| SiLU min | −0.28 at x = −1.28 | −0.278 at −1.278 | ✓ |
| 8/3 rule | ⌊8·128/3⌋ = 341; 128·682 + 341·128 + 128 = 131,072 | arithmetic ✓; the "+128" term is unlabelled | ✓ (label it) |
| Focal loss | p = 0.9: CE 0.105, focal 0.001 | −ln 0.9 = 0.105; 0.01 × 0.105 | ✓ |
| Head softmax | logits (−1.1, 1.1) → 0.10 / 0.90 | 0.0998 / 0.9002 | ✓ |
| Recap 201 frames | 64,600-sample crop of episodes 1–2 → 201 | ⌊64200/320⌋ + 1 = 201 | ✓ |
| Recap "in both cases, the time axis is only removed at the very end, by pooling" | m_recap 59.9–66.7 s | AASIST builds its spectral node set by max-pooling over time mid-network, so the claim looks wrong for AASIST | **questionable: check against episode 2** |
| MamBo-1/2/4 descriptions, AASIST 447 K | m_stream 55 s+, m_recap 48.6 s | not in the ground truth | unverified |

---

## 5. Ten worst problems (worst first)

1. **m_ssm 38.6–80.3 s: the selective step breaks the chain the toy built.** At 38.6 s the toy (a, b, c, x and h rows) is wiped to an empty decay box exactly as the narration says "make *these numbers* depend on the input". a → exp(Δ·A), b → Δ·B, c → C is never drawn, and B and C get only a text list.
   **Fix:** keep the toy rows on screen. Morph "a = 0.7" into "aₜ = exp(Δₜ·A)", "b" into "Δₜ·Bₜ", and "c" into "Cₜ". Give one frame a large Δ and show its aₜ drop and the h row reset there, so "selective" is seen. Then draw Bₜ and Cₜ as small 64-cell vectors coming out of the frame.

2. **m_hshapes 76.5–83 s and m_ssm 89–105 s: letter collisions.** The narration says "B and C are two B by two hundred and eight by sixty-four", and the HUD reads "SCAN INPUTS B C 2B × 208 × 64". "H = 4 heads" and "H (state of head 1)" share a frame.
   **Fix:** rename the state to "state Sₜ" or a lowercase hₜ, keeping H for heads. In this episode's narration say "two times batch" (and/or write "batch" in the HUD chip) whenever B and C are on screen. Add a one-line key the first time B appears: green B = batch, yellow B = input matrix.

3. **m_ssm 80.5 s (also m_hydra 50.7 s): 256 is used two chapters before it is derived.** It is used in m_ssm, then flagged on screen as "explained next" in m_hydra, and finally derived at m_hshapes 10 s.
   **Fix:** open the m_ssm heads beat with the 2-second "expand × 2: 128 → E = 256" mosaic widening (move it from m_hshapes 10 s), then split it into four heads of 64. Delete "explained next".

4. **Long dead holds (E8).** m_inproj 31.7–49.9 s (18 s), m_ssm 46.9–63.6 s (17 s), m_ssm 107.4–122.9 s (15.5 s), m_mha 2.8–14.8 s (12 s).
   **Fixes:**
   - m_inproj: after the curve, apply SiLU to the 208×128 mosaic (negative cells dim) and land "(B, 208, 128)" on it at 42.3 s, when it is spoken.
   - m_ssm decay beat: move a Δ marker along the curve while a toy h cell updates.
   - m_ssm M beat: highlight one cell (i, j) at 115.7 s and draw Cᵢ, Bⱼ, Δⱼ and the decay product feeding it.
   - m_mha: start the in_proj → q|k|v split animation during the first sentence, not before it.

5. **m_mha 28–34.7 s: the 128 → 4 heads × 32 reshape is never drawn (E3).**
   **Fix:** slice the q, k and v columns into four 32-wide strips coloured with the heads (H) colour. Fan the four q·kᵀ pairs into the four score slabs. Label the slices "(B, 4, 208, 32)" as "four heads of thirty-two" is spoken.

6. **m_mha 61.5–72.7 s: narration and picture disagree.** The narration describes SSMs failing at global retrieval, but the Hydra panel stays empty while the Attention panel fills ("global retrieval…"), 7 s before "Attention is good at exactly that" (70.4 s).
   **Fix:** fill the Hydra panel first. Show one red "artifact" frame whose contribution to the state fades to near zero by the far end of the scan. Then, at 70.4 s, light the attention arc that jumps straight to the red frame.

7. **m_ssm 98–108 s: seven new items in ~10 s (E5).** Decay, Δ, xₜBₜᵀ, the 64×64 outer product, y = state·C (64), the per-step shapes, and "per direction" (directions don't exist yet). The shape line is on screen for 3.25 s against the 3.8 s it needs.
   **Fix:** split into two beats with a 2-s hold after the outer-product picture. Read out y = state·C only once the update has played. Remove "per direction" here and introduce it in m_hydra. Hold the shape line for at least 4 s.

8. **m_train 28–57 s: a hyper-parameter list read aloud.** Six numbers in one sentence over a single text line, then a 5-row text table, with no picture of the schedule (E4, E5).
   **Fix:** draw the LR curve as it is spoken: a linear ramp to 1e-5 over the first 10 % of steps, then cosine down to 1e-6. Split the optimizer and schedule into two sentences. Leave betas and weight decay on screen only, not in the voice-over.

9. **m_stream 5.6–39.3 s: label overlap (E7) and a missing label.** The first ⊕ node covers "(B," in "residual stream (B, 208, 128)". The gold h path, a second (B, 208, 128) tensor, has no shape label, so residual and h are hard to tell apart.
   **Fix:** move the stream label above or left of the line start. Add "h (B, 208, 128)" on the gold return path.

10. **Tensor orientation flips between scenes, and beats rebuild instead of transform.** m_front, m_inproj and m_mha draw frames down the rows (208 on the left edge); m_hshapes and m_pool draw frames across the columns. There is no cue for the switch. In m_hshapes every beat fades to an empty frame and rebuilds (motion-07 b1–b6), so before and after are never seen together.
   **Fix:** use one convention everywhere. Time horizontal matches the scans and pooling, so redraw the m_front, m_inproj and m_mha mosaics that way. In m_hshapes morph in place: grow the 128 rows to 776, slide z off to the side, slide flip(x) down under x to make 2B.

## Also worth fixing

- **m_intro 39.6–51 s:** drop the abstract S/E/H/P legend, or re-flash each letter's chip at its first real use (E at m_hshapes 10 s, H/P at m_ssm 82.7 s, S at m_ssm 89 s).
- **m_overview 72–89 s:** three EER bars take 16 s, then an 11.5 s hold. Reveal all three bars while the sentence runs and cut the tail. Also verify DF 1.70 % and ITW 4.97 % against the paper.
- **m_front:**
  - 5.7 s: start the repeated-clip strip when "repeated" is spoken (it appears at 8.0 s).
  - 35–38 s: the XLS-R → mosaic arrow turns double-headed. Make it one-way.
- **m_inproj 30.8 s / motion-03 b2:** the SiLU formula ghosts over the RMSNorm panel, and the ×g strip outlives the cross-fade. Fade all RMSNorm elements together before SiLU enters.
- **m_ssm:**
  - 43 s: show softplus (a small curve), or say "a smooth function that keeps Δ positive".
  - 7.7 s: hold the SSM panel until 12.1 s.
  - 82.7–87 s: the heads bar sits alone at the bottom of an empty frame. Centre it, or show the H matrix at the same time.
- **m_hydra:**
  - 2.6–11.6 s: replace the static row of boxes with the clip's waveform under the frames, lit from both ends.
  - 16.9–30.4 s: make the one-step shift a visible one-cell slide with arrows (the "0" pads are tiny).
- **m_hshapes:**
  - 49.9–58.7 s: the subline "x 256 · 4 · 64" is cryptic. Write "x 256 · B,C: 4 × 64".
  - Raise all side-log sublines to at least 20 px (metrics: 18 px and 17 px).
  - 103.1 s: blank main area while "gated RMSNorm" is spoken. Bring norm(y) and SiLU(z) in on the word.
  - 76.5 s: the HUD switches to the B,C shape 2 s before the B/C strips appear.
- **m_swiglu:**
  - 37.9 s: label the "+ 128" term in the 131,072 sum.
  - motion-08 b1: the output 128 box pops in before its inputs. Reveal it left to right.
- **m_mha:**
  - 5.6–21 s: "Before they're split" is spoken over q/k/v already drawn and labelled as three columns. Either draw one 384 block first, or change the line.
  - 68.2 s: "T² scores, but only 4 × 32" is cryptic. Write "208 × 208 scores, 4 heads of 32".
- **m_stack:**
  - The HUD stage reads "06/08 SwiGLU" for the whole scene. Show a "30 blocks" stage label.
  - The final-RMSNorm sentence repeats m_stream 23–28 s. Cut one of them.
- **m_pool 10.1–19.2 s:** the scorer is four text boxes. A tiny version of the SwiGLU picture would reuse what the viewer just learned.
- **m_code 14.6–25.8 s:** trace lines appear ~2 s after their words. Print each line on its word.
- **m_recap:**
  - 59.9–66.7 s: "in both cases the time axis is only removed at the very end" needs checking against episode 2's AASIST (spectral nodes are max-pooled over time mid-network).
  - 3.4 s: empty opening frame.
- **cut-02, cut-13:** the chapter title sits over the next scene's panel frame for ~0.5 s. Delay the panel until the title has left.
