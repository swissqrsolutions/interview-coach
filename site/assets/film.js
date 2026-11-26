// Teaching films for Interview Coach, in the Whiteboard Explainer style (Lemo-Opuscar engine, MIT: assets/wb/).
// One film = media/<id>-film.json (board shapes, sentences, code panel, questions, rule card) + media/<id>.mp3 (the voice).
// Nothing topic-specific lives here: every shape comes from the JSON. Mount: <div data-film="<id>"></div> inside #app.
// Waits for ▶, no loop. prefers-reduced-motion → still frame + caption.
import * as W from './wb/wb.js';

const { INK } = W;
const VW = 1080, VH = 1350;
const VER = '1';   // bump when a film is re-recorded: the service worker caches media files for good
W.setView(VW, VH);
const GREY = '#6b7280';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let fontP = null;
const font = () => (fontP ||= W.loadFont('tech', new URL('./wb/EMSTech.json', import.meta.url)));

function arrowP(pts, o = {}) {
  const sh = W.poly(pts.flat(), { w: 7, jitter: .6, ...o });
  const head = (ex, ey, px, py) => { const a = Math.atan2(ey - py, ex - px), hl = 34; return [W.line(ex + Math.cos(a + 2.6) * hl, ey + Math.sin(a + 2.6) * hl, ex, ey, { w: 7, ...o, bow: 0 }), W.line(ex, ey, ex + Math.cos(a - 2.6) * hl, ey + Math.sin(a - 2.6) * hl, { w: 7, ...o, bow: 0 })]; };
  const n = pts.length, out = [sh, ...head(pts[n - 1][0], pts[n - 1][1], pts[n - 2][0], pts[n - 2][1])];
  if (o.both) out.push(...head(pts[0][0], pts[0][1], pts[1][0], pts[1][1]));
  out.shaft = sh; return out;
}

// ───────── a film = timeline + camera + magnets + captions
function makeFilm(script, J) {
  const tl = new W.Timeline();
  const pen = {
    K: new W.Pen('black', INK.black, { park: [VW + 260, VH + 160] }), Bl: new W.Pen('blue', INK.blue, { park: [VW + 300, VH - 200] }),
    R: new W.Pen('red', INK.red, { park: [VW + 200, VH + 260] }), G: new W.Pen('green', INK.green, { park: [VW + 320, VH + 80] }), O: new W.Pen('orange', INK.orange, { park: [VW + 240, VH - 40] }),
  };
  const mags = [], caps = [], overlays = [];
  const a = {
    pen, tl,
    draw: (p, shapes, t, by) => tl.draw(p, shapes, t, { by }),
    text: (s, [x, y], o = {}) => W.text(s, x, y, { h: 56, ...o }),
    cross: ([x, y], r = 34) => [W.line(x - r, y - r, x + r, y + r, { w: 9 }), W.line(x + r, y - r, x - r, y + r, { w: 9 })],
    // the felt eraser passes; each stroke vanishes when the eraser reaches it
    wipe: (strokes, t, dur) => {
      const L = strokes.flat(9); if (!L.length) return;
      const bx = Math.min(...L.map(s => s.box[0])) - 30, by = Math.min(...L.map(s => s.box[1])) - 30, ex = Math.max(...L.map(s => s.box[2])) + 30, ey = Math.max(...L.map(s => s.box[3])) + 30;
      const n = Math.max(1, Math.round((ey - by) / 110));
      tl.erase(W.zigzag(bx, by + 30, ex - bx, Math.max(1, ey - by - 60), n), t, dur, { strength: 0, width: 120 });
      const E = tl.erasers[tl.erasers.length - 1], S = [];
      for (let i = 0; i <= 60; i++) S.push(E.path.at(E.path.len * i / 60));
      for (const s of L) {
        const cx = (s.box[0] + s.box[2]) / 2, cy = (s.box[1] + s.box[3]) / 2; let bi = 0, bd = 1e18;
        S.forEach(([x, y], i) => { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; bi = i; } });
        const ht = t + dur * bi / 60; s.hide = tt => tt >= ht;
      }
    },
    blink: (strokes, t0, t1) => strokes.flat(9).forEach(s => { s.hide = t => t > t0 && t < t1 && ((t - t0) * 2.2) % 1 < .45; }),
    // a glossy magnet slides along arrow shafts: legs [[shaft, t0, t1, reverse]]
    magnet: (color, legs, o = {}) => mags.push({ color, legs: legs.map(([s, t0, t1, rev]) => ({ s, t0, t1, rev })), until: o.until ?? 1e9, size: o.size ?? 46 }),
    caption: (t, s) => caps.push([t, s]),
    overlay: f => overlays.push(f),
  };
  const cam = script(a, J);
  tl.end();
  const [BW, BH] = J.board || [2400, 3420];
  const board = new W.Board(tl, { W: BW, H: BH, ghosts: [] });
  for (const f of overlays) board.overlays.push({ draw: f });
  board.objs.push({ draw(ctx, t, c) { for (const e of tl.erasers) if (t > e.t0 - .6 && t < e.t1 + .6) W.drawEraser(ctx, e, t, c); } });
  board.objs.push({ draw(ctx, t, c) { for (const g of mags) drawMag(ctx, g, t, c); } });
  board.objs.push({ draw(ctx, t, c) { for (const k in pen) { const p = pen[k]; ctx.save(); W.drawMarker(ctx, p, W.penPose(p, t, cam), c, t); ctx.restore(); } } });
  let end = cam.k[cam.k.length - 1].t;
  for (const s of tl.strokes) if (s.t1 > end) end = s.t1;
  for (const e of tl.erasers) if (e.t1 + .5 > end) end = e.t1 + .5;
  for (const c of caps) if (c[0] + .6 > end) end = c[0] + .6;
  return { board, cam, caps, end: end + .3 };
}
const shade = (h, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(h.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
function drawMag(ctx, g, t, c) {
  if (t < g.legs[0].t0 || t > g.until) return;
  let leg = g.legs[0]; for (const L of g.legs) if (t >= L.t0) leg = L;
  const u = leg.t1 > leg.t0 ? Math.max(0, Math.min(1, (t - leg.t0) / (leg.t1 - leg.t0))) : 1, e = u * u * (3 - 2 * u);
  const [x, y] = leg.s.at(leg.s.len * (leg.rev ? 1 - e : e)), lift = leg.t1 > leg.t0 ? Math.sin(Math.PI * u) * .6 : 0;
  const [sx, sy] = W.toScreen(c, x, y), r = g.size * c.z, up = lift * 14 * c.z;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.save(); ctx.filter = `blur(${(5 + lift * 8) * c.z}px)`; ctx.fillStyle = `rgba(30,30,40,${.32 - lift * .1})`; ctx.beginPath(); ctx.arc(sx + 6 * c.z + up * .6, sy + 9 * c.z + up, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  const gr = ctx.createRadialGradient(sx - r * .35, sy - up - r * .4, r * .1, sx, sy - up, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, g.color); gr.addColorStop(1, shade(g.color, .55));
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(sx, sy - up, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(sx - r * .4, sy - up - r * .55, r * .3, r * .14, -.5, 0, Math.PI * 2); ctx.fill();
}

// ───────── the general teaching film: the JSON script drives the board, the camera, the code panel and the questions
// shapes (J.shapes, world units):
//   {rect, label, sub?, h?, sh?, thin?}   a box with a centred label (auto-shrinks to fit) and a grey second line
//   {rect, frame:true, label}             a grey frame with its name top left
//   {rect, lines:[…], label?, h?, bare?}  a box with a title and left-aligned lines (each line auto-shrinks)
//   {rect, area:true}                     nothing is drawn: a region the camera can frame
//   {arrow:[[x,y],…], both?, dashed?}     an arrow (blue by default)
//   {line:[[x,y],…]}                      a plain line
//   {circle:[cx,cy,r], label?, h?}        a circle with a centred label
//   {text, at:[x,y], h?, align?, w?}      loose text (w = max width, shrinks to fit)
//   any shape: pen 'K' | 'B' | 'R' | 'G' | 'O'
// J.goal [line1, line2] (optional) → a 'goal' box; its rect is J.shapes.goal.rect or top right of J.wide.
function genFilm(a, J) {
  const rec = [], S = J.shapes || {}, L = {}, SH = {};
  const WIDE = J.wide || [40, 80, 2020, 2100]; L.WIDE = WIDE;
  const { pen: { K, Bl, R, G, O } } = a, PENS = { K, B: Bl, R, G, O }, COL = { K: INK.black, B: INK.blue, R: INK.red, G: INK.green, O: INK.orange };
  const free = new Map();   // a pen writes one thing at a time: a late request waits for the pen
  const draw = (pen, shapes, t0, t1) => { const s = Math.max(t0, (free.get(pen) ?? -1e9) + .06), e = s + Math.max(.12, t1 - t0, .1 * [shapes].flat(9).length ** .5); free.set(pen, e); rec.push(shapes); a.draw(pen, shapes, s, e); return e; };
  const fitH = (str, h, maxW) => { const w = W.text(str, 0, 0, { h }).width; return w > maxW ? h * maxW / w : h; };
  const fitT = (str, x, y, h, maxW, o = {}) => W.text(str, x, y, { h: fitH(str, h, maxW), ...o });
  const frame = (k, label) => { const [x, y, w, h] = L[k], hh = Math.min(84, h * .16); return [...W.rect(x, y, w, h, { w: 5, over: 10, color: GREY, alpha: .75 }), ...fitT(label, x + 36, y + hh + 26, hh, w * .7, { color: GREY })]; };
  const box = (k, sp) => {
    const [x, y, w, h] = L[k], out = [...W.rect(x, y, w, h, sp.thin ? { w: 5, over: 4 } : { w: 8, over: 8 })];
    if (!sp.label) return out;
    const hh = Math.min(fitH(sp.label, sp.h || 90, w * .88), h * .62);
    if (sp.sub) {
      const sh = Math.min(fitH(sp.sub, sp.sh || (sp.sub.length > 24 ? 46 : 60), w * .9), h * .3), gap = sh * .3, top = y + (h - hh - gap - sh) / 2;
      out.push(...W.text(sp.label, x + w / 2, top + hh, { h: hh, align: 'center' }), ...W.text(sp.sub, x + w / 2, top + hh + gap + sh, { h: sh, align: 'center', color: GREY }));
    } else out.push(...W.text(sp.label, x + w / 2, y + h / 2 + hh * .42, { h: hh, align: 'center' }));
    return out;
  };
  const linesBox = (k, sp) => {
    const [x, y, w, h] = L[k], hh = sp.h || 46, pad = sp.bare ? 0 : 28, out = sp.bare ? [] : [...W.rect(x, y, w, h, { w: 6, over: 6 })];
    let yy = y + (sp.bare ? 0 : 22);
    if (sp.label) { const th = sp.th || hh * 1.25; yy += th * 1.15; out.push(...fitT(sp.label, x + pad, yy, th, w - 2 * pad)); yy += hh * .2; }
    for (const s of sp.lines) { yy += hh * 1.5; if (s) out.push(...fitT(s, x + pad, yy, hh, w - 2 * pad, sp.label && !sp.bare ? { color: GREY } : {})); }
    return out;
  };
  const arrow = (pts, o) => arrowP(pts, { w: 9, ...o });
  if (J.goal && !S.goal) S.goal = { rect: [WIDE[0] + WIDE[2] - 960, WIDE[1], 960, 260], lines: J.goal, h: 64, pen: 'O' };
  else if (J.goal && !S.goal.lines) S.goal = { ...S.goal, lines: J.goal, h: S.goal.h || 64, pen: S.goal.pen || 'O' };
  for (const [k, sp] of Object.entries(S)) {
    if (sp.rect) L[k] = sp.rect;
    if (sp.area) { SH[k] = []; continue; }
    if (sp.arrow) { SH[k] = sp.dashed ? W.dashed(sp.arrow, { w: 7, dash: 50, gap: 34 }) : arrow(sp.arrow, { both: !!sp.both }); if (sp.dashed) SH[k].shaft = W.poly(sp.arrow.flat(), { w: 1 }); }
    else if (sp.line) SH[k] = [W.poly(sp.line.flat(), { w: 7, jitter: .6 })];
    else if (sp.circle) { const [cx, cy, r] = sp.circle, hh = sp.label ? fitH(sp.label, sp.h || r * .8, r * 1.5) : 0; SH[k] = [W.circle(cx, cy, r, { w: 7 }), ...(sp.label ? W.text(sp.label, cx, cy + hh * .42, { h: hh, align: 'center' }) : [])]; L[k] = [cx - r, cy - r, 2 * r, 2 * r]; }
    else if (sp.text !== undefined) SH[k] = sp.w ? fitT(sp.text, sp.at[0], sp.at[1], sp.h || 56, sp.w, { align: sp.align || undefined }) : W.text(sp.text, sp.at[0], sp.at[1], { h: sp.h || 56, align: sp.align || undefined });
    else if (sp.frame) SH[k] = frame(k, sp.label);
    else if (sp.lines) SH[k] = linesBox(k, sp);
    else if (sp.rect) SH[k] = box(k, sp);
    if (!L[k]) { const B = SH[k].flat(9).map(s => s.box); L[k] = [Math.min(...B.map(b => b[0])), Math.min(...B.map(b => b[1]))]; L[k].push(Math.max(...B.map(b => b[2])) - L[k][0], Math.max(...B.map(b => b[3])) - L[k][1]); }
  }
  const penOf = k => PENS[S[k].pen] || (S[k].arrow ? Bl : K);
  const N = {}, pins = [], spots = [];
  const ring = k => { const [x, y, w, h] = L[k]; return W.circle(x + w / 2, y + h / 2, w / 2 + 50, { ry: h / 2 + 60, w: 9, lap: .3 }); };
  const parts = id => N[id] || SH[id];
  const len = sh => sh.flat(9).reduce((n, s) => n + (s.len || 0), 0);
  const DO = (t, x) => {
    const at = t + (x.a || 0);
    if (x.t !== undefined) { const o = { h: x.h, align: x.align || undefined }; draw(PENS[x.c] || R, N[x.id] = x.w ? fitT(x.t, x.x, x.y, x.h || 56, x.w, { align: o.align }) : a.text(x.t, [x.x, x.y], o), at, at + Math.min(1.6, .25 + x.t.length * .05)); }
    else if (x.show) { let s = at; for (const k of x.show) if (SH[k]) s = draw(penOf(k), SH[k], s, s + clamp(len(SH[k]) / 4000, .3, 1.6)); }
    else if (x.ring) draw(PENS[x.c] || R, N[x.id] = ring(x.ring), at, at + .8);
    else if (x.cross) draw(PENS[x.c] || R, N[x.id] = a.cross(x.cross, x.r), at, at + .5);
    else if (x.wipe) a.wipe(x.wipe.map(parts).filter(Boolean), at, x.d || .5);
    else if (x.dots) for (let i = 0; i < (x.n || 1); i++) a.magnet(COL[x.color] || INK.green, [[SH[x.dots].shaft, at + i * 2.1, at + i * 2.1 + (x.d || 1.6), x.back]], { until: at + i * 2.1 + (x.d || 1.6), size: x.size || 34 });
    else if (x.blink) a.blink(x.blink.map(parts).filter(Boolean), at, at + (x.d || 2));
    else if (x.pin) pins.push(x.pin === 'show' ? { t: at, to: x.at } : x.pin === 'hide' ? { t: at, to: null } : { t: at, path: SH[x.pin].shaft, d: x.d || 2.4, back: !!x.back });
  };
  const wz = Math.min(VW / (WIDE[2] * 1.06), VH / (WIDE[3] * 1.06)), zmax = J.zmax || wz * 2;
  // a shot must contain the part being talked about AND everything the marker writes during that sentence
  const bounds = (keys, strokes) => {
    const R0 = keys.filter(k => L[k]).map(k => { const [x, y, w, h] = L[k]; return [x, y, x + w, y + h]; });
    for (const st of strokes.flat(9)) if (st && st.box) R0.push(st.box);
    return R0.length ? [Math.min(...R0.map(r => r[0])), Math.min(...R0.map(r => r[1])), Math.max(...R0.map(r => r[2])), Math.max(...R0.map(r => r[3]))] : null;
  };
  const fitBox = (keys, strokes) => {
    const b = bounds(keys, strokes); if (!b) return null;
    const [x0, y0, x1, y1] = b, m = keys.length && keys.every(k => k === 'WIDE' || (S[k] && S[k].area)) ? 1.05 : 1.24, pad = m > 1.1 ? 80 : 30;
    return [(x0 + x1) / 2, (y0 + y1) / 2, clamp(Math.min(VW / ((x1 - x0) * m + pad), VH / ((y1 - y0) * m + pad)), wz, zmax)];
  };
  const fkeys = f => (Array.isArray(f) ? f : f && f !== 'TERM' ? [f] : []);
  let cam = fitBox(fkeys(J.phrases[0].focus).length ? fkeys(J.phrases[0].focus) : ['WIDE'], []) || fitBox(['WIDE'], []); const keys = [[0, ...cam]];
  for (const ph of J.phrases) {
    const t = ph.t, r0 = rec.length, list = (ph.draw || []).filter(k => SH[k] && SH[k].length);
    if (list.length) {
      const ds = list.map(k => clamp(len(SH[k]) / 4000, .35, 2.2)), tot = ds.reduce((x, y) => x + y, 0), sc = Math.min(1, Math.max(2.5, (ph.d || 3) * .9) / tot); let s = t + .3;
      // neighbours written with the same pen go down in one stroke of the hand
      for (let i = 0; i < list.length;) { let j = i, d = 0; const grp = []; while (j < list.length && penOf(list[j]) === penOf(list[i])) { grp.push(SH[list[j]]); d += ds[j] * sc; j++; } s = draw(penOf(list[i]), grp, s, s + d) + .04; i = j; }
    }
    (ph.acts || []).forEach(x => DO(t, x));
    a.caption(t, ph.cap);
    const wrote = rec.slice(r0), fk = fkeys(ph.focus);
    if (ph.focus !== 'TERM' || wrote.length) {
      const next = fitBox(fk, ph.tight ? [] : wrote);
      if (next) { keys.push([t, ...cam], [t + .7, ...next]); cam = next; }
    }
    // spotlight: one named part (the focus, or ph.spot while the camera stays on a region); what is written in this sentence stays lit too
    const sk = ph.spot || (typeof ph.focus === 'string' && S[ph.focus] && !S[ph.focus].area ? ph.focus : null), one = sk && L[sk] ? bounds([sk], wrote) : null;
    spots.push({ t, b: one });
  }
  keys.push([Math.max(J.end, keys[keys.length - 1][0] + .8), ...cam]);
  a.overlay((ctx, t, c) => {
    let sp = null; for (const x of spots) { if (t < x.t) break; sp = x; }
    if (!sp || !sp.b) return; const al = Math.min(1, (t - sp.t - .2) / .5) * .62; if (al <= 0) return;
    const [x0, y0, x1, y1] = sp.b, [ax, ay] = W.toScreen(c, x0 - 40, y0 - 40), [bx, by] = W.toScreen(c, x1 + 40, y1 + 40);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.roundRect(ax, ay, bx - ax, by - ay, 30);
    ctx.fillStyle = `rgba(240,240,238,${al})`; ctx.fill('evenodd');
    ctx.beginPath(); ctx.roundRect(ax, ay, bx - ax, by - ay, 30); ctx.lineWidth = 10; ctx.strokeStyle = `rgba(47,111,222,${al * .45})`; ctx.stroke();
  });
  // the "we are here" pin: shown at a point, or riding along an arrow
  a.overlay((ctx, t, c) => {
    let pos = null;
    for (const p of pins) { if (t < p.t) break; if (!p.path) { pos = p.to; continue; } const u = Math.min(1, (t - p.t) / p.d), e = u * u * (3 - 2 * u); pos = p.path.at(p.path.len * (p.back ? 1 - e : e)); }
    if (pos) W.drawPinMagnet(ctx, pos[0], pos[1] - 20, c, { size: 150 });
  });
  return new W.Camera(keys);
}

// ───────── mounting: the player (play/pause, seek, time, ±10 s, speed, volume, full screen, chapters, questions, rule card, code panel)
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
async function build(host, id) {
  host.classList.add('motion', 'mshort', 'mlong');
  host.innerHTML = `<div class="mwrap"><canvas width="${VW}" height="${VH}" aria-hidden="true"></canvas><button type="button" class="mbig" aria-label="Film abspielen">▶</button></div>
    <div class="mctl"><button type="button" class="mpp" aria-label="Abspielen oder Pause">▶</button><input class="mseek" type="range" min="0" max="1000" value="0" aria-label="Position"><span class="mtime">0:00</span></div>
    <div class="mctl mctl2"><button type="button" class="mback" aria-label="10 Sekunden zurück">⟲ 10</button><button type="button" class="mfwd" aria-label="10 Sekunden vor">10 ⟳</button><button type="button" class="mspd" aria-label="Geschwindigkeit">1×</button><span class="mvolbox"><button type="button" class="msnd" aria-label="Ton an oder aus">🔇</button><input class="mvol" type="range" min="0" max="100" value="80" aria-label="Lautstärke"></span><button type="button" class="mfs" aria-label="Vollbild">⛶</button></div>
    <p class="mcap" aria-live="polite"></p>`;
  const media = f => new URL(`../media/${f}?v=${VER}`, import.meta.url);
  const [, J] = await Promise.all([font(), fetch(media(id + '-film.json')).then(r => { if (!r.ok) throw new Error('film ' + r.status); return r.json(); })]);
  const F = makeFilm(genFilm, J); F.end = Math.max(F.end, J.end);
  const $ = q => host.querySelector(q);
  $('.mctl').insertAdjacentHTML('beforebegin', '<pre class="mterm" aria-label="Code"></pre>');
  const RU = J.rule;
  $('.mwrap').insertAdjacentHTML('beforeend', `<div class="mq" hidden></div>${RU ? `<div class="mrule" hidden><b>${esc(RU.title)}</b>${RU.rows.map((r, i) => `<div class="r${i + 1}">${r.map(c => `<span>${esc(c)}</span>`).join('')}</div>`).join('')}</div>` : ''}`);
  const chs = J.phrases.filter(p => p.ch);
  $('.mcap').insertAdjacentHTML('beforebegin', `<div class="mchap" role="group" aria-label="Kapitel">${chs.map(p => `<button type="button" data-t="${p.t}">${esc(p.ch)}</button>`).join('')}</div>`);
  const term = $('.mterm');
  // code panel: each entry types its line (slowly) after the current prompt; output lines follow
  const TE = J.phrases.flatMap(p => { let st = p.t + .35; return (p.term || []).map(e => { const x = { out: [], ...e, t: st, r: Math.max(16, e.cmd.length / 2.4) }; x.next = e.next || e.p; st += e.cmd.length / x.r + .5 + x.out.length * .25 + .4; return x; }); });
  const P0 = J.prompt || (TE[0] && TE[0].p) || 'jshell>';
  const phAt = t => { let c = null; for (const p of J.phrases) { if (t < p.t) break; c = p; } return c; };
  const cls = x => /Exception|Error|\bfalse\b|\bnull\b/.test(x) ? 'bad' : /\btrue\b/.test(x) ? 'ok' : '';
  const termAt = t => {
    const lines = []; let prompt = P0, typing = '';
    for (const e of TE) {
      if (t < e.t) break;
      const n = Math.floor((t - e.t) * e.r);
      if (n < e.cmd.length) { typing = e.cmd.slice(0, n); prompt = e.p; break; }
      lines.push({ p: e.p, c: e.cmd }); let ot = e.t + e.cmd.length / e.r + .4;
      for (const o of e.out) { if (t < ot) break; lines.push({ o }); ot += .25; }
      prompt = e.next; typing = '';
    }
    const ph = phAt(t), hl = ph && ph.hl && t > ph.t + .6 ? ph.hl : null;
    const row = l => l.o !== undefined ? `<span class="${cls(l.o)}${hl && l.o.includes(hl) ? ' hl' : ''}">${esc(l.o)}</span>` : `<span class="pr">${esc(l.p)}</span> <span class="c${hl && l.c.includes(hl) ? ' hl' : ''}">${esc(l.c)}</span>`;
    const all = [...lines.map(row), `<span class="pr">${esc(prompt)}</span> <span class="c">${esc(typing)}</span><span class="cur">▌</span>`];
    const html = all.slice(-8).map(x => `<div>${x}</div>`).join(''); if (term.innerHTML !== html) term.innerHTML = html;
    host.classList.toggle('mtermfocus', !!(ph && ph.focus === 'TERM'));
    host.classList.toggle('mtermidle', !(ph && (ph.focus === 'TERM' || (ph.term && ph.term.length))));   // old code steps back while the board talks
  };
  // captions: key words in the same colours as the board (J.kw = {r:[…], g:[…], o:[…], b:[…]})
  const KW = Object.entries(J.kw || {}).flatMap(([c, ws]) => ws.map(w => [w, c])).sort((x, y) => y[0].length - x[0].length), kwC = Object.fromEntries(KW);
  const kwRe = KW.length ? new RegExp('(^|[^\\w-])(' + KW.map(k => k[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\w-])', 'g') : null;
  const capHtml = s0 => (kwRe ? esc(s0).replace(kwRe, (m, pre, w) => `${pre}<b class="k${kwC[w]}">${w}</b>`) : esc(s0));
  const cv = $('canvas'), ctx = cv.getContext('2d'), cap = $('.mcap'), big = $('.mbig'), pp = $('.mpp'), bar = $('.mseek'), time = $('.mtime'), snd = $('.msnd'), fs = $('.mfs'), vol = $('.mvol'), spd = $('.mspd');
  const pref = (k, d) => { try { const v = JSON.parse(localStorage.getItem('ic:film-' + k)); return v ?? d; } catch { return d; } };
  const keep = (k, v) => { try { localStorage.setItem('ic:film-' + k, JSON.stringify(v)); } catch {} };
  let raf = 0, playing = false, T = 0, last = 0, muted = true, rate = pref('rate', 1), gain = null;
  const RATES = [.75, 1, 1.25, 1.5]; if (!RATES.includes(rate)) rate = 1;
  const audio = new Audio(media(id + '.mp3').href); audio.preload = 'auto';
  vol.value = Math.round(pref('vol', .8) * 100);
  // volume through the Web Audio mixer: iPhones ignore audio.volume, a gain node works everywhere
  const applyVol = () => { const v = vol.value / 100; keep('vol', v); if (gain) gain.gain.value = v * v; else audio.volume = v; snd.textContent = muted || v === 0 ? '🔇' : v < .5 ? '🔉' : '🔊'; };
  const mixer = () => { if (gain) return; try { const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(); const src = ac.createMediaElementSource(audio); gain = ac.createGain(); src.connect(gain).connect(ac.destination); ac.resume?.(); } catch { gain = null; } applyVol(); };
  const setRate = r => { rate = r; keep('rate', r); spd.textContent = (r === 1 ? '1' : String(r)) + '×'; audio.playbackRate = r; };
  setRate(rate);
  const syncAudio = () => { audio.playbackRate = rate; if (playing && !muted) { if (Math.abs(audio.currentTime - T) > .3) try { audio.currentTime = T; } catch {} audio.play().catch(() => {}); } else audio.pause(); };
  const soundOn = on => { muted = !on; if (on) { mixer(); if (vol.value == 0) vol.value = 60; } applyVol(); syncAudio(); };
  snd.onclick = () => soundOn(muted);
  vol.oninput = () => { if (muted && vol.value > 0) soundOn(true); else applyVol(); };
  spd.onclick = () => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length]);
  const showCap = t => {
    let c = null; for (const x of F.caps) { if (t < x[0]) break; c = x; }
    if (!c) { cap.style.opacity = 0; return; }
    if (cap.dataset.s !== c[1]) { cap.dataset.s = c[1]; cap.innerHTML = capHtml(c[1]); }
    cap.style.opacity = Math.min(1, (t - c[0]) / .5);
  };
  const ruleEl = $('.mrule'), qEl = $('.mq'), qDone = new Set(), chB = [...host.querySelectorAll('.mchap button')];
  const r0 = RU ? J.phrases.findIndex(p => p.rule || (RU.ch && p.ch === RU.ch)) : -1;
  let chOn = null;
  const extras = t => {
    const ph = phAt(t), i = J.phrases.indexOf(ph), end = t >= J.end - .1;
    if (ruleEl) { ruleEl.hidden = !(r0 >= 0 && i >= r0) && !end; ruleEl.classList.toggle('on1', (r0 >= 0 && i >= r0) || end); ruleEl.classList.toggle('on2', (r0 >= 0 && i >= r0 + 1) || end); }
    let on = null; for (const b of chB) if (+b.dataset.t <= t + .01) on = b;
    if (on !== chOn) { chB.forEach(b => b.classList.toggle('on', b === on)); chOn = on; if (on) { const box = on.parentElement; box.scrollLeft = on.offsetLeft - box.offsetLeft - 40; } }
  };
  const frame = t => { F.board.render(ctx, t, F.cam); showCap(t); termAt(t); extras(t); if (!bar.dragging) bar.value = Math.round(t / F.end * 1000); time.textContent = `${fmt(t)} / ${fmt(F.end)}`; };
  const jump = d => { qEl.hidden = true; T = Math.max(0, Math.min(F.end, T + d)); frame(T); syncAudio(); };
  $('.mback').onclick = () => jump(-10); $('.mfwd').onclick = () => jump(10);
  const ask = q => {
    pause(); qEl.hidden = false;
    qEl.innerHTML = `<p class="mqq">❓ ${esc(q.q)}</p>${q.opts.map((o, i) => `<button type="button" data-i="${i}">${esc(o[0])}</button>`).join('')}<p class="mqf" aria-live="polite"></p>`;
    qEl.querySelectorAll('button').forEach(b => b.onclick = () => {
      const o = q.opts[+b.dataset.i], f = qEl.querySelector('.mqf');
      if (o[1]) { b.classList.add('right'); f.textContent = '✓ Richtig.'; qDone.add(q.id); setTimeout(() => { if (qEl.hidden) return; qEl.hidden = true; play(); }, 1100); }
      else { b.classList.add('wrong'); f.textContent = `${o[2]} Nochmal versuchen.`; }
    });
  };
  const checkQ = (t0, t1) => { const q = (J.questions || []).find(q => !qDone.has(q.id) && q.t > t0 && q.t <= t1); if (q) { T = q.t; frame(T); ask(q); return true; } return false; };
  const setUI = () => { pp.textContent = playing ? '⏸' : '▶'; big.hidden = playing; };
  const tick = now => {
    if (!playing) return; if (!host.isConnected) return pause();
    const dt = Math.min(.05, (now - last) / 1000); last = now; const T0 = T;
    // the sound leads while it plays; if it is far off (a jump, or a file that can't seek yet), the film keeps its own clock and pulls the sound along
    if (!muted && !audio.paused && Math.abs(audio.currentTime - T) < 1.5) T = audio.currentTime;
    else { T += dt * rate; if (!muted && Math.abs(audio.currentTime - T) > 1.5) try { audio.currentTime = T; } catch {} }
    if (checkQ(T0, T)) return;
    frame(Math.min(T, F.end));
    if (T < F.end) raf = requestAnimationFrame(tick); else { playing = false; setUI(); syncAudio(); }
  };
  let first = true;
  const play = () => { if (!qEl.hidden) return; if (first) { first = false; soundOn(true); } if (T >= F.end - .05) T = 0; playing = true; last = performance.now(); setUI(); syncAudio(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
  const pause = () => { playing = false; cancelAnimationFrame(raf); setUI(); syncAudio(); };
  chB.forEach(b => b.onclick = () => { qEl.hidden = true; T = +b.dataset.t; frame(T); syncAudio(); if (!playing) play(); });
  pp.onclick = () => (playing ? pause() : play()); big.onclick = play; cv.onclick = () => (playing ? pause() : play());
  bar.oninput = () => { bar.dragging = true; qEl.hidden = true; T = bar.value / 1000 * F.end; frame(T); bar.dragging = false; };
  bar.onchange = () => { T = bar.value / 1000 * F.end; frame(T); syncAudio(); };
  const setFull = on => {
    host.classList.toggle('mfull', on); document.body.classList.toggle('mfull-open', on); fs.textContent = on ? '✕' : '⛶';
    if (on && host.requestFullscreen && !document.fullscreenElement) host.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  fs.onclick = () => setFull(!host.classList.contains('mfull'));
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && host.classList.contains('mfull')) setFull(false); });
  host._seek = t => { pause(); qEl.hidden = true; T = Math.min(t, F.end); frame(T); };   // for screenshots
  host._film = { J, end: F.end, play, pause, time: () => T, ask: i => ask(J.questions[i]) };
  setUI();
  if (reduce()) { T = F.end; frame(T); return; }
  frame(0);
  if (J.poster) F.board.render(ctx, Math.min(J.poster, F.end), F.cam);   // before the first play: a finished picture instead of an empty board
}
function scan(root) {
  root.querySelectorAll('[data-film]:not(.motion)').forEach(h => {
    const id = h.dataset.film;
    if (/^[a-z0-9-]+$/.test(id)) build(h, id).catch(e => { console.warn('film', e); h.remove(); });
    else h.remove();
  });
}
const app = document.getElementById('app');
if (app) { scan(app); new MutationObserver(() => scan(app)).observe(app, { childList: true }); }
