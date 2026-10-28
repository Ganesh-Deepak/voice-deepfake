// XLS-R 300M, scenes 13–18: parameter budget, pre-training (quantizer, contrastive loss), detection, code, recap.
(function () {
  const { W, COL, THEME, clamp, lerp, easeIO, easeOut, easeOut4, noise, fmt, rgba, vcol, scol, txt, mtxt, rrect, line, arrow,
    chip, box, numRow, brace, cross, glow, penTip } = E;
  const S_ = window.SCENES, X = window.XL;
  const RES = '({B:B}, {T:201}, {C:1024})';

  // ------------------------------------------------------------------ 13 where the parameters live
  const PARTS = [['24 transformer layers', 302309376, COL.H], ['positional conv', 8389760, COL.A], ['conv feature encoder', 4210176, COL.K], ['feature projection', 526336, COL.C], ['final LayerNorm + mask vector', 3072, COL.B]];
  S_.push({
    id: 'x_budget', chapter: 13, title: 'Where 315 million weights live',
    beats: [
      "Adding it all up: four point two million weights in the convolutional feature encoder, half a million in the projection, eight point four million in the positional convolution, and three hundred and two point three million in the twenty-four transformer layers.",
      "That's three hundred and fifteen point four million in total; the three hundred million in the name is rounded. Nearly all of it sits in the transformer, and two thirds of every layer is the feed-forward network.",
    ],
    hud: { stage: 6, shape: RES },
    draw(ctx, S) {
      const x0 = 150, y0 = 210, w = 1620, h = 560, tot = 315438720;
      const grow = easeOut4((S.T(0) - 0.3) / 1.6);
      // treemap: transformer block on the left, the small parts stacked on the right
      const tw = w * PARTS[0][1] / tot;
      const tr = S.p(0, 0.6, 9);
      X.card(ctx, x0 - 20, y0 - 20, w + 40, h + 40, S.p(0, 0.6, 0));
      for (let i = 0; i < 24; i++) {
        const r = Math.floor(i / 6), c = i % 6, cw = (tw - 20) / 6, ch = (h - 20) / 4;
        const k = easeOut4((S.T(0) - 9.5 - i * 0.05) / 0.5) * grow;
        if (k <= 0) continue;
        const x = x0 + c * cw + 4, y = y0 + r * ch + 4;
        rrect(ctx, x, y, (cw - 8) * k, ch - 8, 8, rgba(COL.H, 0.16), rgba(COL.H, 0.5), 1.5);
        // attention third + feed-forward two thirds
        const fx = S.p(1, 0.6, 6);
        if (fx > 0) { rrect(ctx, x, y + (ch - 8) / 3, (cw - 8) * k, 2, 0, rgba(COL.C, 0.8 * fx), null); rrect(ctx, x + 2, y + (ch - 8) / 3 + 4, (cw - 12) * k, (ch - 8) * 2 / 3 - 6, 6, rgba(COL.C, 0.18 * fx), null); }
        txt(ctx, String(i + 1), x + 12, y + 30, { size: 18, mono: true, weight: 700, color: COL.H, alpha: k });
      }
      // the four small parts are thin slivers on the right; their labels live in a legend underneath
      let yy = y0;
      PARTS.slice(1).forEach(([lab, v, col], i) => {
        const hh = [0.62, 0.32, 0.05, 0.01][i] * h;
        const k = S.p(0, 0.6, [7, 1.5, 4.5, 12][i]);
        if (k > 0) {
          rrect(ctx, x0 + tw + 6, yy, (w - tw - 6) * k, Math.max(4, hh - 4), 4, rgba(col, 0.75), null);
          const lx = x0 + 10 + i * 410, ly = y0 + h + 72;
          rrect(ctx, lx, ly - 18, 18, 18, 4, rgba(col, 0.85 * k), null);
          txt(ctx, lab, lx + 28, ly - 2, { size: 20, weight: 700, color: col, alpha: k });
          txt(ctx, v.toLocaleString('en-US'), lx + 28, ly + 26, { size: 20, mono: true, color: COL.text, alpha: k });
        }
        yy += hh;
      });
      const lab = S.p(0, 0.6, 9.5);
      if (lab > 0) {
        txt(ctx, '24 layers · 302,309,376  (24 × 12,596,224)', x0 + tw / 2, y0 - 34, { size: 24, mono: true, weight: 700, align: 'center', color: COL.H, alpha: lab });
      }
      const tt = S.p(1, 0.6, 0.5);
      if (tt > 0) {
        X.card(ctx, 600, 330, 720, 260, tt);
        E.countUp(ctx, 315438720, 0, 960, 440, S.T(1) - 0.6, { size: 64, align: 'center', color: THEME.a });
        txt(ctx, 'parameters in Wav2Vec2Model (XLS-R 300M)', 960, 495, { size: 24, weight: 600, align: 'center', color: COL.dim, alpha: tt });
        txt(ctx, '95.8 % transformer · 2/3 of each layer is feed-forward', 960, 550, { size: 24, weight: 700, align: 'center', color: COL.C, alpha: S.p(1, 0.6, 6) });
      }
    },
  });

  // ------------------------------------------------------------------ 14 pre-training: the quantizer
  S_.push({
    id: 'x_quant', chapter: 14, title: 'Pre-training: the quantizer', code: 'Wav2Vec2ForPreTraining.quantizer',
    beats: [
      "How did X L S R learn all this without a single label? Pre-training needs targets, and X L S R makes its own with a quantizer. It reads the feature encoder's output before any masking: B, by two hundred and one, by five hundred and twelve.",
      "There are two codebooks, each with three hundred and twenty learned entries. In X L S R every entry is three hundred and eighty-four numbers long.",
      "A linear layer turns each frame's five hundred and twelve numbers into six hundred and forty scores, three hundred and twenty for each codebook. In each codebook, a Gumbel softmax picks one entry: exactly one-hot on the way forward, while smooth probabilities carry the gradients backward.",
      "The two chosen entries are concatenated into seven hundred and sixty-eight numbers and passed through one more linear layer. The targets are B, by two hundred and one, by seven hundred and sixty-eight. And two codebooks of three hundred and twenty give over one hundred thousand possible units: a big vocabulary built from two small ones.",
    ],
    hud: S => ({ stage: 1, label: 'quantizer branch', shape: ['({B:B}, {T:201}, {C:512})', '({B:B}, {T:201}, {C:512})', '({B:B}, {T:201}, {M:2}, {M:320})', '({B:B}, {T:201}, {C:768})'][S.b] }),
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1, { yaw: 0.35, pitch: 0.2, dist: 2000, tx: -500, ty: 0, tz: 0, cx: 960, cy: 520 }], [1, 0, { yaw: 0.25, dist: 2200, tx: 150 }],
        [2, 0, { yaw: 0.15, pitch: 0.16, dist: 2500, tx: -50 }], [3, 0, { yaw: -0.15, pitch: 0.2, dist: 2400, tx: 250 }],
      ], { floorY: -320 });
      S3.block(ctx, cam, { x: -720, y: 0, z: 0, w: 230, h: 250, d: 60, cells: [10, 9, 2], seed: 211, alpha: S.p(0, 0.6, 3), reveal: S.l(0, 1, 3), color: COL.C, tags: { w: ['T', 201], h: ['C', 512], d: ['B', 'B'] } });
      S3.caption(ctx, cam, -720, 210, 0, 'Z (unmasked)', { size: 26, mono: false, weight: 700, color: COL.C, alpha: S.p(0, 0.6, 3.5) });
      // two codebooks: 320 entries x 384 numbers
      const cb = S.p(1, 0.7, 0.3);
      const pick = S.p(2, 0.6, 6), sel = [13, 27];
      [0, 1].forEach(g => {
        const x = 160 + g * 260;
        S3.block(ctx, cam, { x, y: 0, z: 0, w: 150, h: 440, d: 30, cells: [32, 6, 1], seed: 220 + g, alpha: cb, color: COL.M,
          fn: (r, c) => r === sel[g] && pick > 0 ? rgba(COL.K, 0.95 * pick + 0.2) : rgba(COL.M, 0.15 + 0.45 * (noise(r, c, 220 + g) * 0.5 + 0.5)),
          tags: { w: ['C', 384], h: g === 0 ? ['K', 320] : null } });
        S3.caption(ctx, cam, x, 270, 0, `codebook ${g + 1}`, { size: 24, mono: false, weight: 700, color: COL.M, alpha: cb });
        if (pick > 0) { const p = cam.p(x, 220 - (sel[g] + 0.5) * 440 / 32, 16); glow(ctx, p[0], p[1], 90, COL.K, 0.6 * pick); }
      });
      // logits: 640 scores per frame (two groups of 320)
      const lg = S.p(2, 0.7, 0.5) * (1 - S.p(3, 0.6, 0));
      if (lg > 0) {
        S3.path3(ctx, cam, [[-590, 0, 0], [-440, 0, 0]], { color: COL.K, p: lg, alpha: lg });
        S3.gate(ctx, cam, -400, 0, 0, 220, 120, { color: COL.K, alpha: lg, label: 'Linear 512 → 640' });
        const bars = n => { const out = []; for (let i = 0; i < 40; i++) out.push(0.15 + 0.85 * Math.pow(noise(i, n, 9) * 0.5 + 0.5, 3)); return out; };
        [0, 1].forEach(g => {
          const bs = bars(g), base = cam.p(-250, g ? -160 : 60, 0);
          bs.forEach((v, i) => {
            const hh = v * 80 * clamp((S.T(2) - 1.5 - i * 0.02) / 0.4), hot = Math.round(sel[g] * 40 / 32) === i && pick > 0;
            rrect(ctx, base[0] + i * 7, base[1] - hh, 5, hh, 1, hot ? COL.K : rgba(COL.M, 0.8 * lg), null);
          });
          txt(ctx, `group ${g + 1}: 320 scores`, base[0], base[1] + 24, { size: 18, color: COL.dim, alpha: lg });
        });
        X.card(ctx, 120, 760, 980, 150, S.p(2, 0.6, 5));
        txt(ctx, 'Gumbel softmax (straight-through)', 150, 808, { size: 26, weight: 700, color: COL.K, alpha: S.p(2, 0.6, 5) });
        txt(ctx, 'forward: exactly one-hot (argmax)   ·   backward: gradients of the smooth softmax', 150, 856, { size: 22, color: COL.text, alpha: S.p(2, 0.6, 6.5) });
      }
      // concat -> Linear -> targets q
      const q = S.p(3, 0.7, 1);
      if (q > 0) {
        S3.path3(ctx, cam, [[160, -250, 0], [160, -340, 0], [560, -340, 0]], { color: COL.K, p: S.l(3, 1, 1), alpha: q });
        S3.path3(ctx, cam, [[420, -250, 0], [420, -340, 0]], { color: COL.K, p: S.l(3, 1, 1), alpha: q, head: false });
        S3.block(ctx, cam, { x: 640, y: -340, z: 0, w: 150, h: 40, d: 30, cells: [1, 12, 1], seed: 230, alpha: q, color: COL.K, fn: (r, c) => rgba(c < 6 ? COL.K : COL.M, 0.75), tags: { w: ['C', 768] } });
        S3.caption(ctx, cam, 640, -270, 0, '384 + 384', { size: 22, mono: false, weight: 700, color: COL.K, alpha: q });
        const tq = S.p(3, 0.7, 4);
        S3.gate(ctx, cam, 800, 0, 0, 220, 120, { color: COL.M, alpha: tq, label: 'Linear 768 → 768' });
        S3.block(ctx, cam, { x: 1040, y: 0, z: 0, w: 230, h: 280, d: 60, cells: [10, 9, 2], seed: 231, alpha: tq, reveal: S.l(3, 1.2, 4.5), color: COL.M, glow: COL.M,
          fn: (r, c, f) => rgba(COL.M, 0.2 + 0.6 * (noise(r + f, c, 231) * 0.5 + 0.5)), tags: { w: ['T', 201], h: ['C', 768], d: ['B', 'B'] } });
        S3.caption(ctx, cam, 1040, 230, 0, 'targets q', { size: 28, mono: false, weight: 800, color: COL.M, alpha: tq });
        const pu = S.p(3, 0.6, 8.5);
        if (pu > 0) {
          X.card(ctx, 1260, 760, 560, 150, pu);
          E.countUp(ctx, 102400, 0, 1540, 840, S.T(3) - 8.6, { size: 48, align: 'center', color: COL.K });
          txt(ctx, '320 × 320 possible units', 1540, 885, { size: 22, weight: 600, align: 'center', color: COL.dim, alpha: pu });
        }
      }
    },
  });

  // ------------------------------------------------------------------ 15 pre-training: the contrastive task
  S_.push({
    id: 'x_contrast', chapter: 15, title: 'Pre-training: the contrastive task', code: 'project_hid: 1024 → 768',
    beats: [
      "Now the game. At a masked position t, the transformer's output, one thousand and twenty-four numbers, is projected down to seven hundred and sixty-eight. Call it c t. The right answer is the quantized vector at the same position, q t, computed from the unmasked audio.",
      "The model has to pick q t out of a lineup that also holds one hundred distractors: quantized vectors from other masked positions in the same clip. Cosine similarities, divided by a temperature of zero point one, go through a softmax, and the loss is minus the log of the probability given to the true answer.",
      "To win, the transformer has to predict what a hidden stretch of speech sounds like from its context, across one hundred and twenty-eight languages. A second loss, the diversity loss, weighted zero point one, keeps all the codebook entries in use.",
      "After pre-training, the quantizer and these projections, about two million weights, are thrown away. What remains is exactly the part we followed: the feature encoder and the transformer.",
    ],
    hud: S => ({ stage: 6, label: 'pre-training', shape: ['({C:768})  c_t', '({K:101})  candidates', '{K:scalar} loss', RES][S.b] }),
    draw(ctx, S) {
      const vec = (x, y, seed, col, a, hl, hgt = 300) => {
        if (a <= 0) return;
        ctx.save(); ctx.globalAlpha *= a;
        rrect(ctx, x - 3, y - 3, 34, hgt + 6, 7, 'rgba(8,12,22,0.9)', hl ? COL.B : rgba(col, 0.6), hl ? 3 : 1.5);
        for (let i = 0; i < 16; i++) { ctx.fillStyle = vcol(noise(i, seed, 251) * 0.9, 0.9); ctx.fillRect(x + 2, y + i * hgt / 16 + 1, 24, hgt / 16 - 2); }
        ctx.restore();
        if (hl) glow(ctx, x + 14, y + hgt / 2, 80, COL.B, 0.4 * a);
      };
      const lineup = 1 - S.p(3, 0.6, 0);
      // c_t
      const c = S.p(0, 0.6, 1) * lineup;
      vec(200, 260, 7, COL.A, c, false);
      txt(ctx, 'c_t', 215, 600, { size: 32, weight: 800, align: 'center', color: COL.A, alpha: c });
      txt(ctx, '1024 → 768', 215, 640, { size: 20, mono: true, align: 'center', color: COL.dim, alpha: c });
      // candidates: q_t (true) among distractors
      const n = 13, trueI = 5;
      const sims = Array.from({ length: n }, (_, i) => i === trueI ? 0.82 : 0.1 + 0.4 * (noise(i, 3, 17) * 0.5 + 0.5));
      for (let i = 0; i < n; i++) {
        const k = i === trueI ? S.p(0, 0.6, 5) : S.p(1, 0.5, 1 + i * 0.12);
        const x = 420 + i * 100;
        vec(x, 260, i === trueI ? 7 : 30 + i, COL.M, k * lineup, i === trueI && S.T(1) > 6);
        txt(ctx, i === trueI ? 'q_t' : 'q̃', x + 14, 600, { size: 24, weight: 700, align: 'center', color: i === trueI ? COL.B : COL.dim, alpha: k * lineup });
        const sk = clamp((S.T(1) - 4 - i * 0.08) / 0.5) * lineup;
        if (sk > 0) {
          const hh = sims[i] * 150 * sk;
          rrect(ctx, x, 780 - hh, 30, hh, 5, i === trueI ? rgba(COL.B, 0.9) : rgba(COL.M, 0.55), null);
        }
      }
      txt(ctx, '… and 88 more distractors', 1700, 660, { size: 22, color: COL.dim, align: 'right', alpha: S.p(1, 0.6, 2.4) * lineup });
      txt(ctx, 'cosine similarity', 400, 812, { size: 20, color: COL.dim, alpha: S.p(1, 0.6, 4) * lineup });
      const ls = S.p(1, 0.6, 7) * (1 - S.p(2, 0.5, 0));
      if (ls > 0) mtxt(ctx, 'L = −log  exp(sim(c_t, q_t)/{K:0.1}) / Σ exp(sim(c_t, q̃)/{K:0.1})', 960, 880, { size: 30, mono: true, align: 'center', alpha: ls });
      // why it works + diversity
      const dv = S.p(2, 0.6, 0.5) * lineup;
      if (dv > 0) {
        X.card(ctx, 1180, 650, 640, 260, dv);
        txt(ctx, 'diversity loss × 0.1', 1220, 700, { size: 26, weight: 700, color: COL.K, alpha: dv });
        txt(ctx, 'codebook usage →', 1220, 740, { size: 20, color: COL.dim, alpha: dv });
        const flat = easeIO((S.T(2) - 4) / 2);
        for (let i = 0; i < 32; i++) {
          const v = lerp(Math.exp(-((i - 6) ** 2) / 8) + 0.05, 0.55, flat) * 120;
          rrect(ctx, 1220 + i * 17, 890 - v, 12, v, 3, rgba(COL.M, 0.8 * dv), null);
        }
        mtxt(ctx, 'L = L{A:contrastive} + {K:0.1} · L{K:diversity}', 960, 880, { size: 28, mono: true, align: 'center', alpha: dv * 0 });
      }
      // thrown away vs kept
      const ta = S.p(3, 0.7, 0.4);
      if (ta > 0) {
        X.card(ctx, 220, 260, 680, 460, ta);
        txt(ctx, 'discarded after pre-training', 260, 316, { size: 26, weight: 700, color: COL.R, alpha: ta });
        [['quantizer: Linear 512→640 + 640 × 384 codebook', 574080], ['project_q: Linear 768 → 768', 590592], ['project_hid: Linear 1024 → 768', 787200]].forEach(([l, v], i) => {
          const k = S.p(3, 0.6, 1.5 + i * 0.8);
          txt(ctx, l, 260, 390 + i * 70, { size: 21, weight: 600, alpha: k });
          txt(ctx, v.toLocaleString('en-US'), 860, 390 + i * 70, { size: 21, mono: true, align: 'right', color: COL.dim, alpha: k });
          if (S.T(3) > 5) line(ctx, 255, 383 + i * 70, 255 + 610 * clamp((S.T(3) - 5 - i * 0.3) / 0.5), 383 + i * 70, COL.R, 3);
        });
        txt(ctx, '≈ 1.95 M weights', 260, 640, { size: 30, mono: true, weight: 700, color: COL.R, alpha: S.p(3, 0.6, 4) });
        X.card(ctx, 1020, 260, 680, 460, ta);
        txt(ctx, 'kept: the model we followed', 1060, 316, { size: 26, weight: 700, color: COL.B, alpha: ta });
        [['conv feature encoder', '4.21 M'], ['projection + pos-conv', '8.92 M'], ['24 transformer layers', '302.31 M'], ['final LayerNorm', '2 K']].forEach(([l, v], i) => {
          const k = S.p(3, 0.6, 6 + i * 0.6);
          txt(ctx, l, 1060, 390 + i * 70, { size: 22, weight: 600, alpha: k });
          txt(ctx, v, 1660, 390 + i * 70, { size: 22, mono: true, align: 'right', color: COL.B, alpha: k });
        });
      }
    },
  });

  // ------------------------------------------------------------------ 16 using it for deepfake detection
  S_.push({
    id: 'x_detect', chapter: 16, title: 'Using it for deepfake detection',
    beats: [
      "Now the detector. The task is classification: is this clip bona fide, or spoofed? The simplest recipe averages the last hidden state over time, giving B by one thousand and twenty-four, and a linear layer turns that into two scores.",
      "The strongest systems put a real back-end on top. In S S L A A SIST, a linear layer shrinks each frame from one thousand and twenty-four to one hundred and twenty-eight numbers, and a graph attention network reads the two hundred and one frames. That's the next video.",
      "XLSR-MamBo takes sixty-six thousand eight hundred samples, two hundred and eight frames, and reads them with a stack of state space models and attention. That's video three.",
      "S S L A A SIST fine-tunes the whole of X L S R together with its back-end, with a tiny learning rate: one in a million. Its loss is cross-entropy, weighted point one for spoof and point nine for bona fide, because spoofed clips far outnumber real ones in the training set.",
      "One practical detail. When clips in a batch have different lengths, the short ones are padded, and X L S R takes an attention mask of shape B by number of samples, so attention ignores the padding. Detectors usually sidestep this by repeating short clips to fill a fixed crop.",
    ],
    hud: S => ({ stage: 6, shape: ['({B:B}, {C:1024})  →  ({B:B}, {K:2})', '({B:B}, {T:201}, {C:128})', '({B:B}, {T:208}, {C:1024})', '({B:B}, {K:2})', '({B:B}, {T:64600})  mask'][S.b] }),
    draw(ctx, S) {
      const cam = X.world(ctx, S, [
        [0, -1, { yaw: 0.3, pitch: 0.2, dist: 2200, tx: -200, ty: 80, tz: 0, cx: 960, cy: 480 }], [1, 0, { yaw: 0.15, dist: 2600, tx: 100, ty: -100 }],
        [2, 0, { yaw: 0.15, dist: 2600, tx: 100, ty: -150 }], [3, 0, { yaw: 0.3, pitch: 0.3, dist: 3400, tx: 0, ty: 0 }],
      ], { floorY: -620, floorAlpha: 1 - S.p(3, 0.5, 0) });
      const sc = 1 - S.p(3, 0.5, 0);
      // XLS-R output
      S3.block(ctx, cam, { x: -800, y: 120, z: 0, w: 230, h: 300, d: 60, cells: [12, 9, 2], seed: 261, alpha: S.p(0, 0.6, 0) * sc, color: THEME.a, tags: { w: ['T', 201], h: ['C', 1024], d: ['B', 'B'] } });
      S3.caption(ctx, cam, -800, 320, 0, 'XLS-R last hidden state', { size: 24, mono: false, weight: 700, color: THEME.a, alpha: S.p(0, 0.6, 0.5) * sc });
      // simple head: mean over T -> Linear -> 2
      const m = S.p(0, 0.7, 4) * sc * (1 - 0.6 * S.p(1, 0.5, 0));
      if (m > 0) {
        S3.path3(ctx, cam, [[-670, 120, 0], [-500, 120, 0]], { color: COL.dim, alpha: m, p: m });
        S3.block(ctx, cam, { x: -420, y: 120, z: 0, w: 22, h: 300, d: 60, cells: [12, 1, 2], seed: 262, alpha: m, color: COL.T, tags: { h: ['C', 1024] } });
        S3.caption(ctx, cam, -420, 320, 0, 'mean over T', { size: 22, mono: false, weight: 700, color: COL.T, alpha: m });
        S3.path3(ctx, cam, [[-400, 120, 0], [-250, 120, 0]], { color: COL.dim, alpha: m, p: S.p(0, 0.6, 7) });
        S3.gate(ctx, cam, -200, 120, 0, 160, 90, { color: COL.K, alpha: S.p(0, 0.6, 7) * m, label: '1024 → 2' });
        const p = cam.p(-60, 120, 0);
        chip(ctx, p[0], p[1] - 40, 'bona fide', { size: 26, color: COL.B, stroke: COL.B, fill: rgba(COL.B, 0.1), alpha: S.p(0, 0.6, 8.5) * m });
        chip(ctx, p[0], p[1] + 40, 'spoof', { size: 26, color: COL.R, stroke: COL.R, fill: rgba(COL.R, 0.1), alpha: S.p(0, 0.6, 9) * m });
      }
      // SSL-AASIST branch
      const aa = S.p(1, 0.7, 0.5) * sc;
      if (aa > 0) {
        S3.path3(ctx, cam, [[-800, -40, 0], [-800, -300, 0], [-560, -300, 0]], { color: COL.N, alpha: aa, p: S.l(1, 1, 0.5) });
        S3.gate(ctx, cam, -500, -300, 0, 150, 90, { color: COL.K, alpha: aa, label: 'Linear 1024 → 128' });
        S3.block(ctx, cam, { x: -300, y: -300, z: 0, w: 230, h: 120, d: 60, cells: [5, 9, 2], seed: 263, alpha: S.p(1, 0.6, 2.5) * sc, color: COL.N, tags: { w: ['T', 201], h: ['C', 128] } });
        const gp = cam.p(80, -300, 0), gk = S.p(1, 0.6, 5);
        for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) if ((i + j) % 3 === 0) { const a = i * 0.7, b = j * 0.7; line(ctx, gp[0] + 90 * Math.cos(a), gp[1] + 60 * Math.sin(a), gp[0] + 90 * Math.cos(b), gp[1] + 60 * Math.sin(b), rgba(COL.N, 0.4 * gk), 1.5); }
        for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba(i % 2 ? COL.T : COL.F, gk); ctx.beginPath(); ctx.arc(gp[0] + 90 * Math.cos(i * 0.7), gp[1] + 60 * Math.sin(i * 0.7), 9, 0, 7); ctx.fill(); }
        chip(ctx, gp[0] + 280, gp[1], 'Episode 2 · AASIST', { size: 26, color: COL.N, stroke: COL.N, fill: rgba(COL.N, 0.1), alpha: S.p(1, 0.6, 6) * sc });
      }
      // MamBo branch
      const mb = S.p(2, 0.7, 0.3) * sc;
      if (mb > 0) {
        S3.path3(ctx, cam, [[-800, -40, 0], [-800, -560, 0], [-560, -560, 0]], { color: COL.S, alpha: mb, p: S.l(2, 1, 0.3) });
        S3.block(ctx, cam, { x: -300, y: -560, z: 0, w: 236, h: 300 * 0.5, d: 60, cells: [6, 9, 2], seed: 264, alpha: S.p(2, 0.6, 2) * sc, color: COL.S, tags: { w: ['T', 208], h: ['C', 1024] } });
        S3.caption(ctx, cam, -300, -440, 0, '66,800 samples → 208 frames', { size: 22, mono: false, weight: 700, color: COL.S, alpha: S.p(2, 0.6, 2) * sc });
        const sp = cam.p(80, -560, 0), sk = S.p(2, 0.6, 4);
        for (let i = 0; i < 12; i++) { const f = Math.exp(-((((S.local * 4) % 14) - i) ** 2) / 4); rrect(ctx, sp[0] - 120 + i * 22, sp[1] - 18, 18, 36, 4, rgba(COL.S, (0.2 + 0.7 * f) * sk), null); }
        chip(ctx, sp[0] + 280, sp[1], 'Episode 3 · MamBo', { size: 26, color: COL.S, stroke: COL.S, fill: rgba(COL.S, 0.1), alpha: S.p(2, 0.6, 5) * sc });
      }
      // training card
      const tr = S.p(3, 0.6, 0.3) * (1 - S.p(4, 0.5, 0));
      if (tr > 0) {
        X.card(ctx, 220, 220, 1480, 600, tr);
        txt(ctx, 'SSL-AASIST training (Tak et al., 2022)', 270, 280, { size: 30, weight: 800, alpha: tr });
        [['fine-tune', 'all of XLS-R + back-end'], ['learning rate', '1 × 10⁻⁶ (Adam)'], ['batch', '14 clips of 64,600 samples'], ['loss', 'cross-entropy, weights [0.1 spoof, 0.9 bona fide]']].forEach(([k, v], i) => {
          const a = S.p(3, 0.6, 1 + i * 1.2);
          txt(ctx, k, 270, 360 + i * 60, { size: 24, weight: 700, color: THEME.a, alpha: a });
          txt(ctx, v, 470, 360 + i * 60, { size: 24, alpha: a });
        });
        const ba = S.p(3, 0.6, 7);
        txt(ctx, 'ASVspoof 2019 LA training clips', 1150, 360, { size: 22, weight: 700, color: COL.dim, alpha: ba });
        [['bona fide', 2580, COL.B], ['spoof', 22800, COL.R]].forEach(([l, v, col], i) => {
          const w = 480 * v / 22800 * easeOut4((S.T(3) - 7 - i * 0.4) / 0.8);
          rrect(ctx, 1150, 400 + i * 70, Math.max(2, w), 40, 8, rgba(col, 0.75), null);
          txt(ctx, `${l}  ${v.toLocaleString('en-US')}`, 1150 + Math.max(2, w) + 14, 428 + i * 70, { size: 22, weight: 700, color: col, alpha: ba });
        });
        mtxt(ctx, 'class 0 = spoof · class 1 = bona fide', 270, 640, { size: 24, mono: true, color: COL.dim, alpha: S.p(3, 0.6, 5) });
      }
      // padding vs repetition
      const pd = S.p(4, 0.6, 0.3);
      if (pd > 0) {
        X.card(ctx, 220, 220, 1480, 600, pd);
        const lens = [1, 0.62, 0.8];
        lens.forEach((l, i) => {
          const y = 300 + i * 110, x0 = 300, w = 900;
          rrect(ctx, x0, y, w * l, 60, 8, 'rgba(10,16,30,0.9)', COL.T, 2);
          E.drawWave(ctx, x0 + 10, y + 30, w * l - 20, 50, { from: i * 2000, to: i * 2000 + Math.floor(12000 * l), color: COL.T, alpha: pd });
          if (l < 1) { ctx.save(); ctx.setLineDash([6, 6]); rrect(ctx, x0 + w * l + 4, y, w * (1 - l) - 4, 60, 8, 'rgba(90,100,120,0.15)', COL.faint, 2); ctx.restore(); }
          txt(ctx, `1 1 1 … 1${l < 1 ? '  0 0 … 0' : ''}`, x0 + w + 50, y + 40, { size: 24, mono: true, color: COL.B, alpha: S.p(4, 0.6, 3) });
        });
        txt(ctx, 'attention_mask  (B, samples)', 1250, 270, { size: 22, weight: 700, color: COL.B, alpha: S.p(4, 0.6, 3) });
        txt(ctx, 'detectors: repeat short clips to fill the 64,600-sample crop instead', 960, 720, { size: 26, weight: 700, align: 'center', color: COL.C, alpha: S.p(4, 0.6, 7) });
      }
    },
  });

  // ------------------------------------------------------------------ 17 checking it in code
  const CODE = [
    ['import torch', 0], ['from transformers import Wav2Vec2Model', 0],
    ['model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-xls-r-300m")', 0],
    ['x = torch.randn(2, 64600)            # (B, samples): two 4.04 s clips', 0],
    ['out = model(x, output_hidden_states=True)', 0], ['', 1],
    ['out.extract_features.shape   # torch.Size([2, 201, 512])    conv → transpose → LayerNorm', 1],
    ['out.last_hidden_state.shape  # torch.Size([2, 201, 1024])', 1],
    ['len(out.hidden_states)       # 25, each torch.Size([2, 201, 1024])', 1],
    ['# attentions (eager attention): torch.Size([2, 16, 201, 201]) per layer', 1], ['', 2],
    ['model.feature_extractor.conv_layers[0].conv.weight.shape  # torch.Size([512, 1, 10])', 2],
    ['model.feature_projection.projection.weight.shape          # torch.Size([1024, 512])', 2],
    ['sum(p.numel() for p in model.parameters())                # 315,438,720', 2],
  ];
  function codeLine(ctx, s, x, y, a, typed) {
    if (a <= 0) return;
    const n = Math.floor(s.length * clamp(typed));
    const shown = s.slice(0, n), ci = shown.indexOf('#');
    const code = ci >= 0 ? shown.slice(0, ci) : shown, cm = ci >= 0 ? shown.slice(ci) : '';
    const kw = /\b(import|from|True)\b/g;
    ctx.save(); ctx.globalAlpha *= a; ctx.font = E.font(24, 500, true); ctx.textBaseline = 'alphabetic';
    let cx = x, last = 0, m;
    const put = (t, col) => { ctx.fillStyle = col; ctx.fillText(t, cx, y); cx += ctx.measureText(t).width; };
    while ((m = kw.exec(code))) { put(code.slice(last, m.index), '#d6deeb'); put(m[0], COL.H); last = kw.lastIndex; }
    put(code.slice(last), '#d6deeb');
    if (cm) put(cm, '#7fdbca');
    if (typed < 1 && typed > 0) { ctx.fillStyle = THEME.a; ctx.fillRect(cx + 2, y - 22, 12, 28); }
    ctx.restore();
  }
  S_.push({
    id: 'x_code', chapter: 17, title: 'Checking it in code', code: 'verify/xlsr_shapes.py',
    beats: [
      "Here it is in code, with the Hugging Face transformers library. Load the X L S R three hundred million checkpoint, and feed it a batch of two clips of sixty-four thousand six hundred samples each.",
      "The extract features, which are the convolution output after the transpose and the layer norm, are two by two hundred and one by five hundred and twelve. The last hidden state is two by two hundred and one by one thousand and twenty-four, and there are twenty-five hidden states of that same shape. Each attention map is two by sixteen by two hundred and one by two hundred and one.",
      "The first convolution's weight is five hundred and twelve by one by ten. The projection's weight is one thousand and twenty-four by five hundred and twelve. And the model has three hundred and fifteen million, four hundred and thirty-eight thousand, seven hundred and twenty parameters. Every shape in this video was checked with this code; it's in the repository's verify folder.",
    ],
    hud: { stage: 6, shape: '({B:2}, {T:201}, {C:1024})' },
    draw(ctx, S) {
      const a = S.p(0, 0.6, 0);
      X.card(ctx, 110, 150, 1700, 790, a, { fill: 'rgba(9,13,24,0.92)' });
      ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(150 + i * 30, 188, 8, 0, 7); ctx.fill(); ctx.restore(); });
      txt(ctx, 'xlsr_shapes.py', 960, 196, { size: 20, mono: true, align: 'center', color: COL.faint, alpha: a });
      let k0 = 0, k1 = 0, k2 = 0;
      CODE.forEach(([s, b], i) => {
        const idx = b === 0 ? k0++ : b === 1 ? k1++ : k2++;
        const t0 = b === 0 ? 0.6 + idx * 1.3 : b === 1 ? [0, 0.6, 7.5, 11, 15][idx] : [0, 0.4, 3.5, 7.5][idx];
        const typed = clamp((S.T(b) - t0) / Math.max(0.6, s.length / 45));
        codeLine(ctx, s, 160, 260 + i * 48, S.on(b) ? 1 : 0, typed);
      });
    },
  });

  // ------------------------------------------------------------------ 18 recap
  const RECAP = [
    ['raw audio', '64,600 samples, 16 kHz', '({B:B}, {T:64600})'],
    ['7 convs · LayerNorm · GELU', 'total stride 320 = 20 ms', '({B:B}, {C:512}, {T:201})'],
    ['transpose · LayerNorm · Linear', '512 → 1024', RES],
    ['pos-conv + residual', 'kernel 128, 16 groups', RES],
    ['24 pre-norm layers', '16 heads × 64 · 201 × 201 scores · FFN 4096', RES],
    ['final LayerNorm', 'last hidden state · or 25 hidden states', RES],
  ];
  S_.push({
    id: 'x_recap', chapter: 18, title: 'Recap: the whole flow',
    beats: [
      "Let's recap, one line per step.",
      "Raw audio: B by sixty-four thousand six hundred. Seven convolutions, each with a layer norm and a GELU, and a total stride of three hundred and twenty: B by five hundred and twelve by two hundred and one. Transpose, layer norm and projection: B by two hundred and one by one thousand and twenty-four.",
      "The positional convolution and all twenty-four pre-norm transformer layers keep that shape. Inside each, attention splits into sixteen heads of sixty-four with a two hundred and one by two hundred and one score matrix, and the feed-forward network expands to four thousand and ninety-six and back.",
      "A final layer norm gives the last hidden state, or twenty-five hidden states if you ask. The feature encoder sets the frame rate; the transformer never changes the shape, only what each vector means. Next, we'll follow those two hundred and one frames into the A A SIST back-end.",
    ],
    hud: S => ({ stage: [0, 2, 5, 6][S.b], shape: ['({B:B}, {T:64600})', RES, RES, RES][S.b] }),
    draw(ctx, S) {
      const cam = X.world(ctx, S, [[0, -1, { yaw: 0.3, pitch: 0.4, dist: 6200, tx: -230, ty: 60, tz: 0, cx: 1480, cy: 520 }], [3, 0, { yaw: 0.08, pitch: 0.3, dist: 6000 }]], { floorY: -260 });
      // the pipeline in miniature, behind the table
      const a = 0.85;
      S3.ribbon(ctx, cam, -1500, -1050, 0, 0, 100, { color: COL.T, alpha: a });
      for (let i = 0; i < 7; i++) S3.gate(ctx, cam, -960 + i * 40, 0, 0, 280 - i * 12, 140, { color: COL.K, alpha: a * 0.8 });
      S3.block(ctx, cam, { x: -500, y: 0, z: 0, w: 200, h: 250, d: 70, cells: [10, 9, 2], seed: 281, color: COL.C, alpha: a });
      S3.block(ctx, cam, { x: -150, y: 0, z: 0, w: 200, h: 300, d: 70, cells: [12, 9, 2], seed: 282, color: THEME.a, alpha: a });
      for (let i = 0; i < 24; i++) S3.gate(ctx, cam, 100 + i * 24, 0, 0, 360, 190, { color: E.mix(THEME.a, THEME.b, i / 23), alpha: a * 0.7, fill: 0.03, lw: 1.4 });
      S3.block(ctx, cam, { x: 940, y: 0, z: 0, w: 200, h: 300, d: 70, cells: [12, 9, 2], seed: 283, color: COL.B, glow: COL.B, alpha: a });
      // the table
      const ta = S.p(0, 0.6, 0.3);
      X.card(ctx, 90, 140, 1000, 720, ta);
      RECAP.forEach(([step, what, shp], i) => {
        const b = i < 3 ? 1 : i < 5 ? 2 : 3, t0 = [0.3, 3, 9, 0.3, 3.5, 0.3][i];
        const k = S.p(b, 0.6, t0);
        if (k <= 0) return;
        const y = 210 + i * 108;
        txt(ctx, step, 130, y, { size: 26, weight: 700, alpha: k });
        txt(ctx, what, 130, y + 34, { size: 20, color: COL.dim, alpha: k });
        mtxt(ctx, shp, 1050, y + 12, { size: 26, mono: true, align: 'right', alpha: k });
        if (i < RECAP.length - 1) line(ctx, 130, y + 62, 1050, y + 62, rgba('#8aa0c0', 0.15 * k), 1);
      });
      const fin = S.p(3, 0.6, 5);
      if (fin > 0) {
        txt(ctx, 'the conv encoder sets the frame rate', 1500, 760, { size: 28, weight: 700, align: 'center', color: COL.K, alpha: fin });
        txt(ctx, 'the transformer never changes the shape', 1500, 805, { size: 28, weight: 700, align: 'center', color: THEME.a, alpha: S.p(3, 0.6, 6.5) });
      }
    },
  });
})();
