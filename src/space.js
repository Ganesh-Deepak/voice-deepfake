// Tiny deterministic 3-D layer for the canvas engine: a perspective camera with spring-tracked
// keyframes, shaded tensor blocks with value-coloured cells and dimension tags, layer stacks,
// 3-D waveform ribbons, paths, a floor grid and drifting dust. Everything is a pure function of
// time, like the rest of the engine, so scrubbing and the MP4 renderer stay frame-exact.
(function () {
  const { clamp, lerp, rgba, vcol, noise, hash01, track, easeIO, easeOut, easeOut4, font, txt, COL, THEME, glow, penTip, WAVE } = E;
  const W = 1920, H = 1080;

  // world length for an axis of n elements: log scale, so 1, 201, 1024 and 64,600 all fit on screen
  const len = n => 30 * Math.log2(n + 1);

  // ---------- camera ----------
  function camera(c) {
    const o = Object.assign({ yaw: 0, pitch: 0, dist: 1600, tx: 0, ty: 0, tz: 0, f: 1600, cx: W / 2, cy: 540 }, c);
    const cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw), cp = Math.cos(o.pitch), sp = Math.sin(o.pitch);
    o.eye = [o.tx + o.dist * cp * syw, o.ty + o.dist * sp, o.tz + o.dist * cp * cyw];
    o.p = (x, y, z) => {
      const X = x - o.tx, Y = y - o.ty, Z = z - o.tz;
      const x1 = X * cyw - Z * syw, z1 = X * syw + Z * cyw;
      const y2 = Y * cp - z1 * sp, z2 = Y * sp + z1 * cp;
      const d = Math.max(60, o.dist - z2), k = o.f / d;
      return [o.cx + x1 * k, o.cy - y2 * k, d, k];
    };
    return o;
  }
  // keys: [[time, {yaw, pitch, dist, tx, ty, tz}], ...]; each property springs to its new target
  const CAM_PROPS = ['yaw', 'pitch', 'dist', 'tx', 'ty', 'tz', 'cx', 'cy'];
  function camAt(t, keys, k = 60, d = 15) {
    const c = {};
    CAM_PROPS.forEach(p => {
      if (keys[0][1][p] === undefined) return;
      const ks = []; let last = keys[0][1][p];
      keys.forEach(([tt, v]) => { if (v[p] !== undefined) last = v[p]; ks.push([tt, last]); });
      c[p] = track(t, ks, k, d);
    });
    return camera(c);
  }

  // ---------- drawing helpers ----------
  function poly(ctx, pts, fill, stroke, lw = 1.5) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const LIGHT = (() => { const v = [-0.35, 0.8, 0.5], n = Math.hypot(...v); return v.map(x => x / n); })();

  // one face: origin o, edge vectors u (columns) and v (rows); cells coloured by fn(r, c)
  function face(ctx, cam, o, u, v, rows, cols, fn, shade, alpha, reveal) {
    const P = [];
    for (let r = 0; r <= rows; r++) {
      const row = [];
      for (let c = 0; c <= cols; c++) row.push(cam.p(...add(o, add(mul(u, c / cols), mul(v, r / rows)))));
      P.push(row);
    }
    // base plate
    poly(ctx, [P[0][0], P[0][cols], P[rows][cols], P[rows][0]], `rgba(8,12,22,${0.92 * alpha})`, null);
    const gap = 0.12;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (reveal < 1) { const k = clamp((reveal * 1.6 - (c / cols) * 0.7 - (r / rows) * 0.25) / 0.2); if (k <= 0) continue; }
      const col = fn(r, c);
      if (!col) continue;
      const a = P[r][c], b = P[r][c + 1], d = P[r + 1][c], e = P[r + 1][c + 1];
      const L = (p, q, s) => [lerp(p[0], q[0], s), lerp(p[1], q[1], s)];
      const q1 = L(a, e, gap), q2 = L(b, d, gap), q3 = L(e, a, gap), q4 = L(d, b, gap);
      poly(ctx, [q1, q2, q3, q4], col, null);
    }
    if (shade < 1) poly(ctx, [P[0][0], P[0][cols], P[rows][cols], P[rows][0]], `rgba(3,6,14,${(1 - shade) * 0.75 * alpha})`, null);
    return P;
  }

  // a tensor block centred at (x, y, z) with world size (w, h, d)
  // o.cells: [rows, cols, depthCells] drawn on the faces; o.fn(r, c, faceId) colours a cell
  // o.tags: { w: ['T', 201], h: ['C', 512], d: ['B', 'B'] } dimension tags on the edges
  function block(ctx, cam, o) {
    const a = o.alpha ?? 1;
    if (a <= 0.003) return;
    const [x, y, z] = [o.x || 0, o.y || 0, o.z || 0], w = o.w, h = o.h, d = o.d ?? 26;
    const hw = w / 2, hh = h / 2, hd = d / 2;
    const rows = o.cells ? o.cells[0] : 10, cols = o.cells ? o.cells[1] : 16, dep = o.cells ? (o.cells[2] || 2) : 2;
    const seed = o.seed || 1, base = o.color || COL.A;
    const fn = o.fn || ((r, c, f) => vcol(noise(r + f * 37, c, seed) * 0.95, 0.95));
    const reveal = o.reveal ?? 1;
    ctx.save();
    ctx.globalAlpha *= a;
    const C = (sx, sy, sz) => [x + sx * hw, y + sy * hh, z + sz * hd];
    const faces = [
      { n: [0, 0, 1], o: C(-1, 1, 1), u: [w, 0, 0], v: [0, -h, 0], r: rows, c: cols, id: 0 },             // front
      { n: [0, 1, 0], o: C(-1, 1, -1), u: [w, 0, 0], v: [0, 0, d], r: dep, c: cols, id: 1 },              // top
      { n: [1, 0, 0], o: C(1, 1, 1), u: [0, 0, -d], v: [0, -h, 0], r: rows, c: dep, id: 2 },              // right
      { n: [-1, 0, 0], o: C(-1, 1, -1), u: [0, 0, d], v: [0, -h, 0], r: rows, c: dep, id: 3 },            // left
      { n: [0, -1, 0], o: C(-1, -1, 1), u: [w, 0, 0], v: [0, 0, -d], r: dep, c: cols, id: 4 },            // bottom
      { n: [0, 0, -1], o: C(1, 1, -1), u: [-w, 0, 0], v: [0, -h, 0], r: rows, c: cols, id: 5 },           // back
    ];
    const vis = faces.filter(f => {
      const ctr = add(f.o, add(mul(f.u, 0.5), mul(f.v, 0.5)));
      return dot(f.n, sub(cam.eye, ctr)) > 0;
    });
    vis.sort((p, q) => cam.p(...add(q.o, add(mul(q.u, .5), mul(q.v, .5))))[2] - cam.p(...add(p.o, add(mul(p.u, .5), mul(p.v, .5))))[2]);
    // soft shadow on the floor / glow behind
    if (o.glow) { const c0 = cam.p(x, y, z); glow(ctx, c0[0], c0[1], Math.max(w, h) * c0[3] * 0.9, o.glow, 0.35 * a); }
    for (const f of vis) {
      const shade = 0.55 + 0.45 * Math.max(0, dot(f.n, LIGHT));
      const P = face(ctx, cam, f.o, f.u, f.v, f.r, f.c, (r, c) => fn(r, c, f.id), f.id === 0 || f.id === 5 ? 1 : shade, 1, reveal);
      // edges: bright rim on the front face, softer elsewhere
      const R = f.r, Cc = f.c;
      poly(ctx, [P[0][0], P[0][Cc], P[R][Cc], P[R][0]], null, f.id === 0 ? rgba(base, 0.95) : rgba(base, 0.45), f.id === 0 ? 2.2 : 1.4);
    }
    // a light sweep across the front face while it materialises
    if (reveal < 1) {
      const s = clamp(reveal * 1.25);
      const p = cam.p(x - hw + w * s, y, z + hd);
      penTip(ctx, p[0], p[1], base, 1 - s * 0.5);
    }
    ctx.restore();
    if (o.tags && a > 0.05) tags(ctx, cam, o, a);
  }

  // dimension tags on three edges of a block
  function tag(ctx, X, Y, axis, val, a, align) {
    const col = COL[axis] || COL.text;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.font = font(22, 700, true);
    const s = String(typeof val === 'number' ? val.toLocaleString('en-US') : val);
    const w1 = ctx.measureText(axis).width, w2 = ctx.measureText(s).width, pad = 9, w = w1 + w2 + pad * 3;
    let x0 = align === 'right' ? X - w : align === 'center' ? X - w / 2 : X;
    const y0 = Y - 17;
    ctx.fillStyle = 'rgba(6,10,20,0.88)'; ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x0, y0, w, 34, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba(col, 0.25); ctx.beginPath(); ctx.roundRect(x0, y0, w1 + pad * 2 - 2, 34, [9, 0, 0, 9]); ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col; ctx.fillText(axis, x0 + pad, Y + 1);
    ctx.fillStyle = COL.text; ctx.fillText(s, x0 + w1 + pad * 2, Y + 1);
    ctx.restore();
  }
  function tags(ctx, cam, o, a) {
    const [x, y, z] = [o.x || 0, o.y || 0, o.z || 0], hw = o.w / 2, hh = o.h / 2, hd = (o.d ?? 26) / 2, T = o.tags;
    const ta = (o.tagAlpha ?? 1) * a;
    if (T.w) { const p = cam.p(x, y - hh, z + hd); tag(ctx, p[0], p[1] + 30, T.w[0], T.w[1], ta, 'center'); }
    if (T.h) { const p = cam.p(x - hw, y, z + hd); tag(ctx, p[0] - 14, p[1], T.h[0], T.h[1], ta, 'right'); }
    if (T.d) { const p = cam.p(x + hw, y + hh, z); tag(ctx, p[0] + 14, p[1] - 16, T.d[0], T.d[1], ta, 'left'); }
  }

  // a shape label floating above a block: "(B, 201, 1024)"
  function caption(ctx, cam, x, y, z, s, o = {}) {
    const p = cam.p(x, y, z);
    E.mtxt(ctx, s, p[0], p[1], Object.assign({ size: 30, mono: true, align: 'center' }, o));
    return p;
  }

  // ---------- other primitives ----------
  // waveform as a ribbon of vertical strokes in 3-D, from x0 to x1 at height y, depth z
  function ribbon(ctx, cam, x0, x1, y, z, amp, o = {}) {
    const n = o.n || 260, rev = o.reveal ?? 1, from = o.from ?? 0, to = o.to ?? WAVE.length;
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || COL.T; ctx.lineWidth = o.lw || 2; ctx.lineCap = 'round';
    ctx.beginPath();
    const m = Math.floor(n * rev);
    for (let i = 0; i < m; i++) {
      const i0 = from + Math.floor(i / n * (to - from)), i1 = from + Math.floor((i + 1) / n * (to - from));
      let lo = 0, hi = 0;
      for (let k = i0; k < i1; k += Math.max(1, Math.floor((i1 - i0) / 24))) { const v = WAVE[k % WAVE.length]; if (v < lo) lo = v; if (v > hi) hi = v; }
      const xx = lerp(x0, x1, (i + 0.5) / n), p = cam.p(xx, y + hi * amp, z), q = cam.p(xx, y + lo * amp, z);
      ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1] + 0.5);
    }
    ctx.stroke(); ctx.restore();
    if (rev > 0 && rev < 1) { const p = cam.p(lerp(x0, x1, rev), y, z); penTip(ctx, p[0], p[1], o.color || COL.T); }
  }
  // 3-D polyline (optionally only the first fraction p of it) with an arrow head
  function path3(ctx, cam, pts, o = {}) {
    const P = pts.map(q => cam.p(...q));
    let L = 0; const seg = [];
    for (let i = 0; i < P.length - 1; i++) { const l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]); seg.push(l); L += l; }
    let rem = L * clamp(o.p ?? 1), end = P[0], dir = [1, 0];
    ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
    ctx.strokeStyle = o.color || COL.dim; ctx.lineWidth = o.lw || 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
    for (let i = 0; i < seg.length && rem > 0; i++) {
      const f = Math.min(1, rem / seg[i]);
      end = [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)];
      dir = [P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]];
      ctx.lineTo(end[0], end[1]); rem -= seg[i];
    }
    ctx.stroke(); ctx.setLineDash([]);
    if (o.head !== false && (o.p ?? 1) > 0.02) {
      const ang = Math.atan2(dir[1], dir[0]), hs = o.headSize || 15;
      ctx.fillStyle = o.color || COL.dim; ctx.beginPath(); ctx.moveTo(end[0], end[1]);
      ctx.lineTo(end[0] - hs * Math.cos(ang - 0.45), end[1] - hs * Math.sin(ang - 0.45));
      ctx.lineTo(end[0] - hs * Math.cos(ang + 0.45), end[1] - hs * Math.sin(ang + 0.45)); ctx.fill();
    }
    ctx.restore();
    if ((o.p ?? 1) < 1 && (o.p ?? 1) > 0) penTip(ctx, end[0], end[1], o.color && o.color[0] === '#' ? o.color : COL.A);
    return end;
  }
  // a translucent plate (one transformer layer, a gate, a codebook): centred at x, facing the camera along z
  function plate(ctx, cam, x, y, z, w, h, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0) return;
    const P = [cam.p(x - w / 2, y + h / 2, z), cam.p(x + w / 2, y + h / 2, z), cam.p(x + w / 2, y - h / 2, z), cam.p(x - w / 2, y - h / 2, z)];
    ctx.save(); ctx.globalAlpha *= a;
    const col = o.color || COL.A;
    poly(ctx, P, rgba(col, o.fill ?? 0.10), rgba(col, o.edge ?? 0.7), o.lw || 2);
    if (o.label) {
      const c = cam.p(x, y - h / 2, z);
      txt(ctx, o.label, c[0], c[1] + 30, { size: o.size || 22, weight: 700, align: 'center', color: col });
    }
    ctx.restore();
    return P;
  }
  // a plate turned sideways (in the y-z plane): the gates the tensor flies through
  function gate(ctx, cam, x, y, z, h, d, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0) return;
    const P = [cam.p(x, y + h / 2, z - d / 2), cam.p(x, y + h / 2, z + d / 2), cam.p(x, y - h / 2, z + d / 2), cam.p(x, y - h / 2, z - d / 2)];
    ctx.save(); ctx.globalAlpha *= a;
    const col = o.color || COL.K;
    poly(ctx, P, rgba(col, o.fill ?? 0.08), rgba(col, o.edge ?? 0.8), o.lw || 2.2);
    if (o.label) { const c = cam.p(x, y + h / 2, z); txt(ctx, o.label, c[0], c[1] - 16, { size: o.size || 22, weight: 700, align: 'center', color: col }); }
    if (o.sub) { const c = cam.p(x, y - h / 2, z); txt(ctx, o.sub, c[0], c[1] + 30, { size: 18, mono: true, align: 'center', color: COL.dim }); }
    ctx.restore();
  }

  // ---------- environment ----------
  function floor(ctx, cam, y, o = {}) {
    const a = o.alpha ?? 1;
    if (a <= 0) return;
    const ext = o.ext || 2600, step = o.step || 140, col = o.color || THEME.a;
    ctx.save(); ctx.lineWidth = 1.2;
    for (let x = -ext; x <= ext; x += step) {
      for (let z = -ext; z < ext; z += step) {
        const p = cam.p(x + (o.ox || 0), y, z), q = cam.p(x + (o.ox || 0), y, z + step);
        if (p[2] < 120 || q[2] < 120) continue;
        const fade = clamp(1 - (p[2] - 900) / 3600) * a;
        if (fade <= 0) continue;
        ctx.strokeStyle = rgba(col, 0.12 * fade);
        ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
        const r = cam.p(x + step + (o.ox || 0), y, z);
        if (r[2] > 120) { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(r[0], r[1]); ctx.stroke(); }
      }
    }
    ctx.restore();
  }
  // floating dust that drifts slowly; with a moving camera it gives real parallax
  const DUST = Array.from({ length: 220 }, (_, i) => [hash01(i, 1) * 5200 - 2600, hash01(i, 2) * 2000 - 700, hash01(i, 3) * 4200 - 2800, hash01(i, 4)]);
  function dust(ctx, cam, t, o = {}) {
    const a = o.alpha ?? 1;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x0, y0, z0, s] of DUST) {
      const p = cam.p(x0 + Math.sin(t * 0.07 + s * 9) * 60, y0 + ((t * 9 * (0.3 + s)) % 400) - 200, z0);
      if (p[2] < 200 || p[0] < -20 || p[0] > W + 20 || p[1] < -20 || p[1] > H + 20) continue;
      const r = Math.max(0.6, 2.4 * p[3]), al = clamp(1.4 - p[2] / 4200) * (0.25 + 0.5 * s) * a;
      ctx.fillStyle = rgba(s > 0.7 ? THEME.b : THEME.a, al);
      ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
  // points on a sphere (Fibonacci lattice), for the globe of languages
  function sphere(ctx, cam, cx, cy, cz, R, n, t, o = {}) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const yy = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - yy * yy), th = i * 2.399963 + t * (o.spin ?? 0.15);
      pts.push([cx + R * r * Math.cos(th), cy + R * yy, cz + R * r * Math.sin(th), i]);
    }
    const P = pts.map(q => [cam.p(q[0], q[1], q[2]), q[3], q[2] - cz]).sort((p, q) => q[0][2] - p[0][2]);
    ctx.save();
    for (const [p, i, zz] of P) {
      const front = zz > 0 ? 1 : 0.35, hot = o.hot && o.hot(i);
      const al = (o.alpha ?? 1) * front * (hot ? 1 : 0.45);
      if (al <= 0) continue;
      ctx.fillStyle = hot ? rgba(hot, al) : rgba('#9fb3d1', al * 0.6);
      ctx.beginPath(); ctx.arc(p[0], p[1], (hot ? 3.4 : 1.8) * p[3], 0, 7); ctx.fill();
      if (hot && front > 0.5) glow(ctx, p[0], p[1], 14 * p[3], hot, 0.4 * al);
    }
    ctx.restore();
  }

  window.S3 = { len, camera, camAt, block, tag, tags, caption, ribbon, path3, plate, gate, floor, dust, sphere, poly };
})();
