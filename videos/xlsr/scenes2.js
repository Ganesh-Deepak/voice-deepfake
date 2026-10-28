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

  const { THEME, easeOut4, glow, penTip } = E;
  const XL = window.XL;
  const RES = '({B:B}, {T:49}, {C:1024})';
  // ------------------------------------------------------------------ 6 projection
  S_.push({
    id: 'projection', chapter: 6, title: 'Transpose, layer norm, linear projection',
    code: S => S.b < 2 ? 'features.transpose(1, 2)' : S.b < 3 ? 'feature_projection.layer_norm' : 'feature_projection.projection',
    beats: [
      "The convolution output is B by five twelve by forty-nine: channels first, then time. The transformer wants time first, so we transpose, swapping the last two axes. Now it's B by forty-nine by five twelve. Nothing is computed here. We just view the same numbers in a different order.",
      "Think of it as forty-nine rows, one per frame. Each row is a vector of five hundred and twelve numbers describing that twenty-millisecond moment.",
      "Next comes layer normalization. For each frame on its own, compute the mean and standard deviation of its five hundred and twelve numbers. Subtract the mean, and divide by the standard deviation. Then multiply by a learned scale, and add a learned shift. Notice the direction: layer norm works across features, within one frame.",
      "Then a linear layer. Let's build it from scratch. A linear layer takes an input vector and produces an output vector. Each output number is a weighted sum of all the input numbers, plus a bias.",
      "Collect all the weights into a matrix. Here it's five hundred and twelve by one thousand and twenty-four: one column of weights for each of the one thousand and twenty-four outputs. One warning, because this trips everyone up: PyTorch stores this matrix the other way around. The weight of a linear layer from five twelve to ten twenty-four has shape ten twenty-four by five twelve, and the layer computes x times W transposed, plus b. Same numbers, stored transposed.",
      "Now stack all forty-nine frames as rows, and the whole layer becomes a single matrix multiplication. The rule: the inner sizes must match, and they disappear. Forty-nine by five twelve, times five twelve by ten twenty-four, gives forty-nine by ten twenty-four.",
      "The same weights are applied to every frame independently. A linear layer only changes the last axis; batch and time pass through untouched. Our tensor is now B by forty-nine by one thousand and twenty-four. One thousand and twenty-four is X L S R's hidden size, and it stays fixed from here to the very end.",
    ],
    hud: S => ({ stage: 2, shape: S.b < 1 && S.T(0) < 5 ? '({B:B}, {C:512}, {T:49})' : S.b < 6 ? '({B:B}, {T:49}, {C:512})' : '({B:B}, {T:49}, {C:1024})' }),
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
        const hb = 1 - S.p(1, 0.5, 0);   // the transpose labels make room for the frame callout in beat 1
        mtxt(ctx, '({B:B}, {C:512}, {T:49})', 1350, 360, { size: 40, mono: true, align: 'center', alpha: (1 - 0.6 * tr) * hb });
        arrow(ctx, 1350, 400, 1350, 480, { color: COL.dim, p: S.p(0, 0.6, 4.5), alpha: hb });
        mtxt(ctx, 'x.transpose(1, 2)', 1380, 450, { size: 24, mono: true, color: COL.dim, alpha: S.p(0, 0.6, 4.5) * hb });
        mtxt(ctx, '({B:B}, {T:49}, {C:512})', 1350, 540, { size: 40, mono: true, align: 'center', alpha: tr * hb });
        mtxt(ctx, 'same numbers, different order', 1350, 620, { size: 28, align: 'center', color: COL.dim, alpha: S.p(0, 0.6, 10) * hb });
        // highlight a frame (beat 1)
        const h = S.p(1, 0.6, 0.5);
        if (h > 0) {
          const fr = 5;
          ctx.globalAlpha = A * h;
          rrect(ctx, ax - 4, ay + fr * s - 4, R * s + 8, s + 8, 6, null, COL.A, 4);
          arrow(ctx, ax + R * s + 20, ay + fr * s + s / 2, 1000, ay + fr * s + s / 2, { color: COL.A });
          mtxt(ctx, 'frame 6 = a vector of {C:512} numbers', 1030, ay + fr * s + s / 2 + 10, { size: 30, weight: 600 });
          mtxt(ctx, 'one 20 ms step of audio (each frame sees 25 ms)', 1030, ay + fr * s + s / 2 + 56, { size: 26, color: COL.dim });
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
          mat(ctx, 1220, 640, 380, 240, { rows: 12, cols: 19, seed: 81, left: ['{C:512} inputs', COL.C], top: ['{C:1024} outputs', COL.C] });
          const cc = Math.floor(S.l(4, 5, 3) * 19) % 19;
          rrect(ctx, 1220 + cc * 20 - 3, 637, 26, 246, 5, null, COL.K, 3);
          txt(ctx, 'column j = weights of output j', 1410, 910, { size: 22, color: COL.K, align: 'center', alpha: S.p(4, 0.6, 3) });
          txt(ctx, 'W', 1000, 780, { size: 60, weight: 800, color: COL.K });
          const pt = S.p(4, 0.6, 9);
          if (pt > 0) { ctx.globalAlpha = N * m * pt; rrect(ctx, 140, 830, 800, 90, 12, 'rgba(242,204,96,0.08)', rgba(COL.K, 0.7), 2); mtxt(ctx, 'PyTorch stores it transposed:', 540, 866, { size: 22, align: 'center', color: COL.K, weight: 700 }); mtxt(ctx, 'layer.weight.shape = ({C:1024}, {C:512})   y = x·Wᵀ + b', 540, 900, { size: 22, mono: true, align: 'center' }); }
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
        mat(ctx, 600, y0, 380, 300, { rows: 20, cols: 25, seed: 84, left: ['{C:512}', COL.C], top: ['{C:1024}', COL.C], title: 'W', titleColor: COL.K, stroke: rgba(COL.K, 0.7) });
        txt(ctx, '=', 1050, y0 + 170, { size: 60, align: 'center', base: 'middle', color: COL.dim });
        const ya = S.p(5, 0.8, 5.5);
        ctx.globalAlpha = M * ya;
        mat(ctx, 1170, y0 + 60, 380, 196, { rows: 14, cols: 25, seed: 85, left: ['{T:49}', COL.T], top: ['{C:1024}', COL.C], title: 'Y' });
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
        const pA = '({T:49} × ', pB = '{C:512}', pC = ')  ×  (', pD = '{C:512}', pE = ' × {C:1024})  =  ({T:49} × {C:1024})';
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
        dimTop(ctx, 800, 244, 572, '{C:1024}', COL.C, 24);
        mtxt(ctx, '({B:B}, {T:49}, {C:512})  →  ({B:B}, {T:49}, {C:1024})', W / 2, 810, { size: 40, mono: true, align: 'center', alpha: S.p(6, 0.6, 4) });
        mtxt(ctx, 'only the last axis changes  ·  weights: 512 × 1024 + 1024 = 525,312', W / 2, 870, { size: 26, align: 'center', color: COL.dim, alpha: S.p(6, 0.6, 6) });
        const h = S.p(6, 0.6, 10);
        rrect(ctx, 1450, 330, 380, 200, 16, rgba(COL.C, 0.08 * h), rgba(COL.C, h), 3);
        txt(ctx, 'hidden size', 1640, 400, { size: 28, weight: 600, align: 'center', color: COL.dim, alpha: h });
        txt(ctx, '1024', 1640, 480, { size: 72, weight: 800, align: 'center', color: COL.C, alpha: h, mono: true });
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
    code: 'model.masked_spec_embed: (1024,)',
    beats: [
      "During pre-training, and in a lighter form as a regularizer during fine-tuning, some frames are masked before they enter the transformer.",
      "The recipe from the paper: every frame is picked as a starting point with probability six and a half percent. From each starting point, a span of ten consecutive frames is masked. Spans are allowed to overlap.",
      "Masked frames are not set to zero. They're overwritten by a single learned vector of one thousand and twenty-four numbers, the same vector at every masked position. It's the model's way of saying: something was here, but you can't see it.",
      "With these settings, roughly half of all frames end up masked. During pre-training, the transformer's job is to work out what belongs in those gaps, using only the surrounding context. And the shape, of course, is unchanged.",
    ],
    hud: { stage: 3, shape: '({B:B}, {T:49}, {C:1024})' },
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
      dimLeft(ctx, x0 - 6, y0, rows * ch, '{C:1024}', COL.C, 24);
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
        mtxt(ctx, 'every masked frame  ←  the same learned vector {M:m} ∈ ℝ{C:1024}', W / 2, 220, { size: 32, align: 'center', weight: 600 });
        ctx.globalAlpha = a0;
      }
      // stats
      const st = S.p(3, 0.8);
      if (st > 0) {
        ctx.globalAlpha = a0 * st;
        mtxt(ctx, `masked: {M:${MASKED.size}} of {T:49} frames  (${Math.round(MASKED.size / 49 * 100)}% here; ≈ 49% on average)`, W / 2, 220, { size: 32, align: 'center', weight: 600 });
        rrect(ctx, 260, 800, 1400, 120, 14, COL.panel, COL.line, 2);
        mtxt(ctx, 'shape unchanged: ({B:B}, {T:49}, {C:1024})', W / 2, 848, { size: 32, mono: true, align: 'center' });
        txt(ctx, "Hugging Face note: mask_time_prob ≈ fraction of frames masked (default 0.05 when fine-tuning), not the per-frame start probability.", W / 2, 895, { size: 24, align: 'center', color: COL.dim });
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
      "X L S R does this with another convolution, but this time sliding along the time axis of the one thousand and twenty-four dimensional frames. Its kernel is one hundred and twenty-eight frames wide: about two and a half seconds of audio.",
      "A convolution wants channels first, so the frames are transposed to B, by ten twenty-four, by forty-nine. To keep the length unchanged, the input is padded with sixty-four frames of zeros on each side. That gives fifty outputs instead of forty-nine, so the last one is trimmed off, and the result is transposed back to B, by forty-nine, by ten twenty-four.",
      "A full convolution from one thousand and twenty-four to one thousand and twenty-four channels, with such a wide kernel, would need one hundred and thirty-four million weights. So the channels are split into sixteen groups of sixty-four, and each group only talks to itself. That cuts the weights by a factor of sixteen, to about eight point four million.",
      "The result goes through GELU, and is added to the input. That's called a residual connection: the original frames are kept, and position-aware information is added on top. In X L S R there is no layer norm at this point: normalization happens inside every transformer block instead, and once more at the very end. The shape is still B by forty-nine by one thousand and twenty-four.",
      "Because this positional signal comes from a convolution, rather than a fixed table of positions, it's relative. It tells each frame about its neighbourhood, and it works for clips of any length.",
    ],
    hud: { stage: 4, shape: '({B:B}, {T:49}, {C:1024})' },
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
        const padA = S.ps(2, 1);
        for (let c = 0; c < tot; c++) {
          const real = c >= 64 && c < 64 + 49;
          if (!real && padA <= 0) continue;
          for (let r = 0; r < rows; r++) {
            ctx.fillStyle = real ? vcol(noise(c, r, 95) * 0.9, 0.9) : `rgba(60,70,90,${0.5 * padA})`;
            ctx.fillRect(x0 + c * cw + 0.5, y0 + r * ch + 1, cw - 1, ch - 2);
          }
        }
        dimTop(ctx, x0 + 64 * cw, y0 - 6, 49 * cw, '{T:49} real frames', COL.T, 24);
        dimLeft(ctx, x0 - 6, y0, rows * ch, '{C:1024}', COL.C, 24);
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
        // the transpose to channels-first, drawn when the voice says it
        const tp = S.b === 2 ? S.ps(2, 0, 0.5) : 0;
        if (tp > 0) {
          ctx.globalAlpha = Bv * tp;
          chip(ctx, 560, 232, '({B:B}, {T:49}, {C:1024})', { markup: true, size: 26, mono: true, align: 'center' });
          arrow(ctx, 720, 232, 860, 232, { color: COL.K, p: tp });
          txt(ctx, 'transpose', 790, 212, { size: 22, weight: 700, align: 'center', color: COL.K });
          chip(ctx, 1030, 232, '({B:B}, {C:1024}, {T:49})', { markup: true, size: 26, mono: true, align: 'center', stroke: COL.K });
          txt(ctx, 'rows = channels, columns = frames', 1230, 240, { size: 22, color: COL.dim });
          ctx.globalAlpha = Bv;
        }
        const fa = S.b === 2 ? S.ps(2, 2) : 0;
        if (fa > 0) {
          ctx.globalAlpha = Bv * fa;
          mtxt(ctx, 'length:  {T:49} + 64 + 64 = 177   →   177 − {K:128} + 1 = {T:50}   →   trim the last frame  →  {T:49}', W / 2, 790, { size: 30, mono: true, align: 'center' });
          mtxt(ctx, 'then transpose back:  ({B:B}, {C:1024}, {T:49})  →  ({B:B}, {T:49}, {C:1024})', W / 2, 850, { size: 28, mono: true, align: 'center', alpha: S.ps(2, 2, 0.6, 3) });
          txt(ctx, 'Conv1d(1024, 1024, kernel_size=128, padding=64, groups=16)   weight: (1024, 64, 128)', W / 2, 900, { size: 22, mono: true, align: 'center', color: COL.dim });
          ctx.globalAlpha = Bv;
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
        dimTop(ctx, x0, y0 - 6, sz, '{C:1024} in', COL.C, 24);
        dimLeft(ctx, x0 - 6, y0, sz, '{C:1024} out', COL.C, 24);
        txt(ctx, 'each block: 64 × 64 channels × 128 taps', x0 + sz / 2, y0 + sz + 50, { size: 24, align: 'center', color: COL.H, alpha: fill });
        const t1 = S.p(3, 0.6, 1);
        mtxt(ctx, 'full:  1024 × 1024 × 128  =  134.2 M', 1000, 380, { size: 36, mono: true, alpha: t1 });
        if (fill > 0.5) line(ctx, 990, 368, 1000 + 700 * clamp((fill - 0.5) * 2), 368, COL.R, 4);
        mtxt(ctx, '16 groups:  1024 × {H:64} × 128  =  {H:8.39 M}', 1000, 480, { size: 36, mono: true, alpha: S.p(3, 0.6, 7) });
        txt(ctx, 'channel group k only mixes with group k', 1000, 560, { size: 26, color: COL.dim, alpha: S.p(3, 0.6, 7) });
        ctx.restore();
      }
      // residual flow
      const R = S.p(4);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R * (1 - 0.0 * S.p(5));
        const y = 420;
        chip(ctx, 150, y, '({B:B}, {T:49}, {C:1024})', { markup: true, size: 24, mono: true, align: 'left' });
        arrow(ctx, 380, y, 560, y, {});
        box(ctx, 570, y - 70, 380, 140, ['Conv1d, k=128, groups=16', '1024 → 1024 channels'], { size: 26, color: COL.K });
        arrow(ctx, 960, y, 1030, y, {});
        box(ctx, 1040, y - 55, 150, 110, 'GELU', { size: 30, color: COL.A });
        arrow(ctx, 1200, y, 1290, y, {});
        ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(1320, y, 28, 0, 7); ctx.stroke();
        txt(ctx, '+', 1320, y + 2, { size: 40, weight: 700, align: 'center', base: 'middle' });
        // the residual path lights up, and a pulse runs along it, on "residual connection"
        const path = [[450, y], [450, y + 170], [1320, y + 170], [1320, y + 30]];
        const rs = S.ps(4, 1), rp = S.b === 4 ? Math.sin(Math.PI * clamp((S.T(4) - S.st(4, 1)) / 3.5)) : 0;
        parrow(ctx, path, { color: COL.B, lw: 3 + 3 * rp });
        if (rp > 0) {
          const segs = path.slice(1).map((q, i) => [path[i], q, Math.hypot(q[0] - path[i][0], q[1] - path[i][1])]);
          let d = ((S.T(4) - S.st(4, 1)) / 1.6 % 1) * segs.reduce((t, g) => t + g[2], 0);
          for (const [p0, p1, len] of segs) {
            if (d <= len) { glow(ctx, lerp(p0[0], p1[0], d / len), lerp(p0[1], p1[1], d / len), 34, COL.B, 0.9 * rp); break; }
            d -= len;
          }
        }
        txt(ctx, 'residual: keep the original x', 915, y + 210, { size: 26, color: COL.B, align: 'center', weight: 600, alpha: 0.5 + 0.5 * rs });
        arrow(ctx, 1352, y, 1420, y, {});
        const sp = S.b === 4 ? Math.sin(Math.PI * clamp((S.T(4) - S.st(4, 3)) / 2)) : 0;
        if (sp > 0) glow(ctx, 1600, y, 200, COL.C, 0.35 * sp);
        chip(ctx, 1430, y, '({B:B}, {T:49}, {C:1024})', { markup: true, size: 24, mono: true, align: 'left', stroke: sp > 0 ? COL.C : undefined });
        wrap(ctx, 'no LayerNorm here: each transformer layer normalises its own input (ch. 11)', 1380, y + 90, 500, 32, { size: 24, weight: 700, color: COL.dim, alpha: S.ps(4, 2) });
        mtxt(ctx, 'x  ←  x + GELU( conv(x) )', W / 2, 250, { size: 38, mono: true, align: 'center', weight: 600, alpha: S.p(4, 0.6, 3) });
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
      "To see how much frame one should attend to frame three, take the dot product of frame one's query with frame three's key. Multiply matching entries, and add. [+1.5] A large dot product means a good match.",
      "Do that for every pair of frames, and you get a grid of scores. Four frames give a four by four grid. [+1.5] Row i holds how much frame i likes every other frame.",
      "The scores are divided by the square root of the vector size. This stops them growing too large when vectors get long. For X L S R's attention heads, that's the square root of sixty-four, which is eight.",
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
      // "which other frames are relevant to me?": frame 1 reaches out to the other rows
      const fan = S.p(1, 0.6, 0.4) * (1 - S.ps(1, 2, 0.5));
      if (fan > 0) {
        ctx.save(); ctx.globalAlpha = fan;
        rrect(ctx, xX - 4, y0 - 4, 2 * cw + 8, ch + 8, 8, null, COL.A, 3);
        ctx.strokeStyle = COL.A; ctx.lineWidth = 3;
        for (let i = 1; i < 4; i++) {
          const k = clamp((S.T(1) - 0.8 - i * 0.4) / 0.6);
          if (k <= 0) continue;
          const ya = y0 + ch / 2, yb = y0 + i * ch + ch / 2;
          ctx.globalAlpha = fan * k;
          ctx.beginPath(); ctx.moveTo(xX + 2 * cw + 8, ya); ctx.quadraticCurveTo(xX + 2 * cw + 40 + i * 18, (ya + yb) / 2, xX + 2 * cw + 14, yb); ctx.stroke();
          arrow(ctx, xX + 2 * cw + 24, yb - 4, xX + 2 * cw + 12, yb, { color: COL.A, head: 12 });
        }
        ctx.globalAlpha = fan;
        txt(ctx, 'frame 1 asks: which frames matter to me?', xX, y0 + 4 * ch + 60, { size: 24, weight: 700, color: COL.A });
        ctx.restore();
      }
      const a1 = S.ps(1, 1);
      const trio = [[xQ, Q, 'Q  (query)', COL.A, 'W_Q'], [xK, K, 'K  (key)', COL.K, 'W_K'], [xV, V, 'V  (value)', COL.D, 'W_V']];
      // "three different linear layers": three empty slots, fed from X, that fill in one by one
      trio.forEach(([x, M, name, col, wn], i) => {
        const pa = S.ps(1, 1, 0.6, 1.2 + i * 0.6) * (1 - S.ps(1, 2 + i, 0.4));
        if (pa <= 0) return;
        ctx.save(); ctx.globalAlpha = pa;
        ctx.setLineDash([10, 8]); rrect(ctx, x, y0, 2 * cw, 4 * ch, 10, rgba(col, 0.06), col, 2); ctx.setLineDash([]);
        mtxt(ctx, 'X · ' + wn, x + cw, y0 + 2 * ch - 6, { size: 26, mono: true, weight: 700, align: 'center', color: col });
        txt(ctx, 'learned 2 × 2', x + cw, y0 + 2 * ch + 30, { size: 20, align: 'center', color: COL.dim });
        ctx.strokeStyle = rgba(col, 0.8); ctx.lineWidth = 2.5;
        const xa = xX + cw, xb = x + cw;
        ctx.beginPath(); ctx.moveTo(xa, y0 - 72); ctx.quadraticCurveTo((xa + xb) / 2, y0 - 120 - i * 14, xb, y0 - 72); ctx.stroke();
        arrow(ctx, xb - 8, y0 - 84, xb, y0 - 70, { color: col, head: 12 });
        ctx.restore();
      });
      trio.forEach(([x, M, name, col], i) => {
        const a = S.ps(1, 2 + i);   // Q, K, V each appear on their own sentence
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha = a;
        txt(ctx, name, x + cw, y0 - 40, { size: 26, weight: 800, align: 'center', color: col });
        const hl = (r, c) => (S.b === 2 && ((i === 0 && r === 0) || (i === 1 && r === 2)));
        numMat(ctx, x, y0, M, cw, ch, { size: 20, hl, hlColor: col });
        ctx.restore();
      });
      if (a1 > 0) txt(ctx, 'Q = X·W_Q    K = X·W_K    V = X·W_V', 1060, y0 + 4 * ch + 60, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: S.ps(1, 1, 0.6, 2) * (1 - S.p(2, 0.4)) });
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
        mtxt(ctx, 'score / √d      toy: d = 2 → ÷ 1.41      XLS-R heads: d = {D:64} → ÷ {D:8}', 960, y0 + 4 * ch + 70, { size: 30, align: 'center', alpha: e4, weight: 600 });
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
      "Now let's do it with the real shapes. The input is B by forty-nine by ten twenty-four.",
      "Three linear layers, each ten twenty-four to ten twenty-four, produce the queries, keys and values. Each one is B by forty-nine by ten twenty-four.",
      "Instead of one big attention, X L S R uses sixteen heads. We split the one thousand and twenty-four features into sixteen chunks of sixty-four. That's a reshape: B by forty-nine by sixteen by sixty-four.",
      "Then we swap the time and head axes, giving B by sixteen by forty-nine by sixty-four. Now each head is its own little attention problem: forty-nine frames, sixty-four numbers each.",
      "Queries times keys transposed: forty-nine by sixty-four, times sixty-four by forty-nine, gives a forty-nine by forty-nine score matrix, for each head. The scores tensor is B by sixteen by forty-nine by forty-nine. Divide by eight, and softmax along the last axis.",
      "Multiply the attention weights, forty-nine by forty-nine, by the values, forty-nine by sixty-four, and we're back to forty-nine by sixty-four per head. The tensor is B by sixteen by forty-nine by sixty-four.",
      "Now undo the split. Swap the axes back, and merge sixteen times sixty-four into one thousand and twenty-four. A final linear layer, the output projection, mixes information across heads. We're back to B by forty-nine by ten twenty-four.",
      "Why multiple heads? Each head can learn its own notion of relevance. One might track neighbouring frames. Another might link frames that sound similar. Another might gather a summary of the whole clip. And each head only costs a sixty-four dimensional slice.",
      "Note the cost: the score matrix grows with the square of the number of frames. One second gives forty-nine squared, about twenty-four hundred scores per head. A four-second detector crop gives two hundred and one frames, and over forty thousand scores per head, for each of the sixteen heads.",
    ],
    hud: S => {
      const X = '({B:B}, {T:49}, {C:1024})', SPLIT = '({B:B}, {T:49}, {H:16}, {D:64})', HEADS = '({B:B}, {H:16}, {T:49}, {D:64})', SC = '({B:B}, {H:16}, {T:49}, {T:49})';
      // [shape before, shape after, sentence that states the new shape]: the capsule changes when the voice says it
      const R = [[X, X, 0], [X, X, 0], [X, SPLIT, 2], [SPLIT, HEADS, 0], [HEADS, SC, 1], [SC, HEADS, 1], [HEADS, X, 1], [SC, SC, 0], [SC, SC, 0]][S.b];
      return { stage: 5, shape: S.T(S.b) >= S.st(S.b, R[2]) ? R[1] : R[0] };
    },
    draw(ctx, S) {
      const s = 0.5, fh = 4; // px per feature, px per frame
      const bw = 768 * s, bh = 49 * fh;
      // beats 0-1: X -> Q K V
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        mat(ctx, 160, 420, bw, bh, { rows: 14, cols: 28, seed: 101, left: ['{T:49}', COL.T], top: ['{C:1024}', COL.C], title: 'X' });
        const qkv = [['Q', COL.A, 170], ['K', COL.K, 430], ['V', COL.D, 690]];
        qkv.forEach(([n, col, y], i) => {
          const a = S.p(1, 0.6, 1 + i * 0.8);
          if (a <= 0) return;
          ctx.globalAlpha = A * a;
          const ey = y + bh * 0.4;
          arrow(ctx, 160 + bw + 30, 518, 900, ey, { color: col, lw: 3 });
          chip(ctx, 740, lerp(518, ey, 0.55), `W_${n}  1024×1024`, { size: 20, mono: true, color: col, align: 'center', fill: COL.bg, stroke: rgba(col, 0.6) });
          mat(ctx, 1000, y, bw, bh * 0.8, { rows: 11, cols: 28, seed: 110 + i, stroke: col, left: ['{T:49}', COL.T] });
          txt(ctx, n, 1000 + bw + 30, ey + 16, { size: 44, weight: 800, color: col });
          mtxt(ctx, '({B:B}, {T:49}, {C:1024})', 1460, ey + 12, { size: 28, mono: true });
        });
        ctx.restore();
      }
      // beat 2: split Q into 12 slices
      const Bv = S.vis(2, 3);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        const x0 = 380, y0 = 330, w = 1152, h = 300, sw = w / 16;
        const sp = easeIO(S.l(2, 1.5, 2.5));
        for (let hd = 0; hd < 16; hd++) {
          const x = x0 + hd * (sw + 10 * sp) - 75 * sp;
          mat(ctx, x, y0, sw, h, { rows: 16, cols: 4, seed: 120 + hd, stroke: sp > 0.5 ? rgba(COL.H, 0.9) : COL.line });
          if (sp > 0.5) txt(ctx, 'h' + (hd + 1), x + sw / 2, y0 + h + 40, { size: 22, weight: 700, align: 'center', color: COL.H, alpha: sp });
        }
        dimLeft(ctx, x0 - 70 * sp - 6, y0, h, '{T:49}', COL.T, 26);
        ctx.globalAlpha = Bv * (1 - sp);
        dimTop(ctx, x0, y0 - 6, w, '{C:1024}', COL.C, 26);
        ctx.globalAlpha = Bv * sp;
        dimTop(ctx, x0 - 75, y0 - 6, sw, '{D:64}', COL.D, 24);
        txt(ctx, 'Q', 150, y0 + h / 2, { size: 48, weight: 800, color: COL.A, base: 'middle' });
        ctx.globalAlpha = Bv;
        mtxt(ctx, '{C:1024}  =  {H:16} heads × {D:64}', W / 2, 770, { size: 38, mono: true, align: 'center', alpha: S.p(2, 0.6, 3) });
        mtxt(ctx, 'q.view(B, {T:49}, {H:16}, {D:64})', W / 2, 840, { size: 30, mono: true, align: 'center', color: COL.dim, alpha: S.p(2, 0.6, 6) });
        ctx.restore();
      }
      // beat 3: stack of heads
      const Cv = S.vis(3, 4);
      if (Cv > 0) {
        ctx.save(); ctx.globalAlpha = Cv;
        const cw = 128, chh = 196;
        const t = easeIO(S.l(3, 1.6, 0.5));
        for (let hd = 15; hd >= 0; hd--) {
          const sx = 380 + hd * 72 - 75, sy = 330;
          const tx = 700 + hd * 16, ty = 390 - hd * 13;
          ctx.save(); ctx.globalAlpha = Cv;
          mat(ctx, lerp(sx, tx, t), lerp(sy, ty, t), lerp(72, cw, t), lerp(300, chh, t), { rows: 12, cols: 5, seed: 120 + hd, stroke: rgba(COL.H, 0.9) });
          ctx.restore();
        }
        ctx.globalAlpha = Cv * t;
        dimLeft(ctx, 694, 390, chh, '{T:49}', COL.T, 26);
        dimBottom(ctx, 700, 390 + chh + 6, cw, '{D:64}', COL.D, 24);
        txt(ctx, '16 heads', 700 + 15 * 16 + cw + 30, 390 - 15 * 13 + 20, { size: 28, weight: 700, color: COL.H });
        mtxt(ctx, '.transpose(1, 2):  ({B:B}, {T:49}, {H:16}, {D:64})  →  ({B:B}, {H:16}, {T:49}, {D:64})', W / 2, 770, { size: 32, mono: true, align: 'center' });
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
        txt(ctx, '× 16 heads', 1010, y0 - 70, { size: 22, weight: 700, color: COL.H });
        ctx.globalAlpha = Dv;
        const fa = S.p(4, 0.6, 8);
        mtxt(ctx, '({T:49}×{D:64}) · ({D:64}×{T:49}) = ({T:49}×{T:49}) per head', 1150, y0 + 40, { size: 24, mono: true, alpha: fa });
        mtxt(ctx, 'scores: ({B:B}, {H:16}, {T:49}, {T:49})', 1150, y0 + 100, { size: 30, mono: true, alpha: fa, weight: 600 });
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
        mtxt(ctx, '({B:B}, {H:16}, {T:49}, {D:64})', 1100, y0 + 130, { size: 32, mono: true, alpha: S.p(5, 0.6, 7), weight: 600 });
        txt(ctx, 'row t of O_h = weighted average of value rows', 1100, y0 + 190, { size: 24, color: COL.dim, alpha: S.p(5, 0.6, 9) });
        ctx.restore();
      }
      // beat 6: merge + output projection
      const Fv = S.vis(6, 7);
      if (Fv > 0) {
        ctx.save(); ctx.globalAlpha = Fv;
        const t = easeIO(S.l(6, 1.6, 1.5));
        const x0 = 200, y0 = 300, sw = 24, h = 196;
        for (let hd = 0; hd < 16; hd++) {
          const x = lerp(x0 + hd * 46, x0 + hd * sw, t);
          mat(ctx, x, y0, sw, h, { rows: 12, cols: 2, seed: 150 + hd, stroke: rgba(COL.H, 1 - t * 0.7), gap: 1 });
        }
        ctx.globalAlpha = Fv * t;
        dimTop(ctx, x0, y0 - 6, 16 * sw, '{H:16} × {D:64} = {C:1024}', COL.C, 24);
        dimLeft(ctx, x0 - 6, y0, h, '{T:49}', COL.T, 24);
        const pa = S.p(6, 0.6, 7);
        ctx.globalAlpha = Fv * pa;
        arrow(ctx, 620, y0 + h / 2, 760, y0 + h / 2, { color: COL.K });
        box(ctx, 770, y0 + h / 2 - 60, 260, 120, ['W_O', '1024 × 1024'], { size: 34, color: COL.K });
        arrow(ctx, 1040, y0 + h / 2, 1170, y0 + h / 2, { color: COL.K });
        mat(ctx, 1250, y0, bw, h, { rows: 14, cols: 28, seed: 160, left: ['{T:49}', COL.T], top: ['{C:1024}', COL.C] });
        ctx.globalAlpha = Fv;
        mtxt(ctx, '({B:B}, {H:16}, {T:49}, {D:64})  →  transpose  →  ({B:B}, {T:49}, {H:16}, {D:64})  →  reshape  →  ({B:B}, {T:49}, {C:1024})', W / 2, 700, { size: 26, mono: true, align: 'center', alpha: S.p(6, 0.6, 2) });
        txt(ctx, 'attention weights: 4 × (1024×1024 + 1024) ≈ 4.2 M per layer', W / 2, 790, { size: 28, align: 'center', color: COL.dim, alpha: S.p(6, 0.6, 8) });
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

  // ------------------------------------------------------------------ 11 one transformer layer (pre-norm)
  S_.push({
    id: 'x_layer', chapter: 11, title: 'One transformer layer (pre-norm)', code: 'Wav2Vec2EncoderLayerStableLayerNorm',
    beats: [
      "Attention is one half of a transformer layer. Here's the complete layer, the way X L S R arranges it, with a layer norm in front of each part. This is called pre-norm.",
      "First: normalize, attend, and add the result back onto the input. That's a residual connection. The stream of frames is never overwritten, only added to.",
      "Second: normalize again, and run a feed-forward network on each frame by itself: a linear layer from one thousand and twenty-four up to four thousand and ninety-six, a GELU, and a linear layer back down to one thousand and twenty-four. Then add the residual again.",
      "Attention mixes information between frames. The feed-forward network processes each frame on its own. And the output has exactly the input's shape, B by forty-nine by one thousand and twenty-four, which is what lets us stack layers like bricks.",
      "Count the weights. Attention has four matrices of one thousand and twenty-four by one thousand and twenty-four: about four point two million. The feed-forward network has two of one thousand and twenty-four by four thousand and ninety-six: about eight point four million. Together, with the two layer norms, about twelve point six million per layer.",
      "X L S R stacks twenty-four of these layers, one after another: about three hundred and two million weights, ninety-six percent of the whole model. Every layer reads and writes the same stream of frames, so the tensor flows through all twenty-four without ever changing shape.",
    ],
    hud: S => ({ stage: 5, shape: S.b === 2 && S.T(2) > 3 && S.T(2) < 9 ? '({B:B}, {T:49}, {C:4096})' : RES }),
    draw(ctx, S) {
      // the residual stream as a vertical rail with blocks hanging off it
      const x0 = 330, top = 200, bot = 900, eqa = 1 - S.p(4, 0.5, 0);
      const ra = S.p(0, 0.8, 0.5);
      ctx.save(); ctx.globalAlpha *= ra;
      const g = ctx.createLinearGradient(0, bot, 0, top); g.addColorStop(0, rgba(THEME.a, 0.9)); g.addColorStop(1, rgba(THEME.b, 0.9));
      ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, bot); ctx.lineTo(x0, top); ctx.stroke(); ctx.restore();
      // pulse travelling up the stream
      const py = bot - ((S.local * 160) % (bot - top));
      glow(ctx, x0, py, 40, THEME.a, 0.7 * ra);
      txt(ctx, 'residual stream', x0, bot + 46, { size: 22, weight: 700, align: 'center', color: COL.dim, alpha: ra });
      mtxt(ctx, RES, x0 + 40, top - 70, { size: 24, mono: true, align: 'left', alpha: ra });
      // the whole layer appears dimmed on "Here's the complete layer"; each part lights up when it is named
      const s1 = S.st(0, 1), sk = 0.32 * S.p(0, 0.8, s1);
      const lnCue = s1 + 0.62 * (S.st(0, 2) - s1);           // "...a layer norm in front of each part"
      const lnPulse = S.b === 0 ? Math.sin(Math.PI * clamp((S.T(0) - lnCue) / 1.6)) : 0;
      const unit = (y, label, col, t0, b, ln) => {
        const a = Math.max(sk, S.p(b, 0.6, t0), ln ? 0.85 * S.p(0, 0.5, lnCue) : 0);
        if (a <= 0) return;
        arrow(ctx, x0, y + 60, x0 + 100, y + 60, { color: col, alpha: a, p: Math.min(1, a / 0.3) });
        if (ln && lnPulse > 0) glow(ctx, x0 + 228, y + 60, 150, col, 0.5 * lnPulse);
        box(ctx, x0 + 110, y + 20, 236, 80, label, { size: 26, color: COL.text, stroke: col, alpha: a });
      };
      const plus = (y, col, b, t0) => {
        const a = Math.max(sk, S.p(b, 0.6, t0));
        if (a <= 0) return;
        arrow(ctx, x0 + 228, y + 80, x0 + 20, y + 10, { color: col, alpha: a, p: Math.min(1, a / 0.3) });
        chip(ctx, x0, y, '+', { size: 34, align: 'center', color: COL.text, stroke: col, alpha: a });
      };
      // attention half
      unit(640, 'LayerNorm', COL.A, 0.5, 1, true); unit(520, 'Multi-head attn', COL.H, 2, 1);
      plus(460, COL.H, 1, 4.5);
      // feed-forward half
      unit(340, 'LayerNorm', COL.A, 0.5, 2, true); unit(220, 'Feed-forward', COL.C, 1.5, 2);
      plus(160, COL.C, 2, 10);
      txt(ctx, 'pre-norm: LN before each part', 720, 706, { size: 24, weight: 700, color: COL.A, alpha: S.vis(0, 1) * S.ps(0, 2) });
      mtxt(ctx, 'x = x + Attn( LN(x) )', 700, 560, { size: 30, mono: true, alpha: S.p(1, 0.6, 1) * eqa });
      mtxt(ctx, 'x = x + FFN( LN(x) )', 700, 260, { size: 30, mono: true, alpha: S.p(2, 0.6, 1) * eqa });
      // FFN in 3-D: 1024 -> 4096 -> 1024 for every frame
      const ff = S.p(2, 0.7, 2.5) * (1 - S.p(4, 0.6, 0));
      if (ff > 0) {
        const cam = S3.camera({ yaw: 0.45, pitch: 0.2, dist: 2100, tx: 0, ty: 0, tz: 0, cx: 1520, cy: 660 });
        const blk = (x, h, c, seed, col, t0) => S3.block(ctx, cam, { x, y: 0, z: 0, w: 150, h, d: 40, cells: [Math.round(h / 26), 6, 2], seed, alpha: ff * S.p(2, 0.6, t0), color: col, tags: { h: ['C', c] } });
        blk(-380, 230, 1024, 181, THEME.a, 2.5); blk(0, 420, 4096, 182, COL.C, 4.5); blk(380, 230, 1024, 183, THEME.a, 7);
        S3.caption(ctx, cam, -190, 250, 0, 'Linear ↑', { size: 22, mono: false, weight: 700, color: COL.C, alpha: ff * S.p(2, 0.6, 4.5) });
        S3.caption(ctx, cam, 190, 250, 0, 'GELU · Linear ↓', { size: 22, mono: false, weight: 700, color: COL.C, alpha: ff * S.p(2, 0.6, 7) });
        S3.caption(ctx, cam, 0, -290, 0, 'each of the 49 frames, independently', { size: 22, mono: false, weight: 700, color: COL.dim, alpha: ff * S.p(2, 0.6, 8) });
      }
      const mix = S.p(3, 0.6, 0.5) * (1 - S.p(4, 0.6, 0));
      if (mix > 0) {
        chip(ctx, 1420, 880, 'attention: between frames · FFN: within a frame', { size: 26, align: 'center', color: COL.text, stroke: COL.line, alpha: mix });
      }
      // parameter bars
      const pb = S.p(4, 0.7, 0.5) * (1 - S.p(5, 0.5, 0));
      if (pb > 0) {
        XL.card(ctx, 900, 380, 940, 470, pb);
        const rows = [['attention: Q, K, V, out  4 × (1024² + 1024)', 4198400, COL.H], ['feed-forward: 1024 → 4096 → 1024', 8393728, COL.C], ['2 layer norms', 4096, COL.A]];
        rows.forEach(([lab, v, col], i) => {
          const k = easeOut4((S.T(4) - 1 - i * 2.2) / 0.8);
          txt(ctx, lab, 940, 450 + i * 110, { size: 22, weight: 600, color: COL.dim, alpha: k });
          rrect(ctx, 940, 465 + i * 110, Math.max(4, 560 * v / 8393728 * k), 34, 8, rgba(col, 0.8), null);
          txt(ctx, v.toLocaleString('en-US'), 1800, 492 + i * 110, { size: 26, mono: true, weight: 700, color: col, align: 'right', alpha: k });
        });
        line(ctx, 940, 790, 1800, 790, rgba('#8aa0c0', 0.3 * pb), 1.5);
        txt(ctx, 'one layer', 940, 830, { size: 26, weight: 700, alpha: S.p(4, 0.6, 8) });
        E.countUp(ctx, 12596224, 0, 1800, 832, S.T(4) - 8, { size: 34, align: 'right', color: THEME.a });
      }
      // twenty-four layers, stacked like the bricks they are
      const st = S.p(5, 0.7, 0.3);
      if (st > 0) {
        XL.card(ctx, 900, 190, 940, 720, st);
        txt(ctx, '× 24 layers', 940, 262, { size: 48, weight: 800, color: THEME.a, alpha: st });
        txt(ctx, '302,309,376 weights · 96 % of the model', 940, 306, { size: 26, weight: 600, color: COL.dim, alpha: S.p(5, 0.6, 2) });
        // opaque slabs drawn back to front, so each one reads as a separate brick
        for (let i = 23; i >= 0; i--) {
          const k = clamp((S.T(5) - 0.6 - (23 - i) * 0.07) / 0.35);
          if (k <= 0) continue;
          const x = 960 + i * 12, y = 790 - i * 18, c = E.mix(THEME.a, THEME.b, i / 23);
          ctx.save(); ctx.globalAlpha *= k;
          rrect(ctx, x, y, 420, 56, 10, E.mix(COL.panel, c, 0.32), c, 2);
          ctx.restore();
          if (i === 0 || i === 11 || i === 23) {
            line(ctx, x + 424, y + 10, x + 446, y + 10, rgba(c, 0.8 * k), 2);
            txt(ctx, `layer ${i + 1}`, x + 454, y + 17, { size: 22, weight: 700, color: c, alpha: k });
          }
        }
        mtxt(ctx, 'every layer: ({B:B}, {T:49}, {C:1024}) → ({B:B}, {T:49}, {C:1024})', 1370, 886, { size: 24, mono: true, align: 'center', alpha: S.p(5, 0.6, 4) });
      }
    },
  });

})();
