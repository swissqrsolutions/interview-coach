// Kit for v2 teaching films: flat blocks on a Canvas 2D, every helper is a pure function of time.
// Coordinates are "logical" pixels (390 x 560); film2.js scales the canvas 3x.
export const C = {
  bg: '#fbfbfd', grey: '#aab2c0', greyL: '#e8ebf1', greyD: '#6b7385', ink: '#152033', blue: '#2f6fde', blueL: '#9dbfff', blueXL: '#e1ecff',
  blueD: '#1f4fae', blueP: '#c9d6ee', orange: '#f08a1c', green: '#1f9d57', red: '#d93b3b', purple: '#7a4fd0', white: '#ffffff', code: '#0f1626',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
export const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = u => { u = clamp(u); return u * u * (3 - 2 * u); };
export const ramp = (t, t0, d = .4) => ease((t - t0) / d);          // 0 before t0, 1 after t0+d
export const lerp = (a, b, u) => a + (b - a) * u;
export const between = (t, a, b) => t >= a && t < b;
// piecewise tracks: pairs [[t, value], ...] sorted by t
export const stepAt = (tr, t, init = null) => { let v = init; for (const p of tr) { if (t < p[0]) break; v = p[1]; } return v; };
export function numAt(tr, t, dur = .5, init = 0) {        // counts up/down to each new value
  let v = init;
  for (const [t0, x] of tr) { if (t < t0) break; v = t >= t0 + dur ? x : Math.round(lerp(v, x, ease((t - t0) / dur))); if (t < t0 + dur) break; }
  return v;
}
export function camAt(keys, t) {                          // [[t, fx, fy, z], ...] each key = the view reached at t; the picture's offset is interpolated, so a zoom-out never swings away
  const V = k => { const z = k[3]; return [k[0], z, 195 - k[1] * z, 290 - k[2] * z]; };
  const out = (z, tx, ty) => [(195 - tx) / z, (290 - ty) / z, z];
  let a = V(keys[0]); if (t <= a[0]) return out(a[1], a[2], a[3]);
  for (let i = 1; i < keys.length; i++) { const b = V(keys[i]); if (t <= b[0]) { const u = ease((t - a[0]) / Math.max(.001, b[0] - a[0])); return out(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)); } a = b; }
  return out(a[1], a[2], a[3]);
}
export function pathAt(pts, u) {                          // point at fraction u (0..1) along a polyline
  let tot = 0; const L = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
  let d = clamp(u) * tot;
  for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const k = L[i] ? clamp(d / L[i]) : 1; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; } d -= L[i]; }
  return pts[0];
}
export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
export function box(ctx, x, y, w, h, o = {}) {
  const { fill = null, stroke = null, lw = 1, r = 3, alpha = 1, dash = null } = o;
  ctx.save(); ctx.globalAlpha *= alpha; rr(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.stroke(); }
  ctx.restore();
}
export function text(ctx, s, x, y, o = {}) {              // y = vertical middle
  const { size = 10, color = C.ink, align = 'left', weight = 600, alpha = 1, mono = false } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = `${weight} ${size}px ${mono ? MONO : FONT}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillText(String(s), x, y); ctx.restore();
}
export function line(ctx, x0, y0, x1, y1, o = {}) {
  const { color = C.ink, lw = 1, alpha = 1, dash = null } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
export function arrow(ctx, pts, o = {}) {                 // polyline arrow, u = how much of it is drawn (0..1)
  const { color = C.blue, lw = 1.4, u = 1, alpha = 1, dash = null, head = 4 } = o;
  if (u <= 0) return;
  const n = 24, P = []; for (let i = 0; i <= n; i++) P.push(pathAt(pts, u * i / n));
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.setLineDash([]);
  if (u > .96) { const a = P[n], b = P[n - 2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] - head * Math.cos(ang - .45), a[1] - head * Math.sin(ang - .45)); ctx.lineTo(a[0] - head * Math.cos(ang + .45), a[1] - head * Math.sin(ang + .45)); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
export function circle(ctx, x, y, r, o = {}) {
  const { fill = null, stroke = null, lw = 1, alpha = 1 } = o; ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } ctx.restore();
}
export function diamond(ctx, x, y, w, h, o = {}) {
  const { fill = null, stroke = null, lw = 1, alpha = 1 } = o; ctx.save(); ctx.globalAlpha *= alpha; ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.lineTo(x + w / 2, y); ctx.lineTo(x, y + h / 2); ctx.lineTo(x - w / 2, y); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } ctx.restore();
}
// Java String.hashCode as unsigned 32 bit, the HashMap spread, and the bit strings
export const jhash = s => { let h = 0; for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0; return h >>> 0; };
export const spread = h => (h ^ (h >>> 16)) >>> 0;
export const bits32 = u => { const a = []; for (let i = 31; i >= 0; i--) a.push((u >>> i) & 1); return a; };
