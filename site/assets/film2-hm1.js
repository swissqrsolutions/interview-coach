// Film 1 for the Java HashMap page: "Die Reise eines Schlüssels" (v2, flat blocks, no handwriting).
// create(J) -> { render(ctx, t) }: one persistent main picture, drawn completely for any second t (pure function of time).
// J (media/java-hashmap-1-film.json) supplies the start time and length of every spoken sentence; all motion hangs on those.
import { C, clamp, ease, ramp, lerp, between, stepAt, numAt, camAt, pathAt, rr, box, text, line, arrow, circle, diamond, jhash, spread, bits32 } from './film2-kit.js?f=2';

export const W = 390, H = 560;
const SY = i => 110 + i * 22.5;                  // top of bucket i
const NX = p => 72 + p * 70;                      // x of node number p in a chain
const NY = b => SY(b) + 2;
const NW = 58, NH = 18;
const LANE_Y = 110, STRIP_Y = 470;

export function create(J) {
  const PH = {}; J.phrases.forEach(p => { PH[p.id] = p; });
  const S = (id, o = 0) => PH[id].t + o, E = (id, o = 0) => PH[id].t + PH[id].d + o, D = id => PH[id].d;
  const END = J.end;

  // ───────────────────────── data: keys, nodes
  const KEY = k => { const h = jhash(k === 'null' ? '' : k), sp = spread(h); return { key: k, h, sp, rb: bits32(h), sb: bits32(sp), hs: h | 0, idx16: sp & 15, raw16: h & 15 }; };
  const KD = Object.fromEntries(['Bern', 'Aa', 'BB', 'Luzern', 'Basel', 'null'].map(k => [k, KEY(k)]));
  const nodes = [
    { id: 'demo', key: 'Bern', b: 0, p: 0, t0: S('node1', .3), t1: S('seven', .6), val: [[0, 1]], demo: true, reveal: [S('node2', .5), E('node2', -.4)], ghostNext: S('node3', .6) },
    { id: 'Bern', key: 'Bern', b: 0, p: 0, t0: S('node', 1.0), val: [[0, 1]] },
    { id: 'Aa', key: 'Aa', b: 0, p: 1, t0: S('app', .8), val: [[0, 1], [S('rep3', 1.9), 2]] },
    { id: 'BB', key: 'BB', b: 0, p: 2, t0: S('bb3', 3.1), val: [[0, 3]] },
    { id: 'Luzern', key: 'Luzern', b: 10, p: 0, t0: S('lz', 3.3), val: [[0, 4]] },
  ];
  const ND = Object.fromEntries(nodes.map(n => [n.id, n]));
  const ncol = {};                                   // node colour tracks: id -> [[t, colour]]
  const setCol = (id, t, c) => { (ncol[id] ||= []).push([t, c]); };
  const nodeCol = (id, t) => stepAt((ncol[id] || []).slice().sort((a, b) => a[0] - b[0]), t, 'ink');

  // flashes on nodes (a green or orange pulse that does not change the base colour)
  const nflash = [];                                  // {id, t0, d, c}
  // slot tints, pointers, tokens, bubbles, labels
  const tints = [];                                   // {b, t0, t1, c}
  const bursts = [];                                  // {x, y, t0, c}
  const pointers = [];                                // {label, x, y: t=>y, slot: t=>b, col: t=>c, t0, t1, w}
  const tokens = [];                                  // {t0, t1, pts, label, c, w, hold}
  const bubbles = [];                                 // {t0, t1, s, c, x, y}
  const labels = [];                                  // {t0, t1, s, x, y, c, size}

  // ───────────────────────── counters
  const sizeTr = [[0, 0], [S('node', 1.2), 1], [S('app', 1.0), 2], [S('bb3', 3.3), 3], [S('lz', 3.5), 4]];
  const capTr = [[0, 0], [S('lazy', 1.0), 16]];
  const thrTr = [[0, 0], [S('sixteen', .5), 12]];
  const modTr = [[0, 0], [S('node', 1.2), 1], [S('app', 1.0), 2], [S('bb3', 3.3), 3], [S('lz', 3.5), 4]];

  // ───────────────────────── key lane episodes
  const eps = [];
  function episode(label, t0, o = {}) {
    const kd = KD[label], k = o.mk ?? 1;
    eps.push({ kd, t0, hashT: t0 + (o.hash ?? .5), bitsT: t0 + (o.bits ?? .8), bitsDur: o.bd ?? .4, mixT: o.mix == null ? null : t0 + o.mix, mk: k, chips: o.chips || [] });
  }
  episode('Aa', S('aa'), { hash: .9, bits: 6.0 - 6.0 + 5.6 - 5.6 + 4.2 });                      // bits sweep is moved to 'bits' below
  eps[0].bitsT = S('bits', .3); eps[0].bitsDur = .9;
  episode('Luzern', S('lu1'), { hash: .6, bits: 1.4, bd: .8, mix: S('mix', .3) - S('lu1'), mk: 1, chips: [[S('nomix', .3), 'Bucket 0', C.red], [S('mix', .2), null, C.blue], [S('lu10', .6), 'Bucket 10', C.blue]] });
  episode('Bern', S('bern', .1), { hash: .5, bits: .9, bd: .4, mix: 1.4, mk: .55, chips: [[S('bern', 3.4), 'Bucket 0', C.blue]] });
  episode('Aa', S('aa2', .1), { hash: .5, bits: .8, bd: .3, chips: [[S('aa2', 1.9), 'Bucket 0', C.blue]] });
  episode('BB', S('bb1', .1), { hash: .5, bits: .8, bd: .3, chips: [[S('bb1', 1.9), 'Bucket 0', C.blue]] });
  episode('Aa', S('rep1', .1), { hash: .5, bits: .8, bd: .3, chips: [[S('rep1', 1.5), 'Bucket 0', C.blue]] });
  episode('Luzern', S('lz', .1), { hash: .5, bits: .8, bd: .3, mix: 1.1, mk: .5, chips: [[S('lz', 2.3), 'Bucket 10', C.blue]] });
  episode('BB', S('g1', .1), { hash: .5, bits: .8, bd: .3, chips: [[S('g1', 1.9), 'Bucket 0', C.blue]] });
  episode('Basel', S('g4', .1), { hash: .5, bits: .8, bd: .3, mix: 1.1, mk: .5, chips: [[S('g4', 2.4), 'Bucket 4', C.blue]] });
  episode('null', S('n1', .1), { hash: .5, bits: .8, bd: .3, chips: [[S('n1', 1.9), 'Bucket 0', C.blue]] });
  const stencil = [S('stencil', .3), S('bern')];       // the "15 = 1111" mask over the bit bar
  const laneOn = S('seven', -.3);

  // dots = the 7 put steps; k = how many are done
  const dotTr = [[0, 0]];
  const dk = (t, k) => dotTr.push([t, k]);
  for (let j = 1; j <= 7; j++) dk(S('seven', .5 + j * .17), j);
  dk(S('aa'), 0); dk(S('aa', 1.2), 1); dk(S('mix', 3.2), 2); dk(S('stencil', 1.4), 3);
  dk(S('bern'), 0); dk(S('bern', .7), 1); dk(S('bern', 2.4), 2); dk(S('bern', 3.4), 3); dk(S('empty', 1.0), 4);
  dk(S('aa2'), 0); dk(S('aa2', 1.9), 3); dk(S('aa2', 2.9), 4); dk(S('cmp', .5), 5);
  dk(S('bb1'), 0); dk(S('bb1', 1.9), 3); dk(S('bb1', 2.7), 4); dk(S('bb1', 2.9), 5);
  dk(S('rep1'), 0); dk(S('rep1', 1.5), 3); dk(S('rep1', 2.5), 4); dk(S('rep1', 2.7), 5);
  dk(S('lz'), 0); dk(S('lz', 2.3), 3); dk(S('lz', 2.8), 4); dk(S('lz', 3.5), 5); dk(S('gates', 1.9), 6); dk(S('gates', 3.2), 7);
  const dotsOn = [S('seven', -.2), S('g1', -.3)];

  // ───────────────────────── scene choreography on the array
  const SLOT_ON = S('ghost', .2), SOLID = S('lazy', .4);
  const hdrT = S('box', .1), fieldsT = [S('fields', .6), E('fields', -1.0)];
  const codeFrom = S('box', 1.0);

  // camera: the array region zooms; lane, header and code strip never move
  const cam = [[0, 195, 290, 1], [S('node1'), 195, 290, 1], [S('node1', 1.1), 101, 121, 4.2], [E('node3', 1.0), 101, 121, 4.2], [S('seven', .2), 195, 290, 1],
  [S('rep3'), 195, 290, 1], [S('rep3', 1.1), 170, 121, 4.2], [E('rep3', .5), 170, 121, 4.2], [S('rep4', .3), 195, 290, 1]];

  // --- Aufbau: lazy table
  // --- Hash scene pointers (ghost arrows to the bucket)
  const cmpY = SY(0) + 31, CX = p => NX(p) + 29;     // key tokens wait UNDER the chain while they compare
  const lu10m = S('lu10', .4);
  pointers.push({ label: 'Aa', x: 112, y: () => 150, slot: () => 0, col: () => C.red, t0: S('nomix', .3), t1: S('bern'), w: 34, colAfter: [[S('lu10', .2), C.blue]] });
  pointers.push({ label: 'Luzern', x: 112, y: t => lerp(180, SY(10) + 11, ramp(t, lu10m, 1.0)), slot: t => (t < lu10m + .1 ? 0 : 10), col: t => (t < S('lu10', .2) ? C.red : C.blue), t0: S('nomix', .3), t1: S('bern'), w: 54 });
  tints.push({ b: 0, t0: S('nomix', .7), t1: S('lu10', .5), c: C.red });
  tints.push({ b: 10, t0: S('lu10', 1.3), t1: S('stencil'), c: C.green });
  bursts.push({ x: 46, y: SY(0) + 11, t0: S('nomix', .7), c: C.red });
  labels.push({ t0: S('nomix', 1.0), t1: S('mix'), s: 'Kollision', x: 205, y: 165, c: C.red, size: 12 });

  // --- put Bern into the empty bucket
  tokens.push({ t0: S('empty', .1), t1: S('empty', .9), pts: [[35, 30], [46, 100], [46, SY(0) + 11]], label: 'Bern', c: C.blue, w: 36, hold: S('node', .1) });
  tokens.push({ t0: S('node', .1), t1: S('node', .9), pts: [[46, SY(0) + 11], [NX(0) + NW / 2, SY(0) + 11]], label: 'Bern', c: C.blue, w: 36, hold: S('node', .95) });
  tints.push({ b: 0, t0: S('empty', .9), t1: S('node', .9), c: C.green });
  labels.push({ t0: S('empty', 1.1), t1: S('node', .8), s: 'leer', x: 120, y: SY(0) + 11, c: C.green, size: 11 });

  // --- Aa collides
  tokens.push({ t0: S('aa2', 1.9), t1: S('aa2', 2.9), pts: [[35, 30], [46, 100], [46, cmpY], [CX(0), cmpY]], label: 'Aa', c: C.blue, w: 30, hold: S('app', .1) });
  tokens.push({ t0: S('app', .1), t1: S('app', .75), pts: [[CX(0), cmpY], [CX(1), cmpY]], label: 'Aa', c: C.blue, w: 30, hold: S('app', .8) });
  setCol('Bern', S('aa2', 3.0), 'red'); setCol('Bern', S('koll', 2.0), 'ink');
  labels.push({ t0: S('koll', 1.1), t1: S('cmp', .2), s: 'Kollision', x: 120, y: SY(0) + 32, c: C.red, size: 12 });
  setCol('Bern', S('cmp', .4), 'orange'); setCol('Bern', S('cmp', 3.0), 'ink');
  bubbles.push({ t0: S('cmp', .5), t1: S('app', .2), s: '2066880 ≠ 2112', c: C.orange, x: 280, y: SY(0) + 2 });

  // --- BB: same hash as Aa
  tokens.push({ t0: S('bb1', 1.9), t1: S('bb1', 2.7), pts: [[35, 30], [46, 100], [46, cmpY], [CX(0), cmpY]], label: 'BB', c: C.blue, w: 30, hold: S('bb1', 3.9) });
  tokens.push({ t0: S('bb1', 3.9), t1: S('bb1', 4.3), pts: [[CX(0), cmpY], [CX(1), cmpY]], label: 'BB', c: C.blue, w: 30, hold: S('bb3', 2.5) });
  tokens.push({ t0: S('bb3', 2.5), t1: S('bb3', 3.1), pts: [[CX(1), cmpY], [CX(2), cmpY]], label: 'BB', c: C.blue, w: 30, hold: S('bb3', 3.15) });
  setCol('Bern', S('bb1', 2.8), 'orange'); setCol('Bern', S('bb1', 3.8), 'ink');
  bubbles.push({ t0: S('bb1', 2.9), t1: S('bb1', 3.9), s: '2066880 ≠ 2112', c: C.orange, x: 280, y: SY(0) + 2 });
  setCol('Aa', S('bb1', 4.3), 'orange'); setCol('Aa', S('bb3', 3.1), 'ink');
  bubbles.push({ t0: S('bb1', 4.4), t1: S('bb3', 3.1), s: '2112 = 2112', c: C.orange, x: 280, y: SY(0) + 2 });
  // lamps: hash lamp + equals lamp
  const lampWin = [[S('bb2', .1), E('bb4', .6)], [S('rep2', .1), S('rep3', .6)]];
  const eqTr = [[0, 'q'], [S('bb3', 1.3), 'f'], [S('rep2', .0), 'q'], [S('rep2', 1.7), 't']];
  const hashLampDim = [S('bb4', .8), S('bb4', 4)];
  // replace
  tokens.push({ t0: S('rep1', 1.6), t1: S('rep1', 2.5), pts: [[35, 30], [46, 100], [46, cmpY], [CX(0), cmpY]], label: 'Aa', c: C.blue, w: 30, hold: S('rep1', 3.4) });
  tokens.push({ t0: S('rep1', 3.4), t1: S('rep1', 3.9), pts: [[CX(0), cmpY], [CX(1), cmpY]], label: 'Aa', c: C.blue, w: 30, hold: S('rep3', .1) });
  setCol('Bern', S('rep1', 2.6), 'orange'); setCol('Bern', S('rep1', 3.6), 'ink');
  bubbles.push({ t0: S('rep1', 2.7), t1: S('rep1', 3.6), s: '2066880 ≠ 2112', c: C.orange, x: 280, y: SY(0) + 2 });
  setCol('Aa', S('rep1', 3.95), 'orange'); setCol('Aa', S('rep2', 1.7), 'green'); setCol('Aa', S('rep4', .5), 'ink');
  bubbles.push({ t0: S('rep1', 4.0), t1: S('rep3', .2), s: '2112 = 2112', c: C.orange, x: 280, y: SY(0) + 2 });
  nflash.push({ id: 'Aa', t0: S('rep3', 1.9), d: 1.2, c: C.green });

  // --- Luzern
  tokens.push({ t0: S('lz', 1.8), t1: S('lz', 2.7), pts: [[35, 30], [46, 100], [46, SY(10) + 11]], label: 'Luzern', c: C.blue, w: 46, hold: S('lz', 3.0) });
  tokens.push({ t0: S('lz', 3.0), t1: S('lz', 3.35), pts: [[46, SY(10) + 11], [NX(0) + 24, SY(10) + 11]], label: 'Luzern', c: C.blue, w: 46, hold: S('lz', 3.4) });
  tints.push({ b: 10, t0: S('lz', 2.7), t1: S('lz', 3.3), c: C.green });
  // gates + check token
  const gates = [{ x: 353, y: 346, s: 'Baum?', t: S('gates', 1.9) }, { x: 353, y: 410, s: 'Voll?', t: S('gates', 3.2) }];
  const gatesOn = S('gates', .1);
  tokens.push({ t0: S('gates', .9), t1: S('gates', 1.9), pts: [[NX(0) + NW + 4, SY(10) + 11], [353, SY(10) + 11]], label: '✓', c: C.green, w: 16, hold: S('gates', 2.1) });
  tokens.push({ t0: S('gates', 2.1), t1: S('gates', 3.2), pts: [[353, SY(10) + 11], [353, 410]], label: '✓', c: C.green, w: 16, hold: S('gates', 3.5) });
  labels.push({ t0: S('gates2', 1.8), t1: END + 5, s: 'Film 2', x: 353, y: 446, c: C.greyD, size: 11 });
  labels.push({ t0: S('gates2', 1.8), t1: S('g1'), s: '', x: 0, y: 0, c: C.greyD, size: 1 });

  // --- get
  tokens.push({ t0: S('g1', 2.0), t1: S('g1', 2.8), pts: [[35, 30], [46, 100], [46, cmpY], [CX(0), cmpY]], label: 'BB', c: C.purple, w: 30, hold: S('g2', 1.2) });
  tokens.push({ t0: S('g2', 1.2), t1: S('g2', 1.6), pts: [[CX(0), cmpY], [CX(1), cmpY]], label: 'BB', c: C.purple, w: 30, hold: S('g2', 3.0) });
  tokens.push({ t0: S('g2', 3.0), t1: S('g2', 3.4), pts: [[CX(1), cmpY], [CX(2), cmpY]], label: 'BB', c: C.purple, w: 30, hold: S('g3', .2) });
  setCol('Bern', S('g2', .1), 'orange'); setCol('Bern', S('g2', 1.4), 'ink'); bubbles.push({ t0: S('g2', .2), t1: S('g2', 1.5), s: 'Bern ≠ BB', c: C.orange, x: 280, y: SY(0) + 2 });
  setCol('Aa', S('g2', 1.7), 'orange'); setCol('Aa', S('g2', 3.1), 'ink'); bubbles.push({ t0: S('g2', 1.8), t1: S('g2', 3.1), s: 'Aa ≠ BB', c: C.orange, x: 280, y: SY(0) + 2 });
  setCol('BB', S('g2', 3.4), 'orange'); setCol('BB', S('g3', .3), 'green'); setCol('BB', S('g4', .2), 'ink');
  bubbles.push({ t0: S('g2', 3.5), t1: S('g4', .2), s: 'BB = BB', c: C.green, x: 280, y: SY(0) + 2 });
  tokens.push({ t0: S('g3', 1.3), t1: S('g3', 2.2), pts: [[NX(2) + 29, SY(0) + 11], [310, 150]], label: '3', c: C.green, w: 18, hold: S('g3', 2.3) });
  const results = [{ t0: S('g3', 2.3), t1: S('g4', .2), s: '→ 3', c: C.green, x: 290, y: 142, w: 60 }];
  tokens.push({ t0: S('g4', 2.0), t1: S('g4', 2.9), pts: [[35, 30], [46, 100], [46, SY(4) + 11]], label: 'Basel', c: C.purple, w: 40, hold: S('n1', -.5) });
  tints.push({ b: 4, t0: S('g4', 2.9), t1: S('n1', -.3), c: C.greyD });
  labels.push({ t0: S('g5', .2), t1: S('n1', -.3), s: 'leer', x: 100, y: SY(4) + 11, c: C.green, size: 11 });
  results.push({ t0: S('g5', 2.2), t1: S('n1', -.3), s: 'null', c: C.greyD, x: 140, y: SY(4) + 2, w: 46, grey: true });

  // --- null key
  tokens.push({ t0: S('n1', 1.9), t1: S('n1', 2.9), pts: [[35, 30], [46, 100], [46, SY(0) + 11]], label: 'null', c: C.red, w: 30, hold: S('n2', .0) });
  labels.push({ t0: S('n1', 3.1), t1: S('n2', .3), s: 'Hash 0', x: 120, y: SY(0) + 32, c: C.red, size: 12 });

  // --- Beweis flashes
  [['Bern', 0.3], ['Aa', 0.9], ['BB', 1.5]].forEach(([id, o]) => nflash.push({ id, t0: S('b2', o), d: .55, c: C.green }));
  tints.push({ b: 10, t0: S('b3', .3), t1: S('b3', 1.4), c: C.orange });
  labels.push({ t0: S('b3', .3), t1: S('end1', .2), s: 'Zuerich', x: NX(1) + 20, y: SY(10) + 11, c: C.greyD, size: 11 });
  // --- Ende
  const rings = [{ t0: S('end1', .4), t1: END + 9, b: 0, c: C.blue, w: 3 * 70 - 6 }, { t0: S('end1', .8), t1: END + 9, b: 10, c: C.blue, w: 64 }];
  ['Bern', 'Aa', 'BB'].forEach((id, i) => nflash.push({ id, t0: S('end2', .3 + i * .6), d: .6, c: C.orange }));

  // ───────────────────────── code strip
  const OUT = [['Bern hashCode=2066911 index=0'], ['Zuerich hashCode=1717339206 index=10'], ['Aa hashCode=2112 index=0'], ['BB hashCode=2112 index=0']];
  const code = [
    [codeFrom, { l1: 'Map<String,Integer> map = new HashMap<>();', hl: 1 }],
    [S('lazy', .3), { l1: 'Map<String,Integer> map = new HashMap<>();', l2: 'map.put("Bern", 1);', hl: 2 }],
    [S('node1'), { l1: 'class Node { int hash; K key; V value; Node next; }', hl: 1 }],
    [S('seven'), { l1: 'int h = key.hashCode();', l2: 'int hash = h ^ (h >>> 16);', hl: 0 }],
    [S('aa'), { l1: 'int h = key.hashCode();', l2: 'int hash = h ^ (h >>> 16);', hl: 1 }],
    [S('mix'), { l1: 'int h = key.hashCode();', l2: 'int hash = h ^ (h >>> 16);', hl: 2 }],
    [S('stencil'), { l1: 'int hash = h ^ (h >>> 16);', l2: 'int index = (n - 1) & hash;', hl: 2 }],
    [S('ruler'), { l1: 'new HashMap<>(1000).put(0, 0);', l2: '', hl: 1, out: [['capacity=1024 threshold=768', S('ruler', 2.5)]], badge: S('ruler', 2.5) }],
    [S('masks'), { l1: 'int index = (n - 1) & hash;', l2: '', hl: 1 }],
    [S('bern'), { l1: 'map.put("Bern", 1);', l2: 'int index = (16 - 1) & hash;  // 0', hl: 1 }],
    [S('empty'), { l1: 'map.put("Bern", 1);', l2: 'if (table[index] == null) table[index] = newNode(...);', hl: 2 }],
    [S('aa2'), { l1: 'map.put("Aa", 1);', l2: '', hl: 1 }],
    [S('cmp'), { l1: 'map.put("Aa", 1);', l2: 'p.hash == hash && key.equals(p.key)', hl: 2 }],
    [S('app'), { l1: 'map.put("Aa", 1);', l2: 'p.next = newNode(hash, key, value, null);', hl: 2 }],
    [S('bb1'), { l1: 'map.put("BB", 3);', l2: 'p.hash == hash && key.equals(p.key)', hl: 1 }],
    [S('rep1'), { l1: 'map.put("Aa", 2);', l2: 'p.hash == hash && key.equals(p.key)', hl: 1 }],
    [S('rep3'), { l1: 'map.put("Aa", 2);', l2: 'e.value = value;', hl: 2 }],
    [S('lz'), { l1: 'map.put("Luzern", 4);', l2: '', hl: 1 }],
    [S('gates'), { l1: 'if (binCount >= TREEIFY_THRESHOLD - 1) treeifyBin();', l2: 'if (++size > threshold) resize();', hl: 1 }],
    [S('gates', 2.9), { l1: 'if (binCount >= TREEIFY_THRESHOLD - 1) treeifyBin();', l2: 'if (++size > threshold) resize();', hl: 2 }],
    [S('g1'), { l1: 'map.get("BB");', l2: '', hl: 1 }],
    [S('g3'), { l1: 'map.get("BB");', l2: '', hl: 1, out: [['→ 3', S('g3', 2.3)]] }],
    [S('g4'), { l1: 'map.get("Basel");', l2: '', hl: 1 }],
    [S('g5'), { l1: 'map.get("Basel");', l2: '', hl: 1, out: [['→ null', S('g5', 2.2)]] }],
    [S('n1'), { l1: 'map.put(null, 0);   // hash 0 -> Bucket 0', l2: '', hl: 1 }],
    [S('n3'), { l1: 'map.get("X");          // null', l2: 'map.containsKey("X");  // ?', hl: 1 }],
    [S('n4'), { l1: 'map.put("K", null);', l2: 'map.get("K");          // null', hl: 2 }],
    [S('n5'), { l1: 'map.containsKey("X");  // false', l2: 'map.containsKey("K");  // true', hl: 1, hl2: S('n5', 3.0) }],
    [S('e1'), { l1: 'for (String k : map.keySet()) map.get(k);', l2: '', hl: 1 }],
    [S('e2'), { l1: 'for (var e : map.entrySet()) e.getValue();', l2: '', hl: 1 }],
    [S('b1'), { l1: 'print(k, k.hashCode(), spread(k) & 15);', l2: '', hl: 0, out: OUT.map((o, i) => [o[0], S('b1', .9 + i * .45)]), badge: S('b1', .3), proof: true }],
  ];
  // highlighted output lines (Beweis): [lineIndex, t0, t1]
  const outHl = [[0, S('b2', .3), S('b2', .85)], [2, S('b2', .9), S('b2', 1.45)], [3, S('b2', 1.5), S('b2', 2.05)], [1, S('b3', .3), S('b3', 1.5)]];

  // ───────────────────────── panels (drawn over the array region, fading in and out)
  const panels = [];
  const panel = (t0, t1, y0, draw) => panels.push({ t0, t1, y0, draw });

  // 0 · Gerüst tiles
  const tileNames = ['Warum?', 'Wie innen?', 'Zahlen', 'Vergleich', 'Produktion', 'Design'];
  const shrinkT = E('focus', 1.2);
  panel(0, shrinkT + 1.1, 0, (ctx, t) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, STRIP_Y);
    tileNames.forEach((nm, i) => {
      const col = i % 2, row = (i / 2) | 0, x = 15 + col * 190, y = 70 + row * 112;
      const ap = ramp(t, S('tiles', .2 + i * .45), .45); if (ap <= 0) return;
      const lit = i < 2, on = ramp(t, S('focus', .3 + (i % 2) * 1.6), .4);
      const shr = ramp(t, shrinkT, .9), cx = x + 80, cy = y + 46, sc = ap * (1 - shr);
      ctx.save(); ctx.translate(lerp(cx, 195, shr), lerp(cy, 235, shr)); ctx.scale(sc, sc);
      const dim = lit ? 1 : lerp(1, .28, ramp(t, S('focus', .3), .5));
      ctx.globalAlpha *= dim;
      box(ctx, -80, -46, 160, 92, { fill: lit && on > .5 ? C.blue : C.greyL, stroke: lit && on > .5 ? C.blueD : C.grey, lw: 1.5, r: 12 });
      text(ctx, nm, 0, 0, { size: 17, color: lit && on > .5 ? C.white : C.ink, align: 'center', weight: 700 });
      ctx.restore();
    });
  });

  // 1 · Warum? the race
  const listT0 = S('list', .5), step = .27, jumpT = S('jump', .5);
  const raceEnd = S('fields', -.3);
  panel(S('list', -.4), raceEnd, 0, (ctx, t) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, STRIP_Y);
    text(ctx, 'Liste', 85, 22, { size: 15, weight: 800, align: 'center' }); text(ctx, 'HashMap', 295, 22, { size: 15, weight: 800, align: 'center', color: C.blue });
    const fin = ((t - listT0) / step) | 0, cur = clamp(fin, -1, 13);                  // card being checked (0-based), -1 = none
    for (let i = 0; i < 16; i++) {
      const y = 40 + i * 25, done = t >= listT0 + (i + 1) * step - .02 && i < 13, now = i === cur && t >= listT0, hit = i === 13 && t >= listT0 + 13.4 * step;
      box(ctx, 20, y, 130, 21, { fill: hit ? C.green : now ? C.orange : done ? C.greyL : C.white, stroke: hit ? C.green : now ? C.orange : C.grey, lw: 1.2, r: 4, alpha: i > 13 ? .5 : 1 });
      text(ctx, i + 1, 85, y + 11, { size: 11, align: 'center', color: hit || now ? C.white : C.greyD, weight: 700 });
      if (done) text(ctx, '✗', 138, y + 11, { size: 11, align: 'center', color: C.red, alpha: .8 });
    }
    // the finger
    if (t >= listT0 - .2 && t < jumpT) { const k = clamp((t - listT0) / step, 0, 13), fy = 40 + k * 25 + 10.5; circle(ctx, 163, fy, 7, { fill: C.orange, stroke: C.white, lw: 2 }); text(ctx, '◀', 154, fy, { size: 8, color: C.orange, align: 'center' }); }
    const steps = t < listT0 ? 0 : Math.min(14, 1 + ((t - listT0) / step | 0)), end = ramp(t, S('race', .3), .4);
    text(ctx, steps + (steps === 1 ? ' Schritt' : ' Schritte'), 85, 458, { size: 15, weight: 800, align: 'center', color: end > .5 ? C.red : C.ink });
    // right: a mini array and one jump
    const jt = clamp((t - jumpT) / .9), land = jt >= 1;
    for (let i = 0; i < 16; i++) {
      const y = 40 + i * 25; box(ctx, 255, y, 75, 21, { fill: land && i === 10 ? C.green : C.greyL, stroke: C.grey, lw: 1, r: 4 });
      text(ctx, i, 247, y + 11, { size: 9, align: 'right', color: C.grey });
    }
    if (t >= jumpT - .1) {
      const x = lerp(352, 292, ease(jt)), yb = lerp(48, 40 + 10 * 25 + 10.5, ease(jt)) - Math.sin(Math.PI * jt) * 38;
      const lead = jt < 1 ? 1 : 1; box(ctx, x - 22, yb - 10, 44, 20, { fill: C.blue, r: 5 }); text(ctx, 'Luzern', x, yb, { size: 10, color: C.white, align: 'center', weight: 700, alpha: lead });
    }
    const one = t >= jumpT + .9;
    text(ctx, one ? '1 Schritt' : '', 295, 458, { size: 15, weight: 800, align: 'center', color: end > .5 ? C.green : C.ink });
    if (end > .5) { const k = 1 + .1 * Math.sin(clamp((t - S('race', .3)) / .8) * Math.PI); }
  });

  // Ruler + masks (Index scene)
  const rulerT = [S('ruler', .1), S('masks', -.2)], masksT = [S('masks', -.1), S('bern', -.2)];
  panel(rulerT[0], rulerT[1] + .3, LANE_Y, (ctx, t) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, LANE_Y, W, 360);
    text(ctx, 'Zweierpotenzen', 195, 150, { size: 14, weight: 800, align: 'center' });
    const xs = [30, 85, 140, 195, 250, 305, 360], names = ['16', '32', '64', '128', '256', '512', '1024'];
    line(ctx, 22, 235, 368, 235, { color: C.ink, lw: 2 });
    xs.forEach((x, i) => { const a = ramp(t, S('ruler', .3 + i * .18), .3); line(ctx, x, 225, x, 245, { color: C.blue, lw: 2, alpha: a }); text(ctx, names[i], x, 262, { size: 11, align: 'center', weight: 700, alpha: a, color: i === 6 ? C.blue : C.ink }); });
    const m = ramp(t, S('ruler', 1.6), .5), snap = ramp(t, S('ruler', 2.8), .7), mx = lerp(332, 360, snap);   // 1000 sits just before the 1024 tick
    box(ctx, mx - 25, 180 - 4 * (1 - snap), 50, 24, { fill: snap > .6 ? C.green : C.orange, r: 6, alpha: m }); text(ctx, snap > .6 ? '1024' : '1000', mx, 192 - 4 * (1 - snap), { size: 13, color: C.white, align: 'center', weight: 800, alpha: m });
    line(ctx, mx, 205, mx, 225, { color: snap > .6 ? C.green : C.orange, lw: 2, alpha: m });
  });
  panel(masksT[0], masksT[1] + .3, LANE_Y, (ctx, t) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, LANE_Y, W, 360);
    text(ctx, 'n − 1', 195, 150, { size: 14, weight: 800, align: 'center' });
    [['16', '15', 4], ['32', '31', 5], ['64', '63', 6]].forEach(([n, m1, k], r) => {
      const y = 190 + r * 70, a = ramp(t, S('masks', .5 + r * 1.7), .45); if (a <= 0) return;
      text(ctx, 'n = ' + n, 28, y + 14, { size: 14, weight: 800, alpha: a }); text(ctx, m1, 100, y + 14, { size: 14, weight: 700, color: C.greyD, alpha: a });
      for (let i = 0; i < k; i++) { box(ctx, 140 + i * 36, y, 32, 28, { fill: C.blueD, r: 5, alpha: a * ramp(t, S('masks', .6 + r * 1.7 + i * .12), .2) }); text(ctx, '1', 156 + i * 36, y + 15, { size: 15, color: C.white, align: 'center', weight: 800, alpha: a }); }
    });
  });

  // 11 · null: two mini scenes + containsKey lamp
  panel(S('n2', .2), S('e1', -.3), LANE_Y, (ctx, t) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, LANE_Y, W, 360);
    const cards = [{ x: 12, title: 'Schlüssel fehlt', q: 'get(X)', t0: S('n3', .3), res: S('n3', 2.4), lamp: S('n5', 2.0), ok: false }, { x: 198, title: 'Wert ist null', q: 'get(K)', t0: S('n4', .3), res: S('n4', 2.6), lamp: S('n5', 3.2), ok: true }];
    cards.forEach((c, ci) => {
      const a = ramp(t, S('n2', .5 + ci * .5), .5); if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a;
      box(ctx, c.x, 128, 180, 322, { fill: C.white, stroke: C.grey, lw: 1.5, r: 12 });
      text(ctx, c.title, c.x + 90, 150, { size: 14, weight: 800, align: 'center' });
      box(ctx, c.x + 20, 215, 40, 24, { fill: C.greyL, stroke: C.grey, r: 4 });
      if (c.ok) { box(ctx, c.x + 66, 215, 96, 24, { fill: C.ink, r: 4 }); text(ctx, 'K : null', c.x + 114, 227, { size: 11, color: C.white, align: 'center', weight: 700 }); }
      else text(ctx, 'leer', c.x + 114, 227, { size: 11, color: C.grey, align: 'center' });
      const u = ramp(t, c.t0, .9);
      if (t >= c.t0 - .05) { const y = lerp(172, 217, u); box(ctx, c.x + 14, y, 52, 20, { fill: C.purple, r: 5 }); text(ctx, c.q, c.x + 40, y + 10, { size: 10, color: C.white, align: 'center', weight: 700 }); }
      const r = ramp(t, c.res, .4); if (r > 0) { box(ctx, c.x + 40, 300, 100, 28, { fill: C.greyL, stroke: C.grey, r: 6, alpha: r }); text(ctx, '→ null', c.x + 90, 314, { size: 14, color: C.greyD, align: 'center', weight: 800, alpha: r }); }
      const l = ramp(t, c.lamp, .35); if (l > 0) { circle(ctx, c.x + 30, 395, 11, { fill: c.ok ? C.green : C.red, alpha: l }); text(ctx, c.ok ? 'true' : 'false', c.x + 52, 395, { size: 14, weight: 800, color: c.ok ? C.green : C.red, alpha: l }); text(ctx, 'containsKey', c.x + 90, 428, { size: 11, weight: 700, color: C.greyD, align: 'center', alpha: l }); }
      ctx.restore();
    });
  });

  // 12 · entrySet: keySet + get walks twice, entrySet once
  panel(S('e1', -.4), S('b1', -.2), LANE_Y, (ctx, t) => {
    ctx.fillStyle = C.bg; ctx.fillRect(0, LANE_Y, W, 360);
    const keys = ['Bern', 'Aa', 'BB'], tw = .45;
    [{ ox: 10, title: 'keySet + get', per: 2, t0: S('e1', .5), col: C.red }, { ox: 200, title: 'entrySet', per: 1, t0: S('e2', .3), col: C.green }].forEach((h, hi) => {
      const act = hi === 0 ? 1 : ramp(t, S('e2', -.2), .4) * .7 + .3;
      ctx.save(); ctx.globalAlpha *= hi === 0 ? 1 : act;
      box(ctx, h.ox, 128, 180, 322, { fill: C.white, stroke: C.grey, lw: 1.5, r: 12 });
      text(ctx, h.title, h.ox + 90, 150, { size: 14, weight: 800, align: 'center' });
      let walks = 0;
      keys.forEach((k, i) => {
        const y = 200 + i * 70;
        box(ctx, h.ox + 12, y, 54, 28, { fill: C.blue, r: 6 }); text(ctx, k, h.ox + 39, y + 14, { size: 11, color: C.white, align: 'center', weight: 700 });
        box(ctx, h.ox + 112, y, 56, 28, { fill: C.ink, r: 6 }); text(ctx, k, h.ox + 140, y + 14, { size: 11, color: C.white, align: 'center', weight: 700 });
        line(ctx, h.ox + 66, y + 14, h.ox + 112, y + 14, { color: C.grey, lw: 1, dash: [3, 3] });
        for (let w = 0; w < h.per; w++) {
          const ts = h.t0 + (i * h.per + w) * tw, u = clamp((t - ts) / tw), yy = y + 14 + (h.per === 2 ? (w ? 6 : -6) : 0);
          if (u > 0) { arrow(ctx, [[h.ox + 66, yy], [h.ox + 112, yy]], { color: C.orange, lw: 2.2, u }); if (u >= 1) walks++; }
        }
      });
      const total = keys.length * h.per;
      text(ctx, (t >= h.t0 ? walks : 0) + ' Wege', h.ox + 90, 418, { size: 17, weight: 800, align: 'center', color: walks >= total ? h.col : C.ink });
      ctx.restore();
    });
  });

  // ───────────────────────── drawing
  const lampsOn = t => lampWin.some(([a, b]) => between(t, a, b));
  function drawChip(ctx, x, y, w, s, c, alpha = 1, fg = C.white) { box(ctx, x - w / 2, y - 8, w, 16, { fill: c, r: 4, alpha }); text(ctx, s, x, y, { size: 9.5, color: fg, align: 'center', weight: 700, alpha }); }

  function drawLane(ctx, t) {
    const a0 = ramp(t, laneOn, .5); if (a0 <= 0) return;
    ctx.save(); ctx.globalAlpha *= a0;
    // dots
    if (between(t, dotsOn[0], dotsOn[1] + .3)) {
      const k = stepAt(dotTr, t, 0), da = ramp(t, dotsOn[0], .4) * (1 - ramp(t, dotsOn[1], .3));
      for (let i = 0; i < 7; i++) {
        const x = 292 + i * 14, done = i < k, cur = i === k;
        circle(ctx, x, 18, 4.6, { fill: done ? C.green : C.greyL, stroke: cur ? C.blue : done ? C.green : C.grey, lw: cur ? 2 : 1, alpha: da });
      }
    }
    let e = null; for (const x of eps) { if (t < x.t0) break; e = x; }
    if (e) {
      const kd = e.kd, flip = e.mixT == null ? 1e9 : e.mixT + 1.2 * e.mk, nowBits = t < flip ? kd.rb : kd.sb;
      // key card
      const cx = lerp(-60, 8, ramp(t, e.t0, .45)); box(ctx, cx, 6, 54, 24, { fill: C.blue, r: 6 }); text(ctx, kd.key, cx + 27, 18, { size: 12, color: C.white, align: 'center', weight: 800 });
      // hashCode box
      const ha = ramp(t, e.hashT, .3);
      if (ha > 0) {
        arrow(ctx, [[62, 18], [73, 18]], { color: C.blue, lw: 1.5, u: ha, head: 3 });
        box(ctx, 74, 6, 118, 24, { fill: C.white, stroke: C.blue, lw: 1.5, r: 6, alpha: ha });
        text(ctx, 'hashCode', 80, 13, { size: 7, color: C.greyD, alpha: ha }); text(ctx, String(kd.hs), 80, 23.5, { size: 11.5, weight: 800, color: C.blue, alpha: ha, mono: false });
      }
      // 32-cell bit bar
      const bd = e.bitsDur;
      for (let i = 0; i < 32; i++) {
        const a = clamp((t - (e.bitsT + i / 32 * bd)) / .15); if (a <= 0) continue;
        const bit = nowBits[i], changed = i >= 16 && kd.rb[i] !== kd.sb[i], fl = changed && between(t, flip, flip + .6);
        const up = i < 16, fill = fl ? C.orange : up ? (bit ? '#7fb0ff' : C.blueXL) : (bit ? C.blueD : C.blueP);
        box(ctx, 8 + i * 8, 37, 7, 11, { fill, r: 1.5, alpha: a });
      }
      // ghost copy of the upper half sliding under the lower half
      if (e.mixT != null && t >= e.mixT && t < flip + .6) {
        const m = e.mk, a = ramp(t, e.mixT, .5 * m), b = ramp(t, e.mixT + .5 * m, .7 * m), fade = 1 - ramp(t, flip, .5);
        for (let i = 0; i < 16; i++) box(ctx, 8 + i * 8 + 128 * b, lerp(37, 52, a), 7, 11, { fill: kd.rb[i] ? '#7fb0ff' : C.blueXL, stroke: '#7fb0ff', lw: .5, r: 1.5, alpha: fade * (a > .02 ? 1 : 0) });
        text(ctx, '⊕', 124, 58, { size: 12, color: C.orange, align: 'center', weight: 800, alpha: fade * ramp(t, e.mixT + .5 * m, .3) });
      }
      // last four bits, enlarged
      const ea = ramp(t, e.bitsT + e.bitsDur * .8, .3);
      if (ea > 0) {
        line(ctx, 232, 49, 276, 64, { color: C.grey, lw: .7, alpha: ea }); line(ctx, 264, 49, 372, 64, { color: C.grey, lw: .7, alpha: ea });
        for (let k = 0; k < 4; k++) {
          const bit = nowBits[28 + k], ch = kd.rb[28 + k] !== kd.sb[28 + k], fl = ch && between(t, flip, flip + .6);
          box(ctx, 276 + k * 24, 37, 23, 26, { fill: fl ? C.orange : bit ? C.blueD : C.blueP, r: 4, alpha: ea });
          text(ctx, bit, 287.5 + k * 24, 50, { size: 15, weight: 800, color: bit || fl ? C.white : C.blueD, align: 'center', alpha: ea });
        }
      }
      // the "15 = 1111" stencil
      if (between(t, stencil[0], stencil[1] + .3) && e.kd.key === 'Luzern') {
        const u = ramp(t, stencil[0], .7) * (1 - ramp(t, stencil[1], .3));
        ctx.save(); ctx.globalAlpha *= u; ctx.fillStyle = 'rgba(21,32,51,.86)'; rr(ctx, 7, 35, 225 * ramp(t, stencil[0], .7), 15, 3); ctx.fill(); ctx.restore();
        text(ctx, '15 = 1111', 119, 43, { size: 10.5, color: C.white, align: 'center', weight: 800, alpha: u * ramp(t, stencil[0] + .4, .3) });
        box(ctx, 274, 35, 98, 30, { stroke: C.orange, lw: 2, r: 5, alpha: u });
      }
      // index chip
      const chip = [...e.chips].reverse().find(c => t >= c[0]);
      if (chip && chip[1]) { const ca = ramp(t, chip[0], .3); arrow(ctx, [[192, 18], [200, 18]], { color: chip[2], lw: 1.5, head: 3, alpha: ca }); box(ctx, 200, 6, 76, 24, { fill: chip[2], r: 6, alpha: ca }); text(ctx, chip[1], 238, 18, { size: 11.5, color: C.white, align: 'center', weight: 800, alpha: ca }); }
    }
    ctx.restore();
  }

  function drawHeader(ctx, t) {
    const a0 = ramp(t, hdrT, .5); if (a0 <= 0) return;
    ctx.save(); ctx.globalAlpha *= a0;
    box(ctx, 4, 72, 382, 38, { fill: C.white, stroke: C.blue, lw: 1.3, r: 8 });
    text(ctx, 'HashMap', 11, 79, { size: 9, color: C.blue, weight: 800 });
    const size = numAt(sizeTr, t), cap = numAt(capTr, t, .6), thr = numAt(thrTr, t, .8), mod = numAt(modTr, t);
    // fill gauge
    const gx = 66, gw = 312, fill = cap ? size / cap : 0;
    box(ctx, gx, 76, gw, 5, { fill: C.greyL, r: 2.5 }); if (fill > 0) box(ctx, gx, 76, Math.max(5, gw * fill), 5, { fill: C.blue, r: 2.5 });
    if (thr > 0) { const lx = gx + gw * .75, la = ramp(t, S('sixteen', .5), .5); line(ctx, lx, 73, lx, 84, { color: C.red, lw: 1.6, alpha: la }); }
    const tiles = [['table', cap ? '16' : 'null'], ['size', size], ['threshold', thr], ['loadFactor', '0.75'], ['modCount', mod]];
    tiles.forEach(([lb, v], i) => {
      const a = ramp(t, fieldsT[0] + i * (fieldsT[1] - fieldsT[0]) / 5, .35); if (a <= 0) return;
      const x = 8 + i * 75, pulse = lb === 'size' && between(t, S('rep4', 1.2), S('rep4', 2.6)), pc = pulse ? C.green : null;
      box(ctx, x, 85, 71, 22, { fill: pulse ? '#dff3e8' : C.blueXL, stroke: pc, lw: 1.5, r: 5, alpha: a });
      text(ctx, lb, x + 6, 91, { size: 7, color: C.greyD, alpha: a }); text(ctx, v, x + 65, 100, { size: 12.5, weight: 800, align: 'right', color: lb === 'table' && !cap ? C.grey : C.ink, alpha: a });
    });
    ctx.restore();
  }

  const slotCenter = b => SY(b) + 11;
  function drawNode(ctx, t, n, z) {
    if (t < n.t0 || (n.t1 && t > n.t1 + .4)) return;
    const pop = ramp(t, n.t0, .35), fadeOut = n.t1 ? 1 - ramp(t, n.t1, .4) : 1;
    const x = NX(n.p), y = NY(n.b), val = stepAt(n.val, t, 1);
    const kd = n.key === 'null' ? KD.null : KD[n.key];
    let col = C[nodeCol(n.id, t)] || C.ink; if (nodeCol(n.id, t) === 'ink') col = C.ink;
    const nf = nflash.filter(f => f.id === n.id && between(t, f.t0, f.t0 + f.d)).pop(); if (nf) col = nf.c;
    ctx.save(); ctx.globalAlpha *= pop * fadeOut; ctx.translate(x + NW / 2, y + NH / 2); ctx.scale(lerp(.6, 1, pop), lerp(.6, 1, pop)); ctx.translate(-(x + NW / 2), -(y + NH / 2));
    // arrow from the previous node
    if (n.p > 0) arrow(ctx, [[NX(n.p - 1) + NW, y + NH / 2], [x - 1, y + NH / 2]], { color: C.ink, lw: 1.2, head: 3.5, u: ramp(t, n.t0 - .1, .5) });
    // compartments: demo uses its own reveal, others show them when zoomed in
    const zoomK = clamp((z - 2.2) / 1), comps = [['hash', 20], ['key', 16], ['value', 10], ['next', 12]];
    let shown = 0;
    if (n.reveal) shown = Math.min(4, 1 + Math.floor(clamp((t - n.reveal[0]) / Math.max(.1, n.reveal[1] - n.reveal[0])) * 4 - .001)); if (n.reveal && t < n.reveal[0]) shown = 0;
    else if (!n.reveal && zoomK > .3) shown = 4;
    box(ctx, x, y, NW, NH, { fill: col, r: 3, stroke: n.demo ? C.blue : null, lw: .6 });
    if (shown === 0) text(ctx, n.key, x + NW / 2, y + NH / 2 + .3, { size: 9.5, color: C.white, align: 'center', weight: 800 });
    else {
      let cx = x;
      comps.forEach(([nm, w], i) => {
        const on = i < shown; if (i > 0) line(ctx, cx, y + 1, cx, y + NH - 1, { color: 'rgba(255,255,255,.45)', lw: .25 });
        if (on) {
          const mid = cx + w / 2, vv = i === 0 ? String(kd.sp | 0 === 0 ? 0 : (kd.sp | 0)) : i === 1 ? n.key : i === 2 ? String(val) : '';
          if (nm === 'hash') text(ctx, n.key === 'Luzern' ? '−2007…' : String(kd.sp | 0), mid, y + NH / 2 + .2, { size: 4.2, color: C.white, align: 'center', weight: 700 });
          else if (nm === 'next') { const hasNext = ND && nodes.some(o => o.b === n.b && o.p === n.p + 1 && t >= o.t0 && !o.demo) || (n.demo && t >= n.ghostNext); if (hasNext) circle(ctx, mid, y + NH / 2, 1.3, { fill: C.orange }); else text(ctx, 'null', mid, y + NH / 2 + .2, { size: 4, color: 'rgba(255,255,255,.65)', align: 'center', weight: 700 }); }
          else text(ctx, vv, mid, y + NH / 2 + .2, { size: nm === 'key' ? 4.6 : 5, color: C.white, align: 'center', weight: 800 });
          text(ctx, nm, mid, y - 2.6, { size: 3.4, color: C.greyD, align: 'center', weight: 700, alpha: clamp(z / 3) });
        }
        cx += w;
      });
    }
    // a changed value is shown with a green flash on its compartment
    if (shown === 4 && nf && n.id === 'Aa') box(ctx, x + 36, y, 10, NH, { stroke: C.green, lw: .8, r: 1 });
    if (n.demo && n.ghostNext && t >= n.ghostNext) {
      const g = ramp(t, n.ghostNext, .5); arrow(ctx, [[x + 52, y + NH / 2], [NX(1) - 1, y + NH / 2]], { color: C.orange, lw: .9, head: 2.5, u: g });
      box(ctx, NX(1), y, NW, NH, { stroke: C.grey, lw: .6, dash: [2, 1.6], r: 3, alpha: g }); text(ctx, '?', NX(1) + NW / 2, y + NH / 2, { size: 9, color: C.grey, align: 'center', weight: 700, alpha: g });
    }
    ctx.restore();
  }

  function drawArray(ctx, t) {
    const [fx, fy, z] = camAt(cam, t);
    ctx.save(); ctx.beginPath(); ctx.rect(0, LANE_Y, W, STRIP_Y - LANE_Y); ctx.clip();
    ctx.translate(195 - fx * z, 290 - fy * z); ctx.scale(z, z);
    const ghostA = ramp(t, SLOT_ON, .6) * (1 - ramp(t, SOLID, .2));
    for (let i = 0; i < 16; i++) {
      const solid = ramp(t, SOLID + i * .035, .3);
      if (ghostA > 0) box(ctx, 28, SY(i) + 1, 36, 20, { stroke: C.grey, lw: .9, dash: [3, 2.5], r: 3, alpha: ghostA });
      if (solid > 0) {
        let fill = C.greyL; const tn = tints.filter(x => x.b === i && between(t, x.t0, x.t1)).pop();
        box(ctx, 28, SY(i) + 1, 36, 20, { fill, r: 3, alpha: solid });
        if (tn) box(ctx, 28, SY(i) + 1, 36, 20, { fill: tn.c, r: 3, alpha: .28 * Math.min(1, ramp(t, tn.t0, .25)) * (1 - ramp(t, tn.t1 - .3, .3)) });
        text(ctx, i, 22, SY(i) + 11.5, { size: 9, color: tn ? tn.c : C.greyD, align: 'right', weight: tn ? 800 : 600, alpha: solid });
      }
    }
    // dashed arrow from the table tile (ghost) / solid after the first put
    if (t >= SLOT_ON) arrow(ctx, [[43, 107], [43, 114]], { color: C.blue, lw: 1.3, head: 3, alpha: ghostA ? .6 : 1, dash: ghostA > .1 ? [2, 2] : null });
    nodes.forEach(n => drawNode(ctx, t, n, z));
    // bursts
    bursts.forEach(b => { const u = (t - b.t0) / .8; if (u > 0 && u < 1) circle(ctx, b.x, b.y, 8 + 26 * u, { stroke: b.c, lw: 2.5 * (1 - u), alpha: 1 - u }); });
    // pointers (ghost index arrows)
    pointers.forEach(p => {
      if (!between(t, p.t0, p.t1 + .3)) return; const a = ramp(t, p.t0, .4) * (1 - ramp(t, p.t1, .3)), y = p.y(t), c = p.col(t), sb = p.slot(t);
      arrow(ctx, [[p.x - p.w / 2, y], [70, slotCenter(sb)]], { color: c, lw: 1.6, head: 4, alpha: a });
      drawChip(ctx, p.x, y, p.w, p.label, c, a);
    });
    // labels in the array
    labels.forEach(l => { if (!l.s || !between(t, l.t0, l.t1)) return; const a = ramp(t, l.t0, .3) * (1 - ramp(t, l.t1 - .3, .3)); text(ctx, l.s, l.x, l.y, { size: l.size, color: l.c, weight: 800, align: 'center', alpha: a }); });
    // compare bubbles
    bubbles.forEach(b => { if (!between(t, b.t0, b.t1)) return; const a = ramp(t, b.t0, .25) * (1 - ramp(t, b.t1 - .25, .25)); box(ctx, b.x, b.y, 98, 16, { fill: C.white, stroke: b.c, lw: 1.3, r: 8, alpha: a }); text(ctx, b.s, b.x + 49, b.y + 8.3, { size: 9.5, color: b.c, align: 'center', weight: 800, alpha: a }); });
    // results (get)
    results.forEach(r => { if (!between(t, r.t0, r.t1)) return; const a = ramp(t, r.t0, .3) * (1 - ramp(t, r.t1 - .3, .3)); box(ctx, r.x, r.y, r.w, 18, { fill: r.grey ? C.white : '#dff3e8', stroke: r.grey ? C.grey : r.c, lw: 1.3, r: 6, dash: r.grey ? [3, 2] : null, alpha: a }); text(ctx, r.s, r.x + r.w / 2, r.y + 9.5, { size: 11, color: r.c, align: 'center', weight: 800, alpha: a }); });
    // lamps: hash and equals
    if (lampsOn(t)) {
      const la = Math.min(ramp(t, lampWin.find(([a, b]) => between(t, a, b))[0], .4), 1), hd = between(t, hashLampDim[0], hashLampDim[1]), eq = stepAt(eqTr, t, 'q');
      const pulse = between(t, S('bb4', .8), S('bb4', 3.4)) ? 1 + .12 * Math.sin((t - S('bb4', .8)) * 6) : 1;
      circle(ctx, 306, 168, 9, { fill: C.green, alpha: la * (hd ? .35 : 1) }); text(ctx, '✓', 306, 168.5, { size: 11, color: C.white, align: 'center', weight: 800, alpha: la * (hd ? .35 : 1) }); text(ctx, 'hash', 306, 187, { size: 9, weight: 700, color: C.greyD, align: 'center', alpha: la });
      const ec = eq === 't' ? C.green : eq === 'f' ? C.red : C.orange;
      circle(ctx, 350, 168, 9 * (eq === 'f' ? pulse : 1), { fill: ec, alpha: la }); text(ctx, eq === 't' ? '✓' : eq === 'f' ? '✗' : '?', 350, 168.5, { size: 11, color: C.white, align: 'center', weight: 800, alpha: la }); text(ctx, 'equals', 350, 187, { size: 9, weight: 700, color: C.greyD, align: 'center', alpha: la });
      if (eq !== 'q') text(ctx, eq === 't' ? 'true' : 'false', 350, 203, { size: 10, weight: 800, color: ec, align: 'center', alpha: la });
    }
    // gates
    if (t >= gatesOn) gates.forEach(g => { const a = ramp(t, gatesOn, .4) * (1 - .65 * ramp(t, S('g1'), .6)), ok = t >= g.t; diamond(ctx, g.x, g.y, 48, 38, { fill: ok ? '#dff3e8' : C.white, stroke: ok ? C.green : C.grey, lw: 1.6, alpha: a }); text(ctx, g.s, g.x, g.y, { size: 9, weight: 800, color: ok ? C.green : C.greyD, align: 'center', alpha: a }); });
    // rings (final picture)
    rings.forEach(r => { if (t < r.t0) return; const a = ramp(t, r.t0, .5); box(ctx, NX(0) - 5, NY(r.b) - 4, r.w + 10, NH + 8, { stroke: r.c, lw: 1.6, r: 6, alpha: a * (.55 + .45 * Math.sin(t * 3) ** 2) }); });
    ctx.restore();
  }

  function drawTokens(ctx, t) {
    tokens.forEach(k => {
      if (t < k.t0 || t > k.hold + .2) return;
      const u = ease((t - k.t0) / (k.t1 - k.t0)), p = pathAt(k.pts, u), fade = 1 - ramp(t, k.hold, .2);
      const lift = Math.sin(Math.PI * clamp((t - k.t0) / (k.t1 - k.t0))) * 2;
      ctx.save(); ctx.shadowColor = 'rgba(21,32,51,.25)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1.5;
      box(ctx, p[0] - k.w / 2, p[1] - 8 - lift, k.w, 16, { fill: k.c, r: 5, alpha: fade }); ctx.restore();
      text(ctx, k.label, p[0], p[1] - lift, { size: 9.5, color: C.white, align: 'center', weight: 800, alpha: fade });
    });
  }

  function drawPanels(ctx, t) {
    panels.forEach(p => {
      if (t < p.t0 || t > p.t1 + .5) return; const a = ramp(t, p.t0, .45) * (1 - ramp(t, p.t1, .45)); if (a <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(0, p.y0, W, STRIP_Y - p.y0); ctx.clip(); ctx.globalAlpha *= a; p.draw(ctx, t); ctx.restore();
    });
  }

  function drawCode(ctx, t) {
    const a = ramp(t, codeFrom - .3, .6); if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = C.code; ctx.fillRect(0, STRIP_Y, W, H - STRIP_Y);
    const cur = stepAt(code, t, null); if (cur) {
      const mono = { mono: true, size: 10.5, weight: 600 }, rows = [[cur.l1, 1], [cur.l2, 2]];
      const t0 = code.find(c => c[1] === cur)[0], fade = ramp(t, t0, .35);
      rows.forEach(([s, n], i) => {
        const y = STRIP_Y + 18 + i * 17, on = cur.hl === n;
        if (on) { box(ctx, 5, y - 8, W - 10, 16, { fill: '#26324f', r: 4, alpha: fade }); box(ctx, 5, y - 8, 3, 16, { fill: '#f5d90a', r: 1.5, alpha: fade }); }
        text(ctx, s || '', 14, y, { ...mono, color: on ? '#ffffff' : '#9aa7c2', alpha: fade });
      });
      (cur.out || []).forEach(([s, ot], i) => {
        const oa = ramp(t, ot, .25); if (oa <= 0) return; const y = STRIP_Y + (cur.l2 ? 54 : 40) + i * (cur.l2 ? 14.5 : 14), hl = outHl.some(([li, a0, a1]) => li === i && between(t, a0, a1)) && cur.proof;
        if (hl) box(ctx, 5, y - 7, W - 10, 14, { fill: '#2b4a2f', r: 3 });
        text(ctx, s, 14, y, { mono: true, size: 9.5, weight: 600, color: /null/.test(s) ? '#ff9b93' : '#7ee787', alpha: oa });
      });
      if (cur.badge && t >= cur.badge) { const ba = ramp(t, cur.badge, .3); box(ctx, W - 66, STRIP_Y + 42, 58, 15, { fill: '#1f9d57', r: 7.5, alpha: ba }); text(ctx, 'Beweis', W - 37, STRIP_Y + 49.8, { size: 9.5, color: C.white, align: 'center', weight: 800, alpha: ba }); }
    }
    ctx.restore();
  }

  function render(ctx, t) {
    t = clamp(t, 0, END + 1);
    ctx.save(); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    drawLane(ctx, t); drawHeader(ctx, t); drawArray(ctx, t); drawPanels(ctx, t); drawTokens(ctx, t); drawCode(ctx, t);
    ctx.restore();
  }
  return { render };
}
