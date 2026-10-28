---
name: explainer-review
description: Watch and score an episode of these explainers before shipping it — renders storyboards with the spoken line under each frame, 8 fps motion strips, cut strips and pacing/readability metrics, then a reviewer scores clarity, shape legibility, sync, pacing and motion with tools/review/rubric.md. Use after any change to scenes, narration or timing.
---

# Explainer review

The builder is the worst judge of their own video. This loop makes the video visible as images and
numbers, has a reviewer with a fresh context score it, and fixes the worst problems before shipping.
It adapts *nl-video-score* (tiered frame sampling + weighted scorecard) and the *motion-graphic*
skill's critique loop (defects first, caps, evidence, separate reviewer).

## Loop

1. Render the review material (needs the narration timeline in `build/<id>/timeline.js`):
   ```bash
   python tools/review/review.py <id> --out review/<id>/round-<n>
   ```
   Optional: `--scenes a,b` to redo only some scenes, `--root <dir>` to review another checkout
   (for example an older version extracted with `git archive`).
2. Give a **separate reviewer** (a sub-agent with no build context) only `tools/review/rubric.md` and the
   round folder. It writes `review/<id>/round-<n>/review.md`: defects with evidence, scorecard out of 100,
   a line per scene, the ten worst problems with fixes.
3. Fix the FAIL rows and the worst problems. Re-run steps 1–2 (only changed scenes if you like).
4. Ship when no defect fails and the total is ≥ 80, after at least two rounds; stop after three rounds
   and list what is still short.

## Pacing rules of thumb (from the reviews)

- Narration about 140–150 words per minute; never above 175 for a beat.
- A beat that introduces a shape holds for at least 1.5 s after the shape appears.
- One new idea at a time: the picture for an idea appears when the voice reaches it, not before.
- Shapes are text, large and axis-coloured, next to the thing they describe; 3-D is for showing extra
  axes (batch, heads, layers), with the camera still while anything must be read.
