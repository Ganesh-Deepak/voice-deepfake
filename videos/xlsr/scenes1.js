// XLS-R 300M, scenes 0–6: cold open, big picture, tensors, audio, convolution, feature encoder, projection.
// Shapes traced with verify/xlsr_shapes.py (Hugging Face Wav2Vec2Model built from the XLS-R 300M config).
(function () {
  const { W, COL, THEME, clamp, lerp, easeIO, easeOut, easeOut4, noise, fmt, rgba, vcol, scol, txt, mtxt, wrap, rrect, line, arrow, parrow,
    chip, box, numRow, numMat, brace, drawWave, glow, penTip } = E;
  const S_ = window.SCENES;

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
      "Welcome. This is X L S R, the speech model with three hundred million parameters that sits at the front of today's strongest voice deepfake detectors. In this video we'll follow the numbers through it, one tensor at a time, from four seconds of raw audio to the features a detector reads.",
      "X L S R was pre-trained by Meta on about four hundred and thirty-six thousand hours of unlabeled speech, in one hundred and twenty-eight languages. Its three hundred million parameter version stacks twenty-four transformer layers, each one thousand and twenty-four numbers wide, with sixteen attention heads.",
      "We'll build every piece from scratch: convolution, normalization, matrix multiplication and attention. And because tensor shapes are where most of the confusion lives, the capsule at the bottom of the screen always shows the shape we're holding right now.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: '({B:B}, {T:64600})' } : null,
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
          tags: { w: ['T', 201], h: ['C', grow > 0.5 ? 1024 : 512], d: ['B', 'B'] } });
        // 24 layer plates around it
        for (let i = 0; i < 24; i++) {
          const k = easeOut4((T - 9.6 - i * 0.05) / 0.5);
          if (k <= 0) continue;
          S3.gate(ctx, cam, -560 + i * 48.7, 0, 0, 470, 260, { color: THEME.b, alpha: 0.55 * k * gone, fill: 0.035, edge: 0.55, lw: 1.4 });
        }
        if (T > 10) S3.caption(ctx, cam, 0, 300, 0, '24 transformer layers', { size: 26, mono: false, weight: 700, color: THEME.b, alpha: S.p(0, 0.6, 10.6) * gone });
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
      if (b2 > 0) S3.block(ctx, cam, { x: 0, y: -10, z: 0, w: 430, h: 34, d: 70, cells: [1, 28, 3], seed: 5, alpha: b2, color: THEME.a, reveal: S.l(2, 1.0, 0.6), tags: { w: ['T', 64600], d: ['B', 'B'] } });
      // title block
      E.kicker(ctx, 'DEEPFAKE DETECTORS · SHAPE BY SHAPE', 154, 196, T + 1.0);
      chip(ctx, 760, 188, 'EPISODE 1 / 3', { size: 20, mono: true, color: THEME.a, stroke: rgba(THEME.a, 0.6), fill: rgba(THEME.a, 0.08), alpha: S.p(0, 0.5, 0.3) });
      E.titleRise(ctx, 'XLS-R 300M', 150, 360, T + 0.7, { size: 150, c2: THEME.a });
      txt(ctx, 'the 24-layer front end of modern deepfake detectors', 156, 428, { size: 34, weight: 500, color: COL.dim, alpha: S.p(0, 0.9, 0.6) });
      // stats grid
      const stats = [[315.4, 1, ' M', 'parameters'], [24, 0, '', 'transformer layers'], [1024, 0, '', 'numbers per frame'], [16, 0, '', 'attention heads'], [128, 0, '', 'languages'], [436, 0, ' K', 'hours of speech']];
      const so = 1 - S.p(2, 0.5, 3.2);
      stats.forEach(([v, d, suf, lab], i) => {
        const t0 = (i < 4 ? 1.0 + i * 0.9 : 3.6 + (i - 4) * 0.9), x = 154 + (i % 3) * 300, y = 600 + Math.floor(i / 3) * 140;
        const tt = S.T(1) - t0;
        E.countUp(ctx, v, d, x, y, tt, { size: 58, suf, color: i === 0 ? THEME.a : COL.text, alpha: so });
        txt(ctx, lab, x + 2, y + 36, { size: 22, weight: 600, color: COL.dim, alpha: clamp((tt - 0.2) / 0.4) * so });
      });
      // beat 2: what we'll build, and where to look
      const topics = [['1-D convolution', COL.K], ['layer norm', COL.A], ['matrix multiplication', COL.C], ['self-attention', COL.H]];
      let x = 154;
      topics.forEach((tp, i) => {
        const a = S.p(2, 0.6, 0.6 + i * 0.6);
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

  // ------------------------------------------------------------------ 1 the big picture (a fly-through)
  const PIPE = {
    rib: [-1760, -1180], gates: i => -1080 + i * 44, A: -560, proj: -330, Bk: -90, pos: 160, plates: i => 330 + i * 24, out: 1180,
  };
  S_.push({
    id: 'x_overview', chapter: 1, title: 'The big picture',
    beats: [
      "Here's the whole journey in one picture. On the far left, four seconds of audio: sixty-four thousand six hundred numbers.",
      "A feature encoder of seven convolutions squeezes them into two hundred and one frames, one every twenty milliseconds, each described by five hundred and twelve numbers. PyTorch keeps these channels first: B, by five hundred and twelve, by two hundred and one.",
      "A transpose and a projection widen every frame to one thousand and twenty-four numbers, the width of the model. Then a convolution over time mixes in a sense of position.",
      "Twenty-four transformer layers let every frame look at every other frame. The shape never changes on the way through: B, by two hundred and one, by one thousand and twenty-four.",
      "Out comes a sequence of context vectors, one per twenty milliseconds, plus all twenty-five intermediate hidden states if you ask for them. That's what a detector's back-end reads.",
      "During pre-training there's one more branch: a quantizer that turns the encoder's frames into discrete targets, and a contrastive loss that teaches the transformer to predict them. We'll get to it near the end.",
    ],
    hud: S => [{ stage: 0, shape: '({B:B}, {T:64600})' }, { stage: 1, shape: '({B:B}, {C:512}, {T:201})' }, { stage: 2, shape: '({B:B}, {T:201}, {C:1024})' },
      { stage: 5, shape: '({B:B}, {T:201}, {C:1024})' }, { stage: 6, shape: '({B:B}, {T:201}, {C:1024})' }, { stage: 6, label: 'pre-training branch', shape: '({B:B}, {T:201}, {C:1024})' }][S.b],
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1.5, { yaw: 0.3, pitch: 0.34, dist: 4400, tx: -250, ty: -40, tz: 0, cx: 960, cy: 520 }],
        [0, 2.4, { yaw: 0.32, pitch: 0.16, dist: 1750, tx: -1450 }],
        [1, 0, { tx: -800, dist: 1900, yaw: 0.26 }], [2, 0, { tx: -200, dist: 1800, yaw: 0.16 }],
        [3, 0, { tx: 620, dist: 2000, yaw: -0.12, pitch: 0.2 }], [4, 0, { tx: 1120, dist: 1700, yaw: -0.32 }],
        [5, 0, { tx: -260, ty: -200, dist: 4300, yaw: 0.18, pitch: 0.4 }],
      ], { floorY: -280 });
      // everything is ghosted in the establishing shot, then lights up as the camera arrives
      const ghost = 0.16 * S.p(0, 1.0, 0.2) * (1 - S.p(5, 0.6, 0) * 0);
      const on = i => Math.max(ghost, S.p(i, 0.8, 0)), ever = i => (S.b > i ? 1 : on(i));
      // the travelling pulse marks where we are
      const stations = [[X.at(S, 0, 0), -1460], [X.at(S, 1, 0), -820], [X.at(S, 2, 0), -200], [X.at(S, 3, 0), 600], [X.at(S, 4, 0), PIPE.out]];
      const px = E.track(S.local, stations, 40, 13);
      // waveform
      S3.ribbon(ctx, cam, PIPE.rib[0], PIPE.rib[1], 0, 0, 120, { reveal: S.l(0, 1.6, 1.4), color: COL.T, lw: 2 });
      const wide = 1 - S.p(5, 0.5, 0);
      S3.caption(ctx, cam, (PIPE.rib[0] + PIPE.rib[1]) / 2, 190, 0, '({B:B}, {T:64600})', { size: 30, alpha: S.p(0, 0.6, 2.4) * wide });
      // seven conv gates
      for (let i = 0; i < 7; i++) S3.gate(ctx, cam, PIPE.gates(i), 0, 0, 300 - i * 14, 150, { color: COL.K, alpha: Math.max(ghost, clamp(S.T(1) * 2 - i * 0.25 + (S.b > 1 ? 9 : 0))), label: i === 3 && S.b >= 1 ? '7 convolutions' : null });
      // (B, 512, 201)
      const A = Math.max(ghost, S.p(1, 0.8, 4.5));
      S3.block(ctx, cam, { x: PIPE.A, y: 0, z: 0, w: 200, h: 250, d: 80, cells: [10, 9, 3], seed: 21, alpha: A, reveal: S.l(1, 1.2, 4.5), color: COL.C, tags: { w: ['T', 201], h: ['C', 512], d: ['B', 'B'] }, tagAlpha: (S.b <= 2 ? 1 : 0.4) * wide });
      // projection
      S3.gate(ctx, cam, PIPE.proj, 0, 0, 330, 160, { color: COL.C, alpha: Math.min(1, on(2) + (S.b > 2 ? 1 : 0)), label: S.b >= 2 ? 'projection' : null, sub: S.b >= 2 ? '512 → 1024' : null });
      const Bk = Math.max(ghost, S.p(2, 0.8, 2.2));
      S3.block(ctx, cam, { x: PIPE.Bk, y: 0, z: 0, w: 200, h: 310, d: 80, cells: [12, 9, 3], seed: 22, alpha: Bk, reveal: S.l(2, 1.2, 2.2), color: THEME.a, tags: { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] }, tagAlpha: (S.b === 2 ? 1 : 0.4) * wide });
      S3.gate(ctx, cam, PIPE.pos, 0, 0, 360, 170, { color: COL.A, alpha: Math.min(1, Math.max(ghost, S.p(2, 0.7, 5.5)) + (S.b > 2 ? 1 : 0)), label: S.b >= 2 ? 'pos-conv' : null, sub: S.b >= 2 ? '128-frame window' : null });
      // 24 transformer layers
      for (let i = 0; i < 24; i++) {
        const k = easeOut4((S.T(3) - 0.2 - i * 0.06) / 0.5) + (S.b > 3 ? 1 : 0);
        S3.gate(ctx, cam, PIPE.plates(i), 0, 0, 380, 200, { color: COL.H, alpha: Math.max(ghost, clamp(k) * 0.85), fill: 0.04, lw: 1.6 });
      }
      S3.caption(ctx, cam, PIPE.plates(11.5), 260, 0, '24 transformer layers', { size: 26, mono: false, weight: 700, color: COL.H, alpha: S.p(3, 0.6, 1.5) * wide });
      S3.caption(ctx, cam, PIPE.plates(11.5), -300, 0, 'every layer keeps ({B:B}, {T:201}, {C:1024})', { size: 24, alpha: S.p(3, 0.6, 5) * (1 - S.p(4, 0.5, 0)) });
      // output + 25 hidden states fanned behind it
      const O = Math.max(ghost, S.p(4, 0.8, 0.4));
      for (let i = 24; i >= 1; i--) S3.block(ctx, cam, { x: PIPE.out + i * 9, y: i * 4, z: -i * 26, w: 200, h: 310, d: 10, cells: [6, 6, 1], seed: 40 + i, alpha: S.p(4, 0.6, 4 + i * 0.05) * 0.35, color: COL.H, fn: (r, c) => vcol(noise(r, c, 40 + i) * 0.6, 0.55) });
      S3.block(ctx, cam, { x: PIPE.out, y: 0, z: 0, w: 200, h: 310, d: 80, cells: [12, 9, 3], seed: 23, alpha: O, reveal: S.l(4, 1.2, 0.4), color: COL.B, glow: COL.B, tags: { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] }, tagAlpha: wide });
      S3.caption(ctx, cam, PIPE.out, 270, 0, 'context vectors', { size: 26, mono: false, weight: 700, color: COL.B, alpha: S.p(4, 0.6, 1.5) * wide });
      S3.caption(ctx, cam, PIPE.out + 120, -300, -300, '+ 25 hidden states', { size: 24, mono: false, weight: 700, color: COL.H, alpha: S.p(4, 0.6, 4.4) * wide });
      // pre-training branch
      const P = S.p(5, 0.8, 0.5);
      if (P > 0) {
        S3.path3(ctx, cam, [[PIPE.A, -150, 0], [PIPE.A, -470, 0], [-150, -470, 0]], { color: COL.M, p: S.l(5, 1.2, 0.8), alpha: P });
        S3.plate(ctx, cam, 20, -470, 0, 320, 120, { color: COL.M, alpha: P, label: 'quantizer → targets q', fill: 0.12 });
        S3.path3(ctx, cam, [[PIPE.plates(23), -210, 0], [PIPE.plates(23), -470, 0], [400, -470, 0]], { color: COL.M, p: S.l(5, 1.2, 2.2), alpha: P });
        S3.plate(ctx, cam, 560, -470, 0, 320, 120, { color: COL.M, alpha: P * S.p(5, 0.6, 2.2), label: 'contrastive loss', fill: 0.12 });
        S3.caption(ctx, cam, 300, -640, 0, 'pre-training only', { size: 24, mono: false, weight: 700, color: COL.M, alpha: P });
      }
      // pulse
      if (S.b < 5) { const p = cam.p(px, 0, 60); glow(ctx, p[0], p[1], 70 * p[3], THEME.a, 0.6); }
    },
  });

  // ------------------------------------------------------------------ 2 tensors and shapes
  function cube(ctx, cam, x, y, z, s, val, a, col) {
    S3.block(ctx, cam, { x, y, z, w: s, h: s, d: s, cells: [1, 1, 1], alpha: a, color: col || THEME.a, fn: () => vcol(val * 0.8, 0.85) });
    if (a > 0.3 && val != null) { const p = cam.p(x, y, z + s / 2); txt(ctx, fmt(val, 2), p[0], p[1] + 1, { size: 20 * p[3] + 4, weight: 700, mono: true, align: 'center', base: 'middle', alpha: a }); }
  }
  S_.push({
    id: 'x_tensors', chapter: 2, title: 'Tensors and shapes',
    beats: [
      "First, vocabulary. A single number is called a scalar. A list of numbers is a vector, and its shape is just its length: this one has shape five.",
      "A grid of numbers is a matrix, with shape rows by columns: three by five. Stack several grids and you get a three-dimensional tensor. A tensor is simply an array with any number of axes, and its shape lists how long each axis is.",
      "Every axis in this video gets a name and a color. Green B is the batch: how many clips we process at once. Blue T is time. Orange C is channels, or features: the numbers that describe one moment. Later, purple H will count attention heads.",
      "Real sizes here range from sixteen to sixty-four thousand, so tensors are drawn on a log scale. Read the labels, not the lengths. And one rule to remember: most operations change one axis and leave the others alone.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: '({B:B}, {T:T}, {C:C})' } : { stage: 0, label: 'example', shape: S.b === 0 ? (S.T(0) > 2.4 ? '({K:5})' : 'scalar') : (S.T(1) > 3.6 ? '({K:4}, {K:3}, {K:5})' : '({K:3}, {K:5})') },
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1.2, { yaw: 0.42, pitch: 0.2, dist: 1500, tx: -780, ty: 0, tz: 0, cx: 960, cy: 540 }], [0, 3, { tx: -640, dist: 1400 }],
        [1, 0, { yaw: 0.3, dist: 1500, tx: -120 }], [1, 4, { tx: 380, dist: 1700 }], [2, 0, { yaw: -0.45, pitch: 0.3, dist: 1250, tx: 620, ty: 0 }],
        [3, 0, { yaw: 0.2, pitch: 0.2, dist: 2400, tx: 0, ty: 120 }],
      ], { floorY: -230 });
      const vals = [0.42, -0.17, 0.88, 0.05, -0.61, 0.3, -0.9, 0.12, 0.66, -0.35, 0.21, -0.48, 0.74, -0.08, 0.55];
      const s = 62, gap = 8;
      const fade3 = 1 - 0.75 * S.p(3, 0.6, 0);
      // scalar
      cube(ctx, cam, -1000, 0, 0, s, 0.42, S.p(0, 0.6, 0.4) * fade3);
      S3.caption(ctx, cam, -1000, -110, 0, 'scalar · shape ( )', { size: 24, color: COL.dim, alpha: S.p(0, 0.6, 1.2) * fade3 });
      // vector
      for (let i = 0; i < 5; i++) cube(ctx, cam, -760 + i * (s + gap), 0, 0, s, vals[i], easeOut4((S.T(0) - 2.4 - i * 0.12) / 0.4) * fade3);
      S3.caption(ctx, cam, -760 + 2 * (s + gap), -110, 0, 'vector · shape ({K:5})', { size: 24, color: COL.dim, alpha: S.p(0, 0.6, 3.6) * fade3 });
      // matrix 3 x 5
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) cube(ctx, cam, -240 + c * (s + gap), 70 - r * (s + gap), 0, s, vals[(r * 5 + c) % 15], easeOut4((S.T(1) - 0.3 - (r * 5 + c) * 0.05) / 0.4) * fade3);
      S3.caption(ctx, cam, -240 + 2 * (s + gap), -180, 0, 'matrix · shape ({K:3}, {K:5})', { size: 24, color: COL.dim, alpha: S.p(1, 0.6, 2) * fade3 });
      // 3-D tensor: stacked matrices
      const t3 = S.p(1, 0.8, 3.6);
      for (let k = 3; k >= 0; k--) S3.block(ctx, cam, { x: 600, y: 0, z: -k * 46, w: 340, h: 210, d: 30, cells: [3, 5, 1], seed: 60 + k, alpha: t3 * easeOut4((S.T(1) - 3.6 - (3 - k) * 0.25) / 0.5) * fade3, color: THEME.a });
      S3.caption(ctx, cam, 600, 210, -70, '3-D tensor · shape ({K:4}, {K:3}, {K:5})', { size: 24, color: COL.dim, alpha: S.p(1, 0.6, 5) * fade3 });
      // axes on the 3-D tensor
      const ax = [['B', 'batch: clips at once', [600 - 170, -105, 20], [600 - 170, -105, -190], COL.B, 0.8],
        ['T', 'time: samples, then frames', [600 - 170, -105, 20], [600 + 210, -105, 20], COL.T, 2.6],
        ['C', 'channels / features', [600 - 170, -105, 20], [600 - 170, 160, 20], COL.C, 4.8]];
      ax.forEach(([l, d, p0, p1, col, t0]) => {
        const k = S.p(2, 0.6, t0) * (1 - S.p(3, 0.5, 0));
        if (k <= 0) return;
        const e = S3.path3(ctx, cam, [p0, p1], { color: col, lw: 4, p: k, alpha: k });
        txt(ctx, l, e[0] + 14, e[1] - 6, { size: 34, weight: 800, color: col, alpha: k });
        txt(ctx, d, e[0] + 46, e[1] - 6, { size: 22, weight: 600, color: COL.text, alpha: k });
      });
      const hk = S.p(2, 0.6, 8);
      chip(ctx, 1500, 860, 'H  heads (later)', { size: 26, color: COL.H, stroke: rgba(COL.H, 0.6), fill: rgba(COL.H, 0.1), alpha: hk * (1 - S.p(3, 0.5, 0)) });
      // log-scale ruler
      const lr = S.p(3, 0.7, 0.6);
      if (lr > 0) {
        X.card(ctx, 360, 250, 1200, 520, lr);
        txt(ctx, 'drawn on a log scale', 400, 305, { size: 28, weight: 700, alpha: lr });
        txt(ctx, 'length on screen ∝ log₂(n + 1)', 1520, 305, { size: 22, mono: true, color: COL.dim, align: 'right', alpha: lr });
        [[16, 'attention head size', COL.H], [201, 'frames in 4 s', COL.T], [512, 'conv channels', COL.C], [1024, 'model width', COL.A], [4096, 'feed-forward width', COL.K], [64600, 'samples in 4 s', COL.T]].forEach(([n, lab, col], i) => {
          const k = easeOut4((S.T(3) - 1.2 - i * 0.35) / 0.5);
          if (k <= 0) return;
          const y = 360 + i * 64, w = X.ln(n) * 1.15 * k;
          rrect(ctx, 400, y, w, 34, 8, rgba(col, 0.75), null);
          txt(ctx, n.toLocaleString('en-US'), 400 + w + 14, y + 26, { size: 24, weight: 700, mono: true, color: col, alpha: k });
          txt(ctx, lab, 1520, y + 26, { size: 22, color: COL.dim, align: 'right', alpha: k });
        });
      }
    },
  });

  // ------------------------------------------------------------------ 3 sound as numbers
  S_.push({
    id: 'x_audio', chapter: 3, title: 'Sound as numbers', code: 'input_values: (B, 64600) float32',
    beats: [
      "To a computer, sound is a long list of air-pressure measurements. X L S R expects sixteen thousand of them per second, a sampling rate of sixteen kilohertz, and each measurement, called a sample, is a number usually between minus one and one.",
      "Zoom in and you can see the individual samples. Neighbours are one sixteen-thousandth of a second apart: sixty-two and a half microseconds.",
      "Detectors built on X L S R usually work on fixed crops of sixty-four thousand six hundred samples: about four point oh four seconds. Longer clips are cut, and shorter ones are repeated until they fill the crop. A batch of B clips has shape B by sixty-four thousand six hundred.",
      "The Hugging Face feature extractor for X L S R also normalizes each clip to zero mean and unit variance, so loud and quiet recordings land on the same scale. The shape doesn't change. And notice there's no spectrogram: the model reads the raw waveform, where the subtle artifacts left by a vocoder can survive.",
    ],
    hud: S => ({ stage: 0, shape: S.b >= 2 ? '({B:B}, {T:64600})' : '({T:16000})  per second' }),
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1.5, { yaw: 0.55, pitch: 0.1, dist: 2000, tx: 0, ty: 60, tz: 0, cx: 960, cy: 470 }],
        [0, 4, { yaw: 0.2, pitch: 0.14, dist: 1700 }], [1, 0, { yaw: 0.05, dist: 900, tx: -300 }],
        [2, 0, { yaw: 0.25, pitch: 0.42, dist: 2400, tx: 0, ty: 100 }], [3, 0, { yaw: -0.1, pitch: 0.2, dist: 2600 }],
      ], { floorY: -200 });
      const r0 = 1 - S.p(2, 0.6, 0);
      S3.ribbon(ctx, cam, -900, 900, 60, 0, 220, { reveal: S.l(0, 3, 0.5), color: COL.T, lw: 2, n: 420, alpha: r0 });
      txt(ctx, '16,000 samples every second · 16 kHz', 960, 840, { size: 30, weight: 700, align: 'center', color: COL.T, alpha: S.p(0, 0.6, 4) * r0 });
      // zoomed samples (2-D inset)
      const z = S.p(1, 0.6, 0) * r0;
      if (z > 0) {
        X.card(ctx, 1040, 220, 780, 470, z);
        txt(ctx, 'zoomed in: one dot per sample', 1080, 272, { size: 24, weight: 700, alpha: z });
        const y0 = 470, n = 26, x0 = 1090, dx = 26;
        line(ctx, x0 - 10, y0, x0 + n * dx, y0, COL.faint, 1.5);
        for (let i = 0; i < n; i++) {
          const v = E.WAVE[3000 + i * 3], k = easeOut4((S.T(1) - 0.4 - i * 0.04) / 0.3);
          if (k <= 0) continue;
          line(ctx, x0 + i * dx, y0, x0 + i * dx, y0 - v * 150 * k, rgba(COL.T, 0.5), 2);
          ctx.fillStyle = COL.T; ctx.beginPath(); ctx.arc(x0 + i * dx, y0 - v * 150 * k, 6, 0, 7); ctx.fill();
        }
        const b = S.p(1, 0.6, 2.4);
        brace(ctx, x0 + 10 * dx, x0 + 11 * dx, y0 + 170, rgba(COL.K, b), true);
        txt(ctx, '1 / 16000 s = 62.5 µs', x0 + 10.5 * dx, y0 + 230, { size: 26, weight: 700, color: COL.K, align: 'center', alpha: b });
      }
      // crops: cut long clips, repeat short ones
      const c = S.p(2, 0.7, 0) * (1 - S.p(3, 0.6, 0));
      if (c > 0) {
        X.card(ctx, 160, 200, 1600, 600, c);
        txt(ctx, 'one crop = 64,600 samples ≈ 4.04 s', 200, 258, { size: 30, weight: 700, color: COL.T, alpha: c });
        const x0 = 200, w = 1180, rows = [['long clip: cut', 1.8, COL.T], ['short clip: repeated', 0.45, COL.C]];
        rows.forEach(([lab, frac, col], i) => {
          const y = 330 + i * 190, k = S.p(2, 0.6, 1.5 + i * 2.4);
          if (k <= 0) return;
          txt(ctx, lab, x0, y, { size: 24, weight: 700, color: col, alpha: k });
          if (frac > 1) {
            drawWave(ctx, x0, y + 70, w, 90, { color: col, alpha: k, reveal: 1 });
            ctx.save(); ctx.globalAlpha *= k * 0.7; ctx.fillStyle = 'rgba(8,10,18,0.75)'; ctx.fillRect(x0 + w * 0.82, y + 20, w * 0.18 + 6, 100); ctx.restore();
            line(ctx, x0 + w * 0.82, y + 16, x0 + w * 0.82, y + 124, COL.R, 3, [7, 6]);
            txt(ctx, 'cut here', x0 + w * 0.82 + 12, y + 140, { size: 20, color: COL.R, alpha: k });
          } else {
            for (let r = 0; r * frac < 1; r++) {
              const xs = x0 + r * w * frac, ww = Math.min(w * frac, x0 + w - xs);
              drawWave(ctx, xs, y + 70, ww, 90, { from: 4000, to: 4000 + Math.floor(12000 * ww / (w * frac)), color: col, alpha: k * (r ? 0.6 : 1) });
              if (r) line(ctx, xs, y + 20, xs, y + 120, rgba(col, 0.6), 2, [5, 5]);
            }
          }
        });
        line(ctx, x0 + w * 0.82, 260, x0 + w * 0.82, 760, rgba(COL.K, 0.6 * c), 2);
        txt(ctx, '64,600', x0 + w * 0.82, 790, { size: 24, mono: true, weight: 700, color: COL.K, align: 'center', alpha: c });
        mtxt(ctx, 'batch: ({B:B}, {T:64600})', 1420, 520, { size: 30, mono: true, alpha: S.p(2, 0.6, 6), align: 'center' });
      }
      // normalisation
      const n = S.p(3, 0.7, 0);
      if (n > 0) {
        X.card(ctx, 160, 200, 1600, 600, n);
        mtxt(ctx, 'x̂ = ( x − {K:mean} ) / {K:std}     →  mean 0, variance 1', 960, 270, { size: 34, mono: true, align: 'center', alpha: n });
        [['quiet recording', 0.25], ['loud recording', 1.0]].forEach(([lab, g], i) => {
          const y = 400 + i * 200, k = S.p(3, 0.6, 1 + i * 0.8), m = easeIO((S.T(3) - 4.5) / 1.2);
          txt(ctx, lab, 210, y - 60, { size: 22, weight: 700, color: COL.dim, alpha: k });
          drawWave(ctx, 210, y, 640, 150, { gain: g, color: COL.T, alpha: k });
          arrow(ctx, 880, y, 1000, y, { alpha: k * m, p: m, color: COL.K });
          drawWave(ctx, 1030, y, 640, 150, { gain: 0.65, color: COL.A, alpha: k * m });
        });
        txt(ctx, 'no spectrogram: the model reads raw samples', 960, 770, { size: 26, weight: 700, color: COL.C, align: 'center', alpha: S.p(3, 0.6, 9) });
      }
    },
  });

  // ------------------------------------------------------------------ 4 1-D convolution from scratch
  const SIG = [0.2, 0.9, 0.6, -0.3, -0.8, -0.4, 0.3, 0.7, 0.1, -0.5], KER = [1, 0, -1];
  S_.push({
    id: 'x_conv', chapter: 4, title: '1-D convolution from scratch', code: 'conv_layers[0].conv.weight: (512, 1, 10)',
    beats: [
      "The first learned operation is a one-dimensional convolution. Here's a short signal of ten samples, and a kernel of three learned weights.",
      "Place the kernel at the start, multiply each weight by the sample underneath it, and add up the products. That sum is one output number. Then slide the kernel along. How far it jumps is the stride: here, two samples.",
      "Keep sliding until it no longer fits: four outputs. The rule for the output length: input length minus kernel size, divided by the stride, rounded down, plus one. Ten minus three is seven, halved and rounded down is three, plus one is four. This one formula explains every length in the encoder.",
      "One kernel detects one kind of pattern. Run five hundred and twelve kernels in parallel and one input row becomes five hundred and twelve output rows, called channels. X L S R's first convolution has a kernel of ten samples and a stride of five, plus a bias: one learned offset per output channel.",
      "From the second layer on, the input already has five hundred and twelve channels, so each kernel becomes a small block of five hundred and twelve by three weights, summing over every channel at once. PyTorch stores the whole layer as out-channels, by in-channels, by kernel size: five hundred and twelve, by five hundred and twelve, by three.",
    ],
    hud: S => ({ stage: 1, shape: S.b >= 3 ? '({B:B}, {C:512}, {T:12919})' : '({T:10})  →  ({T:4})', label: S.b >= 3 ? 'after conv 1' : 'toy example' }),
    draw(ctx, S) {
      const cw = 96, x0 = 960 - 5 * cw, y0 = 300, toy = 1 - S.p(3, 0.6, 0);
      if (toy > 0) {
        ctx.save(); ctx.globalAlpha *= toy;
        txt(ctx, 'signal', x0 - 30, y0 + 40, { size: 26, weight: 700, color: COL.T, align: 'right' });
        numRow(ctx, x0, y0, SIG, cw, 64, { size: 26, d: 1, alpha: S.p(0, 0.6, 0.3) });
        // the kernel slides with a spring between stride positions
        const steps = [[X.at(S, 1, 0), 0], [X.at(S, 1, 5.4), 2], [X.at(S, 2, 0.2), 4], [X.at(S, 2, 1.4), 6]];
        const kpos = E.track(S.local, steps, 120, 20), ka = S.p(0, 0.6, 3);
        const kx = x0 + kpos * cw;
        rrect(ctx, kx - 4, y0 - 12, cw * 3 + 8, 88, 12, rgba(COL.K, 0.08 * ka), rgba(COL.K, ka), 3);
        numRow(ctx, kx, y0 - 100, KER, cw, 56, { size: 26, d: 0, fill: () => rgba(COL.K, 0.22), stroke: COL.K, alpha: ka });
        txt(ctx, 'kernel', kx - 20, y0 - 62, { size: 24, weight: 700, color: COL.K, align: 'right', alpha: ka });
        // outputs
        const outs = [0, 2, 4, 6].map(st => KER.reduce((a, w, j) => a + w * SIG[st + j], 0));
        const oy = y0 + 190;
        txt(ctx, 'output', x0 - 30, oy + 40, { size: 26, weight: 700, color: COL.C, align: 'right', alpha: S.p(1, 0.6, 2) });
        outs.forEach((v, i) => {
          const t0 = [X.at(S, 1, 2.2), X.at(S, 1, 6.6), X.at(S, 2, 0.8), X.at(S, 2, 2.0)][i], a = clamp((S.local - t0) / 0.4);
          if (a <= 0) return;
          rrect(ctx, x0 + (i * 2 + 1) * cw + 4, oy, cw - 8, 64, 10, vcol(v * 0.6, 0.45), COL.C, 2.5);
          txt(ctx, fmt(v, 1), x0 + (i * 2 + 1.5) * cw, oy + 33, { size: 26, weight: 700, mono: true, align: 'center', base: 'middle', alpha: a });
          if (a < 1) glow(ctx, x0 + (i * 2 + 1.5) * cw, oy + 32, 80, COL.C, 1 - a);
        });
        const pk = S.p(1, 0.6, 1.2);
        if (pk > 0 && S.b === 1) mtxt(ctx, '1·0.2 + 0·0.9 + (−1)·0.6 = {C:−0.4}', 960, oy + 150, { size: 30, mono: true, align: 'center', alpha: pk * (1 - S.p(1, 0.4, 5)) });
        mtxt(ctx, 'stride = {K:2}', 960, y0 - 150, { size: 30, mono: true, align: 'center', alpha: S.p(1, 0.6, 5.2) });
        const f = S.p(2, 0.7, 2.6);
        if (f > 0) {
          X.card(ctx, 360, 640, 1200, 230, f);
          mtxt(ctx, 'out = ⌊ ( in − {K:kernel} ) / {K:stride} ⌋ + 1', 960, 712, { size: 38, mono: true, align: 'center', alpha: f });
          mtxt(ctx, '⌊ ( 10 − 3 ) / 2 ⌋ + 1  =  ⌊ 3.5 ⌋ + 1  =  {C:4}', 960, 790, { size: 32, mono: true, align: 'center', color: COL.dim, alpha: S.p(2, 0.6, 5) });
        }
        ctx.restore();
      }
      // 3-D: many kernels -> channels; then kernels that span 512 input channels
      const k3 = S.p(3, 0.8, 0);
      if (k3 > 0) {
        const cam = X.world(ctx, S, [[3, -1, { yaw: 0.6, pitch: 0.28, dist: 2300, tx: 0, ty: 0, tz: 0, cx: 960, cy: 520 }], [3, 5, { yaw: 0.35, dist: 2000 }], [4, 0, { yaw: -0.35, pitch: 0.3, dist: 1900 }]], { floorY: -300, floorAlpha: k3, dustAlpha: k3 });
        const l2 = S.p(4, 0.8, 0);
        // input: 1 channel (beat 3) or 512 channels (beat 4)
        const inH = lerp(26, 250, l2), slide = (S.local * 0.18) % 1;
        S3.block(ctx, cam, { x: -420, y: 0, z: 0, w: 560, h: inH, d: 60, cells: [l2 > 0.5 ? 10 : 1, 24, 2], seed: l2 > 0.5 ? 81 : 80, alpha: k3, color: COL.T,
          tags: { w: ['T', l2 > 0.5 ? 12919 : 64600], h: l2 > 0.5 ? ['C', 512] : null, d: ['B', 'B'] }, tagAlpha: S.p(3, 0.6, 1) });
        const kx = -700 + slide * 520;
        S3.block(ctx, cam, { x: kx, y: 0, z: 0, w: 44, h: inH + 16, d: 76, cells: [l2 > 0.5 ? 10 : 1, 3, 2], alpha: k3, color: COL.K, fn: () => rgba(COL.K, 0.55), glow: COL.K });
        S3.path3(ctx, cam, [[kx + 22, 0, 40], [260, 0, 40]], { color: COL.K, lw: 2, alpha: 0.6 * k3, dash: [8, 8], head: true });
        // output: 512 channels
        const oh = S.p(3, 0.8, 2.4);
        S3.block(ctx, cam, { x: 520, y: 0, z: 0, w: 420, h: 250, d: 60, cells: [10, 18, 2], seed: 82, alpha: oh, reveal: S.l(3, 1.6, 2.4), color: COL.C,
          tags: { w: ['T', l2 > 0.5 ? 6459 : 12919], h: ['C', 512], d: ['B', 'B'] } });
        S3.caption(ctx, cam, 520, 230, 0, '512 kernels → 512 channels', { size: 26, mono: false, weight: 700, color: COL.C, alpha: oh * (1 - l2) });
        S3.caption(ctx, cam, -420, 230, 0, l2 > 0.5 ? 'kernel spans all 512 input channels' : 'conv 1: kernel 10, stride 5, + bias', { size: 24, mono: false, weight: 700, color: COL.K, alpha: S.p(3, 0.6, 5) });
        const wt = S.p(4, 0.7, 5.5);
        if (wt > 0) {
          X.card(ctx, 560, 820, 800, 120, wt);
          mtxt(ctx, 'weight: ({C:512}, {C:512}, {K:3})  ·  out × in × kernel', 960, 890, { size: 30, mono: true, align: 'center', alpha: wt });
        }
      }
    },
  });

  // ------------------------------------------------------------------ 5 the feature encoder
  const ENC = [[64600, 1, null, null], [12919, 512, 10, 5], [6459, 512, 3, 2], [3229, 512, 3, 2], [1614, 512, 3, 2], [806, 512, 3, 2], [403, 512, 2, 2], [201, 512, 2, 2]];
  S_.push({
    id: 'x_encoder', chapter: 5, title: 'The feature encoder: 7 convolutions', code: 'model.feature_extractor.conv_layers[0..6]',
    beats: [
      "X L S R's feature encoder stacks seven of these convolutions. The first has kernel ten and stride five. The next four have kernel three, stride two. The last two have kernel two, stride two.",
      "Push sixty-four thousand six hundred samples through, using the formula. Layer one gives twelve thousand nine hundred and nineteen frames. Then six thousand four hundred and fifty-nine, three thousand two hundred and twenty-nine, one thousand six hundred and fourteen, eight hundred and six, four hundred and three, and finally two hundred and one.",
      "The channel axis jumps from one to five hundred and twelve in the first layer and stays there. So the encoder outputs B, by five hundred and twelve, by two hundred and one.",
      "Multiply the strides: five, times two to the sixth, is three hundred and twenty samples, or twenty milliseconds. Tracing back through the kernels, each frame sees four hundred samples, twenty-five milliseconds of audio. So frames are twenty-five milliseconds wide and twenty apart, and they overlap slightly.",
      "Here's where X L S R differs from the original base model. After every convolution comes a layer norm across the five hundred and twelve channels, then a GELU: a smooth activation that passes positive values and squashes negative ones toward zero. The base model only normalized its first layer.",
      "In total the encoder has about four point two one million weights. Its job is purely local. It turns every twenty-five milliseconds of waveform into five hundred and twelve numbers, with no idea yet what came before or after.",
    ],
    hud: S => { const k = S.b === 1 ? clamp(Math.floor((S.T(1) - 2.5) / 1.55) + 1, 0, 7) : S.b >= 2 ? 7 : 0; return { stage: 1, shape: k ? `({B:B}, {C:512}, {T:${ENC[k][0]}})` : '({B:B}, {C:1}, {T:64600})' }; },
    draw(ctx, S) {
      const stair = 1 - S.p(3, 0.6, 0) + S.p(5, 0.6, 0);
      const cam = X.world(ctx, S, [
        [0, -1, { yaw: 0.45, pitch: 0.26, dist: 2700, tx: -100, ty: -20, tz: 0, cx: 960, cy: 500 }],
        [1, 0, { yaw: 0.38, pitch: 0.2, dist: 1700, tx: -750 }], [1, 9, { tx: 420, yaw: 0.25 }],
        [2, 0, { yaw: 0.12, dist: 1350, tx: 700 }], [5, 0, { yaw: 0.42, pitch: 0.28, dist: 2700, tx: -100 }],
      ], { floorY: -300, floorAlpha: stair, dustAlpha: 1 });
      if (stair > 0.01) {
        const xs = [-1180, -820, -500, -210, 60, 310, 540, 760];
        ENC.forEach(([n, c, k, s], i) => {
          const a = i === 0 ? S.p(0, 0.6, 0) : Math.max(0.18 * S.p(0, 0.8, 0.5), easeOut4((S.T(1) - 2.3 - (i - 1) * 1.55) / 0.6) + (S.b > 1 ? 1 : 0));
          if (a <= 0) return;
          const w = X.ln(n) * 0.62, h = c === 1 ? 22 : X.ln(512) * 0.8;
          S3.block(ctx, cam, { x: xs[i], y: 0, z: 0, w, h, d: 60, cells: [c === 1 ? 1 : 8, Math.max(3, Math.round(w / 26)), 2], seed: 90 + i, alpha: clamp(a) * stair,
            color: i === 7 ? THEME.a : c === 1 ? COL.T : COL.C, glow: i === 7 && S.b >= 2 ? THEME.a : null,
            tags: { w: ['T', n], h: c === 1 ? ['C', 1] : (i === 1 || i === 7 ? ['C', 512] : null) }, tagAlpha: i === 0 || i === 1 || i === 7 ? 1 : 0.9 });
          if (k) {
            const gx = (xs[i - 1] + X.ln(ENC[i - 1][0]) * 0.31 + xs[i] - w / 2) / 2;
            S3.gate(ctx, cam, gx, 0, 0, 260, 110, { color: COL.K, alpha: stair * S.p(0, 0.6, 0.8 + i * 0.5), label: `k${k} s${s}` });
          }
        });
        S3.caption(ctx, cam, 760, 230, 0, '({B:B}, {C:512}, {T:201})', { size: 32, alpha: S.p(2, 0.6, 1) * stair });
      }
      // stride and receptive field (2-D)
      const rf = S.p(3, 0.6, 0) * (1 - S.p(4, 0.6, 0));
      if (rf > 0) {
        X.card(ctx, 160, 180, 1600, 640, rf);
        mtxt(ctx, 'total stride = {K:5} × 2 × 2 × 2 × 2 × 2 × 2 = {A:320} samples = {A:20 ms}', 960, 250, { size: 34, mono: true, align: 'center', alpha: rf });
        drawWave(ctx, 220, 420, 1480, 150, { from: 0, to: 5200, color: COL.T, alpha: rf * 0.8 });
        const px = 1480 / 5200;
        for (let i = 0; i < 9; i++) {
          const k = easeOut4((S.T(3) - 3.5 - i * 0.18) / 0.4) * rf;
          if (k <= 0) continue;
          const x = 220 + i * 320 * px, y = 540 + (i % 2) * 34;
          rrect(ctx, x, y, 400 * px, 26, 6, rgba(i % 2 ? COL.C : COL.K, 0.3 * k), i % 2 ? COL.C : COL.K, 2);
        }
        txt(ctx, 'each frame sees 400 samples = 25 ms; frames start every 320 samples = 20 ms', 960, 680, { size: 26, weight: 600, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 6) });
        mtxt(ctx, 'receptive field  r = 10 + 2·5 + 2·10 + 2·20 + 2·40 + 1·80 + 1·160 = {K:400}', 960, 760, { size: 26, mono: true, align: 'center', alpha: S.p(3, 0.6, 7.5) });
      }
      // conv -> layer norm -> GELU
      const ln = S.p(4, 0.6, 0) * (1 - S.p(5, 0.6, 0));
      if (ln > 0) {
        X.card(ctx, 160, 180, 1600, 640, ln);
        const steps = [['Conv1d', '+ bias', COL.K], ['LayerNorm', 'over 512 channels', COL.A], ['GELU', 'smooth activation', COL.C]];
        steps.forEach(([a, b, col], i) => {
          const k = S.p(4, 0.6, 1 + i * 2.2);
          box(ctx, 230 + i * 330, 280, 280, 140, [a, b], { size: 32, color: col, stroke: col, alpha: k });
          if (i) arrow(ctx, 230 + i * 330 - 46, 350, 230 + i * 330 - 8, 350, { alpha: k, p: k });
        });
        txt(ctx, '× 7 layers (base model: norm only after layer 1)', 650, 480, { size: 24, weight: 600, align: 'center', color: COL.dim, alpha: S.p(4, 0.6, 9) });
        // GELU curve
        const gx = 1270, gy = 560, sx = 90, sy = 90;
        line(ctx, gx - 3.2 * sx, gy, gx + 3.2 * sx, gy, COL.faint, 2); line(ctx, gx, gy + 1.2 * sy, gx, gy - 3.2 * sy, COL.faint, 2);
        const gelu = x => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x * x * x)));
        const pr = S.l(4, 1.5, 6.5);
        ctx.save(); ctx.strokeStyle = COL.C; ctx.lineWidth = 4; ctx.beginPath();
        for (let i = 0; i <= 200 * pr; i++) { const x = -3 + 6 * i / 200; i ? ctx.lineTo(gx + x * sx, gy - gelu(x) * sy) : ctx.moveTo(gx + x * sx, gy - gelu(x) * sy); }
        ctx.globalAlpha *= ln; ctx.stroke(); ctx.restore();
        txt(ctx, 'GELU(x) ≈ x · Φ(x)', gx + 120, gy - 230, { size: 26, mono: true, color: COL.C, alpha: S.p(4, 0.6, 7) });
      }
      const pm = S.p(5, 0.7, 1);
      if (pm > 0) {
        X.card(ctx, 1240, 620, 560, 210, pm);
        E.countUp(ctx, 4210176, 0, 1520, 712, (S.T(5) - 1.2), { size: 54, align: 'center', color: THEME.a });
        txt(ctx, 'weights in the 7-layer encoder', 1520, 770, { size: 22, weight: 600, align: 'center', color: COL.dim, alpha: pm });
      }
    },
  });

  // ------------------------------------------------------------------ 6 transpose, layer norm, projection
  S_.push({
    id: 'x_project', chapter: 6, title: 'Transpose, layer norm, projection', code: 'model.feature_projection',
    beats: [
      "The transformer wants time first, so we transpose the last two axes: B, by two hundred and one, by five hundred and twelve. Nothing is computed. The same numbers are simply read in a different order.",
      "Each of the two hundred and one rows is one frame. Layer normalization rescales every frame on its own: subtract the mean of its five hundred and twelve numbers, divide by their standard deviation, then apply a learned scale and shift.",
      "Then a linear layer. Each output number is a weighted sum of all the input numbers, plus a bias. Put the weights in a matrix, five hundred and twelve by one thousand and twenty-four, and the whole layer becomes one matrix multiplication: two hundred and one by five hundred and twelve, times five hundred and twelve by one thousand and twenty-four, gives two hundred and one by one thousand and twenty-four. The inner sizes match, and disappear.",
      "One warning. PyTorch stores this weight the other way around, one thousand and twenty-four by five hundred and twelve, and computes x times W transposed, plus b. The layer only touches the last axis; batch and time pass straight through. One thousand and twenty-four is the model width, and it stays fixed until the very end.",
    ],
    hud: S => ({ stage: 2, shape: ['({B:B}, {T:201}, {C:512})', '({B:B}, {T:201}, {C:512})', '({B:B}, {T:201}, {C:1024})', '({B:B}, {T:201}, {C:1024})'][S.b] }),
    draw(ctx, S) {
      const mm = S.p(2, 0.8, 0);
      const cam = X.world(ctx, S, [
        [0, -1, { yaw: 0.45, pitch: 0.2, dist: 2000, tx: 0, ty: 0, tz: 0, cx: 960, cy: 520 }], [1, 0, { yaw: -0.3, pitch: 0.25, dist: 1800 }],
        [2, 0, { yaw: 0.0, pitch: 0.08, dist: 2700, tx: 180, ty: 60 }], [3, 0, { yaw: 0.25, pitch: 0.18, dist: 2800 }],
      ], { floorY: -380 });
      // transpose: the block turns from (C, T) to (T, C) — width and height trade places
      const tr = easeIO((S.T(0) - 1.0) / 1.4), one = 1 - mm;
      if (one > 0) {
        const wT = 230, hC = 290;
        const w = lerp(wT, hC, tr), h = lerp(hC, wT, tr);
        S3.block(ctx, cam, { x: 0, y: 0, z: 0, w, h, d: 80, cells: tr > 0.5 ? [9, 12, 3] : [12, 9, 3], seed: 111, alpha: S.p(0, 0.6, 0) * one, color: tr > 0.5 ? COL.T : COL.C,
          fn: tr > 0.5 ? ((r, c, f) => vcol(noise(c + f * 31, r, 111) * 0.95, 0.95)) : null,
          tags: tr > 0.5 ? { w: ['C', 512], h: ['T', 201], d: ['B', 'B'] } : { w: ['T', 201], h: ['C', 512], d: ['B', 'B'] } });
        S3.caption(ctx, cam, 0, 250, 0, tr > 0.5 ? '({B:B}, {T:201}, {C:512})' : '({B:B}, {C:512}, {T:201})', { size: 32, alpha: S.p(0, 0.6, 0.4) * one });
        // layer norm: one frame (row) at a time
        const lnk = S.p(1, 0.6, 1) * one;
        if (lnk > 0) {
          const row = Math.floor((S.local * 3) % 9), rowH = 230 / 9;
          const p1 = cam.p(-145, 115 - row * rowH, 41), p2 = cam.p(145, 115 - (row + 1) * rowH, 41);
          ctx.save(); ctx.globalAlpha *= lnk; ctx.strokeStyle = COL.A; ctx.lineWidth = 3; ctx.strokeRect(p1[0] - 6, p1[1], p2[0] - p1[0] + 12, p2[1] - p1[1]); ctx.restore();
          glow(ctx, (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, 120, COL.A, 0.35 * lnk);
          X.card(ctx, 1180, 300, 640, 300, lnk);
          txt(ctx, 'LayerNorm, per frame', 1220, 350, { size: 28, weight: 700, color: COL.A, alpha: lnk });
          mtxt(ctx, 'μ = mean of the {C:512} numbers', 1220, 410, { size: 24, mono: true, alpha: S.p(1, 0.6, 3) });
          mtxt(ctx, 'σ = their standard deviation', 1220, 455, { size: 24, mono: true, alpha: S.p(1, 0.6, 4) });
          mtxt(ctx, 'y = {K:γ} · (x − μ) / σ + {K:β}', 1220, 520, { size: 28, mono: true, alpha: S.p(1, 0.6, 6) });
          txt(ctx, 'across features, within one frame', 1220, 570, { size: 20, color: COL.dim, alpha: S.p(1, 0.6, 7.5) });
        }
      }
      // matrix multiplication laid out in 3-D: X (201 x 512) · W (512 x 1024) = Y (201 x 1024)
      if (mm > 0) {
        const fade = 1;
        S3.block(ctx, cam, { x: -560, y: -60, z: 0, w: 300, h: 240, d: 16, cells: [9, 11, 1], seed: 121, alpha: mm, color: COL.T, reveal: S.l(2, 1.2, 0.4),
          tags: { w: ['C', 512], h: ['T', 201] } });
        S3.caption(ctx, cam, -560, 100, 0, 'X', { size: 40, mono: false, weight: 800, color: COL.T, alpha: mm });
        const wk = S.p(2, 0.8, 4.2);
        S3.block(ctx, cam, { x: 70, y: 280, z: 0, w: 380, h: 300, d: 16, cells: [11, 14, 1], seed: 122, alpha: wk, color: COL.K, reveal: S.l(2, 1.2, 4.2),
          tags: { w: ['C', 1024], h: ['C', 512] }, fn: (r, c) => rgba(COL.K, 0.2 + 0.5 * (noise(r, c, 122) * 0.5 + 0.5)) });
        S3.caption(ctx, cam, 70, 470, 0, 'W', { size: 40, mono: false, weight: 800, color: COL.K, alpha: wk });
        const yk = S.p(2, 0.8, 8.5);
        S3.block(ctx, cam, { x: 70, y: -60, z: 0, w: 380, h: 240, d: 16, cells: [9, 14, 1], seed: 123, alpha: yk, color: THEME.a, reveal: S.l(2, 1.6, 8.5), glow: THEME.a,
          tags: { w: ['C', 1024], h: ['T', 201] } });
        S3.caption(ctx, cam, 360, -60, 0, '= Y', { size: 40, mono: false, weight: 800, color: THEME.a, alpha: yk });
        // the row-times-column picture
        const rc = S.p(2, 0.6, 6.5) * (1 - S.p(3, 0.5, 0));
        if (rc > 0) {
          const rr = cam.p(-710, 30, 9), rr2 = cam.p(-410, 10, 9), cc = cam.p(120, 430, 9), cc2 = cam.p(150, 130, 9), yy = cam.p(135, 20, 9);
          ctx.save(); ctx.globalAlpha *= rc; ctx.strokeStyle = COL.T; ctx.lineWidth = 3; ctx.strokeRect(rr[0], rr[1], rr2[0] - rr[0], rr2[1] - rr[1]);
          ctx.strokeStyle = COL.K; ctx.strokeRect(cc[0], cc[1], cc2[0] - cc[0], cc2[1] - cc[1]); ctx.restore();
          glow(ctx, yy[0], yy[1], 60, THEME.a, rc);
          txt(ctx, 'row of X · column of W = one number of Y', 960, 860, { size: 28, weight: 700, align: 'center', alpha: rc });
        }
        mtxt(ctx, '({T:201} × {C:512})  ·  ({C:512} × {C:1024})  =  ({T:201} × {C:1024})', 960, 920, { size: 32, mono: true, align: 'center', alpha: S.p(2, 0.6, 11) });
        const wt = S.p(3, 0.7, 0.5);
        if (wt > 0) {
          X.card(ctx, 1190, 160, 640, 250, wt);
          txt(ctx, 'stored transposed in PyTorch', 1230, 210, { size: 26, weight: 700, color: COL.K, alpha: wt });
          mtxt(ctx, 'projection.weight: ({C:1024}, {C:512})', 1230, 270, { size: 26, mono: true, alpha: wt });
          mtxt(ctx, 'y = x · Wᵀ + b', 1230, 325, { size: 28, mono: true, alpha: S.p(3, 0.6, 2.5) });
          mtxt(ctx, 'B and T untouched', 1230, 375, { size: 22, color: COL.dim, alpha: S.p(3, 0.6, 6) });
        }
      }
    },
  });
})();
