// XLSR-MamBo back-end (MamBo-3-Hydra-N3). Shapes traced with verify/mambo_shapes.py, a CPU replica of
// refs/XLSR-MamBo whose parameter count (319,373,323) matches the paper's 319.37M.
(function () {
  const { W, COL, clamp, lerp, easeIO, noise, fmt, fmtInt, rgba, vcol, scol, txt, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box,
    cells, mat, dimTop, dimLeft, dimBottom, dimRight, stack, numRow, numMat, brace, cross, drawWave } = E;
  const S_ = window.SCENES;
  const RES = '({B:B}, {T:208}, {C:128})';
  const BLK = [['Hydra', COL.M], ['Hydra', COL.M], ['Hydra', COL.M], ['SwiGLU', COL.C], ['MHA', COL.H], ['SwiGLU', COL.C]];
  const sig = x => 1 / (1 + Math.exp(-x));

  function plotAxes(ctx, ox, oy, sx, sy, x0, x1, y0, y1, box) {
    rrect(ctx, box[0], box[1], box[2], box[3], 16, COL.panel, COL.line, 2);
    line(ctx, ox + x0 * sx, oy, ox + x1 * sx, oy, COL.faint, 2); line(ctx, ox, oy - y1 * sy, ox, oy - y0 * sy, COL.faint, 2);
  }
  function curve(ctx, f, ox, oy, sx, sy, x0, x1, col, lw, prog = 1, dash) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    const n = 300;
    for (let i = 0; i <= n * prog; i++) { const x = x0 + (x1 - x0) * i / n, y = f(x); i ? ctx.lineTo(ox + x * sx, oy - y * sy) : ctx.moveTo(ox + x * sx, oy - y * sy); }
    ctx.stroke(); ctx.restore();
  }

  // ------------------------------------------------------------------ 0 intro
  S_.push({
    id: 'm_intro', chapter: 0, title: 'Introduction', noHeader: true,
    beats: [
      "This is the third video in the series. We've followed wav2vec 2.0, and the graph-based AASIST back-end. Now we'll trace XLSR-MamBo, a back-end built from state space models and attention.",
      "XLSR-MamBo was published by Ng and colleagues in the Findings of ACL 2026. We'll follow its best configuration: MamBo three, Hydra, N three. The official code needs GPU kernels, so we rebuilt it in plain PyTorch to trace every shape. The rebuilt model's parameter count matches the paper exactly.",
      "There are some new axes this time. Yellow S, for the state size of the state space model. Lavender E, for the expanded inner width. Purple H, for heads, and pink P, for the size of each head.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: '({B:B}, {T:208}, {C:1024})' } : null,
    draw(ctx, S) {
      // cold open: a forward scan, a backward scan (Hydra), then attention links distant frames
      const T = S.T(0), x0 = 150, x1 = 1770, n = 36, tw = (x1 - x0) / n, cy = 700;
      E.kicker(ctx, 'DEEPFAKE DETECTORS · SHAPE BY SHAPE', x0 + 4, 214, T + 0.9);
      chip(ctx, x0 + 600, 206, 'EPISODE 3 / 3', { size: 20, mono: true, color: E.THEME.a, stroke: rgba(E.THEME.a, 0.6), fill: rgba(E.THEME.a, 0.08), alpha: S.p(0, 0.5, 0.2) });
      E.titleRise(ctx, 'XLSR-MamBo', x0, 400, T + 0.6, { size: 150 });
      txt(ctx, 'state space models + attention, shape by shape', x0 + 6, 470, { size: 38, weight: 500, color: COL.dim, alpha: S.p(0, 0.9, 0.5) });
      const so = 1 - S.p(2, 0.5, 0.6);
      [[3.93, 2, ' M', 'back-end parameters'], [30, 0, '', 'blocks, one shape'], [0.81, 2, ' %', 'EER, ASVspoof 2021 LA']].forEach(([v, d, suf, lab], i) => {
        const t0 = 8.8 + i * 0.8, y = 250 + i * 112;
        E.countUp(ctx, v, d, x1, y, T - t0, { size: 56, suf, align: 'right', color: i === 0 ? E.THEME.a : COL.text, alpha: so });
        txt(ctx, lab, x1, y + 34, { size: 22, weight: 600, color: COL.dim, align: 'right', alpha: S.p(0, 0.5, t0 + 0.2) * so });
      });
      // scans: the head carries a state that fades with distance (decay)
      const fw = clamp((T - 2.0) / 3.0) * (n + 6) - 3, bw = n + 3 - clamp((T - 5.2) / 3.0) * (n + 6);
      const att = S.l(0, 1.4, 8.6);
      for (let i = 0; i < n; i++) {
        const k = E.easeOut4((T - 0.3 - i * 0.03) / 0.4);
        if (k <= 0) continue;
        const x = x0 + i * tw + 3, w = tw - 6, y = cy - 30 + (1 - k) * 30;
        const f = i <= fw ? Math.exp(-(fw - i) / 7) : 0, b = T > 5.2 && i >= bw ? Math.exp(-(i - bw) / 7) : 0;
        const fDone = T > 5.0 ? 0.55 : 0, bDone = T > 8.2 ? 0.55 : 0;
        rrect(ctx, x, y, w, 60, 7, rgba('#1a2435', k), rgba('#3a4860', k), 1.5);
        const ff = Math.max(f, i <= fw ? fDone : 0), bb = Math.max(b, i >= bw && T > 5.2 ? bDone : 0);
        if (ff > 0) rrect(ctx, x, y, w, 30, 7, rgba(E.THEME.a, 0.85 * ff * k), null);
        if (bb > 0) rrect(ctx, x, y + 30, w, 30, 7, rgba(E.THEME.b, 0.85 * bb * k), null);
      }
      if (T > 2.0 && fw < n + 2) E.penTip(ctx, x0 + clamp(fw + 0.5, 0, n) * tw, cy - 15, E.THEME.a);
      if (T > 5.2 && bw > -2) E.penTip(ctx, x0 + clamp(bw + 0.5, 0, n) * tw, cy + 15, E.THEME.b);
      txt(ctx, 'forward scan  →', x0, cy + 74, { size: 24, weight: 700, color: E.THEME.a, alpha: S.p(0, 0.5, 2.0) });
      txt(ctx, '←  backward scan', x1, cy + 74, { size: 24, weight: 700, color: E.THEME.b, align: 'right', alpha: S.p(0, 0.5, 5.2) });
      // attention: arcs between distant frames
      [[3, 29], [8, 21], [12, 33], [17, 26], [5, 14]].forEach(([a, b], j) => {
        const k = clamp(att * 1.6 - j * 0.15);
        if (k <= 0) return;
        const xa = x0 + (a + 0.5) * tw, xb = x0 + (b + 0.5) * tw, hgt = 40 + (b - a) * 5;
        ctx.save(); ctx.strokeStyle = rgba(COL.H, 0.8); ctx.lineWidth = 2.4; ctx.setLineDash([2000 * k, 4000]);
        ctx.beginPath(); ctx.moveTo(xa, cy - 34); ctx.quadraticCurveTo((xa + xb) / 2, cy - 34 - hgt * 2, xb, cy - 34); ctx.stroke(); ctx.restore();
      });
      txt(ctx, '+ attention links distant frames', W / 2, cy + 74, { size: 24, weight: 700, color: COL.H, align: 'center', alpha: S.p(0, 0.5, 8.8) });
      // the paper and the replica
      const out = 1 - S.p(2, 0.5, 0);
      mtxt(ctx, 'MamBo-3-{M:Hydra}-N3  ·  Ng et al., ACL 2026 Findings', x0, 940, { size: 30, alpha: S.p(1, 0.8, 1) * out, weight: 600 });
      mtxt(ctx, 'replica parameters {K:319,373,323}  =  paper 319.37 M', x1, 940, { size: 24, align: 'right', alpha: S.p(1, 0.6, 9) * out, mono: true });
      const a2 = S.p(2, 0.6, 1.5);
      if (a2 > 0) {
        [['S', 'state size', COL.S], ['E', 'inner width', COL.E], ['H', 'heads', COL.H], ['P', 'head size', COL.D]].forEach((l, i) => {
          const x = 1330, y = 210 + i * 78, a = a2 * S.p(2, 0.5, 1.5 + i * 1.6);
          rrect(ctx, x, y, 54, 54, 12, rgba(l[2], 0.15 * a), rgba(l[2], a), 3);
          txt(ctx, l[0], x + 27, y + 29, { size: 30, weight: 800, align: 'center', base: 'middle', color: l[2], alpha: a });
          txt(ctx, l[1], x + 74, y + 36, { size: 26, weight: 600, alpha: a });
        });
      }
    },
  });

  // ------------------------------------------------------------------ 1 overview
  const OV = [
    ['waveform', '66,800 samples', '({B:B}, {T:66800})', COL.T],
    ['XLS-R 300M', 'final layer', '({B:B}, {T:208}, {C:1024})', COL.A],
    ['Input proj', 'Linear · RMSNorm · SiLU', RES, COL.K],
    ['5 × MamBo layer', 'Hydra×3 · MLP · MHA · MLP', RES, COL.M],
    ['Gated attn pool', 'weights over time', '({B:B}, {C:128})', COL.H],
    ['Linear', '128 → 2', '({B:B}, {K:2})', COL.B],
  ];
  S_.push({
    id: 'm_overview', chapter: 1, title: 'The big picture',
    beats: [
      "Here's the full model. A clip of sixty-six thousand eight hundred samples, four point one seven five seconds, goes into X L S R, which returns B by two hundred and eight by one thousand and twenty-four.",
      "An input projection shrinks each frame to one hundred and twenty-eight numbers. That width, one hundred and twenty-eight, is the model dimension for the entire back-end.",
      "Then come five MamBo layers. Each layer runs three Hydra blocks, a feed-forward block, an attention block, and a second feed-forward block. That's thirty blocks in total, and every one of them maps B by two hundred and eight by one hundred and twenty-eight to the same shape.",
      "Finally, gated attention pooling collapses the time axis into a single vector of one hundred and twenty-eight numbers, and a linear layer produces the two logits.",
      "The back-end has three point nine three million parameters. Together with X L S R, that's three hundred and nineteen point three seven million, exactly the number reported in the paper.",
      "On the benchmarks, this configuration reached an equal error rate of point eight one percent on ASVspoof 2021 L A, one point seven percent on 2021 D F, and four point nine seven percent on the In-the-Wild dataset.",
    ],
    hud: S => ({ stage: [0, 1, 2, 7, 7, 7][S.b], shape: ['({B:B}, {T:208}, {C:1024})', RES, RES, '({B:B}, {K:2})', '({B:B}, {K:2})', '({B:B}, {K:2})'][S.b] }),
    draw(ctx, S) {
      const bw = 270, gap = 30, x0 = (W - (6 * bw + 5 * gap)) / 2, y = 260, h = 160;
      const on = [0, 0, 1, 2, 3, 3];
      OV.forEach((o, i) => {
        const a = S.p(on[i], 0.6, i === 1 ? 2 : i === 5 ? 3 : 0), x = x0 + i * (bw + gap);
        const hl = (S.b === on[i]);
        box(ctx, x, y, bw, h, [o[0], o[1]], { size: 25, color: o[3], alpha: a, stroke: hl ? COL.A : COL.line, glow: hl ? COL.A : null });
        if (i) arrow(ctx, x - gap + 3, y + h / 2, x - 3, y + h / 2, { alpha: a, head: 10, lw: 2 });
        mtxt(ctx, o[2], x + bw / 2, y + h + 44, { size: 19, mono: true, align: 'center', alpha: a, color: COL.dim });
      });
      const L = S.vis(2, 4);
      if (L > 0) {
        ctx.save(); ctx.globalAlpha = L;
        const lx = x0 + 3 * (bw + gap) + bw / 2;
        line(ctx, lx, y + h + 70, lx, 560, COL.M, 2, [6, 6]);
        BLK.forEach((b, i) => {
          const a = S.p(2, 0.4, 3 + i * 0.5), x = 360 + i * 205;
          box(ctx, x, 580, 185, 90, b[0], { size: 28, color: b[1], alpha: a });
          if (i) arrow(ctx, x - 18, 625, x - 3, 625, { alpha: a, head: 8, lw: 2 });
        });
        txt(ctx, 'one MamBo layer (× 5 = 30 blocks)', 360, 560, { size: 22, weight: 700, color: COL.M });
        mtxt(ctx, 'every block: ' + RES + ' → ' + RES, W / 2, 740, { size: 26, mono: true, align: 'center', alpha: S.p(2, 0.6, 9) });
        ctx.restore();
      }
      const P = S.vis(4, 5);
      if (P > 0) {
        ctx.save(); ctx.globalAlpha = P;
        rrect(ctx, 360, 560, 1200, 300, 16, COL.panel, COL.line, 2);
        txt(ctx, 'back-end', 420, 640, { size: 30, weight: 700 }); txt(ctx, '3,934,603', 1500, 640, { size: 30, mono: true, align: 'right' });
        txt(ctx, 'XLS-R 300M', 420, 700, { size: 30, weight: 700, color: COL.A }); txt(ctx, '315,438,720', 1500, 700, { size: 30, mono: true, align: 'right' });
        line(ctx, 420, 730, 1500, 730, COL.line, 2);
        txt(ctx, 'total', 420, 800, { size: 34, weight: 800 }); txt(ctx, '319,373,323', 1500, 800, { size: 34, mono: true, align: 'right', color: COL.K });
        ctx.restore();
      }
      const R = S.p(5);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R;
        const d = [['ASVspoof 2021 LA', 0.81], ['ASVspoof 2021 DF', 1.70], ['In-the-Wild', 4.97]];
        txt(ctx, 'EER (%) — lower is better', 360, 580, { size: 24, color: COL.dim });
        d.forEach((r, i) => {
          const a = S.p(5, 0.5, 1 + i * 2.2), yy = 620 + i * 80;
          ctx.globalAlpha = R * a;
          txt(ctx, r[0], 360, yy + 34, { size: 28, weight: 700 });
          rrect(ctx, 760, yy, 700 * r[1] / 5.5, 48, 8, rgba(COL.M, 0.6), COL.M, 2);
          txt(ctx, r[1].toFixed(2) + '%', 780 + 700 * r[1] / 5.5, yy + 34, { size: 28, mono: true, weight: 700, color: COL.M });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 2 front end
  S_.push({
    id: 'm_front', chapter: 2, title: 'Input and front-end',
    code: S => S.b === 0 ? 'pad_wave_repeat(waveform, max_len=66800)' : 'torchaudio.pipelines.WAV2VEC2_XLSR_300M',
    beats: [
      "The clip length is sixty-six thousand eight hundred samples. Clips shorter than that are repeated to fill it. Our formula gives the number of frames: sixty-six thousand eight hundred, minus four hundred, divided by three hundred and twenty, rounded down, plus one. That's two hundred and eight.",
      "The front-end is X L S R three hundred million, loaded from torchaudio, and the back-end reads only its final layer: B by two hundred and eight by one thousand and twenty-four. It can be frozen or fine-tuned; the code has a flag for both.",
    ],
    hud: S => ({ stage: 0, shape: S.b === 0 ? '({B:B}, {T:66800})' : '({B:B}, {T:208}, {C:1024})' }),
    draw(ctx, S) {
      rrect(ctx, 140, 200, 1640, 170, 14, COL.panel, COL.line, 2);
      drawWave(ctx, 160, 285, 1600, 130, { lw: 1.2, alpha: S.p(0) });
      dimBottom(ctx, 160, 376, 1600, '{T:66,800} samples  =  4.175 s', COL.T, 26);
      mtxt(ctx, '⌊ (66800 − {K:400}) / {A:320} ⌋ + 1  =  {T:208} frames', W / 2, 520, { size: 36, mono: true, align: 'center', alpha: S.p(0, 0.6, 6) });
      const b = S.p(1);
      if (b > 0) {
        ctx.save(); ctx.globalAlpha = b;
        box(ctx, 380, 600, 460, 140, ['XLS-R 300M', '24 layers · frozen or fine-tuned'], { size: 30, color: COL.A });
        arrow(ctx, 860, 670, 990, 670, {});
        mat(ctx, 1080, 590, 420, 180, { rows: 12, cols: 30, seed: 501, left: ['{T:208}', COL.T], top: ['{C:1024}', COL.C] });
        txt(ctx, 'final layer only', 1290, 820, { size: 24, align: 'center', color: COL.dim });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 3 input projection
  const RMSV = Array.from({ length: 28 }, (_, i) => 0.9 + 1.2 * noise(i, 2, 511));
  S_.push({
    id: 'm_inproj', chapter: 3, title: 'Input projection: Linear, RMSNorm, SiLU',
    code: 'RMS_InputProj: Linear(1024, 128, bias=False) → RMSNorm → SiLU',
    beats: [
      "The input projection is a linear layer from one thousand and twenty-four to one hundred and twenty-eight, with no bias. Its weight is stored as one hundred and twenty-eight by one thousand and twenty-four.",
      "Next comes RMSNorm, a simpler cousin of layer norm. For each frame, divide its numbers by their root mean square, then multiply by a learned scale. Unlike layer norm, it doesn't subtract the mean, and it has no shift.",
      "Then SiLU, also called swish: x times the sigmoid of x. It's smooth, like GELU, and it dips slightly below zero for negative inputs. The result is B by two hundred and eight by one hundred and twenty-eight: the stream that the rest of the back-end reads and writes.",
    ],
    hud: { stage: 1, shape: RES },
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        mat(ctx, 200, 300, 520, 280, { rows: 14, cols: 30, seed: 512, left: ['{T:208}', COL.T], top: ['{C:1024}', COL.C] });
        arrow(ctx, 760, 440, 880, 440, { color: COL.K });
        box(ctx, 890, 380, 260, 120, ['Linear', '1024 → 128, no bias'], { size: 30, color: COL.K });
        arrow(ctx, 1160, 440, 1270, 440, { color: COL.K });
        mat(ctx, 1370, 300, 140, 280, { rows: 14, cols: 8, seed: 513, left: ['{T:208}', COL.T], top: ['{C:128}', COL.C] });
        mtxt(ctx, 'input_proj.weight.shape = ({C:128}, {C:1024})     131,072 weights', W / 2, 720, { size: 28, mono: true, align: 'center', alpha: S.p(0, 0.6, 4) });
        ctx.restore();
      }
      const R = S.vis(1, 2);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R;
        mtxt(ctx, 'RMSNorm(x) = g ⊙ x / √( mean(x²) + ε )', W / 2, 220, { size: 40, mono: true, align: 'center', weight: 600 });
        const rms = Math.sqrt(RMSV.reduce((a, v) => a + v * v, 0) / RMSV.length);
        const t = easeIO(S.l(1, 1.2, 5));
        const bars = (x0, vals, title, col) => {
          rrect(ctx, x0 - 20, 290, 28 * 24 + 40, 440, 14, COL.panel, COL.line, 2);
          txt(ctx, title, x0 + 28 * 12, 330, { size: 26, weight: 700, align: 'center', color: col });
          line(ctx, x0, 540, x0 + 28 * 24, 540, COL.faint, 1.5);
          vals.forEach((v, i) => { ctx.fillStyle = v >= 0 ? rgba(COL.C, 0.8) : rgba(COL.T, 0.8); ctx.fillRect(x0 + i * 24 + 3, Math.min(540, 540 - v * 80), 18, Math.abs(v * 80)); });
        };
        bars(180, RMSV, 'one frame (28 of 128 numbers)', COL.text);
        bars(1040, RMSV.map(v => lerp(v, v / rms, t)), 'divided by RMS', COL.A);
        txt(ctx, `RMS = ${rms.toFixed(2)}`, 180 + 28 * 12, 700, { size: 24, mono: true, align: 'center', color: COL.K });
        txt(ctx, 'mean is NOT removed · no bias · one learned scale per feature', W / 2, 840, { size: 28, weight: 600, align: 'center', alpha: S.p(1, 0.6, 9) });
        ctx.restore();
      }
      const Q = S.p(2);
      if (Q > 0) {
        ctx.save(); ctx.globalAlpha = Q;
        const ox = 560, oy = 560, sx = 100, sy = 100;
        plotAxes(ctx, ox, oy, sx, sy, -3.6, 3.6, -1, 3.6, [150, 180, 820, 700]);
        curve(ctx, x => Math.max(0, x), ox, oy, sx, sy, -3.6, 3.4, COL.dim, 3, 1, [8, 8]);
        curve(ctx, x => x * sig(x), ox, oy, sx, sy, -3.6, 3.4, COL.A, 5, S.l(2, 2));
        txt(ctx, 'SiLU', 800, 300, { size: 30, weight: 800, color: COL.A });
        txt(ctx, 'min ≈ −0.28 at x ≈ −1.28', 250, 700, { size: 20, mono: true, color: COL.dim });
        mtxt(ctx, 'SiLU(x) = x · σ(x)', 1040, 300, { size: 44, mono: true, weight: 600 });
        txt(ctx, 'σ(x) = 1 / (1 + e⁻ˣ)', 1040, 360, { size: 30, mono: true, color: COL.dim });
        mtxt(ctx, 'output: ' + RES, 1040, 520, { size: 28, mono: true, alpha: S.p(2, 0.6, 6) });
        txt(ctx, 'the residual stream for all 30 blocks', 1040, 570, { size: 26, color: COL.dim, alpha: S.p(2, 0.6, 7) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 4 residual stream
  S_.push({
    id: 'm_stream', chapter: 4, title: 'Blocks and the residual stream',
    code: 'every block: residual = h + residual; h = mixer(RMSNorm(residual))',
    beats: [
      "Every block in MamBo uses the same wrapper. The model keeps a running residual: the sum of every block's output so far. Each block adds its input to that residual, normalizes the result with RMSNorm, and runs its mixer on it.",
      "The mixer's output becomes the next block's input, and the process repeats. After the last block, the final output is added to the residual one more time, and normalized. This is the pre-norm design used in Mamba models: normalization happens before every mixer, and the residual stream itself is never normalized in place.",
      "Inside one MamBo layer, the six blocks come in a fixed order: Hydra, Hydra, Hydra, SwiGLU; then attention and SwiGLU. That's what MamBo three with N equal to three means: a state space layer with three Hydra blocks and a feed-forward, followed by a transformer layer. MamBo one, two and four mix the blocks differently, and N counts the state space blocks in each unit.",
    ],
    hud: { stage: 2, shape: RES },
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const y = 330;
        line(ctx, 120, y, 1800, y, rgba(COL.B, 0.8), 6);
        txt(ctx, 'residual stream', 130, y - 20, { size: 24, weight: 700, color: COL.B });
        for (let k = 0; k < 3; k++) {
          const x = 330 + k * 520, a = S.p(0, 0.5, 2 + k * 1.5);
          ctx.globalAlpha = A * a;
          ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fillStyle = COL.bg; ctx.fill(); ctx.stroke();
          txt(ctx, '+', x, y + 2, { size: 30, weight: 700, align: 'center', base: 'middle' });
          arrow(ctx, x, y + 24, x, 430, {});
          box(ctx, x - 110, 440, 220, 64, 'RMSNorm', { size: 24, color: COL.A });
          arrow(ctx, x, 506, x, 546, {});
          box(ctx, x - 110, 550, 220, 90, ['mixer', ['Hydra', 'SwiGLU', 'MHA'][k]], { size: 26, color: [COL.M, COL.C, COL.H][k] });
          parrow(ctx, [[x, 642], [x, 700], [x + 520 - 60, 700], [x + 520 - 60, y + 60], [x + 520 - 26, y + 14]], { color: rgba(COL.K, 0.9), lw: 2.5 });
          txt(ctx, 'h', x + 250, 690, { size: 22, weight: 700, color: COL.K, mono: true });
        }
        ctx.globalAlpha = A;
        txt(ctx, 'residual = h + residual  ·  h = mixer(RMSNorm(residual))', W / 2, 820, { size: 30, mono: true, align: 'center', alpha: S.p(0, 0.6, 9) });
        const b = S.p(1, 0.6, 8);
        txt(ctx, 'after block 30:  out = RMSNorm(h + residual)', W / 2, 890, { size: 30, mono: true, align: 'center', color: COL.A, alpha: b });
        ctx.restore();
      }
      const L = S.p(2);
      if (L > 0) {
        ctx.save(); ctx.globalAlpha = L;
        BLK.forEach((b, i) => {
          const a = S.p(2, 0.4, 1 + i * 0.7), x = 180 + i * 265;
          box(ctx, x, 280, 235, 120, b[0], { size: 32, color: b[1], alpha: a });
          if (i) arrow(ctx, x - 26, 340, x - 4, 340, { alpha: a, head: 9 });
        });
        brace(ctx, 180, 180 + 4 * 265 - 30, 420, COL.M, true);
        brace(ctx, 180 + 4 * 265, 180 + 6 * 265 - 30, 420, COL.H, true);
        txt(ctx, 'state space layer: N = 3 Hydra + MLP', 180 + 2 * 265 - 15, 480, { size: 26, weight: 700, align: 'center', color: COL.M, alpha: S.p(2, 0.5, 6) });
        txt(ctx, 'transformer layer: MHA + MLP', 180 + 5 * 265 - 15, 480, { size: 26, weight: 700, align: 'center', color: COL.H, alpha: S.p(2, 0.5, 8) });
        const v = [['MamBo-1', 'SSM replaces attention (N SSM + MLP)'], ['MamBo-2', 'SSM + MHA instead of MLP ("Mamer")'], ['MamBo-3', 'alternate SSM layers and transformer layers'], ['MamBo-4', 'alternate SSM layers and Mamer layers']];
        v.forEach((r, i) => {
          const a = S.p(2, 0.4, 12 + i * 0.8), y = 600 + i * 64;
          ctx.globalAlpha = L * a;
          txt(ctx, r[0], 300, y, { size: 26, weight: 800, color: i === 2 ? COL.A : COL.text });
          txt(ctx, r[1], 520, y, { size: 26, color: i === 2 ? COL.text : COL.dim });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 5 SSM from scratch
  const XS = [1, 0, 0, 2, 0, 0, 0, 1], HS = [1.0, 0.7, 0.49, 2.34, 1.64, 1.15, 0.8, 1.56];
  S_.push({
    id: 'm_ssm', chapter: 5, title: 'State space models from scratch',
    beats: [
      "Hydra is a state space model, so let's build one from scratch. Attention compares every frame with every other frame, which costs time proportional to T squared. A state space model instead walks through the sequence once, carrying a small memory, called the state.",
      "The simplest version: at each step, the new state is a times the old state, plus b times the input. The output is c times the state. With a between zero and one, old information fades gradually, and recent inputs matter most. Here, a is point seven.",
      "Mamba's key idea is to make these numbers depend on the input. A step size, delta, is computed from each frame. The decay becomes e to the power of delta times A, where A is a learned negative number. A large delta means: forget the past, and focus on this frame. A small delta means: keep the memory, and mostly ignore this frame.",
      "B and C also come from the input, as vectors. B decides how the current frame is written into the state, and C decides how the state is read out. That's why these models are called selective: each frame chooses what to store, and what to recall.",
      "In Mamba two, which Hydra builds on, each head's state is a matrix: sixty-four values of the head, by sixty-four state dimensions. Each step multiplies the old state by the decay, and adds delta, times the head's input, times B. The output is the state, times C.",
      "Unrolled over all frames, this is just a matrix multiplying the sequence: y equals M times x. Entry i, j of M is C i dotted with B j, times delta j, times all the decays between frame j and frame i. M is lower-triangular, so each frame only sees the past. This view, called state space duality, is why these layers can be seen as a kind of attention.",
    ],
    hud: S => ({ stage: 2, shape: S.b < 4 ? '({T:8})  toy' : S.b === 4 ? 'state ({D:64}, {S:64}) per head' : 'M: ({T:208}, {T:208})', label: S.b < 4 ? 'toy example' : 'Mamba-2 / SSD' }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const n = 12;
        for (let i = 0; i < n; i++) {
          const x = 200 + i * 60;
          rrect(ctx, x, 280, 44, 44, 6, rgba(COL.T, 0.4), COL.T, 1.5);
          for (let j = 0; j < n; j++) if (j !== i) line(ctx, x + 22, 280, 200 + j * 60 + 22, 280, rgba(COL.H, 0.04), 1);
        }
        ctx.save(); ctx.strokeStyle = rgba(COL.H, 0.25); ctx.lineWidth = 1.2;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const x1 = 222 + i * 60, x2 = 222 + j * 60; ctx.beginPath(); ctx.moveTo(x1, 276); ctx.quadraticCurveTo((x1 + x2) / 2, 276 - (x2 - x1) * 0.35, x2, 276); ctx.stroke(); }
        ctx.restore();
        txt(ctx, 'attention: all pairs → T² work', 560, 400, { size: 26, weight: 700, color: COL.H, align: 'center' });
        const b = S.p(0, 0.6, 5);
        ctx.globalAlpha = A * b;
        for (let i = 0; i < n; i++) {
          const x = 1040 + i * 60;
          rrect(ctx, x, 280, 44, 44, 6, rgba(COL.T, 0.4), COL.T, 1.5);
          if (i < n - 1) arrow(ctx, x + 44, 250, x + 60, 250, { color: COL.S, head: 8, lw: 2 });
          rrect(ctx, x + 6, 226, 32, 20, 4, rgba(COL.S, 0.5), null);
        }
        txt(ctx, 'SSM: one pass, carrying a state → T work', 1400, 400, { size: 26, weight: 700, color: COL.S, align: 'center' });
        ctx.restore();
      }
      const R = S.vis(1, 2);
      if (R > 0) {
        ctx.save(); ctx.globalAlpha = R;
        mtxt(ctx, 'h{T:ₜ} = {S:a}·h{T:ₜ₋₁} + b·x{T:ₜ}        y{T:ₜ} = c·h{T:ₜ}', W / 2, 520, { size: 40, mono: true, align: 'center', weight: 600 });
        const cw = 150, x0 = (W - 8 * cw) / 2;
        txt(ctx, 'x', x0 - 30, 630, { size: 28, weight: 700, align: 'right', color: COL.T });
        numRow(ctx, x0, 600, XS, cw, 56, { size: 24, d: 0 });
        txt(ctx, 'h', x0 - 30, 720, { size: 28, weight: 700, align: 'right', color: COL.S });
        const k = Math.floor(S.l(1, 7, 3) * 8);
        numRow(ctx, x0, 690, HS.map((v, i) => i < k ? v : null), cw, 56, { size: 24, d: 2, stroke: COL.S, fill: (i) => i < k ? rgba(COL.S, 0.1 + 0.12 * HS[i]) : 'rgba(0,0,0,0)' });
        txt(ctx, 'a = 0.7, b = c = 1', W / 2, 820, { size: 24, mono: true, align: 'center', color: COL.dim });
        ctx.restore();
      }
      const D = S.vis(2, 4);
      if (D > 0) {
        ctx.save(); ctx.globalAlpha = D;
        mtxt(ctx, 'decay = exp({K:Δₜ} · A),   A < 0 learned,   {K:Δₜ} = softplus(from frame t)', W / 2, 220, { size: 32, mono: true, align: 'center', weight: 600 });
        const ox = 260, oy = 700, sx = 170, sy = 380;
        plotAxes(ctx, ox, oy, sx, sy, 0, 4, 0, 1.05, [180, 270, 860, 500]);
        curve(ctx, d => Math.exp(-d), ox, oy, sx, sy, 0, 3.9, COL.K, 5, S.l(2, 2));
        txt(ctx, 'Δ (A = −1)', ox + 4 * sx - 20, oy + 40, { size: 20, color: COL.dim, align: 'right' });
        txt(ctx, 'decay', ox + 10, oy - sy - 10, { size: 20, color: COL.dim });
        txt(ctx, 'small Δ: keep memory', ox + 20, oy - sy * 0.95 + 40, { size: 22, color: COL.K, weight: 700, alpha: S.p(2, 0.5, 8) });
        txt(ctx, 'large Δ: reset, take this frame', ox + 2.1 * sx, oy - 60, { size: 22, color: COL.K, weight: 700, alpha: S.p(2, 0.5, 11) });
        const b = S.p(3, 0.6, 0.5);
        if (b > 0) {
          ctx.globalAlpha = D * b;
          rrect(ctx, 1100, 290, 700, 440, 16, COL.panel, COL.line, 2);
          txt(ctx, 'from each frame, by a linear layer:', 1130, 350, { size: 24, color: COL.dim });
          mtxt(ctx, '{K:Δₜ}  step size (one per head)', 1130, 420, { size: 28 });
          mtxt(ctx, 'Bₜ  how to write x into the state', 1130, 490, { size: 28 });
          mtxt(ctx, 'Cₜ  how to read the state out', 1130, 560, { size: 28 });
          txt(ctx, '→ "selective": content decides what is kept', 1130, 660, { size: 26, weight: 700, color: COL.A, alpha: S.p(3, 0.6, 8) });
        }
        ctx.restore();
      }
      const M2 = S.vis(4, 5);
      if (M2 > 0) {
        ctx.save(); ctx.globalAlpha = M2;
        mtxt(ctx, 'H{T:ₜ} = e^({K:Δₜ}A) · H{T:ₜ₋₁} + {K:Δₜ} · x{T:ₜ} Bₜᵀ          y{T:ₜ} = H{T:ₜ} Cₜ', W / 2, 240, { size: 34, mono: true, align: 'center', weight: 600 });
        mat(ctx, 260, 360, 280, 280, { rows: 16, cols: 16, seed: 521, left: ['{D:64}', COL.D], top: ['{S:64}', COL.S], title: 'H (state of one head)', stroke: COL.S });
        mat(ctx, 700, 360, 36, 280, { rows: 16, cols: 1, seed: 522, left: ['{D:64}', COL.D], title: 'xₜ' });
        txt(ctx, '⊗', 780, 510, { size: 40, align: 'center', color: COL.dim });
        mat(ctx, 830, 480, 280, 36, { rows: 1, cols: 16, seed: 523, top: ['{S:64}', COL.S], title: '' });
        txt(ctx, 'Bₜᵀ', 970, 560, { size: 26, weight: 700, align: 'center' });
        txt(ctx, 'outer product = a 64 × 64 update', 970, 610, { size: 22, align: 'center', color: COL.dim });
        mtxt(ctx, 'per step, per head:  xₜ ({D:64}),  Bₜ, Cₜ ({S:64}),  {K:Δₜ} (1)', 1480, 420, { size: 24, mono: true, align: 'center', alpha: S.p(4, 0.6, 4) });
        mtxt(ctx, 'yₜ = H Cₜ  →  ({D:64})', 1480, 500, { size: 28, mono: true, align: 'center', alpha: S.p(4, 0.6, 8) });
        txt(ctx, '4 heads × (64 × 64) state per direction', 1480, 580, { size: 24, align: 'center', color: COL.dim, alpha: S.p(4, 0.6, 10) });
        ctx.restore();
      }
      const U = S.p(5);
      if (U > 0) {
        ctx.save(); ctx.globalAlpha = U;
        mtxt(ctx, 'y = M x      M{T:ᵢⱼ} = (Cᵢ·Bⱼ) · Δⱼ · e^(A(Δⱼ₊₁ + … + Δᵢ))   for j ≤ i', W / 2, 240, { size: 34, mono: true, align: 'center', weight: 600 });
        const n = 26, sz = 480;
        cells(ctx, 300, 330, n, n, sz / n, sz / n, (i, j) => j <= i ? scol(0.25 + 0.7 * Math.exp(-(i - j) / 6) * (0.6 + 0.4 * Math.abs(noise(i, j, 531)))) : 'rgba(40,50,70,0.35)', 1);
        dimLeft(ctx, 294, 330, sz, 'output frame i', COL.T, 22); dimTop(ctx, 300, 324, sz, 'input frame j', COL.T, 22);
        txt(ctx, 'lower-triangular: causal', 540, 870, { size: 26, weight: 700, align: 'center', color: COL.K });
        wrap(ctx, 'Same form as masked attention: a T × T matrix of weights applied to the frames. But M has a cheap structure, so it is never built: the scan computes y in T steps.', 1000, 420, 760, 44, { size: 30, alpha: S.p(5, 0.6, 7) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 6 Hydra idea
  S_.push({
    id: 'm_hydra', chapter: 6, title: 'Hydra: looking both ways',
    beats: [
      "For detecting deepfakes, the model can see the whole clip at once, so there's no reason to only look backwards. Hydra runs the scan twice: once forwards, and once over the time-reversed sequence.",
      "Its output is the shifted forward scan, plus the flipped, shifted backward scan, plus a diagonal term, D times x. Each scan is shifted by one step, so a frame's own value isn't counted twice; the D term adds it back exactly once.",
      "In matrix form, the forward scan fills the lower triangle, the backward scan fills the upper triangle, and D fills the diagonal. The Hydra paper calls this a quasiseparable matrix mixer: every frame can see every other frame, still in linear time.",
      "In code, the trick is to stack the forward and flipped sequences along the batch axis, so both scans run in a single call. That's why you'll see a batch of two B inside Hydra.",
    ],
    hud: S => ({ stage: 2, shape: S.b < 3 ? RES : '({B:2B}, {T:208}, {E:256})', label: S.b < 3 ? 'tensor shape' : 'inside Hydra' }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const n = 14, x0 = 330, cw = 90;
        for (let i = 0; i < n; i++) rrect(ctx, x0 + i * cw, 400, 70, 70, 8, rgba(COL.T, 0.35), COL.T, 1.5);
        const f = S.l(0, 3, 1), b = S.l(0, 3, 4);
        arrow(ctx, x0, 360, x0 + (n * cw - 20) * f, 360, { color: COL.M, lw: 4, alpha: f > 0 ? 1 : 0 });
        txt(ctx, 'forward scan', x0, 340, { size: 24, weight: 700, color: COL.M, alpha: f > 0 ? 1 : 0 });
        arrow(ctx, x0 + n * cw - 20, 520, x0 + n * cw - 20 - (n * cw - 20) * b, 520, { color: COL.A, lw: 4, alpha: b > 0 ? 1 : 0 });
        txt(ctx, 'backward scan (on flip(x))', x0 + n * cw - 20, 560, { size: 24, weight: 700, color: COL.A, align: 'right', alpha: b > 0 ? 1 : 0 });
        const e = S.p(1, 0.6, 0.5);
        mtxt(ctx, 'y = shift(SS(x)) + flip(shift(SS(flip(x)))) + D·x', W / 2, 700, { size: 38, mono: true, align: 'center', alpha: e, weight: 600 });
        txt(ctx, 'shift: move one step so frame t sees only frames before t;  D·x: frame t itself, once', W / 2, 770, { size: 24, align: 'center', color: COL.dim, alpha: S.p(1, 0.6, 6) });
        ctx.restore();
      }
      const M = S.vis(2, 3);
      if (M > 0) {
        ctx.save(); ctx.globalAlpha = M;
        const n = 26, sz = 520, x = 300, y = 280;
        cells(ctx, x, y, n, n, sz / n, sz / n, (i, j) => i === j ? rgba(COL.K, 0.9) : j < i ? rgba(COL.M, 0.25 + 0.55 * Math.exp(-(i - j) / 7)) : rgba(COL.A, 0.25 + 0.55 * Math.exp(-(j - i) / 7)), 1);
        rrect(ctx, x - 3, y - 3, sz + 6, sz + 6, 6, null, COL.line, 2);
        [['lower: forward scan', COL.M], ['upper: backward scan', COL.A], ['diagonal: D', COL.K]].forEach((l, i) => {
          const a = S.p(2, 0.5, 1 + i * 2);
          rrect(ctx, 1000, 360 + i * 90, 50, 50, 8, rgba(l[1], 0.6 * a), l[1], 2);
          txt(ctx, l[0], 1075, 395 + i * 90, { size: 30, weight: 700, alpha: a });
        });
        txt(ctx, 'quasiseparable: every frame sees every frame, in O(T)', 1000, 720, { size: 26, color: COL.dim, alpha: S.p(2, 0.6, 8) });
        ctx.restore();
      }
      const K = S.p(3);
      if (K > 0) {
        ctx.save(); ctx.globalAlpha = K;
        mat(ctx, 300, 300, 520, 140, { rows: 6, cols: 26, seed: 541, left: ['{B:B}', COL.B], title: 'x', stroke: COL.M });
        mat(ctx, 300, 480, 520, 140, { rows: 6, cols: 26, seed: 542, left: ['{B:B}', COL.B], title: '', stroke: COL.A, fn: (r, c) => vcol(noise(r, 25 - c, 541) * 0.95, 0.9) });
        txt(ctx, 'flip(x, time)', 560, 660, { size: 24, color: COL.A, align: 'center', weight: 700 });
        dimRight(ctx, 836, 300, 320, '{B:2B}', COL.B, 28);
        mtxt(ctx, 'torch.cat((x, torch.flip(x, (1,))), dim=0)', 1300, 420, { size: 26, mono: true, align: 'center' });
        mtxt(ctx, '→ ({B:2B}, {T:208}, {E:256})', 1300, 480, { size: 30, mono: true, align: 'center' });
        txt(ctx, 'one scan call handles both directions', 1300, 560, { size: 26, align: 'center', color: COL.dim });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 7 Hydra shapes
  const HSTEPS = [
    ['input', RES, 0],
    ['in_proj  128 → 776', '({B:B}, {T:208}, 776)', 1],
    ['split: z | xBC | Δ', 'z ({E:256}) · xBC (512) · Δ (8)', 1],
    ['depthwise conv1d (k=7) + SiLU', '({B:B}, {T:208}, 512)', 2],
    ['split: x | B,C fwd | B,C bwd', 'x ({E:256}) · 4 × ({S:64})', 2],
    ['stack fwd / flipped on batch', 'x ({B:2B}, {T:208}, {E:256})', 3],
    ['view as heads', '({B:2B}, {T:208}, {H:4}, {D:64})', 3],
    ['SSD scan (A, Δ, B, C)', '({B:2B}, {T:208}, {H:4}, {D:64})', 4],
    ['shift, flip back, add, + D·x', '({B:B}, {T:208}, {E:256})', 4],
    ['gated RMSNorm: norm(y) · SiLU(z)', '({B:B}, {T:208}, {E:256})', 5],
    ['out_proj  256 → 128', RES, 5],
  ];
  S_.push({
    id: 'm_hshapes', chapter: 7, title: 'Inside one Hydra block',
    code: 'modules/hydra/modules/hydra.py  (d_model=128, expand=2, headdim=64, d_state=64)',
    beats: [
      "Now the real shapes, for one Hydra block. The input is B by two hundred and eight by one hundred and twenty-eight. Inside, the width is expanded two times, to two hundred and fifty-six.",
      "A single linear layer, in proj, maps one hundred and twenty-eight to seven hundred and seventy-six numbers per frame. They're split into three parts. z: two hundred and fifty-six numbers, for the output gate. x B C: five hundred and twelve numbers. And delta: eight numbers, four heads for each direction.",
      "The x B C part goes through a depthwise convolution along time, seven frames wide, and a SiLU. Depthwise means each of the five hundred and twelve channels has its own small kernel. Then it's split: x is two hundred and fifty-six numbers, and the other two hundred and fifty-six hold B and C for the forward and backward scans, sixty-four each.",
      "The forward and flipped copies are stacked on the batch axis, so x becomes two B by two hundred and eight by two hundred and fifty-six. It's viewed as four heads of sixty-four: two B, by two hundred and eight, by four, by sixty-four. B and C are two B by two hundred and eight by sixty-four, shared by all heads.",
      "The scan returns the same shape. The backward half is flipped back and added to the forward half, and the D term adds x back in, scaled by a gain for each head that is itself computed from x. We're back to B by two hundred and eight by two hundred and fifty-six.",
      "Finally, a gated RMSNorm: normalize, then multiply by SiLU of z. And out proj maps two hundred and fifty-six back to one hundred and twenty-eight. One Hydra block has about one hundred and thirty-eight thousand parameters, most of them in the two projections.",
    ],
    hud: S => ({ stage: 2, shape: [RES, '({B:B}, {T:208}, 776)', '({B:B}, {T:208}, 512)', '({B:2B}, {T:208}, {H:4}, {D:64})', '({B:B}, {T:208}, {E:256})', RES][S.b] }),
    draw(ctx, S) {
      const y0 = 150, lh = 72;
      HSTEPS.forEach(([name, shp, b], i) => {
        const a = S.p(b, 0.5, b === 0 ? 0.5 : (i - HSTEPS.findIndex(s => s[2] === b)) * 3 + 1);
        if (a <= 0) return;
        const y = y0 + i * lh, cur = S.b === b;
        ctx.save(); ctx.globalAlpha = a * (cur ? 1 : 0.55);
        rrect(ctx, 150, y, 1620, lh - 10, 10, cur ? rgba(COL.M, 0.1) : COL.panel, cur ? COL.M : COL.line, cur ? 2 : 1);
        txt(ctx, String(i).padStart(2, '0'), 180, y + 40, { size: 20, mono: true, color: COL.faint });
        txt(ctx, name, 240, y + 40, { size: 26, weight: 600 });
        mtxt(ctx, shp, 1740, y + 40, { size: 24, mono: true, align: 'right', color: COL.dim });
        ctx.restore();
      });
      const p = S.p(5, 0.6, 9);
      if (p > 0) {
        ctx.save(); ctx.globalAlpha = p;
        rrect(ctx, 150, 960, 1620, 0, 0, null, null);
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 8 SwiGLU
  S_.push({
    id: 'm_swiglu', chapter: 8, title: 'The SwiGLU feed-forward',
    code: 'MLP_SwiGLU: w1_w3_combined (128 → 682) · w2_out (341 → 128)',
    beats: [
      "The feed-forward blocks use SwiGLU. One linear layer maps one hundred and twenty-eight to six hundred and eighty-two, and the result is split into two halves of three hundred and forty-one: a gate, and a value.",
      "The output is SiLU of the gate, times the value, element by element, and a second linear layer maps three hundred and forty-one back to one hundred and twenty-eight. Three hundred and forty-one is eight thirds of one hundred and twenty-eight, rounded down, which keeps the parameter count close to a classic feed-forward that is four times wider. One SwiGLU block has about one hundred and thirty-one thousand parameters.",
    ],
    hud: S => ({ stage: 3, shape: S.b === 0 ? '({B:B}, {T:208}, 682)' : RES }),
    draw(ctx, S) {
      const cy = 480;
      const bar = (x, h, lbl, col, a) => { ctx.save(); ctx.globalAlpha = a; rrect(ctx, x, cy - h / 2, 70, h, 8, rgba(col, 0.3), col, 2); txt(ctx, lbl, x + 35, cy + h / 2 + 36, { size: 26, mono: true, weight: 700, align: 'center', color: col }); ctx.restore(); };
      bar(180, 110, '128', COL.C, S.p(0, 0.5, 0.3));
      arrow(ctx, 270, cy, 380, cy, { alpha: S.p(0, 0.5, 1) });
      txt(ctx, 'Linear', 325, cy - 20, { size: 20, align: 'center', color: COL.K, alpha: S.p(0, 0.5, 1) });
      bar(400, 580, '682', COL.K, S.p(0, 0.5, 1.5));
      const sp = S.p(0, 0.6, 5);
      if (sp > 0) {
        ctx.save(); ctx.globalAlpha = sp;
        arrow(ctx, 490, cy - 140, 600, cy - 150, {}); arrow(ctx, 490, cy + 140, 600, cy + 150, {});
        rrect(ctx, 620, cy - 300, 70, 290, 8, rgba(COL.H, 0.3), COL.H, 2); txt(ctx, 'gate 341', 655, cy - 320, { size: 22, mono: true, align: 'center', color: COL.H });
        rrect(ctx, 620, cy + 10, 70, 290, 8, rgba(COL.C, 0.3), COL.C, 2); txt(ctx, 'value 341', 655, cy + 340, { size: 22, mono: true, align: 'center', color: COL.C });
        ctx.restore();
      }
      const b = S.p(1);
      if (b > 0) {
        ctx.save(); ctx.globalAlpha = b;
        txt(ctx, 'SiLU(gate) ⊙ value', 860, cy - 330, { size: 30, mono: true, weight: 700, align: 'center' });
        arrow(ctx, 700, cy - 150, 780, cy - 40, {}); arrow(ctx, 700, cy + 150, 780, cy + 20, {});
        rrect(ctx, 1020, cy - 145, 70, 290, 8, rgba(COL.M, 0.3), COL.M, 2); txt(ctx, '341', 1055, cy + 180, { size: 26, mono: true, weight: 700, align: 'center', color: COL.M });
        arrow(ctx, 1110, cy, 1220, cy, {}); txt(ctx, 'Linear', 1165, cy - 20, { size: 20, align: 'center', color: COL.K });
        bar(1240, 110, '128', COL.C, 1);
        txt(ctx, 'hidden = ⌊8 · 128 / 3⌋ = 341', 1360, 330, { size: 28, mono: true, alpha: S.p(1, 0.6, 6) });
        txt(ctx, '128·682 + 341·128 = 130,944 (+128 norm)', 1320, 390, { size: 22, mono: true, color: COL.dim, alpha: S.p(1, 0.6, 12) });
        mtxt(ctx, RES + ' → ' + RES, W / 2, 900, { size: 28, mono: true, align: 'center', alpha: S.p(1, 0.6, 14) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 9 MHA
  S_.push({
    id: 'm_mha', chapter: 9, title: 'The attention block',
    code: 'mamba_ssm.modules.mha.MHA(128, num_heads=4, d_conv=4)',
    beats: [
      "The attention block comes from the mamba s s m library. One linear layer produces the queries, keys and values together: one hundred and twenty-eight to three hundred and eighty-four.",
      "Before they're split, a small causal depthwise convolution, four frames wide, runs along time. It mixes each position with the three before it, which gives the attention a sense of local order, without any positional embedding.",
      "Then it's standard multi-head attention: four heads of thirty-two. The scores are B by four by two hundred and eight by two hundred and eight. The attention itself is not causal: every frame can attend to every other frame. An output projection maps back to one hundred and twenty-eight.",
      "Why keep attention at all? The paper argues that pure state space models struggle to retrieve global artifacts: finding a specific pattern anywhere in the clip. Attention is good at exactly that, while the Hydra blocks cover long-range, ordered structure cheaply. Here, attention costs only about sixty-eight thousand parameters per layer.",
    ],
    hud: S => ({ stage: 4, shape: ['({B:B}, {T:208}, 384)', '({B:B}, {T:208}, 384)', '({B:B}, {H:4}, {T:208}, {T:208})', RES][S.b] }),
    draw(ctx, S) {
      const A = S.vis(0, 3);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        mat(ctx, 200, 300, 120, 360, { rows: 16, cols: 5, seed: 551, left: ['{T:208}', COL.T], top: ['{C:128}', COL.C] });
        arrow(ctx, 340, 480, 440, 480, {});
        txt(ctx, 'in_proj', 390, 460, { size: 20, align: 'center', color: COL.K });
        [['q', COL.A], ['k', COL.K], ['v', COL.D]].forEach((c, i) => mat(ctx, 460 + i * 110, 300, 100, 360, { rows: 16, cols: 4, seed: 552 + i, stroke: c[1], top: [c[0] + ' 128', c[1]] }));
        const cv = S.p(1, 0.6, 0.5);
        if (cv > 0) {
          ctx.globalAlpha = A * cv;
          const k = Math.floor(S.l(1, 5, 1) * 12) % 12;
          rrect(ctx, 454, 300 + k * 22.5 - 3, 342, 4 * 22.5 + 6, 6, rgba(COL.K, 0.12), COL.K, 3);
          txt(ctx, 'causal depthwise conv, 4 frames: t−3 … t', 630, 720, { size: 24, align: 'center', color: COL.K, weight: 700 });
          txt(ctx, '(padding 3, last 3 outputs trimmed)', 630, 760, { size: 20, align: 'center', color: COL.dim });
          ctx.globalAlpha = A;
        }
        const h = S.p(2, 0.6, 0.5);
        if (h > 0) {
          ctx.globalAlpha = A * h;
          arrow(ctx, 810, 480, 875, 480, {});
          for (let k2 = 3; k2 >= 0; k2--) rrect(ctx, 930 + k2 * 16, 300 - k2 * 16, 330, 330, 6, COL.bg2, rgba(COL.H, 0.5), 2);
          cells(ctx, 930, 300, 30, 30, 11, 11, (i, j) => scol(0.1 + 0.8 * Math.exp(-((i - j) ** 2) / 40) + 0.3 * (j % 9 === 4 ? 0.6 : 0)), 0.5);
          dimLeft(ctx, 924, 300, 330, '{T:208}', COL.T, 22); dimBottom(ctx, 930, 636, 330, '{T:208}', COL.T, 22);
          txt(ctx, '× 4 heads (32 each)', 1100, 240, { size: 22, weight: 700, color: COL.H, align: 'center' });
          mtxt(ctx, 'scores: ({B:B}, {H:4}, {T:208}, {T:208})', 1520, 420, { size: 26, mono: true, align: 'center' });
          txt(ctx, 'not causal: all frames see all frames', 1520, 480, { size: 24, align: 'center', color: COL.dim });
          txt(ctx, 'out_proj 128 → 128', 1520, 560, { size: 24, mono: true, align: 'center', color: COL.K });
        }
        ctx.restore();
      }
      const W4 = S.p(3);
      if (W4 > 0) {
        ctx.save(); ctx.globalAlpha = W4;
        rrect(ctx, 250, 260, 640, 400, 16, COL.panel, rgba(COL.M, 0.6), 2);
        rrect(ctx, 1030, 260, 640, 400, 16, COL.panel, rgba(COL.H, 0.6), 2);
        txt(ctx, 'Hydra (SSM)', 570, 320, { size: 32, weight: 800, align: 'center', color: COL.M });
        txt(ctx, 'Attention', 1350, 320, { size: 32, weight: 800, align: 'center', color: COL.H });
        ['ordered, long-range structure', 'linear in T', 'compressed state memory'].forEach((s, i) => txt(ctx, s, 570, 410 + i * 60, { size: 26, align: 'center' }));
        ['global retrieval', 'finds a pattern anywhere', 'T² scores, but only 4 × 32'].forEach((s, i) => txt(ctx, s, 1350, 410 + i * 60, { size: 26, align: 'center' }));
        txt(ctx, 'MHA block: 68,096 params  ·  Hydra block: 137,612  ·  SwiGLU block: 131,072', W / 2, 760, { size: 26, mono: true, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 10) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 10 stacking
  S_.push({
    id: 'm_stack', chapter: 10, title: 'Five layers, thirty blocks',
    code: 'Mix_n_Hydra_1MLP_1MHA_1MLP(block_layers=5, n_mamba=3)',
    beats: [
      "One MamBo layer, with three Hydra blocks, two SwiGLU blocks and one attention block, has seven hundred and forty-three thousand parameters. Five layers make three point seven million.",
      "Through all thirty blocks the shape never changes: B by two hundred and eight by one hundred and twenty-eight. After the last block, the output is added to the residual stream one final time, and normalized with RMSNorm.",
    ],
    hud: { stage: 5, shape: RES },
    draw(ctx, S) {
      for (let L = 0; L < 5; L++) for (let k = 0; k < 6; k++) {
        const a = S.p(0, 0.3, 0.3 + (L * 6 + k) * 0.18), x = 240 + L * 300, y = 220 + k * 90;
        box(ctx, x, y, 250, 72, BLK[k][0], { size: 24, color: BLK[k][1], alpha: a });
      }
      for (let L = 0; L < 5; L++) txt(ctx, 'layer ' + (L + 1), 365 + L * 300, 200, { size: 22, weight: 700, align: 'center', color: COL.dim, alpha: S.p(0, 0.4, 0.3 + L * 1.1) });
      const p = S.p(0, 0.6, 7);
      if (p > 0) txt(ctx, '743,076 per layer  ×  5  =  3,715,380', W / 2, 800, { size: 32, mono: true, weight: 700, align: 'center', color: COL.K, alpha: p });
      const b = S.p(1, 0.6, 4);
      if (b > 0) mtxt(ctx, 'final: RMSNorm(h + residual)  →  ' + RES, W / 2, 870, { size: 28, mono: true, align: 'center', alpha: b });
    },
  });

  // ------------------------------------------------------------------ 11 pooling + head
  const PW = Array.from({ length: 26 }, (_, i) => Math.exp(1.8 * noise(i, 1, 561) + (i === 9 || i === 17 ? 1.6 : 0)));
  const PWs = PW.reduce((a, b) => a + b, 0);
  S_.push({
    id: 'm_pool', chapter: 11, title: 'Gated attention pooling',
    code: 'GatedAttentionPool(128) → nn.Linear(128, 2)',
    beats: [
      "Now we need one vector per clip. Instead of a plain average, MamBo learns which frames matter. A SwiGLU-style projection maps each frame from one hundred and twenty-eight to three hundred and forty-one, and a linear layer turns that into a single score per frame: B by two hundred and eight.",
      "A softmax over time turns the scores into weights that sum to one: B by one by two hundred and eight. A batched matrix multiply with the frames, B by two hundred and eight by one hundred and twenty-eight, gives their weighted average: B by one hundred and twenty-eight.",
      "After dropout, a linear layer maps one hundred and twenty-eight to two logits: B by two. Class zero is spoof, and class one is bona fide.",
    ],
    hud: S => ({ stage: S.b < 2 ? 6 : 7, shape: ['({B:B}, {T:208})', '({B:B}, {C:128})', '({B:B}, {K:2})'][S.b] }),
    draw(ctx, S) {
      const n = 26, x0 = 200, cw = 58;
      for (let i = 0; i < n; i++) {
        const x = x0 + i * cw;
        cells(ctx, x, 470, 8, 1, 44, 22, (r) => vcol(noise(i, r, 562) * 0.9, 0.9), 2);
        const a = S.p(0, 0.3, 3 + i * 0.12);
        if (a > 0) {
          const hgt = 180 * PW[i] / Math.max(...PW);
          rrect(ctx, x + 6, 440 - hgt, 32, hgt, 4, rgba(S.b >= 1 ? COL.K : COL.H, 0.8 * a), null);
        }
      }
      dimBottom(ctx, x0, 656, n * cw - 14, 'frames ({T:208})', COL.T, 24);
      txt(ctx, S.b >= 1 ? 'softmax weights (sum = 1)' : 'score per frame  = to_score(SiLU(gate) ⊙ value)', x0, 230, { size: 26, weight: 700, color: S.b >= 1 ? COL.K : COL.H, alpha: S.p(0, 0.6, 2) });
      const b = S.p(1, 0.6, 3);
      if (b > 0) {
        ctx.save(); ctx.globalAlpha = b;
        mtxt(ctx, 'weights ({B:B}, 1, {T:208})  @  frames ({B:B}, {T:208}, {C:128})  =  ({B:B}, 1, {C:128}) → squeeze → ({B:B}, {C:128})', W / 2, 760, { size: 24, mono: true, align: 'center' });
        ctx.restore();
      }
      const c = S.p(2, 0.6, 0.5);
      if (c > 0) {
        ctx.save(); ctx.globalAlpha = c;
        rrect(ctx, 460, 820, 1000, 130, 14, 'rgba(10,14,22,0.96)', COL.line, 2);
        txt(ctx, 'dropout(0.1) → Linear 128 → 2', 500, 870, { size: 26, mono: true });
        [['spoof (0)', 0.1, COL.R], ['bona fide (1)', 0.9, COL.B]].forEach((p, i) => {
          const y = 895 + i * 0;
          rrect(ctx, 1000 + i * 230, 850, 200 * p[1] * 1, 30, 6, rgba(p[2], 0.8), null);
          txt(ctx, `${p[0]} ${p[1].toFixed(2)}`, 1000 + i * 230, 920, { size: 20, weight: 700, color: p[2] });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 12 training
  S_.push({
    id: 'm_train', chapter: 12, title: 'Training',
    code: 'FocalLoss(gamma=2, alpha=[0.1, 0.9]) · AdamW(lr=1e-5, betas=(0.9, 0.95))',
    beats: [
      "Training uses focal loss. It's cross-entropy, scaled by one minus p, to the power gamma, where p is the probability the model gives to the correct class. With gamma equal to two, easy examples barely count, and the model focuses on the hard ones. A class weight, alpha, of point one for spoof and point nine for bona fide balances the two classes.",
      "The optimizer is Adam W, with a learning rate of one times ten to the minus five, betas of point nine and point nine five, and weight decay of point oh five, with a ten percent warm-up, then cosine decay down to a tenth of the peak. Batches of thirty-two clips, up to twenty epochs with early stopping, RawBoost augmentation, and ASVspoof 2019 L A as the training set.",
    ],
    hud: { stage: 7, shape: 'scalar loss', label: 'training' },
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        mtxt(ctx, 'FL = −α · (1 − p)^{K:γ} · log p', W / 2, 220, { size: 44, mono: true, align: 'center', weight: 600 });
        const ox = 260, oy = 820, sx = 700, sy = 110;
        plotAxes(ctx, ox, oy, sx, sy, 0, 1, 0, 4.4, [180, 270, 900, 620]);
        curve(ctx, p => -Math.log(p), ox, oy, sx, sy, 0.02, 1, COL.dim, 3, S.l(0, 2, 1), [8, 8]);
        curve(ctx, p => -Math.pow(1 - p, 2) * Math.log(p), ox, oy, sx, sy, 0.02, 1, COL.K, 5, S.l(0, 2, 4));
        txt(ctx, 'p (probability of the true class)', ox + sx, oy + 40, { size: 20, color: COL.dim, align: 'right' });
        txt(ctx, 'cross-entropy (γ = 0)', 600, 420, { size: 24, color: COL.dim, weight: 700 });
        txt(ctx, 'focal, γ = 2', 520, 700, { size: 24, color: COL.K, weight: 700, alpha: S.p(0, 0.6, 5) });
        wrap(ctx, 'At p = 0.9 (easy): CE = 0.105, focal = 0.001. Easy clips stop dominating the gradient.', 1150, 420, 640, 42, { size: 28, alpha: S.p(0, 0.6, 9) });
        txt(ctx, 'α = [0.1 spoof, 0.9 bona fide]', 1150, 620, { size: 28, mono: true, alpha: S.p(0, 0.6, 15) });
        ctx.restore();
      }
      const B = S.p(1);
      if (B > 0) {
        ctx.save(); ctx.globalAlpha = B;
        const rows = [['optimizer', 'AdamW, lr 1e-5, betas (0.9, 0.95), weight decay 0.05'], ['schedule', '10% linear warm-up, cosine decay to 10%'], ['batch · epochs', '32 clips · up to 20, early stopping (patience 7)'],
          ['augmentation', 'RawBoost'], ['train data', 'ASVspoof 2019 LA (25,380 clips)'], ['precision', 'mixed BF16 / FP32']];
        rows.forEach((r, i) => {
          const a = S.p(1, 0.4, 0.5 + i * 1.6), y = 260 + i * 95;
          ctx.globalAlpha = B * a;
          txt(ctx, r[0], 240, y, { size: 30, weight: 700, color: COL.A });
          txt(ctx, r[1], 640, y, { size: 30 });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 13 code
  const CODE = [
    ['$ python verify/mambo_shapes.py          # CPU replica of the official code', COL.faint, 0],
    ['input waveform (2, 66800) -> XLS-R -> (2, 208, 1024)', COL.text, 0],
    ['  input_proj Linear 1024->128      (2, 208, 128)', COL.B, 0],
    ['  hydra: in_proj                   (2, 208, 776)', COL.B, 1],
    ['  hydra: conv1d (depthwise k=7)    (2, 208, 512)', COL.B, 1],
    ['  hydra: x stacked [x ; flip(x)]   (4, 208, 256)', COL.B, 1],
    ['  hydra: x as heads / SSD scan     (4, 208, 4, 64)', COL.B, 1],
    ['  hydra: out_proj                  (2, 208, 128)', COL.B, 1],
    ['  mlp: w1_w3 (2, 208, 682) · silu(gate)*value (2, 208, 341) · w2_out (2, 208, 128)', COL.B, 2],
    ['  mha: scores                      (2, 4, 208, 208)', COL.B, 2],
    ['  pool weights (softmax over time) (2, 1, 208)  ->  pooled (2, 128)  ->  logits (2, 2)', COL.B, 2],
    ['  back-end total 3,934,603  +  XLS-R 315,438,720  =  319,373,323   (paper: 319.37M)', COL.K, 2],
  ];
  S_.push({
    id: 'm_code', chapter: 13, title: 'Checking it in code',
    beats: [
      "Here's the trace from our plain PyTorch replica of the official code, with random weights. The input projection gives B by two hundred and eight by one hundred and twenty-eight.",
      "Inside a Hydra block: seven hundred and seventy-six after the input projection, five hundred and twelve after the convolution, the batch doubled to four for the two scan directions, and four heads of sixty-four.",
      "The feed-forward, the attention scores, the pooling weights, and the two logits. And the parameter count lands exactly on the paper's three hundred and nineteen point three seven million. The script is in the repository's verify folder.",
    ],
    hud: { stage: 7, shape: '({B:2}, {K:2})' },
    draw(ctx, S) {
      rrect(ctx, 100, 170, 1720, 780, 18, '#0d1320', COL.line, 2);
      CODE.forEach(([s, c, b], i) => txt(ctx, s, 140, 240 + i * 58, { size: 23, mono: true, color: c, alpha: S.p(b, 0.4, b === 0 ? i * 2 : (i - [0, 3, 8][b]) * 2 + 0.5) }));
    },
  });

  // ------------------------------------------------------------------ 14 recap
  const RECAP = [
    ['XLS-R 300M', '66,800 samples → 208 frames', '({B:B}, {T:208}, {C:1024})', 1, 0],
    ['input proj', 'Linear 1024→128 · RMSNorm · SiLU', RES, 1, 3],
    ['Hydra ×3', 'bidirectional SSD, 4 heads × 64, state 64', RES, 1, 6],
    ['SwiGLU', '128 → 682 → 341 → 128', RES, 1, 9],
    ['MHA', '4 heads × 32, conv k=4, scores 208×208', RES, 1, 11],
    ['SwiGLU', 'second feed-forward', RES, 1, 13],
    ['× 5 layers', '30 blocks + final RMSNorm', RES, 2, 0],
    ['gated attn pool', 'softmax over 208 frames', '({B:B}, {C:128})', 2, 3],
    ['classifier', 'Linear 128 → 2', '({B:B}, {K:2})', 2, 5],
  ];
  S_.push({
    id: 'm_recap', chapter: 14, title: 'Recap and comparison',
    beats: [
      "Let's recap.",
      "X L S R gives B by two hundred and eight by one thousand and twenty-four. The input projection brings it to one hundred and twenty-eight. Then each MamBo layer runs three bidirectional Hydra blocks, a SwiGLU, attention, and another SwiGLU, all keeping B by two hundred and eight by one hundred and twenty-eight.",
      "Five layers, thirty blocks, a final RMSNorm, gated attention pooling to one hundred and twenty-eight numbers, and a linear layer to two scores.",
      "Across the three videos, the pattern is the same. The front-end turns sixteen thousand samples per second into fifty frames per second, and a back-end reads those frames. AASIST reads them as an image and a graph, with under half a million parameters. MamBo reads them as a sequence, with bidirectional state space models and a little attention, in about four million. And in both cases, the time axis is only removed at the very end, by pooling. Thanks for watching.",
    ],
    hud: null,
    draw(ctx, S) {
      const A = S.vis(0, 3);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const y0 = 180, lh = 76;
        txt(ctx, 'step', 110, y0 - 30, { size: 22, weight: 700, color: COL.dim });
        txt(ctx, 'what happens', 440, y0 - 30, { size: 22, weight: 700, color: COL.dim });
        txt(ctx, 'shape', 1810, y0 - 30, { size: 22, weight: 700, color: COL.dim, align: 'right' });
        line(ctx, 100, y0 - 14, 1820, y0 - 14, COL.line, 2);
        RECAP.forEach(([a, b, c, beat, dl], i) => {
          const al = S.p(beat, 0.5, dl);
          if (al <= 0) return;
          const y = y0 + 34 + i * lh;
          txt(ctx, a, 110, y, { size: 27, weight: 700, alpha: al });
          mtxt(ctx, b, 440, y, { size: 23, color: COL.dim, alpha: al });
          mtxt(ctx, c, 1810, y, { size: 26, mono: true, align: 'right', alpha: al, color: COL.dim });
        });
        ctx.restore();
      }
      const C = S.p(3);
      if (C > 0) {
        ctx.save(); ctx.globalAlpha = C;
        const cols = [['wav2vec 2.0 base', 'front-end', '12-layer transformer', '94.4 M', '(B, 49, 768) per second', COL.A],
          ['AASIST (SSL)', 'back-end', 'image → nodes → graph attention', '447 K', '(B, 201, 1024) → (B, 2)', COL.H],
          ['MamBo-3-Hydra-N3', 'back-end', 'Hydra SSM + attention', '3.93 M', '(B, 208, 1024) → (B, 2)', COL.M]];
        cols.forEach((c, i) => {
          const a = S.p(3, 0.5, 1 + i * 3), x = 150 + i * 560;
          ctx.globalAlpha = C * a;
          rrect(ctx, x, 230, 520, 520, 16, COL.panel, rgba(c[5], 0.7), 2);
          txt(ctx, c[0], x + 260, 300, { size: 30, weight: 800, align: 'center', color: c[5] });
          txt(ctx, c[1], x + 260, 345, { size: 22, align: 'center', color: COL.dim });
          wrap(ctx, c[2], x + 40, 430, 440, 38, { size: 26 });
          txt(ctx, c[3], x + 260, 580, { size: 48, weight: 800, align: 'center', mono: true });
          txt(ctx, 'parameters', x + 260, 620, { size: 20, align: 'center', color: COL.dim });
          txt(ctx, c[4], x + 260, 700, { size: 21, mono: true, align: 'center', color: COL.dim });
        });
        ctx.globalAlpha = C * S.p(3, 0.6, 14);
        txt(ctx, 'time is removed only at the very end, by pooling', W / 2, 860, { size: 32, weight: 700, align: 'center', color: COL.A });
        ctx.restore();
      }
    },
  });
})();
