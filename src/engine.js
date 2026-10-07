// Deterministic canvas animation engine: renderAt(t) draws the frame for time t (seconds).
// Used both by the interactive player (index.html) and the frame renderer (render.py).
(function () {
  const W = 1920, H = 1080;
  const COL = {
    bg: '#0a0e16', bg2: '#0f1520', panel: '#131b28', panel2: '#1a2435', line: '#2b374b',
    text: '#e9eef6', dim: '#8d9bb0', faint: '#526075',
    B: '#7ee787', T: '#58a6ff', C: '#ffa657', H: '#d2a8ff', D: '#ff7b9c', K: '#f2cc60',
    A: '#39d0d8', R: '#ff6b6b', G: '#7ee787', W: '#e9eef6', M: '#c792ea',
    F: '#39d0d8', N: '#d2a8ff', S: '#f2cc60', E: '#c792ea',
  };

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
  function noise(a, b, c = 0) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return ((h >>> 0) / 4294967295) * 2 - 1;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const fmt = (v, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
  const fmtInt = v => v.toLocaleString('en-US');

  // ---------- colors ----------
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgba(h, a) { const [r, g, b] = hexToRgb(h); return `rgba(${r},${g},${b},${a})`; }
  function mix(h1, h2, t) {
    const a = hexToRgb(h1), b = hexToRgb(h2);
    return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
  }
  // diverging colour for values in [-1, 1]: cyan (neg) — slate (0) — rose (pos)
  function vcol(v, a = 1) {
    v = clamp(v, -1, 1);
    const z = [30, 40, 58], p = [255, 110, 150], n = [60, 200, 225];
    const e = v > 0 ? p : n, t = Math.pow(Math.abs(v), 0.8);
    return `rgba(${Math.round(lerp(z[0], e[0], t))},${Math.round(lerp(z[1], e[1], t))},${Math.round(lerp(z[2], e[2], t))},${a})`;
  }
  // sequential colour for values in [0, 1] (attention weights)
  function scol(v, a = 1) {
    v = clamp(v);
    const stops = [[20, 28, 44], [48, 70, 140], [120, 90, 210], [230, 120, 190], [255, 220, 150]];
    const x = v * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), t = x - i;
    const c = stops[i].map((s, k) => Math.round(lerp(s, stops[i + 1][k], t)));
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }

  // ---------- text ----------
  const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
  const MONO = "'JetBrains Mono', Menlo, monospace";
  const font = (size, weight = 400, mono = false) => `${weight} ${size}px ${mono ? MONO : SANS}`;

  function txt(ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(o.size || 32, o.weight || 400, o.mono);
    ctx.fillStyle = o.color || COL.text;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  // parts: [[text, color, weight], ...]
  function rich(ctx, parts, x, y, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.textAlign = 'left';
    const size = o.size || 32;
    const ws = parts.map(p => { ctx.font = font(size, p[2] || o.weight || 400, o.mono); return ctx.measureText(p[0]).width; });
    const total = ws.reduce((a, b) => a + b, 0);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    parts.forEach((p, i) => {
      ctx.font = font(size, p[2] || o.weight || 400, o.mono);
      ctx.fillStyle = p[1] || o.color || COL.text;
      ctx.fillText(p[0], cx, y);
      cx += ws[i];
    });
    ctx.restore();
    return total;
  }
  // markup: "{T:49}" renders "49" in COL.T, bold.  "{dim:text}" uses COL.dim.
  function parseM(s) {
    const out = [], re = /\{(\w+):([^}]*)\}/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), null, null]);
      out.push([m[2], COL[m[1]] || m[1], 700]);
      last = re.lastIndex;
    }
    if (last < s.length) out.push([s.slice(last), null, null]);
    return out;
  }
  function mtxt(ctx, s, x, y, o = {}) {
    return rich(ctx, parseM(s).map(p => [p[0], p[1] || o.color || COL.text, p[2] ? (o.boldW || 700) : (o.weight || 400)]), x, y, o);
  }
  function mwidth(ctx, s, o = {}) {
    let w = 0;
    parseM(s).forEach(p => { ctx.font = font(o.size || 32, p[2] ? 700 : (o.weight || 400), o.mono); w += ctx.measureText(p[0]).width; });
    return w;
  }
  function wrap(ctx, s, x, y, maxW, lh, o = {}) {
    ctx.save();
    ctx.font = font(o.size || 30, o.weight || 400, o.mono);
    const words = s.split(' ');
    let line = '', yy = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (mwidth(ctx, test, o) > maxW && line) { mtxt(ctx, line, x, yy, o); line = w; yy += lh; }
      else line = test;
    }
    if (line) mtxt(ctx, line, x, yy, o);
    ctx.restore();
    return yy + lh;
  }

  // ---------- shapes ----------
  function rrect(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
    ctx.beginPath();
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function line(ctx, x1, y1, x2, y2, color, lw = 2, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, o = {}) {
    const p = o.p ?? 1;
    if (p <= 0) return;
    const ex = lerp(x1, x2, p), ey = lerp(y1, y2, p);
    const col = o.color || COL.dim, lw = o.lw || 3, hs = o.head || 14;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    const a = Math.atan2(ey - y1, ex - x1);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex - Math.cos(a) * hs * 0.6, ey - Math.sin(a) * hs * 0.6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hs * Math.cos(a - 0.45), ey - hs * Math.sin(a - 0.45));
    ctx.lineTo(ex - hs * Math.cos(a + 0.45), ey - hs * Math.sin(a + 0.45));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // polyline arrow through points
  function parrow(ctx, pts, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || COL.dim; ctx.lineWidth = o.lw || 3; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    arrow(ctx, a[0], a[1], b[0], b[1], o);
  }
  function chip(ctx, x, y, s, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    const size = o.size || 24;
    ctx.font = font(size, o.weight || 600, o.mono);
    const w = (o.markup ? mwidth(ctx, s, { size, weight: o.weight || 600, mono: o.mono }) : ctx.measureText(s).width) + (o.padX ?? 18) * 2;
    const h = size + (o.padY ?? 12) * 2;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    rrect(ctx, x0, y - h / 2, w, h, o.r ?? h / 2, o.fill || COL.panel2, o.stroke || null, o.lw || 2);
    if (o.markup) mtxt(ctx, s, x0 + w / 2, y + 1, { size, weight: o.weight || 600, align: 'center', base: 'middle', color: o.color, mono: o.mono });
    else txt(ctx, s, x0 + w / 2, y + 1, { size, weight: o.weight || 600, align: 'center', base: 'middle', color: o.color || COL.text, mono: o.mono });
    ctx.restore();
    return w;
  }
  function box(ctx, x, y, w, h, title, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; }
    rrect(ctx, x, y, w, h, o.r ?? 16, o.fill || COL.panel, o.stroke || COL.line, o.lw || 2);
    ctx.shadowBlur = 0;
    if (title) {
      const lines = Array.isArray(title) ? title : [title];
      const size = o.size || 30, lh = size * 1.25;
      const y0 = y + h / 2 - (lines.length - 1) * lh / 2;
      lines.forEach((l, i) => mtxt(ctx, l, x + w / 2, y0 + i * lh, { size: i === 0 ? size : size * 0.72, weight: i === 0 ? (o.weight || 700) : 400, align: 'center', base: 'middle', color: i === 0 ? (o.color || COL.text) : COL.dim }));
    }
    ctx.restore();
  }
  // grid of cells
  function cells(ctx, x, y, rows, cols, cw, ch, fn, gap = 2) {
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const f = fn(r, c);
        if (!f) continue;
        ctx.fillStyle = f;
        ctx.fillRect(x + c * cw + gap / 2, y + r * ch + gap / 2, cw - gap, ch - gap);
      }
  }
  // matrix block: rectangle filled with value-coloured cells
  function mat(ctx, x, y, w, h, o = {}) {
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    const rows = o.rows || Math.max(1, Math.round(h / 14)), cols = o.cols || Math.max(1, Math.round(w / 14));
    const seed = o.seed || 1;
    rrect(ctx, x - 3, y - 3, w + 6, h + 6, 6, COL.bg2, null);
    cells(ctx, x, y, rows, cols, w / cols, h / rows, o.fn || ((r, c) => vcol(noise(r, c, seed) * 0.95, o.cellAlpha ?? 0.9)), o.gap ?? 2);
    rrect(ctx, x - 3, y - 3, w + 6, h + 6, 6, null, o.stroke || COL.line, o.lw || 2);
    if (o.top) dimTop(ctx, x, y - 6, w, o.top[0], o.top[1], o.labelSize);
    if (o.left) dimLeft(ctx, x - 6, y, h, o.left[0], o.left[1], o.labelSize);
    if (o.bottom) dimBottom(ctx, x, y + h + 6, w, o.bottom[0], o.bottom[1], o.labelSize);
    if (o.right) dimRight(ctx, x + w + 6, y, h, o.right[0], o.right[1], o.labelSize);
    if (o.title) mtxt(ctx, o.title, x + w / 2, y - (o.top ? 62 : 22), { size: o.titleSize || 28, weight: 700, align: 'center', color: o.titleColor || COL.text });
    ctx.restore();
  }
  function dimTop(ctx, x, y, w, label, color, size = 24) {
    const yy = y - 10;
    ctx.save(); ctx.strokeStyle = rgba(color, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, yy + 6); ctx.lineTo(x, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x + w, yy + 6); ctx.stroke(); ctx.restore();
    mtxt(ctx, label, x + w / 2, yy - 10, { size, weight: 700, align: 'center', color });
  }
  function dimBottom(ctx, x, y, w, label, color, size = 24) {
    const yy = y + 10;
    ctx.save(); ctx.strokeStyle = rgba(color, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, yy - 6); ctx.lineTo(x, yy); ctx.lineTo(x + w, yy); ctx.lineTo(x + w, yy - 6); ctx.stroke(); ctx.restore();
    mtxt(ctx, label, x + w / 2, yy + size + 4, { size, weight: 700, align: 'center', color });
  }
  function dimLeft(ctx, x, y, h, label, color, size = 24) {
    const xx = x - 10;
    ctx.save(); ctx.strokeStyle = rgba(color, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xx + 6, y); ctx.lineTo(xx, y); ctx.lineTo(xx, y + h); ctx.lineTo(xx + 6, y + h); ctx.stroke(); ctx.restore();
    mtxt(ctx, label, xx - 10, y + h / 2, { size, weight: 700, align: 'right', base: 'middle', color });
  }
  function dimRight(ctx, x, y, h, label, color, size = 24) {
    const xx = x + 10;
    ctx.save(); ctx.strokeStyle = rgba(color, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(xx - 6, y); ctx.lineTo(xx, y); ctx.lineTo(xx, y + h); ctx.lineTo(xx - 6, y + h); ctx.stroke(); ctx.restore();
    mtxt(ctx, label, xx + 10, y + h / 2, { size, weight: 700, align: 'left', base: 'middle', color });
  }
  // stacked slabs to suggest extra leading dimensions (batch, heads, layers)
  function stack(ctx, n, dx, dy, drawOne) {
    for (let i = n - 1; i >= 0; i--) { ctx.save(); ctx.translate(i * dx, -i * dy); drawOne(i); ctx.restore(); }
  }
  // number cells with values printed inside
  function numRow(ctx, x, y, vals, cw, ch, o = {}) {
    vals.forEach((v, i) => {
      const hl = o.hl && o.hl(i);
      rrect(ctx, x + i * cw + 3, y, cw - 6, ch, 8, o.fill ? o.fill(i, v) : vcol(v * (o.scale ?? 1), 0.35), hl ? (o.hlColor || COL.K) : (o.stroke || COL.line), hl ? 3 : 2);
      if (v !== null && v !== undefined && !o.hideVals)
        txt(ctx, typeof v === 'string' ? v : fmt(v, o.d ?? 2), x + i * cw + cw / 2, y + ch / 2 + 1, { size: o.size || 24, weight: 600, align: 'center', base: 'middle', mono: true, color: o.color || COL.text, alpha: o.valAlpha ? o.valAlpha(i) : 1 });
    });
  }
  function numMat(ctx, x, y, M, cw, ch, o = {}) {
    M.forEach((row, r) => row.forEach((v, c) => {
      const a = o.cellAlpha ? o.cellAlpha(r, c) : 1;
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha *= a;
      const hl = o.hl && o.hl(r, c);
      rrect(ctx, x + c * cw + 2, y + r * ch + 2, cw - 4, ch - 4, 6, o.fill ? o.fill(r, c, v) : vcol(v * (o.scale ?? 0.6), 0.4), hl ? (o.hlColor || COL.K) : COL.line, hl ? 3 : 1.5);
      txt(ctx, o.fmt ? o.fmt(v) : fmt(v, o.d ?? 2), x + c * cw + cw / 2, y + r * ch + ch / 2 + 1, { size: o.size || 22, weight: 600, align: 'center', base: 'middle', mono: true, color: o.color || COL.text });
      ctx.restore();
    }));
  }
  function brace(ctx, x1, x2, y, color, down = true) {
    const h = down ? 12 : -12, m = (x1 + x2) / 2;
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.quadraticCurveTo(x1, y + h, x1 + 12, y + h);
    ctx.lineTo(m - 12, y + h); ctx.quadraticCurveTo(m, y + h, m, y + 2 * h);
    ctx.quadraticCurveTo(m, y + h, m + 12, y + h); ctx.lineTo(x2 - 12, y + h);
    ctx.quadraticCurveTo(x2, y + h, x2, y); ctx.stroke(); ctx.restore();
  }
  function cross(ctx, x, y, s, color = COL.R, lw = 6) {
    line(ctx, x - s, y - s, x + s, y + s, color, lw); line(ctx, x - s, y + s, x + s, y - s, color, lw);
  }

  // ---------- synthetic speech-like waveform (1 s @ 16 kHz) ----------
  const WAVE = (function () {
    const n = 16000, x = new Float32Array(n), rnd = mulberry32(11);
    const syl = [[0.10, 0.055, 1.0], [0.25, 0.06, 0.8], [0.40, 0.05, 1.0], [0.56, 0.07, 0.7], [0.72, 0.05, 0.95], [0.87, 0.06, 0.6]];
    const fric = [[0.33, 0.02], [0.64, 0.025]];
    let ph = 0, mx = 0;
    const PH = [0, 0, 2.1, 4.0, 1.3, 5.2, 0.7, 3.3, 2.8, 5.9, 1.9, 4.4, 0.4, 3.9, 2.4];
    for (let i = 0; i < n; i++) {
      const t = i / 16000;
      const f0 = 125 + 25 * Math.sin(2 * Math.PI * 1.3 * t) + 12 * Math.sin(2 * Math.PI * 3.3 * t);
      ph += 2 * Math.PI * f0 / 16000;
      let s = 0;
      for (let h = 1; h <= 14; h++) {
        const fh = f0 * h;
        const g = Math.exp(-Math.pow((fh - 650) / 260, 2)) + 0.7 * Math.exp(-Math.pow((fh - 1150) / 320, 2)) + 0.35 * Math.exp(-Math.pow((fh - 2450) / 420, 2)) + 0.15;
        s += g * Math.sin(h * ph + PH[h]) / Math.sqrt(h);
      }
      let env = 0;
      for (const [c, w, a] of syl) env += a * Math.exp(-Math.pow((t - c) / w, 2));
      let fn = 0;
      for (const [c, w] of fric) fn += Math.exp(-Math.pow((t - c) / w, 2));
      x[i] = s * env + (rnd() * 2 - 1) * (0.9 * fn + 0.02);
      mx = Math.max(mx, Math.abs(x[i]));
    }
    for (let i = 0; i < n; i++) x[i] = x[i] / mx * 0.9;
    return x;
  })();
  function drawWave(ctx, x, y, w, h, o = {}) {
    const a = o.from ?? 0, b = o.to ?? WAVE.length, n = b - a, gain = o.gain ?? 1;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || COL.T; ctx.lineWidth = o.lw || 2;
    ctx.beginPath();
    const cols = Math.max(2, Math.floor(w * (o.reveal ?? 1)));
    for (let px = 0; px < cols; px++) {
      const i0 = a + Math.floor(px / w * n), i1 = Math.max(i0 + 1, a + Math.floor((px + 1) / w * n));
      let lo = 1e9, hi = -1e9;
      for (let i = i0; i < i1 && i < b; i++) { const v = WAVE[i] * gain; if (v < lo) lo = v; if (v > hi) hi = v; }
      ctx.moveTo(x + px, y - hi * h / 2); ctx.lineTo(x + px, y - lo * h / 2 + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  // ---------- timeline ----------
  const SCENES = window.SCENES = window.SCENES || [];
  let TL = null;
  function buildTimeline() {
    const src = window.TIMELINE;
    let t = 0;
    const scenes = SCENES.map((s, si) => {
      const ts = src && src.scenes && src.scenes[si] && src.scenes[si].id === s.id && src.scenes[si].beats.length === s.beats.length ? src.scenes[si] : null;
      const lead = ts ? ts.lead : 0.6, tail = ts ? ts.tail : 1.0;
      let bt = lead;
      const beats = s.beats.map((text, bi) => {
        // animation delays are authored in "design time" (≈ 2.55 words/s); k maps them onto the real narration
        const words = text.split(/\s+/).length;
        const est = Math.max(2.5, words / 2.55 + 0.6);
        const dur = ts ? ts.beats[bi].dur : est;
        const b = { start: bt, dur, k: dur / est, text, sentences: ts ? ts.beats[bi].sentences : [{ text, start: 0, dur: dur - 0.5 }] };
        bt += dur;
        return b;
      });
      const sc = { scene: s, index: si, start: t, dur: bt + tail, lead, beats };
      t += sc.dur;
      return sc;
    });
    TL = { scenes, total: t, fromAudio: !!src };
    return TL;
  }

  function makeS(sc, t) {
    const beats = sc.beats;
    let b = 0;
    for (let i = 0; i < beats.length; i++) if (t >= beats[i].start) b = i;
    const S = {
      t, b, sc,
      T: i => i < beats.length ? (t - beats[i].start) / beats[i].k : t - sc.dur,
      p: (i, d = 0.8, dl = 0) => easeIO((S.T(i) - dl) / d),
      l: (i, d = 1, dl = 0) => clamp((S.T(i) - dl) / d),
      f: i => clamp(S.T(i) * beats[i].k / beats[i].dur),
      bd: i => beats[i].dur / beats[i].k,
      vis: (a, z, din = 0.7, dout = 0.5) => S.p(a, din) * (z == null ? 1 : 1 - S.p(z, dout)),
      on: i => S.T(i) >= 0,
    };
    return S;
  }

  // ---------- chrome: header, HUD, background ----------
  const STAGES = (window.VIDEO && window.VIDEO.stages) || ['Waveform', 'Feature encoder', 'Projection', 'Masking', 'Pos-conv', 'Transformer ×12', 'Output'];
  let bgPattern = null;
  function background(ctx) {
    if (!bgPattern) {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(W * 0.5, H * 0.45, 100, W * 0.5, H * 0.5, W * 0.75);
      grd.addColorStop(0, '#0e1420'); grd.addColorStop(1, '#070a10');
      g.fillStyle = grd; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(120,140,170,0.07)';
      for (let x = 20; x < W; x += 40) for (let y = 20; y < H; y += 40) g.fillRect(x, y, 2, 2);
      bgPattern = c;
    }
    ctx.drawImage(bgPattern, 0, 0);
  }
  function header(ctx, sc, gt) {
    const s = sc.scene;
    if (s.noHeader) return;
    txt(ctx, String(s.chapter).padStart(2, '0'), 70, 70, { size: 30, weight: 800, color: COL.A, mono: true });
    txt(ctx, s.title, 130, 70, { size: 34, weight: 700 });
    const code = typeof s.code === 'function' ? s.code(makeS(sc, gt - sc.start)) : s.code;
    if (code) {
      ctx.font = font(20, 500, true);
      const w = ctx.measureText(code).width + 28;
      rrect(ctx, W - 70 - w, 44, w, 34, 8, 'rgba(57,208,216,0.08)', 'rgba(57,208,216,0.35)', 1.5);
      txt(ctx, code, W - 70 - w / 2, 62, { size: 20, weight: 500, align: 'center', base: 'middle', mono: true, color: COL.A });
    } else {
      txt(ctx, ((window.VIDEO && window.VIDEO.title) || 'wav2vec 2.0') + ' · following the numbers', W - 70, 68, { size: 22, weight: 500, align: 'right', color: COL.faint });
    }
    ctx.fillStyle = COL.line; ctx.fillRect(70, 94, W - 140, 2);
    ctx.fillStyle = COL.A; ctx.fillRect(70, 94, (W - 140) * clamp(gt / TL.total), 2);
  }
  function hud(ctx, S) {
    const s = S.sc.scene;
    const h = typeof s.hud === 'function' ? s.hud(S) : s.hud;
    if (!h) return;
    const y0 = 1000;
    ctx.save();
    rrect(ctx, 40, y0, W - 80, 64, 14, 'rgba(19,27,40,0.92)', COL.line, 2);
    let x = 64;
    STAGES.forEach((st, i) => {
      const active = i === h.stage, past = h.stage != null && i < h.stage;
      ctx.font = font(20, 600);
      const w = ctx.measureText(st).width + 28;
      rrect(ctx, x, y0 + 16, w, 32, 16, active ? rgba(COL.A, 0.22) : 'rgba(0,0,0,0)', active ? COL.A : null, 2);
      txt(ctx, st, x + w / 2, y0 + 33, { size: 20, weight: 600, align: 'center', base: 'middle', color: active ? COL.A : past ? COL.dim : COL.faint });
      x += w + 4;
      if (i < STAGES.length - 1) { txt(ctx, '›', x + 4, y0 + 33, { size: 24, weight: 600, base: 'middle', color: COL.faint }); x += 20; }
    });
    if (h.shape) {
      txt(ctx, h.label || 'tensor shape', W - 70 - Math.max(360, mwidth(ctx, h.shape, { size: 32, mono: true })) - 20, y0 + 34, { size: 18, weight: 600, color: COL.dim, align: 'right', base: 'middle' });
      mtxt(ctx, h.shape, W - 70, y0 + 34, { size: 32, mono: true, align: 'right', base: 'middle', color: COL.dim });
    }
    ctx.restore();
  }

  // ---------- render ----------
  let canvas = null, ctx = null;
  function init(c) {
    canvas = c; ctx = c.getContext('2d');
    buildTimeline();
    return TL;
  }
  function sceneAt(t) {
    for (const sc of TL.scenes) if (t < sc.start + sc.dur) return sc;
    return TL.scenes[TL.scenes.length - 1];
  }
  function renderAt(t) {
    t = clamp(t, 0, TL.total - 1e-6);
    const sc = sceneAt(t), local = t - sc.start;
    const S = makeS(sc, local);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    background(ctx);
    header(ctx, sc, t);
    ctx.save();
    try { sc.scene.draw(ctx, S); } catch (e) { console.error(e); txt(ctx, 'ERR ' + e.message, 100, 500, { color: COL.R }); }
    ctx.restore();
    hud(ctx, S);
    const fin = clamp(local / 0.45), fout = clamp((sc.dur - local) / 0.45);
    const a = 1 - Math.min(fin, fout);
    if (a > 0) { ctx.fillStyle = `rgba(7,10,16,${a})`; ctx.fillRect(0, 0, W, H); }
    return { scene: sc.index, S };
  }
  function captionAt(t) {
    const sc = sceneAt(t), local = t - sc.start;
    for (const b of sc.beats) {
      if (local < b.start || local > b.start + b.dur) continue;
      for (const s of b.sentences) if (local >= b.start + s.start - 0.05 && local <= b.start + s.start + s.dur + 0.3) return s.text;
    }
    return '';
  }

  window.E = {
    W, H, COL, clamp, lerp, easeIO, easeOut, noise, mulberry32, fmt, fmtInt, rgba, mix, vcol, scol, font,
    txt, rich, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box, cells, mat, dimTop, dimLeft, dimBottom, dimRight,
    stack, numRow, numMat, brace, cross, WAVE, drawWave, init, renderAt, captionAt, buildTimeline, get TL() { return TL; },
  };
})();
