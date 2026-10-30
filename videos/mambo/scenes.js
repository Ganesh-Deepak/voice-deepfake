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
      "This is the third video in the series. We've followed X L S R, and the graph-based AASIST back-end. Now we'll trace XLSR-MamBo, a back-end built from state space models and attention.",
      "XLSR-MamBo was published by Ng and colleagues in the Findings of ACL 2026. We'll follow its best configuration: MamBo three, Hydra, N three. The official code needs GPU kernels, so we rebuilt it in plain PyTorch to trace every shape. The rebuilt model's parameter count matches the paper's: three hundred and nineteen point three seven million.",
      "There are some new axes this time. Yellow S, for the state size of the state space model. Lavender E, for the expanded inner width. [+0.6] Purple H, for heads, and pink P, for the size of each head.",
    ],
    hud: S => S.b >= 2 ? { stage: 0, shape: '({B:B}, {T:208}, {C:1024})' } : null,
    draw(ctx, S) {
      // cold open: a forward scan, a backward scan (Hydra), then attention links distant frames
      const T = S.T(0), x0 = 150, x1 = 1770, n = 36, tw = (x1 - x0) / n, cy = 700;
      E.kicker(ctx, 'DEEPFAKE DETECTORS · SHAPE BY SHAPE', x0 + 4, 214, T + 0.9);
      chip(ctx, x0 + 600, 206, 'EPISODE 3 / 3', { size: 20, mono: true, color: E.THEME.a, stroke: rgba(E.THEME.a, 0.6), fill: rgba(E.THEME.a, 0.08), alpha: S.p(0, 0.5, 0.2) });
      E.titleRise(ctx, 'XLSR-MamBo', x0, 400, T + 0.6, { size: 150 });
      txt(ctx, 'state space models + attention, shape by shape', x0 + 6, 470, { size: 38, weight: 500, color: COL.dim, alpha: S.p(0, 0.9, 0.5) });
      // (the parameter count and error rate are shown in the overview, where the voice says them)
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
      mtxt(ctx, 'replica parameters {K:319,373,323}  =  paper 319.37 M', x1, 940, { size: 24, align: 'right', alpha: S.ps(1, 3, 0.6, 0.3) * out, mono: true });
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
    ['Input proj', 'Linear · norm · SiLU', RES, COL.K],
    ['5 × MamBo layer', '6 blocks each', RES, COL.M],
    ['Gated attn pool', 'weights over time', '({B:B}, {C:128})', COL.H],
    ['Linear', '128 → 2', '({B:B}, {K:2})', COL.B],
  ];
  S_.push({
    id: 'm_overview', chapter: 1, title: 'The big picture',
    beats: [
      "Here's the full model. A clip of sixty-six thousand eight hundred samples, four point one seven five seconds, goes into X L S R, which returns B by two hundred and eight by one thousand and twenty-four.",
      "An input projection shrinks each frame to one hundred and twenty-eight numbers. That width, one hundred and twenty-eight, is the model dimension for the entire back-end.",
      "Then come five MamBo layers. Each layer runs three Hydra blocks, a feed-forward block, an attention block, and a second feed-forward block. [+1] That's thirty blocks in total, and every one of them maps B by two hundred and eight by one hundred and twenty-eight to the same shape.",
      "Finally, gated attention pooling collapses the time axis into a single vector of one hundred and twenty-eight numbers, and a linear layer produces the two logits.",
      "The back-end has three point nine three million parameters. Together with X L S R, that's three hundred and nineteen point three seven million, exactly the number reported in the paper.",
      "On the benchmarks, this configuration reached an equal error rate of point eight one percent on ASVspoof 2021 L A, one point seven percent on 2021 D F, and four point nine seven percent on the In-the-Wild dataset.",
    ],
    hud: S => S.b === 0 ? { stage: 0, shape: S.past(0, 1, 5) ? '({B:B}, {T:208}, {C:1024})' : '({B:B}, {T:66800})' }
      : S.b === 3 && !S.past(3, 0, 5.5) ? { stage: 6, shape: '({B:B}, {C:128})' }
      : { stage: [0, 1, 2, 7, 7, 7][S.b], shape: ['', RES, RES, '({B:B}, {K:2})', '({B:B}, {K:2})', '({B:B}, {K:2})'][S.b] },
    draw(ctx, S) {
      const bw = 270, gap = 30, x0 = (W - (6 * bw + 5 * gap)) / 2, y = 260, h = 160;
      const on = [0, 0, 1, 2, 3, 3];
      OV.forEach((o, i) => {
        const a = S.p(on[i], 0.6, i === 1 ? 2 : i === 5 ? 3 : 0), x = x0 + i * (bw + gap);
        const hl = (S.b === on[i]);
        box(ctx, x, y, bw, h, [o[0], o[1]], { size: 31, color: o[3], alpha: a, stroke: hl ? COL.A : COL.line, glow: hl ? COL.A : null });
        if (i) arrow(ctx, x - gap + 3, y + h / 2, x - 3, y + h / 2, { alpha: a, head: 10, lw: 2 });
        mtxt(ctx, o[2], x + bw / 2, y + h + 44, { size: 20, mono: true, align: 'center', alpha: a, color: hl ? COL.text : COL.dim });
      });
      // beat 0: the clip runs into XLS-R and comes out as a strip of 208 frames
      const tk = clamp((S.T(0) - S.st(0, 1) - 2.5) / 0.9);
      if (S.b === 0 && tk > 0 && tk < 1) E.glow(ctx, lerp(x0 + bw, x0 + bw + gap, easeIO(tk)), y + h / 2, 34, COL.A, 0.9);
      const fs = S.ps(0, 1, 0.6, 4.5) * (1 - S.p(1, 0.5));
      if (fs > 0) {
        ctx.save(); ctx.globalAlpha = fs;
        const sx = x0 + bw + gap, sw = easeIO(S.l(0, 1.2, S.st(0, 1) + 4.5));
        cells(ctx, sx, 520, 6, Math.max(1, Math.round(26 * sw)), bw / 26, 16, (r, c) => vcol(noise(r, c, 509) * 0.9, 0.9), 1.5);
        mtxt(ctx, '{T:208} frames × {C:1024}', sx + bw / 2, 640, { size: 24, weight: 700, align: 'center' });
        ctx.restore();
      }
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
        txt(ctx, 'EER (%) — lower is better · best of the top-5 checkpoints, as reported', 360, 580, { size: 24, color: COL.dim });
        d.forEach((r, i) => {
          const a = S.p(5, 0.5, 0.8 + i * 1.1), yy = 620 + i * 80;
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
    hud: S => ({ stage: 0, shape: S.b === 0 ? '({B:B}, {T:66800})' : '({B:B}, {T:208}, {C:1024})', label: S.b === 0 ? 'waveform' : 'XLS-R output' }),
    draw(ctx, S) {
      ctx.save(); ctx.globalAlpha *= S.p(0, 0.6, 0.8);
      rrect(ctx, 140, 200, 1640, 170, 14, COL.panel, COL.line, 2);
      ctx.restore();
      drawWave(ctx, 160, 285, 1600, 130, { lw: 1.2, alpha: S.p(0, 0.6, 0.8) });
      dimBottom(ctx, 160, 376, 1600, '{T:66,800} samples  =  4.175 s', COL.T, 26);
      const out = 1 - S.p(1, 0.5);
      // a short clip is tiled until it fills the crop
      const rp = S.ps(0, 1, 0.6) * out;
      if (rp > 0) {
        ctx.save(); ctx.globalAlpha = rp;
        txt(ctx, 'shorter clip: repeated', 140, 470, { size: 24, weight: 700, color: COL.dim });
        for (let k = 0; k < 3; k++) {
          const w = k < 2 ? 640 : 1640 - 2 * 640 - 20, a = clamp((S.T(0) - S.st(0, 1) - 0.6 - k * 0.6) / 0.5);
          ctx.globalAlpha = rp * a;
          rrect(ctx, 140 + k * 650, 485, w, 70, 8, rgba(COL.T, 0.08), rgba(COL.T, 0.6), 1.5);
          drawWave(ctx, 150 + k * 650, 520, w - 20, 50, { from: 2000, to: 2000 + Math.floor(9000 * (w / 640)), lw: 1 });
        }
        ctx.restore();
      }
      const fa = S.ps(0, 2, 0.6) * out;
      mtxt(ctx, '⌊ (66800 − {K:400}) / {A:320} ⌋ + 1  =  {T:208} frames', W / 2, 680, { size: 36, mono: true, align: 'center', alpha: fa });
      const b = S.p(1, 0.6, 0.4);
      if (b > 0) {
        ctx.save(); ctx.globalAlpha = b;
        arrow(ctx, 610, 430, 610, 500, {});
        box(ctx, 380, 510, 460, 200, null, { stroke: rgba(COL.A, 0.8) });
        txt(ctx, 'XLS-R 300M', 610, 570, { size: 34, weight: 700, align: 'center', color: COL.A });
        // its 24 layers as ticks; only the last one is read
        const fl = S.ps(1, 0, 0.6, 4);
        for (let i = 0; i < 24; i++) rrect(ctx, 410 + i * 17, 610, 11, 60, 3, i === 23 ? E.mix(rgba(COL.A, 0.3), COL.K, fl) : rgba(COL.A, 0.3), null);
        txt(ctx, 'final layer only', 818, 700, { size: 22, weight: 700, align: 'right', color: COL.K, alpha: fl });
        arrow(ctx, 860, 610, 990, 610, { alpha: fl });
        mat(ctx, 1080, 520, 560, 200, { rows: 12, cols: 30, seed: 501, left: ['{C:1024}', COL.C], top: ['{T:208} frames', COL.T], alpha: fl });
        const fz = S.ps(1, 1, 0.6);
        chip(ctx, 470, 760, 'frozen', { size: 26, color: COL.T, stroke: COL.T, fill: rgba(COL.T, 0.1), alpha: fz });
        txt(ctx, 'or', 610, 784, { size: 24, color: COL.dim, align: 'center', alpha: fz });
        chip(ctx, 650, 760, 'fine-tuned', { size: 26, color: COL.C, stroke: COL.C, fill: rgba(COL.C, 0.1), alpha: S.ps(1, 1, 0.6, 1.5) });
        txt(ctx, 'one flag in the config', 610, 850, { size: 22, color: COL.dim, align: 'center', alpha: S.ps(1, 1, 0.6, 3) });
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
        mat(ctx, 210, 290, 520, 300, { rows: 14, cols: 26, seed: 512, left: ['{C:1024}', COL.C], top: ['{T:208} frames', COL.T] });
        arrow(ctx, 760, 440, 870, 440, { color: COL.K });
        box(ctx, 880, 380, 270, 120, ['Linear', '1024 → 128, no bias'], { size: 31, color: COL.K });
        arrow(ctx, 1160, 440, 1250, 440, { color: COL.K });
        mat(ctx, 1320, 420, 520, 38, { rows: 2, cols: 26, seed: 513, left: ['{C:128}', COL.C], top: ['{T:208} frames', COL.T] });
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
        // the RMS level on the left becomes 1.0 on the right; then the learned scale g reshapes each feature
        line(ctx, 180, 540 - rms * 80, 180 + 28 * 24, 540 - rms * 80, rgba(COL.K, 0.9), 2, [8, 6]);
        line(ctx, 1040, 540 - 80, 1040 + 28 * 24, 540 - 80, rgba(COL.K, 0.9 * t), 2, [8, 6]);
        txt(ctx, '1.0', 1040 + 28 * 24 + 8, 548 - 80, { size: 20, mono: true, color: COL.K, alpha: t });
        const gA = S.ps(1, 1, 0.6, 3);
        if (gA > 0) { ctx.save(); ctx.globalAlpha = R * gA; txt(ctx, '× g', 1040 + 28 * 12, 640, { size: 26, weight: 700, align: 'center', color: COL.A }); cells(ctx, 1040, 660, 1, 28, 24, 16, (r, c) => rgba(COL.A, 0.25 + 0.6 * Math.abs(noise(c, 3, 514))), 2); txt(ctx, 'learned scale, one per feature', 1040 + 28 * 12, 710, { size: 20, align: 'center', color: COL.dim }); ctx.restore(); }
        txt(ctx, 'mean is NOT removed · no bias · one learned scale per feature', W / 2, 840, { size: 28, weight: 600, align: 'center', alpha: S.p(1, 0.6, 9) });
        ctx.restore();
      }
      const Q = S.p(2);
      if (Q > 0) {
        ctx.save(); ctx.globalAlpha = Q;
        const ox = 560, oy = 560, sx = 100, sy = 100;
        plotAxes(ctx, ox, oy, sx, sy, -3.6, 3.6, -1, 3.6, [150, 180, 820, 700]);
        curve(ctx, x => Math.max(0, x), ox, oy, sx, sy, -3.6, 3.4, COL.dim, 3, 1, [8, 8]);
        txt(ctx, 'ReLU, for comparison', 610, 250, { size: 20, color: COL.dim });
        curve(ctx, x => x * sig(x), ox, oy, sx, sy, -3.6, 3.4, COL.A, 5, S.l(2, 2));
        txt(ctx, 'SiLU', 800, 300, { size: 30, weight: 800, color: COL.A });
        txt(ctx, 'min ≈ −0.28 at x ≈ −1.28', 250, 700, { size: 20, mono: true, color: COL.dim });
        mtxt(ctx, 'SiLU(x) = x · σ(x)', 1040, 300, { size: 44, mono: true, weight: 600 });
        txt(ctx, 'σ(x) = 1 / (1 + e⁻ˣ)', 1040, 360, { size: 30, mono: true, color: COL.dim });
        mtxt(ctx, 'output: ' + RES, 1040, 520, { size: 28, mono: true, alpha: S.p(2, 0.6, 6) });
        txt(ctx, 'the residual stream for all 30 blocks', 1040, 570, { size: 26, color: COL.dim, alpha: S.ps(2, 2, 0.6, 2) });
        // SiLU applied to the actual tensor: negative numbers are squashed towards zero
        const sm = S.ps(2, 2, 0.6, 0.3);
        if (sm > 0) { ctx.save(); ctx.globalAlpha = Q * sm; mat(ctx, 1040, 650, 720, 150, { rows: 6, cols: 30, seed: 515, left: ['{C:128}', COL.C], top: ['{T:208}', COL.T], fn: (r, c) => { const v = 1.8 * noise(r, c, 515); return vcol(v * sig(v) * 0.6, 0.9); } }); ctx.restore(); }
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
        mtxt(ctx, 'residual stream  ' + RES, 130, y - 44, { size: 24, weight: 700, color: COL.B });
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
          mtxt(ctx, 'h ' + RES, x + 160, 690, { size: 20, weight: 700, color: COL.K, mono: true });
        }
        ctx.globalAlpha = A;
        const go = (t0, pts, col) => {
          const u = clamp((S.T(S.b) - t0) / 2.2); if (u <= 0 || u >= 1) return;
          let L = 0; const seg = []; for (let q = 1; q < pts.length; q++) { const d = Math.hypot(pts[q][0] - pts[q - 1][0], pts[q][1] - pts[q - 1][1]); seg.push(d); L += d; }
          let d = easeIO(u) * L, q = 0; while (q < seg.length - 1 && d > seg[q]) { d -= seg[q]; q++; }
          const f = seg[q] ? d / seg[q] : 0; E.glow(ctx, lerp(pts[q][0], pts[q + 1][0], f), lerp(pts[q][1], pts[q + 1][1], f), 34, col, 0.95);
        };
        if (S.b === 0) { go(S.st(0, 1) + 0.3, [[120, y], [330, y]], COL.B); go(S.st(0, 2) + 0.3, [[330, y], [330, 440], [330, 550], [330, 640]], COL.A); }
        if (S.b === 1) go(S.st(1, 0) + 0.3, [[330, 642], [330, 700], [790, 700], [790, y + 60], [826, y + 14]], COL.K);
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
        txt(ctx, 'state space layer: N = 3 Hydra + SwiGLU', 180 + 2 * 265 - 15, 480, { size: 26, weight: 700, align: 'center', color: COL.M, alpha: S.p(2, 0.5, 6) });
        txt(ctx, 'transformer layer: MHA + SwiGLU', 180 + 5 * 265 - 15, 480, { size: 26, weight: 700, align: 'center', color: COL.H, alpha: S.p(2, 0.5, 8) });
        const v = [['MamBo-1', 'SSM blocks replace attention (N SSM + SwiGLU)'], ['MamBo-2', 'SSM blocks + attention in place of the SwiGLU'], ['MamBo-3', 'alternate SSM layers and transformer layers (this video)'], ['MamBo-4', 'alternate SSM layers and SSM + attention layers']];
        v.forEach((r, i) => {
          const a = S.p(2, 0.4, 12 + i * 0.8), y = 600 + i * 64;
          ctx.globalAlpha = L * a;
          txt(ctx, r[0], 300, y, { size: 26, weight: 800, color: i === 2 ? COL.A : COL.text });
          txt(ctx, r[1], 520, y, { size: 26, color: i === 2 ? COL.A : COL.text });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 5 SSM from scratch
  // toy sequence; in the selective version every frame gets its own step size Δ (A = −1, B = C = 1), and frame 4 gets a big one
  const XS = [1, 0, 0, 2, 0, 0, 0, 1], HS = [1.0, 0.7, 0.49, 2.34, 1.64, 1.15, 0.8, 1.56];
  const DL = [0.3, 0.3, 0.3, 1.6, 0.3, 0.3, 0.3, 0.3], AT = DL.map(d => Math.exp(-d));
  const HSEL = (() => { let h = 0; return XS.map((x, t) => (h = AT[t] * h + DL[t] * x)); })();
  S_.push({
    id: 'm_ssm', chapter: 5, title: 'State space models from scratch',
    beats: [
      "Hydra is a state space model, so let's build one from scratch. Attention compares every frame with every other frame, which costs time proportional to T squared. A state space model instead walks through the sequence once, carrying a small memory, called the state.",
      "The simplest version: at each step, the new state is a times the old state, plus b times the input. The output is c times the state. With a between zero and one, old information fades gradually, and recent inputs matter most. Here, a is point seven.",
      "Mamba's key idea is to make these numbers depend on the input. A step size, delta, is computed from each frame. [+1.5] The decay becomes e to the power of delta times A, where A is a learned negative number. [+1] A large delta means: forget the past, and focus on this frame. A small delta means: keep the memory, and mostly ignore this frame.",
      "B and C also come from the input, as vectors. B decides how the current frame is written into the state, and C decides how the state is read out. [+1.2] That's why these models are called selective: each frame chooses what to store, and what to recall.",
      "Inside Hydra, each frame's one hundred and twenty-eight numbers are first expanded to two hundred and fifty-six, and split into four heads of sixty-four. In Mamba two, which Hydra builds on, each head's state is a matrix: sixty-four values of the head, by sixty-four state dimensions.",
      "Each step multiplies the old state by the decay, and adds delta, times the head's input, times B. [+1] The output is the state, times C: sixty-four numbers for the head.",
      "Unrolled over all frames, this is just a matrix multiplying the sequence: y equals M times x. Entry i, j of M is C i dotted with B j, times delta j, times all the decays between frame j and frame i. M is lower-triangular, so each frame only sees the past. This view, called state space duality, is why these layers can be seen as a kind of attention.",
    ],
    hud: S => S.b < 2 ? { stage: 2, shape: '({T:8})  toy', label: 'toy example' } : S.b < 4 ? { stage: 2, shape: 'x, Δ, h: ({T:8})  toy', label: 'selective toy' }
      : S.b === 4 ? { stage: 2, shape: S.past(4, 1) ? 'state ({D:64}, {S:64}) per head' : '({H:4}, {D:64}) per frame', label: 'Mamba-2' }
      : S.b === 5 ? { stage: 2, shape: S.past(5, 1) ? 'y: ({D:64}) per head' : 'state ({D:64}, {S:64}) per head', label: 'Mamba-2' } : { stage: 2, shape: 'M: ({T:208}, {T:208})', label: 'SSD view' },
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const n = 12;
        for (let i = 0; i < n; i++) rrect(ctx, 200 + i * 60, 280, 44, 44, 6, rgba(COL.T, 0.4), COL.T, 1.5);
        ctx.save(); ctx.strokeStyle = rgba(COL.H, 0.25); ctx.lineWidth = 1.2;
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const x1 = 222 + i * 60, x2 = 222 + j * 60; ctx.beginPath(); ctx.moveTo(x1, 276); ctx.quadraticCurveTo((x1 + x2) / 2, 276 - (x2 - x1) * 0.35, x2, 276); ctx.stroke(); }
        ctx.restore();
        txt(ctx, 'attention: all pairs → T² work', 560, 400, { size: 26, weight: 700, color: COL.H, align: 'center', alpha: S.ps(0, 1, 0.6) });
        const b = S.ps(0, 2, 0.6);
        ctx.globalAlpha = A * b;
        for (let i = 0; i < n; i++) {
          const x = 1040 + i * 60, on = clamp((S.T(0) - S.st(0, 2) - 0.6) / 4 * n - i);
          rrect(ctx, x, 280, 44, 44, 6, rgba(COL.T, 0.4), COL.T, 1.5);
          if (i < n - 1) arrow(ctx, x + 44, 250, x + 60, 250, { color: COL.S, head: 8, lw: 2, alpha: clamp(on) });
          rrect(ctx, x + 6, 226, 32, 20, 4, rgba(COL.S, 0.5 * clamp(on + 0.3)), null);
        }
        txt(ctx, 'SSM: one pass, carrying a state → T work', 1400, 400, { size: 26, weight: 700, color: COL.S, align: 'center' });
        ctx.restore();
      }
      // beats 1–3: one toy, kept on screen while its numbers become input-dependent
      const T = S.vis(1, 4);
      if (T > 0) {
        ctx.save(); ctx.globalAlpha = T;
        const cw = 150, x0 = (W - 8 * cw) / 2, sel = S.b >= 2, m1 = S.ps(2, 2, 0.8, 0.3), m2 = S.ps(3, 0, 0.8, 0.5);
        // the formula: a, b, c are highlighted, then become exp(Δₜ·A), Δₜ·Bₜ and Cₜ
        const pulse = S.b === 2 && !S.past(2, 1) ? 0.5 + 0.5 * Math.sin(S.t * 6) : 0;
        if (pulse > 0) rrect(ctx, W / 2 - 500, 196, 1000, 64, 12, null, rgba(COL.K, 0.4 + 0.4 * pulse), 3);
        const f1 = 'h{T:ₜ} = {S:a}·h{T:ₜ₋₁} + {S:b}·x{T:ₜ}        y{T:ₜ} = {S:c}·h{T:ₜ}';
        const f2 = 'h{T:ₜ} = {K:exp(Δₜ·A)}·h{T:ₜ₋₁} + {K:Δₜ}·{S:b}·x{T:ₜ}        y{T:ₜ} = {S:c}·h{T:ₜ}';
        const f3 = 'h{T:ₜ} = {K:exp(Δₜ·A)}·h{T:ₜ₋₁} + {K:Δₜ}·{S:Bₜ}·x{T:ₜ}        y{T:ₜ} = {S:Cₜ}·h{T:ₜ}';
        mtxt(ctx, f1, W / 2, 240, { size: 38, mono: true, align: 'center', weight: 600, alpha: 1 - m1 });
        mtxt(ctx, f2, W / 2, 240, { size: 36, mono: true, align: 'center', weight: 600, alpha: m1 * (1 - m2) });
        mtxt(ctx, f3, W / 2, 240, { size: 36, mono: true, align: 'center', weight: 600, alpha: m2 });
        txt(ctx, 'x', x0 - 30, 360, { size: 28, weight: 700, align: 'right', color: COL.T });
        numRow(ctx, x0, 330, XS, cw, 56, { size: 24, d: 0 });
        // Δ and the per-frame decay (selective version)
        const dA = S.ps(2, 1, 0.6, 0.3), aA = S.ps(2, 2, 0.6, 1.2);
        if (sel && dA > 0) {
          ctx.globalAlpha = T * dA;
          txt(ctx, 'Δ', x0 - 30, 440, { size: 28, weight: 700, align: 'right', color: COL.K });
          numRow(ctx, x0, 410, DL, cw, 56, { size: 24, d: 1, stroke: COL.K, fill: i => rgba(COL.K, 0.08 + 0.25 * DL[i] / 1.6), hl: i => S.past(2, 3) && !S.past(2, 4) ? i === 3 : S.past(2, 4) ? i === 5 : false });
          txt(ctx, 'softplus: smooth, > 0', 40, 445, { size: 20, color: COL.dim });
          ctx.globalAlpha = T * aA;
          txt(ctx, 'decay', x0 - 30, 520, { size: 26, weight: 700, align: 'right', color: COL.K });
          numRow(ctx, x0, 490, AT, cw, 56, { size: 24, d: 2, stroke: COL.K, fill: i => rgba(COL.K, 0.08 + 0.3 * AT[i]) });
          ctx.globalAlpha = T;
        }
        // h: the fixed-a toy first, then the selective one; at the big Δ the memory is reset
        const hy = sel ? 570 : 440, hs = sel && aA > 0.5;
        txt(ctx, 'h', x0 - 30, hy + 30, { size: 28, weight: 700, align: 'right', color: COL.S });
        const k = S.b === 1 ? Math.floor(S.l(1, 7, 3) * 8) : 8, vals = hs ? HSEL : HS;
        numRow(ctx, x0, hy, vals.map((v, i) => i < k ? v : null), cw, 56, { size: 24, d: 2, stroke: COL.S, fill: (i) => i < k ? rgba(COL.S, 0.1 + 0.12 * Math.min(2.5, vals[i])) : 'rgba(0,0,0,0)' });
        txt(ctx, hs ? 'A = −1, B = C = 1' : 'a = 0.7, b = c = 1', W / 2, hy + 100, { size: 24, mono: true, align: 'center', color: COL.dim });
        const big = S.ps(2, 3, 0.5), small = S.ps(2, 4, 0.5);
        if (big > 0 && S.b === 2) { ctx.globalAlpha = T * big * (1 - 0.5 * small); txt(ctx, 'big Δ (frame 4): decay 0.20 → past forgotten', x0 + 3.5 * cw, hy + 140, { size: 24, weight: 700, align: 'center', color: COL.K }); }
        if (small > 0 && S.b === 2) { ctx.globalAlpha = T * small; txt(ctx, 'small Δ (frame 6): decay 0.74 → memory kept', x0 + 5.5 * cw, hy + 180, { size: 24, weight: 700, align: 'center', color: COL.K }); }
        // beat 3: Bₜ and Cₜ are vectors made from the frame
        const bc = S.ps(3, 0, 0.6, 0.6);
        if (bc > 0 && S.b === 3) {
          ctx.globalAlpha = T * bc;
          const bx = x0 + 3 * cw + 10;
          [['Bₜ (64): how xₜ is written into the state', 760, 1], ['Cₜ (64): how the state is read out', 810, 1]].forEach(([l, y, sn], i) => {
            cells(ctx, bx - 180, y, 1, 16, 14, 26, (r, c) => rgba(COL.S, 0.3 + 0.6 * Math.abs(noise(c, i, 527))), 2);
            txt(ctx, l, bx + 70, y + 20, { size: 24, weight: 700, color: COL.S, alpha: S.ps(3, 1, 0.6, i * 1.5) });
          });
          txt(ctx, 'yellow B, C here are the SSM’s matrices · green B is the batch', W / 2, 900, { size: 22, align: 'center', color: COL.dim });
          // with vector B and C, the state itself has 64 slots: B writes into them, C reads them out
          ctx.globalAlpha = T * S.ps(3, 1, 0.6, 3);
          cells(ctx, 1360, 760, 2, 16, 22, 20, (r, c) => rgba(COL.S, 0.25 + 0.5 * Math.abs(noise(r, c, 528))), 2);
          txt(ctx, 'the real state: 64 slots (next: per head)', 1536, 750, { size: 20, weight: 700, align: 'center', color: COL.S });
          ctx.globalAlpha = T * S.ps(3, 2, 0.6);
          txt(ctx, '"selective": each frame chooses what to store and what to recall', W / 2, 860, { size: 28, weight: 700, align: 'center', color: COL.A });
        }
        ctx.restore();
      }
      // beat 4: 128 → expand to 256 → 4 heads of 64; each head keeps a 64 × 64 state
      const M4 = S.vis(4, 6);
      if (M4 > 0) {
        ctx.save(); ctx.globalAlpha = M4;
        const ex = S.b > 4 ? 1 : easeIO(S.l(4, 1, 2.6)), sp = S.b > 4 ? 1 : easeIO(S.l(4, 1, 4.4)), hx = 220, hy = 260;
        mtxt(ctx, ex < 0.5 ? 'one frame: ({C:128})' : 'one frame, expanded × 2: {C:128} → ({E:256})', hx, hy - 20, { size: 26, weight: 700 });
        const tot = lerp(460, 920, ex);
        for (let k = 0; k < 4; k++) {
          const w = tot / 4, x = hx + k * (w + 30 * sp);
          cells(ctx, x, hy, 1, 8, w / 8, 40, (r, c) => rgba(ex < 0.5 ? COL.C : COL.E, 0.3 + 0.5 * Math.abs(noise(k, c, 524))), 1.5);
          if (sp > 0.5) { rrect(ctx, x - 2, hy - 2, w + 4, 44, 5, null, COL.D, k === 0 && S.ps(4, 1, 0.5) > 0 ? 4 : 2); mtxt(ctx, `head ${k + 1}: {D:64}`, x + w / 2, hy + 74, { size: 22, weight: 700, align: 'center', alpha: (sp - 0.5) * 2 }); }
        }
        mtxt(ctx, '{H:H = 4} heads × {D:64}', hx + 1050, hy + 28, { size: 26, weight: 700, alpha: sp });
        const st = S.ps(4, 1, 0.6);
        ctx.globalAlpha = M4 * st;
        mat(ctx, 260, 470, 280, 280, { rows: 16, cols: 16, seed: 521, left: ['{D:64}', COL.D], top: ['{S:64}', COL.S], title: 'state h (head 1)', stroke: COL.S });
        txt(ctx, 'one 64 × 64 matrix per head', 400, 810, { size: 24, align: 'center', color: COL.dim });
        // beat 5: the update and the read-out
        const up = S.b === 5 ? S.ps(5, 0, 0.6) : 0;
        if (up > 0) {
          ctx.globalAlpha = M4 * up;
          mtxt(ctx, 'h{T:ₜ} = e^({K:Δₜ}A) · h{T:ₜ₋₁} + {K:Δₜ} · x{T:ₜ} {S:Bₜ}ᵀ', 1250, 420, { size: 32, mono: true, align: 'center', weight: 600 });
          mat(ctx, 700, 530, 36, 220, { rows: 12, cols: 1, seed: 522, left: ['{D:64}', COL.D], title: 'xₜ (head 1)' });
          txt(ctx, '⊗', 780, 650, { size: 40, align: 'center', color: COL.dim });
          mat(ctx, 830, 625, 280, 36, { rows: 1, cols: 16, seed: 523, top: ['{S:64}', COL.S] });
          txt(ctx, 'Bₜᵀ', 970, 700, { size: 26, weight: 700, align: 'center', color: COL.S });
          txt(ctx, 'outer product = a 64 × 64 update', 970, 750, { size: 24, align: 'center', color: COL.dim });
          const ou = S.ps(5, 1, 0.6, 0.3);
          ctx.globalAlpha = M4 * ou;
          mtxt(ctx, 'y{T:ₜ} = h{T:ₜ} {S:Cₜ}  →  ({D:64}) per head', 1450, 610, { size: 30, mono: true, align: 'center' });
          mtxt(ctx, 'per step: xₜ ({D:64}),  Bₜ, Cₜ ({S:64}),  {K:Δₜ} (1)', 1450, 680, { size: 24, mono: true, align: 'center' });
        }
        ctx.restore();
      }
      // beat 6: the whole scan as one matrix
      const U = S.p(6, 0.7, 0.3);
      if (U > 0) {
        ctx.save(); ctx.globalAlpha = U;
        mtxt(ctx, 'y = M x      M{T:ᵢⱼ} = ({S:Cᵢ}·{S:Bⱼ}) · {K:Δⱼ} · e^(A({K:Δⱼ₊₁} + … + {K:Δᵢ}))   for j ≤ i', W / 2, 240, { size: 32, mono: true, align: 'center', weight: 600 });
        const n = 26, sz = 480, cs = sz / n, ci = 18, cj = 9;
        const rowsOn = S.b > 6 ? n : Math.floor(clamp((S.T(6) - 0.6) / 3.5) * n);
        cells(ctx, 300, 330, n, n, cs, cs, (i, j) => i >= rowsOn ? 'rgba(40,50,70,0.2)' : j <= i ? scol(0.25 + 0.7 * Math.exp(-(i - j) / 6) * (0.6 + 0.4 * Math.abs(noise(i, j, 531)))) : 'rgba(40,50,70,0.35)', 1);
        dimLeft(ctx, 294, 330, sz, 'output frame i', COL.T, 22); dimTop(ctx, 300, 324, sz, 'input frame j', COL.T, 22);
        // one entry, read out as its formula is
        const ce = S.ps(6, 1, 0.5);
        if (ce > 0) {
          ctx.globalAlpha = U * ce;
          rrect(ctx, 300 + cj * cs - 3, 330 + ci * cs - 3, cs + 6, cs + 6, 4, null, COL.K, 4);
          line(ctx, 300 + cj * cs + cs / 2, 330, 300 + cj * cs + cs / 2, 330 + ci * cs, rgba(COL.K, 0.6), 2, [5, 5]);
          line(ctx, 300, 330 + ci * cs + cs / 2, 300 + cj * cs, 330 + ci * cs + cs / 2, rgba(COL.K, 0.6), 2, [5, 5]);
          mtxt(ctx, `M{T:${ci}, ${cj}} = {S:C${ci}}·{S:B${cj}} × {K:Δ${cj}} × (decays of frames ${cj + 1} … ${ci})`, 860, 700, { size: 24, mono: true });
          ctx.globalAlpha = U;
        }
        txt(ctx, 'lower-triangular: each frame sees only the past', 540, 870, { size: 26, weight: 700, align: 'center', color: COL.K, alpha: S.ps(6, 2, 0.6) });
        const sd = S.ps(6, 3, 0.6, 0.3);
        if (sd > 0) {
          ctx.globalAlpha = U * sd;
          txt(ctx, 'state space duality (SSD)', 1380, 420, { size: 34, weight: 800, align: 'center', color: COL.A });
          txt(ctx, 'scan  ≈  a T × T weight matrix on the frames', 1380, 480, { size: 26, align: 'center' });
          for (let i = 0; i < 12; i++) rrect(ctx, 1080 + i * 50, 560, 38, 38, 6, rgba(COL.T, 0.4), COL.T, 1.5);
          ctx.strokeStyle = rgba(COL.H, 0.6); ctx.lineWidth = 1.6;
          for (let i = 0; i < 12; i++) for (let j = 0; j < i; j++) if ((i + j) % 3 === 0) { const x1 = 1099 + j * 50, x2 = 1099 + i * 50; ctx.beginPath(); ctx.moveTo(x1, 556); ctx.quadraticCurveTo((x1 + x2) / 2, 556 - (x2 - x1) * 0.3, x2, 556); ctx.stroke(); }
          txt(ctx, 'like masked attention, but M is never built: the scan takes T steps', 1380, 640, { size: 24, align: 'center', color: COL.dim });
        }
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
      "In code, the trick is to stack the forward and flipped sequences along the batch axis, so both scans run in a single call. [+1.5] That's why you'll see a batch of two B inside Hydra.",
    ],
    hud: S => ({ stage: 2, shape: S.b < 3 ? RES : '({B:2B}, {T:208}, {E:256})', label: S.b < 3 ? 'tensor shape' : 'inside Hydra' }),
    draw(ctx, S) {
      const A = S.vis(0, 2);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const n = 14, x0 = 330, cw = 90, ft = 6;
        for (let i = 0; i < n; i++) rrect(ctx, x0 + i * cw, 400, 70, 70, 8, rgba(COL.T, 0.35), i === ft && S.b >= 1 ? COL.K : COL.T, i === ft && S.b >= 1 ? 3 : 1.5);
        if (S.b === 0 && !S.past(0, 1)) {
          // a causal model: frame t sees only what came before it; a detector may use the whole clip
          const c1 = S.p(0, 0.6, 0.4), c2 = S.p(0, 0.6, Math.max(1.5, S.st(0, 1) - 3));
          ctx.save(); ctx.globalAlpha *= c1 * (1 - c2);
          rrect(ctx, x0 + ft * cw - 4, 396, 78, 78, 10, null, COL.K, 3);
          brace(ctx, x0, x0 + ft * cw - 10, 380, COL.K, false);
          txt(ctx, 'causal: frame t sees only the past', x0 + ft * cw / 2, 330, { size: 24, weight: 700, align: 'center', color: COL.K });
          ctx.restore();
          ctx.save(); ctx.globalAlpha *= c2;
          brace(ctx, x0, x0 + n * cw - 20, 380, COL.A, false);
          txt(ctx, 'a detector can read the whole clip', x0 + n * cw / 2, 330, { size: 24, weight: 700, align: 'center', color: COL.A });
          ctx.restore();
        }
        const f = S.l(0, 3, S.st(0, 1)), b = S.l(0, 3, S.st(0, 1) + 3);
        if (S.b === 0) {
          arrow(ctx, x0, 360, x0 + (n * cw - 20) * f, 360, { color: COL.M, lw: 4, alpha: f > 0 ? 1 : 0 });
          txt(ctx, 'forward scan', x0, 340, { size: 24, weight: 700, color: COL.M, alpha: f > 0 ? 1 : 0 });
          arrow(ctx, x0 + n * cw - 20, 520, x0 + n * cw - 20 - (n * cw - 20) * b, 520, { color: COL.A, lw: 4, alpha: b > 0 ? 1 : 0 });
          txt(ctx, 'backward scan (on flip(x))', x0 + n * cw - 20, 560, { size: 24, weight: 700, color: COL.A, align: 'right', alpha: b > 0 ? 1 : 0 });
        } else {
          // the two scan outputs, then each nudged one frame: frame t gets the forward state up to t−1 and the backward state from t+1
          const sh = easeIO(S.l(1, 0.8, S.st(1, 1) + 0.4));
          for (let i = 0; i < n; i++) {
            const xf = x0 + (i + sh) * cw, xb = x0 + (i - sh) * cw;
            if (i + sh < n - 0.01) rrect(ctx, xf, 320, 70, 50, 8, rgba(COL.M, 0.25 + 0.5 * (i / n)), COL.M, 1.5);
            if (i - sh > -0.99) rrect(ctx, xb, 500, 70, 50, 8, rgba(COL.A, 0.25 + 0.5 * ((n - i) / n)), COL.A, 1.5);
          }
          if (sh > 0.5) { txt(ctx, '0', x0 + 35, 352, { size: 22, mono: true, align: 'center', color: COL.faint, alpha: sh }); txt(ctx, '0', x0 + (n - 1) * cw + 35, 532, { size: 22, mono: true, align: 'center', color: COL.faint, alpha: sh }); }
          txt(ctx, 'shift(forward scan) → one frame right: frame t sees frames before t', x0, 300, { size: 24, weight: 700, color: COL.M });
          txt(ctx, '← one frame left: flip, shift(backward scan): frame t sees frames after t', x0, 600, { size: 24, weight: 700, color: COL.A });
          const dx = S.ps(1, 1, 0.6, 3);
          if (dx > 0) { const yd = lerp(250, 435, easeIO(dx)); ctx.fillStyle = COL.K; ctx.beginPath(); ctx.arc(x0 + ft * cw + 35, yd, 14, 0, 7); ctx.fill(); txt(ctx, 'D·x: frame t itself, once', x0 + ft * cw + 70, 260, { size: 24, weight: 700, color: COL.K, alpha: dx }); }
        }
        const e = S.ps(1, 0, 0.6, 0.3);
        mtxt(ctx, 'y = shift(SS(x)) + flip(shift(SS(flip(x)))) + D·x', W / 2, 720, { size: 38, mono: true, align: 'center', alpha: e, weight: 600 });
        txt(ctx, 'SS = the selective scan from chapter 5', W / 2, 780, { size: 26, align: 'center', color: COL.text, alpha: e });
        ctx.restore();
      }
      const M = S.vis(2, 3);
      if (M > 0) {
        ctx.save(); ctx.globalAlpha = M;
        const n = 26, sz = 520, x = 300, y = 280;
        const rl = S.ps(2, 0, 0.5, 1.2), ru = S.ps(2, 0, 0.5, 2.6), rd = S.ps(2, 0, 0.5, 4.0);
        cells(ctx, x, y, n, n, sz / n, sz / n, (i, j) => i === j ? rgba(COL.K, 0.9 * rd) : j < i ? rgba(COL.M, (0.25 + 0.55 * Math.exp(-(i - j) / 7)) * rl) : rgba(COL.A, (0.25 + 0.55 * Math.exp(-(j - i) / 7)) * ru), 1);
        rrect(ctx, x - 3, y - 3, sz + 6, sz + 6, 6, null, COL.line, 2);
        [['lower: forward scan', COL.M], ['upper: backward scan', COL.A], ['diagonal: D', COL.K]].forEach((l, i) => {
          const a = [rl, ru, rd][i];
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
        mtxt(ctx, '{E:256} = 2 × 128: the expanded width from chapter 5', 1300, 640, { size: 24, align: 'center', color: COL.E });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 7 Hydra shapes
  // the ledger on the right ticks one row per step; [name, shape, beat, sentence]
  const HSTEPS = [
    ['input', RES, 0, 1],
    ['in_proj  128 → 776', '({B:B}, {T:208}, 776)', 1, 0],
    ['split: z | xBC | Δ', 'z {E:256} · xBC 512 · Δ 8', 1, 1],
    ['depthwise conv1d (k=7) + SiLU', '({B:B}, {T:208}, 512)', 2, 0],
    ['split: x | B, C fwd | B, C bwd', 'x {E:256} · B, C: 4 × {S:64}', 2, 2],
    ['stack x and flip(x) on batch', '({B:2B}, {T:208}, {E:256})', 3, 0],
    ['view as heads', '({B:2B}, {T:208}, {H:4}, {D:64})', 3, 1],
    ['SSD scan (A, Δ, B, C)', 'same shape', 4, 0],
    ['flip back, add, + D·x', '({B:B}, {T:208}, {E:256})', 4, 1],
    ['gated RMSNorm: norm(y) · SiLU(z)', '({B:B}, {T:208}, {E:256})', 6, 0],
    ['out_proj  256 → 128', RES, 6, 1],
  ];
  S_.push({
    id: 'm_hshapes', chapter: 7, title: 'Inside one Hydra block',
    code: 'modules/hydra/modules/hydra.py  (d_model=128, expand=2, headdim=64, d_state=64)',
    beats: [
      "Now the real shapes, for one Hydra block. The input is B by two hundred and eight by one hundred and twenty-eight. Inside, the width is expanded two times, to two hundred and fifty-six.",
      "A single linear layer, in proj, maps one hundred and twenty-eight to seven hundred and seventy-six numbers per frame. [+1] They're split into three parts. z: two hundred and fifty-six numbers, for the output gate. x B C: five hundred and twelve numbers. And delta: eight numbers, four heads for each direction.",
      "The x B C part goes through a depthwise convolution along time, seven frames wide, and a SiLU. Depthwise means each of the five hundred and twelve channels has its own small kernel. [+1] Then it's split: x is two hundred and fifty-six numbers, and the other two hundred and fifty-six hold B and C for the forward and backward scans, sixty-four each.",
      "The forward and flipped copies are stacked on the batch axis, so x becomes two B by two hundred and eight by two hundred and fifty-six. It's viewed as four heads of sixty-four: two B, by two hundred and eight, by four, by sixty-four. [+1.2] The B and C matrices are two times batch, by two hundred and eight, by sixty-four, shared by all heads.",
      "The scan returns the same shape. Then the backward half is flipped back in time, and added to the forward half. [+1] The four heads of sixty-four are joined back into two hundred and fifty-six.",
      "The D term adds x back in, scaled by a gain for each head that is itself computed from x. [+1] We're back to B by two hundred and eight by two hundred and fifty-six.",
      "Finally, a gated RMSNorm: normalize, then multiply by SiLU of z. And out proj maps two hundred and fifty-six back to one hundred and twenty-eight. One Hydra block has about one hundred and thirty-eight thousand parameters, most of them in the two projections.",
    ],
    hud: S => {
      const h = (shape, label) => ({ stage: 2, shape, label: label || 'one Hydra block' });
      if (S.b === 0) return h(RES, 'block input');
      if (S.b === 1) return h(S.past(1, 0, 2) ? '({B:B}, {T:208}, 776)' : RES, S.past(1, 0, 2) ? 'in_proj' : 'block input');
      if (S.b === 2) return S.past(2, 2) ? h('x ({B:B}, {T:208}, {E:256})', 'after split') : h('xBC ({B:B}, {T:208}, 512)', 'conv1d');
      if (S.b === 3) return S.past(3, 2, 0.8) ? h('B, C matrices ({B:2B}, {T:208}, {S:64})', 'scan inputs') : S.past(3, 1) ? h('({B:2B}, {T:208}, {H:4}, {D:64})', 'heads') : h('({B:2B}, {T:208}, {E:256})', 'stacked');
      if (S.b === 4) return S.past(4, 2) ? h('({B:B}, {T:208}, {E:256})', 'heads joined') : S.past(4, 1) ? h('({B:B}, {T:208}, {H:4}, {D:64})', 'flipped back, added') : h('({B:2B}, {T:208}, {H:4}, {D:64})', 'scan output');
      if (S.b === 5) return h('({B:B}, {T:208}, {E:256})', 'with D·x');
      return h(S.past(6, 1) ? RES : '({B:B}, {T:208}, {E:256})', S.past(6, 1) ? 'block output' : 'gated norm');
    },
    draw(ctx, S) {
      // the tensor itself: time runs across (22 frames shown), features run down, drawn to scale (0.45 px per feature)
      const x0 = 210, NT = 22, cw = 38, SW = NT * cw, hp = n => Math.max(14, n * 0.45);
      const band = (y, n, col, a, seed = 0, flip = false) => {
        const h = hp(n), rows = Math.max(1, Math.round(h / 14));
        ctx.save(); ctx.globalAlpha *= a;
        cells(ctx, x0, y, rows, NT, cw, h / rows, (r, c) => rgba(col, 0.22 + 0.5 * Math.abs(noise(r + seed, flip ? NT - 1 - c : c, 571))), 2);
        rrect(ctx, x0 - 2, y - 2, SW + 4, h + 4, 4, null, rgba(col, 0.9), 2);
        ctx.restore(); return h;
      };
      const lab = (y, s, a, col) => mtxt(ctx, s, x0 - 16, y, { size: 22, weight: 700, align: 'right', base: 'middle', alpha: a, color: col });
      // ledger
      HSTEPS.forEach(([name, shp, b, sn], i) => {
        const a = S.ps(b, sn, 0.5, 0.2);
        if (a <= 0) return;
        const y = 150 + i * 64, nxt = HSTEPS[i + 1], cur = !nxt || !(S.b > nxt[2] || (S.b === nxt[2] && S.T(nxt[2]) >= S.st(nxt[2], nxt[3]) + 0.2));
        ctx.save(); ctx.globalAlpha = a * (cur ? 1 : 0.6);
        rrect(ctx, 1130, y, 730, 56, 10, cur ? rgba(COL.M, 0.12) : COL.panel, cur ? COL.M : COL.line, cur ? 2 : 1);
        txt(ctx, cur ? '▸' : '✓', 1150, y + 36, { size: 20, color: cur ? COL.M : COL.B });
        txt(ctx, name, 1178, y + 25, { size: 21, weight: 600 });
        mtxt(ctx, shp, 1178, y + 49, { size: 20, mono: true, color: COL.dim });
        ctx.restore();
      });
      // beat 0: the input, and the promise of a wider inside
      const A0 = S.vis(0, 1);
      if (A0 > 0) {
        ctx.save(); ctx.globalAlpha = A0;
        const a = S.ps(0, 1, 0.6);
        band(320, 128, COL.C, a);
        lab(320 + hp(128) / 2, '{C:128}', a);
        ctx.globalAlpha = A0 * a; dimTop(ctx, x0, 314, SW, '{T:208} frames (22 shown)', COL.T, 22); ctx.globalAlpha = A0;
        const e = S.ps(0, 2, 0.6, 0.4);
        if (e > 0) {
          ctx.globalAlpha = A0 * e;
          band(460, 256, COL.E, 0.5);
          lab(460 + hp(256) / 2, 'inside: {E:E = 256}', 1, COL.E);
          txt(ctx, 'expand × 2', x0 + SW / 2, 440, { size: 24, weight: 700, align: 'center', color: COL.E });
        }
        ctx.restore();
      }
      // beat 1: in_proj makes 776 numbers per frame, cut into z | xBC | Δ
      const A1 = S.vis(1, 2);
      if (A1 > 0) {
        ctx.save(); ctx.globalAlpha = A1;
        const g = S.ps(1, 0, 0.8, 1), sp = easeIO(S.l(1, 0.8, S.st(1, 1) + 0.2)), y0 = 220;
        txt(ctx, 'in_proj: Linear 128 → 776 (no bias)', x0, 196, { size: 24, weight: 700, color: COL.K, alpha: g });
        const parts = [[256, COL.E, 'z {E:256}', 2], [512, '#8fa3c0', 'xBC 512', 3], [8, COL.K, 'Δ 8', 4]];
        if (sp < 0.05) { band(y0, 776, '#8fa3c0', g); lab(y0 + hp(776) / 2, '776', g); }
        else {
          let y = y0;
          parts.forEach(([n, col, l, sn]) => {
            const on = S.ps(1, sn, 0.5);
            band(y, n, col, 0.35 + 0.65 * on);
            lab(y + hp(n) / 2, l, 0.4 + 0.6 * on, col === '#8fa3c0' ? COL.text : col);
            y += hp(n) + 14 * sp;
          });
          chip(ctx, x0 + SW - 12, y0 + hp(256) / 2 - 18, 'for the output gate', { size: 22, align: 'right', color: COL.E, stroke: COL.E, fill: COL.bg2, alpha: S.ps(1, 2, 0.5) });
          txt(ctx, 'Δ: one step size per head, 4 heads × 2 directions', x0 + SW, y0 + hp(256) + hp(512) + hp(8) + 64, { size: 22, color: COL.K, align: 'right', alpha: S.ps(1, 4, 0.5) });
        }
        ctx.restore();
      }
      // beat 2: depthwise conv along time over xBC, then xBC splits into x and the four B / C pieces
      const A2 = S.vis(2, 3);
      if (A2 > 0) {
        ctx.save(); ctx.globalAlpha = A2;
        const y0 = 240, h = hp(512), sw = S.l(2, 4, 0.8), split = easeIO(S.l(2, 1, S.st(2, 2) + 0.3));
        txt(ctx, 'xBC', x0, 214, { size: 24, weight: 700 });
        if (split < 0.05) {
          band(y0, 512, '#8fa3c0', 1);
          lab(y0 + h / 2, '512', 1);
          const k = Math.min(NT - 7, Math.floor(sw * (NT - 6)));
          rrect(ctx, x0 + k * cw - 3, y0 - 6, 7 * cw + 6, h + 12, 8, rgba(COL.K, 0.12), COL.K, 4);
          txt(ctx, 'conv1d, 7 frames, + SiLU', x0 + k * cw + 3.5 * cw, y0 + h + 40, { size: 22, weight: 700, align: 'center', color: COL.K });
          const one = S.ps(2, 1, 0.5);
          if (one > 0) {
            ctx.globalAlpha = A2 * one;
            rrect(ctx, x0 + k * cw - 3, y0 + 6 * 14 - 2, 7 * cw + 6, 16, 4, null, COL.text, 2);
            txt(ctx, 'depthwise: each of the 512 channels has its own 7 weights', x0 + SW / 2, y0 + h + 84, { size: 22, align: 'center', color: COL.text });
          }
        } else {
          const pcs = [[256, COL.E, 'x {E:256}'], [64, COL.S, 'B fwd {S:64}'], [64, '#d9b54a', 'C fwd {S:64}'], [64, COL.S, 'B bwd {S:64}'], [64, '#d9b54a', 'C bwd {S:64}']];
          let y = y0;
          pcs.forEach(([n, col, l], i) => { band(y, n, col, 1, i * 7); lab(y + hp(n) / 2, l, split, col); y += hp(n) + 12 * split; });
        }
        ctx.restore();
      }
      // beat 3: x and flip(x) stacked on the batch axis; 256 folds into 4 heads of 64; B and C shared by all heads
      const A3 = S.vis(3, 4);
      if (A3 > 0) {
        ctx.save(); ctx.globalAlpha = A3;
        const h = hp(256), yA = 200, yB = yA + h + 24, fl = S.p(3, 0.8, 0.6);
        band(yA, 256, COL.E, 1); lab(yA + h / 2, 'x', 1, COL.E);
        ctx.globalAlpha = A3 * fl;
        band(yB, 256, COL.E, 1, 0, true); lab(yB + h / 2, 'flip(x)', 1, COL.E);
        dimRight(ctx, x0 + SW + 8, yA, yB + h - yA, '{B:2B}', COL.B, 26);
        // four heads of 64
        const hd = S.ps(3, 1, 0.6, 0.3);
        if (hd > 0) {
          ctx.globalAlpha = A3 * hd;
          [yA, yB].forEach(y0 => { for (let k = 0; k < 4; k++) rrect(ctx, x0 - 4, y0 + k * h / 4 + 1, SW + 8, h / 4 - 2, 4, null, COL.D, 2.5); });
          mtxt(ctx, '256 = {H:H = 4} heads × {D:P = 64}', x0 + SW / 2, yA - 16, { size: 24, weight: 700, align: 'center' });
        }
        const bc = S.ps(3, 2, 0.6, 0.2);
        if (bc > 0) {
          ctx.globalAlpha = A3 * bc;
          const y1 = yB + h + 40;
          band(y1, 64, COL.S, 1, 3); lab(y1 + hp(64) / 2, 'B {S:64}', 1, COL.S);
          band(y1 + hp(64) + 12, 64, '#d9b54a', 1, 9); lab(y1 + hp(64) * 1.5 + 12, 'C {S:64}', 1, '#d9b54a');
          mtxt(ctx, 'B, C matrices: ({B:2 × batch}, {T:208}, {S:64}), shared by all 4 heads', x0 + SW / 2, y1 + 2 * hp(64) + 56, { size: 24, mono: true, align: 'center' });
        }
        ctx.restore();
      }
      // beat 4: the scan (forward copy left → right, flipped copy right → left), then flip back and add
      const A4 = S.vis(4, 5);
      if (A4 > 0) {
        ctx.save(); ctx.globalAlpha = A4;
        const h = hp(256), yA = 230, mg = easeIO(S.l(4, 1.2, S.st(4, 1) + 0.5)), yB = lerp(yA + h + 24, yA, mg);
        const sc = S.l(4, 2.5, 0.4);
        band(yA, 256, COL.M, 1); band(yB, 256, COL.A, 1 - 0.5 * mg, 0, mg < 0.5);
        if (sc > 0 && sc < 1) { E.glow(ctx, x0 + SW * sc, yA + h / 2, 70, COL.M, 0.8); E.glow(ctx, x0 + SW * (1 - sc), yA + h * 1.5 + 24, 70, COL.A, 0.8); }
        lab(yA + h / 2, 'forward scan', 1 - mg, COL.M);
        lab(yA + h * 1.5 + 24, 'backward scan', (1 - mg) * (1 - 0.5 * mg), COL.A);
        if (mg > 0.5) lab(yA + h / 2, 'y', mg, COL.text);
        txt(ctx, mg < 0.5 ? 'scan output: same shape' : 'y = forward + flip(backward)', x0 + SW / 2, yA + 2 * h + 90, { size: 26, weight: 700, align: 'center', color: COL.dim });
        // the four heads (pink outlines) dissolve back into one 256-wide band
        const jn = 1 - S.ps(4, 2, 0.8, 0.3);
        if (jn > 0) { ctx.save(); ctx.globalAlpha *= jn; for (let k = 0; k < 4; k++) rrect(ctx, x0 - 4, yA + k * h / 4 + 1, SW + 8, h / 4 - 2, 4, null, COL.D, 2.5); ctx.restore(); }
        if (jn < 1) txt(ctx, '4 heads × 64 → 256', x0 + SW / 2, yA - 16, { size: 24, weight: 700, align: 'center', color: COL.E, alpha: 1 - jn });
        ctx.restore();
      }
      // beat 5: the D term, with an input-dependent gain per head
      const A5 = S.vis(5, 6);
      if (A5 > 0) {
        ctx.save(); ctx.globalAlpha = A5;
        const h = hp(256), y0 = 230;
        band(y0, 256, COL.M, 1); lab(y0 + h / 2, 'y', 1, COL.M);
        const d = S.p(5, 0.6, 1);
        ctx.globalAlpha = A5 * d;
        band(y0 + h + 120, 256, COL.E, 0.8); lab(y0 + h * 1.5 + 120, 'x', 1, COL.E);
        box(ctx, x0 + SW / 2 - 200, y0 + h + 30, 400, 70, 'fc_D: Linear 256 → 4  (+ D)', { size: 24, color: COL.K });
        arrow(ctx, x0 + SW / 2, y0 + h + 116, x0 + SW / 2, y0 + h + 104, { color: COL.K });
        arrow(ctx, x0 + SW / 2, y0 + h + 28, x0 + SW / 2, y0 + h + 6, { color: COL.K });
        txt(ctx, 'y  +=  x · gain(x), one gain per head', x0 + SW / 2, y0 + 2 * h + 200, { size: 26, weight: 700, align: 'center', color: COL.K });
        ctx.globalAlpha = A5 * S.ps(5, 1, 0.6);
        mtxt(ctx, '({B:B}, {T:208}, {E:256})', x0 + SW / 2, y0 + 2 * h + 250, { size: 30, mono: true, align: 'center' });
        ctx.restore();
      }
      // beat 6: gate with z, project back to 128, count the parameters
      const A6 = S.p(6, 0.7, 0.35);
      if (A6 > 0) {
        ctx.save(); ctx.globalAlpha = A6;
        const h = hp(256), y0 = 220, pr = easeIO(S.l(6, 1, S.st(6, 1) + 0.4));
        band(y0, 256, COL.M, 1 - 0.7 * pr); lab(y0 + h / 2, 'norm(y)', 1 - pr, COL.M);
        band(y0 + h + 40, 256, COL.E, 1 - 0.7 * pr); lab(y0 + h * 1.5 + 40, 'SiLU(z)', 1 - pr, COL.E);
        txt(ctx, '⊙', x0 + SW / 2, y0 + h + 30, { size: 34, weight: 700, align: 'center', color: COL.K, alpha: 1 - pr });
        if (pr > 0) { band(y0 + 2 * h + 90, 128, COL.C, pr); lab(y0 + 2 * h + 90 + hp(128) / 2, 'out {C:128}', pr); txt(ctx, 'out_proj 256 → 128', x0 + SW / 2, y0 + 2 * h + 76, { size: 22, weight: 700, align: 'center', color: COL.K, alpha: pr }); }
        const pa = S.ps(6, 2, 0.6, 0.5);
        if (pa > 0) {
          ctx.globalAlpha = A6 * pa;
          rrect(ctx, x0 - 10, 830, SW + 20, 120, 12, COL.panel, rgba(COL.K, 0.6), 2);
          txt(ctx, '137,612 parameters', x0 + SW / 2, 878, { size: 30, weight: 800, align: 'center', color: COL.K });
          txt(ctx, 'in_proj 99,328 · out_proj 32,768 · conv 4,096 · the rest 1,420', x0 + SW / 2, 920, { size: 22, mono: true, align: 'center' });
        }
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
    hud: S => ({ stage: 3, shape: S.b === 0 ? (S.past(0, 1, 3) ? 'gate, value ({B:B}, {T:208}, 341)' : S.past(0, 1, 1) ? '({B:B}, {T:208}, 682)' : RES) : RES }),
    draw(ctx, S) {
      const cy = 500;
      const bar = (x, h, lbl, col, a) => { ctx.save(); ctx.globalAlpha = a; rrect(ctx, x, cy - h / 2, 70, h, 8, rgba(col, 0.3), col, 2); txt(ctx, lbl, x + 35, cy + h / 2 + 36, { size: 26, mono: true, weight: 700, align: 'center', color: col }); ctx.restore(); };
      bar(180, 110, '128', COL.C, S.p(0, 0.5, 0.3));
      arrow(ctx, 270, cy, 380, cy, { alpha: S.ps(0, 1, 0.5) });
      txt(ctx, 'Linear', 325, cy - 20, { size: 22, align: 'center', color: COL.K, alpha: S.ps(0, 1, 0.5) });
      bar(400, 580, '682', COL.K, S.ps(0, 1, 0.5, 1));
      const sp = S.ps(0, 1, 0.6, 3.5);
      if (sp > 0) {
        ctx.save(); ctx.globalAlpha = sp;
        arrow(ctx, 490, cy - 140, 600, cy - 150, {}); arrow(ctx, 490, cy + 140, 600, cy + 150, {});
        rrect(ctx, 620, cy - 300, 70, 290, 8, rgba(COL.H, 0.3), COL.H, 2); txt(ctx, 'gate 341', 655, cy - 320, { size: 24, mono: true, align: 'center', color: COL.H });
        rrect(ctx, 620, cy + 10, 70, 290, 8, rgba(COL.C, 0.3), COL.C, 2); txt(ctx, 'value 341', 655, cy + 340, { size: 24, mono: true, align: 'center', color: COL.C });
        ctx.restore();
      }
      const b = S.p(1, 0.6, 0.3);
      if (b > 0) {
        ctx.save(); ctx.globalAlpha = b;
        // gate → SiLU → ⊙ ← value
        const r1 = S.p(1, 0.5, 0.4), r2 = S.p(1, 0.5, 1.2), r3 = S.p(1, 0.5, 2.0);
        ctx.globalAlpha = b * r1;
        arrow(ctx, 700, cy - 150, 770, cy - 150, {});
        box(ctx, 780, cy - 182, 110, 64, 'SiLU', { size: 26, color: COL.H });
        arrow(ctx, 836, cy - 116, 900, cy - 30, {});
        arrow(ctx, 700, cy + 150, 900, cy + 30, {});
        ctx.strokeStyle = COL.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(920, cy, 28, 0, 7); ctx.stroke();
        txt(ctx, '⊙', 920, cy + 2, { size: 34, weight: 700, align: 'center', base: 'middle' });
        txt(ctx, 'element by element', 920, cy + 70, { size: 20, color: COL.dim, align: 'center' });
        ctx.globalAlpha = b * r2;
        arrow(ctx, 950, cy, 1010, cy, {});
        rrect(ctx, 1020, cy - 145, 70, 290, 8, rgba(COL.M, 0.3), COL.M, 2); txt(ctx, '341', 1055, cy + 180, { size: 26, mono: true, weight: 700, align: 'center', color: COL.M });
        ctx.globalAlpha = b * r3;
        arrow(ctx, 1110, cy, 1220, cy, {}); txt(ctx, 'Linear', 1165, cy - 20, { size: 22, align: 'center', color: COL.K });
        bar(1240, 110, '128', COL.C, 1);
        ctx.globalAlpha = b;
        txt(ctx, 'hidden = ⌊8 · 128 / 3⌋ = 341', 1360, 330, { size: 28, mono: true, alpha: S.ps(1, 1, 0.6) });
        txt(ctx, '128·682 + 341·128 + 128 (RMSNorm)', 1360, 390, { size: 24, mono: true, color: COL.text, alpha: S.ps(1, 2, 0.6) });
        txt(ctx, '= 131,072 parameters per SwiGLU block', 1360, 430, { size: 24, mono: true, weight: 700, color: COL.K, alpha: S.ps(1, 2, 0.6, 1) });
        mtxt(ctx, RES + ' → ' + RES, W / 2, 900, { size: 28, mono: true, align: 'center', alpha: S.ps(1, 0, 0.6, 3) });
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
      "Then it's standard multi-head attention: four heads of thirty-two. The scores are B by four by two hundred and eight by two hundred and eight. The attention itself is not causal: every frame can attend to every other frame. Each head's weights, times its values, give two hundred and eight by thirty-two, and the four heads are concatenated back to one hundred and twenty-eight. An output projection then maps one hundred and twenty-eight to one hundred and twenty-eight.",
      "Why keep attention at all? The paper argues that pure state space models struggle to retrieve global artifacts: finding a specific pattern anywhere in the clip. Attention is good at exactly that, while the Hydra blocks cover long-range, ordered structure cheaply. Here, attention costs only about sixty-eight thousand parameters per layer.",
    ],
    hud: S => ({ stage: 4, shape: S.b === 0 ? (S.past(0, 1, 1.5) ? '({B:B}, {T:208}, 384)' : RES) : S.b === 1 ? '({B:B}, {T:208}, 384)' : S.b === 2 ? (S.past(2, 4) ? RES : S.past(2, 3) ? '({B:B}, {T:208}, {C:128})' : S.past(2, 1) ? '({B:B}, {H:4}, {T:208}, {T:208})' : S.past(2, 0, 1) ? 'q, k, v: ({B:B}, {H:4}, {T:208}, 32)' : '({B:B}, {T:208}, 384)') : RES, label: S.b === 2 && S.past(2, 1) && !S.past(2, 3) ? 'scores' : 'tensor shape' }),
    draw(ctx, S) {
      // time runs across, as in the scans: one 384-wide block, convolved along time, then cut into q | k | v and into 4 heads each
      const x0 = 210, NT = 26, cw = 22, SW = NT * cw, hp = n => n * 0.62;
      const blk = (y, n, col, a, seed, rows) => { cells(ctx, x0, y, rows, NT, cw, hp(n) / rows, (r, c) => rgba(col, 0.2 + 0.5 * Math.abs(noise(r + seed, c, 551))), 1.5); rrect(ctx, x0 - 2, y - 2, SW + 4, hp(n) + 4, 4, null, rgba(col, 0.9 * a), 2); };
      const A = S.vis(0, 3);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const yi = 230;
        blk(yi, 128, COL.C, 1, 0, 4);
        mtxt(ctx, 'x {C:128}', x0 - 14, yi + hp(128) / 2, { size: 22, weight: 700, align: 'right', base: 'middle' });
        dimTop(ctx, x0, yi - 6, SW, '{T:208} frames (26 shown)', COL.T, 22);
        const ip = S.ps(0, 1, 0.6, 0.3), sp = S.b >= 2 ? easeIO(S.l(2, 1, 0.6)) : 0, y1 = 380;
        ctx.globalAlpha = A * ip;
        arrow(ctx, x0 + SW / 2, yi + hp(128) + 8, x0 + SW / 2, y1 - 8, {});
        txt(ctx, 'in_proj 128 → 384', x0 + SW / 2 + 20, yi + hp(128) + 40, { size: 22, weight: 700, color: COL.K });
        // the 384 block; after "four heads of thirty-two" it separates into q, k, v, each with 4 heads
        [['q', COL.A], ['k', COL.K], ['v', COL.D]].forEach(([l, col], i) => {
          const y = y1 + i * (hp(128) + 18 * sp);
          blk(y, 128, sp > 0.05 ? col : '#8fa3c0', 1, i * 5, 4);
          if (sp > 0.05) {
            mtxt(ctx, `${l} 128`, x0 - 14, y + hp(128) / 2, { size: 22, weight: 700, align: 'right', base: 'middle', color: col, alpha: sp });
            ctx.save(); ctx.globalAlpha *= sp;
            for (let h = 0; h < 4; h++) rrect(ctx, x0 - 3, y + h * hp(32) + 1, SW + 6, hp(32) - 2, 3, null, COL.H, 1.6);
            ctx.restore();
          }
        });
        if (sp < 0.5) mtxt(ctx, '384', x0 - 14, y1 + hp(384) / 2, { size: 24, weight: 700, align: 'right', base: 'middle', alpha: 1 - sp * 2 });
        if (sp > 0.5) txt(ctx, 'q, k, v: 4 heads × 32 in each', x0 + SW / 2, y1 + 3 * hp(128) + 80, { size: 22, weight: 700, align: 'center', color: COL.H, alpha: (sp - 0.5) * 2 });
        // beat 1: the causal conv window (4 frames: t−3 … t) slides along time over all 384 channels
        const cv = S.b === 1 ? S.p(1, 0.6, 0.5) : 0;
        if (cv > 0) {
          ctx.globalAlpha = A * cv;
          const k = Math.min(NT - 4, Math.floor(S.l(1, 5, 1) * (NT - 3)));
          rrect(ctx, x0 + k * cw - 3, y1 - 6, 4 * cw + 6, hp(384) + 12, 6, rgba(COL.K, 0.12), COL.K, 3);
          txt(ctx, 'causal depthwise conv, 4 frames: t−3 … t', x0 + SW / 2, y1 + hp(384) + 44, { size: 24, align: 'center', color: COL.K, weight: 700 });
          txt(ctx, '(padding 3, last 3 outputs trimmed)', x0 + SW / 2, y1 + hp(384) + 80, { size: 22, align: 'center', color: COL.dim });
          ctx.globalAlpha = A;
        }
        // beat 2: scores per head, weights · v, concat, out_proj
        const h = S.ps(2, 1, 0.6);
        if (h > 0) {
          ctx.globalAlpha = A * h;
          arrow(ctx, x0 + SW + 20, 500, 900, 500, {});
          for (let k2 = 3; k2 >= 0; k2--) rrect(ctx, 930 + k2 * 16, 300 - k2 * 16, 330, 330, 6, COL.bg2, rgba(COL.H, 0.5), 2);
          cells(ctx, 930, 300, 30, 30, 11, 11, (i, j) => scol(0.1 + 0.8 * Math.exp(-((i - j) ** 2) / 40) + 0.3 * (j % 9 === 4 ? 0.6 : 0)), 0.5);
          dimLeft(ctx, 924, 300, 330, '{T:208}', COL.T, 22); dimBottom(ctx, 930, 636, 330, '{T:208}', COL.T, 22);
          txt(ctx, '× 4 heads', 1100, 240, { size: 22, weight: 700, color: COL.H, align: 'center' });
          mtxt(ctx, 'scores ({B:B}, {H:4}, {T:208}, {T:208})', 1600, 290, { size: 24, mono: true, align: 'center' });
          ctx.globalAlpha = A * S.ps(2, 2, 0.6);
          txt(ctx, 'not causal: every frame sees every frame', 1600, 330, { size: 22, align: 'center', color: COL.dim });
          const wv = S.ps(2, 3, 0.6, 0.3);
          if (wv > 0) {
            ctx.globalAlpha = A * wv;
            txt(ctx, 'weights · v  →  208 × 32 per head', 1600, 390, { size: 22, mono: true, align: 'center', color: COL.H });
            const cat = easeIO(S.l(2, 1, S.st(2, 3) + 2.5));
            for (let k3 = 0; k3 < 4; k3++) {
              const y = lerp(430 + k3 * 60, 430 + k3 * 22, cat);
              cells(ctx, 1400, y, 1, 13, 30, 20, (r, c) => rgba(COL.H, 0.25 + 0.5 * Math.abs(noise(k3, c, 556))), 1.5);
            }
            txt(ctx, cat > 0.5 ? 'concat → 128' : '4 heads × 32', 1600, 690, { size: 22, weight: 700, align: 'center', color: COL.C });
          }
          const op = S.ps(2, 4, 0.6);
          if (op > 0) { ctx.globalAlpha = A * op; arrow(ctx, 1600, 706, 1600, 742, {}); box(ctx, 1480, 748, 240, 64, 'out_proj 128 → 128', { size: 24, color: COL.K }); }
        }
        ctx.restore();
      }
      // beat 3: the scan forgets a distant artifact; attention jumps straight to it
      const W4 = S.p(3, 0.7, 0.3);
      if (W4 > 0) {
        ctx.save(); ctx.globalAlpha = W4;
        rrect(ctx, 250, 230, 640, 470, 16, COL.panel, rgba(COL.M, 0.6), 2);
        rrect(ctx, 1030, 230, 640, 470, 16, COL.panel, rgba(COL.H, 0.6), 2);
        txt(ctx, 'Hydra (scans both ways)', 570, 290, { size: 32, weight: 800, align: 'center', color: COL.M });
        txt(ctx, 'Attention', 1350, 290, { size: 32, weight: 800, align: 'center', color: COL.H });
        const strip = (x, r) => { for (let i = 0; i < 16; i++) rrect(ctx, x + i * 30, 560, 24, 40, 4, i === r ? rgba(COL.R, 0.6) : rgba(COL.T, 0.3), i === r ? COL.R : COL.T, i === r ? 2 : 1); };
        const h1 = S.ps(3, 1, 0.6);
        ctx.globalAlpha = W4 * h1;
        strip(330, 5);
        // the artifact's share of the state, fading as the scan moves on
        const u = clamp((S.T(3) - S.st(3, 1) - 0.8) / 4);
        // the red frame's trace in the state, for the frames around it, in both directions: it fades with distance
        for (let i = 0; i < 16; i++) { const d = Math.abs(i - 5), a = clamp(u * 8 - d); if (a > 0) rrect(ctx, 336 + i * 30, 545 - 60 * Math.exp(-d / 2.5), 12, 60 * Math.exp(-d / 2.5), 2, rgba(COL.R, 0.8 * a), null); }
        txt(ctx, 'an artifact (red) leaves a trace that fades', 570, 390, { size: 24, align: 'center', color: COL.R });
        txt(ctx, 'with distance, both ways: hard to fetch far away', 570, 430, { size: 24, align: 'center', color: COL.text });
        const a2 = S.ps(3, 2, 0.6);
        ctx.globalAlpha = W4 * a2;
        strip(1110, 2);
        ctx.strokeStyle = COL.H; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1122 + 15 * 30, 556); ctx.quadraticCurveTo(1330, 440, 1122 + 2 * 30, 556); ctx.stroke();
        txt(ctx, 'global retrieval: jumps straight to it', 1350, 390, { size: 24, align: 'center', color: COL.H });
        txt(ctx, '208 × 208 scores, 4 heads of 32', 1350, 430, { size: 24, align: 'center' });
        txt(ctx, 'ordered, long-range structure, linear in T', 570, 660, { size: 22, align: 'center', color: COL.dim });
        ctx.globalAlpha = W4 * S.ps(3, 3, 0.6);
        txt(ctx, 'MHA block: 68,096 params  ·  Hydra block: 137,612  ·  SwiGLU block: 131,072', W / 2, 790, { size: 28, mono: true, align: 'center' });
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
    hud: { stage: 5, stageName: '30 blocks', shape: RES },
    draw(ctx, S) {
      // the first layer builds as it is described; the other four follow on "five layers"
      for (let L = 0; L < 5; L++) for (let k = 0; k < 6; k++) {
        const a = L === 0 ? S.p(0, 0.3, 0.3 + k * 0.25) : S.ps(0, 1, 0.3, (L - 1) * 0.35 + k * 0.05), x = 240 + L * 300, y = 220 + k * 90;
        box(ctx, x, y, 250, 72, BLK[k][0], { size: 26, color: BLK[k][1], alpha: a });
      }
      for (let L = 0; L < 5; L++) txt(ctx, 'layer ' + (L + 1), 365 + L * 300, 200, { size: 22, weight: 700, align: 'center', color: COL.dim, alpha: L === 0 ? S.p(0, 0.4, 0.3) : S.ps(0, 1, 0.4, (L - 1) * 0.35) });
      txt(ctx, '743,076 per layer', 365, 800, { size: 30, mono: true, weight: 700, align: 'center', color: COL.K, alpha: S.ps(0, 0, 0.6, 4) });
      txt(ctx, '× 5  =  3,715,380', 1000, 800, { size: 30, mono: true, weight: 700, align: 'center', color: COL.K, alpha: S.ps(0, 1, 0.6, 1) });
      txt(ctx, '+ input proj, norms, pooling, head = 3.93 M back-end', 1460, 800, { size: 22, color: COL.dim, alpha: S.ps(0, 1, 0.6, 2.5) });
      mtxt(ctx, 'every block: ' + RES + ' → ' + RES, W / 2, 860, { size: 26, mono: true, align: 'center', alpha: S.ps(1, 0, 0.6, 1) });
      mtxt(ctx, 'after block 30:  RMSNorm(h + residual)  →  ' + RES, W / 2, 920, { size: 26, mono: true, align: 'center', color: COL.A, alpha: S.ps(1, 1, 0.6, 1) });
    },
  });

  // ------------------------------------------------------------------ 11 pooling + head
  const PW = Array.from({ length: 26 }, (_, i) => Math.exp(1.8 * noise(i, 1, 561) + (i === 9 || i === 17 ? 1.6 : 0)));
  const PWs = PW.reduce((a, b) => a + b, 0), PWm = Math.max(...PW);
  S_.push({
    id: 'm_pool', chapter: 11, title: 'Gated attention pooling',
    code: 'GatedAttentionPool(128) → nn.Linear(128, 2)',
    beats: [
      "Now we need one vector per clip. Instead of a plain average, MamBo learns which frames matter. A SwiGLU-style projection maps each frame from one hundred and twenty-eight to three hundred and forty-one, and a linear layer turns that into a single score per frame: B by two hundred and eight.",
      "A softmax over time turns the scores into weights that sum to one: B by one by two hundred and eight. [+1.2] A batched matrix multiply with the frames, B by two hundred and eight by one hundred and twenty-eight, gives their weighted average: B by one hundred and twenty-eight.",
      "After dropout, a linear layer maps one hundred and twenty-eight to two logits: B by two. A softmax turns them into probabilities; class zero is spoof, and class one is bona fide.",
    ],
    hud: S => ({ stage: S.b < 2 ? 6 : 7, shape: S.b === 0 ? (S.past(0, 2, 4) ? '({B:B}, {T:208})' : RES) : S.b === 1 ? (S.past(1, 1, 1.5) ? '({B:B}, {C:128})' : '({B:B}, 1, {T:208})') : '({B:B}, {K:2})', label: S.b === 0 ? (S.past(0, 2, 4) ? 'scores' : 'frames') : S.b === 1 ? (S.past(1, 1, 1.5) ? 'pooled' : 'weights') : 'logits' }),
    draw(ctx, S) {
      const n = 26, x0 = 200, cw = 58, fy = 480, merge = S.b >= 1 ? easeIO(S.l(1, 1.6, S.st(1, 1) + 1.0)) : 0;
      const fa = S.p(0, 0.6, 1.2) * (1 - S.p(2, 0.5));
      // per-frame scoring path, drawn once
      const pa = S.ps(0, 2, 0.6) * (1 - S.p(1, 0.5));
      if (pa > 0) {
        ctx.save(); ctx.globalAlpha = pa;
        const steps = [['one frame', '128', COL.C], ['gate · value', '341 + 341', COL.H], ['SiLU(g) ⊙ v', '341', COL.M], ['to_score', '341 → 1', COL.K]];
        steps.forEach(([t, s, c], i) => {
          const x = 220 + i * 360, a = S.ps(0, 2, 0.5, 0.5 + i * 1.1);
          ctx.globalAlpha = pa * a;
          box(ctx, x, 200, 290, 76, [t, s], { size: 31, color: c });
          if (i) arrow(ctx, x - 66, 238, x - 6, 238, {});
        });
        ctx.restore();
      }
      if (S.b === 0 && pa > 0) rrect(ctx, x0 + 4 * cw - 4, fy - 4, 52, 184, 6, null, rgba(COL.C, pa), 3);
      for (let i = 0; i < n; i++) {
        const w = PW[i] / PWm, x = lerp(x0 + i * cw, W / 2 - 22, merge);
        const bright = S.b >= 1 ? lerp(1, 0.25 + 0.75 * w, clamp(S.l(1, 0.8, S.st(1, 1) + 0.2))) : 1;
        ctx.save(); ctx.globalAlpha = fa * lerp(1, i === 9 ? 1 : 0.15, merge);
        cells(ctx, x, fy, 8, 1, 44, 22, (r) => vcol(noise(i, r, 562) * 0.9, 0.9 * bright), 2);
        ctx.restore();
        const a = S.ps(0, 2, 0.3, 4.6 + i * 0.08) * (1 - merge) * fa;
        if (a > 0) rrect(ctx, x + 6, fy - 30 - 130 * w, 32, 130 * w, 4, rgba(S.b >= 1 ? COL.K : COL.H, 0.8 * a), null);
      }
      if (merge > 0.6) {
        ctx.save(); ctx.globalAlpha = fa * clamp((merge - 0.6) / 0.4);
        cells(ctx, W / 2 - 22, fy, 8, 1, 44, 22, (r) => vcol(PW.reduce((s, w, i) => s + w * noise(i, r, 562), 0) / PWs * 2.2, 0.95), 2);
        rrect(ctx, W / 2 - 28, fy - 6, 56, 188, 6, null, COL.K, 3);
        mtxt(ctx, 'weighted average: ({B:B}, {C:128})', W / 2, fy + 230, { size: 28, mono: true, align: 'center' });
        ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = fa * (1 - merge);
      dimBottom(ctx, x0, fy + 186, n * cw - 14, 'frames ({T:208}, 26 shown) × {C:128}', COL.T, 24);
      ctx.restore();
      txt(ctx, 'softmax over time → weights sum to 1', W / 2, 250, { size: 28, weight: 700, align: 'center', color: COL.K, alpha: S.ps(1, 0, 0.6) * (1 - S.p(2, 0.5)) });
      const fm = S.ps(1, 1, 0.6) * (1 - S.p(2, 0.5));
      if (fm > 0) mtxt(ctx, 'weights ({B:B}, 1, {T:208})  @  frames ({B:B}, {T:208}, {C:128})  =  ({B:B}, 1, {C:128}) → squeeze', W / 2, 820, { size: 24, mono: true, align: 'center', alpha: fm });
      const c = S.p(2, 0.6, 0.4);
      if (c > 0) {
        ctx.save(); ctx.globalAlpha = c;
        rrect(ctx, 360, 280, 1200, 400, 16, 'rgba(10,14,22,0.96)', COL.line, 2);
        mtxt(ctx, '{C:128} → dropout(0.1) → Linear 128 → 2', 400, 350, { size: 30, mono: true });
        txt(ctx, 'logits', 410, 450, { size: 26, weight: 700, color: COL.dim });
        numRow(ctx, 520, 418, [-1.1, 1.1], 120, 56, { size: 26, d: 1 });
        const sm = S.ps(2, 1, 0.6);
        ctx.globalAlpha = c * sm;
        arrow(ctx, 790, 446, 880, 446, {}); txt(ctx, 'softmax', 835, 424, { size: 22, align: 'center', color: COL.dim });
        [['spoof (0)', 0.1, COL.R], ['bona fide (1)', 0.9, COL.B]].forEach((p, i) => {
          const y = 410 + i * 110;
          txt(ctx, `${p[0]}  ${p[1].toFixed(2)}`, 900, y - 10, { size: 24, weight: 700, color: p[2] });
          rrect(ctx, 900, y, 560 * p[1] * sm, 44, 6, rgba(p[2], 0.8), null);
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
      "The optimizer is Adam W, with a learning rate of one times ten to the minus five. [+0.5] The schedule warms up over the first ten percent of training, then decays along a cosine down to a tenth of the peak. Batches of thirty-two clips, up to twenty epochs with early stopping, and RawBoost augmentation, which adds random filtering and noise to the raw waveform. The training set is ASVspoof 2019 L A.",
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
        curve(ctx, p => -Math.pow(1 - p, 2) * Math.log(p), ox, oy, sx, sy, 0.02, 1, COL.K, 5, S.l(0, 2, S.st(0, 1) + 1.5));
        txt(ctx, 'loss', ox - 30, oy - 4.2 * sy + 20, { size: 22, color: COL.dim, align: 'right' });
        txt(ctx, 'p (probability of the true class)', ox + sx, oy + 40, { size: 22, color: COL.dim, align: 'right' });
        txt(ctx, 'cross-entropy (γ = 0)', 600, 420, { size: 24, color: COL.dim, weight: 700 });
        txt(ctx, 'focal, γ = 2', 520, 700, { size: 24, color: COL.K, weight: 700, alpha: S.ps(0, 1, 0.6, 2.5) });
        wrap(ctx, 'At p = 0.9 (easy): CE = 0.105, focal = 0.001. Easy clips stop dominating the gradient.', 1150, 420, 640, 42, { size: 28, alpha: S.ps(0, 2, 0.6, 3) });
        txt(ctx, 'α = [0.1 spoof, 0.9 bona fide]', 1150, 620, { size: 28, mono: true, alpha: S.ps(0, 3, 0.6) });
        ctx.restore();
      }
      const B = S.p(1, 0.7, 0.35);
      if (B > 0) {
        ctx.save(); ctx.globalAlpha = B;
        // the learning-rate schedule, drawn while it is described
        const lr = S.ps(1, 1, 0.6), pr = clamp((S.T(1) - S.st(1, 1) - 0.4) / 5);
        if (lr > 0) {
          ctx.save(); ctx.globalAlpha = B * lr;
          const gx = 300, gy = 470, gw = 1300, gh = 220;
          line(ctx, gx, gy, gx + gw, gy, COL.faint, 2); line(ctx, gx, gy, gx, gy - gh - 10, COL.faint, 2);
          const f = u => u < 0.1 ? u / 0.1 : 0.1 + 0.9 * 0.5 * (1 + Math.cos(Math.PI * (u - 0.1) / 0.9));
          ctx.strokeStyle = COL.A; ctx.lineWidth = 5; ctx.beginPath();
          for (let i = 0; i <= 200 * pr; i++) { const u = i / 200, X = gx + u * gw, Y = gy - f(u) * gh; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
          ctx.stroke();
          txt(ctx, '1e-5', gx - 12, gy - gh + 8, { size: 22, mono: true, align: 'right', color: COL.A });
          txt(ctx, '1e-6', gx + gw + 12, gy - 0.1 * gh + 8, { size: 22, mono: true, color: COL.A, alpha: clamp(pr * 3 - 2) });
          txt(ctx, 'warm-up 10 %', gx + 0.05 * gw, gy + 34, { size: 22, align: 'center', color: COL.dim });
          txt(ctx, 'cosine decay to a tenth of the peak', gx + 0.55 * gw, gy + 34, { size: 22, align: 'center', color: COL.dim, alpha: clamp(pr * 2) });
          txt(ctx, 'learning rate over training', gx, gy - gh - 30, { size: 24, weight: 700 });
          ctx.restore();
        }
        const rows = [['optimizer', 'AdamW · lr 1e-5 · betas (0.9, 0.95) · weight decay 0.05', 0, 0.3],
          ['batch · epochs', '32 clips · up to 20 epochs, early stopping', 2, 0.3], ['augmentation', 'RawBoost: random filtering + noise on the raw waveform', 2, 3.6], ['train data', 'ASVspoof 2019 LA', 3, 0.3]];
        rows.forEach(([k, v, sn, dl], i) => {
          const a = S.ps(1, sn, 0.4, dl), y = 590 + i * 82;
          ctx.globalAlpha = B * a;
          txt(ctx, k, 240, y, { size: 30, weight: 700, color: COL.A });
          txt(ctx, v, 640, y, { size: 30 });
        });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 13 code
  // [markup line, beat, sentence, offset]
  const CODE = [
    ['$ python verify/mambo_shapes.py          # CPU replica of the official code, random weights', 0, 0, 0.3],
    ['XLS-R output                       ({B:2}, {T:208}, {C:1024})', 0, 0, 2.5],
    ['input_proj  Linear 1024 → 128      ({B:2}, {T:208}, {C:128})', 0, 1, 0.5],
    ['hydra: in_proj                     ({B:2}, {T:208}, 776)', 1, 0, 0.6],
    ['hydra: conv1d (depthwise k=7)      ({B:2}, {T:208}, 512)', 1, 0, 2.2],
    ['hydra: x as heads                  ({B:4}, {T:208}, {H:4}, {D:64})', 1, 0, 4.2],
    ['hydra: B, C matrices               ({B:4}, {T:208}, {S:64})', 1, 0, 6.2],
    ['swiglu: gate, value                ({B:2}, {T:208}, 341)', 2, 0, 0.3],
    ['mha: in_proj ({B:2}, {T:208}, 384)  ·  scores ({B:2}, {H:4}, {T:208}, {T:208})', 2, 0, 1.4],
    ['pool weights ({B:2}, 1, {T:208})  →  pooled ({B:2}, {C:128})  →  logits ({B:2}, {K:2})', 2, 0, 2.8],
    ['back-end 3,934,603  +  XLS-R 315,438,720  =  {K:319,373,323}   (paper: 319.37 M)', 2, 1, 0.3],
  ];
  S_.push({
    id: 'm_code', chapter: 13, title: 'Checking it in code',
    beats: [
      "Here's the trace from our plain PyTorch replica of the official code, with random weights. The input projection gives B by two hundred and eight by one hundred and twenty-eight.",
      "Inside a Hydra block: seven hundred and seventy-six after the input projection, five hundred and twelve after the convolution, the batch doubled to four for the two scan directions, and four heads of sixty-four.",
      "The feed-forward, the attention scores, the pooling weights, and the two logits. And the parameter count lands exactly on the paper's three hundred and nineteen point three seven million. The script is in the repository's verify folder.",
    ],
    hud: S => ({ stage: S.b === 0 ? 1 : S.b === 1 ? 2 : 7, shape: S.b === 0 ? '({B:2}, {T:208}, {C:128})' : S.b === 1 ? '({B:4}, {T:208}, {H:4}, {D:64})' : '({B:2}, {K:2})', label: 'trace, batch of 2' }),
    draw(ctx, S) {
      ctx.save(); ctx.globalAlpha *= S.p(0, 0.6, 0.8);
      rrect(ctx, 100, 170, 1720, 780, 18, '#0d1320', COL.line, 2);
      ctx.restore();
      CODE.forEach(([s, b, sn, dl], i) => {
        const a = S.ps(b, sn, 0.4, dl);
        if (a <= 0) return;
        mtxt(ctx, s, 140, 240 + i * 64, { size: 24, mono: true, alpha: a, color: i === 0 ? '#8d9bb0' : COL.text });
        if (a < 1) E.glow(ctx, 136, 232 + i * 64, 18, COL.A, 0.8 * (1 - a));
      });
    },
  });

  // ------------------------------------------------------------------ 14 recap
  const RECAP = [
    ['XLS-R 300M', '66,800 samples → 208 frames', '({B:B}, {T:208}, {C:1024})', 1, 0, 0.2],
    ['input proj', 'Linear 1024→128 · RMSNorm · SiLU', RES, 1, 1, 0.2],
    ['Hydra ×3', 'bidirectional SSD, 4 heads × 64, state 64', RES, 1, 2, 1.5],
    ['SwiGLU', '128 → 682 → 341 → 128', RES, 1, 2, 3.5],
    ['MHA', '4 heads × 32, conv k=4, scores 208×208', RES, 1, 2, 4.5],
    ['SwiGLU', 'second feed-forward', RES, 1, 2, 5.5],
    ['× 5 layers', '30 blocks + final RMSNorm', RES, 2, 0, 0.2],
    ['gated attn pool', 'softmax over 208 frames', '({B:B}, {C:128})', 2, 0, 3],
    ['classifier', 'Linear 128 → 2', '({B:B}, {K:2})', 2, 0, 5.5],
  ];
  S_.push({
    id: 'm_recap', chapter: 14, title: 'Recap and comparison',
    beats: [
      "Let's recap.",
      "X L S R gives B by two hundred and eight by one thousand and twenty-four. The input projection brings it to one hundred and twenty-eight. Then each MamBo layer runs three bidirectional Hydra blocks, a SwiGLU, attention, and another SwiGLU, all keeping B by two hundred and eight by one hundred and twenty-eight.",
      "Five layers, thirty blocks, a final RMSNorm, gated attention pooling to one hundred and twenty-eight numbers, and a linear layer to two scores.",
      "Across the three videos, the pattern is the same. The front-end turns sixteen thousand samples per second into fifty frames per second, and a back-end reads those frames. AASIST reads them as an image and a graph, with under half a million parameters. MamBo reads them as a sequence, with bidirectional state space models and a little attention, in about four million. MamBo keeps all two hundred and eight frames until the final pooling, while AASIST already folds time away when it builds its spectral nodes. Thanks for watching.",
    ],
    hud: null,
    draw(ctx, S) {
      const A = S.p(0) * (1 - S.ps(3, 1, 0.5));   // the table stays until the comparison cards take over
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        const y0 = 180, lh = 76, hd = S.p(0, 0.5, 0.3);
        txt(ctx, 'step', 110, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: hd });
        txt(ctx, 'what happens', 440, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: hd });
        txt(ctx, 'shape', 1810, y0 - 30, { size: 22, weight: 700, color: COL.dim, align: 'right', alpha: hd });
        ctx.globalAlpha = A * hd; line(ctx, 100, y0 - 14, 1820, y0 - 14, COL.line, 2); ctx.globalAlpha = A;
        RECAP.forEach(([a, b, c, beat, sn, dl], i) => {
          const al = S.ps(beat, sn, 0.5, dl);
          if (al <= 0) return;
          const y = y0 + 34 + i * lh;
          txt(ctx, a, 110, y, { size: 27, weight: 700, alpha: al });
          mtxt(ctx, b, 440, y, { size: 25, color: '#b4c0d2', alpha: al });
          mtxt(ctx, c, 1810, y, { size: 26, mono: true, align: 'right', alpha: al, color: COL.dim });
        });
        ctx.restore();
      }
      const C = S.p(3, 0.7, 0.35);
      if (C > 0) {
        ctx.save(); ctx.globalAlpha = C;
        const cols = [['XLS-R 300M', 'front-end', '24-layer transformer: 16,000 samples/s → 50 frames/s', '315.4 M', 'frames ({B:B}, {T:T}, {C:1024})', COL.A, 1],
          ['AASIST (SSL)', 'back-end', 'an image, then two node sets and graph attention', '447 K', '({B:B}, {T:201}, {C:1024}) → ({B:B}, {K:2})', COL.H, 2],
          ['MamBo-3-Hydra-N3', 'back-end', 'a sequence: bidirectional Hydra SSMs + a little attention', '3.93 M', '({B:B}, {T:208}, {C:1024}) → ({B:B}, {K:2})', COL.M, 3]];
        cols.forEach(([t, k, d, p, sh, col, sn], i) => {
          const a = S.ps(3, sn, 0.5, 0.6), x = 150 + i * 560;
          const on = S.past(3, sn) && !S.past(3, sn + 1);
          ctx.globalAlpha = C * a;
          rrect(ctx, x, 210, 520, 520, 16, on ? rgba(col, 0.08) : COL.panel, rgba(col, on ? 1 : 0.6), on ? 3 : 2);
          txt(ctx, t, x + 260, 280, { size: 30, weight: 800, align: 'center', color: col });
          txt(ctx, k, x + 260, 322, { size: 22, align: 'center', color: COL.dim });
          wrap(ctx, d, x + 40, 400, 440, 38, { size: 26 });
          txt(ctx, p, x + 260, 560, { size: 48, weight: 800, align: 'center', mono: true });
          txt(ctx, 'parameters', x + 260, 600, { size: 22, align: 'center', color: COL.dim });
          mtxt(ctx, sh, x + 260, 680, { size: 20, mono: true, align: 'center' });
        });
        ctx.globalAlpha = C * S.ps(3, 1, 0.6, 1);
        txt(ctx, '201 frames = the 64,600-sample crop of episodes 1–2  ·  208 frames = 66,800 samples (this episode)', W / 2, 780, { size: 22, align: 'center', color: COL.dim });
        ctx.globalAlpha = C * S.ps(3, 4, 0.6);
        txt(ctx, 'MamBo keeps every frame until the final pooling · AASIST folds time into its spectral nodes early', W / 2, 860, { size: 28, weight: 700, align: 'center', color: COL.A });
        ctx.restore();
      }
    },
  });
})();
