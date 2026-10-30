# Explainer review rubric

You are reviewing an animated technical explainer you did not build. You cannot play it, so you watch it
through the files `tools/review/review.py` wrote. Judge it as a **first-time viewer who knows some Python
but has never seen this model**: could they follow every step and say what shape the tensor has?

Adapted from two published skills: *nl-video-score* (tiered frame sampling, weighted scorecard, verdict
matrix) and *motion-graphic*'s critique loop (defects before scores, caps, evidence for high scores,
a reviewer with a fresh context).

## What to open

| File | Look for |
|---|---|
| `storyboard-NN-<id>.jpg` | frames ~2 s apart with the sentence being spoken under each. Is what's said **on screen at that moment**? Does the picture build the idea step by step? Can you read every shape? |
| `motion-NN-<id>.jpg` | 8 fps from each beat start. Do things move purposefully and settle? Any jumps, spins, disorienting camera moves, elements popping in or vanishing? |
| `cut-NN.jpg` | frames across each scene change: clean, no flashes or overlaps |
| `metrics.md` | words per minute per beat, text shown too briefly, text too small, dead or hectic stretches |

## Step 1: defects (PASS / FAIL, each with file + time as evidence)

| # | Defect | A FAIL caps |
|---|---|---|
| E1 | The narration describes something that is not on screen at that moment, or the screen shows it much earlier/later | Sync ≤ 6 |
| E2 | A tensor shape is spoken but not written on screen, or written too small / distorted to read | Shapes ≤ 6 |
| E3 | A transformation is shown without making clear **which axis changes** (before → after) | Shapes ≤ 6, Clarity ≤ 6 |
| E4 | A concept is used before it is explained, or explained in one sentence with no picture | Clarity ≤ 6 |
| E5 | More than ~3 new ideas or numbers within 10 s, or a beat above 175 words/min, or text listed under "shorter than its reading time" that carries meaning | Pacing ≤ 6 |
| E6 | Camera moves or 3-D perspective while something must be read, so labels skew, shrink or slide away | Motion ≤ 6, Shapes ≤ 6 |
| E7 | Text overlapping text or shapes; content cut off by the frame edge or the HUD | Polish ≤ 6 |
| E8 | A dead stretch (nothing new for > 6 s while narration moves on) or a cluttered frame where the eye can't find the subject | Clarity ≤ 6 |
| E9 | An element pops in fully formed, jitters, or moves in a way that looks broken | Motion ≤ 6 |

## Step 2: scorecard

| Dimension | Weight | Max | 8+/10 means |
|---|---|---|---|
| Concept clarity | ×3 | 30 | each scene builds one idea from what came before; a newcomer could explain it back |
| Tensor-shape legibility | ×2 | 20 | the current shape is always readable; axes are named and colour-coded; changes are highlighted |
| Narration–visual sync | ×2 | 20 | the picture changes exactly when the voice talks about it |
| Pacing | ×2 | 20 | time to read and absorb; holds after key results; nothing rushed or padded |
| Motion quality | ×1 | 10 | movement explains (it carries an element to where it goes next); smooth; never decorative spinning |
| Visual polish | ×1 | 10 | clear hierarchy, readable type, balanced frames, consistent style |

Score each dimension 1–10 and multiply by its weight: the weighted points add up to at most 110. Report that sum and the
total on a 100 scale (sum × 100 / 110), which the verdict uses. Caps from step 1 apply. (Rounds scored before this
note reported the raw sum as if it were out of 100.)
A score of 8 or more must name the file it was judged from; otherwise 7 at most.

| Total | Verdict |
|---|---|
| ≥ 80 | ship |
| 70–79 | ship after fixing the listed problems |
| < 70 | rework the failing scenes |

## Step 3: report

1. The defect table with evidence.
2. The scorecard.
3. **Per scene**, one line: what a viewer understands after it, and the biggest gap (be concrete: "x_mha 12–20 s: the 16 slabs fan out in 3-D but no label says (B, 201, 16, 64); viewer can't tell heads from frames").
4. The **ten worst problems**, worst first, each with scene id, time and a concrete fix.
