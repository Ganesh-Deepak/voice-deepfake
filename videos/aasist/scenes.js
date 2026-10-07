// AASIST back-end (SSL-AASIST: XLS-R -> AASIST). Shapes traced from refs/SSL_Anti-spoofing/model.py (verify/aasist_shapes.py).
(function () {
  const { W, COL, clamp, lerp, easeIO, noise, fmt, fmtInt, rgba, vcol, scol, txt, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box,
    cells, mat, dimTop, dimLeft, dimBottom, dimRight, stack, numRow, numMat, brace, cross, drawWave } = E;
  const S_ = window.SCENES;

  // ---- helpers ----
  function node(ctx, x, y, r, col, a = 1, label) {
    ctx.save(); ctx.globalAlpha *= a;
    ctx.fillStyle = rgba(col, 0.22); ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    if (label) txt(ctx, label, x, y + 1, { size: Math.max(12, r * 0.8), weight: 700, align: 'center', base: 'middle', color: col });
    ctx.restore();
  }
  function nodeRow(ctx, x0, y, n, gap, r, col, a = 1, fnA) {
    for (let i = 0; i < n; i++) node(ctx, x0 + i * gap, y, r, col, a * (fnA ? fnA(i) : 1));
  }
  function heatF(ctx, x, y, size, n, f, a = 1, gap) {
    ctx.save(); ctx.globalAlpha *= a;
    rrect(ctx, x - 3, y - 3, size + 6, size + 6, 6, COL.bg2, COL.line, 2);
    cells(ctx, x, y, n, n, size / n, size / n, (i, j) => scol(clamp(f(i, j))), gap ?? (size / n > 6 ? 1 : 0));
    ctx.restore();
  }
  function selu(x) { return 1.0507 * (x > 0 ? x : 1.67326 * (Math.exp(x) - 1)); }
  const SHP = {
    in: '({B:B}, {T:201}, {C:1024})', ll: '({B:B}, {T:201}, {C:128})', img: '({B:B}, {C:1}, {F:128}, {T:201})', pool: '({B:B}, {C:1}, {F:42}, {T:67})',
    enc: '({B:B}, {C:64}, {F:42}, {T:67})', eS: '({B:B}, {F:42}, {C:64})', eT: '({B:B}, {T:67}, {C:64})',
  };

  // ------------------------------------------------------------------ 0 intro
  S_.push({
    id: 'a_intro', chapter: 0, title: 'Introduction', noHeader: true,
    beats: [
      "In the previous video we followed wav2vec 2.0 from raw audio to a sequence of context vectors. Now we'll follow those vectors into AASIST, the graph attention back-end used by many of the strongest spoofing detectors.",
      "AASIST was introduced by Jung and colleagues in 2022. Tak and colleagues then put it on top of the X L S R front-end. That combination, usually called SSL-AASIST, is what we'll trace, using the exact shapes from the authors' own code.",
      "As before, the bar at the bottom always shows the shape we're holding. There are two new axes this time: teal F, for the feature rows that AASIST treats like frequency, and purple N, for graph nodes.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: SHP.in } : null,
    draw(ctx, S) {
      const a0 = S.p(0, 1.2);
      for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) {
        const ang = k => -Math.PI / 2 + k * 2 * Math.PI / 9;
        line(ctx, W / 2 + 330 * Math.cos(ang(i)) * 1.9, 560 + 150 * Math.sin(ang(i)), W / 2 + 330 * Math.cos(ang(j)) * 1.9, 560 + 150 * Math.sin(ang(j)), rgba(COL.H, 0.08 * a0), 1.5);
      }
      for (let i = 0; i < 9; i++) { const ang = -Math.PI / 2 + i * 2 * Math.PI / 9; node(ctx, W / 2 + 330 * Math.cos(ang) * 1.9, 560 + 150 * Math.sin(ang), 14, i % 2 ? COL.T : COL.F, 0.5 * a0); }
      txt(ctx, 'AASIST', W / 2, 400, { size: 132, weight: 800, align: 'center', alpha: a0 });
      txt(ctx, 'the graph-attention back-end, shape by shape', W / 2, 475, { size: 40, weight: 500, align: 'center', color: COL.dim, alpha: S.p(0, 1, 0.6) });
      const a1 = S.p(1, 0.8, 1);
      mtxt(ctx, 'waveform  →  {A:XLS-R}  →  {H:AASIST}  →  spoof / bona fide', W / 2, 780, { size: 34, align: 'center', alpha: a1, weight: 600 });
      txt(ctx, 'Jung et al., ICASSP 2022  ·  Tak et al., Odyssey 2022 (SSL-AASIST)', W / 2, 830, { size: 24, align: 'center', color: COL.dim, alpha: a1 });
      const a2 = S.p(2, 0.6, 3);
      if (a2 > 0) {
        [['F', 'feature rows ("spectral")', COL.F], ['N', 'graph nodes', COL.N]].forEach((l, i) => {
          const x = 600 + i * 440;
          rrect(ctx, x, 880, 60, 60, 12, rgba(l[2], 0.15 * a2), rgba(l[2], a2), 3);
          txt(ctx, l[0], x + 30, 912, { size: 34, weight: 800, align: 'center', base: 'middle', color: l[2], alpha: a2 });
          txt(ctx, l[1], x + 80, 920, { size: 26, weight: 600, alpha: a2 });
        });
      }
    },
  });

  // ------------------------------------------------------------------ 1 overview
  const OV = [
    ['XLS-R output', 'frames × features', SHP.in, COL.A],
    ['Linear', '1024 → 128', SHP.ll, COL.K],
    ['As an image', 'max-pool 3×3', SHP.pool, COL.F],
    ['Encoder', '6 residual blocks', SHP.enc, COL.C],
    ['Two node sets', 'spectral + temporal', '{F:42} + {T:67} nodes', COL.N],
    ['Graph attention', 'GAT, pool, HS-GAL ×2', '{T:16} + {F:10} + 1', COL.H],
    ['Readout', 'max, mean → Linear', '({B:B}, {K:2})', COL.B],
  ];
  S_.push({
    id: 'a_overview', chapter: 1, title: 'The big picture',
    beats: [
      "Here's the whole back-end. It receives X L S R's output: two hundred and one frames of one thousand and twenty-four numbers each, for a four-second clip.",
      "A linear layer shrinks each frame to one hundred and twenty-eight numbers. Then the back-end does something surprising: it treats that features-by-frames grid as an image, and max-pools it.",
      "A small convolutional encoder, built from six residual blocks, processes that image.",
      "Then the image is summarized twice: once along time, which gives a set of spectral nodes, and once along the feature axis, which gives a set of temporal nodes.",
      "Graph attention lets the nodes exchange information, first within each set, and then across both sets at once, with the help of a master node.",
      "Finally, a readout squeezes everything into one hundred and sixty numbers, and a linear layer produces two scores: spoof, or bona fide. The whole back-end has only about four hundred and forty-seven thousand parameters. That's tiny next to X L S R's three hundred and fifteen million.",
    ],
    hud: S => ({ stage: [0, 2, 3, 4, 6, 7][S.b], shape: [SHP.in, SHP.pool, SHP.enc, SHP.eS, '({B:B}, {T:16}, {C:32})', '({B:B}, {K:2})'][S.b] }),
    draw(ctx, S) {
      const bw = 232, gap = 26, x0 = (W - (7 * bw + 6 * gap)) / 2, y = 300, h = 170;
      const on = [0, 1, 1, 2, 3, 4, 5];
      OV.forEach((o, i) => {
        const a = S.p(on[i], 0.6, i === 2 ? 3 : 0);
        const x = x0 + i * (bw + gap);
        const hl = S.b === on[i];
        box(ctx, x, y, bw, h, [o[0], o[1]], { size: 25, color: o[3], alpha: a, stroke: hl ? COL.A : COL.line, glow: hl ? COL.A : null });
        if (i) arrow(ctx, x - gap + 3, y + h / 2, x - 3, y + h / 2, { alpha: a, head: 10, lw: 2 });
        mtxt(ctx, o[2], x + bw / 2, y + h + 50, { size: 20, mono: true, align: 'center', alpha: a, color: COL.dim });
      });
      const f = S.p(5, 0.8, 8);
      if (f > 0) {
        ctx.save(); ctx.globalAlpha = f;
        txt(ctx, 'parameters (log scale)', 260, 690, { size: 22, color: COL.dim });
        const bar = (yy, v, label, col) => {
          const w = 1300 * Math.log10(v) / Math.log10(315.44e6);
          rrect(ctx, 260, yy, w * easeIO(S.l(5, 1.2, 8.5)), 44, 8, rgba(col, 0.35), col, 2);
          txt(ctx, label, 260 + w + 20, yy + 31, { size: 24, weight: 700, color: col });
        };
        bar(710, 315438720, 'XLS-R 300M  315,438,720', COL.A);
        bar(780, 447242, 'AASIST back-end  447,242', COL.H);
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 2 start
  S_.push({
    id: 'a_start', chapter: 2, title: 'Where the back-end starts',
    code: S => S.b < 2 ? 'SSLModel.extract_feat(x)' : 'self.LL = nn.Linear(1024, 128)',
    beats: [
      "Our input clip is sixty-four thousand six hundred samples: about four point oh four seconds, the crop length used in the ASVspoof recipes. Longer clips are cut, and shorter clips are repeated until they fill it.",
      "X L S R turns it into B by two hundred and one by one thousand and twenty-four. Remember the formula from the first video: sixty-four thousand six hundred, minus four hundred, divided by three hundred and twenty, rounded down, plus one. That's two hundred and one frames.",
      "The first layer of the back-end, called L L in the code, is a linear layer from one thousand and twenty-four to one hundred and twenty-eight. Its weight is stored as one hundred and twenty-eight by one thousand and twenty-four. Every frame keeps its place in time; only the feature axis shrinks. B by two hundred and one by one hundred and twenty-eight.",
      "In SSL-AASIST the whole X L S R model is fine-tuned together with the back-end, with a very small learning rate: one in a million. That keeps the pre-trained features from being destroyed early in training.",
    ],
    hud: S => ({ stage: S.b < 2 ? 0 : 1, shape: [ '({B:B}, {T:64600})', SHP.in, SHP.ll, SHP.ll][S.b], label: S.b === 0 ? 'waveform' : 'tensor shape' }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        rrect(ctx, 140, 200, 1640, 170, 14, COL.panel, COL.line, 2);
        drawWave(ctx, 160, 285, 1600, 130, { lw: 1.2 });
        dimBottom(ctx, 160, 376, 1600, '{T:64,600} samples  ≈ 4.04 s', COL.T, 26);
        const t = S.p(0, 0.6, 5);
        ctx.globalAlpha = A * t;
        txt(ctx, 'short clip, tiled:', 140, 500, { size: 24, color: COL.dim });
        for (let k = 0; k < 3; k++) {
          const w = k < 2 ? 640 : 1640 - 2 * 640 - 20;
          rrect(ctx, 140 + k * 650, 520, w, 70, 8, rgba(COL.T, 0.08), rgba(COL.T, 0.6), 1.5);
          drawWave(ctx, 150 + k * 650, 555, w - 20, 50, { from: 2000, to: 2000 + Math.floor(9000 * (w / 640)), lw: 1 });
        }
        ctx.globalAlpha = A;
        const b = S.p(1, 0.6, 0.5);
        if (b > 0) {
          ctx.globalAlpha = A * b;
          arrow(ctx, 960, 610, 960, 660, {});
          box(ctx, 760, 670, 400, 90, ['XLS-R 300M', '24 layers · hidden 1024'], { size: 26, color: COL.A });
          mtxt(ctx, '⌊ (64600 − {K:400}) / {A:320} ⌋ + 1  =  {T:201}', W / 2, 830, { size: 34, mono: true, align: 'center', alpha: S.p(1, 0.6, 5) });
          mtxt(ctx, 'output: ({B:B}, {T:201}, {C:1024})', W / 2, 890, { size: 30, mono: true, align: 'center', alpha: S.p(1, 0.6, 9) });
        }
        ctx.restore();
      }
      const Bv = S.p(2);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        mat(ctx, 200, 300, 520, 300, { rows: 16, cols: 30, seed: 301, left: ['{T:201}', COL.T], top: ['{C:1024}', COL.C], title: 'XLS-R features' });
        arrow(ctx, 760, 450, 880, 450, { color: COL.K });
        box(ctx, 890, 390, 250, 120, ['LL', '1024 → 128'], { size: 32, color: COL.K });
        arrow(ctx, 1150, 450, 1270, 450, { color: COL.K });
        mat(ctx, 1320, 300, 150, 300, { rows: 16, cols: 8, seed: 302, left: ['{T:201}', COL.T], top: ['{C:128}', COL.C], title: 'x' });
        mtxt(ctx, 'LL.weight.shape = ({C:128}, {C:1024})    y = x·Wᵀ + b', W / 2, 720, { size: 30, mono: true, align: 'center', alpha: S.p(2, 0.6, 4) });
        mtxt(ctx, '({B:B}, {T:201}, {C:1024})  →  ({B:B}, {T:201}, {C:128})     131,200 weights', W / 2, 790, { size: 28, mono: true, align: 'center', alpha: S.p(2, 0.6, 9), color: COL.dim });
        const c = S.p(3, 0.6, 0.5);
        if (c > 0) {
          ctx.globalAlpha = Bv * c;
          rrect(ctx, 380, 840, 1160, 80, 14, COL.panel, rgba(COL.A, 0.6), 2);
          txt(ctx, 'XLS-R + back-end trained end-to-end  ·  Adam, lr = 1e-6', W / 2, 890, { size: 28, weight: 600, align: 'center' });
        }
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 3 image + pool
  const POOLT = [[3, 1, 4, 1, 5, 9], [2, 6, 5, 3, 5, 8], [9, 7, 9, 3, 2, 3], [8, 4, 6, 2, 6, 4], [3, 3, 8, 3, 2, 7], [9, 5, 0, 2, 8, 8]];
  S_.push({
    id: 'a_image', chapter: 3, title: 'Features as an image',
    code: S => S.b < 2 ? 'x.transpose(1, 2).unsqueeze(1)' : S.b < 4 ? 'F.max_pool2d(x, (3, 3))' : 'first_bn (BatchNorm2d(1)) → SELU',
    beats: [
      "Now the trick. Transpose, to put features before time: B by one hundred and twenty-eight by two hundred and one. Then add a channel axis of size one: B by one by one hundred and twenty-eight by two hundred and one.",
      "That's the standard layout for images in PyTorch: batch, channels, height, width. The height is the one hundred and twenty-eight feature rows, and the width is the two hundred and one frames. AASIST was designed for spectrogram-like inputs, so the code calls the height axis spectral. Here it really holds learned features, not frequencies, but the name stuck.",
      "Next, a two-dimensional max pooling with a three by three window. The grid is cut into non-overlapping three by three patches, and each patch is replaced by its largest value.",
      "One hundred and twenty-eight divided by three, rounded down, is forty-two. Two hundred and one divided by three is sixty-seven. The tensor becomes B by one by forty-two by sixty-seven.",
      "Then batch normalization and a SELU activation. Batch norm rescales each channel using statistics computed over the whole batch and every position. SELU passes positive values through, scaled by about one point oh five, and bends negative values smoothly down towards minus one point seven six. The shape doesn't change.",
    ],
    hud: S => ({ stage: S.b < 2 ? 1 : 2, shape: S.b < 2 ? SHP.img : S.b < 3 ? SHP.img : SHP.pool }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const t = easeIO(S.l(0, 1.6, 1.5));
        const R = 10, Cc = 16, s = 26;
        // (T rows, C cols) -> (F rows, T cols)
        for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) {
          const x = lerp(300 + r * s, 300 + c * s, t), y = lerp(260 + c * s, 260 + r * s, t);
          ctx.fillStyle = vcol(noise(r, c, 311) * 0.9, 0.9); ctx.fillRect(x + 1.5, y + 1.5, s - 3, s - 3);
        }
        ctx.globalAlpha = A * (1 - t);
        dimLeft(ctx, 294, 260, Cc * s, '{T:201}', COL.T, 24); dimTop(ctx, 300, 254, R * s, '{C:128}', COL.C, 24);
        ctx.globalAlpha = A * t;
        dimLeft(ctx, 294, 260, R * s, 'height {F:128}', COL.F, 24); dimTop(ctx, 300, 254, Cc * s, 'width {T:201}', COL.T, 24);
        ctx.globalAlpha = A;
        const u = S.p(0, 0.6, 7);
        if (u > 0) { ctx.globalAlpha = A * u; rrect(ctx, 290, 250, Cc * s + 20, R * s + 20, 10, null, COL.C, 3); txt(ctx, 'channel axis added: C = 1', 300 + Cc * s / 2, 560, { size: 24, weight: 700, align: 'center', color: COL.C }); ctx.globalAlpha = A; }
        mtxt(ctx, '({B:B}, {T:201}, {C:128})', 1380, 330, { size: 34, mono: true, align: 'center' });
        mtxt(ctx, '.transpose(1, 2)  →  ({B:B}, {F:128}, {T:201})', 1380, 400, { size: 28, mono: true, align: 'center', alpha: S.p(0, 0.6, 2) });
        mtxt(ctx, '.unsqueeze(1)  →  ({B:B}, {C:1}, {F:128}, {T:201})', 1380, 460, { size: 28, mono: true, align: 'center', alpha: u });
        const b = S.p(1, 0.6, 0.5);
        if (b > 0) {
          ctx.globalAlpha = A * b;
          rrect(ctx, 960, 560, 840, 300, 14, COL.panel, COL.line, 2);
          mtxt(ctx, '(batch, {C:channels}, {F:height}, {T:width})', 1380, 620, { size: 30, mono: true, align: 'center' });
          wrap(ctx, 'height = {F:128} feature rows, called "spectral" in the code', 990, 690, 790, 40, { size: 26 });
          wrap(ctx, 'width = {T:201} frames (time)', 990, 740, 790, 40, { size: 26 });
          wrap(ctx, 'Here the rows are learned XLS-R features, not frequencies.', 990, 810, 790, 40, { size: 24, color: COL.dim, alpha: S.p(1, 0.6, 10) });
        }
        ctx.restore();
      }
      const P = S.vis(2, 4);
      if (P > 0) {
        ctx.save(); ctx.globalAlpha = P;
        const cw = 72, x0 = 250, y0 = 250;
        const blk = Math.min(3, Math.floor(S.l(2, 4, 3) * 4));
        numMat(ctx, x0, y0, POOLT, cw, cw, { size: 26, d: 0, fmt: v => String(v), fill: (r, c, v) => {
          const bi = Math.floor(r / 3) * 2 + Math.floor(c / 3);
          const blockMax = Math.max(...POOLT.slice(Math.floor(r / 3) * 3, Math.floor(r / 3) * 3 + 3).flatMap(rr => rr.slice(Math.floor(c / 3) * 3, Math.floor(c / 3) * 3 + 3)));
          return bi <= blk && v === blockMax ? rgba(COL.K, 0.45) : rgba(COL.F, 0.10 + 0.04 * v);
        } });
        for (let k = 1; k < 2; k++) { line(ctx, x0 + 3 * cw, y0, x0 + 3 * cw, y0 + 6 * cw, COL.K, 3); line(ctx, x0, y0 + 3 * cw, x0 + 6 * cw, y0 + 3 * cw, COL.K, 3); }
        arrow(ctx, x0 + 6 * cw + 40, y0 + 3 * cw, x0 + 6 * cw + 170, y0 + 3 * cw, { color: COL.K });
        txt(ctx, 'max of each 3×3', x0 + 6 * cw + 105, y0 + 3 * cw - 24, { size: 22, align: 'center', color: COL.K, weight: 700 });
        const out = [[9, 9], [9, 8]];
        numMat(ctx, x0 + 6 * cw + 200, y0 + 2 * cw, out, cw, cw, { size: 28, d: 0, fmt: v => String(v), cellAlpha: (r, c) => (r * 2 + c) <= blk ? 1 : 0.1, fill: () => rgba(COL.K, 0.35) });
        const c = S.p(3, 0.6, 0.3);
        if (c > 0) {
          ctx.globalAlpha = P * c;
          rrect(ctx, 1180, 250, 620, 440, 14, COL.panel, COL.line, 2);
          mtxt(ctx, 'height:  ⌊ {F:128} / 3 ⌋ = {F:42}', 1220, 340, { size: 32, mono: true });
          mtxt(ctx, 'width:   ⌊ {T:201} / 3 ⌋ = {T:67}', 1220, 410, { size: 32, mono: true, alpha: S.p(3, 0.6, 3) });
          mtxt(ctx, '({B:B}, {C:1}, {F:42}, {T:67})', 1490, 520, { size: 34, mono: true, align: 'center', alpha: S.p(3, 0.6, 6) });
          txt(ctx, 'each pooled cell covers 3 frames = 60 ms', 1490, 600, { size: 22, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 7) });
        }
        ctx.restore();
      }
      const Q = S.p(4);
      if (Q > 0) {
        ctx.save(); ctx.globalAlpha = Q;
        const ox = 560, oy = 560, sx = 100, sy = 100;
        rrect(ctx, 150, 180, 820, 700, 16, COL.panel, COL.line, 2);
        line(ctx, 190, oy, 930, oy, COL.faint, 2); line(ctx, ox, 200, ox, 860, COL.faint, 2);
        for (let k = -3; k <= 3; k++) if (k) txt(ctx, String(k), ox + k * sx, oy + 30, { size: 18, align: 'center', color: COL.faint, mono: true });
        line(ctx, 190, oy + 1.7581 * sy, 930, oy + 1.7581 * sy, rgba(COL.R, 0.6), 1.5, [6, 6]);
        txt(ctx, '−1.758', 200, oy + 1.7581 * sy - 10, { size: 18, mono: true, color: COL.R });
        ctx.strokeStyle = COL.A; ctx.lineWidth = 5; ctx.beginPath();
        for (let i = 0; i <= 300 * S.l(4, 2); i++) { const x = -3.7 + 7.4 * i / 300, y = selu(x); const X = ox + x * sx, Y = oy - y * sy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        txt(ctx, 'SELU', 780, 300, { size: 30, weight: 800, color: COL.A });
        mtxt(ctx, 'SELU(x) = λ·x            (x > 0)', 1040, 280, { size: 30, mono: true });
        mtxt(ctx, '         λ·α·(eˣ − 1)     (x ≤ 0)', 1040, 330, { size: 30, mono: true });
        txt(ctx, 'λ ≈ 1.0507,  α ≈ 1.6733', 1040, 390, { size: 26, color: COL.dim, mono: true });
        wrap(ctx, 'BatchNorm2d(C): for each channel, mean and variance over batch × height × width, then learned scale and shift.', 1040, 500, 760, 40, { size: 26, alpha: S.p(4, 0.6, 2) });
        mtxt(ctx, 'shape unchanged: ({B:B}, {C:1}, {F:42}, {T:67})', 1040, 700, { size: 26, mono: true, alpha: S.p(4, 0.6, 12) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 4 conv2d
  const CI = [[0.2, 0.8, -0.3, 0.5, 0.1, -0.6, 0.4], [0.7, -0.2, 0.9, 0.3, -0.5, 0.2, 0.6], [-0.4, 0.5, 0.1, -0.8, 0.7, 0.3, -0.1], [0.3, 0.6, -0.7, 0.2, 0.4, 0.9, -0.3]];
  const CK = [[1, 0, -1], [0.5, 1, 0.5]];
  S_.push({
    id: 'a_conv2d', chapter: 4, title: '2-D convolution',
    code: S => S.b < 1 ? 'nn.Conv2d(in, out, kernel_size=(2, 3))' : S.b < 2 ? 'conv1.weight: (32, 32, 2, 3)' : 'padding=(1, 1) then padding=(0, 1)',
    beats: [
      "The encoder is made of two-dimensional convolutions. It's the same idea as the one-dimensional case: slide a small kernel of weights, multiply, and add. But now the kernel moves in two directions: across the width, and down the height.",
      "AASIST's kernels are two rows tall and three columns wide. A layer with thirty-two output channels and thirty-two input channels stores a weight of shape thirty-two, by thirty-two, by two, by three: out, in, height, width. Each output value sums over all input channels and all six kernel positions.",
      "The length rule applies to each axis separately. With padding p, the output size is: input, plus two p, minus the kernel, divided by the stride, plus one. The first convolution in each block pads by one on every side. Height forty-two becomes forty-three, and width sixty-seven stays sixty-seven.",
      "The second convolution pads only the width. Height forty-three goes back to forty-two, and the width again stays sixty-seven. So every block returns exactly the height and width it received.",
    ],
    hud: S => ({ stage: 3, shape: S.b < 2 ? '({B:B}, {C:32}, {F:42}, {T:67})' : S.b === 2 ? '({B:B}, {C:32}, {F:43}, {T:67})' : '({B:B}, {C:32}, {F:42}, {T:67})', label: S.b >= 2 ? (S.b === 2 ? 'after conv1' : 'after conv2') : 'tensor shape' }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const cw = 90, x0 = 200, y0 = 250;
        numMat(ctx, x0, y0, CI, cw, 72, { size: 22, d: 1 });
        dimLeft(ctx, x0 - 6, y0, 4 * 72, 'height', COL.F, 22); dimTop(ctx, x0, y0 - 6, 7 * cw, 'width', COL.T, 22);
        const steps = 3 * 5, fr = Math.min(steps - 1, Math.floor(S.l(0, S.bd(0) * 0.7, 2) * steps));
        const r = Math.floor(fr / 5), c = fr % 5;
        rrect(ctx, x0 + c * cw - 3, y0 + r * 72 - 3, 3 * cw + 6, 2 * 72 + 6, 10, rgba(COL.K, 0.12), COL.K, 4);
        numMat(ctx, 1080, y0 + 20, CK, 80, 64, { size: 22, d: 1, fill: () => rgba(COL.K, 0.18) });
        txt(ctx, 'kernel 2×3', 1200, y0 - 4, { size: 24, weight: 700, color: COL.K, align: 'center' });
        const O = [0, 1, 2].map(i => [0, 1, 2, 3, 4].map(j => CK.reduce((s, row, a) => s + row.reduce((q, w, b) => q + w * CI[i + a][j + b], 0), 0)));
        numMat(ctx, 1080, y0 + 220, O, 90, 64, { size: 20, d: 2, cellAlpha: (i, j) => i * 5 + j <= fr ? 1 : 0.08, hl: (i, j) => i === r && j === c });
        txt(ctx, 'output: 3 × 5', 1580, y0 + 280, { size: 22, align: 'center', color: COL.dim });
        txt(ctx, '(4 − 2 + 1) × (7 − 3 + 1)', 1580, y0 + 315, { size: 22, align: 'center', color: COL.dim, mono: true });
        const w = S.p(1, 0.6, 0.5);
        if (w > 0) {
          ctx.globalAlpha = A * w;
          rrect(ctx, 150, 700, 1620, 250, 14, 'rgba(10,14,22,0.96)', COL.line, 2);
          for (let o = 0; o < 3; o++) for (let i = 0; i < 6; i++) {
            const x = 200 + i * 78, y = 730 + o * 60;
            cells(ctx, x, y, 2, 3, 20, 22, (a, b) => vcol(noise(o * 7 + i, a * 3 + b, 331), 0.9), 2);
          }
          txt(ctx, '… 32 out', 330, 935, { size: 20, color: COL.dim, align: 'center' });
          txt(ctx, '… 32 in →', 690, 745, { size: 20, color: COL.dim });
          mtxt(ctx, 'weight: ({C:32} out, {C:32} in, {F:2}, {T:3})', 900, 770, { size: 32, mono: true });
          txt(ctx, 'one output value = Σ over 32 channels × 2 × 3 positions', 900, 830, { size: 26, color: COL.dim });
          txt(ctx, '32·32·2·3 + 32 = 6,176 numbers', 900, 890, { size: 26, color: COL.K, mono: true });
        }
        ctx.restore();
      }
      const Bv = S.p(2);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        mtxt(ctx, 'out  =  ⌊ (in + 2·{A:p} − {K:k}) / s ⌋ + 1', W / 2, 230, { size: 40, mono: true, align: 'center', weight: 600 });
        const row = (y, name, pad, eqH, eqW, a) => {
          ctx.globalAlpha = Bv * a;
          rrect(ctx, 200, y - 60, 1520, 190, 14, COL.panel, COL.line, 2);
          txt(ctx, name, 230, y - 15, { size: 28, weight: 800, color: COL.K });
          txt(ctx, pad, 230, y + 25, { size: 22, color: COL.dim, mono: true });
          mtxt(ctx, eqH, 760, y - 5, { size: 30, mono: true });
          mtxt(ctx, eqW, 760, y + 55, { size: 30, mono: true });
        };
        row(390, 'conv1', 'k=(2,3) pad=(1,1)', 'height: {F:42} + 2 − 2 + 1 = {F:43}', 'width:  {T:67} + 2 − 3 + 1 = {T:67}', S.p(2, 0.6, 3));
        row(640, 'conv2', 'k=(2,3) pad=(0,1)', 'height: {F:43} + 0 − 2 + 1 = {F:42}', 'width:  {T:67} + 2 − 3 + 1 = {T:67}', S.p(3, 0.6, 0.5));
        txt(ctx, 'net effect of a block on height × width: none', W / 2, 880, { size: 30, weight: 700, align: 'center', color: COL.A, alpha: S.p(3, 0.6, 7) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 5 residual encoder
  const CH = [[1, 32], [32, 32], [32, 64], [64, 64], [64, 64], [64, 64]];
  S_.push({
    id: 'a_res', chapter: 5, title: 'The residual encoder',
    code: S => S.b === 2 ? 'Residual_block.forward: out = self.conv1(x)' : 'self.encoder = nn.Sequential(6 × Residual_block)',
    beats: [
      "A residual block wraps those two convolutions: convolution, batch norm, SELU, convolution, and then the block's input is added back. When the number of channels changes, the skip path gets its own one by three convolution, so that the two tensors have the same shape and can be added.",
      "There are six blocks. The channels go from one to thirty-two, stay at thirty-two, grow to sixty-four, and stay at sixty-four for the last three. Height and width never change. The encoder's output is B by sixty-four by forty-two by sixty-seven.",
      "One quirk you'll notice if you read the code. Each block after the first computes a batch norm and a SELU of its input, but the first convolution is then applied to the original input, not to that result. The original AASIST code does the same. It doesn't break anything; those two operations just don't affect the output.",
      "After the encoder comes one more batch norm, over the sixty-four channels, and a SELU. The encoder is the largest part of the back-end: about two hundred and eleven thousand of its four hundred and forty-seven thousand parameters.",
    ],
    hud: S => ({ stage: 3, shape: S.b === 0 ? '({B:B}, {C:32}, {F:42}, {T:67})' : SHP.enc }),
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const x = 520, bw = 460;
        chip(ctx, x, 190, 'x  ({B:B}, {C:C_in}, {F:42}, {T:67})', { markup: true, size: 22, mono: true, align: 'center' });
        const blocks = [['conv1', '2×3, pad (1,1)', COL.K, 250], ['BatchNorm2d + SELU', '', COL.A, 390], ['conv2', '2×3, pad (0,1)', COL.K, 500]];
        blocks.forEach(([t, s2, c, y], i) => {
          arrow(ctx, x, y - 30, x, y - 4, {});
          box(ctx, x - bw / 2, y, bw, 80, s2 ? [t, s2] : t, { size: 26, color: c, alpha: S.p(0, 0.4, 0.5 + i * 1.2) });
        });
        arrow(ctx, x, 580, x, 640, {});
        ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, 666, 24, 0, 7); ctx.stroke();
        txt(ctx, '+', x, 668, { size: 34, weight: 700, align: 'center', base: 'middle' });
        parrow(ctx, [[x, 215], [x + bw / 2 + 90, 215], [x + bw / 2 + 90, 666], [x + 28, 666]], { color: COL.B, lw: 3 });
        const sk = S.p(0, 0.6, 9);
        box(ctx, x + bw / 2 + 20, 400, 200, 90, ['conv 1×3', 'if C changes'], { size: 22, color: COL.B, alpha: sk });
        arrow(ctx, x, 690, x, 760, {});
        chip(ctx, x, 790, 'out  ({B:B}, {C:C_out}, {F:42}, {T:67})', { markup: true, size: 22, mono: true, align: 'center' });
        wrap(ctx, 'The skip path lets the block learn a correction on top of its input.', 1150, 400, 640, 44, { size: 30, alpha: S.p(0, 0.6, 4) });
        ctx.restore();
      }
      const Bv = S.vis(1, 2);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        CH.forEach(([ci, co], i) => {
          const a = S.p(1, 0.4, 1 + i * 1.3), y = 200 + i * 105;
          ctx.globalAlpha = Bv * a;
          rrect(ctx, 200, y, 1520, 80, 12, COL.panel, co === 64 ? rgba(COL.C, 0.6) : COL.line, 2);
          txt(ctx, 'block ' + (i + 1), 240, y + 50, { size: 28, weight: 700 });
          mtxt(ctx, `{C:${ci}} → {C:${co}}`, 520, y + 50, { size: 30, mono: true });
          mtxt(ctx, `({B:B}, {C:${co}}, {F:42}, {T:67})`, 1680, y + 50, { size: 28, mono: true, align: 'right', color: COL.dim });
          if (ci !== co) txt(ctx, 'skip: conv 1×3', 820, y + 50, { size: 22, color: COL.B, weight: 600 });
          for (let k = 0; k < Math.min(8, co / 8); k++) rrect(ctx, 1080 + k * 22, y + 16 + (k % 2) * 0, 16, 48, 3, rgba(COL.C, 0.5), null);
        });
        ctx.restore();
      }
      const Q = S.vis(2, 3);
      if (Q > 0) {
        ctx.save(); ctx.globalAlpha = Q;
        rrect(ctx, 200, 220, 1520, 420, 16, '#0d1320', COL.line, 2);
        const L = [['def forward(self, x):', COL.text], ['    identity = x', COL.text], ['    out = self.bn1(x)', COL.faint], ['    out = self.selu(out)          # computed ...', COL.faint],
          ['    out = self.conv1(x)           # ... but conv1 reads x, not out', COL.K], ['    out = self.bn2(out); out = self.selu(out)', COL.text], ['    out = self.conv2(out)', COL.text], ['    out += identity (or conv_downsample(identity))', COL.text]];
        L.forEach(([s, c], i) => txt(ctx, s, 250, 280 + i * 46, { size: 26, mono: true, color: c, alpha: S.p(2, 0.3, 0.5 + i * 0.4) }));
        const h = S.p(2, 0.6, 5);
        ctx.globalAlpha = Q * h;
        rrect(ctx, 236, 280 + 4 * 46 - 32, 1080, 44, 8, null, COL.K, 3);
        txt(ctx, 'same in the original AASIST code · harmless · just remember it when reading', W / 2, 720, { size: 28, weight: 600, align: 'center', color: COL.dim });
        ctx.restore();
      }
      const R = S.p(3);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R;
        mtxt(ctx, 'encoder out → first_bn1 (BatchNorm2d(64)) → SELU → ({B:B}, {C:64}, {F:42}, {T:67})', W / 2, 250, { size: 28, mono: true, align: 'center' });
        const parts = [['encoder (6 blocks)', 211072, COL.C], ['LL 1024→128', 131200, COL.K], ['HS-GAL ×4', 59264, COL.H], ['GAT ×2', 25344, COL.N], ['attention convs', 16832, COL.F], ['other', 3530, COL.dim]];
        let x = 160; const tot = 447242, w = 1600;
        parts.forEach((p, i) => {
          const ww = w * p[1] / tot, a = S.p(3, 0.4, 2 + i * 0.6);
          ctx.globalAlpha = R * a;
          rrect(ctx, x, 420, ww - 3, 110, 6, rgba(p[2], 0.35), p[2], 2);
          if (ww > 150) { txt(ctx, p[0], x + 14, 465, { size: 22, weight: 700, color: p[2] }); txt(ctx, fmtInt(p[1]), x + 14, 505, { size: 20, mono: true, color: COL.dim }); }
          x += ww;
        });
        ctx.globalAlpha = R * S.p(3, 0.6, 6);
        txt(ctx, 'GAT ×2 25,344 · attention convs 16,832 · pools, BN, pos_S, masters, out 3,530', W / 2, 600, { size: 22, align: 'center', color: COL.dim });
        txt(ctx, 'back-end total 447,242', W / 2, 700, { size: 40, weight: 800, align: 'center' });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 6 nodes
  S_.push({
    id: 'a_nodes', chapter: 6, title: 'Two views of one image',
    code: S => S.b === 0 ? 'w = self.attention(x)' : S.b < 3 ? 'e_S = (x * softmax(w, -1)).sum(-1).transpose(1, 2) + pos_S' : S.b === 3 ? 'e_T = (x * softmax(w, -2)).sum(-2).transpose(1, 2)' : 'original: e_S = max(|e|, dim=time)',
    beats: [
      "Now the grid is turned into graph nodes, in two different ways. First, an attention map is computed with two one-by-one convolutions, from sixty-four to one hundred and twenty-eight to sixty-four channels. It has the same shape as the input: B by sixty-four by forty-two by sixty-seven.",
      "For the spectral view, a softmax runs along the time axis: each row of sixty-seven weights sums to one. The features are averaged over time with those weights, so time disappears. B by sixty-four by forty-two.",
      "Transpose, and you get forty-two spectral nodes, each described by sixty-four numbers. A learned positional embedding, of shape one by forty-two by sixty-four, is added, so every node knows which row it came from.",
      "For the temporal view, the softmax runs along the feature axis instead, and the weighted sum removes that axis. B by sixty-four by sixty-seven. Transposed, that's sixty-seven temporal nodes, one for every three frames, each with sixty-four numbers.",
      "The original AASIST, which reads raw audio, doesn't learn these weights. It simply takes the largest absolute value along each axis. SSL-AASIST replaced that max with learned attention.",
    ],
    hud: S => ({ stage: 4, shape: [SHP.enc, '({B:B}, {C:64}, {F:42})', SHP.eS, SHP.eT, SHP.eS][S.b] }),
    draw(ctx, S) {
      const gx = 160, gy = 250, R = 12, Cc = 22, cs = 24;
      const grid = (a, hlRow, hlCol, seed = 351) => {
        ctx.save(); ctx.globalAlpha *= a;
        for (let k = 3; k >= 1; k--) rrect(ctx, gx + k * 12, gy - k * 12, Cc * cs, R * cs, 6, COL.bg2, rgba(COL.C, 0.4), 1.5);
        cells(ctx, gx, gy, R, Cc, cs, cs, (r, c) => vcol(noise(r, c, seed) * 0.9, 0.9), 2);
        dimLeft(ctx, gx - 6, gy, R * cs, '{F:42}', COL.F, 24); dimBottom(ctx, gx, gy + R * cs + 6, Cc * cs, '{T:67}', COL.T, 24);
        txt(ctx, '× 64 channels', gx + Cc * cs + 50, gy - 20, { size: 20, color: COL.C, weight: 700 });
        if (hlRow != null) rrect(ctx, gx - 3, gy + hlRow * cs - 3, Cc * cs + 6, cs + 6, 5, null, COL.K, 3);
        if (hlCol != null) rrect(ctx, gx + hlCol * cs - 3, gy - 3, cs + 6, R * cs + 6, 5, null, COL.K, 3);
        ctx.restore();
      };
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        grid(1);
        txt(ctx, 'x', gx + Cc * cs / 2, gy - 60, { size: 30, weight: 800, align: 'center' });
        arrow(ctx, 760, 400, 860, 400, {});
        box(ctx, 870, 330, 330, 140, ['1×1 conv 64→128', 'SELU · BN · 1×1 conv 128→64'], { size: 24, color: COL.F });
        arrow(ctx, 1210, 400, 1300, 400, {});
        ctx.save(); ctx.translate(1180, 0);
        cells(ctx, gx, gy, R, Cc, cs * 0.8, cs, (r, c) => scol(0.2 + 0.7 * Math.abs(noise(r, c, 352))), 2);
        ctx.restore();
        txt(ctx, 'w (same shape)', 1340 + Cc * cs * 0.4, gy - 20, { size: 24, weight: 700, align: 'center' });
        mtxt(ctx, 'x, w: ({B:B}, {C:64}, {F:42}, {T:67})', W / 2, 700, { size: 32, mono: true, align: 'center', alpha: S.p(0, 0.6, 6) });
        ctx.restore();
      }
      const Sv = S.vis(1, 3);
      if (Sv > 0) {
        ctx.save(); ctx.globalAlpha = Sv;
        const hr = Math.floor(S.l(1, 5, 1) * R) % R;
        grid(1, hr, null);
        txt(ctx, 'softmax along time →', gx + Cc * cs / 2, gy - 60, { size: 26, weight: 700, align: 'center', color: COL.K });
        const col = easeIO(S.l(1, 1.2, 5));
        const cx = lerp(gx + Cc * cs + 100, 900, 1);
        arrow(ctx, gx + Cc * cs + 30, gy + R * cs / 2, 860, gy + R * cs / 2, { color: COL.K, alpha: col });
        cells(ctx, 900, gy, R, 1, cs * 1.4, cs, (r) => vcol(noise(r, 9, 353), 0.95), 2);
        txt(ctx, 'Σₜ w·x', 920, gy + R * cs + 100, { size: 22, weight: 700, color: COL.K, align: 'center', alpha: col });
        mtxt(ctx, '({B:B}, {C:64}, {F:42})', 920, gy + R * cs + 60, { size: 24, mono: true, align: 'center', alpha: col });
        // nodes
        const nd = S.p(2, 0.8, 0.5);
        if (nd > 0) {
          ctx.globalAlpha = Sv * nd;
          arrow(ctx, 960, gy + R * cs / 2, 1080, gy + R * cs / 2, { color: COL.N });
          txt(ctx, 'transpose', 1020, gy + R * cs / 2 - 16, { size: 20, align: 'center', color: COL.N });
          for (let i = 0; i < 12; i++) {
            const y = gy + i * cs + cs / 2;
            node(ctx, 1120, y, 10, COL.F, 1);
            cells(ctx, 1145, y - 8, 1, 16, 14, 16, (r, c) => vcol(noise(i, c, 354), 0.9), 2);
          }
          txt(ctx, '42 spectral nodes × 64', 1250, gy + R * cs + 50, { size: 24, weight: 700, color: COL.F, align: 'center' });
          const ps = S.p(2, 0.6, 5);
          ctx.globalAlpha = Sv * ps;
          txt(ctx, '+ pos_S (1, 42, 64)', 1500, gy + R * cs / 2, { size: 24, weight: 700, color: COL.N, mono: true });
          mtxt(ctx, 'e_S: ({B:B}, {F:42}, {C:64})', W / 2, 820, { size: 34, mono: true, align: 'center' });
        }
        ctx.restore();
      }
      const Tv = S.vis(3, 4);
      if (Tv > 0) {
        ctx.save(); ctx.globalAlpha = Tv;
        const hc = Math.floor(S.l(3, 5, 0.5) * Cc) % Cc;
        grid(1, null, hc);
        txt(ctx, 'softmax along F ↓', gx + Cc * cs / 2, gy - 60, { size: 26, weight: 700, align: 'center', color: COL.K });
        const col = S.p(3, 0.8, 4);
        ctx.globalAlpha = Tv * col;
        arrow(ctx, gx + Cc * cs / 2, gy + R * cs + 50, gx + Cc * cs / 2, gy + R * cs + 110, { color: COL.K });
        cells(ctx, gx, gy + R * cs + 120, 1, Cc, cs, cs * 1.3, (r, c) => vcol(noise(c, 9, 355), 0.95), 2);
        mtxt(ctx, '({B:B}, {C:64}, {T:67})', gx + Cc * cs + 30, gy + R * cs + 150, { size: 24, mono: true });
        const nd = S.p(3, 0.8, 8);
        ctx.globalAlpha = Tv * nd;
        for (let i = 0; i < 22; i++) node(ctx, 1000 + (i % 11) * 70, 360 + Math.floor(i / 11) * 90, 16, COL.T, 1);
        txt(ctx, '67 temporal nodes × 64', 1350, 560, { size: 26, weight: 700, color: COL.T, align: 'center' });
        mtxt(ctx, 'e_T: ({B:B}, {T:67}, {C:64})', W / 2, 820, { size: 34, mono: true, align: 'center' });
        ctx.restore();
      }
      const O = S.p(4);
      if (O > 0) {
        ctx.save(); ctx.globalAlpha = O;
        rrect(ctx, 200, 250, 700, 420, 16, COL.panel, COL.line, 2);
        rrect(ctx, 1020, 250, 700, 420, 16, COL.panel, rgba(COL.A, 0.6), 2);
        txt(ctx, 'original AASIST', 550, 310, { size: 30, weight: 800, align: 'center' });
        txt(ctx, 'SSL-AASIST', 1370, 310, { size: 30, weight: 800, align: 'center', color: COL.A });
        txt(ctx, 'e_S = max |e| over time', 550, 420, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'e_T = max |e| over F', 550, 480, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'fixed, nothing learned', 550, 580, { size: 24, color: COL.dim, align: 'center' });
        txt(ctx, 'e_S = Σ softmaxₜ(w) · x', 1370, 420, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'e_T = Σ softmax_F(w) · x', 1370, 480, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'learned weights (16,832 params)', 1370, 580, { size: 24, color: COL.dim, align: 'center' });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 7 GAT
  const gNodes = 8, gR = 190, gcx = 520, gcy = 520;
  const gPos = i => [gcx + gR * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / gNodes), gcy + gR * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / gNodes)];
  S_.push({
    id: 'a_gat', chapter: 7, title: 'Graph attention from scratch',
    code: S => S.b < 4 ? 'GraphAttentionLayer._derive_att_map' : 'GraphAttentionLayer._project',
    beats: [
      "What's a graph? A set of nodes, and connections between them. AASIST treats each set of nodes as fully connected: every node may exchange information with every other node.",
      "Graph attention decides how much each connection matters, and AASIST does it in an unusual way. For every pair of nodes, i and j, it multiplies their two vectors element by element. For forty-two nodes, that's a tensor of B, by forty-two, by forty-two, by sixty-four.",
      "Each of those pair vectors goes through a linear layer and a tanh, and a dot product with a learned vector turns it into a single score. The scores form a forty-two by forty-two map.",
      "The scores are divided by a temperature, which is two here, and a softmax across the node axis turns them into weights. A higher temperature makes the weights more even; a lower one makes them sharper.",
      "Each node's output is the weighted sum of all nodes, passed through one linear layer, plus the node's own vector passed through a second linear layer. Then batch norm and SELU. Forty-two nodes in, forty-two nodes out, sixty-four numbers each.",
      "The temporal nodes get their own graph attention layer, with exactly the same recipe: B by sixty-seven by sixty-four, in and out.",
    ],
    hud: S => ({ stage: 5, shape: [SHP.eS, '({B:B}, {F:42}, {F:42}, {C:64})', '({B:B}, {F:42}, {F:42}, {K:1})', '({B:B}, {F:42}, {F:42}, {K:1})', SHP.eS, SHP.eT][S.b] }),
    draw(ctx, S) {
      const A = S.vis(0, 4);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const hi = S.b >= 1 ? [1, 5] : null;
        for (let i = 0; i < gNodes; i++) for (let j = i + 1; j < gNodes; j++) {
          const [x1, y1] = gPos(i), [x2, y2] = gPos(j);
          const isHi = hi && ((i === hi[0] && j === hi[1]));
          const wgt = S.b >= 3 ? 0.15 + 0.85 * Math.abs(noise(i, j, 371)) : 0.35;
          line(ctx, x1, y1, x2, y2, isHi ? COL.K : rgba(COL.H, wgt * S.p(0, 1, 1.5)), isHi ? 4 : 1 + 3 * (S.b >= 3 ? wgt : 0));
        }
        for (let i = 0; i < gNodes; i++) { const [x, y] = gPos(i); node(ctx, x, y, 26, COL.F, 1, String(i + 1)); }
        txt(ctx, 'fully connected: every pair of nodes', gcx, 800, { size: 24, color: COL.dim, align: 'center' });
        ctx.restore();
      }
      const Pm = S.vis(1, 2);
      if (Pm > 0) {
        ctx.save(); ctx.globalAlpha = Pm;
        const vi = [0.8, -0.3, 0.5, 0.9, -0.6, 0.2], vj = [0.4, 0.7, -0.5, 0.6, -0.2, 0.9];
        txt(ctx, 'node 2', 1000, 290, { size: 22, weight: 700, color: COL.F });
        numRow(ctx, 1100, 262, vi, 80, 46, { size: 18, d: 1 });
        txt(ctx, 'node 6', 1000, 350, { size: 22, weight: 700, color: COL.F });
        numRow(ctx, 1100, 322, vj, 80, 46, { size: 18, d: 1 });
        txt(ctx, '⊙', 1080, 420, { size: 34, color: COL.K, align: 'center' });
        numRow(ctx, 1100, 400, vi.map((v, k) => v * vj[k]), 80, 46, { size: 18, d: 2, stroke: COL.K });
        txt(ctx, 'pair vector (64 numbers)', 1340, 490, { size: 22, color: COL.K, align: 'center' });
        mtxt(ctx, 'all pairs: ({B:B}, {F:42}, {F:42}, {C:64})', 1340, 600, { size: 30, mono: true, align: 'center', alpha: S.p(1, 0.6, 7) });
        txt(ctx, 'x.unsqueeze(2) * x.unsqueeze(1)', 1340, 660, { size: 22, mono: true, align: 'center', color: COL.dim, alpha: S.p(1, 0.6, 9) });
        ctx.restore();
      }
      const Sc = S.vis(2, 4);
      if (Sc > 0) {
        ctx.save(); ctx.globalAlpha = Sc;
        const sym = (i, j) => 0.5 + 0.5 * Math.tanh(1.6 * (noise(Math.min(i, j), Math.max(i, j), 372) + (i === j ? 0.8 : 0)));
        txt(ctx, 'tanh(Linear 64→64) · a  →  score', 1340, 250, { size: 26, mono: true, align: 'center' });
        const soft = easeIO(S.l(3, 1, 4));
        const f = (i, j) => { const v = sym(i, j); return soft > 0 ? lerp(v, 0.15 + 0.85 * Math.pow(v, 3 - 1.5 * soft), soft) : v; };
        heatF(ctx, 1110, 300, 460, 42, f, 1);
        dimLeft(ctx, 1104, 300, 460, '{F:42}', COL.F, 22); dimBottom(ctx, 1110, 766, 460, '{F:42}', COL.F, 22);
        if (S.b >= 3) {
          ctx.globalAlpha = Sc * S.p(3, 0.6, 1);
          txt(ctx, 'softmax( score / temperature )', 1340, 860, { size: 26, mono: true, align: 'center', color: COL.K });
          txt(ctx, 'GAT: T = 2   ·   HS-GAL: T = 100 (softer)', 1340, 905, { size: 22, align: 'center', color: COL.dim });
        }
        ctx.restore();
      }
      const O = S.vis(4, 5);
      if (O > 0) {
        ctx.save(); ctx.globalAlpha = O;
        mtxt(ctx, 'out = W₁ (A · X)  +  W₂ X', W / 2, 260, { size: 44, mono: true, align: 'center', weight: 600 });
        txt(ctx, 'proj_with_att                proj_without_att', W / 2 + 20, 310, { size: 22, mono: true, align: 'center', color: COL.dim });
        mat(ctx, 240, 420, 100, 300, { rows: 14, cols: 5, seed: 381, left: ['{F:42}', COL.F], top: ['{C:64}', COL.C], title: 'X' });
        txt(ctx, 'A·X: every node = weighted sum of all nodes', 420, 500, { size: 26 });
        txt(ctx, '+ its own vector (separate weights)', 420, 550, { size: 26 });
        txt(ctx, '→ BatchNorm1d(64) → SELU', 420, 600, { size: 26, color: COL.A });
        mat(ctx, 1320, 420, 100, 300, { rows: 14, cols: 5, seed: 382, left: ['{F:42}', COL.F], top: ['{C:64}', COL.C], title: 'out' });
        mtxt(ctx, '({B:B}, {F:42}, {C:64})  →  ({B:B}, {F:42}, {C:64})      12,672 params', W / 2, 850, { size: 28, mono: true, align: 'center', alpha: S.p(4, 0.6, 8) });
        ctx.restore();
      }
      const T = S.p(5);
      if (T > 0) {
        ctx.save(); ctx.globalAlpha = T;
        box(ctx, 260, 300, 600, 180, ['GAT_layer_S', 'spectral: (B, 42, 64) → (B, 42, 64)'], { size: 32, color: COL.F });
        box(ctx, 1060, 300, 600, 180, ['GAT_layer_T', 'temporal: (B, 67, 64) → (B, 67, 64)'], { size: 32, color: COL.T });
        txt(ctx, 'same design, separate weights, temperature 2', W / 2, 620, { size: 30, align: 'center', color: COL.dim });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 8 graph pooling
  const PS = Array.from({ length: 14 }, (_, i) => 0.5 + 0.48 * noise(i, 3, 391));
  S_.push({
    id: 'a_pool', chapter: 8, title: 'Graph pooling',
    code: 'GraphPool: sigmoid(proj(h)) → topk',
    beats: [
      "Not every node is useful, so graph pooling keeps only the best ones. A linear layer gives each node a single score, and a sigmoid squashes it between zero and one.",
      "The top half of the nodes by score are kept, and each kept node is multiplied by its score. Forty-two spectral nodes become twenty-one. Sixty-seven temporal nodes become thirty-three, because the count is rounded down.",
      "So now we hold B by twenty-one by sixty-four spectral nodes, and B by thirty-three by sixty-four temporal nodes.",
    ],
    hud: S => ({ stage: 5, shape: S.b === 0 ? SHP.eS : '({B:B}, {F:21}, {C:64})' }),
    draw(ctx, S) {
      const n = 14, gap = 110, x0 = (W - (n - 1) * gap) / 2, y = 480;
      const order = PS.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map(p => p[1]);
      const keep = new Set(order.slice(0, n / 2));
      const t = easeIO(S.l(1, 1.4, 2));
      let k = 0;
      for (let i = 0; i < n; i++) {
        const kept = keep.has(i);
        const tx = kept ? x0 + (k++) * gap + (n / 2) * gap / 2 : x0 + i * gap;
        const x = lerp(x0 + i * gap, tx, kept ? t : 0), a = kept ? 1 : 1 - t;
        node(ctx, x, y, 30, COL.F, a * S.p(0, 0.5, i * 0.08));
        const sa = S.p(0, 0.5, 2 + i * 0.1) * a;
        if (sa > 0) {
          ctx.save(); ctx.globalAlpha = sa;
          rrect(ctx, x - 16, y + 50, 32, 150, 5, COL.panel, COL.line, 1);
          rrect(ctx, x - 16, y + 200 - 150 * PS[i], 32, 150 * PS[i], 5, kept && S.b >= 1 ? COL.K : rgba(COL.dim, 0.7), null);
          txt(ctx, PS[i].toFixed(2), x, y + 235, { size: 18, mono: true, align: 'center', color: COL.dim });
          ctx.restore();
        }
      }
      txt(ctx, 'score = sigmoid(Linear 64→1 (node))', W / 2, 300, { size: 30, mono: true, align: 'center', alpha: S.p(0, 0.6, 2) });
      const c = S.p(1, 0.6, 5);
      if (c > 0) {
        mtxt(ctx, 'keep ⌊ N · 0.5 ⌋:   {F:42} → {F:21}     {T:67} → {T:33}', W / 2, 820, { size: 34, mono: true, align: 'center', alpha: c });
        txt(ctx, 'kept nodes are multiplied by their score (so the scorer gets gradients)', W / 2, 870, { size: 22, align: 'center', color: COL.dim, alpha: c });
      }
      const d = S.p(2, 0.6, 0.5);
      if (d > 0) mtxt(ctx, 'out_S ({B:B}, {F:21}, {C:64})      out_T ({B:B}, {T:33}, {C:64})', W / 2, 930, { size: 30, mono: true, align: 'center', alpha: d });
    },
  });

  // ------------------------------------------------------------------ 9 HS-GAL
  S_.push({
    id: 'a_hsgal', chapter: 9, title: 'Heterogeneous graph attention (HS-GAL)',
    code: 'HtrgGraphAttentionLayer(64 → 32, temperature=100)',
    beats: [
      "Now the two views meet. The heterogeneous stacking graph attention layer, H S G A L, puts the spectral and temporal nodes into one graph.",
      "Each type is first projected with its own linear layer, and the two sets are stacked along the node axis. Thirty-three temporal nodes plus twenty-one spectral nodes is fifty-four nodes: B by fifty-four by sixty-four.",
      "The attention map is now fifty-four by fifty-four, and it's split into blocks: temporal with temporal, spectral with spectral, and the cross-type blocks between them. Each block type gets its own learned scoring vector, so the layer can weigh same-type and cross-type connections differently. The temperature here is one hundred, which keeps the weights soft.",
      "There's also a master node: a learned vector of sixty-four numbers that attends to all fifty-four nodes and collects a summary of the whole graph.",
      "The layer projects everything down to thirty-two numbers per node, and splits the stack back apart: B by thirty-three by thirty-two temporal nodes, B by twenty-one by thirty-two spectral nodes, and a master of B by one by thirty-two.",
    ],
    hud: S => ({ stage: 6, shape: ['({B:B}, {T:33}, {C:64}) + ({B:B}, {F:21}, {C:64})', '({B:B}, {N:54}, {C:64})', '({B:B}, {N:54}, {N:54}, {K:1})', 'master ({B:1}, 1, {C:64})', '({B:B}, {T:33}, {C:32}) · ({B:B}, {F:21}, {C:32})'][S.b] }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const mg = easeIO(S.l(1, 1.4, 3));
        for (let i = 0; i < 11; i++) node(ctx, lerp(260 + (i % 6) * 70, 200 + i * 44, mg), lerp(360 + Math.floor(i / 6) * 80, 600, mg), 20, COL.T, 1);
        for (let i = 0; i < 7; i++) node(ctx, lerp(1250 + (i % 4) * 70, 200 + (11 + i) * 44 + 30, mg), lerp(360 + Math.floor(i / 4) * 80, 600, mg), 20, COL.F, 1);
        ctx.globalAlpha = A * (1 - mg);
        txt(ctx, 'temporal nodes (33 × 64)', 440, 290, { size: 26, weight: 700, color: COL.T, align: 'center' });
        txt(ctx, 'spectral nodes (21 × 64)', 1350, 290, { size: 26, weight: 700, color: COL.F, align: 'center' });
        ctx.globalAlpha = A * mg;
        brace(ctx, 180, 1030, 640, COL.N, true);
        mtxt(ctx, 'proj_type1(T) ‖ proj_type2(S)  →  ({B:B}, {N:54}, {C:64})', 605, 720, { size: 28, mono: true, align: 'center' });
        txt(ctx, '33 temporal + 21 spectral = 54 nodes', 605, 770, { size: 24, color: COL.dim, align: 'center' });
        ctx.restore();
      }
      const M = S.vis(2, 3);
      if (M > 0) {
        ctx.save(); ctx.globalAlpha = M;
        const x = 260, y = 230, sz = 560, n1 = 33, n = 54, cs = sz / n;
        cells(ctx, x, y, n, n, cs, cs, (i, j) => {
          const tt = i < n1 && j < n1, ss = i >= n1 && j >= n1;
          const base = tt ? COL.T : ss ? COL.F : COL.N;
          return rgba(base, 0.25 + 0.5 * Math.abs(noise(Math.min(i, j), Math.max(i, j), 401)));
        }, 0);
        rrect(ctx, x - 3, y - 3, sz + 6, sz + 6, 6, null, COL.line, 2);
        line(ctx, x + n1 * cs, y, x + n1 * cs, y + sz, COL.text, 2); line(ctx, x, y + n1 * cs, x + sz, y + n1 * cs, COL.text, 2);
        dimLeft(ctx, x - 6, y, n1 * cs, '{T:33}', COL.T, 22); dimLeft(ctx, x - 6, y + n1 * cs, (n - n1) * cs, '{F:21}', COL.F, 22);
        const lab = [['att_weight11', 'T–T', COL.T, 1060, 320], ['att_weight22', 'S–S', COL.F, 1060, 420], ['att_weight12', 'T–S and S–T', COL.N, 1060, 520]];
        lab.forEach((l, i) => {
          const a = S.p(2, 0.5, 3 + i * 1.5);
          rrect(ctx, l[3], l[4] - 34, 50, 50, 8, rgba(l[2], 0.5 * a), l[2], 2);
          mtxt(ctx, `${l[1]}:  ${l[0]}  (32 → 1)`, l[3] + 70, l[4], { size: 26, alpha: a });
        });
        txt(ctx, 'softmax(score / 100) → soft, spread-out weights', 1060, 660, { size: 26, color: COL.K, alpha: S.p(2, 0.6, 12) });
        ctx.restore();
      }
      const Ms = S.vis(3, 4);
      if (Ms > 0) {
        ctx.save(); ctx.globalAlpha = Ms;
        const cx = 960, cy = 520;
        for (let i = 0; i < 18; i++) {
          const ang = -Math.PI / 2 + i * 2 * Math.PI / 18, x = cx + 360 * Math.cos(ang), y = cy + 280 * Math.sin(ang);
          const a = S.p(3, 0.3, 1 + i * 0.12);
          line(ctx, x, y, cx, cy, rgba(COL.H, 0.5 * a), 2);
          node(ctx, x, y, 18, i < 11 ? COL.T : COL.F, 1);
        }
        ctx.fillStyle = rgba(COL.H, 0.35); ctx.strokeStyle = COL.H; ctx.lineWidth = 4;
        ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 22 : 50, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } ctx.closePath(); ctx.fill(); ctx.stroke();
        txt(ctx, 'master node', cx, cy + 90, { size: 26, weight: 800, align: 'center', color: COL.H });
        txt(ctx, 'learned (1, 1, 64) → attends to all 54 nodes', cx, 900, { size: 26, align: 'center', color: COL.dim });
        ctx.restore();
      }
      const O = S.p(4);
      if (O > 0) {
        ctx.save(); ctx.globalAlpha = O;
        mat(ctx, 260, 330, 90, 420, { rows: 18, cols: 3, seed: 411, left: ['{N:54}', COL.N], top: ['{C:64}', COL.C], title: 'in' });
        arrow(ctx, 400, 540, 560, 540, { color: COL.H });
        box(ctx, 570, 470, 300, 140, ['W₁(A·X) + W₂X', '→ BN → SELU (64 → 32)'], { size: 26, color: COL.H });
        arrow(ctx, 880, 540, 1000, 540, { color: COL.H });
        mat(ctx, 1040, 330, 60, 420 * 33 / 54, { rows: 11, cols: 2, seed: 412, stroke: COL.T, top: ['{C:32}', COL.C] });
        mat(ctx, 1040, 330 + 420 * 33 / 54 + 12, 60, 420 * 21 / 54 - 12, { rows: 7, cols: 2, seed: 413, stroke: COL.F });
        mtxt(ctx, 'temporal  ({B:B}, {T:33}, {C:32})', 1150, 460, { size: 26, mono: true });
        mtxt(ctx, 'spectral  ({B:B}, {F:21}, {C:32})', 1150, 680, { size: 26, mono: true });
        mtxt(ctx, 'master    ({B:B}, 1, {C:32})', 1150, 820, { size: 26, mono: true, alpha: S.p(4, 0.6, 7) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 10 branches
  S_.push({
    id: 'a_branch', chapter: 10, title: 'Two branches, stacked',
    code: 'HtrgGAT_layer_ST11/12 and ST21/22 · torch.max(branch1, branch2)',
    beats: [
      "After the first H S G A L, graph pooling halves the nodes again. Twenty-one spectral nodes become ten, and thirty-three temporal nodes become sixteen.",
      "A second H S G A L, from thirty-two to thirty-two, refines them, and its output is added to its input as a residual. The master node is updated the same way.",
      "This whole path is built twice, as two parallel branches with separate weights and separate master nodes. At the end, the branches are combined with an element-wise maximum. We're left with B by sixteen by thirty-two temporal nodes, B by ten by thirty-two spectral nodes, and a master of B by one by thirty-two.",
    ],
    hud: S => ({ stage: 6, shape: '({B:B}, {T:16}, {C:32}) · ({B:B}, {F:10}, {C:32})' }),
    draw(ctx, S) {
      const row = (y, name, a, glow) => {
        ctx.save(); ctx.globalAlpha *= a;
        const items = [['T 33, S 21', '×64'], ['HS-GAL', '64 → 32'], ['pool', 'T 16, S 10'], ['HS-GAL', '32 → 32, + residual'], ['T 16, S 10', '+ master']];
        items.forEach((it, i) => {
          const x = 180 + i * 280;
          box(ctx, x, y, 230, 110, it, { size: 26, color: i === 1 || i === 3 ? COL.H : COL.text, stroke: glow === i ? COL.A : COL.line, glow: glow === i ? COL.A : null });
          if (i) arrow(ctx, x - 48, y + 55, x - 4, y + 55, { head: 10 });
        });
        txt(ctx, name, 180, y - 18, { size: 22, weight: 700, color: COL.dim });
        ctx.restore();
      };
      const a1 = S.p(0);
      row(250, 'branch 1  (master1)', a1, S.b === 0 ? 2 : S.b === 1 ? 3 : null);
      const a2 = S.p(2, 0.8, 2);
      row(470, 'branch 2  (master2, separate weights)', a2, null);
      if (S.b >= 1) {
        const r = S.p(1, 0.6, 3);
        ctx.save(); ctx.globalAlpha = r * (1 - 0.6 * a2);
        parrow(ctx, [[985, 250], [985, 215], [1290, 215], [1290, 250]], { color: COL.B, lw: 3 });
        txt(ctx, 'out = out + HS-GAL(out)', 1135, 200, { size: 22, color: COL.B, align: 'center', weight: 700 });
        ctx.restore();
      }
      if (a2 > 0) {
        const m = S.p(2, 0.6, 7);
        ctx.save(); ctx.globalAlpha = m;
        arrow(ctx, 1540, 305, 1600, 420, {}); arrow(ctx, 1540, 525, 1600, 470, {});
        box(ctx, 1610, 390, 160, 110, ['max', 'element-wise'], { size: 28, color: COL.K });
        mtxt(ctx, 'out_T ({B:B}, {T:16}, {C:32})    out_S ({B:B}, {F:10}, {C:32})    master ({B:B}, 1, {C:32})', W / 2, 760, { size: 26, mono: true, align: 'center', alpha: S.p(2, 0.6, 10) });
        ctx.restore();
      }
      if (S.b === 0) mtxt(ctx, 'pool ×0.5:  {F:21} → {F:10}     {T:33} → {T:16}', W / 2, 760, { size: 32, mono: true, align: 'center', alpha: S.p(0, 0.6, 3) });
    },
  });

  // ------------------------------------------------------------------ 11 readout
  S_.push({
    id: 'a_readout', chapter: 11, title: 'Readout and training',
    code: S => S.b < 2 ? 'torch.cat([T_max, T_avg, S_max, S_avg, master])' : 'self.out_layer = nn.Linear(160, 2)',
    beats: [
      "The readout turns sets of nodes into one fixed-size vector. For the temporal nodes, take the largest absolute value over the nodes, and the mean over the nodes. That's two vectors of thirty-two.",
      "Do the same for the spectral nodes, and add the master node. Five vectors of thirty-two, concatenated: B by one hundred and sixty.",
      "After dropout, a linear layer maps one hundred and sixty to two logits: B by two. Class zero is spoof, and class one is bona fide. Training uses cross-entropy, weighted point one for spoof and point nine for bona fide, with Adam, a learning rate of one in a million, and batches of fourteen clips.",
      "Notice that the node counts never reach the classifier. Max and mean remove the node axis, so the readout always produces one hundred and sixty numbers, however many nodes survived pooling.",
    ],
    hud: S => ({ stage: 7, shape: ['({B:B}, {C:32}) × 2', '({B:B}, {C:160})', '({B:B}, {K:2})', '({B:B}, {K:2})'][S.b] }),
    draw(ctx, S) {
      const A = S.p(0);
      ctx.save(); ctx.globalAlpha = A;
      mat(ctx, 200, 260, 160, 256, { rows: 16, cols: 10, seed: 421, left: ['{T:16}', COL.T], top: ['{C:32}', COL.C], title: 'out_T' });
      arrow(ctx, 380, 330, 480, 330, {}); arrow(ctx, 380, 450, 480, 450, {});
      txt(ctx, 'max |·| over nodes', 500, 320, { size: 22, mono: true }); txt(ctx, 'mean over nodes', 500, 440, { size: 22, mono: true });
      ctx.restore();
      const segs = [['T_max', COL.T], ['T_avg', COL.T], ['S_max', COL.F], ['S_avg', COL.F], ['master', COL.H]];
      segs.forEach((sg, i) => {
        const a = i < 2 ? S.p(0, 0.5, 2 + i) : S.p(1, 0.5, 0.5 + (i - 2) * 1.2);
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a;
        const x = 200 + i * 300;
        rrect(ctx, x, 600, 290, 60, 8, rgba(sg[1], 0.3), sg[1], 2);
        txt(ctx, sg[0], x + 145, 638, { size: 24, weight: 700, align: 'center', color: sg[1] });
        txt(ctx, '32', x + 145, 690, { size: 20, mono: true, align: 'center', color: COL.dim });
        ctx.restore();
      });
      const c = S.p(1, 0.6, 6);
      if (c > 0) { ctx.save(); ctx.globalAlpha = c; dimBottom(ctx, 200, 700, 1490, 'concat → {C:160}', COL.C, 26); ctx.restore(); }
      const h = S.p(2);
      if (h > 0) {
        ctx.save(); ctx.globalAlpha = h;
        rrect(ctx, 1000, 220, 800, 330, 14, 'rgba(10,14,22,0.96)', COL.line, 2);
        txt(ctx, 'dropout(0.5) → Linear 160 → 2', 1040, 280, { size: 26, mono: true });
        [['spoof (0)', 0.12, COL.R], ['bona fide (1)', 0.88, COL.B]].forEach((p, i) => {
          const y = 320 + i * 60;
          rrect(ctx, 1040, y, 420, 40, 6, COL.panel, COL.line, 1);
          rrect(ctx, 1040, y, 420 * p[1] * S.p(2, 0.8, 2), 40, 6, rgba(p[2], 0.8), null);
          txt(ctx, `${p[0]}  ${p[1].toFixed(2)}`, 1480, y + 28, { size: 22, weight: 700, color: p[2] });
        });
        txt(ctx, 'CE loss, class weights [0.1, 0.9]', 1040, 470, { size: 24, alpha: S.p(2, 0.6, 5) });
        txt(ctx, 'Adam · lr 1e-6 · batch 14 · RawBoost augmentation', 1040, 515, { size: 22, color: COL.dim, alpha: S.p(2, 0.6, 7) });
        ctx.restore();
      }
      const d = S.p(3, 0.6, 1);
      if (d > 0) txt(ctx, 'max and mean remove the node axis → always 160 numbers', W / 2, 860, { size: 32, weight: 700, align: 'center', color: COL.A, alpha: d });
    },
  });

  // ------------------------------------------------------------------ 12 original AASIST
  S_.push({
    id: 'a_orig', chapter: 12, title: 'The original AASIST, for comparison',
    code: 'refs/aasist/models/AASIST.py',
    beats: [
      "For comparison, here's the original AASIST, which reads raw audio directly. Its first layer is a sinc convolution: seventy band-pass filters, each one hundred and twenty-nine samples long, applied to the waveform. That gives B by seventy by sixty-four thousand four hundred and seventy-two.",
      "The absolute value and a three by three max pool give B by one by twenty-three by twenty-one thousand four hundred and ninety. Here the height really is frequency: seventy filter bands, pooled down to twenty-three.",
      "Its residual blocks each end with a max pool that divides the width by three. So the time axis shrinks from twenty-one thousand four hundred and ninety, to seven thousand one hundred and sixty-three, and on down to twenty-nine. The encoder output is B by sixty-four by twenty-three by twenty-nine.",
      "From there, the graph part follows the same design, just with fewer nodes: twenty-three spectral and twenty-nine temporal, pooled to eleven and twenty. The whole original model has about two hundred and ninety-eight thousand parameters, and trains from scratch.",
    ],
    hud: S => ({ stage: [0, 2, 3, 5][S.b], shape: ['({B:B}, {C:70}, {T:64472})', '({B:B}, {C:1}, {F:23}, {T:21490})', '({B:B}, {C:64}, {F:23}, {T:29})', '({B:B}, {F:11}, {C:64}) · ({B:B}, {T:20}, {C:64})'][S.b], label: 'original AASIST' }),
    draw(ctx, S) {
      const rows = [
        [0, 'raw waveform', '({B:B}, {T:64600})'],
        [0, 'sinc conv: 70 filters × 129 taps', '({B:B}, {C:70}, {T:64472})'],
        [1, '|·| → max-pool 3×3 → BN → SELU', '({B:B}, {C:1}, {F:23}, {T:21490})'],
        [2, 'block 1 (1→32) + max-pool (1,3)', '({B:B}, {C:32}, {F:23}, {T:7163})'],
        [2, 'blocks 2–6 (each ÷3 in width)', '2387 → 795 → 265 → 88 → {T:29}'],
        [2, 'encoder output', '({B:B}, {C:64}, {F:23}, {T:29})'],
        [3, 'nodes: max |·| over each axis', 'e_S ({B:B}, {F:23}, {C:64})  e_T ({B:B}, {T:29}, {C:64})'],
        [3, 'graph pool (0.5 / 0.7), then as before', '{F:11} and {T:20} nodes → … → ({B:B}, {K:2})'],
      ];
      rows.forEach(([b, a, sh], i) => {
        const al = S.p(b, 0.5, b === 0 ? i * 2 : b === 2 ? (i - 3) * 2.5 : b === 3 ? (i - 6) * 3 : 0.5);
        if (al <= 0) return;
        const y = 220 + i * 84;
        ctx.save(); ctx.globalAlpha = al;
        rrect(ctx, 150, y - 44, 1620, 68, 10, i === 5 ? rgba(COL.A, 0.08) : COL.panel, i === 5 ? COL.A : COL.line, 1.5);
        txt(ctx, a, 180, y, { size: 26, weight: 600 });
        mtxt(ctx, sh, 1740, y, { size: 24, mono: true, align: 'right', color: COL.dim });
        ctx.restore();
      });
      const p = S.p(3, 0.6, 9);
      if (p > 0) txt(ctx, 'original AASIST: 297,866 parameters   ·   SSL-AASIST back-end: 447,242 (+ XLS-R 315M)', W / 2, 930, { size: 26, weight: 700, align: 'center', color: COL.A, alpha: p });
    },
  });

  // ------------------------------------------------------------------ 13 code
  const CODE = [
    ['$ python verify/aasist_shapes.py        # runs the authors\' model.py, XLS-R stubbed', COL.faint, 0],
    ['SSL-AASIST   input (2, 64600)  ->  output (2, 2)', COL.text, 0],
    ['  LL                  (2, 201, 1024) -> (2, 201, 128)', COL.B, 1],
    ['  first_bn            (2, 1, 42, 67)', COL.B, 1],
    ['  encoder.0 .. 5      (2, 1, 42, 67) -> (2, 32, 42, 67) -> ... -> (2, 64, 42, 67)', COL.B, 1],
    ['  GAT_layer_S / pool_S  (2, 42, 64) -> (2, 42, 64) -> (2, 21, 64)', COL.B, 1],
    ['  GAT_layer_T / pool_T  (2, 67, 64) -> (2, 67, 64) -> (2, 33, 64)', COL.B, 1],
    ['  HtrgGAT_layer_ST11  (2, 33, 64), (2, 21, 64) -> (2, 33, 32), (2, 21, 32), (2, 1, 32)', COL.B, 2],
    ['  pool_hS1 / pool_hT1 (2, 21, 32) -> (2, 10, 32);  (2, 33, 32) -> (2, 16, 32)', COL.B, 2],
    ['  HtrgGAT_layer_ST12  (2, 16, 32), (2, 10, 32) -> same shapes', COL.B, 2],
    ['  out_layer           (2, 160) -> (2, 2)', COL.B, 2],
    ['  back-end parameters (everything except XLS-R): 447,242', COL.K, 2],
  ];
  S_.push({
    id: 'a_code', chapter: 13, title: 'Checking it in code',
    beats: [
      "Every shape in this video comes from running the authors' own code. Here's the trace, with the X L S R front-end replaced by a random tensor of the right shape, B by two hundred and one by one thousand and twenty-four.",
      "The linear layer, the pooled image, and the six encoder blocks, all as we derived. Then forty-two and sixty-seven nodes, pooled to twenty-one and thirty-three.",
      "The heterogeneous layers, the second pooling to sixteen and ten nodes, and finally one hundred and sixty numbers in, two logits out. The script is in the project folder, in verify, aasist shapes dot py, if you want to poke at it yourself.",
    ],
    hud: { stage: 7, shape: '({B:2}, {K:2})' },
    draw(ctx, S) {
      rrect(ctx, 120, 170, 1680, 780, 18, '#0d1320', COL.line, 2);
      CODE.forEach(([s, c, b], i) => txt(ctx, s, 160, 240 + i * 58, { size: 23, mono: true, color: c, alpha: S.p(b, 0.4, b === 0 ? i * 1.2 : (i - [0, 2, 7][b]) * 1.8 + 0.5) }));
    },
  });

  // ------------------------------------------------------------------ 14 recap
  const RECAP = [
    ['XLS-R output', '64,600 samples → 201 frames', '({B:B}, {T:201}, {C:1024})', 1, 0],
    ['LL', 'Linear 1024 → 128', '({B:B}, {T:201}, {C:128})', 1, 3],
    ['as an image', 'transpose, unsqueeze, max-pool 3×3', '({B:B}, {C:1}, {F:42}, {T:67})', 1, 6],
    ['encoder', '6 residual blocks, kernels 2×3', '({B:B}, {C:64}, {F:42}, {T:67})', 1, 9],
    ['node views', 'attention-weighted sums over T / over F', '{F:42} and {T:67} nodes × {C:64}', 2, 0],
    ['GAT + pool', 'pairwise-product attention, top-k 0.5', '{F:21} and {T:33} nodes × {C:64}', 2, 3],
    ['HS-GAL ×2 branches', '54-node graph + master, pool, residual, max', '{T:16} + {F:10} + 1 nodes × {C:32}', 2, 6],
    ['readout', 'max|·| and mean, + master', '({B:B}, {C:160})', 3, 0],
    ['classifier', 'Linear 160 → 2', '({B:B}, {K:2})', 3, 2],
  ];
  S_.push({
    id: 'a_recap', chapter: 14, title: 'Recap',
    beats: [
      "Let's recap, one line per step.",
      "X L S R gives B by two hundred and one by one thousand and twenty-four. The linear layer shrinks features to one hundred and twenty-eight. Treated as an image and max-pooled, that's forty-two by sixty-seven, and the residual encoder lifts it to sixty-four channels.",
      "Two attention-weighted summaries turn the image into forty-two spectral and sixty-seven temporal nodes. Graph attention and pooling leave twenty-one and thirty-three, and the heterogeneous layers, in two branches, leave sixteen temporal nodes, ten spectral nodes, and a master node, each with thirty-two numbers.",
      "The readout collapses those into one hundred and sixty numbers, and a linear layer gives the two scores.",
      "AASIST's key idea: look at the features along both axes, turn each view into a set of nodes, and let graph attention reason within and across the two views. Next up, a very different back-end: XLSR-MamBo, which replaces all of this with state space models and attention.",
    ],
    hud: null,
    draw(ctx, S) {
      const y0 = 180, lh = 78;
      txt(ctx, 'step', 110, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: S.p(0) });
      txt(ctx, 'what happens', 470, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: S.p(0) });
      txt(ctx, 'shape', 1810, y0 - 30, { size: 22, weight: 700, color: COL.dim, align: 'right', alpha: S.p(0) });
      line(ctx, 100, y0 - 14, 1820, y0 - 14, COL.line, 2);
      RECAP.forEach(([a, b, c, beat, dl], i) => {
        const al = S.p(beat, 0.5, dl);
        if (al <= 0) return;
        const y = y0 + 34 + i * lh;
        txt(ctx, a, 110, y, { size: 27, weight: 700, alpha: al });
        mtxt(ctx, b, 470, y, { size: 23, color: COL.dim, alpha: al });
        mtxt(ctx, c, 1810, y, { size: 26, mono: true, align: 'right', alpha: al, color: COL.dim });
      });
      const f = S.p(4, 0.6, 1);
      if (f > 0) txt(ctx, 'two views → two node sets → graph attention within and across → 160 numbers → 2 scores', W / 2, 960, { size: 28, weight: 700, align: 'center', color: COL.A, alpha: f });
    },
  });
})();
