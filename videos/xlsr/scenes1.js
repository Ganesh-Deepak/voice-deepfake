// Scenes 0–5: intro, overview, tensors, audio, convolution, feature encoder
(function () {
  const { W, COL, clamp, lerp, easeIO, noise, fmt, fmtInt, rgba, vcol, txt, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box,
    cells, mat, dimTop, dimLeft, stack, numRow, brace, cross, WAVE, drawWave } = E;
  const S_ = window.SCENES;

  const { THEME, easeOut4, glow, penTip } = E;
  // ---- shared helpers for the XLS-R episode ----
  const X = window.XL = {};
  X.at = (S, b, dt = 0) => { const B = S.sc.beats[Math.min(b, S.sc.beats.length - 1)]; return B.start + dt * B.k; };
  // camera keys: [beat, design-time offset, {yaw, pitch, dist, tx, ty, tz, cx, cy}]
  X.world = (ctx, S, keys, o = {}) => {
    const cam = S3.camAt(S.local, keys.map(([b, dt, v]) => [b < 0 ? 0 : X.at(S, b, dt), v]), o.k || 60, o.d || 15);
    if (o.floor !== false) S3.floor(ctx, cam, o.floorY ?? -300, { alpha: o.floorAlpha ?? 1 });
    S3.dust(ctx, cam, S.t, { alpha: o.dustAlpha ?? 1 });
    return cam;
  };
  X.card = (ctx, x, y, w, h, a, o = {}) => box(ctx, x, y, w, h, null, Object.assign({ alpha: a, r: 20, stroke: 'rgba(150,175,225,0.28)', fill: 'rgba(16,22,40,0.82)' }, o));
  X.ln = n => S3.len(n);
  // value-coloured cell function with a given seed
  X.cellsFn = (seed, a = 0.95) => (r, c, f) => vcol(noise(r + f * 31, c, seed) * 0.95, a);

  // ------------------------------------------------------------------ 0 cold open
  S_.push({
    id: 'x_intro', chapter: 0, title: 'Introduction', noHeader: true,
    beats: [
      "Welcome. This is X L S R, the speech model with three hundred million parameters that sits at the front of today's strongest voice deepfake detectors. In this video we'll follow the numbers through it, one tensor at a time, from raw audio to the features a detector reads.",
      "X L S R was pre-trained by Meta on about four hundred and thirty-six thousand hours of unlabeled speech, in one hundred and twenty-eight languages. Under the hood it's a wav2vec 2.0 model, scaled up. Its three hundred million parameter version stacks twenty-four transformer layers. [+0.5] Each layer is one thousand and twenty-four numbers wide, with sixteen attention heads.",
      "We'll build every piece from scratch: convolution, normalization, matrix multiplication and attention. And because tensor shapes are where most of the confusion lives, the capsule at the bottom of the screen always shows the shape we're holding right now.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: '({B:B}, {T:16000})' } : null,
    draw(ctx, S) {
      const T = S.T(0);
      const cam = X.world(ctx, S, [
        [0, -2, { yaw: -0.7, pitch: 0.18, dist: 2300, tx: 0, ty: 20, tz: 0, cx: 1300, cy: 560 }],
        [0, 1.5, { yaw: -0.32, dist: 1850 }], [0, 8, { yaw: 0.05, dist: 1750 }],
        [1, 0, { yaw: 0.5, pitch: 0.12, dist: 1900 }], [2, 0, { yaw: 0.85, pitch: 0.26, dist: 2000, cx: 1320 }],
      ], { floorY: -250 });
      const gone = 1 - S.p(1, 0.7, 0);
      // waveform -> (B, 512, 201) -> (B, 201, 1024) -> 24 layers
      const rib = S.l(0, 2.4, 0.3) ;
      S3.ribbon(ctx, cam, -430, 430, 10, 0, 130, { reveal: rib, color: THEME.a, lw: 2.2, alpha: (1 - S.p(0, 0.6, 3.6)) });
      const b1 = S.p(0, 0.9, 3.7), grow = easeIO((T - 7.0) / 1.1);
      if (b1 > 0) {
        const h = lerp(240, 330, grow), w = 300;
        S3.block(ctx, cam, { x: 0, y: 0, z: 0, w, h, d: 90, cells: [grow > 0.5 ? 12 : 9, 16, 3], seed: 11, reveal: S.l(0, 1.2, 3.7), alpha: b1 * gone, color: THEME.a, glow: THEME.b,
        });
        // 24 layer plates around it
        for (let i = 0; i < 24; i++) {
          const k = easeOut4((T - 9.6 - i * 0.05) / 0.5);
          if (k <= 0) continue;
          S3.gate(ctx, cam, -560 + i * 48.7, 0, 0, 470, 260, { color: THEME.b, alpha: 0.55 * k * gone, fill: 0.035, edge: 0.55, lw: 1.4 });
        }
      }
      // beat 1: the data — a globe of 128 languages
      const g = S.p(1, 0.9, 0.2) * (1 - S.p(2, 0.6, 0));
      if (g > 0) {
        const lit = clamp((S.T(1) - 3.2) / 4);
        S3.sphere(ctx, cam, 0, 20, 0, 290, 640, S.t, { alpha: g, spin: 0.12, hot: i => (i % 5 === 2 && (i / 640) < lit * 1.0 + 0.001) ? (i % 2 ? THEME.a : THEME.c) : null });
        S3.caption(ctx, cam, 0, -350, 0, '128 languages · 436K hours', { size: 26, mono: false, weight: 700, color: COL.text, alpha: S.p(1, 0.6, 3.2) * (1 - S.p(2, 0.6, 0)) });
      }
      // beat 2: the model comes back as the input tensor
      const b2 = S.p(2, 0.8, 0.6);
      if (b2 > 0) S3.block(ctx, cam, { x: 0, y: -10, z: 0, w: 430, h: 34, d: 70, cells: [1, 28, 3], seed: 5, alpha: b2, color: THEME.a, reveal: S.l(2, 1.0, 0.6) });
      // title block
      E.kicker(ctx, 'DEEPFAKE DETECTORS · SHAPE BY SHAPE', 154, 196, T + 1.0);
      chip(ctx, 760, 188, 'EPISODE 1 / 3', { size: 20, mono: true, color: THEME.a, stroke: rgba(THEME.a, 0.6), fill: rgba(THEME.a, 0.08), alpha: S.p(0, 0.5, 0.3) });
      E.titleRise(ctx, 'XLS-R 300M', 150, 360, T + 0.7, { size: 150, c2: THEME.a });
      txt(ctx, 'the 24-layer front end of modern deepfake detectors', 156, 428, { size: 34, weight: 500, color: COL.dim, alpha: S.p(0, 0.9, 0.6) });
      // stats grid
      // [value, label, sentence of beat 1 that says it, design-time offset into that sentence]
      const stats = [['315.4 M', 'parameters', 2, 0.3], ['24', 'transformer layers', 2, 2.4], ['1,024', 'numbers per frame', 3, 0.6], ['16', 'attention heads', 3, 2.6],
        ['128', 'languages', 0, 6.6], ['436 K', 'hours of speech', 0, 2.6]];
      const so = 1 - S.p(2, 0.5, 0);
      stats.forEach(([v, lab, sn, dl], i) => {
        const a = S.ps(1, sn, 0.6, dl) * so, x = 154 + (i % 3) * 300, y = 600 + Math.floor(i / 3) * 140;
        if (a <= 0) return;
        txt(ctx, v, x, y + 14 * (1 - easeOut4(a)), { size: 58, weight: 700, mono: 'display', color: i === 0 ? THEME.a : COL.text, alpha: a });
        txt(ctx, lab, x + 2, y + 36, { size: 22, weight: 600, color: COL.dim, alpha: a });
      });
      const w2 = S.ps(1, 1, 0.6) * so;
      if (w2 > 0) chip(ctx, 154, 860, 'wav2vec 2.0: Meta’s 2020 self-supervised speech model', { size: 24, color: COL.H, stroke: rgba(COL.H, 0.6), fill: rgba(COL.H, 0.08), alpha: w2 });
      // beat 2: what we'll build, and where to look
      const topics = [['1-D convolution', COL.K], ['layer norm', COL.A], ['matrix multiplication', COL.C], ['self-attention', COL.H]];
      let x = 154;
      topics.forEach((tp, i) => {
        const a = S.p(2, 0.6, 1.0 + i * 0.6);
        x += chip(ctx, x, 620, tp[0], { size: 28, color: tp[1], stroke: rgba(tp[1], 0.6), fill: rgba(tp[1], 0.08), alpha: a }) + 22;
      });
      const c2 = S.p(2, 0.8, 6.5);
      if (c2 > 0) {
        txt(ctx, 'the shape we are holding', 1450, 900, { size: 28, weight: 700, color: THEME.a, align: 'center', alpha: c2 });
        arrow(ctx, 1560, 914, 1680, 984, { color: THEME.a, alpha: c2, p: c2 });
        txt(ctx, 'the stage of the pipeline', 420, 900, { size: 28, weight: 700, color: THEME.a, align: 'center', alpha: S.p(2, 0.8, 7.6) });
        arrow(ctx, 330, 914, 230, 984, { color: THEME.a, alpha: S.p(2, 0.8, 7.6), p: S.p(2, 0.8, 7.6) });
      }
    },
  });

  // ------------------------------------------------------------------ 1 overview
  S_.push({
    id: 'overview', chapter: 1, title: 'The big picture',
    beats: [
      "Here is the whole journey in one picture. On the left, raw audio: a long list of numbers. [+0.8] We'll follow one second of it, because small numbers are easier to see.",
      "First, a stack of seven convolution layers, called the feature encoder, squeezes those numbers into a short sequence of frames. One frame every twenty milliseconds, each described by five hundred and twelve numbers. PyTorch keeps these channels first: B, by five hundred and twelve channels, by forty-nine frames.",
      "A small projection widens each frame to one thousand and twenty-four numbers: the width of the whole model.",
      "Then a transformer, twenty-four layers deep, lets every frame look at every other frame, so each one becomes aware of its context.",
      "The output is a sequence of context vectors, one per twenty milliseconds of audio. That is what a deepfake detector's back-end reads.",
      "During pre-training there's one more branch: a quantizer that turns the encoder's frames into discrete targets, and a contrastive loss that teaches the transformer to predict them. We'll get to that near the end.",
      "For one second of audio, here are the shapes we'll derive. Sixteen thousand samples become five hundred and twelve channels by forty-nine frames. A transpose and a projection turn that into forty-nine frames by one thousand and twenty-four, and it stays forty-nine by one thousand and twenty-four all the way through the transformer. Detectors use four-second crops, which simply give two hundred and one frames instead of forty-nine. We'll get there at the end.",
    ],
    hud: S => [{ stage: 0, shape: '({B:B}, {T:16000})' }, { stage: 1, shape: '({B:B}, {C:512}, {T:49})' }, { stage: 2, shape: '({B:B}, {T:49}, {C:1024})' },
      { stage: 5, shape: '({B:B}, {T:49}, {C:1024})' }, { stage: 6, shape: '({B:B}, {T:49}, {C:1024})' }][Math.min(S.b, 4)],
    draw(ctx, S) {
      const y = 290, h = 210, cy = y + h / 2;
      const on6 = () => {
        const t6 = S.T(6);
        return t6 >= S.st(6, 3) ? [] : t6 >= S.st(6, 2) ? [2, 3, 4] : t6 >= S.st(6, 1) ? [0, 1] : [];
      };
      const hl = i => (S.b === 6 ? on6().includes(i) : S.b === i) ? COL.A : null;
      const q = 1 - S.p(6, 0.8);
      // waveform box
      const a0 = S.p(0);
      box(ctx, 70, y, 300, h, null, { alpha: a0, glow: hl(0), stroke: hl(0) || COL.line });
      drawWave(ctx, 90, cy - 10, 260, 120, { alpha: a0 });
      txt(ctx, 'raw audio', 220, y + h - 22, { size: 26, weight: 700, align: 'center', alpha: a0 });
      // encoder
      const a1 = S.p(1);
      arrow(ctx, 380, cy, 445, cy, { p: a1, color: COL.dim });
      box(ctx, 455, y, 330, h, ['Feature encoder', '7 × 1-D convolution'], { alpha: a1, glow: hl(1), stroke: hl(1) || COL.line, color: COL.K });
      // mini frames under encoder
      if (a1 > 0) for (let i = 0; i < 9; i++) rrect(ctx, 490 + i * 30, y + h - 44, 22, 26, 4, rgba(COL.C, 0.5 * a1), null);
      // projection
      const a2 = S.p(2);
      arrow(ctx, 795, cy, 860, cy, { p: a2 });
      box(ctx, 870, y, 250, h, ['Projection', '{C:512} → {C:1024}'], { alpha: a2, glow: hl(2), stroke: hl(2) || COL.line, color: COL.C });
      // transformer
      const a3 = S.p(3);
      arrow(ctx, 1130, cy, 1195, cy, { p: a3 });
      box(ctx, 1205, y, 340, h, ['Transformer', '24 layers of self-attention'], { alpha: a3, glow: hl(3), stroke: hl(3) || COL.line, color: COL.H });
      if (a3 > 0) {
        ctx.save(); ctx.globalAlpha = a3 * 0.8; ctx.strokeStyle = COL.H; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const x1 = 1250 + i * 50, x2 = 1250 + ((i * 3 + 2) % 6) * 50;
          ctx.beginPath(); ctx.moveTo(x1, y + 40); ctx.quadraticCurveTo((x1 + x2) / 2, y + 40 - 26 - Math.abs(x2 - x1) * 0.12, x2, y + 40); ctx.stroke();
        }
        ctx.restore();
      }
      // output
      const a4 = S.p(4);
      arrow(ctx, 1555, cy, 1620, cy, { p: a4 });
      box(ctx, 1630, y, 230, h, null, { alpha: a4, glow: hl(4), stroke: hl(4) || COL.line });
      if (a4 > 0) {
        for (let i = 0; i < 7; i++) for (let j = 0; j < 6; j++) {
          ctx.fillStyle = vcol(noise(i, j, 9), 0.9 * a4); ctx.fillRect(1660 + i * 25, y + 30 + j * 18, 21, 15);
        }
        txt(ctx, 'context vectors', 1745, y + h - 22, { size: 24, weight: 700, align: 'center', alpha: a4 });
      }
      // pretraining branch
      const a5 = S.p(5) * q;
      if (a5 > 0) {
        ctx.save(); ctx.globalAlpha = a5;
        rrect(ctx, 800, 630, 900, 230, 18, null, rgba(COL.M, 0.6), 2);
        ctx.setLineDash([]);
        txt(ctx, 'pre-training only', 820, 662, { size: 22, weight: 700, color: COL.M });
        parrow(ctx, [[828, y + h + 6], [828, 745], [900, 745]], { color: COL.M });
        box(ctx, 910, 690, 260, 110, ['Quantizer', 'discrete targets {M:q}'], { color: COL.M, size: 28 });
        arrow(ctx, 1180, 745, 1290, 745, { color: COL.M });
        box(ctx, 1300, 690, 360, 110, ['Contrastive loss', 'predict {M:q} at masked frames'], { color: COL.M, size: 28 });
        arrow(ctx, 1480, y + h + 6, 1480, 684, { color: COL.M });
        ctx.restore();
      }
      // shapes
      const shapes = [[220, '({B:B}, {T:16000})'], [620, '({B:B}, {C:512}, {T:49})'], [995, '({B:B}, {T:49}, {C:1024})'], [1375, '({B:B}, {T:49}, {C:1024})'], [1745, '({B:B}, {T:49}, {C:1024})']];
      shapes.forEach((s, i) => {
        // each stage's shape appears when the stage is introduced, and stays
        const a = Math.max(S.p(6, 0.6, [0.2, 3.2, 5.8, 8.2, 9.4][i]), [S.p(0, 0.6, 2.5), S.ps(1, 2), S.p(2, 0.6, 2), S.p(3, 0.6, 3), S.p(4, 0.6, 1.5)][i]);
        if (a <= 0) return;
        mtxt(ctx, s[1], s[0], 575, { size: hl(i) ? 30 : 27, mono: true, align: 'center', alpha: a, color: hl(i) ? COL.text : COL.dim });
      });
      // beat 1 callout: what one frame is
      const fr = S.ps(1, 1) * (1 - S.p(2, 0.5, 0));
      if (fr > 0) mtxt(ctx, '1 frame every {A:20 ms}  ·  {C:512} numbers per frame', 620, 640, { size: 28, align: 'center', alpha: fr, weight: 600 });
      // the detector crop, named on the screen too
      const cr = S.ps(6, 3);
      if (cr > 0) mtxt(ctx, 'detectors: 4 s crop = {T:64,600} samples  →  {T:201} frames  →  ({B:B}, {T:201}, {C:1024})', W / 2, 770, { size: 30, mono: true, align: 'center', alpha: cr, color: COL.text });
      const a6 = S.p(6, 0.6, 11) * (1 - S.ps(6, 3, 0.5));
      mtxt(ctx, '{T:16000} samples  →  {C:512} ch × {T:49} frames  →  transpose + project  →  {T:49} × {C:1024}  →  transformer keeps it', W / 2, 700, { size: 32, align: 'center', alpha: a6, weight: 500 });
    },
  });

  // ------------------------------------------------------------------ 2 tensors
  S_.push({
    id: 'tensors', chapter: 2, title: 'Tensors and shapes',
    beats: [
      "Let's start with vocabulary. A single number is called a scalar.",
      "A list of numbers is a vector. Its shape is just its length. This one has shape five.",
      "A grid of numbers is a matrix. Its shape is rows by columns. This one is three by five.",
      "Stack several grids and you have a three-dimensional tensor, whose shape has three numbers. [+1] A tensor is simply an array with any number of axes, and the shape tells you how long each axis is.",
      "In this video every axis gets a name and a color. Green B is the batch: how many audio clips we process at once. Blue T is time: audio samples, or later, frames. Orange C is channels, or features: how many numbers describe each moment in time. Later, purple H will count attention heads.",
      "One rule to remember. Most operations change only one axis and leave the others alone. Understanding X L S R is mostly about knowing which axis each step touches.",
    ],
    hud: null,
    draw(ctx, S) {
      const fade = 1 - 0.65 * S.p(4);
      const cy = 330;
      // scalar
      const a0 = S.p(0) * fade;
      numRow(ctx, 150, cy - 45, [0.42], 100, 90, { size: 28, alpha: a0, fill: () => vcol(0.42, 0.35 * a0), valAlpha: () => a0, stroke: rgba(COL.dim, a0) });
      txt(ctx, 'scalar', 200, 470, { size: 30, weight: 700, align: 'center', alpha: a0 });
      txt(ctx, 'shape ( )', 200, 515, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: a0 });
      // vector
      const a1 = S.p(1) * fade;
      const v = [0.42, -0.17, 0.88, 0.05, -0.61];
      if (a1 > 0) { ctx.save(); ctx.globalAlpha = a1; numRow(ctx, 300, cy - 40, v, 84, 80, { size: 22 }); ctx.restore(); }
      txt(ctx, 'vector', 510, 470, { size: 30, weight: 700, align: 'center', alpha: a1 });
      txt(ctx, 'shape (5)', 510, 515, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: a1 });
      // matrix
      const a2 = S.p(2) * fade;
      if (a2 > 0) {
        ctx.save(); ctx.globalAlpha = a2;
        for (let r = 0; r < 3; r++) numRow(ctx, 920, cy - 105 + r * 70, v.map((_, c) => noise(r, c, 3) * 0.95), 66, 62, { size: 18 });
        ctx.restore();
        dimLeft(ctx, 914, cy - 105, 210, '3 rows', COL.dim, 22);
      }
      txt(ctx, 'matrix', 1085, 470, { size: 30, weight: 700, align: 'center', alpha: a2 });
      txt(ctx, 'shape (3, 5)', 1085, 515, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: a2 });
      // 3-D
      const kT = S.p(4, 0.6) * (1 - S.p(5, 0.6));
      const a3 = S.p(3) * lerp(fade, 1, kT);
      if (a3 > 0) {
        ctx.save(); ctx.globalAlpha = a3;
        stack(ctx, 3, 34, 34, i => {
          rrect(ctx, 1380, cy - 80, 300, 180, 8, COL.bg2, null);
          cells(ctx, 1380, cy - 80, 3, 5, 60, 60, (r, c) => vcol(noise(r + i * 7, c, 4) * 0.95, 0.85), 4);
          rrect(ctx, 1380, cy - 80, 300, 180, 8, null, COL.line, 2);
        });
        ctx.restore();
      }
      // the same tensor read with named axes: 3 clips (B) of 3 channels (C) by 5 time steps (T)
      const ax = [1, 2, 3].map(j => kT * S.ps(4, j, 0.6, 0.2));
      if (ax[0] > 0) {
        ctx.save(); ctx.globalAlpha = ax[0];
        line(ctx, 1690, cy + 110, 1758, cy + 42, COL.B, 3);
        txt(ctx, 'B = 3', 1770, cy + 92, { size: 26, weight: 700, color: COL.B });
        ctx.restore();
      }
      if (ax[1] > 0) { ctx.save(); ctx.globalAlpha = ax[1]; dimTop(ctx, 1448, cy - 148, 300, 'T = 5', COL.T, 26); ctx.restore(); }
      if (ax[2] > 0) { ctx.save(); ctx.globalAlpha = ax[2]; dimLeft(ctx, 1380, cy - 80, 180, 'C = 3', COL.C, 26); ctx.restore(); }
      txt(ctx, '3-D tensor', 1560, 470, { size: 30, weight: 700, align: 'center', alpha: a3 });
      const named = S.ps(4, 3, 0.6, 0.2) * (S.b >= 4 ? 1 : 0);
      txt(ctx, 'shape (3, 3, 5)', 1560, 515, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: a3 * (1 - named) });
      if (named > 0) mtxt(ctx, '({B:3}, {C:3}, {T:5})', 1560, 515, { size: 28, mono: true, align: 'center', alpha: a3 * named });
      // definition
      const d3 = S.vis(3, 4, 0.7, 0.4);
      if (d3 > 0) {
        mtxt(ctx, 'tensor = array with any number of axes', W / 2, 700, { size: 40, weight: 600, align: 'center', alpha: d3 });
        mtxt(ctx, 'shape = the length of each axis', W / 2, 770, { size: 40, weight: 600, align: 'center', alpha: d3, color: COL.dim });
      }
      // legend
      const leg = [['B', 'batch', 'how many clips we process at once'], ['T', 'time', 'audio samples, later frames (one per 20 ms)'],
        ['C', 'channels / features', 'how many numbers describe one moment'], ['H', 'heads', 'parallel attention heads (later)']];
      const a4 = S.vis(4, 5, 0.7, 0.5);
      if (a4 > 0) leg.forEach((l, i) => {
        const a = a4 * S.ps(4, i + 1, 0.6, 0.2);
        const x = i % 2 ? 1000 : 170, yy = 640 + Math.floor(i / 2) * 120;
        rrect(ctx, x, yy, 80, 80, 14, rgba(COL[l[0]], 0.15 * a), rgba(COL[l[0]], a), 3);
        txt(ctx, l[0], x + 40, yy + 42, { size: 44, weight: 800, align: 'center', base: 'middle', color: COL[l[0]], alpha: a });
        txt(ctx, l[1], x + 110, yy + 32, { size: 32, weight: 700, alpha: a });
        txt(ctx, l[2], x + 110, yy + 68, { size: 24, color: COL.dim, alpha: a });
      });
      // rule
      const a5 = S.p(5);
      if (a5 > 0) {
        txt(ctx, 'Most operations change one axis and leave the others alone.', W / 2, 670, { size: 38, weight: 700, align: 'center', alpha: a5 });
        const b = S.p(5, 0.8, 2.5);
        mtxt(ctx, '({B:B}, {T:49}, {C:512})', 620, 800, { size: 42, mono: true, align: 'center', alpha: b, color: COL.dim });
        arrow(ctx, 850, 787, 1040, 787, { alpha: b, color: COL.dim });
        txt(ctx, 'linear layer', 945, 765, { size: 22, align: 'center', color: COL.dim, alpha: b });
        mtxt(ctx, '({B:B}, {T:49}, {C:1024})', 1290, 800, { size: 42, mono: true, align: 'center', alpha: b, color: COL.dim });
        const c = S.p(5, 0.6, 4), so = { size: 42, mono: true };
        const sw = mwidth(ctx, '({B:B}, {T:49}, {C:1024})', so), xs = 1290 - sw / 2 + mwidth(ctx, '(B, 49, ', so), w4 = mwidth(ctx, '1024', so);
        rrect(ctx, xs - 10, 762, w4 + 20, 58, 10, null, rgba(COL.C, c), 3);
        txt(ctx, 'only C changed', xs + w4 / 2, 870, { size: 24, weight: 600, align: 'center', color: COL.C, alpha: c });
        // a compact legend stays docked while the example is read
        [['B', 'batch'], ['T', 'time'], ['C', 'channels'], ['H', 'heads']].forEach(([k, n], i) => chip(ctx, 560 + i * 210, 560, `${k}  ${n}`, { size: 22, color: COL[k], stroke: rgba(COL[k], 0.7), fill: rgba(COL[k], 0.1), alpha: a5 }));
      }
    },
  });

  // ------------------------------------------------------------------ 3 audio
  const quiet = (() => {
    const g = 0.22, off = 0.035;
    let m = 0, s = 0;
    for (let i = 0; i < WAVE.length; i++) m += WAVE[i] * g + off;
    m /= WAVE.length;
    for (let i = 0; i < WAVE.length; i++) s += Math.pow(WAVE[i] * g + off - m, 2);
    return { g, off, mean: m, std: Math.sqrt(s / WAVE.length) };
  })();
  S_.push({
    id: 'audio', chapter: 3, title: 'Sound as numbers',
    code: 'input_values: (B, 16000) float32',
    beats: [
      "Now, what is audio to a computer? A microphone measures air pressure, and we record that pressure many times per second.",
      "X L S R expects sixteen thousand measurements per second. That's a sampling rate of sixteen kilohertz. Each measurement is one number, called a sample, usually between minus one and one.",
      "Zoom in, and you can see the individual samples. Every dot is one number. Neighbouring samples are one sixteen-thousandth of a second apart: sixty-two and a half microseconds.",
      "So one second of audio is a vector of sixteen thousand numbers. [+1] A batch of B clips of the same length has shape B by sixteen thousand. With a batch of one, it's one by sixteen thousand.",
      "Before entering the model, each clip is normalized. The Hugging Face feature extractor for X L S R subtracts the clip's mean and divides by its standard deviation, so every clip has mean zero and variance one. Loud and quiet recordings end up on the same scale. The shape doesn't change.",
      "Notice what's missing: there's no spectrogram, and no hand-crafted features. The model reads the raw waveform directly. For deepfake detection that's attractive, because subtle artifacts left behind by a vocoder can survive in the raw samples, where a spectrogram might blur them.",
    ],
    hud: S => ({ stage: 0, shape: S.b >= 3 ? '({B:B}, {T:16000})' : '({T:16000})' }),
    draw(ctx, S) {
      const top = S.vis(0, 3);
      if (top > 0) {
        ctx.save(); ctx.globalAlpha = top;
        const x0 = 140, w = 1640, yc = 330, hh = 300;
        line(ctx, x0, yc, x0 + w, yc, COL.line, 1);
        drawWave(ctx, x0, yc, w, hh, { reveal: easeIO(S.l(0, 2.5)), lw: 1.6 });
        for (let i = 0; i <= 10; i++) {
          line(ctx, x0 + i * w / 10, yc + hh / 2 + 10, x0 + i * w / 10, yc + hh / 2 + 20, COL.faint, 2);
          txt(ctx, (i / 10).toFixed(1) + ' s', x0 + i * w / 10, yc + hh / 2 + 46, { size: 20, align: 'center', color: COL.faint, mono: true });
        }
        txt(ctx, 'air pressure →', x0, 160, { size: 24, color: COL.dim, alpha: S.p(0, 0.6, 1) });
        const a1 = S.p(1);
        if (a1 > 0) {
          mtxt(ctx, '{T:16,000} samples per second  =  16 kHz', x0 + w, 160, { size: 32, weight: 600, align: 'right', alpha: a1 });
          // zoom box
          const zx = x0 + 0.10 * w, zw = w * 40 / 16000 * 6;
          const za = S.p(1, 0.6, 5);
          rrect(ctx, zx - 4, yc - 150, zw + 8, 300, 6, null, rgba(COL.K, za), 3);
        }
        ctx.restore();
      }
      // zoom panel with stems
      const z = S.vis(2, 3);
      if (z > 0) {
        ctx.save(); ctx.globalAlpha = z;
        const n = 40, x0 = 180, w = 1560, yc = 740;
        let im = 1500; for (let i = 1500; i < 1800; i++) if (Math.abs(WAVE[i]) > Math.abs(WAVE[im])) im = i;
        const i0 = im - 22;
        let mxv = 0; for (let k = 0; k < n; k++) mxv = Math.max(mxv, Math.abs(WAVE[i0 + k]));
        const amp = 165 / mxv;
        const zx = 140 + 0.10 * 1640;
        ctx.globalAlpha = z * 0.5;
        line(ctx, zx, 480, x0, yc - 200, COL.K, 1.5, [6, 6]);
        line(ctx, zx + 1640 * 40 / 16000 * 6, 480, x0 + w, yc - 200, COL.K, 1.5, [6, 6]);
        ctx.globalAlpha = z;
        rrect(ctx, x0 - 30, yc - 205, w + 60, 410, 14, 'rgba(19,27,40,0.85)', rgba(COL.K, 0.6), 2);
        line(ctx, x0, yc, x0 + w, yc, COL.line, 1);
        for (let k = 0; k < n; k++) {
          const v = WAVE[i0 + k], x = x0 + (k + 0.5) * w / n, y = yc - v * amp;
          const a = S.p(2, 0.3, 0.3 + k * 0.05);
          ctx.globalAlpha = z * a;
          line(ctx, x, yc, x, y, rgba(COL.T, 0.6), 2);
          ctx.fillStyle = COL.T; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
          if (k % 6 === 2) txt(ctx, fmt(WAVE[i0 + k], 3), x, v > 0 ? y - 18 : y + 34, { size: 18, mono: true, align: 'center', color: COL.text });
        }
        ctx.globalAlpha = z * S.p(2, 0.6, 4);
        const xa = x0 + 20.5 * w / n, xb = x0 + 21.5 * w / n;
        brace(ctx, xa, xb, yc + 120, COL.K, true);
        txt(ctx, '1 / 16000 s = 62.5 µs', (xa + xb) / 2, yc + 120 + 60, { size: 24, weight: 700, align: 'center', color: COL.K });
        ctx.restore();
      }
      // vector + batch
      const a3 = S.vis(3, 4);
      if (a3 > 0) {
        ctx.save(); ctx.globalAlpha = a3;
        const vals = [0, 1, 2, 3, 4, 5].map(i => WAVE[1600 + i * 7]);
        mtxt(ctx, 'x  =  [ ' + vals.slice(0, 5).map(v => fmt(v, 3)).join(',  ') + ',  … ,  ' + fmt(WAVE[15999], 3) + ' ]', W / 2, 250, { size: 36, mono: true, align: 'center' });
        brace(ctx, 330, 1590, 280, COL.T, true);
        mtxt(ctx, '{T:16000} numbers  →  shape ({T:16000})', W / 2, 360, { size: 32, align: 'center', weight: 600 });
        const b = S.p(3, 0.8, 5);
        ctx.globalAlpha = a3 * b;
        stack(ctx, 4, 26, 26, i => {
          rrect(ctx, 420, 520, 1000, 180, 10, COL.panel, COL.line, 2);
          drawWave(ctx, 440, 610, 960, 150, { from: i * 1000, to: 16000 - i * 800, color: COL.T, lw: 1.2 });
        });
        dimLeft(ctx, 410, 520, 180, '{B:B} clips', COL.B, 28);
        txt(ctx, '→', 1520, 610, { size: 48, color: COL.dim, base: 'middle' });
        mtxt(ctx, '({B:B}, {T:16000})', 1600, 600, { size: 40, mono: true, base: 'middle' });
        mtxt(ctx, 'B = 1  →  ({B:1}, {T:16000})', 1560, 670, { size: 26, mono: true, base: 'middle', color: COL.dim, alpha: S.p(3, 0.6, 8) });
        ctx.restore();
      }
      // normalization
      const a4 = S.vis(4, 5);
      if (a4 > 0) {
        ctx.save(); ctx.globalAlpha = a4;
        mtxt(ctx, 'x̂  =  (x − mean) / std', W / 2, 220, { size: 48, mono: true, align: 'center', weight: 600 });
        const L = 220, R = 1060, ww = 640, yc = 520;
        rrect(ctx, L - 20, 330, ww + 40, 380, 14, COL.panel, COL.line, 2);
        rrect(ctx, R - 20, 330, ww + 40, 380, 14, COL.panel, COL.line, 2);
        line(ctx, L, yc, L + ww, yc, COL.faint, 1, [4, 6]);
        line(ctx, R, yc, R + ww, yc, COL.faint, 1, [4, 6]);
        // waves stay inside their panels, clear of the title and the mean/std readout
        ctx.save(); ctx.beginPath(); ctx.rect(L - 20, 392, ww + 40, 262); ctx.rect(R - 20, 392, ww + 40, 262); ctx.clip();
        // quiet clip: draw manually with offset
        ctx.strokeStyle = COL.T; ctx.lineWidth = 1.4; ctx.beginPath();
        for (let px = 0; px < ww; px++) {
          const i0 = Math.floor(px / ww * 16000), i1 = Math.floor((px + 1) / ww * 16000);
          let lo = 9, hi = -9;
          for (let i = i0; i < i1; i++) { const v = WAVE[i] * quiet.g + quiet.off; lo = Math.min(lo, v); hi = Math.max(hi, v); }
          ctx.moveTo(L + px, yc - hi * 150); ctx.lineTo(L + px, yc - lo * 150);
        }
        ctx.stroke();
        const nb = S.p(4, 1.2, 3);
        const g = lerp(quiet.g, 1 / quiet.std * quiet.g * 0.2, nb);
        ctx.strokeStyle = COL.A; ctx.beginPath();
        for (let px = 0; px < ww; px++) {
          const i0 = Math.floor(px / ww * 16000), i1 = Math.floor((px + 1) / ww * 16000);
          let lo = 9, hi = -9;
          for (let i = i0; i < i1; i++) { const v = WAVE[i] * g + quiet.off * (1 - nb); lo = Math.min(lo, v); hi = Math.max(hi, v); }
          ctx.moveTo(R + px, yc - hi * 150); ctx.lineTo(R + px, yc - lo * 150);
        }
        ctx.stroke();
        ctx.restore();
        txt(ctx, 'a quiet recording', L + ww / 2, 370, { size: 26, weight: 700, align: 'center' });
        txt(ctx, `mean = ${quiet.mean.toFixed(3)}   std = ${quiet.std.toFixed(3)}`, L + ww / 2, 680, { size: 22, mono: true, align: 'center', color: COL.dim });
        txt(ctx, 'after normalization', R + ww / 2, 370, { size: 26, weight: 700, align: 'center', color: COL.A });
        txt(ctx, 'mean = 0.000   std = 1.000', R + ww / 2, 680, { size: 22, mono: true, align: 'center', color: COL.dim, alpha: nb });
        arrow(ctx, L + ww + 30, yc, R - 30, yc, { color: COL.dim });
        mtxt(ctx, 'shape unchanged: ({B:B}, {T:16000})', W / 2, 800, { size: 30, align: 'center', weight: 600, alpha: S.ps(4, 3, 0.6) });
        ctx.restore();
      }
      // no spectrogram
      const a5 = S.p(5);
      if (a5 > 0) {
        ctx.save(); ctx.globalAlpha = a5;
        rrect(ctx, 200, 260, 520, 330, 14, COL.panel, COL.line, 2);
        cells(ctx, 230, 290, 14, 24, 460 / 24, 270 / 14, (r, c) => E.scol(clamp(0.15 + 0.7 * Math.exp(-Math.pow((r - 9 - 2 * Math.sin(c / 3)) / 2.5, 2)) + 0.2 * noise(r, c, 5)), 0.9), 1);
        txt(ctx, 'spectrogram / MFCC', 460, 640, { size: 28, weight: 700, align: 'center', color: COL.dim });
        cross(ctx, 460, 425, 120, rgba(COL.R, S.p(5, 0.5, 1.2)), 10);
        rrect(ctx, 900, 260, 820, 330, 14, COL.panel, rgba(COL.A, 0.6), 2);
        drawWave(ctx, 930, 425, 420, 220, {});
        arrow(ctx, 1370, 425, 1450, 425, { color: COL.dim });
        box(ctx, 1460, 355, 230, 140, ['XLS-R', 'reads raw samples'], { size: 30, color: COL.A });
        txt(ctx, 'raw waveform in, directly', 1310, 640, { size: 28, weight: 700, align: 'center', color: COL.A });
        const b = S.p(5, 0.8, 7);
        if (b > 0) {
          // a short glitch: one sharp spike in the raw samples, a soft blur across a whole window in the spectrogram
          ctx.globalAlpha = a5 * b;
          ctx.strokeStyle = COL.R; ctx.lineWidth = 3; ctx.beginPath();
          ctx.moveTo(1138, 425); ctx.lineTo(1142, 330); ctx.lineTo(1146, 515); ctx.lineTo(1150, 425); ctx.stroke();
          ctx.beginPath(); ctx.arc(1144, 425, 46, 0, 7); ctx.stroke();
          txt(ctx, 'glitch: sharp', 1144, 300, { size: 22, weight: 700, align: 'center', color: COL.R });
          rrect(ctx, 600, 300, 70, 250, 8, rgba(COL.R, 0.18), rgba(COL.R, 0.7), 2);
          txt(ctx, 'smeared over 25 ms', 635, 582, { size: 22, weight: 700, align: 'center', color: COL.R });
          ctx.globalAlpha = a5;
        }
        wrap(ctx, 'For deepfake detection: subtle vocoder artifacts can survive in the raw samples, where a spectrogram might smear them.', 200, 760, 1520, 46, { size: 32, alpha: b, color: COL.text });
        txt(ctx, 'vocoder: the part of a speech synthesizer that turns its features back into a waveform', 200, 880, { size: 24, color: '#b4c0d2', alpha: b });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 4 convolution
  const SIG = [0.2, 0.5, 0.9, 0.4, -0.3, -0.8, -0.2, 0.6, 0.7, 0.1], KER = [1, 0, -1];
  const OUT = [0, 2, 4, 6].map(p => KER.reduce((s, w, j) => s + w * SIG[p + j], 0));
  S_.push({
    id: 'conv', chapter: 4, title: '1-D convolution from scratch',
    beats: [
      "The first learned operation is a one-dimensional convolution. Here's a tiny signal of ten samples, and a kernel: three learned weights.",
      "Place the kernel at the start of the signal. Multiply each weight by the sample underneath it, and add up the products. That single sum is one output number.",
      "Then slide the kernel along. How far it jumps each time is called the stride. [+1] With a stride of two, it moves two samples at a time.",
      "Keep sliding, until the kernel no longer fits. [+1] We got four output numbers.",
      "The general rule for the output length: take the input length, subtract the kernel size, divide by the stride, round down, and add one. Here: ten minus three is seven. Divided by two is three point five. Round down to three, and add one: four. Remember this formula. It explains every length in the feature encoder.",
      "One kernel detects one kind of pattern. This one, with weights one, zero, minus one, responds to how fast the signal is changing. But we want to detect many patterns, so we run many kernels in parallel. Each kernel produces its own output row, called a channel.",
      "With five hundred and twelve kernels, one input row becomes five hundred and twelve output rows. In code, the waveform first gets a channel axis, so B by sixteen thousand becomes B by one by sixteen thousand. The first convolution turns that into B by five hundred and twelve by three thousand one hundred and ninety-nine. PyTorch stores its weights as out-channels, by in-channels, by kernel size: five hundred and twelve by one by ten. X L S R's convolutions also have a bias: one learned number per output channel.",
      "From the second layer on, the input itself has five hundred and twelve channels. Now each kernel spans all input channels at once. It's a small block of five hundred and twelve by three weights, and its output is the sum over all channels and all three positions. [+1.2] A layer with five hundred and twelve such kernels stores a weight tensor of five hundred and twelve, by five hundred and twelve, by three: about seven hundred and eighty-six thousand numbers, plus five hundred and twelve biases.",
    ],
    hud: S => {
      // the channel axis enters the capsule only when the voice introduces it (beat 6, sentence 1)
      const after = j => S.b > 6 || (S.b === 6 && S.T(6) >= S.st(6, j));
      if (after(2)) return { stage: 1, shape: '({B:B}, {C:512}, {T:3199})', label: 'after conv 1' };
      if (after(1)) return { stage: 1, shape: '({B:B}, {C:1}, {T:16000})', label: 'x[:, None]' };
      return { stage: 1, shape: '({B:B}, {T:16000})', label: 'waveform' };
    },
    code: S => S.b >= 6 ? 'conv_layers[0].conv.weight: (512, 1, 10)' : 'nn.Conv1d(1, 512, kernel_size=10, stride=5)',
    draw(ctx, S) {
      const A = S.vis(0, 5);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const cw = 130, x0 = (W - 10 * cw) / 2, ys = 330;
        // stem plot above
        line(ctx, x0, 235, x0 + 10 * cw, 235, COL.line, 1);
        SIG.forEach((v, i) => {
          const x = x0 + i * cw + cw / 2;
          line(ctx, x, 235, x, 235 - v * 60, rgba(COL.T, 0.7), 3);
          ctx.fillStyle = COL.T; ctx.beginPath(); ctx.arc(x, 235 - v * 60, 7, 0, 7); ctx.fill();
        });
        txt(ctx, 'input x', x0 - 20, ys + 48, { size: 26, weight: 700, align: 'right', color: COL.T });
        numRow(ctx, x0, ys, SIG, cw, 80, { size: 26, d: 1 });
        // kernel position
        let pos = 0, show = S.p(0, 0.6, 3);
        if (S.on(2)) pos = lerp(0, 2, easeIO(S.T(2) / 1.0));
        if (S.on(3)) {
          const t = S.T(3);
          const t2 = S.st(3, 1) - 1.6;   // the last stop is reached before "we got four"
          pos = t < t2 ? lerp(2, 4, easeIO(t / 0.8)) : lerp(4, 6, easeIO((t - t2) / 0.8));
        }
        if (S.on(4)) pos = 6;
        const kx = x0 + pos * cw;
        if (show > 0) {
          ctx.globalAlpha = A * show;
          rrect(ctx, kx - 4, ys - 8, 3 * cw + 8, 96, 12, null, COL.K, 4);
          txt(ctx, 'kernel w', x0 - 20, ys + 180, { size: 26, weight: 700, align: 'right', color: COL.K });
          numRow(ctx, kx, ys + 135, KER, cw, 70, { size: 26, d: 0, fill: () => rgba(COL.K, 0.14), stroke: COL.K });
          ctx.globalAlpha = A;
        }
        // stride annotation
        const sa = S.vis(2, 4) * S.p(2, 0.5, 1.2);
        if (sa > 0) {
          ctx.save(); ctx.globalAlpha = A * sa; ctx.strokeStyle = COL.A; ctx.lineWidth = 3;
          const xa = x0 + 0.5 * cw, xb = x0 + 2.5 * cw;
          ctx.beginPath(); ctx.moveTo(xa, ys - 20); ctx.quadraticCurveTo((xa + xb) / 2, ys - 90, xb, ys - 20); ctx.stroke();
          arrow(ctx, xb - 10, ys - 36, xb, ys - 20, { color: COL.A, head: 16 });
          txt(ctx, 'stride s = 2', (xa + xb) / 2, ys - 70, { size: 26, weight: 700, align: 'center', color: COL.A });
          ctx.restore();
        }
        // ghost at 8
        const ga = S.vis(3, 4) * S.p(3, 0.5, S.st(3, 1) - 0.4);
        if (ga > 0) {
          ctx.save(); ctx.globalAlpha = A * ga; ctx.setLineDash([8, 8]);
          rrect(ctx, x0 + 8 * cw - 4, ys - 8, 3 * cw + 8, 96, 12, null, COL.R, 3);
          ctx.restore();
          txt(ctx, "doesn't fit", x0 + 9.5 * cw, ys + 130, { size: 26, weight: 700, align: 'center', color: COL.R, alpha: A * ga });
        }
        // computation text: each stop's products stay up until the next stop replaces them,
        // and the last one stays while the general rule is read
        const comp = S.b >= 1 && S.b <= 3 ? S.p(1, 0.5, 0.8) : S.b === 4 ? 1 - S.p(4, 0.5, S.st(4, 1)) : 0;
        const stop = Math.floor(pos / 2 + 0.02) * 2;   // last stride-2 stop the kernel reached
        if (comp > 0) {
          const terms = KER.map((w, j) => `${fmt(SIG[stop + j], 1)}×(${w < 0 ? '−1' : w})`).join('  +  ');
          const res = KER.reduce((s, w, j) => s + w * SIG[stop + j], 0);
          mtxt(ctx, terms + '  =  {K:' + fmt(res, 1) + '}', W / 2, 580, { size: 32, mono: true, align: 'center', alpha: comp });
        }
        // outputs
        const yo = 650;
        txt(ctx, 'output y', x0 - 20, yo + 48, { size: 26, weight: 700, align: 'right', color: COL.C, alpha: S.p(1, 0.5, 2) });
        const outT = [[1, 2.0], [2, 1.6], [3, 1.0], [3, -1]];
        OUT.forEach((v, i) => {
          const a = S.p(outT[i][0], 0.5, outT[i][1] < 0 ? S.st(3, 1) - 0.6 : outT[i][1]);
          if (a <= 0) return;
          ctx.save(); ctx.globalAlpha = A * a;
          numRow(ctx, x0 + (2 * i + 1) * cw, yo, [v], cw, 80, { size: 26, d: 1, stroke: COL.C });
          ctx.restore();
        });
        // formula
        const f = S.p(4, 0.8);
        if (f > 0) {
          ctx.globalAlpha = A * f;
          mtxt(ctx, 'L_out  =  ⌊ (L_in − {K:k}) / {A:s} ⌋  +  1', W / 2, 820, { size: 40, mono: true, align: 'center', weight: 600 });
          mtxt(ctx, '=  ⌊ (10 − {K:3}) / {A:2} ⌋ + 1  =  ⌊ 3.5 ⌋ + 1  =  {C:4}', W / 2, 890, { size: 34, mono: true, align: 'center', alpha: S.p(4, 0.8, 3), color: COL.dim });
        }
        ctx.restore();
      }
      // many kernels -> channels
      const Bv = S.vis(5, 7);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        const T = 24, cw = 26, xi = 140, yi = 380;
        txt(ctx, 'input: 1 channel', xi, yi - 30, { size: 26, weight: 700, color: COL.T });
        cells(ctx, xi, yi, 1, T, cw, 44, (r, c) => vcol(WAVE[1600 + c * 9] * 1.1, 0.9), 3);
        const kc = [COL.K, '#9be38f', '#7cc8ff', '#ff9fb7'];
        for (let k = 0; k < 4; k++) {
          const a = k === 0 ? S.ps(5, 1, 0.5) : S.ps(5, 2, 0.5, 0.3 + k * 0.5);
          const yk = 230 + k * 110;
          ctx.globalAlpha = Bv * a;
          arrow(ctx, xi + T * cw + 12, yi + 22, 880, yk + 22, { color: rgba(kc[k], 0.7), lw: 2 });
          numRow(ctx, 880, yk, [[1, 0, -1], [1, 1, 1], [-1, 2, -1], [0.5, 1, 0.5]][k], 64, 44, { size: 17, d: 1, fill: () => rgba(kc[k], 0.15), stroke: kc[k] });
          arrow(ctx, 1076, yk + 22, 1112, yk + 22, { color: rgba(kc[k], 0.7), lw: 2 });
          cells(ctx, 1120, yk, 1, 12, 52, 44, (r, c) => vcol(noise(k, c, 21) * 0.9, 0.9), 3);
          txt(ctx, 'channel ' + (k + 1), 1760, yk + 30, { size: 22, weight: 600, color: COL.C });
        }
        ctx.globalAlpha = Bv * S.ps(5, 3, 0.6);
        txt(ctx, 'number of kernels  =  number of output channels', W / 2, 680, { size: 34, weight: 700, align: 'center', color: COL.C });
        // "with 512 kernels": the four rows become the front of a deep stack
        const st5 = S.b === 6 ? S.ps(6, 0, 0.6, 0.3) * (1 - S.ps(6, 1, 0.4)) : 0;
        if (st5 > 0) {
          ctx.globalAlpha = Bv * st5;
          for (let q = 5; q >= 1; q--) rrect(ctx, 1120 + q * 12, 230 - q * 12, 624, 374, 8, null, rgba(COL.C, 0.5), 1.5);
          txt(ctx, '× 512 kernels  →  512 output channels', 1432, 200, { size: 30, weight: 800, align: 'center', color: COL.C });
        }
        ctx.restore();
      }
      const Bw = S.vis(6, 7);
      if (Bw > 0) {
        ctx.save(); ctx.globalAlpha = Bw;
        // each piece appears on the sentence that names it
        const q1 = S.ps(6, 1), q2 = S.ps(6, 2), q3 = S.ps(6, 3), q4 = S.ps(6, 4);
        ctx.save(); ctx.globalAlpha *= q1; rrect(ctx, 100, 715, 1720, 250, 16, 'rgba(10,14,22,0.96)', COL.line, 2); ctx.restore();
        mat(ctx, 180, 810, 440, 26, { rows: 1, cols: 40, seed: 5, left: ['{C:1}', COL.C], top: ['{T:16000}', COL.T], alpha: q1 });
        ctx.globalAlpha = Bw * q2;
        arrow(ctx, 650, 822, 830, 822, { color: COL.K, p: q2 });
        txt(ctx, '512 kernels, k=10, s=5', 740, 800, { size: 22, weight: 600, align: 'center', color: COL.K });
        mat(ctx, 930, 760, 260, 150, { rows: 16, cols: 24, seed: 8, left: ['{C:512}', COL.C], top: ['{T:3199}', COL.T] });
        ctx.globalAlpha = Bw;
        mtxt(ctx, '({B:B}, {T:16000})  →  x[:, None]  →  ({B:B}, {C:1}, {T:16000})', 1100, 790, { size: 26, mono: true, align: 'center', alpha: q1 * (1 - q2) });
        mtxt(ctx, '({B:B}, {C:1}, {T:16000})  →  ({B:B}, {C:512}, {T:3199})', 1530, 790, { size: 28, mono: true, align: 'center', alpha: q2 });
        mtxt(ctx, 'weight: ({C:512}, {C:1}, {K:10}) = (out, in, kernel)', 1240, 845, { size: 22, mono: true, color: COL.dim, alpha: q3 });
        mtxt(ctx, 'bias: ({C:512},), one per output channel', 1240, 895, { size: 22, mono: true, color: COL.K, alpha: q4 });
        ctx.restore();
      }
      // multi-channel input
      const Cv = S.p(7);
      if (Cv > 0) {
        ctx.save(); ctx.globalAlpha = Cv;
        const rows = 8, cols = 20, cw = 40, ch = 38, x0 = 330, y0 = 230;
        cells(ctx, x0, y0, rows, cols, cw, ch, (r, c) => vcol(noise(r, c, 31) * 0.9, 0.85), 3);
        dimLeft(ctx, x0 - 6, y0, rows * ch, '{C:512} in', COL.C, 26);
        dimTop(ctx, x0, y0 - 6, cols * cw, 'time {T:T}', COL.T, 24);
        const steps = 9, fr = S.l(7, S.bd(7) * 0.55, 3), k = Math.min(steps - 1, Math.floor(fr * steps));
        const kx = x0 + 2 * k * cw;
        rrect(ctx, kx - 4, y0 - 4, 3 * cw + 8, rows * ch + 8, 8, rgba(COL.K, 0.12), COL.K, 4);
        // output row
        const yo = y0 + rows * ch + 70;
        txt(ctx, 'one output row', x0 - 20, yo + 28, { size: 22, weight: 600, align: 'right', color: COL.C });
        cells(ctx, x0 + cw, yo, 1, 9, 2 * cw, 40, (r, c) => c <= k ? vcol(noise(c, 3, 77), 0.9) : null, 4);
        rrect(ctx, x0 + cw + 2 * k * cw, yo - 2, 2 * cw, 44, 6, null, COL.K, 3);
        arrow(ctx, kx + 1.5 * cw, y0 + rows * ch + 8, x0 + cw + 2 * k * cw + cw, yo - 4, { color: COL.K, lw: 2, head: 10 });
        // kernel block
        const bx = 1300, by = 250;
        mat(ctx, bx, by, 3 * 36, rows * 34, { rows, cols: 3, seed: 55, stroke: COL.K, left: ['{C:512}', COL.C], top: ['{K:3}', COL.K] });
        txt(ctx, 'one kernel', bx + 54, by + rows * 34 + 50, { size: 26, weight: 700, align: 'center', color: COL.K });
        mtxt(ctx, '= {C:512} × {K:3} weights', bx + 170, by + rows * 34 / 2, { size: 26, base: 'middle' });
        mtxt(ctx, '→ one number per position', bx + 170, by + rows * 34 / 2 + 44, { size: 26, base: 'middle', color: COL.dim });
        const pa = S.ps(7, 3);
        ctx.globalAlpha = Cv * pa;
        rrect(ctx, 260, 800, 1400, 110, 14, COL.panel, rgba(COL.K, 0.5), 2);
        mtxt(ctx, 'weight ({C:512} out, {C:512} in, {K:3})  =  {K:786,432} numbers  +  {K:512} biases', W / 2, 868, { size: 32, mono: false, weight: 600, align: 'center' });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 5 feature encoder
  const KS = [10, 3, 3, 3, 3, 2, 2], SS = [5, 2, 2, 2, 2, 2, 2];
  const LENS = [16000]; KS.forEach((k, i) => LENS.push(Math.floor((LENS[i] - k) / SS[i]) + 1));
  // [beat, sentence, offset]: each length appears as the voice says it
  const revealT = [[1, 2, 0.2], [2, 0, 4.2], [3, 0, 0.3], [3, 1, 0.2], [3, 2, 0.2], [3, 3, 0.2], [3, 4, 0.6]];
  const revealAt = (S, r) => S.st(r[0], r[1]) + r[2];
  // each formula appears on the sentence that starts reading it; its result lands on revealT
  const formulaT = [[1, 1, 0], [2, 0, 0], [3, 0, 0], [3, 1, 0], [3, 2, 0], [3, 3, 0], [3, 4, 0]];
  S_.push({
    id: 'encoder', chapter: 5, title: 'The feature encoder: 7 convolutions',
    code: 'model.feature_extractor.conv_layers[0..6]',
    beats: [
      "Now the real feature encoder. It's seven convolution layers. Here are their kernel sizes and strides. The first layer has a kernel of ten and a stride of five. The next four have kernel three and stride two. The last two have kernel two and stride two.",
      "Let's push one second, sixteen thousand samples, through it, using our formula. Layer one: sixteen thousand minus ten, divided by five, rounded down, plus one. That gives three thousand one hundred and ninety-nine.",
      "Layer two: three thousand one hundred and ninety-nine minus three, divided by two, rounded down, plus one: fifteen hundred and ninety-nine.",
      "Then seven ninety-nine. Three ninety-nine. One ninety-nine. Ninety-nine. And finally, forty-nine.",
      "Meanwhile, the channel axis goes from one to five hundred and twelve in the first layer, and stays at five hundred and twelve after that. [+1] So the output is B, by five hundred and twelve, by forty-nine.",
      "Multiply the strides: five, times two to the sixth, is three hundred and twenty. So each output frame advances three hundred and twenty samples, which at sixteen kilohertz is twenty milliseconds. That's fifty frames per second, minus a little at the edges, which is why one second gives forty-nine frames, not fifty.",
      "And how much audio does one frame see? Trace back through the layers, and each output frame depends on four hundred input samples. That's twenty-five milliseconds. So frames are twenty-five milliseconds wide, and twenty milliseconds apart. They overlap slightly, just like classic speech features.",
      "After each convolution comes an activation function called GELU. It passes positive values through, and squashes negative values towards zero, with a smooth curve instead of a hard corner. Without non-linear steps like this, stacking layers would be pointless: seven linear operations in a row collapse into a single one.",
      "There's also normalization, and here X L S R differs from the original wav2vec 2.0 base model. The base model normalizes only its first layer, with a group norm that rescales each channel across time. X L S R puts a layer norm after every one of its seven convolutions, rescaling each frame's five hundred and twelve channels to zero mean and unit variance, right before the GELU.",
      "In total, the feature encoder has about four point two one million weights. Its job is purely local. It turns every twenty-five milliseconds of raw waveform into a vector of five hundred and twelve numbers. It has no idea yet what came before or after.",
    ],
    hud: S => {
      let n = 0;
      revealT.forEach(r => { if (S.T(r[0]) >= revealAt(S, r)) n++; });
      return { stage: 1, shape: n === 0 ? '({B:B}, {C:1}, {T:16000})' : `({B:B}, {C:512}, {T:${LENS[n]}})` };
    },
    draw(ctx, S) {
      const A = S.vis(0, 5);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const cols = [['layer', 130, 'left'], ['kernel', 330, 'center'], ['stride', 460, 'center'], ['length', 650, 'right'], ['channels', 820, 'center']];
        cols.forEach(c => txt(ctx, c[0], c[1], 180, { size: 24, weight: 700, color: COL.dim, align: c[2] }));
        line(ctx, 110, 196, 900, 196, COL.line, 2);
        for (let i = 0; i <= 7; i++) {
          const y = 244 + i * 62;
          const rowA = i === 0 ? 1 : i === 1 ? S.ps(0, 3, 0.5) : i <= 5 ? S.ps(0, 4, 0.5, (i - 2) * 0.25) : S.ps(0, 5, 0.5, (i - 6) * 0.25);
          const hlR = S.b === 0 && ((i === 1 && S.past(0, 3) && !S.past(0, 4)) || (i >= 2 && i <= 5 && S.past(0, 4) && !S.past(0, 5)) || (i >= 6 && S.past(0, 5)));
          if (hlR) { ctx.globalAlpha = A; rrect(ctx, 112, y - 36, 600, 50, 8, rgba(COL.A, 0.1), rgba(COL.A, 0.7), 2); }
          ctx.globalAlpha = A * rowA;
          txt(ctx, i === 0 ? 'input' : 'conv ' + i, 130, y, { size: 28, weight: 600, color: i === 0 ? COL.dim : COL.text });
          if (i > 0) {
            txt(ctx, String(KS[i - 1]), 330, y, { size: 28, mono: true, weight: 700, align: 'center', color: COL.K });
            txt(ctx, String(SS[i - 1]), 460, y, { size: 28, mono: true, weight: 700, align: 'center', color: COL.A });
          }
          const la = i === 0 ? 1 : S.p(revealT[i - 1][0], 0.5, revealAt(S, revealT[i - 1]));
          if (la > 0) {
            txt(ctx, fmtInt(LENS[i]), 650, y, { size: 30, mono: true, weight: 700, align: 'right', color: COL.T, alpha: la });
            const w = 760 * Math.log10(LENS[i]) / Math.log10(16000);
            rrect(ctx, 1010, y - 28, w * easeIO(la), 36, 6, rgba(COL.T, 0.35), COL.T, 2);
          }
          const ca = i === 0 ? 1 : S.p(4, 0.5, 0.6 + i * 0.25);
          if (ca > 0) txt(ctx, i === 0 ? '1' : '512', 820, y, { size: 28, mono: true, weight: 700, align: 'center', color: COL.C, alpha: ca });
        }
        ctx.globalAlpha = A;
        txt(ctx, 'sequence length (log scale)', 1010, 180, { size: 22, color: COL.dim, alpha: S.p(1) });
        // formula for the row being read out: it appears with the words, the result when it is spoken
        let n = 0;
        formulaT.forEach(r => { if (S.T(r[0]) >= revealAt(S, r)) n++; });
        if (n > 0 && S.b < 4) {
          const i = n, done = S.T(revealT[i - 1][0]) >= revealAt(S, revealT[i - 1]);
          const fa = S.p(formulaT[i - 1][0], 0.4, revealAt(S, formulaT[i - 1]));
          ctx.save(); ctx.globalAlpha *= fa; rrect(ctx, 150, 752, 800, 100, 14, COL.panel, rgba(COL.T, 0.5), 2); ctx.restore();
          txt(ctx, 'conv ' + i, 170, 742, { size: 22, weight: 700, color: COL.dim, alpha: fa });
          mtxt(ctx, `⌊ ({T:${fmtInt(LENS[i - 1])}} − {K:${KS[i - 1]}}) / {A:${SS[i - 1]}} ⌋ + 1  =  ` + (done ? `{T:${fmtInt(LENS[i])}}` : '?'), 180, 815, { size: 34, mono: true, weight: 600, alpha: fa });
        }
        const fa = S.p(4, 0.7, 3);
        if (fa > 0) {
          rrect(ctx, 180, 760, 700, 90, 14, COL.panel, rgba(COL.A, 0.6 * fa), 2);
          mtxt(ctx, 'output: ({B:B}, {C:512}, {T:49})', 530, 818, { size: 40, mono: true, align: 'center', alpha: fa });
        }
        ctx.restore();
      }
      // framing on waveform
      const Bv = S.vis(5, 7);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        mtxt(ctx, 'total stride  =  {A:5 × 2 × 2 × 2 × 2 × 2 × 2}  =  {A:320} samples  =  {A:20 ms}', W / 2, 190, { size: 38, align: 'center', weight: 600 });
        const x0 = 140, w = 1640, n = 3200, i0 = 1000, yc = 400;
        const px = s => x0 + (s / n) * w;
        rrect(ctx, x0 - 20, 270, w + 40, 260, 12, COL.panel, COL.line, 2);
        drawWave(ctx, x0, yc, w, 220, { from: i0, to: i0 + n, lw: 1.5 });
        for (let f = 0; f * 320 <= n; f++) {
          const a = S.p(5, 0.3, 3 + f * 0.3);
          line(ctx, px(f * 320), 280, px(f * 320), 520, rgba(COL.A, 0.8 * a), 2);
          txt(ctx, 'frame ' + f, px(f * 320) + 8, 300, { size: 18, weight: 600, color: COL.A, alpha: a });
        }
        mtxt(ctx, '→  50 frames per second;  1 s  →  {T:49} frames (edges lose one)', W / 2, 590, { size: 30, align: 'center', alpha: S.p(5, 0.6, 9), color: COL.dim });
        // receptive field windows
        const a6 = S.p(6);
        if (a6 > 0) {
          for (let f = 0; f < 9; f++) {
            const a = S.p(6, 0.4, 2 + f * 0.35);
            const x = px(f * 320), ww = px(400) - px(0), y = 640 + (f % 2) * 44;
            rrect(ctx, x, y, ww, 36, 8, rgba(f % 2 ? COL.C : COL.K, 0.18 * a), rgba(f % 2 ? COL.C : COL.K, a), 2);
            if (f < 2) txt(ctx, '400 samples = 25 ms', x + ww / 2, y + 25, { size: 18, weight: 700, align: 'center', alpha: a });
          }
          mtxt(ctx, 'receptive field  r = {K:10} + 2·5 + 2·10 + 2·20 + 2·40 + 1·80 + 1·160 = {K:400}', W / 2, 800, { size: 30, mono: true, align: 'center', alpha: S.p(6, 0.6, 6) });
          txt(ctx, 'each step adds (kernel − 1) × (product of earlier strides)', W / 2, 850, { size: 24, align: 'center', color: COL.dim, alpha: S.p(6, 0.6, 7) });
        }
        ctx.restore();
      }
      // GELU
      const G = S.vis(7, 8);
      if (G > 0) {
        ctx.save(); ctx.globalAlpha = G;
        const ox = 560, oy = 600, sx = 110, sy = 110;
        rrect(ctx, 150, 170, 820, 700, 16, COL.panel, COL.line, 2);
        line(ctx, 190, oy, 930, oy, COL.faint, 2); line(ctx, ox, 200, ox, 840, COL.faint, 2);
        for (let k = -3; k <= 3; k++) if (k) txt(ctx, String(k), ox + k * sx, oy + 30, { size: 18, align: 'center', color: COL.faint, mono: true });
        const phi = x => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));
        const plot = (f, col, dash, lw) => {
          ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
          ctx.beginPath();
          const rv = S.l(7, 2);
          for (let i = 0; i <= 300 * rv; i++) { const x = -3.5 + 7 * i / 300, y = f(x); const X = ox + x * sx, Y = oy - y * sy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
          ctx.stroke(); ctx.restore();
        };
        plot(x => Math.max(0, x), COL.dim, [8, 8], 3);
        plot(x => x * phi(x), COL.A, null, 5);
        txt(ctx, 'ReLU', 880, 300, { size: 24, weight: 700, color: COL.dim });
        txt(ctx, 'GELU', 800, 360, { size: 28, weight: 800, color: COL.A });
        mtxt(ctx, 'GELU(x) = x · Φ(x)', 1060, 280, { size: 44, mono: true, weight: 600 });
        wrap(ctx, 'Φ(x) = chance that a standard normal value is below x.', 1060, 350, 720, 40, { size: 28, color: COL.dim });
        wrap(ctx, 'Big positive x → Φ ≈ 1, x passes through. Big negative x → Φ ≈ 0, output ≈ 0. Smooth in between.', 1060, 470, 720, 40, { size: 28, alpha: S.p(7, 0.6, 3) });
        const b = S.p(7, 0.6, 11);
        rrect(ctx, 1040, 650, 760, 180, 14, 'rgba(0,0,0,0)', rgba(COL.R, 0.6 * b), 2);
        wrap(ctx, 'Without a non-linearity:  linear ∘ linear ∘ … ∘ linear  =  one linear map. Depth would buy nothing.', 1070, 710, 700, 44, { size: 28, alpha: b });
        ctx.restore();
      }
      // normalization
      const N = S.vis(8, 9);
      if (N > 0) {
        ctx.save(); ctx.globalAlpha = N;
        const rows = 10, cols = 22, cw = 30, ch = 34;
        const draw1 = (x0, y0, mode, a) => {
          cells(ctx, x0, y0, rows, cols, cw, ch, (r, c) => vcol(noise(r, c, 41) * 0.9, 0.8), 3);
          dimLeft(ctx, x0 - 6, y0, rows * ch, '{C:512}', COL.C, 24);
          dimTop(ctx, x0, y0 - 6, cols * cw, 'time {T:T}', COL.T, 22);
          const hlp = (S.l(8, 6, mode === 'row' ? 0.5 : 9) * (mode === 'row' ? rows : cols)) | 0;
          ctx.globalAlpha = N * a;
          if (mode === 'row') rrect(ctx, x0 - 3, y0 + Math.min(rows - 1, hlp) * ch - 3, cols * cw + 6, ch + 6, 6, null, COL.A, 4);
          else rrect(ctx, x0 + Math.min(cols - 1, hlp) * cw - 3, y0 - 3, cw + 6, rows * ch + 6, 6, null, COL.K, 4);
          ctx.globalAlpha = N;
        };
        const a0 = 0.4 * S.ps(8, 0, 0.6, 0.3), a1 = Math.max(a0, S.ps(8, 1, 0.6)), a2 = Math.max(a0, S.ps(8, 2, 0.6));
        txt(ctx, 'normalization: wav2vec 2.0 base vs XLS-R', W / 2, 150, { size: 26, weight: 700, align: 'center', alpha: N * S.ps(8, 0, 0.6, 0.3) });
        ctx.globalAlpha = N * a1;
        txt(ctx, 'GroupNorm, 512 groups', 150 + 330, 190, { size: 32, weight: 800, align: 'center', color: COL.A });
        txt(ctx, 'wav2vec 2.0 base: first conv only', 150 + 330, 230, { size: 24, align: 'center', color: COL.dim });
        draw1(170, 320, 'row', a1);
        ctx.globalAlpha = N * a1;
        wrap(ctx, 'each channel (row) → mean 0, var 1 across time', 170, 720, 660, 36, { size: 26 });
        ctx.globalAlpha = N * a2;
        txt(ctx, 'LayerNorm', 1050 + 330, 190, { size: 32, weight: 800, align: 'center', color: COL.K });
        txt(ctx, 'XLS-R: after every conv layer', 1050 + 330, 230, { size: 24, align: 'center', color: COL.dim });
        draw1(1070, 320, 'col', a2);
        ctx.globalAlpha = N * a2;   // the caption arrives with its grid, not before it
        wrap(ctx, 'each frame (column) → mean 0, var 1 across channels', 1070, 720, 660, 36, { size: 26 });
        ctx.globalAlpha = N;
        mtxt(ctx, 'then: learned scale γ and shift β per channel', W / 2, 860, { size: 28, align: 'center', color: COL.dim, alpha: S.p(8, 0.6, 14) });
        ctx.restore();
      }
      // summary
      const Z = S.p(9);
      if (Z > 0) {
        ctx.save(); ctx.globalAlpha = Z;
        rrect(ctx, 150, 330, 480, 240, 14, COL.panel, COL.line, 2);
        drawWave(ctx, 170, 450, 440, 180, { from: 3000, to: 3400 });
        txt(ctx, '400 samples (25 ms)', 390, 610, { size: 26, weight: 700, align: 'center', color: COL.T });
        arrow(ctx, 650, 450, 760, 450, {});
        box(ctx, 770, 360, 380, 180, ['7 × (conv → norm → GELU)', '≈ 4.2 M weights'], { size: 30, color: COL.K });
        arrow(ctx, 1170, 450, 1280, 450, {});
        cells(ctx, 1300, 290, 16, 1, 60, 20, (r) => vcol(noise(r, 1, 91), 0.9), 3);
        dimLeft(ctx, 1294, 290, 320, '', COL.C);
        txt(ctx, 'one frame:', 1400, 400, { size: 26, color: COL.dim });
        mtxt(ctx, '{C:512} numbers', 1400, 450, { size: 36, weight: 700 });
        txt(ctx, 'Local only — no context yet.', W / 2, 760, { size: 40, weight: 700, align: 'center', alpha: S.p(9, 0.6, 7) });
        ctx.restore();
      }
    },
  });
})();
