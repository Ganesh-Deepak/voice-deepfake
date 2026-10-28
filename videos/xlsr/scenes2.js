// XLS-R 300M, scenes 7–12: masking, positional convolution, attention, multi-head attention, one layer, 24 layers.
(function () {
  const { W, COL, THEME, clamp, lerp, easeIO, easeOut, easeOut4, noise, fmt, rgba, vcol, scol, txt, mtxt, rrect, line, arrow,
    chip, box, numMat, brace, cross, glow, penTip } = E;
  const S_ = window.SCENES, X = window.XL;
  const RES = '({B:B}, {T:201}, {C:1024})';

  // ------------------------------------------------------------------ 7 masking
  const STARTS = [4, 12, 33, 55, 61, 82], NCOL = 100;
  const masked = c => STARTS.some(s => c >= s && c < s + 10);
  S_.push({
    id: 'x_mask', chapter: 7, title: 'Masking (pre-training)', code: 'model.masked_spec_embed: (1024,)',
    beats: [
      "During pre-training, some frames are hidden before they reach the transformer. Each frame is picked as the start of a span with a small probability, and a run of ten frames is hidden from every start. Spans may overlap, and in the end roughly half of all frames are covered.",
      "Hidden frames aren't set to zero. They're overwritten by one learned vector of one thousand and twenty-four numbers, the same at every masked position. The transformer then has to work out what belongs in the gaps from the surrounding context. When the model is fine-tuned, a much lighter version of the same masking acts as a regularizer.",
    ],
    hud: { stage: 3, shape: RES },
    draw(ctx, S) {
      const cam = X.world(ctx, S, [[0, -1, { yaw: 0.35, pitch: 0.16, dist: 1500, tx: 0, ty: 30, tz: 0, cx: 960, cy: 500 }], [0, 6, { yaw: 0.12, dist: 1400 }], [1, 0, { yaw: -0.2, pitch: 0.22, dist: 1500 }]], { floorY: -260 });
      const pick = i => clamp((S.T(0) - 3 - i * 0.7) / 0.4), fillAt = (c) => { const i = STARTS.findIndex(s => c >= s && c < s + 10); return i < 0 ? 0 : clamp((S.T(0) - 3.4 - i * 0.7 - (c - STARTS[i]) * 0.05) / 0.25); };
      const mv = S.p(1, 0.6, 0.6);
      S3.block(ctx, cam, { x: 0, y: 0, z: 0, w: 1100, h: 300, d: 60, cells: [10, NCOL, 2], alpha: S.p(0, 0.6, 0), reveal: S.l(0, 1.4, 0.2), color: THEME.a,
        fn: (r, c, f) => {
          const k = f === 0 ? fillAt(c) : (masked(c) && S.T(0) > 9 ? 1 : 0);
          return k > 0.5 ? rgba(COL.M, 0.55 + 0.35 * (noise(r, 0, 7) * 0.5 + 0.5)) : vcol(noise(r + f * 31, c, 131) * 0.95, 0.9);
        },
        tags: { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] } });
      // span-start markers
      STARTS.forEach((st, i) => {
        const k = pick(i);
        if (k <= 0) return;
        const p = cam.p(-550 + (st + 0.5) * 11, -175, 30);
        ctx.save(); ctx.globalAlpha *= k; ctx.fillStyle = COL.K; ctx.beginPath(); ctx.moveTo(p[0], p[1] - 4); ctx.lineTo(p[0] - 10, p[1] + 14); ctx.lineTo(p[0] + 10, p[1] + 14); ctx.fill(); ctx.restore();
        const q = cam.p(-550 + (st + 10) * 11, -175, 30);
        line(ctx, p[0], p[1] + 22, q[0], q[1] + 22, rgba(COL.M, k), 3);
      });
      txt(ctx, 'span starts (p ≈ 6.5 % per frame) · 10 frames each', 960, 830, { size: 26, weight: 700, color: COL.K, align: 'center', alpha: S.p(0, 0.6, 3) * (1 - mv) });
      txt(ctx, '≈ 50 % of frames hidden', 960, 880, { size: 30, weight: 800, color: COL.M, align: 'center', alpha: S.p(0, 0.6, 9) * (1 - mv) });
      // the learned mask vector m
      if (mv > 0) {
        S3.block(ctx, cam, { x: 0, y: 380, z: 0, w: 22, h: 220, d: 22, cells: [10, 1, 1], alpha: mv, color: COL.M, glow: COL.M, fn: r => rgba(COL.M, 0.55 + 0.35 * (noise(r, 0, 7) * 0.5 + 0.5)), tags: { h: ['C', 1024] } });
        S3.caption(ctx, cam, 60, 520, 0, 'one learned vector m', { size: 26, mono: false, weight: 700, color: COL.M, align: 'left', alpha: mv });
        STARTS.filter((_, i) => i % 2 === 0).forEach((st, i) => S3.path3(ctx, cam, [[0, 270, 20], [-550 + (st + 5) * 11, 160, 32]], { color: COL.M, lw: 2, p: S.l(1, 0.8, 1.5 + i * 0.4), alpha: mv * 0.8, dash: [6, 6] }));
        txt(ctx, 'context on both sides fills the gaps', 960, 860, { size: 26, weight: 700, align: 'center', color: COL.text, alpha: S.p(1, 0.6, 6) });
        txt(ctx, 'fine-tuning: lighter masking (Hugging Face default 7.5 %) as a regularizer', 960, 905, { size: 22, color: COL.dim, align: 'center', alpha: S.p(1, 0.6, 9) });
      }
    },
  });

  // ------------------------------------------------------------------ 8 positional convolution
  S_.push({
    id: 'x_posconv', chapter: 8, title: 'Positional convolution', code: 'model.encoder.pos_conv_embed',
    beats: [
      "Attention, as we'll see, treats its input as an unordered set. Shuffle the frames and it wouldn't notice. So before the transformer, X L S R mixes in position with another convolution, this time sliding over time across the one thousand and twenty-four dimensional frames.",
      "Its kernel is one hundred and twenty-eight frames wide: about two and a half seconds. The frames are transposed to channels first, padded with sixty-four frames of zeros on each side, convolved, and the one extra frame at the end is trimmed off. Still two hundred and one.",
      "A full convolution from one thousand and twenty-four to one thousand and twenty-four channels this wide would need one hundred and thirty-four million weights. So the channels are split into sixteen groups of sixty-four, and each group only talks to itself. That brings it down to about eight point four million.",
      "The result goes through a GELU and is added to the input: a residual connection. In X L S R there's no layer norm at this point. Normalization happens inside every transformer block instead, plus once at the very end. And because this positional signal comes from a convolution, it's relative, and it works for clips of any length.",
    ],
    hud: S => ({ stage: 4, shape: S.b === 1 ? '({B:B}, {C:1024}, {T:201})' : RES, label: S.b === 1 ? 'channels first' : null }),
    draw(ctx, S) {
      const g = S.p(2, 0.6, 0) * (1 - S.p(3, 0.6, 0));
      const cam = X.world(ctx, S, [[0, -1, { yaw: 0.4, pitch: 0.2, dist: 1700, tx: 0, ty: 20, tz: 0, cx: 960, cy: 520 }], [1, 0, { yaw: 0.15, pitch: 0.14, dist: 1600 }],
        [2, 0, { yaw: 0.5, dist: 2300, tx: -500 }], [3, 0, { yaw: -0.25, pitch: 0.24, dist: 1900, tx: 0 }]], { floorY: -280 });
      const shuffle = S.b === 0 ? easeIO((S.T(0) - 2.5) / 0.8) * (1 - easeIO((S.T(0) - 5.2) / 0.8)) : 0;
      // the tensor, coloured by channel group (16 bands)
      const grpCol = r => E.mix(THEME.a, THEME.b, (r % 16) / 15);
      const main = 1 - S.p(3, 0.6, 3);
      S3.block(ctx, cam, { x: 0, y: 0, z: 0, w: 900, h: 320, d: 60, cells: [16, 40, 2], alpha: S.p(0, 0.6, 0) * main, color: THEME.a,
        fn: (r, c, f) => { const cc = shuffle > 0 ? (c * 17 + 5) % 40 : c; return f === 0 && S.b >= 2 ? rgba(grpCol(r), 0.35 + 0.5 * (noise(r, cc, 141) * 0.5 + 0.5)) : vcol(noise(r + f * 31, cc, 141) * 0.95, 0.9); },
        tags: S.b === 1 ? { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] } : { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] } });
      if (shuffle > 0.3) S3.caption(ctx, cam, 0, 230, 0, 'shuffled frames: attention would not notice', { size: 26, mono: false, weight: 700, color: COL.R, alpha: shuffle });
      // padding + sliding window
      const pad = S.p(1, 0.6, 2.5) * (1 - S.p(2, 0.5, 0));
      if (pad > 0) {
        [-1, 1].forEach(sd => S3.block(ctx, cam, { x: sd * (450 + 145), y: 0, z: 0, w: 290, h: 320, d: 60, cells: [4, 10, 1], alpha: pad * 0.9, color: COL.faint, fn: () => 'rgba(90,100,125,0.35)', tags: sd < 0 ? { w: ['T', 64] } : null }));
        S3.caption(ctx, cam, -595, 230, 0, '64 zero frames', { size: 22, mono: false, weight: 700, color: COL.dim, alpha: pad });
        S3.caption(ctx, cam, 595, 230, 0, '64 zero frames', { size: 22, mono: false, weight: 700, color: COL.dim, alpha: pad });
      }
      const win = S.p(1, 0.6, 0.8) * (1 - S.p(2, 0.5, 0));
      if (win > 0) {
        const span = 900 * 128 / 201, x = lerp(-740 + span / 2, 740 - span / 2, (Math.sin(S.local * 0.6) + 1) / 2);
        S3.block(ctx, cam, { x, y: 0, z: 0, w: span, h: 344, d: 84, cells: [1, 1, 1], alpha: win * 0.55, color: COL.K, fn: () => rgba(COL.K, 0.12), glow: COL.K });
        S3.caption(ctx, cam, x, 250, 0, 'kernel: 128 frames ≈ 2.56 s', { size: 26, mono: false, weight: 700, color: COL.K, alpha: win });
        mtxt(ctx, '201 + 2·64 − 128 + 1 = {T:202}  →  trim the last frame  →  {T:201}', 960, 860, { size: 30, mono: true, align: 'center', alpha: S.p(1, 0.6, 6.5) });
      }
      // grouped convolution: a block-diagonal weight
      if (g > 0) {
        X.card(ctx, 960, 200, 860, 620, g);
        txt(ctx, 'which input channels feed which outputs', 1000, 255, { size: 26, weight: 700, alpha: g });
        const gx = 1000, gy = 290, cs = 24;
        for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) {
          const on = i === j, k = easeOut4((S.T(2) - 1.4 - Math.min(i, j) * 0.08) / 0.4);
          rrect(ctx, gx + j * cs, gy + i * cs, cs - 3, cs - 3, 4, on ? rgba(E.mix(THEME.a, THEME.b, i / 15), 0.85 * k * g) : `rgba(90,100,125,${0.12 * g})`, null);
        }
        txt(ctx, '16 groups × 64 channels', gx + 192, gy + 420, { size: 22, weight: 700, align: 'center', color: COL.dim, alpha: g });
        mtxt(ctx, 'full: 1024 × 1024 × 128', 1440, 380, { size: 26, mono: true, align: 'left', alpha: S.p(2, 0.6, 2) });
        txt(ctx, '= 134,217,728', 1440, 420, { size: 30, mono: true, weight: 700, color: COL.R, alpha: S.p(2, 0.6, 3) });
        const xk = S.p(2, 0.4, 6.5);
        if (xk > 0) line(ctx, 1440, 412, 1440 + 300 * xk, 412, COL.R, 4);
        mtxt(ctx, 'grouped: 1024 × {A:64} × 128', 1440, 510, { size: 26, mono: true, alpha: S.p(2, 0.6, 7.5) });
        txt(ctx, '≈ 8.39 M', 1440, 556, { size: 40, mono: true, weight: 700, color: THEME.a, alpha: S.p(2, 0.6, 9) });
        txt(ctx, '(8,388,608 + bias + weight-norm gain)', 1440, 595, { size: 18, mono: true, color: COL.dim, alpha: S.p(2, 0.6, 9.5) });
      }
      // residual add
      const ra = S.p(3, 0.7, 0);
      if (ra > 0) {
        const m = easeIO((S.T(3) - 3.2) / 1.0);
        S3.block(ctx, cam, { x: lerp(-340, 0, m), y: 0, z: 0, w: 520, h: 300, d: 60, cells: [10, 20, 2], seed: 151, alpha: ra, color: THEME.a, tags: m < 0.5 ? { w: ['T', 201], h: ['C', 1024] } : null });
        S3.block(ctx, cam, { x: lerp(340, 0, m), y: lerp(0, 0, m), z: lerp(0, 4, m), w: 520, h: 300, d: 60, cells: [10, 20, 2], seed: 152, alpha: ra * (1 - 0.6 * m), color: COL.K, fn: (r, c, f) => rgba(COL.K, 0.25 + 0.4 * (noise(r + f, c, 152) * 0.5 + 0.5)) });
        S3.caption(ctx, cam, -340, 230, 0, 'frames', { size: 24, mono: false, weight: 700, alpha: ra * (1 - m) });
        S3.caption(ctx, cam, 340, 230, 0, 'GELU(pos-conv(frames))', { size: 24, mono: false, weight: 700, color: COL.K, alpha: ra * (1 - m) });
        const pl = cam.p(0, 0, 80);
        if (m > 0.05 && m < 1) txt(ctx, '+', pl[0], pl[1] + 20, { size: 90, weight: 800, align: 'center', color: COL.text, alpha: 1 - m });
        S3.caption(ctx, cam, 0, 230, 0, RES, { size: 30, alpha: m });
        txt(ctx, 'no LayerNorm here: X L S R normalizes inside each block (pre-norm) and once at the end'.replace('X L S R', 'XLS-R'), 960, 880, { size: 24, weight: 600, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 5.5) });
      }
    },
  });

  // ------------------------------------------------------------------ 9 self-attention from scratch (toy numbers)
  const XT = [[1.0, 0.2], [0.4, 0.9], [-0.6, 0.5], [0.8, -0.7]];
  const WQ = [[0.9, 0.1], [-0.3, 0.8]], WK = [[0.7, -0.4], [0.2, 0.9]], WV = [[1.0, 0.5], [-0.5, 0.6]];
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const QT = mm(XT, WQ), KT = mm(XT, WK), VT = mm(XT, WV);
  const SC = QT.map(q => KT.map(k => (q[0] * k[0] + q[1] * k[1]) / Math.SQRT2));
  const AT = SC.map(r => { const e = r.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); });
  const OT = mm(AT, VT);
  S_.push({
    id: 'x_attn', chapter: 9, title: 'Self-attention from scratch', code: 'toy: 4 frames × 2 numbers',
    beats: [
      "Now the heart of the model: self-attention. Let's build it with a toy example: four frames, each described by just two numbers.",
      "Every frame makes three vectors, using three different linear layers. A query: what am I looking for? A key: what do I contain? And a value: what will I pass along if someone attends to me?",
      "The dot product of frame one's query with frame three's key says how well they match: multiply matching entries and add. Do that for every pair, and you get a four by four grid of scores. Row i says how much frame i likes every other frame.",
      "Divide the scores by the square root of the vector size, so they don't grow too large. Here that's the square root of two. X L S R's heads have sixty-four numbers each, so there it's the square root of sixty-four: eight. Then a softmax turns every row into positive weights that add up to one.",
      "Finally, each frame's output is the weighted average of all the value vectors, using its row of weights. That's attention: a data-dependent average, where each frame decides for itself where to look.",
    ],
    hud: S => ({ stage: 5, label: 'toy example', shape: ['({T:4}, {C:2})', '({T:4}, {C:2})  ×3', '({T:4}, {T:4})', '({T:4}, {T:4})', '({T:4}, {C:2})'][S.b] }),
    draw(ctx, S) {
      const cs = 82, ch = 54, y0 = 250;
      const card = (x, y, w, h, title, col, a) => { X.card(ctx, x, y, w, h, a); txt(ctx, title, x + w / 2, y + 40, { size: 26, weight: 800, align: 'center', color: col, alpha: a }); };
      // X
      const ax = S.p(0, 0.6, 1);
      card(ctx, 110, y0, 240, 340, 'X  frames', COL.T, ax);
      numMat(ctx, 148, y0 + 70, XT, cs, ch, { size: 22, d: 1, alpha: ax });
      // Q, K, V
      [['Q  query', QT, COL.A], ['K  key', KT, COL.K], ['V  value', VT, COL.H]].forEach(([t, M, col], i) => {
        const a = S.p(1, 0.6, 1.2 + i * 1.4);
        card(ctx, 400 + i * 270, y0, 240, 340, t, col, a);
        numMat(ctx, 438 + i * 270, y0 + 70, M, cs, ch, { size: 22, d: 2, alpha: a, fill: () => rgba(col, 0.16) });
      });
      // scores 4 x 4 then weights
      const sa = S.p(2, 0.7, 2.6), wa = easeIO((S.T(3) - 5) / 1.0);
      if (sa > 0) {
        card(ctx, 1220, y0, 430, 340, wa > 0.5 ? 'softmax weights' : 'scores Q·Kᵀ', wa > 0.5 ? COL.B : COL.C, sa);
        const M = SC.map((r, i) => r.map((v, j) => lerp(v * Math.SQRT2 / (S.b >= 3 && S.T(3) > 2 ? Math.SQRT2 : 1), AT[i][j], wa)));
        numMat(ctx, 1252, y0 + 70, M, 92, ch, { size: 22, d: 2, alpha: sa, cellAlpha: (r, c) => clamp((S.T(2) - 3 - r * 0.5) / 0.4) + (S.b > 2 ? 1 : 0),
          fill: (r, c, v) => wa > 0.5 ? scol(v * 1.4, 0.75) : vcol(v * 0.5, 0.4), hl: (r, c) => S.b === 2 && r === 0 && c === 2 });
      }
      // the q1 · k3 example
      const ex = S.p(2, 0.6, 0.5) * (1 - S.p(3, 0.4, 0));
      if (ex > 0) mtxt(ctx, `q₁ · k₃ = ${fmt(QT[0][0], 2)}·${fmt(KT[2][0], 2)} + ${fmt(QT[0][1], 2)}·${fmt(KT[2][1], 2)} = {C:${fmt(QT[0][0] * KT[2][0] + QT[0][1] * KT[2][1], 2)}}`, 960, 680, { size: 32, mono: true, align: 'center', alpha: ex });
      const sc = S.p(3, 0.6, 0.5) * (1 - S.p(4, 0.4, 0));
      if (sc > 0) {
        mtxt(ctx, 'scale: ÷ √d   ·   toy d = 2  →  ÷ 1.41   ·   XLS-R head d = {H:64}  →  ÷ {H:8}', 960, 680, { size: 30, mono: true, align: 'center', alpha: sc });
        mtxt(ctx, 'softmax(row) = e^{s} / Σ e^{s}   →   every row sums to 1', 960, 740, { size: 28, mono: true, align: 'center', color: COL.dim, alpha: S.p(3, 0.6, 5) });
      }
      // output and attention arcs over four frame tokens
      const oa = S.p(4, 0.7, 0.5);
      if (oa > 0) {
        const tx = [560, 820, 1080, 1340], ty = 820;
        AT[0].forEach((w, j) => {
          if (j === 0) return;
          const k = clamp((S.T(4) - 1 - j * 0.3) / 0.5) * oa;
          ctx.save(); ctx.globalAlpha *= k; ctx.strokeStyle = COL.B; ctx.lineWidth = 2 + 16 * w;
          ctx.beginPath(); ctx.moveTo(tx[0], ty - 30); ctx.quadraticCurveTo((tx[0] + tx[j]) / 2, ty - 110 - j * 30, tx[j], ty - 30); ctx.stroke(); ctx.restore();
          txt(ctx, fmt(w, 2), (tx[0] + tx[j]) / 2, ty - 80 - j * 30, { size: 22, mono: true, weight: 700, align: 'center', color: COL.B, alpha: k });
        });
        tx.forEach((x, j) => { chip(ctx, x, ty, `frame ${j + 1}`, { size: 24, align: 'center', color: j ? COL.text : COL.B, stroke: j ? COL.line : COL.B, alpha: oa }); });
        mtxt(ctx, `out₁ = Σ w₁ⱼ vⱼ = ( {B:${fmt(OT[0][0], 2)}}, {B:${fmt(OT[0][1], 2)}} )`, 960, 930, { size: 30, mono: true, align: 'center', alpha: S.p(4, 0.6, 3) });
      }
    },
  });

  // ------------------------------------------------------------------ 10 multi-head attention with real shapes
  S_.push({
    id: 'x_mha', chapter: 10, title: 'Sixteen heads, real shapes', code: 'encoder.layers[i].attention',
    beats: [
      "Now with real shapes. Three linear layers, each one thousand and twenty-four to one thousand and twenty-four, turn B by two hundred and one by one thousand and twenty-four into queries, keys and values of that same shape.",
      "X L S R uses sixteen heads. Split the one thousand and twenty-four features into sixteen chunks of sixty-four: B, by two hundred and one, by sixteen, by sixty-four. Then swap the time and head axes: B, by sixteen, by two hundred and one, by sixty-four. Each head is now its own small attention problem.",
      "Queries times keys transposed gives a two hundred and one by two hundred and one score matrix for every head: B, by sixteen, by two hundred and one, by two hundred and one. That's forty thousand four hundred and one scores per head, more than six hundred and forty thousand per layer, for a single clip.",
      "Divide by eight, softmax along the last axis, and multiply by the values: back to B, by sixteen, by two hundred and one, by sixty-four. Swap the axes back, merge sixteen times sixty-four into one thousand and twenty-four, and an output projection mixes the heads together.",
      "Why sixteen heads? Each can learn its own notion of relevance: one tracks neighbouring frames, another links frames that sound alike, another gathers a summary of the whole clip. And the score matrix grows with the square of the number of frames: double the clip, and attention costs four times as much.",
    ],
    hud: S => ({ stage: 5, shape: [RES, S.T(1) > 6 ? '({B:B}, {H:16}, {T:201}, {C:64})' : '({B:B}, {T:201}, {H:16}, {C:64})', '({B:B}, {H:16}, {T:201}, {T:201})', S.T(3) > 5 ? RES : '({B:B}, {H:16}, {T:201}, {C:64})', '({B:B}, {H:16}, {T:201}, {T:201})'][S.b] }),
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1, { yaw: 0.35, pitch: 0.22, dist: 2100, tx: 0, ty: 30, tz: 0, cx: 960, cy: 520 }], [1, 0, { yaw: 0.62, pitch: 0.26, dist: 2000, tx: 150, tz: -250 }],
        [2, 0, { yaw: 0.5, pitch: 0.3, dist: 2100, tx: 250, tz: -300 }], [3, 0, { yaw: 0.3, pitch: 0.2, dist: 2200, tx: 100, tz: -200 }], [4, 0, { yaw: 0.05, pitch: 0.12, dist: 2000, tx: 0, tz: 0 }],
      ], { floorY: -330 });
      const s1 = S.p(1, 0.6, 0), s4 = S.p(4, 0.6, 0);
      // X -> Q, K, V
      const qkv = 1 - S.p(2, 0.6, 0);
      if (qkv > 0 && s4 < 1) {
        S3.block(ctx, cam, { x: -700, y: 0, z: 0, w: 230, h: 300, d: 60, cells: [12, 9, 2], seed: 161, alpha: S.p(0, 0.6, 0) * qkv * (1 - s1), color: THEME.a, tags: { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] } });
        [['Q', COL.A, 260], ['K', COL.K, 0], ['V', COL.H, -260]].forEach(([l, col, z], i) => {
          const a = S.p(0, 0.6, 2 + i * 1.2) * qkv * (i === 0 ? 1 : 1 - s1);
          S3.path3(ctx, cam, [[-580, 0, 0], [-120, 0, z]], { color: col, lw: 2, p: S.l(0, 0.8, 2 + i * 1.2), alpha: a * 0.7 });
          if (i > 0 || s1 < 0.5) S3.block(ctx, cam, { x: 0, y: 0, z, w: 230, h: 300, d: 40, cells: [12, 9, 2], seed: 162 + i, alpha: a, color: col, fn: (r, c, f) => rgba(col, 0.18 + 0.55 * (noise(r + f, c, 162 + i) * 0.5 + 0.5)) });
          S3.caption(ctx, cam, 0, 190, z, l, { size: 34, mono: false, weight: 800, color: col, alpha: a });
        });
        S3.caption(ctx, cam, -360, -230, 0, 'Linear 1024 → 1024  ×3', { size: 24, mono: false, weight: 700, color: COL.dim, alpha: S.p(0, 0.6, 3) * qkv * (1 - s1) });
      }
      // 16 heads: a deck of thin slabs (T x 64)
      const deck = s1 * (1 - S.p(4, 0.6, 0));
      const spread = easeIO((S.T(1) - 1.5) / 1.4) + (S.b > 1 ? 1 : 0);
      const scores = S.p(2, 0.8, 0.6) * (1 - easeIO((S.T(3) - 1.5) / 1.2) * (S.b === 3 ? 1 : 0)) * (S.b <= 3 ? 1 : 0);
      const merge = S.b === 3 ? easeIO((S.T(3) - 5) / 1.2) : 0;
      if (deck > 0) {
        for (let h = 15; h >= 0; h--) {
          const fan = clamp(spread) * (1 - merge), y = (7.5 - h) * 18.75 * (1 - fan), z = -h * 46 * fan;
          const sq = scores > 0.01 && S.b === 2;
          S3.block(ctx, cam, { x: sq ? 60 : 0, y, z, w: sq ? 300 : 230, h: sq ? 300 : lerp(18.75, 70, fan), d: 8, cells: sq ? [10, 10, 1] : [3, 9, 1], seed: 170 + h, alpha: deck * (h === 0 ? 1 : 0.85),
            color: E.mix(THEME.a, THEME.b, h / 15),
            fn: sq ? ((r, c) => scol(Math.exp(-((r - c) ** 2) / (h % 4 === 0 ? 2 : 9)) * 0.9 + 0.1 * (noise(r, c, h) * 0.5 + 0.5), 0.95)) : null,
            tags: h === 0 ? (sq ? { w: ['T', 201], h: ['T', 201] } : { w: ['T', 201], h: ['C', 64] }) : null });
        }
        S3.caption(ctx, cam, 300, 230, -360, '16 heads', { size: 30, mono: false, weight: 800, color: COL.H, alpha: deck * clamp(spread) * (1 - merge) });
        if (S.b === 2) {
          txt(ctx, '201 × 201 = 40,401 scores per head', 1500, 330, { size: 28, weight: 700, align: 'center', color: COL.text, alpha: S.p(2, 0.6, 4) });
          txt(ctx, '× 16 heads = 646,416 per layer, per clip', 1500, 375, { size: 24, weight: 600, align: 'center', color: COL.dim, alpha: S.p(2, 0.6, 6) });
        }
        if (S.b === 3) {
          mtxt(ctx, 'softmax( Q·Kᵀ / {H:8} ) · V  →  ({B:B}, {H:16}, {T:201}, {C:64})', 960, 860, { size: 28, mono: true, align: 'center', alpha: S.p(3, 0.6, 0.5) * (1 - merge) });
          mtxt(ctx, 'merge 16 × 64 → 1024, then Linear 1024 → 1024 (out_proj)', 960, 860, { size: 28, mono: true, align: 'center', alpha: merge });
        }
      }
      // what heads learn + the quadratic cost
      if (s4 > 0) {
        const pats = [['neighbours', (r, c) => Math.exp(-((r - c) ** 2) / 1.5)], ['similar sounds', (r, c) => ((Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0 ? 0.7 : 0.05) * (0.6 + 0.4 * (noise(r, c, 5) * 0.5 + 0.5))], ['clip summary', (r, c) => c === 3 || c === 8 ? 0.9 : 0.08]];
        pats.forEach(([lab, f], i) => {
          const k = S.p(4, 0.6, 1 + i * 1.6);
          S3.block(ctx, cam, { x: -520 + i * 420, y: 60, z: 0, w: 260, h: 260, d: 10, cells: [12, 12, 1], alpha: k * s4, color: E.mix(THEME.a, THEME.b, i / 2), fn: (r, c) => scol(f(r, c), 0.95) });
          S3.caption(ctx, cam, -520 + i * 420, -120, 0, lab, { size: 26, mono: false, weight: 700, alpha: k * s4 });
        });
        const ck = S.p(4, 0.6, 7);
        if (ck > 0) {
          X.card(ctx, 520, 760, 880, 170, ck);
          txt(ctx, 'frames  T', 560, 810, { size: 22, weight: 700, color: COL.T, alpha: ck });
          txt(ctx, 'scores  T²', 560, 880, { size: 22, weight: 700, color: COL.C, alpha: ck });
          rrect(ctx, 700, 795, 130, 22, 6, rgba(COL.T, 0.8 * ck), null); rrect(ctx, 700 + 140, 795, 130, 22, 6, rgba(COL.T, 0.4 * ck), null);
          rrect(ctx, 700, 865, 160, 22, 6, rgba(COL.C, 0.8 * ck), null); rrect(ctx, 700 + 170, 865, 480, 22, 6, rgba(COL.C, 0.4 * ck), null);
          txt(ctx, '2× frames → 4× scores', 1370, 885, { size: 24, weight: 700, color: COL.C, align: 'right', alpha: ck });
        }
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
      "Attention mixes information between frames. The feed-forward network processes each frame on its own. And the output has exactly the input's shape, B by two hundred and one by one thousand and twenty-four, which is what lets us stack layers like bricks.",
      "Count the weights. Attention has four matrices of one thousand and twenty-four by one thousand and twenty-four: about four point two million. The feed-forward network has two of one thousand and twenty-four by four thousand and ninety-six: about eight point four million. Together, with the two layer norms, about twelve point six million per layer.",
    ],
    hud: S => ({ stage: 5, shape: S.b === 2 && S.T(2) > 3 && S.T(2) < 9 ? '({B:B}, {T:201}, {C:4096})' : RES }),
    draw(ctx, S) {
      // the residual stream as a vertical rail with blocks hanging off it
      const x0 = 330, top = 200, bot = 900;
      const ra = S.p(0, 0.8, 0.5);
      ctx.save(); ctx.globalAlpha *= ra;
      const g = ctx.createLinearGradient(0, bot, 0, top); g.addColorStop(0, rgba(THEME.a, 0.9)); g.addColorStop(1, rgba(THEME.b, 0.9));
      ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x0, bot); ctx.lineTo(x0, top); ctx.stroke(); ctx.restore();
      // pulse travelling up the stream
      const py = bot - ((S.local * 160) % (bot - top));
      glow(ctx, x0, py, 40, THEME.a, 0.7 * ra);
      txt(ctx, 'residual stream', x0, bot + 46, { size: 22, weight: 700, align: 'center', color: COL.dim, alpha: ra });
      mtxt(ctx, RES, x0, top - 30, { size: 24, mono: true, align: 'center', alpha: ra });
      const unit = (y, label, col, t0, b) => {
        const a = S.p(b, 0.6, t0);
        if (a <= 0) return;
        arrow(ctx, x0, y + 60, x0 + 100, y + 60, { color: col, alpha: a, p: a });
        box(ctx, x0 + 110, y + 20, 200, 80, label, { size: 26, color: COL.text, stroke: col, alpha: a });
        return a;
      };
      // attention half
      unit(640, 'LayerNorm', COL.A, 0.5, 1); unit(520, 'Multi-head attn', COL.H, 2, 1);
      const p1 = S.p(1, 0.6, 4.5);
      if (p1 > 0) { arrow(ctx, x0 + 210, 520, x0 + 20, 470, { color: COL.H, alpha: p1, p: p1 }); chip(ctx, x0, 460, '+', { size: 34, align: 'center', color: COL.text, stroke: COL.H, alpha: p1 }); }
      // feed-forward half
      unit(340, 'LayerNorm', COL.A, 0.5, 2); unit(220, 'Feed-forward', COL.C, 1.5, 2);
      const p2 = S.p(2, 0.6, 10);
      if (p2 > 0) { arrow(ctx, x0 + 210, 220, x0 + 20, 170, { color: COL.C, alpha: p2, p: p2 }); chip(ctx, x0, 160, '+', { size: 34, align: 'center', color: COL.text, stroke: COL.C, alpha: p2 }); }
      mtxt(ctx, 'x = x + Attn( LN(x) )', 900, 560, { size: 30, mono: true, alpha: S.p(1, 0.6, 1) });
      mtxt(ctx, 'x = x + FFN( LN(x) )', 900, 260, { size: 30, mono: true, alpha: S.p(2, 0.6, 1) });
      // FFN in 3-D: 1024 -> 4096 -> 1024 for every frame
      const ff = S.p(2, 0.7, 2.5) * (1 - S.p(4, 0.6, 0));
      if (ff > 0) {
        const cam = S3.camera({ yaw: 0.45, pitch: 0.2, dist: 2000, tx: 0, ty: 0, tz: 0, cx: 1420, cy: 640 });
        const blk = (x, h, c, seed, col, t0) => S3.block(ctx, cam, { x, y: 0, z: 0, w: 150, h, d: 40, cells: [Math.round(h / 26), 6, 2], seed, alpha: ff * S.p(2, 0.6, t0), color: col, tags: { h: ['C', c] } });
        blk(-380, 230, 1024, 181, THEME.a, 2.5); blk(0, 420, 4096, 182, COL.C, 4.5); blk(380, 230, 1024, 183, THEME.a, 7);
        S3.caption(ctx, cam, -190, 250, 0, 'Linear ↑', { size: 22, mono: false, weight: 700, color: COL.C, alpha: ff * S.p(2, 0.6, 4.5) });
        S3.caption(ctx, cam, 190, 250, 0, 'GELU · Linear ↓', { size: 22, mono: false, weight: 700, color: COL.C, alpha: ff * S.p(2, 0.6, 7) });
        S3.caption(ctx, cam, 0, -290, 0, 'each of the 201 frames, independently', { size: 22, mono: false, weight: 700, color: COL.dim, alpha: ff * S.p(2, 0.6, 8) });
      }
      const mix = S.p(3, 0.6, 0.5) * (1 - S.p(4, 0.6, 0));
      if (mix > 0) {
        chip(ctx, 1420, 880, 'attention: between frames · FFN: within a frame', { size: 26, align: 'center', color: COL.text, stroke: COL.line, alpha: mix });
      }
      // parameter bars
      const pb = S.p(4, 0.7, 0.5);
      if (pb > 0) {
        X.card(ctx, 900, 380, 940, 470, pb);
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
    },
  });

  // ------------------------------------------------------------------ 12 twenty-four layers deep
  S_.push({
    id: 'x_stack', chapter: 12, title: 'Twenty-four layers deep', code: 'model.encoder.layers[0..23]',
    beats: [
      "X L S R stacks twenty-four of these layers: about three hundred and two million weights, ninety-six percent of the model. The tensor flows through all of them without ever changing shape.",
      "After layer twenty-four comes one final layer norm. The result is the last hidden state: B, by two hundred and one, by one thousand and twenty-four. One context vector per twenty milliseconds, each informed by the whole clip.",
      "You can also ask for every intermediate result. You get twenty-five hidden states: the input to the first layer, and the raw output of each of the twenty-four layers. Stack them, and that's twenty-five, by B, by two hundred and one, by one thousand and twenty-four.",
      "Different depths hold different information. Lower layers stay close to the acoustics, higher ones become more abstract and linguistic. Layer-by-layer studies of deepfake detection find the lower layers the most useful, which is why many detectors learn a weighted mix of the hidden states instead of reading only the last one.",
    ],
    hud: S => ({ stage: S.b >= 1 ? 6 : 5, shape: S.b >= 2 ? '({K:25}, {B:B}, {T:201}, {C:1024})' : RES, label: S.b >= 2 ? 'all hidden states' : null }),
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1, { yaw: 0.62, pitch: 0.2, dist: 2400, tx: -200, ty: 0, tz: 0, cx: 960, cy: 520 }], [0, 6, { yaw: 0.4, tx: 300 }],
        [1, 0, { yaw: 0.2, pitch: 0.16, dist: 1700, tx: 900 }], [2, 0, { yaw: 0.75, pitch: 0.28, dist: 2300, tx: 300, tz: -300 }],
        [3, 0, { yaw: 0.85, pitch: 0.3, dist: 2600, tx: 200, tz: -350 }],
      ], { floorY: -300 });
      const st = S.p(0, 0.6, 0) * (1 - S.p(2, 0.6, 0));
      const layerX = i => -900 + i * 62;
      const fly = clamp((S.T(0) - 1.5) / 9);
      const cur = Math.min(23, Math.floor(fly * 24));
      if (st > 0) {
        for (let i = 0; i < 24; i++) S3.gate(ctx, cam, layerX(i), 0, 0, 380, 220, { color: i <= cur && fly > 0 ? E.mix(THEME.a, THEME.b, i / 23) : COL.faint, alpha: st * (i <= cur && fly > 0 ? 0.9 : 0.4), fill: i === cur && fly < 1 ? 0.18 : 0.04, lw: 1.6 });
        const bx = lerp(-1080, 720, fly) + (S.b >= 1 ? lerp(0, 220, S.p(1, 0.8, 0.5)) : 0);
        S3.block(ctx, cam, { x: bx, y: 0, z: 0, w: 60, h: 300, d: 120, cells: [12, 3, 4], seed: 191, alpha: st, color: THEME.a, glow: THEME.a, tags: { h: ['C', 1024], d: ['T', 201] } });
        if (fly > 0 && fly < 1) txt(ctx, `layer ${cur + 1} / 24`, 960, 860, { size: 34, weight: 800, mono: true, align: 'center', color: THEME.a, alpha: st });
        S3.caption(ctx, cam, layerX(11.5), 260, 0, '≈ 302 M weights · 96 % of the model', { size: 26, mono: false, weight: 700, color: COL.text, alpha: S.p(0, 0.6, 4) * st });
        // final layer norm
        const fl = S.p(1, 0.6, 0) * st;
        S3.gate(ctx, cam, 820, 0, 0, 400, 240, { color: COL.A, alpha: fl, fill: 0.1, label: 'final LayerNorm' });
        S3.caption(ctx, cam, 1060, 260, 0, 'last hidden state', { size: 26, mono: false, weight: 700, color: COL.B, alpha: S.p(1, 0.6, 2) * st });
        S3.caption(ctx, cam, 1060, -250, 0, RES, { size: 28, alpha: S.p(1, 0.6, 3) * st });
      }
      // 25 hidden states fanned out in depth
      const hs = S.p(2, 0.8, 0.3);
      if (hs > 0) {
        const useful = S.p(3, 0.8, 4);
        for (let i = 24; i >= 0; i--) {
          const k = easeOut4((S.T(2) - 0.5 - (24 - i) * 0.06) / 0.5) + (S.b > 2 ? 1 : 0);
          const u = Math.exp(-((i - 5) ** 2) / 40);            // illustrative: lower layers matter more
          const col = useful > 0 ? E.mix(COL.faint, COL.B, u * useful + (1 - useful) * 0.5) : E.mix(THEME.a, THEME.b, i / 24);
          S3.block(ctx, cam, { x: 0, y: 0, z: -i * 34, w: 300, h: 230, d: 8, cells: [6, 8, 1], seed: 200 + i, alpha: hs * clamp(k) * (0.55 + 0.45 * (i === 0 || i === 24 ? 1 : 0)), color: col,
            fn: (r, c) => vcol(noise(r, c, 200 + i) * (0.4 + 0.5 * (useful > 0 ? u : 1)), 0.85) });
        }
        S3.caption(ctx, cam, -180, 150, 0, 'h₀  input to layer 1', { size: 22, mono: false, weight: 700, align: 'right', alpha: S.p(2, 0.6, 3) });
        S3.caption(ctx, cam, -180, 150, -24 * 34, 'h₂₄  output of layer 24', { size: 22, mono: false, weight: 700, align: 'right', alpha: S.p(2, 0.6, 4) });
        mtxt(ctx, 'torch.stack(hidden_states) → ({K:25}, {B:B}, {T:201}, {C:1024})', 960, 880, { size: 28, mono: true, align: 'center', alpha: S.p(2, 0.6, 6) * (1 - S.p(3, 0.5, 0)) });
        if (useful > 0) {
          X.card(ctx, 1240, 240, 600, 330, useful);
          txt(ctx, 'for spotting deepfakes', 1280, 292, { size: 26, weight: 700, alpha: useful });
          txt(ctx, 'lower layers: most discriminative', 1280, 340, { size: 24, weight: 700, color: COL.B, alpha: useful });
          txt(ctx, 'upper layers: weaker signal', 1280, 380, { size: 24, weight: 600, color: COL.dim, alpha: useful });
          txt(ctx, 'El Kheir et al., 2025 (layer-wise analysis)', 1280, 430, { size: 18, color: COL.faint, alpha: useful });
          mtxt(ctx, 'h = Σₗ softmax(w)ₗ · hₗ', 1280, 500, { size: 28, mono: true, alpha: S.p(3, 0.6, 9) });
          txt(ctx, 'colours: illustration, not measured weights', 1280, 545, { size: 17, color: COL.faint, alpha: S.p(3, 0.6, 9) });
        }
      }
    },
  });
})();
