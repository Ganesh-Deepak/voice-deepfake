// Scenes 6–11: projection, masking, positional conv, attention (toy), multi-head attention, transformer layer
(function () {
  const { W, COL, clamp, lerp, easeIO, noise, fmt, fmtInt, rgba, vcol, scol, txt, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box,
    cells, mat, dimTop, dimLeft, dimBottom, dimRight, stack, numRow, numMat, brace, cross, drawWave } = E;
  const S_ = window.SCENES;

  // attention-like pattern helpers (illustrative)
  const PAT = {
    local: (i, j) => Math.exp(-Math.pow(i - j, 2) / 4.5),
    similar: (i, j) => { const s = k => [0, 1, 2, 0, 1, 2, 1][Math.floor(k / 7) % 7]; return (s(i) === s(j) ? 1 : 0.06) * (0.6 + 0.4 * Math.abs(noise(j, 2, 5))); },
    global: (i, j) => ([4, 17, 31, 44].includes(j) ? 1 : 0.05) * (0.8 + 0.2 * noise(i, j, 8)),
    mixed: (i, j) => 0.7 * Math.exp(-Math.pow(i - j, 2) / 8) + 0.3 * ([8, 26].includes(j) ? 1 : 0.1),
  };
  function heat(ctx, x, y, size, n, f, a = 1) {
    const rows = [];
    for (let i = 0; i < n; i++) { let m = 0; const r = []; for (let j = 0; j < n; j++) { const v = f(i, j); r.push(v); m = Math.max(m, v); } rows.push(r.map(v => v / m)); }
    ctx.save(); ctx.globalAlpha *= a;
    rrect(ctx, x - 3, y - 3, size + 6, size + 6, 6, COL.bg2, COL.line, 2);
    cells(ctx, x, y, n, n, size / n, size / n, (i, j) => scol(rows[i][j]), size / n > 6 ? 1 : 0);
    ctx.restore();
  }

  // ------------------------------------------------------------------ 6 projection
  S_.push({
    id: 'projection', chapter: 6, title: 'Transpose, layer norm, linear projection',
    code: S => S.b < 2 ? 'features.transpose(1, 2)' : S.b < 3 ? 'feature_projection.layer_norm' : 'feature_projection.projection',
    beats: [
      "The convolution output is B by five twelve by forty-nine: channels first, then time. The transformer wants time first, so we transpose, swapping the last two axes. Now it's B by forty-nine by five twelve. Nothing is computed here. We just view the same numbers in a different order.",
      "Think of it as forty-nine rows, one per frame. Each row is a vector of five hundred and twelve numbers describing that twenty-millisecond moment.",
      "Next comes layer normalization. For each frame on its own, compute the mean and standard deviation of its five hundred and twelve numbers. Subtract the mean, and divide by the standard deviation. Then multiply by a learned scale, and add a learned shift. Notice the direction: layer norm works across features, within one frame.",
      "Then a linear layer. Let's build it from scratch. A linear layer takes an input vector and produces an output vector. Each output number is a weighted sum of all the input numbers, plus a bias.",
      "Collect all the weights into a matrix. Here it's five hundred and twelve by seven hundred and sixty-eight: one column of weights for each of the seven hundred and sixty-eight outputs. One warning, because this trips everyone up: PyTorch stores this matrix the other way around. The weight of a linear layer from five twelve to seven sixty-eight has shape seven sixty-eight by five twelve, and the layer computes x times W transposed, plus b. Same numbers, stored transposed.",
      "Now stack all forty-nine frames as rows, and the whole layer becomes a single matrix multiplication. The rule: the inner sizes must match, and they disappear. Forty-nine by five twelve, times five twelve by seven sixty-eight, gives forty-nine by seven sixty-eight.",
      "The same weights are applied to every frame independently. A linear layer only changes the last axis. Batch and time pass through untouched. Our tensor is now B by forty-nine by seven sixty-eight. Seven sixty-eight is the model's hidden size, and it stays fixed from here to the very end.",
    ],
    hud: S => ({ stage: 2, shape: S.b < 1 && S.T(0) < 5 ? '({B:B}, {C:512}, {T:49})' : S.b < 6 ? '({B:B}, {T:49}, {C:512})' : '({B:B}, {T:49}, {C:768})' }),
    draw(ctx, S) {
      // transpose
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const R = 12, Cc = 16, s = 30;
        const tr = easeIO(S.l(0, 2.2, 5));
        const bx = 330, by = 300, ax = 380, ay = 240;
        for (let r = 0; r < R; r++) for (let c = 0; c < Cc; c++) {
          const x = lerp(bx + c * s, ax + r * s, tr), y = lerp(by + r * s, ay + c * s, tr);
          let col = vcol(noise(r, c, 61) * 0.95, 0.9);
          ctx.fillStyle = col; ctx.fillRect(x + 1.5, y + 1.5, s - 3, s - 3);
        }
        const la = 1 - clamp(tr * 3), lb = clamp(tr * 3 - 2);
        ctx.globalAlpha = A * la;
        dimLeft(ctx, bx - 6, by, R * s, '{C:512}', COL.C, 26); dimTop(ctx, bx, by - 6, Cc * s, 'time {T:49}', COL.T, 26);
        ctx.globalAlpha = A * lb;
        dimLeft(ctx, ax - 6, ay, Cc * s, 'time {T:49}', COL.T, 26); dimTop(ctx, ax, ay - 6, R * s, 'features {C:512}', COL.C, 26);
        ctx.globalAlpha = A;
        mtxt(ctx, '({B:B}, {C:512}, {T:49})', 1350, 360, { size: 40, mono: true, align: 'center', alpha: 1 - 0.6 * tr });
        arrow(ctx, 1350, 400, 1350, 480, { color: COL.dim, p: S.p(0, 0.6, 4.5) });
        mtxt(ctx, 'x.transpose(1, 2)', 1380, 450, { size: 24, mono: true, color: COL.dim, alpha: S.p(0, 0.6, 4.5) });
        mtxt(ctx, '({B:B}, {T:49}, {C:512})', 1350, 540, { size: 40, mono: true, align: 'center', alpha: tr });
        mtxt(ctx, 'same numbers, different order', 1350, 620, { size: 28, align: 'center', color: COL.dim, alpha: S.p(0, 0.6, 10) });
        // highlight a frame (beat 1)
        const h = S.p(1, 0.6, 0.5);
        if (h > 0) {
          const fr = 5;
          ctx.globalAlpha = A * h;
          rrect(ctx, ax - 4, ay + fr * s - 4, R * s + 8, s + 8, 6, null, COL.A, 4);
          arrow(ctx, ax + R * s + 20, ay + fr * s + s / 2, 1000, ay + fr * s + s / 2, { color: COL.A });
          mtxt(ctx, 'frame 6 = a vector of {C:512} numbers', 1030, ay + fr * s + s / 2 + 10, { size: 30, weight: 600 });
          mtxt(ctx, '= 25 ms of audio, summarized', 1030, ay + fr * s + s / 2 + 56, { size: 26, color: COL.dim });
        }
        ctx.restore();
      }
      // layer norm
      const L = S.vis(2, 3);
      if (L > 0) {
        ctx.save(); ctx.globalAlpha = L;
        mtxt(ctx, 'LayerNorm(x)  =  γ ⊙ (x − μ) / σ  +  β', W / 2, 190, { size: 40, mono: true, align: 'center', weight: 600 });
        txt(ctx, 'μ, σ = mean and std of the 512 numbers of ONE frame; γ, β = learned (512 each)', W / 2, 240, { size: 24, align: 'center', color: COL.dim });
        const n = 32, bw = 22, x0 = 170, x1 = 1060, yc = 540;
        const raw = Array.from({ length: n }, (_, i) => 0.9 + 1.4 * noise(i, 4, 71));
        const mu = raw.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(raw.reduce((a, b) => a + (b - mu) ** 2, 0) / n);
        const t1 = easeIO(S.l(2, 1.2, 6)), t2 = easeIO(S.l(2, 1.2, 12));
        const panel = (x, title, vals, showMu, col) => {
          rrect(ctx, x - 20, 300, n * bw + 40, 480, 14, COL.panel, COL.line, 2);
          txt(ctx, title, x + n * bw / 2, 340, { size: 26, weight: 700, align: 'center', color: col });
          line(ctx, x, yc, x + n * bw, yc, COL.faint, 1.5);
          vals.forEach((v, i) => { ctx.fillStyle = v >= 0 ? rgba(COL.C, 0.8) : rgba(COL.T, 0.8); const hh = v * 70; ctx.fillRect(x + i * bw + 3, Math.min(yc, yc - hh), bw - 6, Math.abs(hh)); });
          if (showMu != null) { line(ctx, x, yc - showMu * 70, x + n * bw, yc - showMu * 70, COL.K, 2.5, [8, 6]); }
        };
        panel(x0, 'one frame (32 of its 512 numbers)', raw, mu, COL.text);
        txt(ctx, `μ = ${mu.toFixed(2)}   σ = ${sd.toFixed(2)}`, x0 + n * bw / 2, 750, { size: 24, mono: true, align: 'center', color: COL.K });
        const norm = raw.map(v => (v - mu) / sd);
        const g = raw.map((_, i) => 1 + 0.35 * noise(i, 9, 3)), b = raw.map((_, i) => 0.25 * noise(i, 11, 3));
        const vals = norm.map((v, i) => lerp(lerp(raw[i], v, t1), v * g[i] + b[i], t2));
        panel(x1, t2 > 0.5 ? '× γ + β  (learned)' : 'normalized', vals, lerp(mu, 0, t1), COL.A);
        txt(ctx, t1 > 0.5 ? 'μ = 0.00   σ = 1.00' : '', x1 + n * bw / 2, 750, { size: 24, mono: true, align: 'center', color: COL.K, alpha: 1 - t2 });
        arrow(ctx, x0 + n * bw + 30, yc, x1 - 30, yc, { color: COL.dim });
        const d = S.p(2, 0.6, 17);
        rrect(ctx, 430, 820, 1060, 70, 12, null, rgba(COL.A, 0.6 * d), 2);
        mtxt(ctx, 'LayerNorm: across {C:features}, within one frame  ·  shape unchanged', W / 2, 866, { size: 28, align: 'center', alpha: d, weight: 600 });
        ctx.restore();
      }
      // neurons
      const N = S.vis(3, 5);
      if (N > 0) {
        ctx.save(); ctx.globalAlpha = N;
        const ins = [0.8, -0.4, 0.3, 1.0], outs = 3;
        const ix = 300, ox = 800, iy = j => 330 + j * 120, oy = j => 390 + j * 130;
        const hi = Math.floor(S.l(3, 6, 4) * 3) % 3;
        for (let i = 0; i < 4; i++) for (let j = 0; j < outs; j++) {
          const on = j === hi && S.T(3) > 4;
          line(ctx, ix, iy(i), ox, oy(j), on ? rgba(COL.K, 0.95) : rgba(COL.dim, 0.35), on ? 3.5 : 1.5);
        }
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = COL.panel2; ctx.strokeStyle = COL.C; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ix, iy(i), 36, 0, 7); ctx.fill(); ctx.stroke();
          txt(ctx, fmt(ins[i], 1), ix, iy(i) + 1, { size: 22, mono: true, align: 'center', base: 'middle', weight: 600 });
          txt(ctx, 'x' + (i + 1), ix - 70, iy(i) + 1, { size: 26, align: 'center', base: 'middle', color: COL.C, weight: 700 });
        }
        for (let j = 0; j < outs; j++) {
          ctx.fillStyle = COL.panel2; ctx.strokeStyle = j === hi && S.T(3) > 4 ? COL.K : COL.C; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(ox, oy(j), 36, 0, 7); ctx.fill(); ctx.stroke();
          txt(ctx, 'y' + (j + 1), ox + 70, oy(j) + 1, { size: 26, align: 'center', base: 'middle', color: COL.C, weight: 700 });
        }
        txt(ctx, 'inputs', ix, 250, { size: 24, color: COL.dim, align: 'center' });
        txt(ctx, 'outputs', ox, 300, { size: 24, color: COL.dim, align: 'center' });
        txt(ctx, 'yⱼ = x₁·W₁ⱼ + x₂·W₂ⱼ + x₃·W₃ⱼ + x₄·W₄ⱼ + bⱼ', 1000, 440, { size: 32, mono: true });
        txt(ctx, 'every output sees every input', 1000, 500, { size: 28, color: COL.dim });
        // weight matrix (beat 4)
        const m = S.p(4, 0.8);
        if (m > 0) {
          ctx.globalAlpha = N * m;
          rrect(ctx, 960, 560, 860, 360, 14, 'rgba(10,14,22,0.96)', COL.line, 2);
          mat(ctx, 1220, 640, 380, 240, { rows: 12, cols: 19, seed: 81, left: ['{C:512} inputs', COL.C], top: ['{C:768} outputs', COL.C] });
          const cc = Math.floor(S.l(4, 5, 3) * 19) % 19;
          rrect(ctx, 1220 + cc * 20 - 3, 637, 26, 246, 5, null, COL.K, 3);
          txt(ctx, 'column j = weights of output j', 1410, 910, { size: 22, color: COL.K, align: 'center', alpha: S.p(4, 0.6, 3) });
          txt(ctx, 'W', 1000, 780, { size: 60, weight: 800, color: COL.K });
          const pt = S.p(4, 0.6, 9);
          if (pt > 0) { ctx.globalAlpha = N * m * pt; rrect(ctx, 140, 830, 800, 90, 12, 'rgba(242,204,96,0.08)', rgba(COL.K, 0.7), 2); mtxt(ctx, 'PyTorch stores it transposed:', 540, 866, { size: 22, align: 'center', color: COL.K, weight: 700 }); mtxt(ctx, 'layer.weight.shape = ({C:768}, {C:512})   y = x·Wᵀ + b', 540, 900, { size: 22, mono: true, align: 'center' }); }
        }
        ctx.restore();
      }
      // matmul
      const M = S.vis(5, 6);
      if (M > 0) {
        ctx.save(); ctx.globalAlpha = M;
        const y0 = 330;
        mat(ctx, 140, y0 + 60, 300, 196, { rows: 14, cols: 20, seed: 83, left: ['{T:49}', COL.T], top: ['{C:512}', COL.C], title: 'X (frames)' });
        txt(ctx, '×', 500, y0 + 170, { size: 60, align: 'center', base: 'middle', color: COL.dim });
        mat(ctx, 600, y0, 380, 300, { rows: 20, cols: 25, seed: 84, left: ['{C:512}', COL.C], top: ['{C:768}', COL.C], title: 'W', titleColor: COL.K, stroke: rgba(COL.K, 0.7) });
        txt(ctx, '=', 1050, y0 + 170, { size: 60, align: 'center', base: 'middle', color: COL.dim });
        const ya = S.p(5, 0.8, 5.5);
        ctx.globalAlpha = M * ya;
        mat(ctx, 1170, y0 + 60, 380, 196, { rows: 14, cols: 25, seed: 85, left: ['{T:49}', COL.T], top: ['{C:768}', COL.C], title: 'Y' });
        ctx.globalAlpha = M;
        // row × column → cell
        const k = S.p(5, 0.6, 3);
        if (k > 0) {
          ctx.globalAlpha = M * k;
          rrect(ctx, 137, y0 + 60 + 4 * 14 - 2, 306, 18, 4, null, COL.A, 3);
          rrect(ctx, 600 + 9 * 15.2 - 2, y0 - 3, 19, 306, 4, null, COL.A, 3);
          ctx.globalAlpha = M * ya * k;
          rrect(ctx, 1170 + 9 * 15.2 - 2, y0 + 60 + 4 * 14 - 2, 19, 18, 4, COL.A, COL.A, 2);
        }
        ctx.globalAlpha = M;
        const fa = S.p(5, 0.8, 8);
        const o = { size: 38, mono: true };
        const pA = '({T:49} × ', pB = '{C:512}', pC = ')  ×  (', pD = '{C:512}', pE = ' × {C:768})  =  ({T:49} × {C:768})';
        const full = pA + pB + pC + pD + pE, fw = mwidth(ctx, full, o), xs = W / 2 - fw / 2;
        mtxt(ctx, full, xs, 800, { ...o, alpha: fa });
        const ca = S.p(5, 0.6, 10);
        if (ca > 0) {
          ctx.globalAlpha = M * ca;
          const x1 = xs + mwidth(ctx, pA, o), w1 = mwidth(ctx, pB, o);
          const x2 = xs + mwidth(ctx, pA + pB + pC, o), w2 = mwidth(ctx, pD, o);
          rrect(ctx, x1 - 8, 758, w1 + 16, 58, 8, null, COL.R, 3);
          rrect(ctx, x2 - 8, 758, w2 + 16, 58, 8, null, COL.R, 3);
          line(ctx, x1 + w1 / 2, 820, x1 + w1 / 2, 838, COL.R, 2); line(ctx, x2 + w2 / 2, 820, x2 + w2 / 2, 838, COL.R, 2);
          line(ctx, x1 + w1 / 2, 838, x2 + w2 / 2, 838, COL.R, 2);
          txt(ctx, 'inner sizes match → they disappear', (x1 + x2 + w2) / 2, 878, { size: 26, color: COL.R, align: 'center', weight: 600 });
        }
        ctx.restore();
      }
      // same weights for every frame
      const P = S.p(6);
      if (P > 0) {
        ctx.save(); ctx.globalAlpha = P;
        for (let f = 0; f < 6; f++) {
          const y = 250 + f * 70, a = S.p(6, 0.4, 1 + f * 0.4);
          ctx.globalAlpha = P * a;
          cells(ctx, 160, y, 1, 16, 26, 44, (r, c) => vcol(noise(f, c, 87) * 0.9, 0.9), 3);
          arrow(ctx, 590, y + 22, 760, y + 22, { color: rgba(COL.K, 0.8), lw: 2 });
          cells(ctx, 800, y, 1, 22, 26, 44, (r, c) => vcol(noise(f, c, 88) * 0.9, 0.9), 3);
          txt(ctx, 'frame ' + (f + 1), 140, y + 30, { size: 20, align: 'right', color: COL.T, weight: 600 });
        }
        ctx.globalAlpha = P;
        box(ctx, 610, 180, 130, 520, null, { fill: rgba(COL.K, 0.08), stroke: COL.K });
        txt(ctx, 'same W', 675, 730, { size: 26, weight: 700, color: COL.K, align: 'center' });
        dimTop(ctx, 160, 244, 416, '{C:512}', COL.C, 24);
        dimTop(ctx, 800, 244, 572, '{C:768}', COL.C, 24);
        mtxt(ctx, '({B:B}, {T:49}, {C:512})  →  ({B:B}, {T:49}, {C:768})', W / 2, 810, { size: 40, mono: true, align: 'center', alpha: S.p(6, 0.6, 4) });
        mtxt(ctx, 'only the last axis changes  ·  weights: 512 × 768 + 768 = 393,984', W / 2, 870, { size: 26, align: 'center', color: COL.dim, alpha: S.p(6, 0.6, 6) });
        const h = S.p(6, 0.6, 10);
        rrect(ctx, 1450, 330, 380, 200, 16, rgba(COL.C, 0.08 * h), rgba(COL.C, h), 3);
        txt(ctx, 'hidden size', 1640, 400, { size: 28, weight: 600, align: 'center', color: COL.dim, alpha: h });
        txt(ctx, '768', 1640, 480, { size: 72, weight: 800, align: 'center', color: COL.C, alpha: h, mono: true });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 7 masking
  const MSTART = [4, 20, 26];
  const MASKED = new Set();
  MSTART.forEach(s => { for (let k = 0; k < 10; k++) if (s + k < 49) MASKED.add(s + k); });
  S_.push({
    id: 'masking', chapter: 7, title: 'Masking (pre-training)',
    code: 'model.masked_spec_embed: (768,)',
    beats: [
      "During pre-training, and in a lighter form as a regularizer during fine-tuning, some frames are masked before they enter the transformer.",
      "The recipe from the paper: every frame is picked as a starting point with probability six and a half percent. From each starting point, a span of ten consecutive frames is masked. Spans are allowed to overlap.",
      "Masked frames are not set to zero. They're overwritten by a single learned vector of seven hundred and sixty-eight numbers, the same vector at every masked position. It's the model's way of saying: something was here, but you can't see it.",
      "With these settings, roughly half of all frames end up masked. During pre-training, the transformer's job is to work out what belongs in those gaps, using only the surrounding context. And the shape, of course, is unchanged.",
    ],
    hud: { stage: 3, shape: '({B:B}, {T:49}, {C:768})' },
    draw(ctx, S) {
      const n = 49, cw = 32, x0 = (W - n * cw) / 2, y0 = 360, rows = 9, ch = 24;
      const a0 = S.p(0);
      const scan = S.l(1, 3.5, 2);
      const grow = easeIO(S.l(1, 2.5, 6.5));
      const rep = easeIO(S.l(2, 1.5, 1));
      ctx.save(); ctx.globalAlpha = a0;
      for (let f = 0; f < n; f++) {
        const isM = MASKED.has(f);
        let spanOn = false;
        MSTART.forEach(s => { if (f >= s && f < s + 10 && (f - s) < grow * 10 + 0.5) spanOn = true; });
        for (let r = 0; r < rows; r++) {
          let c = vcol(noise(f, r, 91) * 0.9, 0.9);
          if (spanOn && isM) c = rep > 0 ? E.mix('#3a2a4a', COL.M, 0.25 + 0.5 * rep * (0.5 + 0.5 * noise(0, r, 5))) : rgba(COL.M, 0.25);
          ctx.fillStyle = c; ctx.fillRect(x0 + f * cw + 2, y0 + r * ch + 2, cw - 4, ch - 4);
        }
        if (spanOn && isM) { ctx.strokeStyle = rgba(COL.M, 0.9); ctx.lineWidth = 2; ctx.strokeRect(x0 + f * cw + 1, y0 + 1, cw - 2, rows * ch - 2); }
        // scan marker
        if (S.b >= 1 && Math.floor(scan * n) === f && scan < 1) rrect(ctx, x0 + f * cw - 2, y0 - 6, cw + 4, rows * ch + 12, 4, null, COL.K, 3);
      }
      dimTop(ctx, x0, y0 - 6, n * cw, '{T:49} frames', COL.T, 26);
      dimLeft(ctx, x0 - 6, y0, rows * ch, '{C:768}', COL.C, 24);
      // start markers
      MSTART.forEach((s, i) => {
        if (scan * n < s + 1 && S.b <= 1) return;
        const x = x0 + s * cw + cw / 2;
        ctx.fillStyle = COL.K; ctx.beginPath(); ctx.moveTo(x, y0 + rows * ch + 16); ctx.lineTo(x - 12, y0 + rows * ch + 38); ctx.lineTo(x + 12, y0 + rows * ch + 38); ctx.fill();
        txt(ctx, 'start', x, y0 + rows * ch + 66, { size: 20, weight: 700, align: 'center', color: COL.K });
        const ga = S.p(1, 0.5, 6.5);
        if (ga > 0) {
          const xe = x0 + Math.min(n, s + 10 * grow) * cw;
          ctx.globalAlpha = a0 * ga;
          line(ctx, x0 + s * cw + 4, y0 + rows * ch + 90 + i * 16, xe - 4, y0 + rows * ch + 90 + i * 16, COL.M, 4);
          ctx.globalAlpha = a0;
        }
      });
      const t1 = S.p(1, 0.6, 1);
      mtxt(ctx, 'P(frame is a span start) = {K:p = 0.065}      span length {M:M = 10}', W / 2, 220, { size: 32, align: 'center', alpha: t1 * (1 - S.p(2)), weight: 600 });
      // mask vector
      const mv = S.p(2, 0.8, 4);
      if (mv > 0) {
        ctx.globalAlpha = a0 * mv * (1 - S.p(3, 0.6));
        mtxt(ctx, 'every masked frame  ←  the same learned vector {M:m} ∈ ℝ{C:768}', W / 2, 220, { size: 32, align: 'center', weight: 600 });
        ctx.globalAlpha = a0;
      }
      // stats
      const st = S.p(3, 0.8);
      if (st > 0) {
        ctx.globalAlpha = a0 * st;
        mtxt(ctx, `masked: {M:${MASKED.size}} of {T:49} frames  (${Math.round(MASKED.size / 49 * 100)}% here; ≈ 49% on average)`, W / 2, 220, { size: 32, align: 'center', weight: 600 });
        rrect(ctx, 260, 800, 1400, 120, 14, COL.panel, COL.line, 2);
        mtxt(ctx, 'shape unchanged: ({B:B}, {T:49}, {C:768})', W / 2, 848, { size: 32, mono: true, align: 'center' });
        txt(ctx, "Hugging Face note: mask_time_prob ≈ fraction of frames masked (default 0.05 when fine-tuning), not the per-frame start probability.", W / 2, 895, { size: 20, align: 'center', color: COL.dim });
      }
      ctx.restore();
    },
  });

  // ------------------------------------------------------------------ 8 positional conv
  S_.push({
    id: 'posconv', chapter: 8, title: 'Positional convolution',
    code: 'model.encoder.pos_conv_embed',
    beats: [
      "Before the transformer, there's one problem to fix. Attention, as we'll see, treats its input as an unordered set. If you shuffled the frames, it wouldn't notice. So we have to inject information about position.",
      "wav2vec 2.0 does this with another convolution, but this time sliding along the time axis of the seven hundred and sixty-eight dimensional frames. Its kernel is one hundred and twenty-eight frames wide: about two and a half seconds of audio.",
      "A convolution wants channels first, so the frames are transposed to B, by seven sixty-eight, by forty-nine. To keep the length unchanged, the input is padded with sixty-four frames of zeros on each side. That gives fifty outputs instead of forty-nine, so the last one is trimmed off, and the result is transposed back to B, by forty-nine, by seven sixty-eight.",
      "A full convolution from seven sixty-eight to seven sixty-eight channels, with such a wide kernel, would be huge. So the channels are split into sixteen groups of forty-eight, and each group only talks to itself. This cuts the weights by a factor of sixteen, to about four point seven million.",
      "The result goes through GELU, and is added to the input. That's called a residual connection: the original frames are kept, and position-aware information is added on top. Finally, one more layer norm. The shape is still B by forty-nine by seven sixty-eight.",
      "Because this positional signal comes from a convolution, rather than a fixed table of positions, it's relative. It tells each frame about its neighbourhood, and it works for clips of any length.",
    ],
    hud: { stage: 4, shape: '({B:B}, {T:49}, {C:768})' },
    draw(ctx, S) {
      // set illustration
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const ord = [0, 1, 2, 3, 4, 5], shuf = [3, 0, 5, 1, 4, 2];
        const cols = ['#58a6ff', '#7ee787', '#ffa657', '#d2a8ff', '#ff7b9c', '#f2cc60'];
        const t = easeIO(S.l(0, 1.5, 4));
        txt(ctx, 'frames in order', 300, 330, { size: 28, weight: 600, color: COL.dim, align: 'right' });
        txt(ctx, 'shuffled', 300, 590, { size: 28, weight: 600, color: COL.dim, align: 'right', alpha: t });
        ord.forEach(i => {
          rrect(ctx, 360 + i * 130, 280, 100, 90, 12, rgba(cols[i], 0.2), cols[i], 3);
          txt(ctx, String(i + 1), 410 + i * 130, 328, { size: 36, weight: 800, align: 'center', base: 'middle', color: cols[i] });
          const j = shuf.indexOf(i);
          const x = lerp(360 + i * 130, 360 + j * 130, t), y = lerp(280, 540, t);
          ctx.globalAlpha = A * t;
          rrect(ctx, x, y, 100, 90, 12, rgba(cols[i], 0.2), cols[i], 3);
          txt(ctx, String(i + 1), x + 50, y + 48, { size: 36, weight: 800, align: 'center', base: 'middle', color: cols[i] });
          ctx.globalAlpha = A;
        });
        const b = S.p(0, 0.6, 6);
        ctx.globalAlpha = A * b;
        box(ctx, 1260, 380, 480, 180, ['attention sees', 'the same set of vectors'], { size: 34, color: COL.H, stroke: COL.H });
        txt(ctx, '→ position must be added explicitly', W / 2, 800, { size: 34, weight: 700, align: 'center', color: COL.A, alpha: S.p(0, 0.6, 9) });
        ctx.restore();
      }
      // conv over time with padding
      const Bv = S.vis(1, 3);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        const tot = 177, cw = 1640 / tot, x0 = 140, y0 = 330, rows = 12, ch = 22;
        const padA = S.p(2, 0.6, 0.5);
        for (let c = 0; c < tot; c++) {
          const real = c >= 64 && c < 64 + 49;
          if (!real && padA <= 0) continue;
          for (let r = 0; r < rows; r++) {
            ctx.fillStyle = real ? vcol(noise(c, r, 95) * 0.9, 0.9) : `rgba(60,70,90,${0.5 * padA})`;
            ctx.fillRect(x0 + c * cw + 0.5, y0 + r * ch + 1, cw - 1, ch - 2);
          }
        }
        dimTop(ctx, x0 + 64 * cw, y0 - 6, 49 * cw, '{T:49} real frames', COL.T, 24);
        dimLeft(ctx, x0 - 6, y0, rows * ch, '{C:768}', COL.C, 24);
        if (padA > 0) {
          ctx.globalAlpha = Bv * padA;
          dimBottom(ctx, x0, y0 + rows * ch + 6, 64 * cw, '64 zeros', COL.dim, 22);
          dimBottom(ctx, x0 + 113 * cw, y0 + rows * ch + 6, 64 * cw, '64 zeros', COL.dim, 22);
          ctx.globalAlpha = Bv;
        }
        // kernel window
        const ka = S.p(1, 0.6, 4);
        if (ka > 0) {
          const pos = S.b >= 2 ? Math.floor(S.l(2, 4, 3) * 49) : 20;
          const kx = x0 + pos * cw + (S.b >= 2 ? 0 : 64 * cw - 64 * cw);
          ctx.globalAlpha = Bv * ka;
          rrect(ctx, kx, y0 - 10, 128 * cw, rows * ch + 20, 10, rgba(COL.K, 0.1), COL.K, 4);
          txt(ctx, 'kernel: 128 frames ≈ 2.56 s', kx + 64 * cw, y0 + rows * ch + 80, { size: 26, weight: 700, align: 'center', color: COL.K });
          ctx.globalAlpha = Bv;
        }
        const fa = S.p(2, 0.6, 7);
        if (fa > 0) {
          ctx.globalAlpha = Bv * fa;
          mtxt(ctx, 'length:  {T:49} + 64 + 64 = 177   →   177 − {K:128} + 1 = 50   →   drop last  →  {T:49}', W / 2, 780, { size: 30, mono: true, align: 'center' });
          mtxt(ctx, '({B:B},{T:49},{C:768}) →ᵀ ({B:B},{C:768},{T:49}) → conv → ({B:B},{C:768},{T:50}) → trim → ({B:B},{C:768},{T:49}) →ᵀ ({B:B},{T:49},{C:768})', W / 2, 840, { size: 21, mono: true, align: 'center' });
          txt(ctx, 'Conv1d(768, 768, kernel_size=128, padding=64, groups=16)   weight: (768, 48, 128)', W / 2, 890, { size: 20, mono: true, align: 'center', color: COL.dim });
        }
        ctx.restore();
      }
      // groups
      const G = S.vis(3, 4);
      if (G > 0) {
        ctx.save(); ctx.globalAlpha = G;
        const x0 = 260, y0 = 220, sz = 560, g = 16, bs = sz / g;
        rrect(ctx, x0 - 4, y0 - 4, sz + 8, sz + 8, 8, COL.bg2, COL.line, 2);
        const fill = easeIO(S.l(3, 3, 2));
        for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
          const diag = i === j;
          const a = diag ? 1 : 1 - fill;
          if (a <= 0.02) continue;
          ctx.fillStyle = diag ? rgba(COL.H, 0.75) : rgba(COL.dim, 0.35 * a);
          ctx.fillRect(x0 + j * bs + 1, y0 + i * bs + 1, bs - 2, bs - 2);
        }
        dimTop(ctx, x0, y0 - 6, sz, '{C:768} in', COL.C, 24);
        dimLeft(ctx, x0 - 6, y0, sz, '{C:768} out', COL.C, 24);
        txt(ctx, 'each block: 48 × 48 channels × 128 taps', x0 + sz / 2, y0 + sz + 50, { size: 24, align: 'center', color: COL.H, alpha: fill });
        const t1 = S.p(3, 0.6, 1);
        mtxt(ctx, 'full:  768 × 768 × 128  =  75.5 M', 1000, 380, { size: 36, mono: true, alpha: t1 });
        if (fill > 0.5) line(ctx, 990, 368, 1000 + 700 * clamp((fill - 0.5) * 2), 368, COL.R, 4);
        mtxt(ctx, '16 groups:  768 × {H:48} × 128  =  {H:4.7 M}', 1000, 480, { size: 36, mono: true, alpha: S.p(3, 0.6, 7) });
        txt(ctx, 'channel group k only mixes with group k', 1000, 560, { size: 26, color: COL.dim, alpha: S.p(3, 0.6, 7) });
        ctx.restore();
      }
      // residual flow
      const R = S.p(4);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R * (1 - 0.0 * S.p(5));
        const y = 420;
        chip(ctx, 150, y, '({B:B}, {T:49}, {C:768})', { markup: true, size: 24, mono: true, align: 'left' });
        arrow(ctx, 380, y, 560, y, {});
        box(ctx, 570, y - 70, 380, 140, ['Conv1d, k=128, groups=16', 'weight-normalized'], { size: 26, color: COL.K });
        arrow(ctx, 960, y, 1030, y, {});
        box(ctx, 1040, y - 55, 150, 110, 'GELU', { size: 30, color: COL.A });
        arrow(ctx, 1200, y, 1290, y, {});
        ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1320, y, 28, 0, 7); ctx.stroke();
        txt(ctx, '+', 1320, y + 2, { size: 40, weight: 700, align: 'center', base: 'middle' });
        parrow(ctx, [[450, y], [450, y + 170], [1320, y + 170], [1320, y + 30]], { color: COL.B, lw: 3 });
        txt(ctx, 'residual: keep the original x', 915, y + 210, { size: 26, color: COL.B, align: 'center', weight: 600 });
        arrow(ctx, 1350, y, 1430, y, {});
        box(ctx, 1440, y - 55, 200, 110, 'LayerNorm', { size: 28, color: COL.A });
        mtxt(ctx, 'x  ←  LayerNorm( x + GELU(conv(x)) )', W / 2, 250, { size: 38, mono: true, align: 'center', weight: 600, alpha: S.p(4, 0.6, 3) });
        const c = S.p(5, 0.6, 0.5);
        if (c > 0) {
          ctx.globalAlpha = R * c;
          rrect(ctx, 300, 760, 1320, 120, 14, COL.panel, rgba(COL.A, 0.6), 2);
          txt(ctx, 'relative position from the neighbourhood · works for any clip length', W / 2, 830, { size: 30, weight: 600, align: 'center' });
        }
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 9 attention toy
  const X = [[1.5, 0.4], [1.2, 0.8], [-0.6, 1.5], [-0.9, 1.1]];
  const WQ = [[1.0, 0.4], [0.2, 1.1]], WK = [[1.2, 0.1], [0.3, 0.9]], WV = [[0.9, -0.2], [0.3, 1.0]];
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const Q = mm(X, WQ), K = mm(X, WK), V = mm(X, WV);
  const SC = Q.map(q => K.map(k => q[0] * k[0] + q[1] * k[1]));
  const SS2 = SC.map(r => r.map(v => v / Math.SQRT2));
  const AT = SS2.map(r => { const e = r.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); });
  const OUTA = mm(AT, V);
  S_.push({
    id: 'attn', chapter: 9, title: 'Self-attention from scratch',
    beats: [
      "Now the heart of the model: self-attention. Let's build it with a tiny example. Four frames, each described by just two numbers.",
      "Each frame asks a question: which other frames are relevant to me? To do that, each frame produces three vectors, using three different linear layers. A query: what am I looking for? A key: what do I contain? And a value: what will I pass along, if someone attends to me?",
      "To see how much frame one should attend to frame three, take the dot product of frame one's query with frame three's key. Multiply matching entries, and add. A large dot product means a good match.",
      "Do that for every pair of frames, and you get a grid of scores. Four frames give a four by four grid. Row i holds how much frame i likes every other frame.",
      "The scores are divided by the square root of the vector size. This stops them growing too large when vectors get long. For wav2vec 2.0's attention heads, that's the square root of sixty-four, which is eight.",
      "Then each row passes through a softmax: exponentiate every score, and divide by the row's sum. Now every row is a set of positive weights that add up to one.",
      "Finally, each frame's output is the weighted average of all the value vectors, using its row of weights. Frames with a high weight contribute more. That's it. That's attention: a data-dependent weighted average, where each frame decides for itself where to look.",
    ],
    hud: { stage: 5, shape: '({T:4}, {C:2})  toy', label: 'toy example' },
    draw(ctx, S) {
      const cw = 96, ch = 58, y0 = 250;
      const xX = 110, xQ = 410, xK = 640, xV = 870, xS = 1140;
      const a0 = S.p(0);
      ctx.save(); ctx.globalAlpha = a0;
      txt(ctx, 'X', xX + cw, y0 - 40, { size: 30, weight: 800, align: 'center' });
      numMat(ctx, xX, y0, X, cw, ch, { size: 22, d: 1 });
      for (let i = 0; i < 4; i++) txt(ctx, 'f' + (i + 1), xX - 16, y0 + i * ch + ch / 2 + 1, { size: 22, weight: 700, align: 'right', base: 'middle', color: COL.T });
      ctx.restore();
      const a1 = S.p(1, 0.8, 3);
      const trio = [[xQ, Q, 'Q  (query)', COL.A], [xK, K, 'K  (key)', COL.K], [xV, V, 'V  (value)', COL.D]];
      trio.forEach(([x, M, name, col], i) => {
        const a = S.p(1, 0.6, 4.5 + i * 2.2);
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a;
        txt(ctx, name, x + cw, y0 - 40, { size: 26, weight: 800, align: 'center', color: col });
        const hl = (r, c) => (S.b === 2 && ((i === 0 && r === 0) || (i === 1 && r === 2)));
        numMat(ctx, x, y0, M, cw, ch, { size: 20, hl, hlColor: col });
        ctx.restore();
      });
      if (a1 > 0) txt(ctx, 'Q = X·W_Q    K = X·W_K    V = X·W_V', 960, y0 + 4 * ch + 60, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: S.p(1, 0.6, 12) * (1 - S.p(2, 0.4)) });
      // dot product
      const d = S.vis(2, 3);
      if (d > 0) {
        const q = Q[0], k = K[2];
        mtxt(ctx, `q₁ · k₃  =  (${fmt(q[0])})(${fmt(k[0])}) + (${fmt(q[1])})(${fmt(k[1])})  =  {K:${fmt(SC[0][2])}}`, 960, y0 + 4 * ch + 70, { size: 32, mono: true, align: 'center', alpha: d });
      }
      // score grid
      const sgA = S.p(2, 0.6, 5);
      if (sgA > 0) {
        const fillN = S.b >= 4 ? 16 : S.b === 3 ? Math.floor(S.l(3, 3.5, 0.5) * 16) : 1;
        const scaled = easeIO(S.l(4, 1, 2.5));
        const soft = easeIO(S.l(5, 1.2, 3));
        const M = SC.map((r, i) => r.map((v, j) => {
          const sv = lerp(v, v / Math.SQRT2, scaled);
          return lerp(sv, AT[i][j], soft);
        }));
        ctx.save(); ctx.globalAlpha = sgA;
        const title = soft > 0.5 ? 'attention weights' : scaled > 0.5 ? 'scores ÷ √d' : 'scores  Q·Kᵀ';
        txt(ctx, title, xS + 2 * cw, y0 - 40, { size: 26, weight: 800, align: 'center', color: soft > 0.5 ? COL.H : COL.text });
        numMat(ctx, xS, y0, M, cw, ch, {
          size: 20, cellAlpha: (r, c) => (r * 4 + c < fillN || (r === 0 && c === 2)) ? 1 : 0.15,
          fill: (r, c, v) => soft > 0.5 ? scol(v, 0.9) : vcol(v * 0.35, 0.45),
          color: soft > 0.5 ? '#0a0e16' : COL.text,
          hl: (r, c) => S.b === 2 && r === 0 && c === 2,
        });
        for (let j = 0; j < 4; j++) txt(ctx, 'f' + (j + 1), xS + j * cw + cw / 2, y0 + 4 * ch + 28, { size: 20, weight: 700, align: 'center', color: COL.T });
        for (let i = 0; i < 4; i++) txt(ctx, 'f' + (i + 1), xS - 14, y0 + i * ch + ch / 2 + 1, { size: 20, weight: 700, align: 'right', base: 'middle', color: COL.T });
        if (soft > 0.5) for (let i = 0; i < 4; i++) txt(ctx, 'Σ=1', xS + 4 * cw + 10, y0 + i * ch + ch / 2 + 1, { size: 20, mono: true, base: 'middle', color: COL.H, alpha: soft });
        ctx.restore();
      }
      // explanations under
      const e3 = S.vis(3, 4);
      if (e3 > 0) txt(ctx, 'row i = how much frame i "likes" each frame', 960, y0 + 4 * ch + 70, { size: 30, align: 'center', alpha: e3, weight: 600 });
      const e4 = S.vis(4, 5);
      if (e4 > 0) {
        mtxt(ctx, 'score / √d      toy: d = 2 → ÷ 1.41      wav2vec 2.0 heads: d = {D:64} → ÷ {D:8}', 960, y0 + 4 * ch + 70, { size: 30, align: 'center', alpha: e4, weight: 600 });
      }
      const e5 = S.vis(5, 6);
      if (e5 > 0) {
        mtxt(ctx, 'softmax(z)ⱼ  =  exp(zⱼ) / Σₖ exp(zₖ)', 960, y0 + 4 * ch + 70, { size: 32, mono: true, align: 'center', alpha: e5 });
        const z = [2.0, 1.0, 0.1], e = z.map(Math.exp), s = e.reduce((a, b) => a + b, 0);
        mtxt(ctx, `e.g. [2.0, 1.0, 0.1]  →  [${e.map(v => (v / s).toFixed(2)).join(', ')}]`, 960, y0 + 4 * ch + 130, { size: 28, mono: true, align: 'center', alpha: e5 * S.p(5, 0.6, 5), color: COL.dim });
      }
      // output
      const o = S.p(6, 0.8);
      if (o > 0) {
        ctx.save(); ctx.globalAlpha = o;
        const a = AT[0];
        const yy = y0 + 4 * ch + 70;
        mtxt(ctx, `out₁ = ${a.map((w, j) => `{H:${w.toFixed(2)}}·v${j + 1}`).join(' + ')}  =  [${fmt(OUTA[0][0])}, ${fmt(OUTA[0][1])}]`, 740, yy, { size: 28, mono: true, align: 'center' });
        // bars for weights
        a.forEach((w, j) => {
          const x = 330 + j * 230;
          rrect(ctx, x, yy + 40, 180, 30, 6, COL.panel, COL.line, 1);
          rrect(ctx, x, yy + 40, 180 * w, 30, 6, rgba(COL.H, 0.8), null);
          txt(ctx, 'v' + (j + 1), x + 90, yy + 100, { size: 20, align: 'center', color: COL.D, weight: 700 });
        });
        const oa = S.p(6, 0.6, 5);
        ctx.globalAlpha = o * oa;
        txt(ctx, 'output', xS + 5 * cw + 50 + 90, y0 - 40, { size: 26, weight: 800, align: 'center', color: COL.B });
        numMat(ctx, xS + 5 * cw + 50, y0, OUTA, 90, ch, { size: 18 });
        txt(ctx, 'attention = data-dependent weighted average', W / 2, 890, { size: 34, weight: 700, align: 'center', color: COL.A, alpha: S.p(6, 0.6, 11) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 10 multi-head attention
  S_.push({
    id: 'mha', chapter: 10, title: 'Multi-head attention with real shapes',
    code: 'encoder.layers[i].attention',
    beats: [
      "Now let's do it with the real shapes. The input is B by forty-nine by seven sixty-eight.",
      "Three linear layers, each seven sixty-eight to seven sixty-eight, produce the queries, keys and values. Each one is B by forty-nine by seven sixty-eight.",
      "Instead of one big attention, wav2vec 2.0 base uses twelve heads. We split the seven hundred and sixty-eight features into twelve chunks of sixty-four. That's a reshape: B by forty-nine by twelve by sixty-four.",
      "Then we swap the time and head axes, giving B by twelve by forty-nine by sixty-four. Now each head is its own little attention problem: forty-nine frames, sixty-four numbers each.",
      "Queries times keys transposed: forty-nine by sixty-four, times sixty-four by forty-nine, gives a forty-nine by forty-nine score matrix, for each head. The scores tensor is B by twelve by forty-nine by forty-nine. Divide by eight, and softmax along the last axis.",
      "Multiply the attention weights, forty-nine by forty-nine, by the values, forty-nine by sixty-four, and we're back to forty-nine by sixty-four per head. The tensor is B by twelve by forty-nine by sixty-four.",
      "Now undo the split. Swap the axes back, and merge twelve times sixty-four into seven hundred and sixty-eight. A final linear layer, the output projection, mixes information across heads. We're back to B by forty-nine by seven sixty-eight.",
      "Why multiple heads? Each head can learn its own notion of relevance. One might track neighbouring frames. Another might link frames that sound similar. Another might gather a summary of the whole clip. And each head only costs a sixty-four dimensional slice.",
      "Note the cost: the score matrix grows with the square of the number of frames. One second gives forty-nine squared, about twenty-four hundred scores per head. Four seconds gives about two hundred frames, and forty thousand scores per head.",
    ],
    hud: S => ({
      stage: 5, shape: ['({B:B}, {T:49}, {C:768})', '({B:B}, {T:49}, {C:768})', '({B:B}, {T:49}, {H:12}, {D:64})', '({B:B}, {H:12}, {T:49}, {D:64})',
        '({B:B}, {H:12}, {T:49}, {T:49})', '({B:B}, {H:12}, {T:49}, {D:64})', '({B:B}, {T:49}, {C:768})', '({B:B}, {H:12}, {T:49}, {T:49})', '({B:B}, {H:12}, {T:49}, {T:49})'][S.b],
    }),
    draw(ctx, S) {
      const s = 0.5, fh = 4; // px per feature, px per frame
      const bw = 768 * s, bh = 49 * fh;
      // beats 0-1: X -> Q K V
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        mat(ctx, 160, 420, bw, bh, { rows: 14, cols: 28, seed: 101, left: ['{T:49}', COL.T], top: ['{C:768}', COL.C], title: 'X' });
        const qkv = [['Q', COL.A, 170], ['K', COL.K, 430], ['V', COL.D, 690]];
        qkv.forEach(([n, col, y], i) => {
          const a = S.p(1, 0.6, 1 + i * 0.8);
          if (a <= 0) return;
          ctx.globalAlpha = A * a;
          const ey = y + bh * 0.4;
          arrow(ctx, 160 + bw + 30, 518, 900, ey, { color: col, lw: 3 });
          chip(ctx, 740, lerp(518, ey, 0.55), `W_${n}  768×768`, { size: 20, mono: true, color: col, align: 'center', fill: COL.bg, stroke: rgba(col, 0.6) });
          mat(ctx, 1000, y, bw, bh * 0.8, { rows: 11, cols: 28, seed: 110 + i, stroke: col, left: ['{T:49}', COL.T] });
          txt(ctx, n, 1000 + bw + 30, ey + 16, { size: 44, weight: 800, color: col });
          mtxt(ctx, '({B:B}, {T:49}, {C:768})', 1460, ey + 12, { size: 28, mono: true });
        });
        ctx.restore();
      }
      // beat 2: split Q into 12 slices
      const Bv = S.vis(2, 3);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        const x0 = 380, y0 = 330, w = 1152, h = 300, sw = w / 12;
        const sp = easeIO(S.l(2, 1.5, 2.5));
        for (let hd = 0; hd < 12; hd++) {
          const x = x0 + hd * (sw + 12 * sp) - 66 * sp;
          mat(ctx, x, y0, sw, h, { rows: 16, cols: 4, seed: 120 + hd, stroke: sp > 0.5 ? rgba(COL.H, 0.9) : COL.line });
          if (sp > 0.5) txt(ctx, 'h' + (hd + 1), x + sw / 2, y0 + h + 40, { size: 22, weight: 700, align: 'center', color: COL.H, alpha: sp });
        }
        dimLeft(ctx, x0 - 70 * sp - 6, y0, h, '{T:49}', COL.T, 26);
        ctx.globalAlpha = Bv * (1 - sp);
        dimTop(ctx, x0, y0 - 6, w, '{C:768}', COL.C, 26);
        ctx.globalAlpha = Bv * sp;
        dimTop(ctx, x0 - 66, y0 - 6, sw, '{D:64}', COL.D, 24);
        txt(ctx, 'Q', 150, y0 + h / 2, { size: 48, weight: 800, color: COL.A, base: 'middle' });
        ctx.globalAlpha = Bv;
        mtxt(ctx, '{C:768}  =  {H:12} heads × {D:64}', W / 2, 770, { size: 38, mono: true, align: 'center', alpha: S.p(2, 0.6, 3) });
        mtxt(ctx, 'q.view(B, {T:49}, {H:12}, {D:64})', W / 2, 840, { size: 30, mono: true, align: 'center', color: COL.dim, alpha: S.p(2, 0.6, 6) });
        ctx.restore();
      }
      // beat 3: stack of heads
      const Cv = S.vis(3, 4);
      if (Cv > 0) {
        ctx.save(); ctx.globalAlpha = Cv;
        const cw = 128, chh = 196;
        const t = easeIO(S.l(3, 1.6, 0.5));
        for (let hd = 11; hd >= 0; hd--) {
          const sx = 380 + hd * 96 - 66, sy = 330;
          const tx = 700 + hd * 22, ty = 390 - hd * 18;
          ctx.save(); ctx.globalAlpha = Cv;
          mat(ctx, lerp(sx, tx, t), lerp(sy, ty, t), lerp(96, cw, t), lerp(300, chh, t), { rows: 12, cols: 5, seed: 120 + hd, stroke: rgba(COL.H, 0.9) });
          ctx.restore();
        }
        ctx.globalAlpha = Cv * t;
        dimLeft(ctx, 694, 390, chh, '{T:49}', COL.T, 26);
        dimBottom(ctx, 700, 390 + chh + 6, cw, '{D:64}', COL.D, 24);
        txt(ctx, '12 heads', 700 + 11 * 22 + cw + 30, 390 - 11 * 18 + 20, { size: 28, weight: 700, color: COL.H });
        mtxt(ctx, '.transpose(1, 2):  ({B:B}, {T:49}, {H:12}, {D:64})  →  ({B:B}, {H:12}, {T:49}, {D:64})', W / 2, 770, { size: 32, mono: true, align: 'center' });
        txt(ctx, 'each head = its own attention problem: 49 frames × 64 numbers', W / 2, 840, { size: 28, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 6) });
        ctx.restore();
      }
      // beat 4: scores per head
      const Dv = S.vis(4, 5);
      if (Dv > 0) {
        ctx.save(); ctx.globalAlpha = Dv;
        const y0 = 280;
        mat(ctx, 160, y0, 128, 196, { rows: 12, cols: 5, seed: 130, stroke: COL.A, left: ['{T:49}', COL.T], bottom: ['{D:64}', COL.D], title: 'Q_h', titleColor: COL.A });
        txt(ctx, '×', 360, y0 + 98, { size: 50, align: 'center', base: 'middle', color: COL.dim });
        mat(ctx, 440, y0 + 34, 196, 128, { rows: 5, cols: 12, seed: 131, stroke: COL.K, left: ['{D:64}', COL.D], bottom: ['{T:49}', COL.T], title: 'K_hᵀ', titleColor: COL.K });
        txt(ctx, '=', 700, y0 + 98, { size: 50, align: 'center', base: 'middle', color: COL.dim });
        const sa = S.p(4, 0.6, 3);
        ctx.globalAlpha = Dv * sa;
        for (let hd = 5; hd >= 1; hd--) { rrect(ctx, 800 + hd * 16, y0 - hd * 16, 196, 196, 6, COL.bg2, rgba(COL.H, 0.5), 2); }
        heat(ctx, 800, y0, 196, 49, PAT.mixed);
        dimLeft(ctx, 794, y0, 196, '{T:49}', COL.T, 24);
        dimBottom(ctx, 800, y0 + 202, 196, '{T:49}', COL.T, 24);
        txt(ctx, 'S_h', 900, y0 - 110, { size: 28, weight: 800, align: 'center' });
        txt(ctx, '× 12 heads', 1010, y0 - 70, { size: 22, weight: 700, color: COL.H });
        ctx.globalAlpha = Dv;
        const fa = S.p(4, 0.6, 8);
        mtxt(ctx, '({T:49}×{D:64}) · ({D:64}×{T:49}) = ({T:49}×{T:49}) per head', 1150, y0 + 40, { size: 24, mono: true, alpha: fa });
        mtxt(ctx, 'scores: ({B:B}, {H:12}, {T:49}, {T:49})', 1150, y0 + 100, { size: 30, mono: true, alpha: fa, weight: 600 });
        const sm = S.p(4, 0.6, 13);
        mtxt(ctx, '÷ √{D:64} = 8,  then softmax over the last axis', 1150, y0 + 170, { size: 28, alpha: sm });
        if (sm > 0) { ctx.globalAlpha = Dv * sm; arrow(ctx, 800, y0 + 60, 1000, y0 + 60, { color: COL.K, lw: 3 }); txt(ctx, 'each row sums to 1', 900, y0 + 330, { size: 22, color: COL.K, align: 'center', weight: 700 }); }
        ctx.restore();
      }
      // beat 5: A V
      const Ev = S.vis(5, 6);
      if (Ev > 0) {
        ctx.save(); ctx.globalAlpha = Ev;
        const y0 = 280;
        heat(ctx, 160, y0, 196, 49, PAT.mixed);
        dimLeft(ctx, 154, y0, 196, '{T:49}', COL.T, 24);
        dimBottom(ctx, 160, y0 + 202, 196, '{T:49}', COL.T, 24);
        txt(ctx, 'A_h', 258, y0 - 30, { size: 28, weight: 800, align: 'center', color: COL.H });
        txt(ctx, '×', 420, y0 + 98, { size: 50, align: 'center', base: 'middle', color: COL.dim });
        mat(ctx, 490, y0, 128, 196, { rows: 12, cols: 5, seed: 140, stroke: COL.D, bottom: ['{D:64}', COL.D], title: 'V_h', titleColor: COL.D });
        txt(ctx, '=', 680, y0 + 98, { size: 50, align: 'center', base: 'middle', color: COL.dim });
        const oa = S.p(5, 0.6, 4);
        ctx.globalAlpha = Ev * oa;
        for (let hd = 5; hd >= 1; hd--) rrect(ctx, 760 + hd * 16, y0 - hd * 16, 128, 196, 6, COL.bg2, rgba(COL.H, 0.5), 2);
        mat(ctx, 760, y0, 128, 196, { rows: 12, cols: 5, seed: 141, stroke: COL.B, bottom: ['{D:64}', COL.D], title: 'O_h', titleColor: COL.B });
        ctx.globalAlpha = Ev;
        mtxt(ctx, '({T:49}×{T:49}) · ({T:49}×{D:64}) = ({T:49}×{D:64}) per head', 1100, y0 + 60, { size: 24, mono: true, alpha: S.p(5, 0.6, 3) });
        mtxt(ctx, '({B:B}, {H:12}, {T:49}, {D:64})', 1100, y0 + 130, { size: 32, mono: true, alpha: S.p(5, 0.6, 7), weight: 600 });
        txt(ctx, 'row t of O_h = weighted average of value rows', 1100, y0 + 190, { size: 24, color: COL.dim, alpha: S.p(5, 0.6, 9) });
        ctx.restore();
      }
      // beat 6: merge + output projection
      const Fv = S.vis(6, 7);
      if (Fv > 0) {
        ctx.save(); ctx.globalAlpha = Fv;
        const t = easeIO(S.l(6, 1.6, 1.5));
        const x0 = 200, y0 = 300, sw = 32, h = 196;
        for (let hd = 0; hd < 12; hd++) {
          const x = lerp(x0 + hd * 60, x0 + hd * sw, t);
          mat(ctx, x, y0, sw, h, { rows: 12, cols: 2, seed: 150 + hd, stroke: rgba(COL.H, 1 - t * 0.7), gap: 1 });
        }
        ctx.globalAlpha = Fv * t;
        dimTop(ctx, x0, y0 - 6, 12 * sw, '{H:12} × {D:64} = {C:768}', COL.C, 24);
        dimLeft(ctx, x0 - 6, y0, h, '{T:49}', COL.T, 24);
        const pa = S.p(6, 0.6, 7);
        ctx.globalAlpha = Fv * pa;
        arrow(ctx, 620, y0 + h / 2, 760, y0 + h / 2, { color: COL.K });
        box(ctx, 770, y0 + h / 2 - 60, 260, 120, ['W_O', '768 × 768'], { size: 34, color: COL.K });
        arrow(ctx, 1040, y0 + h / 2, 1170, y0 + h / 2, { color: COL.K });
        mat(ctx, 1250, y0, bw, h, { rows: 14, cols: 28, seed: 160, left: ['{T:49}', COL.T], top: ['{C:768}', COL.C] });
        ctx.globalAlpha = Fv;
        mtxt(ctx, '({B:B}, {H:12}, {T:49}, {D:64})  →  transpose  →  ({B:B}, {T:49}, {H:12}, {D:64})  →  reshape  →  ({B:B}, {T:49}, {C:768})', W / 2, 700, { size: 26, mono: true, align: 'center', alpha: S.p(6, 0.6, 2) });
        txt(ctx, 'attention weights: 4 × (768×768 + 768) ≈ 2.36 M per layer', W / 2, 790, { size: 28, align: 'center', color: COL.dim, alpha: S.p(6, 0.6, 12) });
        ctx.restore();
      }
      // beat 7: head diversity
      const Gv = S.vis(7, 8);
      if (Gv > 0) {
        ctx.save(); ctx.globalAlpha = Gv;
        const hs = [['local', 'neighbouring frames', PAT.local], ['similar', 'frames that sound alike', PAT.similar], ['global', 'a few summary frames', PAT.global]];
        hs.forEach(([k, d, f], i) => {
          const a = S.p(7, 0.6, 2.5 + i * 2.5);
          const x = 170 + i * 560;
          heat(ctx, x, 230, 400, 49, f, a);
          txt(ctx, d, x + 200, 690, { size: 28, weight: 700, align: 'center', alpha: a, color: COL.H });
        });
        txt(ctx, 'illustrative patterns: each head learns its own "who is relevant to whom"', W / 2, 800, { size: 28, align: 'center', color: COL.dim, alpha: S.p(7, 0.6, 9) });
        ctx.restore();
      }
      // beat 8: quadratic cost
      const Hv = S.p(8);
      if (Hv > 0) {
        ctx.save(); ctx.globalAlpha = Hv;
        const sc = 1.9;
        heat(ctx, 300, 780 - 49 * sc, 49 * sc, 49, PAT.local);
        txt(ctx, '1 s → 49 frames', 300 + 49 * sc / 2, 830, { size: 26, weight: 700, align: 'center' });
        txt(ctx, '2,401 scores / head', 300 + 49 * sc / 2, 870, { size: 24, align: 'center', color: COL.dim, mono: true });
        const b = S.p(8, 0.8, 5);
        ctx.globalAlpha = Hv * b;
        heat(ctx, 900, 780 - 201 * sc * b, 201 * sc * b, 60, PAT.local);
        txt(ctx, '4 s → 201 frames', 900 + 201 * sc / 2, 830, { size: 26, weight: 700, align: 'center' });
        txt(ctx, '40,401 scores / head', 900 + 201 * sc / 2, 870, { size: 24, align: 'center', color: COL.dim, mono: true });
        mtxt(ctx, 'attention cost ∝ {T:T}²', 1400, 520, { size: 44, weight: 700 });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 11 transformer layer
  S_.push({
    id: 'layer', chapter: 11, title: 'One transformer layer, then twelve',
    code: 'model.encoder.layers[0..11]',
    beats: [
      "Attention is one half of a transformer layer. Here's the complete layer, as it is in the base model.",
      "The input goes through attention. The result is added back to the input: another residual connection. Then a layer norm.",
      "Next, a feed-forward network, applied to each frame independently. It's a linear layer from seven sixty-eight up to three thousand and seventy-two, a GELU, then a linear layer back down to seven sixty-eight. Attention mixes information between frames. The feed-forward network processes each frame on its own.",
      "Again: add the residual, and layer norm. The output shape equals the input shape: B by forty-nine by seven sixty-eight. That's what lets us stack layers like bricks.",
      "A quick parameter count. Attention has four seven sixty-eight by seven sixty-eight matrices: about two point four million weights. The feed-forward network has two seven sixty-eight by three thousand seventy-two matrices: about four point seven million. So about seven point one million per layer.",
      "The base model stacks twelve of these layers: about eighty-five million weights, most of the model. The LV-60 large model and X L S R use twenty-four layers, a hidden size of one thousand and twenty-four, sixteen heads, and a feed-forward size of four thousand and ninety-six. Those models apply layer norm before each block instead of after, and they give you twenty-five hidden states instead of thirteen, but the shapes flow in exactly the same way.",
    ],
    hud: { stage: 5, shape: '({B:B}, {T:49}, {C:768})' },
    draw(ctx, S) {
      const cx = 470, bw = 400;
      const hl = (b) => S.b === b ? COL.A : null;
      const a = S.p(0);
      ctx.save(); ctx.globalAlpha = a;
      const Y = { in: 150, att: 210, add1: 365, ln1: 410, ffn: 520, add2: 680, ln2: 725, out: 850 };
      chip(ctx, cx, Y.in, '({B:B}, {T:49}, {C:768})', { markup: true, size: 22, mono: true, align: 'center' });
      arrow(ctx, cx, Y.in + 22, cx, Y.att - 4, {});
      box(ctx, cx - bw / 2, Y.att, bw, 110, ['Multi-head self-attention', '12 heads × 64'], { size: 28, color: COL.H, glow: hl(1), stroke: hl(1) || COL.line });
      arrow(ctx, cx, Y.att + 110, cx, Y.add1 - 26, {});
      const plus = (y, g) => { ctx.strokeStyle = g ? COL.A : COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, y, 22, 0, 7); ctx.stroke(); txt(ctx, '+', cx, y + 2, { size: 34, weight: 700, align: 'center', base: 'middle' }); };
      plus(Y.add1, S.b === 1);
      parrow(ctx, [[cx, Y.in + 40], [cx - bw / 2 - 50, Y.in + 40], [cx - bw / 2 - 50, Y.add1], [cx - 26, Y.add1]], { color: COL.B, lw: 3 });
      arrow(ctx, cx, Y.add1 + 22, cx, Y.ln1 - 4, {});
      box(ctx, cx - bw / 2, Y.ln1, bw, 60, 'LayerNorm', { size: 26, color: COL.A, glow: hl(1), stroke: hl(1) || COL.line });
      arrow(ctx, cx, Y.ln1 + 60, cx, Y.ffn - 4, {});
      box(ctx, cx - bw / 2, Y.ffn, bw, 110, ['Feed-forward', '768 → 3072 → GELU → 768'], { size: 28, color: COL.C, glow: hl(2), stroke: hl(2) || COL.line });
      arrow(ctx, cx, Y.ffn + 110, cx, Y.add2 - 26, {});
      plus(Y.add2, S.b === 3);
      parrow(ctx, [[cx, Y.ln1 + 80], [cx - bw / 2 - 50, Y.ln1 + 80], [cx - bw / 2 - 50, Y.add2], [cx - 26, Y.add2]], { color: COL.B, lw: 3 });
      arrow(ctx, cx, Y.add2 + 22, cx, Y.ln2 - 4, {});
      box(ctx, cx - bw / 2, Y.ln2, bw, 60, 'LayerNorm', { size: 26, color: COL.A, glow: hl(3), stroke: hl(3) || COL.line });
      arrow(ctx, cx, Y.ln2 + 60, cx, Y.out - 22, {});
      chip(ctx, cx, Y.out, '({B:B}, {T:49}, {C:768})', { markup: true, size: 22, mono: true, align: 'center', stroke: S.b === 3 ? COL.A : null });
      ctx.restore();
      const R = 1000;
      // beat 1: residual
      const b1 = S.vis(1, 2);
      if (b1 > 0) {
        ctx.save(); ctx.globalAlpha = b1;
        mtxt(ctx, 'x  ←  LayerNorm( x + Attention(x) )', R, 300, { size: 36, mono: true, weight: 600 });
        wrap(ctx, 'The residual path (green) carries x around the block unchanged. The block only has to learn a correction to add.', R, 400, 780, 44, { size: 30, color: COL.dim });
        ctx.restore();
      }
      // beat 2: FFN
      const b2 = S.vis(2, 3);
      if (b2 > 0) {
        ctx.save(); ctx.globalAlpha = b2;
        const y = 300;
        const bar = (x, w, lbl, seed, a) => { ctx.globalAlpha = b2 * a; cells(ctx, x, y + 150 - w / 2, 1, 1, 60, w, () => null); rrect(ctx, x, 460 - w / 2, 60, w, 8, rgba(COL.C, 0.25), COL.C, 2); txt(ctx, lbl, x + 30, 460 + w / 2 + 40, { size: 26, mono: true, weight: 700, align: 'center', color: COL.C }); };
        bar(R + 20, 120, '768', 1, S.p(2, 0.5, 3));
        arrow(ctx, R + 100, 460, R + 190, 460, { alpha: S.p(2, 0.5, 4) });
        bar(R + 210, 480, '3072', 2, S.p(2, 0.5, 4));
        txt(ctx, 'GELU', R + 240, 200, { size: 24, weight: 700, color: COL.A, align: 'center', alpha: S.p(2, 0.5, 6) });
        arrow(ctx, R + 290, 460, R + 380, 460, { alpha: S.p(2, 0.5, 7) });
        bar(R + 400, 120, '768', 3, S.p(2, 0.5, 7));
        ctx.globalAlpha = b2;
        wrap(ctx, 'per frame: ({T:49}, {C:768}) → ({T:49}, {C:3072}) → ({T:49}, {C:768})', R, 800, 800, 40, { size: 28, mono: false, alpha: S.p(2, 0.6, 9) });
        mtxt(ctx, 'attention: mixes {T:across frames}', R + 520, 380, { size: 26, alpha: S.p(2, 0.6, 12) });
        mtxt(ctx, 'feed-forward: {C:within a frame}', R + 520, 430, { size: 26, alpha: S.p(2, 0.6, 12) });
        ctx.restore();
      }
      // beat 3
      const b3 = S.vis(3, 4);
      if (b3 > 0) {
        ctx.save(); ctx.globalAlpha = b3;
        mtxt(ctx, 'input shape  =  output shape', R + 60, 380, { size: 40, weight: 700 });
        mtxt(ctx, '({B:B}, {T:49}, {C:768})  →  ({B:B}, {T:49}, {C:768})', R + 60, 460, { size: 30, mono: true });
        for (let i = 0; i < 4; i++) {
          const a = S.p(3, 0.4, 3 + i * 0.4);
          rrect(ctx, R + 160, 780 - i * 60, 480, 50, 8, rgba(COL.H, 0.18 * a), rgba(COL.H, a), 2);
          txt(ctx, 'layer ' + (i + 1), R + 400, 780 - i * 60 + 32, { size: 22, weight: 700, align: 'center', color: COL.H, alpha: a });
        }
        ctx.restore();
      }
      // beat 4 param table
      const b4 = S.vis(4, 5);
      if (b4 > 0) {
        ctx.save(); ctx.globalAlpha = b4;
        const rows = [['Q, K, V, O projections', '4 × (768·768 + 768)', '2.36 M'], ['FFN up', '768·3072 + 3072', '2.36 M'], ['FFN down', '3072·768 + 768', '2.36 M'], ['2 LayerNorms', '2 × 2·768', '0.003 M'], ['per layer', '', '7.09 M']];
        rows.forEach((r, i) => {
          const a = S.p(4, 0.5, 1 + i * 1.6), y = 300 + i * 80;
          ctx.globalAlpha = b4 * a;
          if (i === 4) line(ctx, R, y - 50, R + 820, y - 50, COL.line, 2);
          txt(ctx, r[0], R, y, { size: 28, weight: i === 4 ? 800 : 600 });
          txt(ctx, r[1], R + 380, y, { size: 22, mono: true, color: COL.dim });
          txt(ctx, r[2], R + 820, y, { size: 28, mono: true, weight: 700, align: 'right', color: i === 4 ? COL.K : COL.text });
        });
        ctx.restore();
      }
      // beat 5: stack + base vs large
      const b5 = S.p(5);
      if (b5 > 0) {
        ctx.save(); ctx.globalAlpha = b5;
        const hd = ['', 'base', 'large / XLS-R'];
        const rows = [['layers', '12', '24'], ['hidden size', '768', '1024'], ['heads × dim', '12 × 64', '16 × 64'], ['FFN size', '3072', '4096'], ['LayerNorm', 'post-LN', 'pre-LN'], ['hidden_states', '13', '25'], ['total params', '94.4 M', '317 M / 315 M']];
        hd.forEach((h, j) => txt(ctx, h, R + [0, 340, 560][j], 250, { size: 26, weight: 800, color: j ? COL.A : COL.dim }));
        rows.forEach((r, i) => {
          const y = 310 + i * 64, a = S.p(5, 0.5, 5 + i * 1.3);
          ctx.globalAlpha = b5 * a;
          txt(ctx, r[0], R, y, { size: 26, weight: 600, color: COL.dim });
          txt(ctx, r[1], R + 340, y, { size: 26, mono: true, weight: 700 });
          txt(ctx, r[2], R + 560, y, { size: 26, mono: true, weight: 700 });
        });
        ctx.globalAlpha = b5;
        txt(ctx, '12 layers × 7.09 M ≈ 85 M', R, 800, { size: 30, weight: 700, color: COL.K, alpha: S.p(5, 0.6, 1) });
        ctx.restore();
      }
    },
  });
})();
