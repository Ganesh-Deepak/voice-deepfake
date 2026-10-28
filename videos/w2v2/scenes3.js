// Scenes 12–17: outputs, code, quantizer, contrastive loss, deepfake detection, recap
(function () {
  const { W, COL, clamp, lerp, easeIO, noise, fmt, fmtInt, rgba, vcol, scol, txt, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box,
    cells, mat, dimTop, dimLeft, dimBottom, dimRight, stack, numRow, numMat, brace, cross, drawWave } = E;
  const S_ = window.SCENES;

  // ------------------------------------------------------------------ 12 outputs
  S_.push({
    id: 'outputs', chapter: 12, title: 'What comes out',
    code: S => S.b < 1 ? 'out.last_hidden_state' : 'out.hidden_states  (tuple of 13)',
    beats: [
      "So what comes out? The final layer's output, called the last hidden state: B by forty-nine by seven sixty-eight. One context vector per twenty milliseconds, each one informed by the entire clip.",
      "But you can also ask for all the intermediate results. You get thirteen tensors: the input to the first layer, plus the output of each of the twelve layers. Each one is B by forty-nine by seven sixty-eight.",
      "Stack them, and you have a four-dimensional tensor: thirteen, by B, by forty-nine, by seven sixty-eight. Different layers hold different kinds of information. Lower layers stay closer to the acoustics, while higher layers become more abstract and speech-like. For spoof detection, many studies find the lower and middle layers especially useful, which is why people often learn a weighted combination of all the layers.",
      "Adding everything up: about four point two million weights in the feature encoder, four hundred thousand in the projection, four point seven million in the positional convolution, and eighty-five million in the transformer. Roughly ninety-five million in total, for the base model.",
    ],
    hud: S => ({ stage: 6, shape: S.b === 2 ? '({M:13}, {B:B}, {T:49}, {C:768})' : '({B:B}, {T:49}, {C:768})' }),
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        mat(ctx, 300, 300, 768 * 0.7, 49 * 7, { rows: 20, cols: 36, seed: 170, left: ['{T:49} frames', COL.T], top: ['{C:768}', COL.C], title: 'last_hidden_state', titleSize: 30 });
        const h = S.p(0, 0.6, 5);
        ctx.globalAlpha = A * h;
        rrect(ctx, 296, 300 + 7 * 17 - 4, 768 * 0.7 + 8, 25, 5, null, COL.A, 4);
        arrow(ctx, 880, 300 + 7 * 17 + 8, 1000, 300 + 7 * 17 + 8, { color: COL.A });
        wrap(ctx, 'one frame = 768 numbers describing 20 ms of audio, in the context of the whole clip', 1020, 420, 700, 44, { size: 32 });
        ctx.restore();
      }
      const Bv = S.vis(1, 3);
      if (Bv > 0) {
        ctx.save(); ctx.globalAlpha = Bv;
        const n = 13, dx = 70, dy = 30;
        for (let i = n - 1; i >= 0; i--) {
          const a = S.p(1, 0.3, 2 + i * 0.3);
          if (a <= 0) continue;
          ctx.globalAlpha = Bv * a;
          const x = 180 + i * dx, y = 560 - i * dy;
          const tint = i / 12;
          rrect(ctx, x, y, 200, 150, 8, COL.bg2, E.mix('#58a6ff', '#d2a8ff', tint), 2);
          cells(ctx, x + 6, y + 6, 6, 8, 188 / 8, 138 / 6, (r, c) => vcol(noise(r + i * 13, c, 171) * 0.9, 0.7), 2);
          txt(ctx, i === 0 ? 'h₀' : 'h' + i, x + 100, y + 180, { size: 20, weight: 700, align: 'center', color: E.mix('#58a6ff', '#d2a8ff', tint) });
        }
        ctx.globalAlpha = Bv;
        const l = S.p(1, 0.6, 7);
        txt(ctx, 'h₀ = after positional conv (input to layer 1)', 180, 830, { size: 26, alpha: l, color: COL.T });
        txt(ctx, 'h₁ … h₁₂ = output of layers 1 … 12', 180, 875, { size: 26, alpha: l, color: COL.H });
        const b2 = S.p(2, 0.8);
        if (b2 > 0) {
          ctx.globalAlpha = Bv * b2;
          mtxt(ctx, 'torch.stack(hidden_states)', 1510, 670, { size: 26, mono: true, align: 'center' });
          mtxt(ctx, '→ ({M:13}, {B:B}, {T:49}, {C:768})', 1510, 715, { size: 28, mono: true, align: 'center' });
          arrow(ctx, 1260, 330, 1260 + 480, 330, { color: COL.dim });
          txt(ctx, 'acoustic', 1260, 310, { size: 24, weight: 700, color: COL.T });
          txt(ctx, 'abstract / linguistic', 1740, 310, { size: 24, weight: 700, color: COL.H, align: 'right' });
          const sp = S.p(2, 0.8, 11);
          ctx.globalAlpha = Bv * sp;
          rrect(ctx, 1200, 420, 620, 170, 14, COL.panel, rgba(COL.K, 0.6), 2);
          wrap(ctx, 'Spoof detection: many studies find lower-to-middle layers very informative → learn a weighted sum over all 13.', 1225, 470, 580, 38, { size: 26 });
        }
        ctx.restore();
      }
      const Cv = S.p(3);
      if (Cv > 0) {
        ctx.save(); ctx.globalAlpha = Cv;
        const parts = [['feature encoder', 4.2, COL.K], ['projection', 0.4, COL.C], ['pos-conv', 4.7, COL.A], ['transformer (12 layers)', 85.1, COL.H]];
        const tot = 94.4, x0 = 140, w = 1640, y = 430;
        let x = x0;
        parts.forEach((p, i) => {
          const a = S.p(3, 0.5, 0.5 + i * 2.3);
          const ww = w * p[1] / tot;
          ctx.globalAlpha = Cv * a;
          rrect(ctx, x, y, ww - 3, 110, 6, rgba(p[2], 0.35), p[2], 2);
          const lx = x + ww / 2;
          const L = [[y - 40, y - 5, y - 25], [y + 180, y + 115, y + 150], [y - 110, y - 5, y - 95]][i];
          if (i < 3) line(ctx, lx, L[1], lx, L[2], p[2], 2);
          txt(ctx, `${p[0]}  ${p[1]} M`, i === 3 ? lx : lx - 8, i === 3 ? y + 66 : L[0], { size: 26, weight: 700, align: i === 3 ? 'center' : 'left', color: i === 3 ? COL.text : p[2] });
          x += ww;
        });
        ctx.globalAlpha = Cv * S.p(3, 0.6, 9);
        txt(ctx, 'total ≈ 94.4 M  (usually quoted as ~95 M)', W / 2, 760, { size: 40, weight: 800, align: 'center' });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 13 code
  const CODE = [
    ['import torch', 0],
    ['from transformers import Wav2Vec2Model', 0],
    ['model = Wav2Vec2Model.from_pretrained("facebook/wav2vec2-base")', 0],
    ['x = torch.randn(2, 16000)                 # (B, samples): two 1-second clips', 0],
    ['out = model(x, output_hidden_states=True)', 0],
    ['', 1],
    ['out.extract_features.shape    # torch.Size([2, 49, 512])   conv → transpose → LayerNorm', 1],
    ['out.last_hidden_state.shape   # torch.Size([2, 49, 768])', 1],
    ['len(out.hidden_states)        # 13, each torch.Size([2, 49, 768])', 1],
    ['', 2],
    ['model.feature_extractor.conv_layers[0].conv.weight.shape   # torch.Size([512, 1, 10])', 2],
    ['model.feature_projection.projection.weight.shape           # torch.Size([768, 512])', 2],
    ['sum(p.numel() for p in model.parameters())                 # 94,371,712', 2],
  ];
  function codeLine(ctx, s, x, y, a) {
    const kw = /\b(import|from|True)\b/g;
    const hashI = s.indexOf('#');
    const code = hashI >= 0 ? s.slice(0, hashI) : s, com = hashI >= 0 ? s.slice(hashI) : '';
    const parts = [];
    let last = 0, m;
    const re = /("[^"]*")|\b(import|from|True)\b|(\d+)/g;
    while ((m = re.exec(code))) {
      if (m.index > last) parts.push([code.slice(last, m.index), COL.text]);
      parts.push([m[0], m[1] ? '#a5d6ff' : m[2] ? '#ff7b72' : COL.C]);
      last = re.lastIndex;
    }
    parts.push([code.slice(last), COL.text]);
    if (com) parts.push([com, /Size|\d{2}/.test(com) ? COL.B : COL.faint]);
    E.rich(ctx, parts, x, y, { size: 24, mono: true, alpha: a });
  }
  S_.push({
    id: 'code', chapter: 13, title: 'Checking it in code',
    beats: [
      "Here's how this looks in code, with the Hugging Face transformers library. Load the pre-trained base model, and feed it a batch of two clips, each one second long: sixteen thousand samples.",
      "Printing the shapes confirms everything we derived. The extract features, which is the convolution output after the transpose and the layer norm, is two by forty-nine by five twelve. The last hidden state is two by forty-nine by seven sixty-eight. And there are thirteen hidden states, each two by forty-nine by seven sixty-eight.",
      "It's worth printing the weights too. The first convolution's weight is five hundred and twelve by one by ten. The projection's weight is seven sixty-eight by five twelve: stored transposed, as we saw. And the model has ninety-four point three seven million parameters. Every shape in this video was checked by running exactly this code.",
    ],
    hud: { stage: 6, shape: '({B:2}, {T:49}, {C:768})' },
    draw(ctx, S) {
      rrect(ctx, 150, 180, 1620, 720, 18, '#0d1320', COL.line, 2);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(190 + i * 30, 215, 8, 0, 7); ctx.fill(); });
      CODE.forEach(([s, b], i) => {
        const a = b === 0 ? S.p(0, 0.4, 0.4 + i * 1.2) : b === 1 ? S.p(1, 0.4, [0, 1.5, 9, 12][i - 5] || 0) : S.p(2, 0.4, [0, 2, 6.5, 11][i - 9] || 0);
        codeLine(ctx, s, 200, 280 + i * 48, a);
      });
    },
  });

  // ------------------------------------------------------------------ 14 quantizer
  S_.push({
    id: 'quant', chapter: 14, title: 'Pre-training: the quantizer',
    code: 'Wav2Vec2ForPreTraining.quantizer',
    beats: [
      "So far we've followed the numbers forward. But how did the model learn useful weights, without any labels? That's pre-training, and it needs targets. wav2vec 2.0 creates its own targets, with a quantizer.",
      "The quantizer takes the feature encoder's output before masking: B by forty-nine by five twelve. Its goal is to replace each frame with an entry from a fixed, learned vocabulary of sound units.",
      "It uses two codebooks, each with three hundred and twenty entries. Each entry is a vector of one hundred and twenty-eight numbers.",
      "A linear layer maps each frame's five hundred and twelve numbers to six hundred and forty scores: three hundred and twenty for each codebook. Reshape, to B by forty-nine by two by three hundred and twenty.",
      "In each codebook, the entry with the highest score is picked. During training this uses a Gumbel softmax: a trick that makes the choice exactly one-hot on the way forward, while the gradients flow backward through smooth probabilities.",
      "The two chosen entries, one hundred and twenty-eight numbers each, are concatenated into a vector of two hundred and fifty-six, and passed through one more linear layer. The quantized targets are B by forty-nine by two fifty-six.",
      "Two codebooks of three hundred and twenty give three hundred and twenty squared: over one hundred thousand possible units. That's product quantization: a big vocabulary built from two small ones.",
    ],
    hud: S => ({ stage: 1, label: 'quantizer branch', shape: ['({B:B}, {T:49}, {C:512})', '({B:B}, {T:49}, {C:512})', '({B:B}, {T:49}, {C:512})', '({B:B}, {T:49}, {M:2}, {M:320})', '({B:B}, {T:49}, {M:2}, {M:320})', '({B:B}, {T:49}, {C:256})', '({B:B}, {T:49}, {C:256})'][S.b] }),
    draw(ctx, S) {
      const a0 = S.p(0);
      txt(ctx, 'targets made from the audio itself, no labels', W / 2, 180, { size: 34, weight: 700, align: 'center', color: COL.M, alpha: a0 * (1 - S.p(6, 0.5)) });
      // Z
      const a1 = S.p(1);
      ctx.save(); ctx.globalAlpha = a1;
      mat(ctx, 110, 420, 180, 196, { rows: 14, cols: 12, seed: 180, left: ['{T:49}', COL.T], top: ['{C:512}', COL.C], title: 'Z (unmasked)', titleSize: 24 });
      ctx.restore();
      // codebooks
      const a2 = S.p(2);
      const cb = (x, g, sel) => {
        mat(ctx, x, 280, 110, 440, { rows: 40, cols: 8, seed: 190 + g, stroke: COL.M, gap: 1 });
        dimTop(ctx, x, 274, 110, '128', COL.M, 22);
        txt(ctx, 'codebook ' + (g + 1), x + 55, 770, { size: 22, weight: 700, align: 'center', color: COL.M });
        txt(ctx, '320 entries', x + 55, 800, { size: 20, align: 'center', color: COL.dim });
        if (sel != null) rrect(ctx, x - 6, 280 + sel * 11 - 3, 122, 17, 4, null, COL.K, 3);
      };
      const pick = S.p(4, 0.6, 2.5);
      const sel = [13, 27];
      ctx.save(); ctx.globalAlpha = a2;
      cb(1060, 0, pick > 0 ? sel[0] : null); cb(1220, 1, pick > 0 ? sel[1] : null);
      ctx.restore();
      // linear + logits
      const a3 = S.p(3);
      if (a3 > 0) {
        ctx.save(); ctx.globalAlpha = a3;
        arrow(ctx, 300, 518, 360, 518, {});
        box(ctx, 370, 458, 170, 120, ['Linear', '512 → 640'], { size: 28, color: COL.K });
        arrow(ctx, 550, 518, 600, 518, {});
        const lg = (y, g) => {
          const n = 40;
          for (let k = 0; k < n; k++) {
            const v = 0.3 + 0.35 * noise(k, g, 200) + (k === Math.round(sel[g] / 40 * n) ? 0.6 : 0);
            const hh = Math.max(4, v * 80);
            ctx.fillStyle = k === Math.round(sel[g] / 40 * n) && pick > 0 ? COL.K : rgba(COL.M, 0.7);
            ctx.fillRect(620 + k * 9.5, y - hh, 7, hh);
          }
          txt(ctx, `group ${g + 1}: 320 scores`, 620, y + 30, { size: 20, color: COL.dim, weight: 600 });
        };
        lg(470, 0); lg(640, 1);
        txt(ctx, 'for one frame', 810, 330, { size: 22, color: COL.dim, align: 'center' });
        if (pick > 0) {
          ctx.globalAlpha = a3 * pick;
          arrow(ctx, 1010, 430, 1052, 280 + sel[0] * 11 + 5, { color: COL.K, lw: 2 });
          arrow(ctx, 1010, 600, 1212, 280 + sel[1] * 11 + 5, { color: COL.K, lw: 2 });
        }
        ctx.restore();
      }
      const g4 = S.vis(4, 5);
      if (g4 > 0) {
        ctx.save(); ctx.globalAlpha = g4;
        rrect(ctx, 150, 850, 1620, 80, 12, COL.panel, rgba(COL.K, 0.5), 2);
        txt(ctx, 'Gumbel softmax: argmax on the way forward (one-hot), a smooth softmax for the gradients on the way back · temperature 2 → 0.5', W / 2, 898, { size: 24, align: 'center' });
        ctx.restore();
      }
      // concat + projection
      const a5 = S.p(5);
      if (a5 > 0) {
        ctx.save(); ctx.globalAlpha = a5;
        arrow(ctx, 1340, 440, 1400, 440, { color: COL.K });
        cells(ctx, 1410, 300, 16, 1, 40, 17.5, (r) => rgba(r < 8 ? '#c792ea' : '#e0a8ff', 0.4 + 0.5 * Math.abs(noise(r, 1, 210))), 2);
        cells(ctx, 1410, 300 + 16 * 17.5 - 280, 16, 1, 40, 17.5, () => null);
        txt(ctx, '128', 1462, 370, { size: 18, color: COL.M, weight: 700 });
        txt(ctx, '128', 1462, 510, { size: 18, color: COL.M, weight: 700 });
        dimLeft(ctx, 1404, 300, 280, '', COL.C);
        txt(ctx, 'concat = 256', 1430, 620, { size: 22, weight: 700, align: 'center', color: COL.C });
        arrow(ctx, 1460, 440, 1530, 440, {});
        box(ctx, 1540, 380, 150, 120, ['Linear', '256 → 256'], { size: 26, color: COL.K });
        arrow(ctx, 1700, 440, 1750, 440, {});
        txt(ctx, 'q', 1780, 452, { size: 48, weight: 800, color: COL.M });
        mtxt(ctx, 'q: ({B:B}, {T:49}, {C:256})', 1650, 580, { size: 28, mono: true, align: 'center', alpha: S.p(5, 0.6, 5) });
        ctx.restore();
      }
      const a6 = S.p(6);
      if (a6 > 0) {
        ctx.save(); ctx.globalAlpha = a6;
        rrect(ctx, 150, 850, 1620, 80, 12, COL.panel, rgba(COL.M, 0.6), 2);
        mtxt(ctx, '{M:320} × {M:320} = {M:102,400} possible codes per frame  ·  product quantization', W / 2, 900, { size: 30, align: 'center', weight: 600 });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 15 contrastive
  const CAND = 11, TRUE_I = 4;
  const SIMS = Array.from({ length: CAND }, (_, i) => i === TRUE_I ? 0.82 : 0.15 + 0.35 * Math.abs(noise(i, 3, 220)));
  const PROBS = (() => { const e = SIMS.map(s => Math.exp(s / 0.1)); const t = e.reduce((a, b) => a + b, 0) + 90 * Math.exp(0.25 / 0.1); return e.map(v => v / t); })();
  S_.push({
    id: 'contrast', chapter: 15, title: 'Pre-training: the contrastive task',
    code: 'Wav2Vec2ForPreTraining.forward',
    beats: [
      "Now the training task. Take a masked position, t. The transformer's output there, seven hundred and sixty-eight numbers, is projected down to two hundred and fifty-six. Call it c t.",
      "The correct answer is the quantized vector at that same position, q t, computed from the unmasked audio. The model has to pick it out of a lineup.",
      "The lineup contains the true q t, plus one hundred distractors: quantized vectors sampled from other masked positions in the same clip.",
      "Measure the cosine similarity between c t and each candidate, divide by a temperature of zero point one, and apply a softmax. The loss is minus the log of the probability given to the true answer.",
      "To win this game, the transformer must predict what a hidden stretch of audio sounds like, from its context. That forces it to learn the structure of speech: phonemes, speakers, rhythm. A second loss, the diversity loss, weighted by zero point one, encourages the model to use all the codebook entries equally.",
      "After pre-training, the quantizer and these projection heads are thrown away. What we keep is the feature encoder and the transformer: exactly the part we followed through this whole video.",
    ],
    hud: S => [{ label: 'c = project_hid(h)', shape: '({B:B}, {T:49}, {C:256})' }, { label: 'targets q', shape: '({B:B}, {T:49}, {C:256})' }, { label: 'negatives', shape: '({M:100}, {B:B}, {T:49}, {C:256})' }, { label: 'logits', shape: '({M:101}, {B:B}, {T:49})' }, { label: 'loss', shape: 'scalar' }, { label: 'kept for you', shape: '({B:B}, {T:49}, {C:768})' }].map(h => ({ stage: 6, ...h }))[S.b],
    draw(ctx, S) {
      const A = S.vis(0, 5);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        // c_t
        cells(ctx, 150, 220, 24, 1, 40, 16, r => vcol(noise(r, 1, 230), 0.9), 2);
        dimLeft(ctx, 144, 220, 384, '{C:768}', COL.C, 22);
        txt(ctx, 'transformer out @ t', 170, 640, { size: 22, color: COL.dim, align: 'center', alpha: 1 - S.p(4, 0.5) });
        arrow(ctx, 200, 412, 270, 412, {});
        box(ctx, 280, 362, 130, 100, ['Linear', '768→256'], { size: 22, color: COL.K });
        arrow(ctx, 420, 412, 480, 412, {});
        cells(ctx, 490, 292, 12, 1, 40, 20, r => vcol(noise(r, 2, 231), 0.9), 2);
        txt(ctx, 'c', 510, 560, { size: 40, weight: 800, align: 'center', color: COL.H });
        txt(ctx, 't', 530, 570, { size: 24, weight: 700, color: COL.H });
        // lineup
        const la = S.p(1);
        for (let i = 0; i < CAND; i++) {
          const isT = i === TRUE_I;
          const a = isT ? la : S.p(2, 0.4, 0.5 + i * 0.25);
          if (a <= 0) continue;
          ctx.globalAlpha = A * a;
          const x = 650 + i * 96;
          rrect(ctx, x - 6, 280, 60, 260, 8, isT ? rgba(COL.B, 0.12) : 'rgba(0,0,0,0)', isT ? COL.B : COL.line, isT ? 3 : 1.5);
          cells(ctx, x, 292, 12, 1, 48, 20, r => vcol(noise(r, i + (isT ? 0 : 50), 232) * (isT ? 1 : 0.8), 0.85), 2);
          txt(ctx, isT ? 'q_t' : 'q̃', x + 24, 580, { size: 22, weight: 700, align: 'center', color: isT ? COL.B : COL.dim });
        }
        ctx.globalAlpha = A * S.p(2, 0.5, 3);
        txt(ctx, '… + 90 more', 650 + CAND * 96 - 10, 420, { size: 22, color: COL.dim });
        txt(ctx, '1 true + 100 distractors (other masked frames, same clip)', 1250, 240, { size: 24, align: 'center', color: COL.dim });
        ctx.globalAlpha = A;
        // similarities & probs
        const s3 = S.p(3, 0.6, 1) * (1 - S.p(4, 0.5));
        if (s3 > 0) {
          for (let i = 0; i < CAND; i++) {
            const x = 650 + i * 96, isT = i === TRUE_I;
            const soft = easeIO(S.l(3, 1, 6));
            const v = lerp(SIMS[i], PROBS[i] / PROBS[TRUE_I] * 0.9, soft);
            ctx.globalAlpha = A * s3;
            rrect(ctx, x, 760 - v * 120, 48, v * 120, 4, isT ? COL.B : rgba(COL.dim, 0.6), null);
            txt(ctx, soft > 0.5 ? PROBS[i].toFixed(2) : SIMS[i].toFixed(2), x + 24, 790, { size: 18, mono: true, align: 'center', color: isT ? COL.B : COL.dim });
          }
          ctx.globalAlpha = A * s3;
          txt(ctx, S.l(3, 1, 6) > 0.5 ? 'softmax(sim / κ)' : 'cos-sim(c_t, q)', 660, 700, { size: 22, color: COL.dim, align: 'right' });
          mtxt(ctx, 'L = − log  exp(sim(c,q_t)/κ) / Σ exp(sim(c,q̃)/κ)        κ = 0.1', W / 2, 880, { size: 30, mono: true, align: 'center', alpha: S.p(3, 0.6, 9) });
        }
        ctx.restore();
      }
      const D = S.vis(4, 5);
      if (D > 0) {
        ctx.save(); ctx.globalAlpha = D;
        rrect(ctx, 100, 640, 1720, 290, 16, 'rgba(10,14,22,0.97)', COL.line, 2);
        wrap(ctx, 'To pick the right q_t, the model must infer what the hidden audio sounds like from context → it learns phonemes, speakers, rhythm.', 140, 700, 1000, 42, { size: 28 });
        mtxt(ctx, 'L = L_contrastive + {K:0.1} · L_diversity', 140, 880, { size: 32, mono: true, alpha: S.p(4, 0.6, 9) });
        const u = easeIO(S.l(4, 2, 12));
        for (let k = 0; k < 24; k++) {
          const v = lerp(0.1 + 0.9 * Math.pow(Math.abs(noise(k, 1, 240)), 3), 0.55, u);
          rrect(ctx, 1240 + k * 22, 900 - v * 180, 16, v * 180, 3, rgba(COL.M, 0.8), null);
        }
        txt(ctx, 'codebook usage → uniform', 1500, 690, { size: 22, color: COL.M, align: 'center', weight: 700, alpha: S.p(4, 0.6, 12) });
        ctx.restore();
      }
      const K = S.p(5);
      if (K > 0) {
        ctx.save(); ctx.globalAlpha = K;
        const y = 420;
        box(ctx, 150, y - 70, 320, 140, ['Feature encoder', 'keep ✓'], { size: 30, color: COL.B, stroke: COL.B });
        arrow(ctx, 480, y, 560, y, {});
        box(ctx, 570, y - 70, 320, 140, ['Transformer', 'keep ✓'], { size: 30, color: COL.B, stroke: COL.B });
        box(ctx, 1030, y - 70, 300, 140, ['Quantizer', 'discard'], { size: 30, color: COL.dim });
        box(ctx, 1400, y - 70, 360, 140, ['Projection heads', 'discard'], { size: 30, color: COL.dim });
        const c = S.p(5, 0.4, 2);
        cross(ctx, 1180, y, 60 * c, COL.R, 8); cross(ctx, 1580, y, 60 * c, COL.R, 8);
        txt(ctx, 'what we keep is exactly what we traced', W / 2, 700, { size: 36, weight: 700, align: 'center', color: COL.B, alpha: S.p(5, 0.6, 5) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 16 deepfake detection
  S_.push({
    id: 'deepfake', chapter: 16, title: 'Using it for deepfake detection',
    beats: [
      "Now, your project. For deepfake or spoof detection, the task is classification: is this clip bona fide, or spoofed?",
      "The simplest recipe: run the model, take the last hidden state, B by T by seven sixty-eight, and average over time. The time axis disappears, leaving B by seven sixty-eight: one vector per clip.",
      "A linear layer maps seven sixty-eight to two scores. The output is B by two. In the ASVspoof recipes, class zero is spoof and class one is bona fide. A softmax turns the scores into probabilities, and a cross-entropy loss trains the head, often weighted point one for spoof and point nine for bona fide, because spoofed clips far outnumber real ones. Usually the front end is fine-tuned too, with a very small learning rate. Some recipes keep the convolutional feature encoder frozen; SSL-AASIST fine-tunes all of it.",
      "A popular upgrade: use all thirteen hidden states. Learn thirteen weights, pass them through a softmax, and take a weighted sum over the layer axis. Thirteen by B by T by seven sixty-eight becomes B by T by seven sixty-eight. The model learns for itself which layers carry the artifacts.",
      "Many state-of-the-art systems, like X L S R with an A A SIST back-end, use the large model on four-second crops of sixty-four thousand six hundred samples. Run our formula: sixty-four thousand six hundred samples become two hundred and one frames. So the front end outputs B by two hundred and one by one thousand and twenty-four, and a linear layer shrinks that to one hundred and twenty-eight features, before the graph attention back-end. The next two videos, on the A A SIST and MamBo back-ends, pick up exactly here.",
      "One practical detail. When clips in a batch have different lengths, the shorter ones are padded. Models like X L S R take an attention mask, of shape B by number of samples, which tells the model which positions are real, so attention can ignore the padding. The base model was trained without one, so there you simply pad with zeros. When you pool over time, average only over the real frames.",
    ],
    hud: S => ({ stage: 6, shape: ['({B:B}, {T:16000})', '({B:B}, {C:768})', '({B:B}, {K:2})', '({B:B}, {T:T}, {C:768})', '({B:B}, {T:201}, {C:1024})', '({B:B}, {T:L})  mask'][S.b] }),
    draw(ctx, S) {
      const A = S.vis(0, 1);
      if (A > 0) {
        ctx.save(); ctx.globalAlpha = A;
        rrect(ctx, 150, 360, 380, 200, 14, COL.panel, COL.line, 2);
        drawWave(ctx, 170, 460, 340, 150, {});
        arrow(ctx, 540, 460, 640, 460, {});
        box(ctx, 650, 370, 400, 180, ['wav2vec 2.0', '+ classifier head'], { size: 36, color: COL.A });
        arrow(ctx, 1060, 460, 1160, 460, {});
        chip(ctx, 1180, 400, 'bona fide', { size: 32, color: COL.B, stroke: COL.B, fill: rgba(COL.B, 0.1) });
        txt(ctx, 'or', 1270, 470, { size: 26, color: COL.dim, align: 'center' });
        chip(ctx, 1180, 530, 'spoof', { size: 32, color: COL.R, stroke: COL.R, fill: rgba(COL.R, 0.1) });
        ctx.restore();
      }
      const P = S.vis(1, 3);
      if (P > 0) {
        ctx.save(); ctx.globalAlpha = P;
        const x0 = 150, y0 = 260, rows = 10, cw = 16, cols = 24, ch = 22;
        const t = easeIO(S.l(1, 1.6, 5));
        ctx.globalAlpha = P * (1 - 0.6 * t);
        cells(ctx, x0, y0, rows, cols, cw, ch, (r, c) => vcol(noise(r, c, 251) * 0.9, 0.9), 2);
        dimLeft(ctx, x0 - 6, y0, rows * ch, '{T:T}', COL.T, 24);
        for (let r = 0; r < rows; r++) {
          const y = lerp(y0 + r * ch, y0 + rows * ch + 90, t);
          ctx.globalAlpha = P * (t > 0 && t < 1 ? 0.35 : 0);
          cells(ctx, x0, y, 1, cols, cw, ch, (_, c) => vcol(noise(r, c, 251) * 0.9, 0.9), 2);
        }
        ctx.globalAlpha = P * t;
        cells(ctx, x0, y0 + rows * ch + 90, 1, cols, cw, ch, (_, c) => vcol(noise(99, c, 250) * 0.6, 0.95), 2);
        ctx.globalAlpha = P;
        dimTop(ctx, x0, y0 - 6, cols * cw, '{C:768}', COL.C, 24);
        txt(ctx, 'mean over T', x0 + cols * cw / 2, y0 + rows * ch + 60, { size: 24, weight: 700, align: 'center', color: COL.T, alpha: S.p(1, 0.5, 4) });
        mtxt(ctx, '({B:B}, {T:T}, {C:768})  →  mean(dim=1)  →  ({B:B}, {C:768})', x0, 720, { size: 30, mono: true, alpha: S.p(1, 0.6, 6) });
        // head
        const h = S.p(2);
        if (h > 0) {
          ctx.globalAlpha = P * h;
          arrow(ctx, x0 + cols * cw + 20, y0 + rows * ch + 101, 700, y0 + rows * ch + 101, {});
          box(ctx, 710, y0 + rows * ch + 40, 200, 120, ['Linear', '768 → 2'], { size: 30, color: COL.K });
          arrow(ctx, 920, y0 + rows * ch + 101, 1000, y0 + rows * ch + 101, {});
          numRow(ctx, 1010, y0 + rows * ch + 75, [-0.5, 2.1], 100, 52, { size: 22, d: 1 });
          txt(ctx, 'logits (B, 2)', 1110, y0 + rows * ch + 160, { size: 22, color: COL.dim, align: 'center' });
          arrow(ctx, 1220, y0 + rows * ch + 101, 1290, y0 + rows * ch + 101, {});
          const pb = [0.07, 0.93];
          ['spoof (0)', 'bona fide (1)'].forEach((l, i) => {
            const y = y0 + rows * ch + 60 + i * 60;
            rrect(ctx, 1300, y, 300, 38, 6, COL.panel, COL.line, 1);
            rrect(ctx, 1300, y, 300 * pb[i] * S.p(2, 0.8, 5), 38, 6, i ? rgba(COL.B, 0.8) : rgba(COL.R, 0.8), null);
            txt(ctx, `${l}  ${pb[i].toFixed(2)}`, 1620, y + 27, { size: 22, weight: 700, color: i ? COL.B : COL.R });
          });
          ctx.globalAlpha = P * S.p(2, 0.6, 9);
          rrect(ctx, 1080, 740, 740, 170, 14, COL.panel, COL.line, 2);
          txt(ctx, 'loss: CE, class weights [0.1, 0.9]', 1105, 790, { size: 26 });
          txt(ctx, 'fine-tune the front end too, small LR (~1e-5 … 1e-6)', 1105, 836, { size: 24, color: COL.dim });
          txt(ctx, 'CNN encoder: frozen in some recipes, tuned in SSL-AASIST', 1105, 880, { size: 24, color: COL.dim });
        }
        ctx.restore();
      }
      const L = S.vis(3, 4);
      if (L > 0) {
        ctx.save(); ctx.globalAlpha = L;
        const ws = Array.from({ length: 13 }, (_, i) => Math.exp(1.4 * Math.exp(-Math.pow((i - 4.5) / 2.8, 2)) + 0.2 * noise(i, 1, 260)));
        const tot = ws.reduce((a, b) => a + b, 0);
        for (let i = 12; i >= 0; i--) {
          const x = 150 + i * 40, y = 520 - i * 18;
          rrect(ctx, x, y, 170, 120, 6, COL.bg2, E.mix('#58a6ff', '#d2a8ff', i / 12), 2);
          cells(ctx, x + 5, y + 5, 5, 7, 160 / 7, 110 / 5, (r, c) => vcol(noise(r + i * 7, c, 262) * 0.9, 0.6), 2);
        }
        txt(ctx, '13 × ({B:B}, {T:T}, {C:768})'.replace(/\{\w:([^}]*)\}/g, '$1'), 150, 720, { size: 24, mono: true, color: COL.dim });
        const wa = S.p(3, 0.6, 3);
        ctx.globalAlpha = L * wa;
        txt(ctx, 'softmax(w)', 1000, 240, { size: 26, weight: 700, color: COL.K });
        ws.forEach((w, i) => {
          const hh = w / tot * 900;
          rrect(ctx, 1000 + i * 34, 520 - hh, 24, hh, 4, rgba(COL.K, 0.85), null);
          txt(ctx, String(i), 1012 + i * 34, 550, { size: 16, mono: true, align: 'center', color: COL.dim });
        });
        txt(ctx, 'layer', 1000 + 13 * 34 + 10, 550, { size: 18, color: COL.dim });
        mtxt(ctx, 'h = Σₗ softmax(w)ₗ · hₗ   →   ({B:B}, {T:T}, {C:768})', W / 2, 820, { size: 32, mono: true, align: 'center', alpha: S.p(3, 0.6, 8) });
        ctx.restore();
      }
      const X = S.vis(4, 5);
      if (X > 0) {
        ctx.save(); ctx.globalAlpha = X;
        const y = 400, items = [
          [150, 250, ['64,600 samples', '≈ 4.04 s'], COL.T],
          [470, 280, ['XLS-R 300M', '24 layers · 1024'], COL.A],
          [820, 270, ['(B, 201, 1024)', 'hidden states'], COL.C],
          [1160, 240, ['Linear', '1024 → 128'], COL.K],
          [1470, 300, ['AASIST', 'graph attention → score'], COL.H],
        ];
        items.forEach(([x, w, t, c], i) => {
          const a = S.p(4, 0.5, 0.5 + i * 2.2);
          box(ctx, x, y - 70, w, 140, t, { size: 26, color: c, alpha: a });
          if (i) arrow(ctx, items[i - 1][0] + items[i - 1][1] + 8, y, x - 8, y, { alpha: a });
        });
        const f = S.p(4, 0.6, 9);
        mtxt(ctx, 'frames = ⌊ (samples − {K:400}) / {A:320} ⌋ + 1  =  ⌊ (64600 − 400) / 320 ⌋ + 1  =  {T:201}', W / 2, 650, { size: 30, mono: true, align: 'center', alpha: f });
        txt(ctx, '(the 7-conv stack collapses to this one formula: receptive field 400, total stride 320)', W / 2, 700, { size: 22, align: 'center', color: COL.dim, alpha: f });
        ctx.restore();
      }
      const M = S.p(5);
      if (M > 0) {
        ctx.save(); ctx.globalAlpha = M;
        const lens = [1, 0.62, 0.8], x0 = 250, w = 1000;
        lens.forEach((l, i) => {
          const y = 250 + i * 110;
          rrect(ctx, x0, y, w * l, 60, 8, COL.panel, COL.T, 2);
          drawWave(ctx, x0 + 10, y + 30, w * l - 20, 50, { from: i * 2000, to: i * 2000 + Math.floor(12000 * l) });
          if (l < 1) {
            ctx.save(); ctx.setLineDash([6, 6]);
            rrect(ctx, x0 + w * l + 4, y, w * (1 - l) - 4, 60, 8, 'rgba(90,100,120,0.15)', COL.faint, 2);
            ctx.restore();
            txt(ctx, 'zero padding', x0 + w * l + w * (1 - l) / 2, y + 38, { size: 20, align: 'center', color: COL.faint });
          }
          const ma = S.p(5, 0.5, 4);
          ctx.globalAlpha = M * ma;
          txt(ctx, `1 1 1 … 1${l < 1 ? '  0 0 … 0' : ''}`, x0 + w + 60, y + 40, { size: 24, mono: true, color: COL.B });
          ctx.globalAlpha = M;
        });
        txt(ctx, 'attention_mask  (B, samples)', x0 + w + 60, 220, { size: 22, weight: 700, color: COL.B, alpha: S.p(5, 0.5, 4) });
        mtxt(ctx, 'pooled = Σₜ h[t]·m[t] / Σₜ m[t]    (average over real frames only)', W / 2, 700, { size: 30, mono: true, align: 'center', alpha: S.p(5, 0.6, 12) });
        txt(ctx, 'HF tip: wav2vec2-base (group-norm) was trained without attention_mask, so zero-pad and skip it; large / XLS-R models expect it.', W / 2, 780, { size: 21, align: 'center', color: COL.dim, alpha: S.p(5, 0.6, 14) });
        ctx.restore();
      }
    },
  });

  // ------------------------------------------------------------------ 17 recap
  const RECAP = [
    ['raw audio', '16 kHz, normalized', '({B:B}, {T:16000})', 1, 0],
    ['feature encoder', '7 convs · k 10,3,3,3,3,2,2 · s 5,2,2,2,2,2,2', '({B:B}, {C:512}, {T:49})', 1, 2],
    ['transpose', 'swap last two axes', '({B:B}, {T:49}, {C:512})', 1, 4],
    ['LayerNorm + Linear', '512 → 768', '({B:B}, {T:49}, {C:768})', 1, 6],
    ['masking (pre-train)', 'spans of 10 → learned vector m', '({B:B}, {T:49}, {C:768})', 2, 0],
    ['positional conv', 'k 128 · 16 groups · + residual · LN', '({B:B}, {T:49}, {C:768})', 2, 1.5],
    ['transformer × 12', 'heads ({H:12}×{D:64}) · scores {T:49}×{T:49} · FFN 3072', '({B:B}, {T:49}, {C:768})', 2, 5],
    ['outputs', 'last_hidden_state · or 13 hidden_states', '({B:B}, {T:49}, {C:768})', 3, 0],
    ['classifier', 'mean over T · Linear 768 → 2', '({B:B}, {K:2})', 3, 5],
  ];
  S_.push({
    id: 'recap', chapter: 17, title: 'Recap: the whole flow',
    beats: [
      "Let's recap the whole flow, one line per step.",
      "Raw audio: B by sixteen thousand. The feature encoder: seven convolutions with a total stride of three hundred and twenty, giving B by five twelve by forty-nine. Transpose: B by forty-nine by five twelve. Layer norm and projection: B by forty-nine by seven sixty-eight.",
      "Masking and the positional convolution keep that shape. The twelve transformer layers keep that shape too. Inside each one, attention temporarily splits into twelve heads of sixty-four, with a forty-nine by forty-nine score matrix per head, while the feed-forward network expands to three thousand and seventy-two, and back.",
      "The output is B by forty-nine by seven sixty-eight, or thirteen of those if you ask for all the hidden states. Pool over time, and classify.",
      "If you remember one thing, remember this. The feature encoder shrinks time, and sets the frame rate. The transformer never changes the shape. It only changes what each vector means. Thanks for watching, and good luck with your deepfake detector.",
    ],
    hud: null,
    draw(ctx, S) {
      const y0 = 180, lh = 76;
      txt(ctx, 'step', 110, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: S.p(0) });
      txt(ctx, 'what happens', 520, y0 - 30, { size: 22, weight: 700, color: COL.dim, alpha: S.p(0) });
      txt(ctx, 'shape', 1810, y0 - 30, { size: 22, weight: 700, color: COL.dim, align: 'right', alpha: S.p(0) });
      line(ctx, 100, y0 - 14, 1820, y0 - 14, COL.line, 2);
      const dimAll = S.p(4, 0.8, 0.5);
      RECAP.forEach(([a, b, c, beat, dl], i) => {
        const al = S.p(beat, 0.5, dl);
        if (al <= 0) return;
        const y = y0 + 34 + i * lh;
        const emph = (i === 1 || i === 6);
        const alpha = al * (dimAll > 0 && !emph ? 1 - 0.6 * dimAll : 1);
        if (dimAll > 0 && emph) rrect(ctx, 96, y - 40, 1728, 62, 10, rgba(COL.A, 0.1 * dimAll), rgba(COL.A, dimAll), 2);
        txt(ctx, a, 110, y, { size: 28, weight: 700, alpha });
        mtxt(ctx, b, 520, y, { size: 24, color: COL.dim, alpha });
        mtxt(ctx, c, 1810, y, { size: 30, mono: true, align: 'right', alpha, color: COL.dim });
      });
      const fl = S.p(3, 0.6, 3);
      if (fl > 0) mtxt(ctx, 'frames = ⌊(samples − 400) / 320⌋ + 1 :   16000 → {T:49}   ·   64600 → {T:201}   ·   66800 → {T:208}', 520, 885, { size: 24, mono: true, alpha: fl * (1 - 0.5 * S.p(4)) });
      const f = S.p(4, 0.6, 4);
      if (f > 0) {
        txt(ctx, 'feature encoder: shrinks time, sets the frame rate (20 ms)', 520, 940, { size: 28, weight: 700, color: COL.A, alpha: f });
        txt(ctx, 'transformer: never changes the shape, only what each vector means', 520, 982, { size: 28, weight: 700, color: COL.A, alpha: S.p(4, 0.6, 7) });
      }
    },
  });
})();
