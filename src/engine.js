// Deterministic canvas animation engine: renderAt(t) draws the frame for time t (seconds).
// Used both by the interactive player (index.html) and the frame renderer (tools/render.py).
//
// Motion layer (v2): every primitive knows when it is *entering* (its alpha comes from an
// S.p() tween that is still running) and performs a real entrance instead of a plain fade:
// text rises and wipes on, panels trace their border with a pen tip, matrices materialise
// cell by cell, chips spring in. Scene boundaries are velocity-matched "cut the curve" moves
// (after HyperFrames' motion doctrine); each chapter opens on a title card that docks into the
// header. spring()/track()/glow() follow motion-graphic-skill (MIT, github.com/JakeB-5).
(function () {
  const W = 1920, H = 1080;
  const COL = {
    bg: '#0a0e16', bg2: '#0f1520', panel: '#131b28', panel2: '#1a2435', line: '#2b374b',
    text: '#e9eef6', dim: '#8d9bb0', faint: '#526075',
    B: '#7ee787', T: '#58a6ff', C: '#ffa657', H: '#d2a8ff', D: '#ff7b9c', K: '#f2cc60',
    A: '#39d0d8', R: '#ff6b6b', G: '#7ee787', W: '#e9eef6', M: '#c792ea',
    F: '#39d0d8', N: '#d2a8ff', S: '#f2cc60', E: '#c792ea', P: '#ff7b9c',
  };
  const THEME = Object.assign({ a: '#39d0d8', b: '#5b7cff', c: '#b06cff' }, (window.VIDEO && window.VIDEO.theme) || {});

  // ---------- math ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
  const easeIn4 = t => { t = clamp(t); return t * t * t * t; };
  const easeOut4 = t => { t = clamp(t); return 1 - Math.pow(1 - t, 4); };
  const easeOutExpo = t => { t = clamp(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  const easeOutBack = (t, s = 1.6) => { t = clamp(t); const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
  // closed-form damped spring 0 -> 1 (t in seconds since the move began); pure function of time
  function spring(t, k = 170, d = 26) {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(k), z = d / (2 * w0);
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
    if (z > 1.001) { const s = w0 * Math.sqrt(z * z - 1), r1 = -z * w0 + s, r2 = -z * w0 - s; return 1 - (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1); }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  }
  const SPRING = { snappy: [320, 28], soft: [170, 26], heavy: [90, 19], playful: [220, 16] };
  // a value that retargets several times: keys = [[time, value], ...] sorted by time
  function track(t, keys, k = 170, d = 26) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) { if (t < keys[i][0]) break; v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d); }
    return v;
  }
  // slow-fast-slow group move (nudge curve): ramp-in 20 % / burst 18 % / long tail 62 %
  function nudge(t) {
    t = clamp(t);
    if (t < 0.2) return 0.1 * Math.pow(t / 0.2, 3);
    if (t < 0.38) return 0.1 + 0.65 * (t - 0.2) / 0.18;
    return 0.75 + 0.25 * (1 - Math.pow(1 - (t - 0.38) / 0.62, 4));
  }
  function noise(a, b, c = 0) {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return ((h >>> 0) / 4294967295) * 2 - 1;
  }
  const hash01 = (a, b = 0, c = 0) => noise(a, b, c) * 0.5 + 0.5;
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
  const isHex = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
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

  // ---------- global frame state ----------
  let GT = 0;                 // global time of the frame being drawn
  const ENTER = new Map();    // alpha values produced by running S.p() entrance tweens -> raw progress
  let MOTION = 0;             // >0 while a parent primitive performs an entrance (children stay put)
  function markEnter(v, r) { if (v > 0 && v < 1) { ENTER.set(v, r); ENTER.set(Math.fround(v), r); } }
  function enteringOf(a) {
    if (!(a > 0 && a < 1)) return -1;
    let r = ENTER.get(a);
    if (r === undefined) r = ENTER.get(Math.fround(a));
    return r === undefined ? -1 : r;
  }
  function entering(ctx, o) {
    if (MOTION) return -1;
    const r = enteringOf(o && o.alpha);
    return r >= 0 ? r : enteringOf(ctx.globalAlpha);
  }

  // ---------- light ----------
  function glow(ctx, x, y, r, c, a = 1) {
    if (a <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, isHex(c) ? rgba(c, 0.9) : c); g.addColorStop(0.35, isHex(c) ? rgba(c, 0.25) : c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function penTip(ctx, x, y, c, a = 1) {
    glow(ctx, x, y, 34, c, 0.9 * a);
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); ctx.restore();
  }

  // ---------- text ----------
  const SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
  const MONO = "'JetBrains Mono', Menlo, monospace";
  const DISPLAY = "'Bricolage Grotesque', Inter, 'Helvetica Neue', Arial, sans-serif";
  const font = (size, weight = 400, mono = false) => `${weight} ${size}px ${mono === 'display' ? DISPLAY : mono ? MONO : SANS}`;

  // text entrance: rise + left-to-right mask wipe; x0/w are the text's horizontal extent
  function textEnter(ctx, r, x0, w, y, size) {
    const e = easeOutExpo(r * 1.15);
    ctx.translate(0, (1 - e) * Math.max(14, size * 0.5));
    const wipe = easeOut(r * 1.35);
    if (wipe < 1) { ctx.beginPath(); ctx.rect(x0 - 6, y - size * 1.6, (w + 12) * wipe + 2, size * 3.2); ctx.clip(); }
  }
  function txt(ctx, s, x, y, o = {}) {
    ctx.save();
    const r = entering(ctx, o);
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(o.size || 32, o.weight || 400, o.mono);
    ctx.fillStyle = o.color || COL.text;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    if (r >= 0) {
      const w = ctx.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const yc = o.base === 'middle' ? y + (o.size || 32) * 0.35 : y;
      textEnter(ctx, r, x0, w, yc, o.size || 32);
    }
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  // parts: [[text, color, weight], ...]
  function rich(ctx, parts, x, y, o = {}) {
    ctx.save();
    const r = entering(ctx, o);
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.textAlign = 'left';
    const size = o.size || 32;
    const ws = parts.map(p => { ctx.font = font(size, p[2] || o.weight || 400, o.mono); return ctx.measureText(p[0]).width; });
    const total = ws.reduce((a, b) => a + b, 0);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    if (r >= 0) textEnter(ctx, r, cx, total, o.base === 'middle' ? y + size * 0.35 : y, size);
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
  function rrPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function rrect(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
    rrPath(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  // point at fraction f of a rounded rectangle's perimeter, starting top-left, clockwise
  function perimPoint(x, y, w, h, f) {
    const P = 2 * (w + h); let d = ((f % 1) + 1) % 1 * P;
    if (d < w) return [x + d, y]; d -= w;
    if (d < h) return [x + w, y + d]; d -= h;
    if (d < w) return [x + w - d, y + h]; d -= w;
    return [x, y + h - d];
  }
  // border drawn up to fraction p (pen tip at the end) — used by entering panels
  function traceBorder(ctx, x, y, w, h, r, color, lw, p) {
    const P = 2 * (w + h) - (8 - 2 * Math.PI) * Math.min(r, w / 2, h / 2);
    ctx.save();
    ctx.setLineDash([P * p, P + 10]);
    rrect(ctx, x, y, w, h, r, null, color, lw);
    ctx.restore();
    if (p < 1) { const [px, py] = perimPoint(x, y, w, h, p); penTip(ctx, px, py, isHex(color) ? color : COL.A, 1 - p * 0.3); }
  }
  function line(ctx, x1, y1, x2, y2, color, lw = 2, dash) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }
  // a pulse of data travelling along a finished connector (meaningful motion: the flow direction)
  function dataPulse(ctx, pts, col, seed) {
    if (MOTION || ctx.globalAlpha < 0.95) return;
    const period = 2.6, ph = (GT / period + hash01(seed, 7)) % 1;
    if (ph > 0.55) return;
    const u = easeIO(ph / 0.55);
    let L = 0; const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(l); L += l; }
    if (L < 40) return;
    let d = u * L, i = 0;
    while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
    const f = seg[i] ? d / seg[i] : 0, x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
    const fade = Math.sin(Math.PI * clamp(ph / 0.55));
    glow(ctx, x, y, 16, isHex(col) ? col : COL.A, 0.55 * fade);
    ctx.save(); ctx.globalAlpha *= 0.85 * fade; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); ctx.restore();
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
    if (p < 1) penTip(ctx, ex, ey, isHex(col) && col !== COL.dim ? col : COL.A, 0.8);
    else if (!o.dash && !o.noPulse) dataPulse(ctx, [[x1, y1], [x2, y2]], isHex(col) && col !== COL.dim ? col : COL.A, Math.round(x1 * 7 + y1 * 13 + x2));
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
    arrow(ctx, a[0], a[1], b[0], b[1], Object.assign({}, o, { noPulse: true }));
    if (!o.dash && (o.p ?? 1) >= 1) {
      ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
      const col = o.color || COL.dim;
      dataPulse(ctx, pts, isHex(col) && col !== COL.dim ? col : COL.A, Math.round(pts[0][0] * 7 + pts[0][1] * 13));
      ctx.restore();
    }
  }
  function chip(ctx, x, y, s, o = {}) {
    ctx.save();
    const r = entering(ctx, o);
    ctx.globalAlpha *= o.alpha ?? 1;
    const size = o.size || 24;
    ctx.font = font(size, o.weight || 600, o.mono);
    const w = (o.markup ? mwidth(ctx, s, { size, weight: o.weight || 600, mono: o.mono }) : ctx.measureText(s).width) + (o.padX ?? 18) * 2;
    const h = size + (o.padY ?? 12) * 2;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if (r >= 0) {
      MOTION++;
      const sc = lerp(0.55, 1, easeOutBack(r * 1.25, 1.9));
      ctx.translate(x0 + w / 2, y); ctx.scale(sc, sc); ctx.translate(-(x0 + w / 2), -y);
    }
    try {
      rrect(ctx, x0, y - h / 2, w, h, o.r ?? h / 2, o.fill || COL.panel2, o.stroke || null, o.lw || 2);
      if (o.markup) mtxt(ctx, s, x0 + w / 2, y + 1, { size, weight: o.weight || 600, align: 'center', base: 'middle', color: o.color, mono: o.mono });
      else txt(ctx, s, x0 + w / 2, y + 1, { size, weight: o.weight || 600, align: 'center', base: 'middle', color: o.color || COL.text, mono: o.mono });
      if (r >= 0 && r < 0.6) glow(ctx, x0 + w / 2, y, w * 0.6, isHex(o.color) ? o.color : COL.A, 0.35 * (1 - r / 0.6));
    } finally { if (r >= 0) MOTION--; }
    ctx.restore();
    return w;
  }
  // soft two-layer drop shadow (cheap; no shadowBlur)
  function softShadow(ctx, x, y, w, h, r) {
    rrect(ctx, x - 3, y + 7, w + 6, h + 8, r + 3, 'rgba(0,0,0,0.20)', null);
    rrect(ctx, x - 9, y + 14, w + 18, h + 14, r + 9, 'rgba(0,0,0,0.10)', null);
  }
  function panelFill(ctx, x, y, h, base) {
    if (base && base !== COL.panel) return base;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#182235'); g.addColorStop(1, '#0f1622');
    return g;
  }
  function box(ctx, x, y, w, h, title, o = {}) {
    ctx.save();
    const r = entering(ctx, o);
    ctx.globalAlpha *= o.alpha ?? 1;
    const rad = o.r ?? 16, stroke = o.stroke || COL.line, lw = o.lw || 2;
    if (r >= 0) {
      MOTION++;
      const sc = lerp(0.93, 1, easeOutBack(r * 1.1, 1.2));
      ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    try {
      if (!o.flat) softShadow(ctx, x, y, w, h, rad);
      if (o.glow) {
        rrect(ctx, x - 5, y - 5, w + 10, h + 10, rad + 5, null, rgba(isHex(o.glow) ? o.glow : COL.A, 0.16), 10);
        rrect(ctx, x - 2, y - 2, w + 4, h + 4, rad + 2, null, rgba(isHex(o.glow) ? o.glow : COL.A, 0.30), 4);
      }
      rrect(ctx, x, y, w, h, rad, panelFill(ctx, x, y, h, o.fill), null);
      // top inner highlight
      ctx.save(); rrPath(ctx, x, y, w, h, rad); ctx.clip();
      const hg = ctx.createLinearGradient(0, y, 0, y + 26); hg.addColorStop(0, 'rgba(255,255,255,0.07)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg; ctx.fillRect(x, y, w, 26); ctx.restore();
      if (r >= 0) traceBorder(ctx, x, y, w, h, rad, stroke === COL.line ? mix(COL.line, '#6b7fa0', 0.5) : stroke, lw, easeOut(r * 1.2));
      else rrect(ctx, x, y, w, h, rad, null, stroke, lw);
      if (o.glow && r < 0) {
        const [px, py] = perimPoint(x, y, w, h, (GT * 0.22) % 1);
        glow(ctx, px, py, 26, isHex(o.glow) ? o.glow : COL.A, 0.8);
      }
      if (title) {
        const lines = Array.isArray(title) ? title : [title];
        const size = o.size || 30, lh = size * 1.25;
        const y0 = y + h / 2 - (lines.length - 1) * lh / 2;
        const rise = r >= 0 ? (1 - easeOutExpo(r * 1.2)) * 12 : 0;
        lines.forEach((l, i) => mtxt(ctx, l, x + w / 2, y0 + i * lh + rise * (1 + i * 0.6), { size: i === 0 ? size : size * 0.72, weight: i === 0 ? (o.weight || 700) : 400, align: 'center', base: 'middle', color: i === 0 ? (o.color || COL.text) : COL.dim }));
      }
    } finally { if (r >= 0) MOTION--; }
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
  // matrix block: rectangle filled with value-coloured cells, drawn as a slab with depth
  function mat(ctx, x, y, w, h, o = {}) {
    ctx.save();
    const r = entering(ctx, o);
    ctx.globalAlpha *= o.alpha ?? 1;
    const rows = o.rows || Math.max(1, Math.round(h / 14)), cols = o.cols || Math.max(1, Math.round(w / 14));
    const seed = o.seed || 1;
    if (r >= 0) {
      MOTION++;
      const sc = lerp(0.95, 1, easeOut(r * 1.2));
      ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    try {
      const d = o.flat ? 0 : Math.min(9, Math.max(4, Math.min(w, h) * 0.05));
      if (d > 0) {
        ctx.fillStyle = '#0c121c';
        ctx.beginPath(); ctx.moveTo(x - 3, y - 3); ctx.lineTo(x - 3 + d, y - 3 - d); ctx.lineTo(x + w + 3 + d, y - 3 - d); ctx.lineTo(x + w + 3 + d, y + h + 3 - d); ctx.lineTo(x + w + 3, y + h + 3); ctx.lineTo(x + w + 3, y - 3); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = rgba('#8aa0c0', 0.18); ctx.lineWidth = 1.2; ctx.stroke();
      }
      rrect(ctx, x - 3, y - 3, w + 6, h + 6, 6, COL.bg2, null);
      const base = o.fn || ((rr, c) => vcol(noise(rr, c, seed) * 0.95, o.cellAlpha ?? 0.9));
      let fn = base;
      if (r >= 0) {
        const p = r * 1.7;
        fn = (rr, c) => {
          const k = clamp((p - ((c + 0.5) / cols) * 0.75 - ((rr + 0.5) / rows) * 0.25) / 0.22);
          if (k <= 0) return null;
          if (k < 1) return k < 0.45 ? rgba('#e8f6ff', 0.85 * k / 0.45) : base(rr, c);
          return base(rr, c);
        };
      }
      cells(ctx, x, y, rows, cols, w / cols, h / rows, fn, o.gap ?? 2);
      rrect(ctx, x - 3, y - 3, w + 6, h + 6, 6, null, o.stroke || COL.line, o.lw || 2);
      if (o.top) dimTop(ctx, x, y - 6, w, o.top[0], o.top[1], o.labelSize);
      if (o.left) dimLeft(ctx, x - 6, y, h, o.left[0], o.left[1], o.labelSize);
      if (o.bottom) dimBottom(ctx, x, y + h + 6, w, o.bottom[0], o.bottom[1], o.labelSize);
      if (o.right) dimRight(ctx, x + w + 6, y, h, o.right[0], o.right[1], o.labelSize);
      if (o.title) mtxt(ctx, o.title, x + w / 2, y - (o.top ? 62 : 22) - (d > 0 && !o.top ? d : 0), { size: o.titleSize || 28, weight: 700, align: 'center', color: o.titleColor || COL.text });
    } finally { if (r >= 0) MOTION--; }
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
    const r = entering(ctx, o);
    if (r >= 0) MOTION++;
    try {
      vals.forEach((v, i) => {
        let k = 1;
        ctx.save();
        if (r >= 0) {
          k = clamp(r * 1.6 - (i / Math.max(1, vals.length)) * 0.6);
          if (k <= 0) { ctx.restore(); return; }
          ctx.globalAlpha *= clamp(k * 2);
          ctx.translate(0, (1 - easeOutBack(k, 1.4)) * 18);
        }
        const hl = o.hl && o.hl(i);
        rrect(ctx, x + i * cw + 3, y, cw - 6, ch, 8, o.fill ? o.fill(i, v) : vcol(v * (o.scale ?? 1), 0.35), hl ? (o.hlColor || COL.K) : (o.stroke || COL.line), hl ? 3 : 2);
        if (hl && r < 0) glow(ctx, x + i * cw + cw / 2, y + ch / 2, Math.max(cw, ch) * 0.75, o.hlColor || COL.K, 0.22);
        if (v !== null && v !== undefined && !o.hideVals)
          txt(ctx, typeof v === 'string' ? v : fmt(v, o.d ?? 2), x + i * cw + cw / 2, y + ch / 2 + 1, { size: o.size || 24, weight: 600, align: 'center', base: 'middle', mono: true, color: o.color || COL.text, alpha: o.valAlpha ? o.valAlpha(i) : 1 });
        ctx.restore();
      });
    } finally { if (r >= 0) MOTION--; }
  }
  function numMat(ctx, x, y, M, cw, ch, o = {}) {
    const r = entering(ctx, o);
    if (r >= 0) MOTION++;
    const rows = M.length, cols = M[0] ? M[0].length : 1;
    try {
      M.forEach((row, ri) => row.forEach((v, c) => {
        let a = o.cellAlpha ? o.cellAlpha(ri, c) : 1;
        if (a <= 0) return;
        ctx.save();
        if (r >= 0) {
          const k = clamp(r * 1.6 - ((c / cols) * 0.4 + (ri / rows) * 0.3));
          if (k <= 0) { ctx.restore(); return; }
          a *= clamp(k * 2);
          const s = lerp(0.6, 1, easeOutBack(k, 1.5)), cx = x + c * cw + cw / 2, cy = y + ri * ch + ch / 2;
          ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
        }
        ctx.globalAlpha *= a;
        const hl = o.hl && o.hl(ri, c);
        rrect(ctx, x + c * cw + 2, y + ri * ch + 2, cw - 4, ch - 4, 6, o.fill ? o.fill(ri, c, v) : vcol(v * (o.scale ?? 0.6), 0.4), hl ? (o.hlColor || COL.K) : COL.line, hl ? 3 : 1.5);
        txt(ctx, o.fmt ? o.fmt(v) : fmt(v, o.d ?? 2), x + c * cw + cw / 2, y + ri * ch + ch / 2 + 1, { size: o.size || 22, weight: 600, align: 'center', base: 'middle', mono: true, color: o.color || COL.text });
        ctx.restore();
      }));
    } finally { if (r >= 0) MOTION--; }
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
    const rev = o.reveal ?? 1;
    const cols = Math.max(2, Math.floor(w * rev));
    for (let px = 0; px < cols; px++) {
      const i0 = a + Math.floor(px / w * n), i1 = Math.max(i0 + 1, a + Math.floor((px + 1) / w * n));
      let lo = 1e9, hi = -1e9;
      for (let i = i0; i < i1 && i < b; i++) { const v = WAVE[i] * gain; if (v < lo) lo = v; if (v > hi) hi = v; }
      ctx.moveTo(x + px, y - hi * h / 2); ctx.lineTo(x + px, y - lo * h / 2 + 0.5);
    }
    ctx.stroke();
    ctx.restore();
    if (rev > 0 && rev < 1) { ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; penTip(ctx, x + cols, y, o.color && isHex(o.color) ? o.color : COL.T, 0.9); ctx.restore(); }
  }

  // ---------- title-sequence helpers (cold opens, end cards) ----------
  // per-character waterfall in the display face, filled with a light gradient
  function titleRise(ctx, s, x, y, t, o = {}) {
    const size = o.size || 150;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(size, 700, 'display'); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const w = ctx.measureText(s).width;
    const g = ctx.createLinearGradient(x, y - size, x + w, y);
    g.addColorStop(0, o.c1 || '#ffffff'); g.addColorStop(0.55, o.c1 || '#ffffff'); g.addColorStop(1, o.c2 || THEME.a);
    let cx = x;
    [...s].forEach((ch, i) => {
      const t0 = (o.delay || 0) + i * (o.stagger ?? 0.04) * Math.pow(0.94, i);
      const cw = ctx.measureText(ch).width;
      if (t > t0) {
        const e = easeOut4((t - t0) / 0.46);
        ctx.save(); ctx.translate(0, (1 - e) * size * 0.5); ctx.fillStyle = g; ctx.fillText(ch, cx, y); ctx.restore();
      }
      cx += cw;
    });
    ctx.restore();
    return w;
  }
  // typed-on mono label with a block cursor
  function kicker(ctx, s, x, y, t, o = {}) {
    const n = Math.floor(clamp(t * (o.cps || 38), 0, s.length));
    if (t <= 0) return;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = font(o.size || 24, 600, true); ctx.fillStyle = o.color || THEME.a; ctx.textBaseline = 'alphabetic';
    const part = s.slice(0, n); ctx.fillText(part, x, y);
    const cw = ctx.measureText(part).width;
    if (n < s.length || Math.floor(t * 2.2) % 2 === 0) { ctx.fillStyle = rgba(o.color || THEME.a, n < s.length ? 0.9 : 0.6); ctx.fillRect(x + cw + 4, y - (o.size || 24) * 0.8, (o.size || 24) * 0.55, (o.size || 24) * 0.95); }
    ctx.restore();
  }
  // number counting up to v (decimals d) over ~0.9 s, with a soft landing
  function countUp(ctx, v, d, x, y, t, o = {}) {
    if (t <= 0) return;
    const e = easeOutExpo(t / (o.dur || 0.9));
    const s = (o.pre || '') + (d ? (v * e).toFixed(d) : Math.round(v * e).toLocaleString('en-US')) + (o.suf || '');
    txt(ctx, s, x, y, { size: o.size || 64, weight: 700, mono: 'display', color: o.color || COL.text, align: o.align || 'left', alpha: (o.alpha ?? 1) * clamp(t / 0.15) });
  }

  // ---------- timeline ----------
  const SCENES = window.SCENES = window.SCENES || [];
  let TL = null;
  function buildTimeline() {
    const src = window.TIMELINE;
    let t = 0;
    const scenes = SCENES.map((s, si) => {
      const ts = src && src.scenes && src.scenes[si] && src.scenes[si].id === s.id && src.scenes[si].beats.length === s.beats.length ? src.scenes[si] : null;
      const lead = ts ? ts.lead : (s.noHeader ? 1.1 : 1.45), tail = ts ? ts.tail : 1.05;
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
      const sc = { scene: s, index: si, start: t, dur: bt + tail, lead, tail, beats };
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
      p: (i, d = 0.8, dl = 0) => { const raw = (S.T(i) - dl) / d, v = easeIO(raw); if (raw > 0 && raw < 1) markEnter(v, raw); return v; },
      l: (i, d = 1, dl = 0) => clamp((S.T(i) - dl) / d),
      f: i => clamp(S.T(i) * beats[i].k / beats[i].dur),
      bd: i => beats[i].dur / beats[i].k,
      vis: (a, z, din = 0.7, dout = 0.5) => S.p(a, din) * (z == null ? 1 : 1 - S.p(z, dout)),
      on: i => S.T(i) >= 0,
      local: t, // seconds since the scene started
    };
    return S;
  }

  // ---------- background ----------
  const STAGES = (window.VIDEO && window.VIDEO.stages) || ['Waveform', 'Feature encoder', 'Projection', 'Masking', 'Pos-conv', 'Transformer ×12', 'Output'];
  let bgBase = null, bgGrid = null, bgVig = null, grain = null;
  function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function prepBackground() {
    bgBase = mk(W, H);
    let g = bgBase.getContext('2d');
    const grd = g.createRadialGradient(W * 0.5, H * 0.42, 80, W * 0.5, H * 0.5, W * 0.78);
    grd.addColorStop(0, '#111a33'); grd.addColorStop(0.5, '#0a1024'); grd.addColorStop(1, '#04060e');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    // three star layers (far, mid, near) that drift at different speeds: parallax depth
    bgGrid = [0, 1, 2].map(L => {
      const c = mk(W + 512, H), g2 = c.getContext('2d'), rnd = mulberry32(70 + L), n = [520, 220, 70][L];
      for (let i = 0; i < n; i++) {
        const x = rnd() * (W + 512), y = rnd() * H, r = [0.6, 1.0, 1.6][L] * (0.6 + rnd() * 0.8), al = [0.35, 0.5, 0.7][L] * (0.4 + rnd() * 0.6);
        g2.fillStyle = rnd() > 0.82 ? `rgba(160,200,255,${al})` : `rgba(220,230,255,${al})`;
        g2.beginPath(); g2.arc(x, y, r, 0, 7); g2.fill();
        if (L === 2 && rnd() > 0.6) { const gg = g2.createRadialGradient(x, y, 0, x, y, 9); gg.addColorStop(0, `rgba(170,210,255,${al * 0.35})`); gg.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = gg; g2.fillRect(x - 9, y - 9, 18, 18); }
      }
      return c;
    });
    bgVig = mk(W, H);
    g = bgVig.getContext('2d');
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, W * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    grain = [0, 1, 2, 3].map(k => {
      const c = mk(256, 256), gg = c.getContext('2d'), id = gg.createImageData(256, 256), rnd = mulberry32(101 + k);
      for (let i = 0; i < id.data.length; i += 4) { const v = rnd() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 10; }
      gg.putImageData(id, 0, 0);
      return c;
    });
  }
  function background(ctx, t) {
    if (!bgBase) prepBackground();
    ctx.drawImage(bgBase, 0, 0);
    // aurora: three soft light pools drifting very slowly, coloured by the video's theme
    const cols = [THEME.a, THEME.b, THEME.c];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const ph = t * 0.035 + i * 2.1;
      const x = W * (0.5 + 0.38 * Math.cos(ph + i)), y = H * (0.48 + 0.3 * Math.sin(ph * 0.8 + i * 1.7));
      const r = 760 + 140 * Math.sin(ph * 0.7);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(cols[i], 0.10)); g.addColorStop(0.5, rgba(cols[i], 0.035)); g.addColorStop(1, rgba(cols[i], 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    [3, 7, 14].forEach((v, L) => { const ox = -((t * v) % 512); ctx.drawImage(bgGrid[L], ox, 0); });
  }
  function overlay(ctx, t) {
    ctx.drawImage(bgVig, 0, 0);
    if (window.ENGINE_OPTS && window.ENGINE_OPTS.grain === false) return;  // video export: grain costs bitrate
    const pat = ctx.createPattern(grain[Math.floor(t * 12) % 4], 'repeat');
    ctx.save(); ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  // ---------- chrome: chapter card, header, HUD ----------
  const CARD_IN = 0.55, CARD_DOCK = 0.98, CARD_DOCKED = 1.42;
  function chapterNum(s) { return String(s.chapter).padStart(2, '0'); }
  // chapter title card that docks into the header: returns true while it owns the header slot
  function chapterCard(ctx, sc, local) {
    const s = sc.scene;
    if (s.noHeader || local > CARD_DOCKED + 0.05) return false;
    const n = chapterNum(s), total = TL.scenes.filter(x => !x.scene.noHeader).length;
    const dock = nudge((local - CARD_DOCK) / (CARD_DOCKED - CARD_DOCK));
    // big state
    const bx = 150, by = 520;
    // number
    const numSize = lerp(210, 30, dock), numX = lerp(bx, 70, dock), numY = lerp(by - 30, 70, dock);
    const titleSize = lerp(78, 34, dock), titleX = lerp(bx + 4, 130, dock), titleY = lerp(by + 92, 70, dock);
    ctx.save();
    // kicker
    const ka = clamp(local / 0.25) * (1 - clamp(dock * 3));
    if (ka > 0) {
      txt(ctx, `CHAPTER ${n} / ${String(total).padStart(2, '0')}`, bx + 8, by - 238, { size: 24, weight: 600, mono: true, color: THEME.a, alpha: ka });
      ctx.fillStyle = rgba(THEME.a, 0.5 * ka); ctx.fillRect(bx + 8, by - 222, 340 * easeOut(local / 0.6), 2);
    }
    // number: outlined giant digits that become the solid header badge
    const e1 = easeOutExpo(clamp(local / 0.42));
    ctx.save();
    ctx.translate(0, (1 - e1) * 60 * (1 - dock));
    ctx.font = font(numSize, 700, 'display');
    ctx.textBaseline = 'alphabetic';
    if (dock < 1) {
      ctx.globalAlpha *= clamp(local / 0.2);
      ctx.lineWidth = lerp(3, 0, dock); ctx.strokeStyle = THEME.a; ctx.strokeText(n, numX, numY);
      ctx.fillStyle = rgba(THEME.a, lerp(0.12, 1, dock)); ctx.fillText(n, numX, numY);
    }
    ctx.restore();
    // title: words waterfall in from below
    const words = s.title.split(' ');
    ctx.font = font(titleSize, 700);
    let x = titleX;
    words.forEach((w, i) => {
      const t0 = 0.06 + i * 0.045 * Math.pow(0.86, i);
      const e = easeOut4(clamp((local - t0) / 0.32));
      if (e <= 0) { x += ctx.measureText(w + ' ').width; return; }
      ctx.save();
      ctx.globalAlpha *= local - t0 > 0 ? 1 : 0;
      ctx.translate(0, (1 - e) * 54 * (1 - dock));
      ctx.fillStyle = COL.text;
      ctx.font = font(titleSize, 700);
      ctx.fillText(w, x, titleY);
      ctx.restore();
      ctx.font = font(titleSize, 700);
      x += ctx.measureText(w + ' ').width;
    });
    // underline sweep
    const ua = 1 - clamp(dock * 2.5);
    if (ua > 0) {
      ctx.font = font(78, 700);
      const tw = ctx.measureText(s.title).width;
      const p = easeOut(clamp((local - 0.25) / 0.5));
      const g = ctx.createLinearGradient(bx, 0, bx + tw, 0);
      g.addColorStop(0, rgba(THEME.a, 0.9 * ua)); g.addColorStop(1, rgba(THEME.b, 0.2 * ua));
      ctx.fillStyle = g; ctx.fillRect(bx + 6, by + 128, tw * p, 4);
      if (p < 1) penTip(ctx, bx + 6 + tw * p, by + 130, THEME.a, ua);
    }
    ctx.restore();
    return local < CARD_DOCKED;
  }
  function header(ctx, sc, gt, local) {
    const s = sc.scene;
    if (s.noHeader) return;
    const carded = chapterCard(ctx, sc, local);
    if (!carded) {
      txt(ctx, chapterNum(s), 70, 70, { size: 30, weight: 700, color: THEME.a, mono: 'display' });
      txt(ctx, s.title, 130, 70, { size: 34, weight: 700 });
    }
    const ca = clamp((local - CARD_DOCKED + 0.1) / 0.4);
    const code = typeof s.code === 'function' ? s.code(makeS(sc, gt - sc.start)) : s.code;
    ctx.save();
    ctx.globalAlpha *= ca;
    ctx.translate((1 - easeOut4(ca)) * 60, 0);
    if (code) {
      ctx.font = font(20, 500, true);
      const w = ctx.measureText(code).width + 28;
      rrect(ctx, W - 70 - w, 44, w, 34, 8, rgba(THEME.a, 0.08), rgba(THEME.a, 0.35), 1.5);
      txt(ctx, code, W - 70 - w / 2, 62, { size: 20, weight: 500, align: 'center', base: 'middle', mono: true, color: THEME.a });
    } else {
      txt(ctx, ((window.VIDEO && window.VIDEO.title) || 'wav2vec 2.0') + ' · following the numbers', W - 70, 68, { size: 22, weight: 500, align: 'right', color: COL.faint });
    }
    ctx.restore();
  }
  function progressLine(ctx, gt, sc) {
    if (sc.scene.noHeader) return;
    const x0 = 70, x1 = W - 70, y = 94, p = clamp(gt / TL.total);
    ctx.fillStyle = COL.line; ctx.fillRect(x0, y, x1 - x0, 2);
    // chapter ticks
    ctx.fillStyle = 'rgba(160,180,210,0.35)';
    TL.scenes.forEach(s => { if (s.index) ctx.fillRect(x0 + (x1 - x0) * (s.start / TL.total) - 1, y - 3, 2, 8); });
    const g = ctx.createLinearGradient(x0, 0, x0 + (x1 - x0) * p, 0);
    g.addColorStop(0, rgba(THEME.b, 0.6)); g.addColorStop(1, THEME.a);
    ctx.fillStyle = g; ctx.fillRect(x0, y, (x1 - x0) * p, 2);
    glow(ctx, x0 + (x1 - x0) * p, y + 1, 22, THEME.a, 0.8);
  }

  // HUD: sampled once, then animated (stretching stage indicator + rolling shape readout)
  let HUDS = null, HUD_STEP = 0.2, STAGE_X = null;
  function hudAt(sc, local) {
    const s = sc.scene;
    const S = makeS(sc, local);
    ENTER.clear();
    return typeof s.hud === 'function' ? s.hud(S) : s.hud;
  }
  function prepHud(ctx) {
    HUDS = [];
    let prev = null;
    for (const sc of TL.scenes) {
      for (let l = 0; l < sc.dur; l += HUD_STEP) {
        let h = null;
        try { h = hudAt(sc, l); } catch (e) { h = null; }
        const key = h ? JSON.stringify([h.stage, h.shape, h.label]) : 'null';
        if (key !== prev) { HUDS.push({ t: sc.start + l, h }); prev = key; }
      }
    }
    STAGE_X = [];
    let x = 64;
    STAGES.forEach((st, i) => {
      ctx.font = font(20, 600);
      const w = ctx.measureText(st).width + 28;
      STAGE_X.push([x, w]);
      x += w + 4 + (i < STAGES.length - 1 ? 20 : 0);
    });
  }
  function hudState(t) {
    let i = 0;
    for (let k = 0; k < HUDS.length; k++) { if (HUDS[k].t <= t + 1e-6) i = k; else break; }
    return i;
  }
  // shape markup -> pills: '({B:B}, {T:201}, {C:1024})' becomes B × 201 × 1024 in axis colours
  function shapeParts(shape) {
    const out = [];
    parseM(shape).forEach(p => {
      if (p[1]) out.push({ pill: true, s: p[0], c: p[1] });
      else {
        const s = p[0].replace(/[(),]/g, ' ').replace(/\s+/g, ' ').trim();
        if (s) out.push({ pill: false, s });
      }
    });
    return out;
  }
  function drawShape(ctx, shape, right, y, alpha) {
    const parts = shapeParts(shape);
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.font = font(28, 700, true);
    const items = [];
    parts.forEach((p, i) => {
      if (i && p.pill && parts[i - 1].pill) items.push({ sep: true, w: 26 });
      ctx.font = p.pill ? font(28, 700, true) : font(20, 600);
      items.push(Object.assign({ w: ctx.measureText(p.s).width + (p.pill ? 24 : 12) }, p));
    });
    const total = items.reduce((a, b) => a + b.w + 4, 0);
    let x = right - total;
    items.forEach(it => {
      if (it.sep) { ctx.font = font(22, 600); ctx.fillStyle = COL.faint; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('×', x + it.w / 2, y + 1); }
      else if (it.pill) {
        rrect(ctx, x, y - 21, it.w, 42, 11, rgba(it.c, 0.16), rgba(it.c, 0.55), 1.5);
        ctx.font = font(28, 700, true); ctx.fillStyle = it.c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.s, x + it.w / 2, y + 1);
      } else { ctx.font = font(20, 600); ctx.fillStyle = COL.dim; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.s, x + it.w / 2, y + 1); }
      x += it.w + 4;
    });
    ctx.restore();
    return total;
  }
  function hud(ctx, t) {
    if (!HUDS) prepHud(ctx);
    const i = hudState(t), cur = HUDS[i];
    const vis = track(t, HUDS.map(k => [k.t, k.h ? 1 : 0]), 170, 26);
    if (vis <= 0.01) return;
    const h = cur.h || (HUDS.slice(0, i).reverse().find(k => k.h) || {}).h;
    if (!h) return;
    const y0 = 994, x0 = 40, w = W - 80, hh = 70;
    ctx.save();
    ctx.globalAlpha *= clamp(vis);
    ctx.translate(0, (1 - clamp(vis)) * 50);
    // floating glass capsule
    softShadow(ctx, x0, y0, w, hh, 35);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + hh);
    g.addColorStop(0, 'rgba(26,34,58,0.90)'); g.addColorStop(1, 'rgba(12,17,32,0.90)');
    rrect(ctx, x0, y0, w, hh, 35, g, 'rgba(140,165,215,0.22)', 1.5);
    const sh = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    sh.addColorStop(0, rgba(THEME.a, 0)); sh.addColorStop(0.3, rgba(THEME.a, 0.35)); sh.addColorStop(0.7, rgba(THEME.b, 0.35)); sh.addColorStop(1, rgba(THEME.b, 0));
    ctx.fillStyle = sh; ctx.fillRect(x0 + 40, y0, w - 80, 1.5);
    const cy = y0 + hh / 2;
    // stage meter: one segment per stage; past ones filled, the current one lit and labelled
    const n = STAGES.length, segW = Math.min(64, 560 / n), gap = 6, sx = x0 + 34;
    const keys = [];
    HUDS.forEach(k => { if (k.h && k.h.stage != null && (!keys.length || keys[keys.length - 1][1] !== k.h.stage)) keys.push([k.t, k.h.stage]); });
    const st = h.stage != null && keys.length ? track(t, keys, 220, 24) : -1;
    for (let k = 0; k < n; k++) {
      const x = sx + k * (segW + gap), f = clamp(st - k + 1);
      rrect(ctx, x, cy - 4, segW, 8, 4, 'rgba(120,140,180,0.18)', null);
      if (f > 0) rrect(ctx, x, cy - 4, segW * f, 8, 4, k === Math.round(st) ? THEME.a : rgba(THEME.a, 0.45), null);
    }
    if (st >= 0) {
      const ax = sx + st * (segW + gap) + segW / 2;
      glow(ctx, ax, cy, 40, THEME.a, 0.55);
      const k = Math.round(st), name = STAGES[clamp(k, 0, n - 1)];
      const lx = sx + n * (segW + gap) + 18;
      txt(ctx, `${String(k + 1).padStart(2, '0')}/${String(n).padStart(2, '0')}`, lx, cy + 1, { size: 18, weight: 600, mono: true, base: 'middle', color: COL.faint });
      // stage name rolls when it changes
      const kt = keys.filter(q => q[0] <= t + 1e-6).pop(), e = kt ? easeOut4(clamp((t - kt[0]) / 0.4)) : 1;
      ctx.save(); ctx.beginPath(); ctx.rect(lx + 70, cy - 26, 460, 52); ctx.clip();
      txt(ctx, name, lx + 76, cy + 1 + (1 - e) * 30, { size: 26, weight: 700, base: 'middle', color: COL.text, alpha: e });
      ctx.restore();
    }
    // shape pills (roll up when the shape changes)
    if (h.shape) {
      const tc = cur.t, prevH = (HUDS.slice(0, i).reverse().find(k => k.h && k.h.shape) || {}).h;
      const e = prevH && prevH.shape !== h.shape ? easeOut4(clamp((t - tc) / 0.45)) : 1;
      const right = x0 + w - 30;
      ctx.save(); ctx.beginPath(); ctx.rect(x0 + 700, y0 + 4, w - 720, hh - 8); ctx.clip();
      let sw = 0;
      if (e < 1) { ctx.save(); ctx.translate(0, -e * 44); drawShape(ctx, prevH.shape, right, cy, 1 - e); ctx.restore(); }
      ctx.save(); ctx.translate(0, (1 - e) * 44); sw = drawShape(ctx, h.shape, right, cy, e); ctx.restore();
      if (e < 1) glow(ctx, right - sw / 2, cy, sw * 0.6, THEME.a, 0.35 * (1 - e));
      ctx.restore();
      txt(ctx, (h.label || 'tensor shape').toUpperCase(), right - sw - 18, cy + 1, { size: 15, weight: 700, mono: true, align: 'right', base: 'middle', color: COL.faint });
    }
    ctx.restore();
  }

  // ---------- end card (last scene's tail) ----------
  function outro(ctx, sc, local) {
    const o = window.VIDEO && window.VIDEO.outro;
    if (!o || sc.index !== TL.scenes.length - 1) return;
    const t = local - (sc.dur - sc.tail) - 0.35;
    if (t <= 0) return;
    const v = easeOut(t / 0.7);
    ctx.save();
    ctx.fillStyle = `rgba(6,9,15,${0.96 * v})`; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.3, H * 0.45, 0, W * 0.3, H * 0.45, 900);
    g.addColorStop(0, rgba(THEME.a, 0.12 * v)); g.addColorStop(1, rgba(THEME.a, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    kicker(ctx, o.kicker, 154, 400, t - 0.2, { size: 26 });
    titleRise(ctx, o.title, 150, 540, t - 0.45, { size: 132 });
    txt(ctx, o.sub, 156, 610, { size: 34, weight: 500, color: COL.dim, alpha: clamp((t - 1.1) / 0.5) });
    const p = easeOut4((t - 1.4) / 0.8);
    if (p > 0) { ctx.fillStyle = rgba(THEME.a, 0.8); ctx.fillRect(156, 660, 520 * p, 3); if (p < 1) penTip(ctx, 156 + 520 * p, 661, THEME.a); }
    txt(ctx, 'ganesh-deepak.github.io/voice-deepfake', 156, 712, { size: 24, mono: true, color: COL.faint, alpha: clamp((t - 1.8) / 0.5) });
    ctx.restore();
  }

  // ---------- render ----------
  let canvas = null, ctx = null, layer = null;
  function init(c) {
    canvas = c; ctx = c.getContext('2d');
    buildTimeline();
    return TL;
  }
  function sceneAt(t) {
    for (const sc of TL.scenes) if (t < sc.start + sc.dur) return sc;
    return TL.scenes[TL.scenes.length - 1];
  }
  const OUT_DUR = 0.34, IN_DUR = 0.46, TRAVEL = 230;
  // seam: the outgoing scene accelerates left and fades; the incoming one arrives mid-flight
  function seam(sc, local) {
    let dx = 0, a = 1;
    const last = sc.index === TL.scenes.length - 1, first = sc.index === 0;
    if (!first && local < IN_DUR) { const v = local / IN_DUR; dx = TRAVEL * (1 - easeOut4(v)); a = lerp(0.35, 1, clamp(v / 0.5)); }
    const rem = sc.dur - local;
    if (!last && rem < OUT_DUR) { const u = 1 - rem / OUT_DUR; dx = -TRAVEL * easeIn4(u); a = 1 - clamp(u / 0.8); }
    return { dx, a };
  }
  function renderAt(t) {
    t = clamp(t, 0, TL.total - 1e-6);
    GT = t;
    const sc = sceneAt(t), local = t - sc.start;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    if (!HUDS) prepHud(ctx);
    ENTER.clear(); MOTION = 0;
    const S = makeS(sc, local);
    background(ctx, t);
    const sm = seam(sc, local);
    // content layer: a slow camera push-in across the scene; during a seam the scene is drawn
    // off-screen first, because scenes set ctx.globalAlpha absolutely for their groups
    const inSeam = sm.dx !== 0 || sm.a < 1;
    let cx = ctx;
    if (inSeam) {
      if (!layer) layer = mk(W, H);
      cx = layer.getContext('2d');
      cx.setTransform(1, 0, 0, 1, 0, 0); cx.globalAlpha = 1; cx.clearRect(0, 0, W, H);
    }
    cx.save();
    const push = 1 + 0.018 * easeIO(local / sc.dur);
    cx.translate(W / 2, 560); cx.scale(push, push); cx.translate(-W / 2, -560);
    try { sc.scene.draw(cx, S); } catch (e) { console.error(e); txt(cx, 'ERR ' + e.message, 100, 500, { color: COL.R }); }
    cx.restore();
    if (inSeam) { ctx.save(); ctx.globalAlpha = sm.a; ctx.drawImage(layer, sm.dx, 0); ctx.restore(); }
    // header rides the seam too (it is the carrier across the cut)
    ctx.save(); ctx.globalAlpha = sm.a; ctx.translate(sm.dx, 0);
    ENTER.clear();
    header(ctx, sc, t, local);
    ctx.restore();
    progressLine(ctx, t, sc);
    ENTER.clear();
    hud(ctx, t);
    outro(ctx, sc, local);
    overlay(ctx, t);
    // open from / close to black at the very ends of the film
    const fin = clamp(t / 0.6), fout = clamp((TL.total - t) / 0.8);
    const k = 1 - Math.min(fin, fout);
    if (k > 0) { ctx.fillStyle = `rgba(5,7,12,${k})`; ctx.fillRect(0, 0, W, H); }
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
  // caption plus how far through it the voice is (0..1), for karaoke-style highlighting
  function captionInfo(t) {
    const sc = sceneAt(t), local = t - sc.start;
    for (const b of sc.beats) {
      if (local < b.start || local > b.start + b.dur) continue;
      for (const s of b.sentences) if (local >= b.start + s.start - 0.05 && local <= b.start + s.start + s.dur + 0.3)
        return { text: s.text, p: clamp((local - b.start - s.start) / s.dur) };
    }
    return { text: '', p: 0 };
  }

  window.E = {
    W, H, COL, THEME, clamp, lerp, easeIO, easeOut, easeIn4, easeOut4, easeOutExpo, easeOutBack, spring, SPRING, track, nudge,
    noise, hash01, mulberry32, fmt, fmtInt, rgba, mix, vcol, scol, font, glow, penTip, titleRise, kicker, countUp, traceBorder,
    txt, rich, mtxt, mwidth, wrap, rrect, line, arrow, parrow, chip, box, cells, mat, dimTop, dimLeft, dimBottom, dimRight,
    stack, numRow, numMat, brace, cross, WAVE, drawWave, init, renderAt, captionAt, captionInfo, buildTimeline,
    get TL() { return TL; }, get GT() { return GT; },
  };
})();
