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
    enc: '({B:B}, {C:64}, {F:42}, {T:67})', eS: '({B:B}, {N:42}, {C:64})', eT: '({B:B}, {N:67}, {C:64})',
    nodes: '({B:B}, {N:42}, {C:64}) · ({B:B}, {N:67}, {C:64})',
  };

  // ------------------------------------------------------------------ 0 intro
  S_.push({
    id: 'a_intro', chapter: 0, title: 'Introduction', noHeader: true,
    beats: [
      "In the previous video we followed X L S R from raw audio to a sequence of context vectors. Now we'll follow those vectors into AASIST, the graph attention back-end used by many of the strongest spoofing detectors.",
      "AASIST was introduced by Jung and colleagues in 2022. Tak and colleagues then put it on top of the X L S R front-end. That combination, usually called SSL-AASIST, is what we'll trace, using the exact shapes from the authors' own code. And it's small: about four hundred and forty-seven thousand parameters.",
      "As before, the bar at the bottom always shows the shape we're holding. [+0.8] There are two new axes this time: teal F, for the feature rows that AASIST treats like frequency, and purple N, for graph nodes.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: SHP.in } : null,
    draw(ctx, S) {
      // cold open: a feature image is read two ways, and each view becomes a set of graph nodes
      const T = S.T(0), x0 = 150, x1 = 1770;
      E.kicker(ctx, 'DEEPFAKE DETECTORS · SHAPE BY SHAPE', x0 + 4, 214, T + 0.9);
      chip(ctx, x0 + 600, 206, 'EPISODE 2 / 3', { size: 20, mono: true, color: E.THEME.a, stroke: rgba(E.THEME.a, 0.6), fill: rgba(E.THEME.a, 0.08), alpha: S.p(0, 0.5, 0.2) });
      E.titleRise(ctx, 'AASIST', x0, 400, T + 0.6, { size: 156 });
      txt(ctx, 'the graph-attention back-end, shape by shape', x0 + 6, 470, { size: 38, weight: 500, color: COL.dim, alpha: S.p(0, 0.9, 0.5) });
      // the size is said in beat 1, so it appears then
      const st = S.ps(1, 3, 0.6, 0.6) * (1 - S.p(2, 0.5, 0.6));
      if (st > 0) {
        E.countUp(ctx, 447, 0, x1, 300, (S.T(1) - S.st(1, 3) - 0.6) * (S.b >= 1 ? 1 : 0), { size: 64, suf: ' K', align: 'right', color: E.THEME.a, alpha: st });
        txt(ctx, 'back-end parameters', x1, 340, { size: 24, weight: 600, color: COL.dim, align: 'right', alpha: st });
      }
      // the image
      const gx = x0, gy = 590, gw = 470, gh = 250;
      mat(ctx, gx, gy, gw, gh, { rows: 18, cols: 34, seed: 31, alpha: S.p(0, 0.9, 0.4), fn: (r, c) => scol(clamp(0.5 + 0.45 * noise(r, c, 31) * Math.exp(-((r - 6) ** 2) / 60)), 0.95) });
      mtxt(ctx, 'inside AASIST: {F:42} rows × {T:67} frames', gx + gw / 2, gy + gh + 46, { size: 24, mono: true, align: 'center', alpha: S.p(0, 0.6, 1.6) });
      // while the legend names F, the grid's rows are marked teal
      const lf = S.ps(2, 1, 0.6, 1.5);
      if (lf > 0) { ctx.save(); ctx.globalAlpha = lf; dimLeft(ctx, gx - 6, gy, gh, '{F:42}', COL.F, 26); for (let r = 0; r < 18; r += 3) rrect(ctx, gx - 2, gy + r * gh / 18, gw + 4, gh / 18, 2, null, rgba(COL.F, 0.7), 1.5); ctx.restore(); }
      // two views -> two node sets
      const NS = 7, NT = 9, sx = 900, tx0 = 1010, ty = 900;
      const spec = Array.from({ length: NS }, (_, i) => [sx, 600 + i * 40]);
      const temp = Array.from({ length: NT }, (_, i) => [tx0 + i * 82, 860]);
      const master = [1420, 690];
      const v1 = S.p(0, 0.7, 3.4), v2 = S.p(0, 0.7, 4.4);
      parrow(ctx, [[gx + gw + 14, 650], [sx - 60, 650]], { color: COL.F, alpha: v1, p: v1 });
      parrow(ctx, [[gx + gw + 14, 800], [tx0 - 42, 800], [tx0 - 42, 845]], { color: COL.T, alpha: v2, p: v2 });
      txt(ctx, 'spectral view', sx - 6, 578, { size: 22, weight: 700, color: COL.F, align: 'center', alpha: v1 });
      txt(ctx, 'temporal view', tx0 + (NT - 1) * 41, 920, { size: 22, weight: 700, color: COL.T, align: 'center', alpha: v2 });
      // edges: within each set, across sets, and to the master node
      const e = S.l(0, 1.6, 6.0), em = S.l(0, 1.2, 7.4);
      if (e > 0) {
        ctx.save(); ctx.lineWidth = 1.4;
        spec.forEach((a, i) => temp.forEach((b, j) => {
          if ((i * 3 + j) % 4) return;
          const k = clamp(e * 1.6 - (i + j) / (NS + NT));
          if (k <= 0) return;
          ctx.strokeStyle = rgba(COL.N, 0.28 * k); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], k), lerp(a[1], b[1], k)); ctx.stroke();
        }));
        ctx.restore();
      }
      if (em > 0) [...spec, ...temp].forEach((a, i) => {
        const k = clamp(em * 1.5 - i / (NS + NT));
        if (k > 0) line(ctx, master[0], master[1], lerp(master[0], a[0], k), lerp(master[1], a[1], k), rgba(COL.K, 0.45 * k), 1.6);
      });
      spec.forEach(([x, y], i) => node(ctx, x, y, 13, COL.F, E.easeOut4((T - 3.9 - i * 0.07) / 0.4)));
      temp.forEach(([x, y], i) => node(ctx, x, y, 13, COL.T, E.easeOut4((T - 4.9 - i * 0.07) / 0.4)));
      // ... and when it names N, every node gets a purple ring: from here on, node counts are purple
      const ln = S.ps(2, 1, 0.6, 5);
      if (ln > 0) [...spec, ...temp].forEach(([x, y]) => { ctx.save(); ctx.globalAlpha = ln; ctx.strokeStyle = COL.N; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 19, 0, 7); ctx.stroke(); ctx.restore(); });

      const mm = E.easeOutBack((T - 7.2) / 0.5, 2);
      if (mm > 0) { node(ctx, master[0], master[1], 24 * mm, COL.K, 1, 'M'); E.glow(ctx, master[0], master[1], 90, COL.K, 0.35 * clamp(mm)); }
      txt(ctx, 'master node', master[0] + 40, master[1] - 30, { size: 22, weight: 700, color: COL.K, alpha: S.p(0, 0.5, 7.6) });
      // where it sits, and who made it
      const out = 1 - S.p(2, 0.5, 0);
      const a1 = S.p(1, 0.8, 1) * out;
      mtxt(ctx, 'waveform  →  {A:XLS-R}  →  {H:AASIST}  →  spoof / bona fide', x0, 996, { size: 32, alpha: a1, weight: 600 });
      txt(ctx, 'Jung et al., ICASSP 2022  ·  Tak et al., Odyssey 2022 (SSL-AASIST)', x1, 996, { size: 24, align: 'right', color: COL.dim, alpha: S.p(1, 0.8, 4) * out });
      const a2 = S.p(2, 0.6, 3);
      if (a2 > 0) {
        [['F', 'feature rows ("spectral")', COL.F], ['N', 'graph nodes', COL.N]].forEach((l, i) => {
          const x = 1330, y = 220 + i * 100, a = S.p(2, 0.6, 3 + i * 1.4);
          rrect(ctx, x, y, 60, 60, 12, rgba(l[2], 0.15 * a), rgba(l[2], a), 3);
          txt(ctx, l[0], x + 30, y + 32, { size: 34, weight: 800, align: 'center', base: 'middle', color: l[2], alpha: a });
          txt(ctx, l[1], x + 80, y + 40, { size: 26, weight: 600, alpha: a });
        });
      }
    },
  });

  // ------------------------------------------------------------------ 1 overview
  // [title, subtitle, shape, colour, stage, thumbnail kind]
  const OV = [
    ['XLS-R output', 'frames × features', SHP.in, COL.A, 0, 'seq'],
    ['Linear', '1024 → 128', SHP.ll, COL.K, 1, 'narrow'],
    ['As an image', 'max-pool 3×3', SHP.pool, COL.F, 2, 'img'],
    ['Encoder', '6 residual blocks', SHP.enc, COL.C, 3, 'stack'],
    ['Two node sets', 'spectral + temporal', '{N:42} + {N:67} nodes', COL.N, 4, 'nodes'],
    ['Graph attention', '2 branches, 2 HS-GAL', '{N:16} + {N:10} + 1', COL.H, 5, 'graph'],
    ['Readout', '160 numbers → Linear', '({B:B}, {K:2})', COL.B, 7, 'out'],
  ];
  const OVHUD = [SHP.in, SHP.ll, SHP.pool, SHP.enc, SHP.nodes, '({B:B}, {N:16}, {C:32}) · ({B:B}, {N:10}, {C:32})', '({B:B}, {K:2})'];
  const ovActive = S => S.b === 0 ? 0 : S.b === 1 ? (S.past(1, 1) ? 2 : 1) : S.b + 1;
  function thumb(ctx, kind, x, y, a, col) {
    ctx.save(); ctx.globalAlpha *= a;
    if (kind === 'seq') cells(ctx, x, y, 8, 6, 15, 11, (r, c) => vcol(noise(r, c, 601) * 0.9, 0.9), 2);
    else if (kind === 'narrow') cells(ctx, x + 30, y, 8, 3, 15, 11, (r, c) => vcol(noise(r, c, 602) * 0.9, 0.9), 2);
    else if (kind === 'img') cells(ctx, x, y + 14, 5, 9, 11, 12, (r, c) => scol(clamp(0.5 + 0.45 * noise(r, c, 603))), 1);
    else if (kind === 'stack') { for (let k = 2; k >= 0; k--) cells(ctx, x + k * 8, y + 18 - k * 8, 5, 8, 11, 11, (r, c) => vcol(noise(r + k, c, 604) * 0.9, 0.85), 1); }
    else if (kind === 'nodes') { for (let i = 0; i < 4; i++) node(ctx, x + 10 + i * 24, y + 20, 8, COL.F); for (let i = 0; i < 5; i++) node(ctx, x + i * 24, y + 64, 8, COL.T); }
    else if (kind === 'graph') {
      const P = Array.from({ length: 6 }, (_, i) => [x + 48 + 40 * Math.cos(i * 1.047), y + 44 + 36 * Math.sin(i * 1.047)]);
      P.forEach((p, i) => P.forEach((q, j) => { if (j > i) line(ctx, p[0], p[1], q[0], q[1], rgba(COL.H, 0.35), 1); }));
      P.forEach(p => node(ctx, p[0], p[1], 7, COL.N)); node(ctx, x + 48, y + 44, 9, COL.K);
    } else if (kind === 'out') {
      cells(ctx, x, y + 10, 1, 10, 10, 18, (r, c) => vcol(noise(c, 1, 605) * 0.9, 0.9), 1);
      rrect(ctx, x + 20, y + 50, 30, 30, 4, rgba(COL.R, 0.7), null); rrect(ctx, x + 56, y + 40, 30, 40, 4, rgba(COL.B, 0.8), null);
    }
    ctx.restore();
  }
  S_.push({
    id: 'a_overview', chapter: 1, title: 'The big picture',
    beats: [
      "Here's the whole back-end. It receives X L S R's output: two hundred and one frames of one thousand and twenty-four numbers each, for a four-second clip.",
      "A linear layer shrinks each frame to one hundred and twenty-eight numbers. Then the back-end does something surprising: it treats that features-by-frames grid as an image, and max-pools it.",
      "A small convolutional encoder, built from six residual blocks, processes that image.",
      "Then the image is summarized twice: once along time, which gives a set of spectral nodes, and once along the feature axis, which gives a set of temporal nodes.",
      "Graph attention lets the nodes exchange information, first within each set, and then across both sets at once, with the help of a master node.",
      "Finally, a readout squeezes everything into one hundred and sixty numbers, and a linear layer produces two scores: spoof, or bona fide. The whole back-end has only about four hundred and forty-seven thousand parameters. That's tiny next to X L S R's three hundred and fifteen million parameters.",
    ],
    hud: S => { const k = ovActive(S); return { stage: OV[k][4], shape: OVHUD[k] }; },
    draw(ctx, S) {
      // two rows of boxes: the first four, then (after a return path) the last three
      const bw = 380, bh = 150, gap = 50, x0 = 125;
      const pos = i => i < 4 ? [x0 + i * (bw + gap), 190] : [x0 + (i - 4) * (bw + gap), 520];
      const reveal = i => i === 0 ? S.p(0, 0.6, 0.3) : i === 1 ? S.p(1, 0.6, 0.2) : i === 2 ? S.ps(1, 1, 0.6, 0.6) : S.p(i - 1, 0.6, 0.2);
      const act = ovActive(S);
      OV.forEach((o, i) => {
        const a = reveal(i);
        if (a <= 0) return;
        const [x, y] = pos(i), on = i === act;
        ctx.save(); ctx.globalAlpha *= a * (on ? 1 : 0.6);
        box(ctx, x, y, bw, bh, null, { stroke: on ? COL.A : COL.line, glow: on ? COL.A : null });
        txt(ctx, o[0], x + 26, y + 62, { size: 30, weight: 700, color: o[3] });
        txt(ctx, o[1], x + 26, y + 104, { size: 22, color: COL.dim });
        thumb(ctx, o[5], x + bw - 112, y + 30, 1, o[3]);
        ctx.restore();
        mtxt(ctx, o[2], x + bw / 2, y + bh + 44, { size: 24, mono: true, align: 'center', alpha: a * (on ? 1 : 0.7), color: on ? COL.text : COL.dim });
        // a token runs along the arrow into the box as it is introduced
        if (i > 0) {
          const [px, py] = pos(i - 1);
          const path = i === 4 ? [[px + bw, py + bh / 2], [1850, py + bh / 2], [1850, 450], [x + bw / 2, 450], [x + bw / 2, y - 6]] : [[px + bw + 4, py + bh / 2], [x - 4, y + bh / 2]];
          parrow(ctx, path, { alpha: a, lw: 2, color: COL.dim });
          const tk = clamp((S.T(i === 2 ? 1 : i === 1 ? 1 : i - 1) - (i === 2 ? S.st(1, 1) + 0.6 : 0.2)) / 0.7);
          if (tk > 0 && tk < 1) {
            let L = 0; const seg = []; for (let q = 1; q < path.length; q++) { const d = Math.hypot(path[q][0] - path[q - 1][0], path[q][1] - path[q - 1][1]); seg.push(d); L += d; }
            let d = easeIO(tk) * L, q = 0; while (q < seg.length - 1 && d > seg[q]) { d -= seg[q]; q++; }
            const f = seg[q] ? d / seg[q] : 0, tx = lerp(path[q][0], path[q + 1][0], f), ty = lerp(path[q][1], path[q + 1][1], f);
            E.glow(ctx, tx, ty, 34, COL.A, 0.9);
          }
        }
      });
      // beat 0: what "201 frames of 1024 numbers" looks like
      const g0 = S.ps(0, 1, 0.6, 0.5) * (1 - S.p(1, 0.5));
      if (g0 > 0) mat(ctx, 560, 470, 760, 300, { rows: 18, cols: 40, seed: 606, left: ['{T:201} frames', COL.T], top: ['{C:1024} numbers each', COL.C], alpha: g0 });
      // parameters: on a linear scale the back-end is a sliver
      const f = S.ps(5, 1, 0.8, 0.2);
      if (f > 0) {
        ctx.save(); ctx.globalAlpha = f;
        const L = 1500, gw = easeIO(S.l(5, 1.4, S.st(5, 1) + 0.4));
        txt(ctx, 'parameters, linear scale', 210, 800, { size: 22, color: COL.dim });
        rrect(ctx, 210, 818, L * gw, 40, 8, rgba(COL.A, 0.35), COL.A, 2);
        txt(ctx, 'XLS-R 300M  315,438,720', 230, 846, { size: 24, weight: 700, color: COL.text });
        const b = S.ps(5, 2, 0.6, 0.2);
        ctx.globalAlpha = f * b;
        rrect(ctx, 210, 880, Math.max(3, L * 447242 / 315438720), 40, 2, COL.H, null);
        txt(ctx, 'AASIST back-end  447,242  =  0.14 %  (about 700× smaller)', 232, 909, { size: 24, weight: 700, color: COL.H });
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
      "The first layer of the back-end, called L L in the code, is a linear layer from one thousand and twenty-four to one hundred and twenty-eight. Its weight is stored as one hundred and twenty-eight by one thousand and twenty-four. [+1] Every frame keeps its place in time; only the feature axis shrinks. B by two hundred and one by one hundred and twenty-eight.",
      "In SSL-AASIST the whole X L S R model is fine-tuned together with the back-end, with a very small learning rate: one in a million. That keeps the pre-trained features from being destroyed early in training.",
    ],
    hud: S => S.b === 0 || (S.b === 1 && !S.past(1, 0, 1.5)) ? { stage: 0, shape: '({B:B}, {T:64600})', label: 'waveform' }
      : { stage: S.b >= 2 ? 1 : 0, shape: S.past(2, 3) ? SHP.ll : SHP.in },
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        rrect(ctx, 140, 200, 1640, 170, 14, COL.panel, COL.line, 2);
        drawWave(ctx, 160, 285, 1600, 130, { lw: 1.2 });
        dimBottom(ctx, 160, 376, 1600, '{T:64,600} samples  ≈ 4.04 s', COL.T, 26);
        // beat 0, sentence 2: a long clip is cut at the crop length, a short one is tiled until it fills it
        const ex = S.ps(0, 1, 0.6) * (1 - S.p(1, 0.5));
        if (ex > 0) {
          ctx.globalAlpha = A * ex;
          txt(ctx, 'longer clip: cut', 140, 485, { size: 24, weight: 700, color: COL.dim });
          rrect(ctx, 140, 500, 1640, 70, 8, rgba(COL.T, 0.08), rgba(COL.T, 0.6), 1.5);
          drawWave(ctx, 150, 535, 1620, 50, { from: 1000, to: 15000, lw: 1 });
          ctx.save(); ctx.globalAlpha *= 0.35; drawWave(ctx, 1790, 535, 120, 50, { from: 15000, to: 16000, lw: 1, color: COL.faint }); ctx.restore();
          line(ctx, 1784, 488, 1784, 582, COL.R, 3, [8, 6]);
          txt(ctx, 'cut', 1800, 600, { size: 22, weight: 700, color: COL.R });
          const t2 = S.ps(0, 1, 0.6, 2.5);
          ctx.globalAlpha = A * ex * t2;
          txt(ctx, 'shorter clip: repeated', 140, 640, { size: 24, weight: 700, color: COL.dim });
          for (let k = 0; k < 3; k++) {
            const w = k < 2 ? 640 : 1640 - 2 * 640 - 20;
            rrect(ctx, 140 + k * 650, 655, w, 70, 8, rgba(COL.T, 0.08), rgba(COL.T, 0.6), 1.5);
            drawWave(ctx, 150 + k * 650, 690, w - 20, 50, { from: 2000, to: 2000 + Math.floor(9000 * (w / 640)), lw: 1 });
          }
          ctx.globalAlpha = A;
        }
        // beat 1: through XLS-R, with the length formula
        const b = S.p(1, 0.6, 0.45);
        if (b > 0) {
          ctx.globalAlpha = A * b;
          arrow(ctx, 960, 420, 960, 470, {});
          box(ctx, 740, 480, 440, 110, ['XLS-R 300M', '24 layers · hidden 1024'], { size: 32, color: COL.A });
          mtxt(ctx, 'output: ({B:B}, {T:201}, {C:1024})', W / 2, 660, { size: 34, mono: true, align: 'center', alpha: S.p(1, 0.6, 1.5) });
          const fa = S.ps(1, 1, 0.6, 0.3), fs = '⌊ (64600 − {K:400}) / {A:320} ⌋ + 1  =  {T:201}', fo = { size: 34, mono: true };
          mtxt(ctx, fs, W / 2, 760, { ...fo, align: 'center', alpha: fa });
          const hl = S.ps(1, 2, 0.5);
          if (hl > 0) {
            const fw = mwidth(ctx, fs, fo), w3 = mwidth(ctx, '201', fo), xr = W / 2 + fw / 2;
            ctx.globalAlpha = A * b * hl; rrect(ctx, xr - w3 - 10, 724, w3 + 20, 50, 10, null, COL.T, 3);
            txt(ctx, '201 frames', xr - w3 / 2, 812, { size: 24, weight: 700, align: 'center', color: COL.T });
          }
        }
        ctx.restore();
      }
      const Bv = S.p(2, 0.7, 0.35);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        mat(ctx, 200, 300, 520, 300, { rows: 16, cols: 30, seed: 301, left: ['{T:201}', COL.T], top: ['{C:1024}', COL.C], title: 'XLS-R features' });
        arrow(ctx, 760, 450, 880, 450, { color: COL.K });
        box(ctx, 890, 390, 250, 120, ['LL', '1024 → 128'], { size: 34, color: COL.K });
        arrow(ctx, 1150, 450, 1240, 450, { color: COL.K });
        mat(ctx, 1380, 300, 150, 300, { rows: 16, cols: 8, seed: 302, left: ['{T:201}', COL.T], top: ['{C:128}', COL.C], title: 'x' });
        mtxt(ctx, 'LL.weight.shape = ({C:128}, {C:1024})    y = x·Wᵀ + b', W / 2, 720, { size: 30, mono: true, align: 'center', alpha: S.ps(2, 1, 0.6, 0.3) });
        // "every frame keeps its place": the same row lights up on both sides, and a pulse carries it through LL
        const fr = S.ps(2, 2, 0.5) * (1 - S.p(3, 0.5));
        if (fr > 0) {
          const row = 6, y1 = 300 + row * 300 / 16;
          ctx.globalAlpha = Bv * fr;
          rrect(ctx, 196, y1 - 3, 528, 300 / 16 + 6, 4, null, COL.A, 3);
          rrect(ctx, 1376, y1 - 3, 158, 300 / 16 + 6, 4, null, COL.A, 3);
          const tp = clamp((S.T(2) - S.st(2, 2) - 0.6) / 1.4);
          if (tp > 0 && tp < 1) E.glow(ctx, lerp(724, 1376, easeIO(tp)), lerp(y1 + 9, y1 + 9, tp), 30, COL.A, 0.9);
          txt(ctx, 'frame 7 stays frame 7: only its 1024 numbers become 128', W / 2, 655, { size: 24, weight: 600, align: 'center', color: COL.A });
        }
        ctx.globalAlpha = Bv;
        mtxt(ctx, '({B:B}, {T:201}, {C:1024})  →  ({B:B}, {T:201}, {C:128})     131,200 weights', W / 2, 790, { size: 28, mono: true, align: 'center', alpha: S.ps(2, 3, 0.6, 0.2), color: COL.dim });
        // beat 3: gradients flow back into XLS-R too, in tiny steps
        const c = S.p(3, 0.6, 0.3);
        if (c > 0) {
          ctx.globalAlpha = Bv * c;
          rrect(ctx, 380, 850, 1160, 80, 14, COL.panel, rgba(COL.A, 0.6), 2);
          txt(ctx, 'XLS-R + back-end trained end-to-end  ·  Adam, lr = 1e-6', W / 2, 900, { size: 28, weight: 600, align: 'center' });
          // dashes march backwards, from LL into XLS-R
          ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = S.t * 40; ctx.strokeStyle = COL.R; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(1015, 520); ctx.lineTo(1015, 620); ctx.lineTo(460, 620); ctx.lineTo(460, 630); ctx.stroke();
          ctx.restore();
          arrow(ctx, 460, 628, 460, 606, { color: COL.R, head: 12 });
          txt(ctx, 'gradients reach XLS-R too, in tiny steps', 740, 648, { size: 22, weight: 700, align: 'center', color: COL.R, alpha: S.ps(3, 0, 0.6, 1) });
        }
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 3 image + pool
  const POOLT = [[3, 1, 4, 1, 5, 9], [2, 6, 5, 3, 5, 8], [9, 7, 9, 3, 2, 3], [8, 4, 6, 2, 6, 4], [3, 3, 8, 3, 2, 7], [9, 5, 0, 2, 8, 8]];
  const BNV = Array.from({ length: 18 }, (_, i) => 1.4 + 0.9 * noise(i, 4, 312));
  S_.push({
    id: 'a_image', chapter: 3, title: 'Features as an image',
    code: S => S.b < 2 ? 'x.transpose(1, 2).unsqueeze(1)' : S.b < 4 ? 'F.max_pool2d(x, (3, 3))' : 'first_bn (BatchNorm2d(1)) → SELU',
    beats: [
      "Now the trick. Transpose, to put features before time: B by one hundred and twenty-eight by two hundred and one. [+1] Then add a channel axis of size one: B by one by one hundred and twenty-eight by two hundred and one.",
      "That's the standard layout for images in PyTorch: batch, channels, height, width. The height is the one hundred and twenty-eight feature rows, and the width is the two hundred and one frames. AASIST was designed for spectrogram-like inputs, so the code calls the height axis spectral. Here it really holds learned features, not frequencies, but the name stuck.",
      "Next, a two-dimensional max pooling with a three by three window. The grid is cut into non-overlapping three by three patches, and each patch is replaced by its largest value.",
      "One hundred and twenty-eight divided by three, rounded down, is forty-two. Two hundred and one divided by three is sixty-seven. The tensor becomes B by one by forty-two by sixty-seven.",
      "Then batch normalization and a SELU activation. Batch norm rescales each channel using statistics computed over the whole batch and every position. SELU passes positive values through, scaled by about one point oh five, and bends negative values smoothly down towards minus one point seven six. The shape doesn't change.",
    ],
    hud: S => ({ stage: 2, shape: S.b === 0 ? (S.past(0, 2) ? SHP.img : S.past(0, 1) ? '({B:B}, {F:128}, {T:201})' : SHP.ll) : S.b < 3 || !S.past(3, 2) ? SHP.img : SHP.pool }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const R = 10, Cc = 16, s = 26, bx = 300, by = 250, ax = 300, ay = 250;
        // each time step (a row: its 128 features) flies over and stands up as a column of the image
        const tl = S.T(0) - S.st(0, 1) - 0.3, axT = lerp(640, ax, easeIO((tl - 2.4) / 0.8));
        const cellAt = (f, t, x, y) => { ctx.fillStyle = vcol(noise(f, t, 311) * 0.9, 0.9); ctx.fillRect(x + 1.5, y + 1.5, s - 3, s - 3); };
        for (let c = 0; c < Cc; c++) {
          const tc = easeIO(clamp((tl - c * 0.1) / 0.8));
          if (tc <= 0) { for (let r = 0; r < R; r++) cellAt(r, c, bx + r * s, by + c * s); continue; }
          if (tc >= 1) { for (let r = 0; r < R; r++) cellAt(r, c, axT + c * s, ay + r * s); continue; }
          const cx = lerp(bx + R * s / 2, axT + c * s + s / 2, tc), cy = lerp(by + c * s + s / 2, ay + R * s / 2, tc);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.PI / 2 * tc);
          for (let r = 0; r < R; r++) cellAt(r, c, -R * s / 2 + r * s, -s / 2);
          ctx.restore();
        }
        const la = 1 - clamp((tl - 1.0) / 0.6), lb = clamp((tl - 3.1) / 0.5);
        ctx.globalAlpha = A * la;
        dimLeft(ctx, bx - 6, by, Cc * s, '{T:201}', COL.T, 24); dimTop(ctx, bx, by - 6, R * s, '{C:128}', COL.C, 24);
        ctx.globalAlpha = A * lb;
        dimLeft(ctx, ax - 6, ay, R * s, 'height {F:128}', COL.F, 24); dimTop(ctx, ax, ay - 6, Cc * s, 'width {T:201}', COL.T, 24);
        ctx.globalAlpha = A;
        const u = S.ps(0, 2, 0.6, 0.2);
        if (u > 0) { ctx.globalAlpha = A * u; rrect(ctx, ax - 10, ay - 10, Cc * s + 20, R * s + 20, 10, null, COL.C, 3); txt(ctx, 'channel axis added: C = 1', ax + Cc * s / 2, ay + R * s + 50, { size: 24, weight: 700, align: 'center', color: COL.C }); ctx.globalAlpha = A; }
        mtxt(ctx, '({B:B}, {T:201}, {C:128})', 1380, 330, { size: 34, mono: true, align: 'center' });
        mtxt(ctx, '.transpose(1, 2)  →  ({B:B}, {F:128}, {T:201})', 1380, 400, { size: 28, mono: true, align: 'center', alpha: S.ps(0, 1, 0.6, 0.3) });
        mtxt(ctx, '.unsqueeze(1)  →  ({B:B}, {C:1}, {F:128}, {T:201})', 1380, 460, { size: 28, mono: true, align: 'center', alpha: u });
        const b = S.p(1, 0.6, 0.5);
        if (b > 0) {
          ctx.globalAlpha = A * b;
          rrect(ctx, 960, 560, 840, 100 + 130 * S.ps(1, 1, 0.6) + 70 * S.ps(1, 3, 0.6), 14, COL.panel, COL.line, 2);
          mtxt(ctx, '(batch, {C:channels}, {F:height}, {T:width})', 1380, 620, { size: 30, mono: true, align: 'center' });
          ctx.globalAlpha = A * S.ps(1, 1, 0.6);
          wrap(ctx, 'height = {F:128} feature rows, called "spectral" in the code', 990, 690, 790, 40, { size: 26 });
          wrap(ctx, 'width = {T:201} frames (time)', 990, 740, 790, 40, { size: 26 });
          ctx.globalAlpha = A * S.ps(1, 3, 0.6);
          wrap(ctx, 'Here the rows are learned XLS-R features, not frequencies.', 990, 810, 790, 40, { size: 24, color: COL.dim });
        }
        ctx.restore();
      }
      const P = S.vis(2, 4);
      if (P > 0) {
        ctx.save(); ctx.globalAlpha = P;
        const cw = 72, x0 = 250, y0 = 230;
        const blk = Math.min(3, Math.floor(S.l(2, 4, S.st(2, 1) + 1) * 4));
        numMat(ctx, x0, y0, POOLT, cw, cw, { size: 26, d: 0, fmt: v => String(v), fill: (r, c, v) => {
          const bi = Math.floor(r / 3) * 2 + Math.floor(c / 3);
          const blockMax = Math.max(...POOLT.slice(Math.floor(r / 3) * 3, Math.floor(r / 3) * 3 + 3).flatMap(rr => rr.slice(Math.floor(c / 3) * 3, Math.floor(c / 3) * 3 + 3)));
          return bi <= blk && v === blockMax ? rgba(COL.K, 0.45) : rgba(COL.F, 0.10 + 0.04 * v);
        } });
        line(ctx, x0 + 3 * cw, y0, x0 + 3 * cw, y0 + 6 * cw, COL.K, 3); line(ctx, x0, y0 + 3 * cw, x0 + 6 * cw, y0 + 3 * cw, COL.K, 3);
        arrow(ctx, x0 + 6 * cw + 40, y0 + 3 * cw, x0 + 6 * cw + 170, y0 + 3 * cw, { color: COL.K });
        txt(ctx, 'max of each 3×3', x0 + 6 * cw + 105, y0 + 3 * cw - 24, { size: 22, align: 'center', color: COL.K, weight: 700 });
        numMat(ctx, x0 + 6 * cw + 200, y0 + 2 * cw, [[9, 9], [9, 8]], cw, cw, { size: 28, d: 0, fmt: v => String(v), cellAlpha: (r, c) => (r * 2 + c) <= blk ? 1 : 0.1, fill: () => rgba(COL.K, 0.35) });
        const c = S.p(3, 0.6, 0.3);
        if (c > 0) {
          ctx.globalAlpha = P * c;
          rrect(ctx, 1180, 230, 620, 440, 14, COL.panel, COL.line, 2);
          mtxt(ctx, 'height:  ⌊ {F:128} / 3 ⌋ = {F:42}', 1220, 320, { size: 32, mono: true });
          mtxt(ctx, 'width:   ⌊ {T:201} / 3 ⌋ = {T:67}', 1220, 390, { size: 32, mono: true, alpha: S.ps(3, 1, 0.6) });
          mtxt(ctx, '({B:B}, {C:1}, {F:42}, {T:67})', 1490, 500, { size: 34, mono: true, align: 'center', alpha: S.ps(3, 2, 0.6) });
          // our own tensor shrinks: first the height, then the width
          const hS = easeIO(S.l(3, 1, 1)), wS = easeIO(S.l(3, 1, S.st(3, 1) + 0.6));
          const gw = lerp(402, 134, wS), gh = lerp(128, 42, hS) * 1.2, gx = 250, gy = 730;
          ctx.globalAlpha = P * c;
          cells(ctx, gx, gy, 6, 10, gw / 10, gh / 6, (r, cc) => scol(clamp(0.5 + 0.45 * noise(r, cc, 313))), 1);
          rrect(ctx, gx - 2, gy - 2, gw + 4, gh + 4, 4, null, COL.line, 1.5);
          mtxt(ctx, `our tensor:  {F:${Math.round(lerp(128, 42, hS))}} × {T:${Math.round(lerp(201, 67, wS))}}`, gx + 440, gy + 50, { size: 28, mono: true });
        }
        ctx.restore();
      }
      const Q = S.p(4, 0.7, 0.35);
      if (Q > 0) {
        ctx.save(); ctx.globalAlpha = Q;
        const ox = 560, oy = 560, sx = 100, sy = 100;
        rrect(ctx, 150, 180, 820, 700, 16, COL.panel, COL.line, 2);
        ctx.save(); ctx.beginPath(); ctx.rect(152, 182, 816, 696); ctx.clip();
        line(ctx, 190, oy, 930, oy, COL.faint, 2); line(ctx, ox, 200, ox, 860, COL.faint, 2);
        for (let k = -3; k <= 3; k++) if (k) txt(ctx, String(k), ox + k * sx, oy + 30, { size: 18, align: 'center', color: COL.faint, mono: true });
        line(ctx, 190, oy + 1.7581 * sy, 930, oy + 1.7581 * sy, rgba(COL.R, 0.6), 1.5, [6, 6]);
        ctx.strokeStyle = COL.A; ctx.lineWidth = 5; ctx.beginPath();
        for (let i = 0; i <= 300 * S.l(4, 2, S.st(4, 2)); i++) { const x = -3.7 + 7.4 * i / 300, y = selu(x); const X = ox + x * sx, Y = oy - y * sy; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
        ctx.stroke();
        ctx.restore();
        txt(ctx, '−1.758', 200, oy + 1.7581 * sy - 12, { size: 22, mono: true, color: COL.R });
        txt(ctx, 'SELU', 210, 250, { size: 30, weight: 800, color: COL.A });
        // batch norm as a picture: one channel's values, before and after
        const bn = S.ps(4, 0, 0.6, 0.5);
        if (bn > 0) {
          const m = BNV.reduce((a, v) => a + v, 0) / BNV.length, sd = Math.sqrt(BNV.reduce((a, v) => a + (v - m) ** 2, 0) / BNV.length);
          const af = S.ps(4, 1, 0.6, 0.8);
          ctx.globalAlpha = Q * bn;
          txt(ctx, 'BatchNorm2d: one channel, all batch × height × width values', 1040, 230, { size: 24, weight: 700 });
          [[290, 'before', v => v, bn, `mean ${m.toFixed(2)}, std ${sd.toFixed(2)}`], [380, 'after', v => (v - m) / sd, af, 'mean 0, std 1, then learned scale + shift']].forEach(([y, lab, f, a, note]) => {
            ctx.globalAlpha = Q * a;
            line(ctx, 1160, y, 1780, y, COL.faint, 2); line(ctx, 1420, y - 12, 1420, y + 12, COL.faint, 2);
            txt(ctx, lab, 1040, y + 8, { size: 24, weight: 700, color: lab === 'after' ? COL.A : COL.text });
            BNV.forEach((v, i) => { ctx.fillStyle = rgba(COL.C, 0.85); ctx.beginPath(); ctx.arc(1420 + f(v) * 110, y - (i % 3) * 10, 7, 0, 7); ctx.fill(); });
            txt(ctx, note, 1160, y + 42, { size: 22, color: COL.dim });
          });
        }
        ctx.globalAlpha = Q * S.ps(4, 2, 0.6);
        mtxt(ctx, 'SELU(x) = λ·x            (x > 0)', 1040, 500, { size: 30, mono: true });
        mtxt(ctx, '         λ·α·(eˣ − 1)     (x ≤ 0)', 1040, 550, { size: 30, mono: true });
        txt(ctx, 'λ ≈ 1.0507,  α ≈ 1.6733,  floor −λα ≈ −1.758', 1040, 610, { size: 26, color: COL.dim, mono: true });
        ctx.globalAlpha = Q;
        mtxt(ctx, 'shape unchanged: ({B:B}, {C:1}, {F:42}, {T:67})', 1040, 720, { size: 28, mono: true, alpha: S.ps(4, 3, 0.6) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 4 conv2d
  const CI = [[0.2, 0.8, -0.3, 0.5, 0.1, -0.6, 0.4], [0.7, -0.2, 0.9, 0.3, -0.5, 0.2, 0.6], [-0.4, 0.5, 0.1, -0.8, 0.7, 0.3, -0.1], [0.3, 0.6, -0.7, 0.2, 0.4, 0.9, -0.3]];
  const CK = [[1, 0, -1], [0.5, 1, 0.5]];
  // padded toy grid: (rows + 2·padH) × (cols + 2·padW), zeros around, the 2×3 kernel slid over it with stride 1
  function padDemo(ctx, rows, cols, padH, padW, prog, ring, x0, y0, xo, yo, seed) {
    const R = rows + 2 * padH, C = cols + 2 * padW, cs = 56, oR = R - 1, oC = C - 2;
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const pad = r < padH || r >= rows + padH || c < padW || c >= cols + padW;
      if (pad) {
        ctx.save(); ctx.globalAlpha *= ring;
        rrect(ctx, x0 + c * cs + 2, y0 + r * cs + 2, cs - 4, cs - 4, 6, 'rgba(90,100,120,0.18)', COL.faint, 1.5);
        txt(ctx, '0', x0 + c * cs + cs / 2, y0 + r * cs + cs / 2 + 1, { size: 20, mono: true, align: 'center', base: 'middle', color: COL.faint });
        ctx.restore();
      } else rrect(ctx, x0 + c * cs + 2, y0 + r * cs + 2, cs - 4, cs - 4, 6, vcol(noise(r - padH, c - padW, seed) * 0.9, 0.75), COL.line, 1.5);
    }
    const n = oR * oC, k = Math.min(n - 1, Math.floor(prog * n));
    if (prog > 0) {
      const kr = Math.floor(k / oC), kc = k % oC;
      rrect(ctx, x0 + kc * cs - 3, y0 + kr * cs - 3, 3 * cs + 6, 2 * cs + 6, 8, rgba(COL.K, 0.12), COL.K, 4);
    }
    for (let r = 0; r < oR; r++) for (let c = 0; c < oC; c++) {
      const on = prog > 0 && r * oC + c <= k;
      rrect(ctx, xo + c * cs + 2, yo + r * cs + 2, cs - 4, cs - 4, 6, on ? vcol(noise(r, c, seed + 7) * 0.9, 0.85) : 'rgba(0,0,0,0)', on ? COL.C : rgba(COL.line, 0.7), 1.5);
    }
    return [oR, oC, cs];
  }
  S_.push({
    id: 'a_conv2d', chapter: 4, title: '2-D convolution',
    code: S => S.b < 1 ? 'nn.Conv2d(in, out, kernel_size=(2, 3))' : S.b < 2 ? 'conv1.weight: (32, 32, 2, 3)' : S.b < 3 ? 'conv1: padding=(1, 1)' : 'conv2: padding=(0, 1)',
    beats: [
      "The encoder is made of two-dimensional convolutions. It's the same idea as the one-dimensional case: slide a small kernel of weights, multiply, and add. But now the kernel moves in two directions: across the width, and down the height.",
      "AASIST's kernels are two rows tall and three columns wide. A layer with thirty-two output channels and thirty-two input channels stores a weight of shape thirty-two, by thirty-two, by two, by three: out, in, height, width. Each output value sums over all input channels and all six kernel positions.",
      "The length rule applies to each axis separately. With padding p, the output size is: input, plus two p, minus the kernel, divided by the stride, plus one. The first convolution in each block pads by one on every side. Height forty-two becomes forty-three, and width sixty-seven stays sixty-seven.",
      "The second convolution pads only the width. Height forty-three goes back to forty-two, and the width again stays sixty-seven. So every block returns exactly the height and width it received.",
    ],
    hud: S => S.b === 0 ? { stage: 3, shape: '({B:B}, {C:1}, {F:42}, {T:67})', label: 'encoder input' }
      : S.b === 1 ? { stage: 3, shape: S.past(1, 1) ? '({B:B}, {C:32}, {F:42}, {T:67})' : '({B:B}, {C:1}, {F:42}, {T:67})', label: S.past(1, 1) ? 'a 32 → 32 layer' : 'encoder input' }
      : S.b === 2 ? { stage: 3, shape: S.past(2, 3) ? '({B:B}, {C:32}, {F:43}, {T:67})' : '({B:B}, {C:32}, {F:42}, {T:67})', label: S.past(2, 3) ? 'after conv1' : 'block input' }
      : { stage: 3, shape: S.past(3, 1) ? '({B:B}, {C:32}, {F:42}, {T:67})' : '({B:B}, {C:32}, {F:43}, {T:67})', label: S.past(3, 1) ? 'after conv2' : 'after conv1' },
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
        txt(ctx, 'output 3 × 5  =  (4 − 2 + 1) × (7 − 3 + 1)', 1305, 445, { size: 22, align: 'center', color: COL.dim, mono: true });
        numMat(ctx, 1080, y0 + 220, O, 90, 64, { size: 20, d: 2, cellAlpha: (i, j) => i * 5 + j <= fr ? 1 : 0.08, hl: (i, j) => i === r && j === c });
        const w = S.p(1, 0.6, 0.5);
        if (w > 0) {
          ctx.globalAlpha = A * w;
          rrect(ctx, 150, 700, 1620, 250, 14, 'rgba(10,14,22,0.96)', COL.line, 2);
          for (let o = 0; o < 3; o++) for (let i = 0; i < 6; i++) {
            const x = 200 + i * 78, y = 730 + o * 60;
            cells(ctx, x, y, 2, 3, 20, 22, (a, b) => vcol(noise(o * 7 + i, a * 3 + b, 331), 0.9), 2);
          }
          txt(ctx, 'example: a 32 → 32 layer (blocks 2 onward)', 200, 690, { size: 24, weight: 700, color: COL.K });
          txt(ctx, '… 32 out', 330, 935, { size: 22, color: COL.dim, align: 'center' });
          txt(ctx, '… 32 in →', 690, 745, { size: 22, color: COL.dim });
          mtxt(ctx, 'weight: ({C:32} out, {C:32} in, {F:2}, {T:3})', 900, 770, { size: 32, mono: true, alpha: S.ps(1, 1, 0.6) });
          txt(ctx, 'one output value = Σ over 32 channels × 2 × 3 positions', 900, 830, { size: 26, color: COL.dim, alpha: S.ps(1, 2, 0.6) });
          txt(ctx, '32·32·2·3 + 32 = 6,176 numbers', 900, 890, { size: 26, color: COL.K, mono: true, alpha: S.ps(1, 2, 0.6, 2) });
        }
        ctx.restore();
      }
      // padding, drawn: a ring of zeros (conv1), then zeros only at the sides (conv2)
      const P1 = S.vis(2, 3);
      if (P1 > 0) {
        ctx.save(); ctx.globalAlpha = P1;
        mtxt(ctx, 'out  =  ⌊ (in + 2·{A:p} − {K:k}) / s ⌋ + 1', W / 2, 200, { size: 38, mono: true, align: 'center', weight: 600 });
        const ring = S.ps(2, 2, 0.6), prog = clamp((S.T(2) - S.st(2, 2) - 1.2) / 4.5);
        txt(ctx, 'conv1, pad (1, 1): a ring of zeros', 170, 272, { size: 26, weight: 700, color: COL.K, alpha: ring });
        padDemo(ctx, 4, 7, 1, 1, prog, ring, 170, 290, 1000, 318, 341);
        txt(ctx, 'output', 1196, 300, { size: 24, weight: 700, align: 'center', color: COL.C, alpha: ring });
        mtxt(ctx, 'height  4 + 2 − 2 + 1 = {F:5}     width  7 + 2 − 3 + 1 = {T:7}', 1196, 640, { size: 26, mono: true, align: 'center', alpha: clamp(prog * 1.2) });
        mtxt(ctx, 'real model:  {F:42} → {F:43}     {T:67} → {T:67}', W / 2, 760, { size: 34, mono: true, align: 'center', weight: 600, alpha: S.ps(2, 3, 0.6) });
        ctx.restore();
      }
      const P2 = S.p(3, 0.7, 0.35);
      if (P2 > 0) {
        ctx.save(); ctx.globalAlpha = P2;
        mtxt(ctx, 'out  =  ⌊ (in + 2·{A:p} − {K:k}) / s ⌋ + 1', W / 2, 200, { size: 38, mono: true, align: 'center', weight: 600 });
        const prog = clamp((S.T(3) - 0.8) / 4);
        txt(ctx, 'conv2, pad (0, 1): zeros only at the sides', 170, 272, { size: 26, weight: 700, color: COL.K });
        padDemo(ctx, 5, 7, 0, 1, prog, 1, 170, 290, 1000, 318, 342);
        txt(ctx, 'output', 1196, 300, { size: 24, weight: 700, align: 'center', color: COL.C });
        mtxt(ctx, 'height  5 + 0 − 2 + 1 = {F:4}     width  7 + 2 − 3 + 1 = {T:7}', 1196, 584, { size: 26, mono: true, align: 'center', alpha: clamp(prog * 1.2) });
        mtxt(ctx, 'real model:  {F:43} → {F:42}     {T:67} → {T:67}', W / 2, 760, { size: 34, mono: true, align: 'center', weight: 600, alpha: S.ps(3, 1, 0.6) });
        txt(ctx, 'net effect of a block on height × width: none', W / 2, 860, { size: 32, weight: 700, align: 'center', color: COL.A, alpha: S.ps(3, 2, 0.6) });
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
      "One quirk you'll notice if you read the code. Each block after the first computes a batch norm and a SELU of its input, but the first convolution is then applied to the original input, not to that result. [+1] The original AASIST code does the same. It doesn't break anything; those two operations just don't affect the output.",
      "After the encoder comes one more batch norm, over the sixty-four channels, and a SELU. The encoder is the largest part of the back-end: about two hundred and eleven thousand of its four hundred and forty-seven thousand parameters.",
    ],
    hud: S => ({ stage: 3, shape: S.b === 0 ? '({B:B}, {C:C_in}, {F:42}, {T:67})' : S.b === 1 && !S.past(1, 3) ? '({B:B}, {C:1}, {F:42}, {T:67})' : SHP.enc, label: S.b === 0 ? 'block input' : S.b === 1 && !S.past(1, 3) ? 'encoder input' : 'encoder output' }),
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const x = 520, bw = 460, sxR = x + bw / 2 + 130;
        chip(ctx, x, 190, 'x  ({B:B}, {C:C_in}, {F:42}, {T:67})', { markup: true, size: 24, mono: true, align: 'center' });
        const blocks = [['conv1', '2×3, pad (1,1)', COL.K, 250], ['BatchNorm2d + SELU', '', COL.A, 390], ['conv2', '2×3, pad (0,1)', COL.K, 500]];
        blocks.forEach(([t, s2, c, y], i) => {
          arrow(ctx, x, y - 30, x, y - 4, {});
          box(ctx, x - bw / 2, y, bw, 80, s2 ? [t, s2] : t, { size: 30, color: c, alpha: S.p(0, 0.4, 0.5 + i * 1.2) });
        });
        arrow(ctx, x, 580, x, 640, {});
        ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, 666, 24, 0, 7); ctx.stroke();
        txt(ctx, '+', x, 668, { size: 34, weight: 700, align: 'center', base: 'middle' });
        parrow(ctx, [[x, 215], [sxR, 215], [sxR, 666], [x + 28, 666]], { color: COL.B, lw: 3 });
        const sk = S.ps(0, 1, 0.6, 0.5);
        box(ctx, sxR - 100, 400, 200, 90, ['conv 1×3', 'if C changes'], { size: 31, color: COL.B, alpha: sk });
        arrow(ctx, x, 690, x, 760, {});
        chip(ctx, x, 790, 'out  ({B:B}, {C:C_out}, {F:42}, {T:67})', { markup: true, size: 24, mono: true, align: 'center' });
        wrap(ctx, 'The skip path lets the block learn a correction on top of its input.', 1150, 400, 640, 44, { size: 30, alpha: S.p(0, 0.6, 4) });
        // two pulses: one down the main path, one round the skip path; they meet at the ⊕
        const pulse = (t0, dur) => {
          const u = clamp((S.T(0) - t0) / dur);
          if (u <= 0 || u >= 1) return;
          const e = easeIO(u);
          E.glow(ctx, x, lerp(215, 666, e), 34, COL.A, 0.9);
          const L1 = sxR - x, L2 = 451, L3 = sxR - x - 28, d = e * (L1 + L2 + L3);
          const [px, py] = d < L1 ? [x + d, 215] : d < L1 + L2 ? [sxR, 215 + d - L1] : [sxR - (d - L1 - L2), 666];
          E.glow(ctx, px, py, 34, COL.B, 0.9);
          if (u > 0.9) E.glow(ctx, x, 666, 60, COL.text, (1 - u) * 8);
        };
        pulse(1.6, 4.0);
        pulse(S.st(0, 1) + 2.2, 3.5);
        ctx.restore();
      }
      const Bv = S.vis(1, 2, 0.5);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        CH.forEach(([ci, co], i) => {
          const y = 200 + i * 105, frame = S.p(1, 0.4, 0.1 + i * 0.12), a = S.ps(1, 1, 0.4, 0.2 + i * 0.85);
          ctx.globalAlpha = Bv * frame;
          rrect(ctx, 200, y, 1520, 80, 12, COL.panel, a > 0.5 && co === 64 ? rgba(COL.C, 0.6) : COL.line, 2);
          txt(ctx, 'block ' + (i + 1), 240, y + 50, { size: 28, weight: 700 });
          ctx.globalAlpha = Bv * a;
          mtxt(ctx, `{C:${ci}} → {C:${co}}`, 520, y + 50, { size: 30, mono: true });
          mtxt(ctx, `({B:B}, {C:${co}}, {F:42}, {T:67})`, 1680, y + 50, { size: 28, mono: true, align: 'right', color: COL.dim, alpha: S.ps(1, 2, 0.5) });
          if (ci !== co) txt(ctx, 'skip: conv 1×3', 820, y + 50, { size: 24, color: COL.B, weight: 600 });
          for (let k = 0; k < Math.min(8, co / 8); k++) rrect(ctx, 1080 + k * 22, y + 16, 16, 48, 3, rgba(COL.C, 0.5), null);
        });
        ctx.restore();
      }
      const Q = S.vis(2, 3);
      if (Q > 0) {
        ctx.save(); ctx.globalAlpha = Q;
        rrect(ctx, 200, 200, 1520, 480, 16, '#0d1320', COL.line, 2);
        const L = [['def forward(self, x):', COL.text], ['    identity = x', COL.text], ['    if not self.first:            # every block after the first', COL.text], ['        out = self.bn1(x)', COL.faint], ['        out = self.selu(out)      # computed ...', COL.faint],
          ['    out = self.conv1(x)           # ... but conv1 reads x, not out', COL.K], ['    out = self.bn2(out); out = self.selu(out)', COL.text], ['    out = self.conv2(out)', COL.text], ['    out += identity (or conv_downsample(identity))', COL.text]];
        L.forEach(([s, c], i) => txt(ctx, s, 250, 255 + i * 46, { size: 26, mono: true, color: c, alpha: S.p(2, 0.3, 0.5 + i * 0.4) }));
        const h = S.ps(2, 1, 0.6, 2);
        ctx.globalAlpha = Q * h;
        rrect(ctx, 236, 255 + 5 * 46 - 32, 1080, 44, 8, null, COL.K, 3);
        ctx.globalAlpha = Q * S.ps(2, 2, 0.6);
        txt(ctx, 'same in the original AASIST code · harmless · just remember it when reading', W / 2, 740, { size: 28, weight: 600, align: 'center', color: COL.dim });
        ctx.restore();
      }
      const R = S.p(3, 0.7, 0.35);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R;
        mtxt(ctx, 'encoder out → first_bn1 (BatchNorm2d(64)) → SELU → ({B:B}, {C:64}, {F:42}, {T:67})', W / 2, 250, { size: 28, mono: true, align: 'center' });
        // only the encoder's share here; the full breakdown is in the code chapter's total
        const tot = 447242, w = 1600, we = w * 211072 / tot, a = S.ps(3, 1, 0.6, 0.3), b2 = S.ps(3, 1, 0.6, 2.5);
        ctx.globalAlpha = R * a;
        rrect(ctx, 160, 420, we - 3, 110, 6, rgba(COL.C, 0.35), COL.C, 2);
        txt(ctx, 'encoder (6 blocks)', 180, 465, { size: 26, weight: 700, color: COL.C }); txt(ctx, '211,072  ·  47 %', 180, 505, { size: 24, mono: true });
        ctx.globalAlpha = R * b2;
        rrect(ctx, 160 + we, 420, w - we, 110, 6, 'rgba(120,140,180,0.12)', COL.line, 2);
        txt(ctx, 'everything else: 236,170', 180 + we, 485, { size: 24, color: COL.dim });
        txt(ctx, 'back-end total 447,242', W / 2, 660, { size: 40, weight: 800, align: 'center' });
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
    hud: S => S.b === 0 ? { stage: 4, shape: SHP.enc, label: 'x and w' }
      : S.b === 1 ? { stage: 4, shape: S.past(1, 2) ? '({B:B}, {C:64}, {F:42})' : SHP.enc, label: S.past(1, 2) ? 'spectral summary' : 'x and w' }
      : S.b === 2 ? { stage: 4, shape: SHP.eS, label: 'spectral nodes' }
      : S.b === 3 ? { stage: 4, shape: S.past(3, 2) ? SHP.eT : S.past(3, 1) ? '({B:B}, {C:64}, {T:67})' : SHP.enc, label: S.past(3, 2) ? 'temporal nodes' : S.past(3, 1) ? 'temporal summary' : 'x and w' }
      : { stage: 4, shape: SHP.nodes, label: 'both node sets' },
    draw(ctx, S) {
      const gx = 160, R = 12, Cc = 22, cs = 24, GW = Cc * cs, GH = R * cs;
      const xs = (r, c) => vcol(noise(r, c, 351) * 0.9, 0.9), ws = (r, c) => scol(0.2 + 0.7 * Math.abs(noise(r, c, 352)));
      const grid = (y, fn, stackA = 1) => {
        for (let k = 3; k >= 1; k--) rrect(ctx, gx + k * 10, y - k * 10, GW, GH, 6, COL.bg2, rgba(COL.C, 0.4 * stackA), 1.5);
        cells(ctx, gx, y, R, Cc, cs, cs, fn, 2);
      };
      // beat 0: x → two 1×1 convs → w; one pixel's 64-number column makes the trip and becomes one cell of w
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const gy = 300;
        grid(gy, xs);
        dimLeft(ctx, gx - 6, gy, GH, '{F:42}', COL.F, 24); dimBottom(ctx, gx, gy + GH + 6, GW, '{T:67}', COL.T, 24);
        txt(ctx, 'x', gx + GW / 2, gy - 50, { size: 30, weight: 800, align: 'center' });
        txt(ctx, '× 64 channels', gx + GW + 44, gy - 22, { size: 22, color: COL.C, weight: 700 });
        arrow(ctx, 760, 444, 840, 444, {});
        arrow(ctx, 1220, 444, 1290, 444, {});
        const convBox = () => {
          rrect(ctx, 850, 384, 360, 120, 14, COL.panel, rgba(COL.F, 0.7), 2);
          txt(ctx, '1×1 conv 64 → 128', 1030, 432, { size: 26, weight: 700, align: 'center', color: COL.F });
          txt(ctx, 'SELU · BN · 1×1 conv 128 → 64', 1030, 474, { size: 22, align: 'center', color: COL.dim });
        };
        const wx = 1310, sweep = S.l(0, 3, S.st(0, 1) + 3.2);
        cells(ctx, wx, gy, R, Cc, cs * 0.8, cs, (r, c) => c < sweep * Cc ? ws(r, c) : null, 2);
        rrect(ctx, wx - 3, gy - 3, Cc * cs * 0.8 + 6, GH + 6, 6, null, COL.line, 1.5);
        txt(ctx, 'w (same shape)', wx + Cc * cs * 0.4, gy - 50, { size: 26, weight: 700, align: 'center', color: '#c8a6ff' });
        const tk = clamp((S.T(0) - S.st(0, 1) - 0.6) / 2.6), pr = 5, pc = 8;
        if (tk > 0) {
          const sx = gx + pc * cs, sy = gy + pr * cs, ex = wx + pc * cs * 0.8, ey = gy + pr * cs;
          if (tk < 1) {
            const p = easeIO(tk), x = p < 0.5 ? lerp(sx, 1030, p * 2) : lerp(1030, ex, p * 2 - 1), y = p < 0.5 ? lerp(sy, 444, p * 2) : lerp(444, ey, p * 2 - 1);
            const col = p < 0.5 ? COL.C : '#c8a6ff';
            for (let k = 0; k < 6; k++) rrect(ctx, x - 9, y - 30 + k * 10, 18, 9, 2, rgba(col, 0.9), null);
            E.glow(ctx, x, y, 34, col, 0.6);
          }
          rrect(ctx, sx - 2, sy - 2, cs + 4, cs + 4, 4, null, COL.K, 3);
          if (tk >= 1) rrect(ctx, ex - 2, ey - 2, cs * 0.8 + 4, cs + 4, 4, null, COL.K, 3);
        }
        convBox();
        if (tk > 0) {
          txt(ctx, 'one position: its 64 channels in, one weight per channel out', W / 2, 720, { size: 24, align: 'center', color: COL.dim, alpha: clamp(tk * 3) });
        }
        mtxt(ctx, 'x, w: ({B:B}, {C:64}, {F:42}, {T:67})', W / 2, 800, { size: 32, mono: true, align: 'center', alpha: S.ps(0, 2, 0.6) });
        ctx.restore();
      }
      // beats 1–2 (spectral) and 3 (temporal): w above x, the same row (or column) lit in both
      const wy = 175, xy = 540;
      const view = (alpha, along) => {
        ctx.save(); ctx.globalAlpha = alpha;
        grid(wy, ws); grid(xy, xs);
        txt(ctx, 'w', gx + GW + 30, wy + 30, { size: 30, weight: 800, color: '#c8a6ff' });
        txt(ctx, 'x', gx + GW + 30, xy + 30, { size: 30, weight: 800 });
        txt(ctx, '⊙', gx - 40, (wy + GH + xy) / 2 + 12, { size: 34, weight: 700, align: 'center', color: COL.K });
        dimLeft(ctx, gx - 6, xy, GH, '{F:42}', COL.F, 22); dimBottom(ctx, gx, xy + GH + 6, GW, '{T:67}', COL.T, 22);
        ctx.restore();
      };
      const Sv = S.vis(1, 3);
      if (Sv > 0) {
        ctx.save(); ctx.globalAlpha = Sv;
        view(1);
        const sweep = S.l(1, 4, S.st(1, 1) + 0.3), hr = S.b === 1 ? Math.min(R - 1, Math.floor(sweep * R)) : R - 1;
        const row = S.b === 1 && S.T(1) < S.st(1, 1) + 0.3 ? 0 : hr;
        rrect(ctx, gx - 3, wy + row * cs - 3, GW + 6, cs + 6, 5, null, COL.K, 3);
        rrect(ctx, gx - 3, xy + row * cs - 3, GW + 6, cs + 6, 5, null, COL.K, 3);
        txt(ctx, 'softmax over this row → its 67 weights sum to 1', gx + GW + 70, wy + row * cs + 20, { size: 22, weight: 700, color: COL.K, alpha: S.ps(1, 0, 0.6, 1) * (S.b === 1 ? 1 : 0.4) });
        // the weighted sum over time: one value per row, per channel
        const cx = 820;
        for (let k = 3; k >= 1; k--) rrect(ctx, cx + k * 8, xy - k * 8, cs * 1.4, GH, 4, COL.bg2, rgba(COL.C, 0.4), 1.2);
        cells(ctx, cx, xy, R, 1, cs * 1.4, cs, r => (S.b > 1 || (S.T(1) >= S.st(1, 1) + 0.3 && r <= hr)) ? vcol(noise(r, 9, 353), 0.95) : null, 2);
        rrect(ctx, cx - 3, xy - 3, cs * 1.4 + 6, GH + 6, 5, null, COL.line, 1.5);
        if (S.b === 1 && S.T(1) >= S.st(1, 1) + 0.3) arrow(ctx, gx + GW + 8, xy + row * cs + cs / 2, cx - 8, xy + row * cs + cs / 2, { color: COL.K, head: 10 });
        txt(ctx, 'Σ over 67 frames', cx + 18, xy - 40, { size: 22, weight: 700, color: COL.K, align: 'center', alpha: S.ps(1, 1, 0.6) });
        mtxt(ctx, '({B:B}, {C:64}, {F:42})', cx + 18, xy + GH + 60, { size: 24, mono: true, align: 'center', alpha: S.ps(1, 2, 0.6) });
        // beat 2: transpose → 42 spectral nodes, each a vector of 64
        const nd = S.p(2, 0.8, 0.4);
        if (nd > 0) {
          ctx.globalAlpha = Sv * nd;
          arrow(ctx, cx + 50, xy + GH / 2, 1000, xy + GH / 2, { color: COL.N });
          txt(ctx, 'transpose', 945, xy + GH / 2 - 16, { size: 22, align: 'center', color: COL.N });
          for (let i = 0; i < 12; i++) {
            const y = xy + i * cs + cs / 2;
            node(ctx, 1040, y, 10, COL.N, 1);
            cells(ctx, 1065, y - 8, 1, 16, 14, 16, (r, c) => vcol(noise(i, c, 354), 0.9), 2);
          }
          mtxt(ctx, '{N:42} spectral nodes × {C:64}', 1170, xy + GH + 60, { size: 26, weight: 700, align: 'center' });
          mtxt(ctx, 'e_S: ({B:B}, {N:42}, {C:64})', 1440, 300, { size: 34, mono: true, align: 'center' });
          const ps = S.ps(2, 1, 0.6, 0.3);
          ctx.globalAlpha = Sv * ps;
          rrect(ctx, 1320, 560, 32, GH - 40, 6, rgba(COL.N, 0.25), COL.N, 2);
          txt(ctx, '+ pos_S (1, 42, 64)', 1370, 640, { size: 26, weight: 700, color: COL.N, mono: true });
          txt(ctx, 'one learned vector per row:', 1370, 690, { size: 22, color: COL.dim });
          txt(ctx, 'each node knows where it came from', 1370, 724, { size: 22, color: COL.dim });
        }
        ctx.restore();
      }
      const Tv = S.vis(3, 4);
      if (Tv > 0) {
        ctx.save(); ctx.globalAlpha = Tv;
        view(1);
        const sweep = S.l(3, 4, 0.6), hc = Math.min(Cc - 1, Math.floor(sweep * Cc));
        rrect(ctx, gx + hc * cs - 3, wy - 3, cs + 6, GH + 6, 5, null, COL.K, 3);
        rrect(ctx, gx + hc * cs - 3, xy - 3, cs + 6, GH + 6, 5, null, COL.K, 3);
        txt(ctx, 'softmax down each column (over F)', gx + GW + 70, wy + 40, { size: 22, weight: 700, color: COL.K });
        const ry = xy + GH + 66;
        cells(ctx, gx, ry, 1, Cc, cs, cs, (r, c) => c <= hc ? vcol(noise(c, 9, 355), 0.95) : null, 2);
        rrect(ctx, gx - 3, ry - 3, GW + 6, cs + 6, 5, null, COL.line, 1.5);
        txt(ctx, 'Σ over 42 rows', gx + GW + 30, ry + 18, { size: 22, weight: 700, color: COL.K });
        mtxt(ctx, '({B:B}, {C:64}, {T:67})', gx + GW + 230, ry + 18, { size: 24, mono: true, alpha: S.ps(3, 1, 0.6) });
        const nd = S.ps(3, 2, 0.8, 0.2);
        if (nd > 0) {
          ctx.globalAlpha = Tv * nd;
          for (let i = 0; i < 22; i++) node(ctx, 1000 + (i % 11) * 70, 400 + Math.floor(i / 11) * 90, 16, COL.N, 1);
          mtxt(ctx, '{N:67} temporal nodes × {C:64}  (one per 3 frames)', 1350, 600, { size: 26, weight: 700, align: 'center' });
          mtxt(ctx, 'e_T: ({B:B}, {N:67}, {C:64})', 1350, 300, { size: 34, mono: true, align: 'center' });
          txt(ctx, 'no positional embedding here', 1350, 650, { size: 22, color: COL.dim, align: 'center' });
        }
        ctx.restore();
      }
      const O = S.p(4, 0.7, 0.35);
      if (O > 0) {
        ctx.save(); ctx.globalAlpha = O;
        const c1 = Math.max(S.ps(4, 0, 0.6, 0.4), S.ps(4, 1, 0.6)), c2 = S.ps(4, 2, 0.6);
        ctx.globalAlpha = O * c1;
        rrect(ctx, 200, 250, 700, 420, 16, COL.panel, COL.line, 2);
        txt(ctx, 'original AASIST', 550, 310, { size: 30, weight: 800, align: 'center' });
        ctx.globalAlpha = O * c2;
        rrect(ctx, 1020, 250, 700, 420, 16, COL.panel, rgba(COL.A, 0.6), 2);
        txt(ctx, 'SSL-AASIST', 1370, 310, { size: 30, weight: 800, align: 'center', color: COL.A });
        ctx.globalAlpha = O * S.ps(4, 1, 0.6);
        txt(ctx, 'e_S = max |e| over time', 550, 420, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'e_T = max |e| over F', 550, 480, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'fixed, nothing learned', 550, 580, { size: 24, color: COL.dim, align: 'center' });
        ctx.globalAlpha = O * S.ps(4, 2, 0.6);
        txt(ctx, 'e_S = Σ softmax_T(w) · x', 1370, 420, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'e_T = Σ softmax_F(w) · x', 1370, 480, { size: 28, mono: true, align: 'center' });
        txt(ctx, 'learned weights (16,832 params)', 1370, 580, { size: 24, color: COL.dim, align: 'center' });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 7 GAT
  // 8 nodes stand in for the 42; scores are symmetric (pairwise products are), softmax runs over dim −2
  const gN = 8, gR = 200, gcx = 440, gcy = 540;
  const gPos = i => [gcx + gR * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / gN), gcy + gR * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / gN)];
  const GS = Array.from({ length: gN }, (_, i) => Array.from({ length: gN }, (_, j) => +(2.2 * noise(Math.min(i, j), Math.max(i, j), 372) + (i === j ? 0.6 : 0)).toFixed(2)));
  const rowSoft = (T, i) => { const e = GS[i].map(v => Math.exp(v / T)), z = e.reduce((a, b) => a + b, 0); return e.map(v => v / z); };
  const GA = GS.map((_, i) => rowSoft(2, i));
  // the weights printed for node 3, rounded so that they visibly sum to 1.00
  const GAP = (() => { const r = GA[2].map(v => Math.round(v * 100) / 100), d = Math.round((1 - r.reduce((a, b) => a + b, 0)) * 100) / 100; r[r.indexOf(Math.max(...r))] += d; return r; })();
  const GX = Array.from({ length: gN }, (_, i) => Array.from({ length: 6 }, (_, k) => noise(i, k, 381)));
  const PI_ = 1, PJ = 5, AGG = 2;   // pair (node 2, node 6); node 3 is the one we aggregate into
  S_.push({
    id: 'a_gat', chapter: 7, title: 'Graph attention from scratch',
    code: S => S.b < 4 ? 'GraphAttentionLayer._derive_att_map' : 'GraphAttentionLayer._project',
    beats: [
      "What's a graph? A set of nodes, and connections between them. AASIST treats each set of nodes as fully connected: every node may exchange information with every other node.",
      "Graph attention decides how much each connection matters, and AASIST does it in an unusual way. For every pair of nodes, i and j, it multiplies their two vectors element by element. For forty-two nodes, that's a tensor of B, by forty-two, by forty-two, by sixty-four.",
      "Each of those pair vectors goes through a linear layer and a tanh, and a dot product with a learned vector turns it into a single score. [+1.2] The scores form a forty-two by forty-two map.",
      "The scores are divided by a temperature, which is two here, and a softmax across the node axis turns them into weights. [+1] A higher temperature makes the weights more even; a lower one makes them sharper.",
      "Each node's output is the weighted sum of all nodes, passed through one linear layer, plus the node's own vector passed through a second linear layer. Then batch norm and SELU. Forty-two nodes in, forty-two nodes out, sixty-four numbers each.",
      "The temporal nodes get their own graph attention layer, with exactly the same recipe: B by sixty-seven by sixty-four, in and out.",
    ],
    hud: S => S.b === 0 ? { stage: 5, shape: SHP.eS, label: 'spectral nodes' }
      : S.b === 1 ? { stage: 5, shape: S.past(1, 2) ? '({B:B}, {N:42}, {N:42}, {C:64})' : SHP.eS, label: S.past(1, 2) ? 'pair products' : 'spectral nodes' }
      : S.b === 2 ? { stage: 5, shape: S.past(2, 1) ? '({B:B}, {N:42}, {N:42}, {K:1})' : '({B:B}, {N:42}, {N:42}, {C:64})', label: S.past(2, 1) ? 'scores' : 'pair products' }
      : S.b === 3 ? { stage: 5, shape: '({B:B}, {N:42}, {N:42}, {K:1})', label: 'attention weights' }
      : S.b === 4 ? { stage: 5, shape: SHP.eS, label: 'GAT output' }
      : { stage: 5, shape: SHP.eT, label: 'temporal GAT' },
    draw(ctx, S) {
      const G = S.vis(0, 5);
      // the graph: edges carry the current weights; in beat 3 the edges into node 6, in beat 4 the edges into node 3
      if (G > 0) {
        ctx.save(); ctx.globalAlpha = G;
        const e1 = S.ps(0, 1, 0.6, 0.6), e2 = S.ps(0, 2, 0.8, 0.8);
        for (let i = 0; i < gN; i++) for (let j = i + 1; j < gN; j++) {
          const [x1, y1] = gPos(i), [x2, y2] = gPos(j);
          const few = (j - i === 1 || (i === 0 && j === 4) || (i === 2 && j === 6));
          let col = rgba(COL.H, 0.35 * (few ? Math.max(e1, e2) : e2)), lw = 1.5;
          // beat 1, first sentence: the connections get different strengths
          if (S.b === 1 && !S.past(1, 1)) { const w = 0.15 + 0.85 * Math.abs(noise(i, j, 371)); col = rgba(COL.H, 0.25 + 0.5 * w); lw = 1 + 4 * w * S.p(1, 0.8, 0.6); }
          if (S.b === 1 || S.b === 2) { if (i === PI_ && j === PJ) { col = COL.K; lw = 4; } }
          if (S.b === 3 && S.past(3, 0, 1.5) && (i === AGG || j === AGG)) { const o = i === AGG ? j : i; col = rgba(COL.K, 0.9); lw = 1 + 16 * GA[AGG][o]; }
          if (S.b === 4 && (i === AGG || j === AGG)) { const o = i === AGG ? j : i; col = rgba(COL.A, 0.9); lw = 1 + 16 * GA[AGG][o]; }
          line(ctx, x1, y1, x2, y2, col, lw);
        }
        for (let i = 0; i < gN; i++) { const [x, y] = gPos(i); const hi = (S.b <= 2 && S.b >= 1 && (i === PI_ || i === PJ)) || (S.b >= 3 && i === AGG); node(ctx, x, y, 26, hi ? COL.K : COL.N, 1, String(i + 1)); }
        txt(ctx, S.b === 0 ? 'fully connected: every pair of nodes' : '8 nodes shown · the real layer has 42', gcx, 800, { size: 24, color: COL.dim, align: 'center', alpha: S.b === 0 ? e2 : 1 });
        // beat 1, last sentence: the same product for every pair
        if (S.b === 1 && S.past(1, 2)) { const q = Math.floor((S.T(1) - S.st(1, 2)) / 0.45) % 28; let c = 0; for (let i = 0; i < gN; i++) for (let j = i + 1; j < gN; j++) { if (c++ === q) { const [x1, y1] = gPos(i), [x2, y2] = gPos(j); line(ctx, x1, y1, x2, y2, rgba(COL.K, 0.8), 3); } } }
        ctx.restore();
      }
      // beat 1: the pair vector of nodes 2 and 6
      const Pm = S.vis(1, 3);
      if (Pm > 0) {
        ctx.save(); ctx.globalAlpha = Pm;
        const vi = [0.8, -0.3, 0.5, 0.9, -0.6, 0.2], vj = [0.4, 0.7, -0.5, 0.6, -0.2, 0.9];
        const vv = S.b > 1 ? 1 : S.ps(1, 1, 0.6, 0.4);
        ctx.globalAlpha = Pm * vv * (1 - S.p(2, 0.5, 0.6));
        txt(ctx, 'node 2', 880, 250, { size: 24, weight: 700, color: COL.K });
        numRow(ctx, 980, 222, vi, 70, 44, { size: 18, d: 1 });
        txt(ctx, 'node 6', 880, 310, { size: 24, weight: 700, color: COL.K });
        numRow(ctx, 980, 282, vj, 70, 44, { size: 18, d: 1 });
        txt(ctx, '⊙', 950, 378, { size: 34, color: COL.K, align: 'center' });
        ctx.globalAlpha = Pm * vv;
        const pk = S.b > 1 ? 6 : Math.floor(clamp((S.T(1) - S.st(1, 1) - 1.2) / 2.4) * 6.99);
        numRow(ctx, 980, 350, vi.map((v, k) => k < pk ? v * vj[k] : null), 70, 44, { size: 18, d: 2, stroke: COL.K, fill: k => k < pk ? rgba(COL.K, 0.2) : 'rgba(0,0,0,0)' });
        txt(ctx, 'pair vector p₂₆ (64 numbers; 6 shown)', 1190, 424, { size: 22, color: COL.K, align: 'center', alpha: pk >= 6 ? 1 : 0 });
        ctx.globalAlpha = Pm * (1 - S.p(2, 0.5, 0.6));
        mtxt(ctx, 'all pairs: ({B:B}, {N:42}, {N:42}, {C:64})', 1190, 520, { size: 30, mono: true, align: 'center', alpha: S.ps(1, 2, 0.6) });
        txt(ctx, 'x.unsqueeze(2) * x.unsqueeze(1)', 1190, 570, { size: 24, mono: true, align: 'center', color: COL.dim, alpha: S.ps(1, 2, 0.6, 1.5) });
        ctx.restore();
      }
      // the 8×8 score map (beat 2 onward): p₂₆ → tanh(Linear) → · a → one score → cell (2, 6)
      const mx = 1470, my = 300, mc = 44;
      const Mv = S.vis(2, 4);
      if (Mv > 0) {
        ctx.save(); ctx.globalAlpha = Mv;
        const t2 = S.b === 2 ? S.T(2) - 0.6 : 99;
        const bA = clamp(t2 / 0.5) * (1 - S.p(3, 0.5));
        ctx.globalAlpha = Mv * bA;
        box(ctx, 1040, 470, 300, 70, 'tanh(Linear 64→64)', { size: 24, color: COL.H });
        box(ctx, 1040, 580, 300, 64, '· a   (learned 64-vector)', { size: 22, color: COL.H });
        arrow(ctx, 1190, 436, 1190, 466, {}); arrow(ctx, 1190, 542, 1190, 576, {});
        const pel = clamp((t2 - 0.6) / 1.8);
        if (pel > 0 && pel < 1) { const y = lerp(400, 612, easeIO(pel)); rrect(ctx, 1160, y - 12, 60, 24, 6, rgba(COL.K, 0.85), null); txt(ctx, 'p₂₆', 1190, y + 1, { size: 16, weight: 700, align: 'center', base: 'middle', color: COL.bg }); }
        const sc = clamp((t2 - 2.5) / 1.0);
        const sv = GS[PI_][PJ], cxT = mx + PJ * mc + mc / 2, cyT = my + PI_ * mc + mc / 2;
        if (sc > 0 && sc < 1) chip(ctx, lerp(1190, cxT, easeIO(sc)), lerp(680, cyT, easeIO(sc)) - 16, sv.toFixed(2), { size: 22, mono: true, align: 'center', color: COL.K, stroke: COL.K, fill: COL.bg2 });
        ctx.globalAlpha = Mv;
        // map: cell (2,6) and its mirror land first, the rest fill on "the scores form a map"
        const soft = S.b >= 3 ? 1 : 0, fillAll = S.b > 2 ? 1 : clamp((S.T(2) - S.st(2, 1) - 0.2) / 1.5);
        for (let i = 0; i < gN; i++) for (let j = 0; j < gN; j++) {
          const first = (i === PI_ && j === PJ) || (i === PJ && j === PI_);
          const on = first ? clamp((t2 - 3.4) / 0.4) : clamp(fillAll * 2 - (i + j) / (2 * gN));
          const v = soft ? GA[i][j] * 2.4 : 0.5 + 0.22 * GS[i][j];
          rrect(ctx, mx + j * mc + 2, my + i * mc + 2, mc - 4, mc - 4, 5, on > 0 ? E.mix(COL.bg2, COL.K, clamp(v) * on) : 'rgba(0,0,0,0)', rgba(COL.line, 0.8), 1);
          if (first && on > 0) txt(ctx, sv.toFixed(1), mx + j * mc + mc / 2, my + i * mc + mc / 2 + 1, { size: 15, mono: true, weight: 700, align: 'center', base: 'middle', color: COL.bg, alpha: on * (1 - soft) });
        }
        dimLeft(ctx, mx - 6, my, gN * mc, 'i', COL.N, 22); dimTop(ctx, mx, my - 6, gN * mc, 'j', COL.N, 22);
        mtxt(ctx, '8 × 8 shown · real map {N:42} × {N:42}', mx + gN * mc / 2, my + gN * mc + 44, { size: 22, align: 'center', color: COL.dim });
        txt(ctx, soft ? 'weights' : 'scores', mx + gN * mc / 2, my - 52, { size: 26, weight: 700, align: 'center', color: COL.K });
        // beat 3: one column is normalised (softmax over dim −2), then the temperature comparison
        if (S.b === 3) {
          const ca = S.p(3, 0.6, 0.6);
          ctx.globalAlpha = Mv * ca;
          rrect(ctx, mx - 3, my + AGG * mc - 3, gN * mc + 6, mc + 6, 6, null, COL.K, 4);
          txt(ctx, 'softmax along node 3’s row: sums to 1', mx + gN * mc / 2, my + gN * mc + 84, { size: 22, weight: 700, align: 'center', color: COL.K });
          const bars = (x, y, T, label, col, a) => {
            const p = rowSoft(T, AGG);
            ctx.save(); ctx.globalAlpha *= a;
            rrect(ctx, x - 14, y - 150, 8 * 22 + 28, 200, 10, COL.panel, COL.line, 1.5);
            p.forEach((v, i) => rrect(ctx, x + i * 22, y - 130 * v, 16, Math.max(2, 130 * v), 3, rgba(col, 0.85), null));
            txt(ctx, label, x + 4 * 22, y + 32, { size: 22, weight: 700, align: 'center', color: col });
            ctx.restore();
          };
          bars(950, 830, 2, 'T = 2 (this layer)', COL.K, S.p(3, 0.6, 1.4));
          const tv = S.ps(3, 1, 0.6, 0.3);
          bars(720, 830, 0.5, 'T = 0.5: sharper', COL.R, tv);
          bars(1180, 830, 100, 'T = 100: even', COL.A, S.ps(3, 1, 0.6, 1.6));
          txt(ctx, 'softmax(score / T)', 1045, 610, { size: 28, mono: true, align: 'center', color: COL.text, alpha: ca });
        }
        ctx.restore();
      }
      // beat 4: aggregation into node 3, drawn as a weighted sum of rows
      const O = S.vis(4, 5);
      if (O > 0) {
        ctx.save(); ctx.globalAlpha = O;
        const x0 = 880, y0 = 220, cw = 46, ch = 40;
        txt(ctx, 'X (8 nodes × 64; 6 shown) · node 3’s weights, sum 1.00', x0 + 3 * cw, y0 - 18, { size: 22, weight: 700, align: 'center' });
        for (let i = 0; i < gN; i++) {
          const w = GA[AGG][i], a = S.p(4, 0.5, 0.6 + i * 0.12);
          ctx.globalAlpha = O * a;
          chip(ctx, x0 - 16, y0 + i * ch + ch / 2 - 15, GAP[i].toFixed(2), { size: 18, mono: true, align: 'right', color: COL.A, stroke: rgba(COL.A, 0.6), fill: COL.bg2, padX: 8, padY: 5 });
          ctx.globalAlpha = O * a * (0.25 + 0.75 * clamp(w * 4));
          cells(ctx, x0, y0 + i * ch, 1, 6, cw, ch - 4, (r, c) => vcol(GX[i][c], 0.9), 3);
        }
        ctx.globalAlpha = O * S.p(4, 0.6, 2.5);
        arrow(ctx, x0 + 6 * cw + 16, y0 + 4 * ch, x0 + 6 * cw + 90, y0 + 4 * ch, { color: COL.A });
        txt(ctx, 'Σ', x0 + 6 * cw + 53, y0 + 4 * ch - 18, { size: 28, weight: 800, align: 'center', color: COL.A });
        const ax = x0 + 6 * cw + 100;
        cells(ctx, ax, y0 + 4 * ch - 18, 1, 6, 34, 36, (r, c) => vcol(GX.reduce((s, row, j) => s + GA[AGG][j] * row[c], 0), 0.95), 3);
        txt(ctx, 'A·X, row 3', ax + 102, y0 + 4 * ch + 50, { size: 22, weight: 700, align: 'center', color: COL.A });
        const b1 = S.p(4, 0.6, 4);
        ctx.globalAlpha = O * b1;
        box(ctx, 1520, y0 + 4 * ch - 40, 180, 72, ['W₁', 'proj_with_att'], { size: 30, color: COL.A });
        arrow(ctx, ax + 210, y0 + 4 * ch, 1514, y0 + 4 * ch, { color: COL.A });
        const b2 = S.ps(4, 0, 0.6, 7.5);
        ctx.globalAlpha = O * b2;
        cells(ctx, ax, y0 + 6.6 * ch, 1, 6, 34, 36, (r, c) => vcol(GX[AGG][c], 0.95), 3);
        txt(ctx, 'x₃ itself', ax + 102, y0 + 6.6 * ch + 66, { size: 22, weight: 700, align: 'center', color: COL.B });
        box(ctx, 1520, y0 + 6.6 * ch - 22, 180, 72, ['W₂', 'proj_without_att'], { size: 30, color: COL.B });
        arrow(ctx, ax + 210, y0 + 6.6 * ch + 18, 1514, y0 + 6.6 * ch + 18, { color: COL.B });
        const b3 = S.ps(4, 1, 0.6);
        ctx.globalAlpha = O * b3;
        ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1790, y0 + 5.3 * ch, 24, 0, 7); ctx.stroke();
        txt(ctx, '+', 1790, y0 + 5.3 * ch + 2, { size: 32, weight: 700, align: 'center', base: 'middle' });
        arrow(ctx, 1704, y0 + 4 * ch, 1770, y0 + 5.3 * ch - 16, {}); arrow(ctx, 1704, y0 + 6.6 * ch + 14, 1770, y0 + 5.3 * ch + 16, {});
        txt(ctx, '→ BatchNorm1d → SELU → out₃', 1810, 640, { size: 24, weight: 700, align: 'right', color: COL.text });
        ctx.globalAlpha = O * S.ps(4, 2, 0.6);
        mtxt(ctx, '({B:B}, {N:42}, {C:64})  →  ({B:B}, {N:42}, {C:64})      12,672 params', 1290, 860, { size: 28, mono: true, align: 'center' });
        ctx.restore();
      }
      const T = S.p(5, 0.7, 0.35);
      if (T > 0) {
        ctx.save(); ctx.globalAlpha = T;
        box(ctx, 530, 260, 860, 150, ['GAT_layer_S', 'spectral: (B, 42, 64) → (B, 42, 64)'], { size: 34, color: COL.F });
        box(ctx, 530, 460, 860, 150, ['GAT_layer_T', 'temporal: (B, 67, 64) → (B, 67, 64)'], { size: 34, color: COL.T, alpha: S.p(5, 0.6, 1.2) });
        txt(ctx, 'same design, separate weights, temperature 2', W / 2, 690, { size: 30, align: 'center', color: COL.dim, alpha: S.p(5, 0.6, 2.5) });
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
      "Not every node is useful, so graph pooling keeps only the best ones. [+1] A linear layer gives each node a single score, and a sigmoid squashes it between zero and one.",
      "The top half of the nodes by score are kept, and each kept node is multiplied by its score. Forty-two spectral nodes become twenty-one. Sixty-seven temporal nodes become thirty-three, because the count is rounded down.",
      "So now we hold B by twenty-one by sixty-four spectral nodes, and B by thirty-three by sixty-four temporal nodes. One detail: the kept nodes come out sorted by score, not in their original order.",
    ],
    hud: S => ({ stage: 5, shape: S.b === 0 || !S.past(1, 1) ? SHP.nodes : S.past(1, 2) ? '({B:B}, {N:21}, {C:64}) · ({B:B}, {N:33}, {C:64})' : '({B:B}, {N:21}, {C:64}) · ({B:B}, {N:67}, {C:64})', label: S.b >= 1 && S.past(1, 1) ? 'after pooling' : 'after GAT' }),
    draw(ctx, S) {
      const n = 14, gap = 110, x0 = (W - (n - 1) * gap) / 2, y = 470;
      const order = PS.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]).map(p => p[1]);
      const keep = new Set(order.slice(0, n / 2));
      const t = easeIO(S.l(1, 1.4, 1.5)), mul = easeIO(S.l(1, 0.8, S.st(1, 0) + 3.2));
      for (let i = 0; i < n; i++) {
        const kept = keep.has(i), rank = order.indexOf(i);
        // topk hands the kept nodes back in score order
        const tx = kept ? x0 + rank * gap + (n / 2) * gap / 2 : x0 + i * gap;
        const x = lerp(x0 + i * gap, tx, kept ? t : 0), a = kept ? 1 : 1 - t;
        const r = 30 * (kept ? lerp(1, 0.45 + 0.55 * PS[i], mul) : 1);
        node(ctx, x, y, r, COL.N, a * S.p(0, 0.5, i * 0.08));
        const sa = S.ps(0, 1, 0.5, 0.6 + i * 0.1) * a;
        if (sa > 0) {
          ctx.save(); ctx.globalAlpha = sa;
          rrect(ctx, x - 16, y + 50, 32, 150, 5, COL.panel, COL.line, 1);
          rrect(ctx, x - 16, y + 200 - 150 * PS[i], 32, 150 * PS[i], 5, kept && S.b >= 1 ? COL.K : rgba(COL.dim, 0.7), null);
          txt(ctx, PS[i].toFixed(2), x, y + 235, { size: 22, mono: true, align: 'center', color: COL.text });
          ctx.restore();
        }
      }
      txt(ctx, 'score = sigmoid(Linear 64→1 (node))', W / 2, 290, { size: 30, mono: true, align: 'center', alpha: S.ps(0, 1, 0.6) });
      if (mul > 0) txt(ctx, 'kept node × its score', W / 2, 380, { size: 26, weight: 700, align: 'center', color: COL.K, alpha: mul });
      mtxt(ctx, 'keep ⌊ N · 0.5 ⌋:   {N:42} → {N:21}', W / 2 - 230, 800, { size: 34, mono: true, align: 'center', alpha: S.ps(1, 1, 0.6) });
      mtxt(ctx, '{N:67} → {N:33}', W / 2 + 280, 800, { size: 34, mono: true, align: 'center', alpha: S.ps(1, 2, 0.6) });
      const d = S.p(2, 0.6, 0.3);
      if (d > 0) {
        mtxt(ctx, 'spectral ({B:B}, {N:21}, {C:64})      temporal ({B:B}, {N:33}, {C:64})', W / 2, 880, { size: 30, mono: true, align: 'center', alpha: d });
        txt(ctx, 'topk returns the kept nodes sorted by score, not in row or time order', W / 2, 935, { size: 26, align: 'center', color: COL.K, alpha: S.ps(2, 1, 0.6) });
      }
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
      "The layer projects everything down to thirty-two numbers per node. Then it splits the stack back apart: B by thirty-three by thirty-two temporal nodes, B by twenty-one by thirty-two spectral nodes, and a master of B by one by thirty-two.",
    ],
    hud: S => S.b === 0 || (S.b === 1 && !S.past(1, 1)) ? { stage: 6, shape: '({B:B}, {N:33}, {C:64}) · ({B:B}, {N:21}, {C:64})', label: 'temporal · spectral' }
      : S.b === 1 ? { stage: 6, shape: '({B:B}, {N:54}, {C:64})', label: 'stacked' }
      : S.b === 2 ? { stage: 6, shape: '({B:B}, {N:54}, {N:54}, {K:1})', label: 'block scores' }
      : S.b === 3 ? { stage: 6, shape: '({B:B}, 1, {C:64})', label: 'master node' }
      : { stage: 6, shape: S.past(4, 1) ? '({B:B}, {N:33}, {C:32}) · ({B:B}, {N:21}, {C:32}) · ({B:B}, 1, {C:32})' : '({B:B}, {N:54}, {C:32})', label: S.past(4, 1) ? 'split back' : 'projected' },
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const mg = easeIO(S.l(1, 1.6, S.st(1, 0) + 2.2));
        const pa = S.ps(1, 0, 0.6, 0.3) * (1 - mg);
        // each type passes through its own projection on the way into the stack
        box(ctx, 260, 470, 380, 70, 'proj_type1: Linear (temporal)', { size: 24, color: COL.T, alpha: pa });
        box(ctx, 1200, 470, 380, 70, 'proj_type2: Linear (spectral)', { size: 24, color: COL.F, alpha: pa });
        for (let i = 0; i < 11; i++) node(ctx, lerp(260 + (i % 6) * 70, 200 + i * 44, mg), lerp(330 + Math.floor(i / 6) * 70, 640, mg), 20, COL.T, 1);
        for (let i = 0; i < 7; i++) node(ctx, lerp(1250 + (i % 4) * 70, 200 + (11 + i) * 44 + 30, mg), lerp(330 + Math.floor(i / 4) * 70, 640, mg), 20, COL.F, 1);
        const og = S.ps(0, 1, 0.8, 1.2) * (1 - mg);
        if (og > 0) {
          ctx.save(); ctx.globalAlpha = A * og; ctx.setLineDash([10, 8]);
          rrect(ctx, 200, 230, 1360, 230, 20, null, rgba(COL.N, 0.9), 2.5); ctx.restore();
          ctx.save(); ctx.globalAlpha = A * og * 0.5; ctx.strokeStyle = COL.N; ctx.lineWidth = 1.2;
          for (let i = 0; i < 11; i += 2) for (let j = 0; j < 7; j += 2) { ctx.beginPath(); ctx.moveTo(260 + (i % 6) * 70, 330 + Math.floor(i / 6) * 70); ctx.lineTo(1250 + (j % 4) * 70, 330 + Math.floor(j / 4) * 70); ctx.stroke(); }
          ctx.restore();
          txt(ctx, 'one graph', 880, 500, { size: 28, weight: 800, align: 'center', color: COL.N, alpha: A * og });
        }
        ctx.globalAlpha = A * (1 - mg);
        mtxt(ctx, 'temporal nodes ({N:33} × {C:64})', 440, 270, { size: 26, weight: 700, align: 'center' });
        mtxt(ctx, 'spectral nodes ({N:21} × {C:64})', 1350, 270, { size: 26, weight: 700, align: 'center' });
        ctx.globalAlpha = A * mg;
        brace(ctx, 180, 1030, 680, COL.N, true);
        mtxt(ctx, 'proj_type1(T) ‖ proj_type2(S)  →  ({B:B}, {N:54}, {C:64})', 605, 760, { size: 28, mono: true, align: 'center' });
        txt(ctx, '33 temporal + 21 spectral = 54 nodes', 605, 810, { size: 24, color: COL.dim, align: 'center' });
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
        dimLeft(ctx, x - 6, y, n1 * cs, '{N:33} T', COL.T, 22); dimLeft(ctx, x - 6, y + n1 * cs, (n - n1) * cs, '{N:21} S', COL.F, 22);
        // each block lights, with its legend row, as the voice names it
        const blk = [[0, 0, n1, n1], [n1, n1, n - n1, n - n1], [0, n1, n1, n - n1]].map((b, i) => [b, S.ps(2, 0, 0.5, 3.6 + i * 1.5)]);
        blk.forEach(([[r0, c0, h, w], a], i) => { if (a > 0) { rrect(ctx, x + c0 * cs - 2, y + r0 * cs - 2, w * cs + 4, h * cs + 4, 4, null, rgba(COL.K, a), 4); if (i === 2) rrect(ctx, x + r0 * cs - 2, y + c0 * cs - 2, h * cs + 4, w * cs + 4, 4, null, rgba(COL.K, a), 4); } });
        const lab = [['att_weight11', 'T–T', COL.T, 1060, 320], ['att_weight22', 'S–S', COL.F, 1060, 420], ['att_weight12', 'T–S and S–T', COL.N, 1060, 520]];
        txt(ctx, 'each pair: (64) → tanh(Linear 64 → 32) → · att_weight (32 → 1)', 1060, 600, { size: 22, color: COL.dim, alpha: S.ps(2, 1, 0.6) });
        lab.forEach((l, i) => {
          const a = blk[i][1];
          rrect(ctx, l[3], l[4] - 34, 50, 50, 8, rgba(l[2], 0.5 * a), l[2], 2);
          mtxt(ctx, `${l[1]}:  ${l[0]}  (32 → 1)`, l[3] + 70, l[4], { size: 26, alpha: a });
        });
        txt(ctx, 'softmax(score / 100) → soft, spread-out weights', 1060, 660, { size: 26, color: COL.K, alpha: S.ps(2, 2, 0.6) });
        ctx.restore();
      }
      const Ms = S.vis(3, 4);
      if (Ms > 0) {
        ctx.save(); ctx.globalAlpha = Ms;
        const cx = 960, cy = 500;
        for (let i = 0; i < 18; i++) {
          const ang = -Math.PI / 2 + i * 2 * Math.PI / 18, x = cx + 360 * Math.cos(ang), y = cy + 260 * Math.sin(ang);
          const a = S.p(3, 0.3, 1 + i * 0.12);
          line(ctx, x, y, cx, cy, rgba(COL.H, 0.5 * a), 2);
          node(ctx, x, y, 18, i < 11 ? COL.T : COL.F, 1);
        }
        ctx.fillStyle = rgba(COL.H, 0.35); ctx.strokeStyle = COL.H; ctx.lineWidth = 4;
        ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 22 : 50, a = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } ctx.closePath(); ctx.fill(); ctx.stroke();
        txt(ctx, 'master node', cx, cy + 90, { size: 26, weight: 800, align: 'center', color: COL.H });
        txt(ctx, 'learned (1, 1, 64) → attends to all 54 nodes', cx, 860, { size: 26, align: 'center', color: COL.dim });
        txt(ctx, 'new master = W(Σⱼ αⱼ xⱼ) + W′(master)', cx, 910, { size: 26, mono: true, align: 'center', color: COL.H, alpha: S.p(3, 0.6, 4) });
        txt(ctx, 'the master reads all 54 nodes; in this layer the nodes do not read the master', cx, 950, { size: 22, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 5) });
        ctx.restore();
      }
      const O = S.p(4, 0.7, 0.35);
      if (O > 0) {
        ctx.save(); ctx.globalAlpha = O;
        mat(ctx, 220, 330, 90, 420, { rows: 18, cols: 3, seed: 411, left: ['{N:54}', COL.N], top: ['{C:64}', COL.C], title: 'in' });
        arrow(ctx, 350, 540, 490, 540, { color: COL.H });
        box(ctx, 500, 470, 330, 140, ['W₁(A·X) + W₂X', 'BN · SELU · 64 → 32'], { size: 31, color: COL.H });
        arrow(ctx, 840, 540, 940, 540, { color: COL.H });
        // the projected stack (54 × 32) splits: 33 temporal rows go up, 21 spectral rows go down
        const sp = easeIO(S.l(4, 1.2, S.st(4, 1) + 0.6)), h = 420, hT = h * 33 / 54, hS = h * 21 / 54;
        mat(ctx, 960, 330 - 40 * sp, 60, hT, { rows: 11, cols: 2, seed: 412, stroke: COL.T, top: ['{C:32}', COL.C] });
        mat(ctx, 960, 330 + hT + 40 * sp, 60, hS, { rows: 7, cols: 2, seed: 413, stroke: COL.F });
        mtxt(ctx, 'temporal  ({B:B}, {N:33}, {C:32})', 1070, 330 - 40 * sp + hT / 2 + 10, { size: 28, mono: true, alpha: S.ps(4, 1, 0.6, 1.2) });
        mtxt(ctx, 'spectral  ({B:B}, {N:21}, {C:32})', 1070, 330 + hT + 40 * sp + hS / 2 + 10, { size: 28, mono: true, alpha: S.ps(4, 1, 0.6, 3.5) });
        const ma = S.ps(4, 1, 0.6, 6);
        if (ma > 0) {
          ctx.globalAlpha = O * ma;
          const my = lerp(760, 860, easeIO(ma));
          rrect(ctx, 960, my - 22, 60, 30, 6, rgba(COL.H, 0.5), COL.H, 2);
          mtxt(ctx, 'master    ({B:B}, 1, {C:32})', 1070, my, { size: 28, mono: true });
        }
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
    hud: S => ({ stage: 6, shape: S.b === 0 && !S.past(0, 1) ? '({B:B}, {N:33}, {C:32}) · ({B:B}, {N:21}, {C:32})' : '({B:B}, {N:16}, {C:32}) · ({B:B}, {N:10}, {C:32}) · ({B:B}, 1, {C:32})', label: S.b === 2 && S.past(2, 1) ? 'after max' : S.b === 0 && !S.past(0, 1) ? 'after HS-GAL 1' : 'one branch' }),
    draw(ctx, S) {
      // one input forks into two branches that meet again at an element-wise max
      const items = [['HS-GAL', '64 → 32'], ['pool', 'T 16, S 10'], ['HS-GAL', '32 → 32, + res']];
      const bw = 270, bh = 120, xs = [500, 840, 1180], ys = [250, 560];
      const row = (y, a, hl, tag) => {
        ctx.save(); ctx.globalAlpha *= a;
        items.forEach((it, i) => {
          box(ctx, xs[i], y, bw, bh, it, { size: 32, color: i === 1 ? COL.text : COL.H, stroke: hl === i ? COL.A : COL.line, glow: hl === i ? COL.A : null });
          if (i) arrow(ctx, xs[i - 1] + bw + 6, y + bh / 2, xs[i] - 6, y + bh / 2, { head: 10 });
        });
        txt(ctx, tag, xs[0], y - 20, { size: 24, weight: 700, color: COL.dim });
        ctx.restore();
      };
      const a1 = S.p(0, 0.6, 0.2), a2 = S.ps(2, 0, 0.8, 0.5);
      box(ctx, 110, 380, 280, 170, ['input', 'T 33, S 21 · ×64'], { size: 32, alpha: a1 });
      parrow(ctx, [[392, 440], [450, 440], [450, ys[0] + bh / 2], [494, ys[0] + bh / 2]], { alpha: a1, lw: 2 });
      parrow(ctx, [[392, 490], [450, 490], [450, ys[1] + bh / 2], [494, ys[1] + bh / 2]], { alpha: a2, lw: 2 });
      row(ys[0], a1, S.b === 0 ? (S.past(0, 0, 1.5) ? 1 : 0) : S.b === 1 ? 2 : null, 'branch 1  (master 1)');
      row(ys[1], a2, null, 'branch 2  (master 2, separate weights)');
      mtxt(ctx, 'pool × 0.5:  {N:21} → {N:10}    {N:33} → {N:16}', xs[1] + bw / 2, ys[0] + bh + 46, { size: 26, mono: true, align: 'center', alpha: S.ps(0, 1, 0.6) * (1 - S.p(1, 0.5)) });
      if (S.b >= 1) {
        const r = S.p(1, 0.6, 2.5) * (1 - 0.7 * a2);
        ctx.save(); ctx.globalAlpha = r;
        parrow(ctx, [[xs[2] - 30, ys[0] + bh / 2], [xs[2] - 30, ys[0] - 40], [xs[2] + bw + 30, ys[0] - 40], [xs[2] + bw + 30, ys[0] + bh / 2], [xs[2] + bw + 6, ys[0] + bh / 2]], { color: COL.B, lw: 3 });
        txt(ctx, 'out = out + HS-GAL(out)', xs[2] + bw / 2, ys[0] - 56, { size: 24, color: COL.B, align: 'center', weight: 700 });
        const mu = S.ps(1, 1, 0.6);
        if (mu > 0) {
          ctx.save(); ctx.globalAlpha = r * mu;
          const mx = xs[2] + bw / 2 - 60, my = ys[0] + bh + 30;
          rrect(ctx, mx, my, 120, 40, 10, rgba(COL.H, 0.25), COL.H, 2);
          txt(ctx, 'master', mx + 60, my + 27, { size: 22, weight: 700, align: 'center', color: COL.H });
          parrow(ctx, [[mx + 120, my + 20], [mx + 160, my + 20], [mx + 160, my - 6], [mx + 128, my - 6]], { color: COL.B, lw: 2 });
          txt(ctx, '+ residual', mx + 170, my + 26, { size: 20, color: COL.B, weight: 700 });
          ctx.restore();
        }
        ctx.restore();
      }
      const m = S.ps(2, 1, 0.6);
      if (m > 0) {
        ctx.save(); ctx.globalAlpha = m;
        arrow(ctx, xs[2] + bw + 8, ys[0] + bh / 2, 1580, 440, {}); arrow(ctx, xs[2] + bw + 8, ys[1] + bh / 2, 1580, 490, {});
        box(ctx, 1590, 400, 200, 130, ['max', 'element-wise'], { size: 34, color: COL.K });
        // element-wise max on four numbers
        const v1 = [0.2, 0.9, -0.1, 0.4], v2 = [0.5, 0.3, 0.0, 0.1], vm = v1.map((v, i) => Math.max(v, v2[i]));
        const yv = 760, ex = S.ps(2, 1, 0.6, 1.5);
        ctx.globalAlpha = m * ex;
        txt(ctx, 'branch 1', 500, yv + 32, { size: 24, weight: 700, color: COL.dim, align: 'right' });
        numRow(ctx, 520, yv, v1, 90, 50, { size: 22, d: 1, hl: i => v1[i] >= v2[i] });
        txt(ctx, 'branch 2', 500, yv + 92, { size: 24, weight: 700, color: COL.dim, align: 'right' });
        numRow(ctx, 520, yv + 60, v2, 90, 50, { size: 22, d: 1, hl: i => v2[i] > v1[i] });
        arrow(ctx, 900, yv + 55, 990, yv + 55, { color: COL.K });
        numRow(ctx, 1000, yv + 30, vm, 90, 50, { size: 22, d: 1, stroke: COL.K });
        txt(ctx, 'max, position by position', 1180, yv + 112, { size: 22, align: 'center', color: COL.K });
        ctx.globalAlpha = m * S.ps(2, 2, 0.6);
        mtxt(ctx, 'T ({B:B}, {N:16}, {C:32})    S ({B:B}, {N:10}, {C:32})    master ({B:B}, 1, {C:32})', W / 2, 945, { size: 26, mono: true, align: 'center' });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 11 readout
  S_.push({
    id: 'a_readout', chapter: 11, title: 'Readout and training',
    code: S => S.b < 2 ? 'torch.cat([T_max, T_avg, S_max, S_avg, master])' : 'self.out_layer = nn.Linear(160, 2)',
    beats: [
      "The readout turns sets of nodes into one fixed-size vector. For the temporal nodes, take the largest absolute value over the nodes, and the mean over the nodes. That's two vectors of thirty-two.",
      "Do the same for the spectral nodes, and add the master node. Five vectors of thirty-two, concatenated: B by one hundred and sixty.",
      "After dropout, a linear layer maps one hundred and sixty to two logits: B by two. A softmax turns them into probabilities; class zero is spoof, and class one is bona fide. [+0.5] Training uses cross-entropy, weighted point one for spoof and point nine for bona fide. [+0.5] The optimizer is Adam, with a learning rate of one in a million, batches of fourteen clips, and RawBoost data augmentation.",
      "Notice that the node counts never reach the classifier. Max and mean remove the node axis, so the readout always produces one hundred and sixty numbers, however many nodes survived pooling.",
    ],
    hud: S => ({ stage: 7, shape: S.b === 0 ? (S.past(0, 2) ? '({B:B}, {C:32}) × 2' : '({B:B}, {N:16}, {C:32})') : S.b === 1 ? (S.past(1, 1) ? '({B:B}, {C:160})' : '({B:B}, {C:32}) × 5') : '({B:B}, {K:2})', label: S.b >= 2 ? 'logits' : 'readout' }),
    draw(ctx, S) {
      const segs = [['T_max', COL.T], ['T_avg', COL.T], ['S_max', COL.F], ['S_avg', COL.F], ['master', COL.H]];
      const segX = i => 200 + i * 300, segY = 620;
      // sources: their node axis collapses into the readout vectors
      const src = [[0, 'out_T', 16, COL.T, [0, 1]], [1, 'out_S', 10, COL.F, [2, 3]], [2, 'master', 1, COL.H, [4]]];
      const SA = S.vis(0, 2);
      if (SA > 0) src.forEach(([k, name, n, col, to]) => {
        const a = k === 0 ? S.p(0, 0.6, 0.3) : S.ps(1, 0, 0.6, k === 1 ? 0.2 : 1.8);
        if (a <= 0) return;
        const x = [260, 860, 1460][k], y = 230, h = n * 14, w = 160;
        ctx.save(); ctx.globalAlpha = SA * a;
        mat(ctx, x, y, w, Math.max(14, h), { rows: Math.max(1, n), cols: 10, seed: 421 + k, left: [n > 1 ? `{N:${n}}` : '1', COL.N], top: ['{C:32}', COL.C], title: name, titleSize: 26 });
        to.forEach((s, q) => {
          const t0 = k === 0 ? S.st(0, 1) + 0.3 + q * 1.4 : S.st(1, 0) + (k === 1 ? 0.6 + q * 1.0 : 2.2);
          const u = clamp(((k === 0 ? S.T(0) : S.T(1)) - t0) / 1.2);
          if (u > 0 && u < 1) {
            // the block of rows squashes down to one row as it travels to its slot
            const e = easeIO(u), gx = lerp(x, segX(s) + 65, e), gy = lerp(y, segY, e), gh = lerp(Math.max(14, h), 60, e);
            rrect(ctx, gx, gy, w, gh, 6, rgba(col, 0.25), col, 2);
          }
          txt(ctx, ['max |·| over nodes', 'mean over nodes', 'max |·| over nodes', 'mean over nodes', 'as is'][s], x + w / 2, y + Math.max(14, h) + 50 + q * 32, { size: 22, mono: true, align: 'center', color: col, alpha: clamp(u * 3) });
        });
        ctx.restore();
      });
      segs.forEach((sg, i) => {
        const t0 = i < 2 ? S.st(0, 1) + 1.5 + i * 1.4 : S.st(1, 0) + [1.8, 2.8, 3.4][i - 2];
        const a = i < 2 ? S.p(0, 0.4, t0) : S.p(1, 0.4, t0);
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a;
        rrect(ctx, segX(i), segY, 290, 60, 8, rgba(sg[1], 0.3), sg[1], 2);
        txt(ctx, sg[0] + '  · 32', segX(i) + 145, segY + 38, { size: 26, weight: 700, align: 'center', color: sg[1] });
        ctx.restore();
      });
      const c = S.ps(1, 1, 0.6, 0.3);
      if (c > 0) { ctx.save(); ctx.globalAlpha = c; dimBottom(ctx, 200, 700, 1490, 'concat → ({B:B}, {C:160})', COL.C, 28); ctx.restore(); }
      // beat 2: the classifier, then the training recipe one row per phrase
      const h = S.p(2, 0.7, 0.35);
      if (h > 0) {
        ctx.save(); ctx.globalAlpha = h;
        rrect(ctx, 150, 200, 820, 340, 14, 'rgba(10,14,22,0.96)', COL.line, 2);
        mtxt(ctx, '{C:160} → dropout(0.5) → Linear 160 → 2', 180, 255, { size: 28, mono: true });
        txt(ctx, 'logits', 190, 330, { size: 24, weight: 700, color: COL.dim });
        numRow(ctx, 300, 300, [-1.3, 0.7], 110, 52, { size: 24, d: 1 });
        const sm = S.ps(2, 1, 0.6);
        ctx.globalAlpha = h * sm;
        arrow(ctx, 540, 326, 620, 326, {}); txt(ctx, 'softmax', 580, 304, { size: 20, align: 'center', color: COL.dim });
        [['spoof (0)', 0.12, COL.R], ['bona fide (1)', 0.88, COL.B]].forEach((p, i) => {
          const y = 300 + i * 100;
          txt(ctx, `${p[0]}  ${p[1].toFixed(2)}`, 640, y - 10, { size: 22, weight: 700, color: p[2] });
          rrect(ctx, 640, y, 300 * p[1] * sm, 40, 6, rgba(p[2], 0.8), null);
        });
        ctx.globalAlpha = h;
        ctx.globalAlpha = h * S.ps(2, 2, 0.6);
        rrect(ctx, 1030, 200, 760, 340, 14, COL.panel, COL.line, 2);
        txt(ctx, 'training', 1060, 250, { size: 28, weight: 800 });
        ctx.globalAlpha = h;
        const R = [['loss: cross-entropy', 2], ['class weights: spoof 0.1 · bona fide 0.9', 2], ['Adam · learning rate 1e-6', 3], ['14 clips · RawBoost (filtering + noise)', 3]];
        // dropout: during training, a random half of the 160 inputs is zeroed
        cells(ctx, 190, 490, 1, 20, 30, 22, (r, c) => noise(c, 7, 441) > 0 ? 'rgba(90,100,120,0.35)' : vcol(noise(c, 2, 442), 0.9), 2);
        txt(ctx, 'dropout: half zeroed, training only', 190, 534, { size: 20, color: COL.dim });
        R.forEach(([s, sn], i) => txt(ctx, s, 1060, 310 + i * 56, { size: 26, alpha: S.ps(2, sn, 0.6, (i % 2) * 2.2) }));
        ctx.restore();
      }
      // beat 3: any node count → the same 160
      const d = S.p(3, 0.6, 0.3);
      if (d > 0) {
        ctx.save(); ctx.globalAlpha = d;
        txt(ctx, 'max and mean remove the node axis → always 160 numbers', W / 2, 850, { size: 32, weight: 700, align: 'center', color: COL.A });
        [[6, 420], [3, 1180]].forEach(([k, x], q) => {
          const a = S.ps(3, 1, 0.6, q * 1.2);
          ctx.globalAlpha = d * a;
          for (let i = 0; i < k; i++) node(ctx, x + i * 34, 910, 12, COL.N);
          arrow(ctx, x + k * 34, 910, x + k * 34 + 70, 910, {});
          cells(ctx, x + k * 34 + 80, 898, 1, 10, 14, 24, (r, c) => vcol(noise(c, q, 431), 0.9), 2);
          txt(ctx, `${k} nodes → 32`, x + k * 34 + 240, 918, { size: 22, color: COL.dim });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 12 original AASIST
  const SINC = [[0.03, 0.08], [0.12, 0.2], [0.3, 0.42], [0.6, 0.8]];   // band edges as a fraction of 8 kHz
  S_.push({
    id: 'a_orig', chapter: 12, title: 'The original AASIST, for comparison',
    code: 'refs/aasist/models/AASIST.py',
    beats: [
      "For comparison, here's the original AASIST, which reads raw audio directly. Its first layer is a sinc convolution: seventy band-pass filters, each one hundred and twenty-nine samples long, applied to the waveform. That gives B by seventy by sixty-four thousand four hundred and seventy-two.",
      "The absolute value and a three by three max pool give B by one by twenty-three by twenty-one thousand four hundred and ninety. Here the height really is frequency: seventy filter bands, pooled down to twenty-three.",
      "Its residual blocks each end with a max pool that divides the width by three. So the time axis shrinks from twenty-one thousand four hundred and ninety, to seven thousand one hundred and sixty-three, and on down to twenty-nine. The encoder output is B by sixty-four by twenty-three by twenty-nine.",
      "From there, the graph part follows the same design, just with fewer nodes: twenty-three spectral and twenty-nine temporal, pooled to eleven and twenty. The whole original model has about two hundred and ninety-eight thousand parameters, and trains from scratch.",
    ],
    hud: S => S.b === 0 ? { stage: 0, stageName: S.past(0, 1) ? 'Sinc conv' : 'Waveform', shape: S.past(0, 2) ? '({B:B}, {C:70}, {T:64472})' : '({B:B}, {T:64600})', label: 'original AASIST' }
      : S.b === 1 ? { stage: 2, stageName: 'Pool 3×3', shape: '({B:B}, {C:1}, {F:23}, {T:21490})', label: 'original AASIST' }
      : S.b === 2 ? { stage: 3, stageName: 'ResBlocks', shape: S.past(2, 2) ? '({B:B}, {C:64}, {F:23}, {T:29})' : '({B:B}, {C:1}, {F:23}, {T:21490})', label: 'original AASIST' }
      : { stage: 5, stageName: 'Graph', shape: S.past(3, 0, 4) ? '({B:B}, {N:11}, {C:64}) · ({B:B}, {N:20}, {C:64})' : '({B:B}, {N:23}, {C:64}) · ({B:B}, {N:29}, {C:64})', label: 'original AASIST' },
    draw(ctx, S) {
      // beat 0: the waveform, a few band-pass filters, and the 70-row output built row by row
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        rrect(ctx, 140, 190, 760, 120, 12, COL.panel, COL.line, 2);
        drawWave(ctx, 160, 250, 720, 90, { lw: 1.1 });
        txt(ctx, 'raw waveform  (B, 64600)', 160, 180, { size: 22, weight: 700, color: COL.dim });
        const fa = S.ps(0, 1, 0.6);
        ctx.globalAlpha = A * fa;
        txt(ctx, 'sinc band-pass filters (4 of 70), 129 taps each', 140, 372, { size: 24, weight: 700, color: COL.K });
        SINC.forEach(([f1, f2], k) => {
          const y = 420 + k * 105, fc = (f1 + f2) / 2, bwd = f2 - f1;
          ctx.strokeStyle = COL.K; ctx.lineWidth = 2; ctx.beginPath();
          for (let i = 0; i <= 129; i++) { const n = i - 64, v = n === 0 ? 1 : Math.sin(Math.PI * bwd * n) / (Math.PI * bwd * n) * Math.cos(2 * Math.PI * fc * n * 0.5) * Math.exp(-n * n / 2400); const X = 160 + i * 2.4, Y = y - v * 34; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
          ctx.stroke();
          line(ctx, 520, y + 30, 880, y + 30, COL.faint, 1.5);
          rrect(ctx, 520 + f1 * 360, y - 10, (f2 - f1) * 360, 40, 4, rgba(COL.K, 0.4), COL.K, 1.5);
        });
        txt(ctx, '0', 520, 790, { size: 18, color: COL.faint, mono: true, align: 'center' }); txt(ctx, '8 kHz', 880, 790, { size: 18, color: COL.faint, mono: true, align: 'center' });
        const rows = clamp((S.T(0) - S.st(0, 1) - 2) / 4);
        ctx.globalAlpha = A * fa;
        arrow(ctx, 910, 520, 990, 520, { color: COL.K });
        for (let r = 0; r < 35; r++) if (r / 35 <= rows) cells(ctx, 1000, 200 + r * 12, 1, 60, 760 / 60, 11, (q, c) => scol(clamp(0.25 + 0.6 * Math.abs(noise(r, c, 451)) * Math.exp(-((r - 10 - 5 * Math.sin(c / 9)) ** 2) / 90))), 0);
        rrect(ctx, 998, 198, 764, 424, 6, null, COL.line, 1.5);
        dimLeft(ctx, 994, 200, 420, '{C:70} bands', COL.C, 22);
        mtxt(ctx, '({B:B}, {C:70}, {T:64472})     64600 − 129 + 1 = 64472', 1380, 680, { size: 26, mono: true, align: 'center', alpha: S.ps(0, 2, 0.6) });
        // beat 1: |·| and 3×3 max-pool: the image shrinks; height is frequency here
        const pb = S.p(1, 0.8, 0.5);
        if (pb > 0) {
          ctx.globalAlpha = A * pb;
          rrect(ctx, 1000, 740, 760 / 3, 420 / 3, 6, rgba(COL.F, 0.15), COL.F, 2);
          cells(ctx, 1004, 744, 12, 20, 245 / 20, 132 / 12, (r, c) => scol(clamp(0.3 + 0.6 * Math.abs(noise(r, c, 452)))), 0);
          mtxt(ctx, '|·| → max-pool 3×3 → BN → SELU', 1290, 770, { size: 22, mono: true });
          mtxt(ctx, '→ ({B:B}, {C:1}, {F:23}, {T:21490})', 1290, 806, { size: 22, mono: true });
          mtxt(ctx, 'height = frequency: {F:70} bands → {F:23}', 1290, 840, { size: 24, alpha: S.ps(1, 1, 0.6) });
        }
        ctx.restore();
      }
      // beat 2: the width shrinks by 3 in every block
      const L = [21490, 7163, 2387, 795, 265, 88, 29];
      const Bv = S.vis(2, 3);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        txt(ctx, 'each residual block ends with max-pool (1, 3): width ÷ 3', 160, 230, { size: 28, weight: 700, color: COL.K });
        L.forEach((v, i) => {
          const a = i === 0 ? 1 : S.ps(2, 1, 0.4, 0.3 + (i - 1) * 0.9);
          const w = 1500 * Math.log10(v) / Math.log10(21490), y = 280 + i * 78;
          ctx.globalAlpha = Bv * a;
          rrect(ctx, 260, y, w * easeIO(a), 50, 8, rgba(COL.T, 0.3), COL.T, 2);
          txt(ctx, i === 0 ? 'after pool' : 'block ' + i, 240, y + 34, { size: 22, weight: 600, align: 'right', color: COL.dim });
          txt(ctx, fmtInt(v), 280 + w * easeIO(a), y + 35, { size: 26, mono: true, weight: 700, color: COL.T });
        });
        txt(ctx, 'log scale', 1760, 230, { size: 20, color: COL.faint, align: 'right' });
        ctx.globalAlpha = Bv * S.ps(2, 2, 0.6);
        mtxt(ctx, 'encoder output ({B:B}, {C:64}, {F:23}, {T:29})', W / 2, 870, { size: 32, mono: true, align: 'center' });
        ctx.restore();
      }
      // beat 3: side by side with SSL-AASIST; the differences are lit
      const C = S.p(3, 0.7, 0.35);
      if (C > 0) {
        ctx.save(); ctx.globalAlpha = C;
        const rows = [
          ['input', 'raw waveform', 'XLS-R features (B, 201, 1024)', 0],
          ['first layer', 'sinc conv, 70 × 129', 'Linear 1024 → 128', 0],
          ['image', '23 × 21490 → encoder → 23 × 29', '42 × 67 → encoder → 42 × 67', 0],
          ['node views', 'max |·| over each axis', 'learned attention-weighted sums', 0],
          ['nodes', '23 spectral + 29 temporal', '42 spectral + 67 temporal', 0],
          ['first pooling', '0.5 / 0.7 → 11 + 20', '0.5 / 0.5 → 21 + 33', 0],
          ['parameters', '297,866, trained from scratch', '447,242 + XLS-R 315 M, fine-tuned', 1],
        ];
        txt(ctx, 'original AASIST', 860, 200, { size: 28, weight: 800, align: 'center' });
        txt(ctx, 'SSL-AASIST', 1460, 200, { size: 28, weight: 800, align: 'center', color: COL.A });
        rows.forEach(([k, o, n], i) => {
          const a = i < 6 ? S.p(3, 0.4, 0.4 + i * 0.7) : S.ps(3, 1, 0.5);
          const y = 270 + i * 88;
          ctx.globalAlpha = C * a;
          rrect(ctx, 150, y - 40, 1640, 70, 10, COL.panel, COL.line, 1.5);
          txt(ctx, k, 180, y + 4, { size: 26, weight: 700, color: COL.dim });
          txt(ctx, o, 860, y + 4, { size: 26, align: 'center' });
          txt(ctx, n, 1460, y + 4, { size: 26, align: 'center', color: COL.A });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 13 code
  // [markup line, beat, sentence, offset]: each line prints as the voice reaches it
  const CODE = [
    ["$ python verify/aasist_shapes.py        # runs the authors' model.py", 0, 0, 0.5],
    ['xls_r = stub  →  ({B:2}, {T:201}, {C:1024})        # random tensor, the right shape', 0, 1, 2.5],
    ['LL                    ({B:2}, {T:201}, {C:1024}) → ({B:2}, {T:201}, {C:128})', 1, 0, 0.6],
    ['first_bn              ({B:2}, {C:1}, {F:42}, {T:67})', 1, 0, 1.6],
    ['encoder.0 .. 5        ({B:2}, {C:32}, {F:42}, {T:67}) → … → ({B:2}, {C:64}, {F:42}, {T:67})', 1, 0, 2.6],
    ['GAT_layer_S / pool_S  ({B:2}, {N:42}, {C:64}) → ({B:2}, {N:21}, {C:64})', 1, 1, 0.3],
    ['GAT_layer_T / pool_T  ({B:2}, {N:67}, {C:64}) → ({B:2}, {N:33}, {C:64})', 1, 1, 1.6],
    ['HtrgGAT_layer_ST11    → ({B:2}, {N:33}, {C:32}), ({B:2}, {N:21}, {C:32}), ({B:2}, 1, {C:32})', 2, 0, 0.3],
    ['pool_hS1 / pool_hT1   → ({B:2}, {N:10}, {C:32}), ({B:2}, {N:16}, {C:32})', 2, 0, 2.2],
    ['HtrgGAT_layer_ST12    → same shapes', 2, 0, 3.4],
    ['out_layer             ({B:2}, {C:160}) → ({B:2}, {K:2})', 2, 0, 4.6],
    ['back-end parameters (everything except XLS-R): {K:447,242}', 2, 1, 0.3],
  ];
  S_.push({
    id: 'a_code', chapter: 13, title: 'Checking it in code',
    beats: [
      "Every shape in this video comes from running the authors' own code. Here's the trace, with the X L S R front-end replaced by a random tensor of the right shape, B by two hundred and one by one thousand and twenty-four.",
      "The linear layer, the pooled image, and the six encoder blocks, all as we derived. Then forty-two and sixty-seven nodes, pooled to twenty-one and thirty-three.",
      "The heterogeneous layers, the second pooling to sixteen and ten nodes, and finally one hundred and sixty numbers in, two logits out. The script is in the repository's verify folder, if you want to poke at it yourself.",
    ],
    hud: S => S.b === 0 ? { stage: 0, shape: '({B:2}, {T:201}, {C:1024})', label: 'trace, batch of 2' }
      : S.b === 1 ? (S.past(1, 1, 0.3) ? { stage: 5, shape: '({B:2}, {N:21}, {C:64}) · ({B:2}, {N:33}, {C:64})', label: 'trace, batch of 2' } : S.past(1, 0, 2.6) ? { stage: 3, shape: '({B:2}, {C:64}, {F:42}, {T:67})', label: 'trace, batch of 2' } : { stage: 1, shape: '({B:2}, {T:201}, {C:128})', label: 'trace, batch of 2' })
      : { stage: 7, shape: S.past(2, 0, 4.6) ? '({B:2}, {K:2})' : '({B:2}, {N:16}, {C:32}) · ({B:2}, {N:10}, {C:32})', label: 'trace, batch of 2' },
    draw(ctx, S) {
      const shown = CODE.filter(([s, b, sn, dl]) => S.ps(b, sn, 0.4, dl) > 0).length;
      rrect(ctx, 100, 170, 1720, Math.max(130, 90 + shown * 60), 18, '#0d1320', COL.line, 2);
      CODE.forEach(([s, b, sn, dl], i) => {
        const a = S.ps(b, sn, 0.4, dl);
        if (a <= 0) return;
        mtxt(ctx, s, 140, 236 + i * 60, { size: 24, mono: true, alpha: a, color: i === 0 ? COL.faint : COL.text });
        if (a < 1) E.glow(ctx, 136, 228 + i * 60, 18, COL.A, 0.8 * (1 - a));
      });
    },
  });

  // ------------------------------------------------------------------ 14 recap
  const RECAP = [
    ['XLS-R output', '64,600 samples → 201 frames', '({B:B}, {T:201}, {C:1024})', 1, 0],
    ['LL', 'Linear 1024 → 128', '({B:B}, {T:201}, {C:128})', 1, 1],
    ['as an image', 'transpose, unsqueeze, max-pool 3×3', '({B:B}, {C:1}, {F:42}, {T:67})', 1, 2],
    ['encoder', '6 residual blocks, kernels 2×3', '({B:B}, {C:64}, {F:42}, {T:67})', 1, 2, 3.5],
    ['node views', 'attention-weighted sums over T / over F', '{N:42} and {N:67} nodes × {C:64}', 2, 0],
    ['GAT + pool', 'pairwise-product attention, top-k 0.5', '{N:21} and {N:33} nodes × {C:64}', 2, 1],
    ['HS-GAL ×2 branches', '54-node graph + master, pool, residual, max', '{N:16} + {N:10} + 1 nodes × {C:32}', 2, 1, 4],
    ['readout', 'max|·| and mean, + master', '({B:B}, {C:160})', 3, 0],
    ['classifier', 'Linear 160 → 2', '({B:B}, {K:2})', 3, 0, 3],
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
      const y0 = 180, lh = 78, tb = 1 - S.p(4, 0.6, 0.2);
      if (tb > 0) {
        ctx.save(); ctx.globalAlpha = tb;
        txt(ctx, 'step', 110, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: S.p(0) });
        txt(ctx, 'what happens', 470, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: S.p(0) });
        txt(ctx, 'shape', 1810, y0 - 30, { size: 22, weight: 700, color: COL.dim, align: 'right', alpha: S.p(0) });
        line(ctx, 100, y0 - 14, 1820, y0 - 14, COL.line, 2);
        RECAP.forEach(([a, b, c, beat, sn, dl], i) => {
          const al = S.ps(beat, sn, 0.5, dl || 0.2);
          if (al <= 0) return;
          const y = y0 + 34 + i * lh;
          txt(ctx, a, 110, y, { size: 27, weight: 700, alpha: al });
          mtxt(ctx, b, 470, y, { size: 25, color: '#b4c0d2', alpha: al });
          mtxt(ctx, c, 1810, y, { size: 27, mono: true, align: 'right', alpha: al, color: COL.dim });
        });
        ctx.restore();
      }
      // the key idea, as the picture from the start of the episode, with shapes attached
      const K = S.p(4, 0.7, 0.4);
      if (K > 0) {
        ctx.save(); ctx.globalAlpha = K;
        const gx = 160, gy = 330;
        mat(ctx, gx, gy, 420, 230, { rows: 14, cols: 26, seed: 31, fn: (r, c) => scol(clamp(0.5 + 0.45 * noise(r, c, 31) * Math.exp(-((r - 6) ** 2) / 60)), 0.95), left: ['{F:42}', COL.F], bottom: ['{T:67}', COL.T] });
        const v1 = S.p(4, 0.6, 1.4), v2 = S.p(4, 0.6, 2.4), gm = S.ps(4, 0, 0.6, 5), ro = S.ps(4, 0, 0.6, 7.5);
        parrow(ctx, [[gx + 436, 380], [800, 380]], { color: COL.F, alpha: v1, p: v1 });
        parrow(ctx, [[gx + 436, 520], [800, 520]], { color: COL.T, alpha: v2, p: v2 });
        for (let i = 0; i < 7; i++) node(ctx, 840 + i * 44, 380, 14, COL.F, v1);
        for (let i = 0; i < 9; i++) node(ctx, 840 + i * 44, 520, 14, COL.T, v2);
        mtxt(ctx, 'spectral view → {N:42} nodes', 840, 340, { size: 24, weight: 700, alpha: v1 });
        mtxt(ctx, 'temporal view → {N:67} nodes', 840, 580, { size: 24, weight: 700, alpha: v2 });
        ctx.globalAlpha = K * gm;
        node(ctx, 1330, 450, 26, COL.K, 1, 'M');
        for (let i = 0; i < 7; i++) line(ctx, 840 + i * 44, 394, 1330, 450, rgba(COL.H, 0.3), 1.2);
        for (let i = 0; i < 9; i++) line(ctx, 840 + i * 44, 506, 1330, 450, rgba(COL.H, 0.3), 1.2);
        txt(ctx, 'graph attention within and across', 1330, 405, { size: 22, align: 'center', color: COL.H });
        ctx.globalAlpha = K * ro;
        arrow(ctx, 1370, 450, 1460, 450, {});
        cells(ctx, 1470, 438, 1, 10, 16, 24, (r, c) => vcol(noise(c, 2, 461), 0.9), 2);
        mtxt(ctx, '{C:160}', 1550, 410, { size: 24, mono: true, align: 'center' });
        arrow(ctx, 1640, 450, 1700, 450, {});
        mtxt(ctx, '{K:2} scores', 1760, 458, { size: 26, weight: 700, align: 'center' });
        ctx.globalAlpha = K * S.ps(4, 1, 0.6);
        txt(ctx, 'next: XLSR-MamBo · state space models + attention', W / 2, 820, { size: 30, weight: 700, align: 'center', color: COL.A });
        ctx.restore();
      }
    },
  });
})();
