// Our own SVG drawings: activity diagram, silica solubility, Goldich series,
// grain lifetimes. Text goes through textContent only.

import { fields, stableAt, silicaLines, SYSTEMS, STAGE } from './diagram.js';
import { displayParts } from './formula.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

export function svgEl(W, H, label) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', label);
  const t = document.createElementNS(NS, 'title');
  t.textContent = label;
  s.appendChild(t);
  const el = (n, a = {}, txt, parent = s) => {
    const x = document.createElementNS(NS, n);
    for (const [k, v] of Object.entries(a)) if (v !== undefined && v !== null) x.setAttribute(k, v);
    if (txt !== undefined) x.textContent = txt;
    parent.appendChild(x);
    return x;
  };
  return { s, el };
}

/** Append a formula-like label with sub/superscripts to an SVG <text>. parts: [{t, sub, sup}] */
function richText(textEl, parts) {
  for (const p of parts) {
    const ts = document.createElementNS(NS, 'tspan');
    if (p.sub) { ts.setAttribute('baseline-shift', 'sub'); ts.setAttribute('font-size', '75%'); }
    if (p.sup) { ts.setAttribute('baseline-shift', 'super'); ts.setAttribute('font-size', '75%'); }
    ts.textContent = p.t;
    textEl.appendChild(ts);
  }
}

const fparts = (f) => displayParts(f);

// y-axis titles per system, as rich text parts
export function axisTitle(sysKey) {
  const sys = SYSTEMS[sysKey];
  const ion = fparts(sys.cation);
  const h = [{ t: 'H' }, { t: '+', sup: true }];
  const pow = sys.z === 2 ? [{ t: '2', sup: true }] : [];
  return [{ t: 'log(a ' }, ...ion, { t: ' / a ' }, ...h, ...pow, { t: ')' }];
}
const xTitle = [{ t: 'log a H' }, { t: '4', sub: true }, { t: 'SiO' }, { t: '4', sub: true }];

const area = (poly) => { let a = 0; for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; a += x1 * y2 - x2 * y1; } return a / 2; };
function centroid(poly) {
  let cx = 0, cy = 0; const A = area(poly);
  if (Math.abs(A) < 1e-12) return poly[0];
  for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; const f = x1 * y2 - x2 * y1; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
  return [cx / (6 * A), cy / (6 * A)];
}

/** Inner edges of a set of polygons (not on the frame), deduplicated. */
function innerEdges(polys, sys) {
  const onFrame = (a, b) => (Math.abs(a[0] - b[0]) < 1e-9 && (Math.abs(a[0] - sys.x[0]) < 1e-9 || Math.abs(a[0] - sys.x[1]) < 1e-9))
    || (Math.abs(a[1] - b[1]) < 1e-9 && (Math.abs(a[1] - sys.y[0]) < 1e-9 || Math.abs(a[1] - sys.y[1]) < 1e-9));
  const seen = new Set(); const out = [];
  for (const poly of polys) for (let i = 0; i < poly.length; i++) {
    let a = poly[i], b = poly[(i + 1) % poly.length];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9 || onFrame(a, b)) continue;
    if (a[0] > b[0] || (a[0] === b[0] && a[1] > b[1])) [a, b] = [b, a];
    const key = [a, b].map((p) => p.map((v) => v.toFixed(4)).join(',')).join(';');
    if (seen.has(key)) continue;
    seen.add(key); out.push([a, b]);
  }
  return out;
}

/**
 * Activity diagram.
 * o: { sysKey, tC, cmp ('rh'|'pq'|null), point {x,y}|null, path [{x,y}], name(id) -> label, T(en, fr), fmt(v,d) }
 * Returns a <div class="adiag"> with the svg and a hover read-out.
 */
export function activityDiagram(o) {
  const sys = SYSTEMS[o.sysKey];
  const W = 380, H = 320, m = { l: 50, r: 12, t: 22, b: 40 };
  const X = (x) => m.l + ((x - sys.x[0]) / (sys.x[1] - sys.x[0])) * (W - m.l - m.r);
  const Y = (y) => m.t + (1 - (y - sys.y[0]) / (sys.y[1] - sys.y[0])) * (H - m.t - m.b);
  const iX = (px) => sys.x[0] + ((px - m.l) / (W - m.l - m.r)) * (sys.x[1] - sys.x[0]);
  const iY = (py) => sys.y[0] + (1 - (py - m.t) / (H - m.t - m.b)) * (sys.y[1] - sys.y[0]);
  const label = o.T(`Stability diagram, ${o.sysKey} system, at ${o.fmt(o.tC, 0)} °C`, `Diagramme de stabilité, système ${o.sysKey}, à ${o.fmt(o.tC, 0)} °C`);
  const { s, el } = svgEl(W, H, label);
  s.classList.add('adiag-svg');
  const id = `hatch${++uid}`;
  const defs = el('defs');
  const pat = el('pattern', { id, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, undefined, defs);
  el('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'ad-hatch' }, undefined, pat);
  const clipId = `clip${uid}`;
  const cp = el('clipPath', { id: clipId }, undefined, defs);
  el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, undefined, cp);

  const F = fields(o.sysKey, o.tC, 'llnl');
  const g = el('g', { 'clip-path': `url(#${clipId})` });
  for (const f of F) {
    const pts = f.poly.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
    const cls = f.id === 'solution' ? 'ad-sol' : sys.kind === 'mg' ? 'ad-mg' : `ad-st${STAGE[f.id] ?? 2}`;
    el('polygon', { points: pts, class: `ad-field ${cls}` }, undefined, g);
  }
  // amorphous silica limit: beyond it the water cannot go (opal precipitates)
  const sl = silicaLines(o.tC);
  if (sl.amorphous < sys.x[1]) el('rect', { x: X(sl.amorphous), y: m.t, width: X(sys.x[1]) - X(sl.amorphous), height: H - m.t - m.b, fill: `url(#${id})`, class: 'ad-beyond' }, undefined, g);
  for (const [a, b] of innerEdges(F.map((f) => f.poly), sys)) el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: sys.kind === 'mg' ? 'ad-edge mg' : 'ad-edge' }, undefined, g);
  if (o.cmp) {
    const F2 = fields(o.sysKey, o.tC, o.cmp);
    for (const [a, b] of innerEdges(F2.map((f) => f.poly), sys)) el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: 'ad-cmp' }, undefined, g);
  }
  for (const [k, x, txt] of [['quartz', sl.quartz, o.T('quartz', 'quartz')], ['amorphous', sl.amorphous, o.T('opal', 'opale')]]) {
    if (x <= sys.x[0] || x >= sys.x[1]) continue;
    el('line', { x1: X(x), x2: X(x), y1: m.t, y2: H - m.b, class: `ad-si ad-si-${k}` });
    el('text', { x: X(x), y: m.t - 6, 'text-anchor': 'middle', class: 'ad-si-lbl' }, txt);
  }
  // axes
  el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: 'ad-frame' });
  for (let x = Math.ceil(sys.x[0]); x <= sys.x[1]; x++) {
    el('line', { x1: X(x), x2: X(x), y1: H - m.b, y2: H - m.b + 4, class: 'ad-tick' });
    el('text', { x: X(x), y: H - m.b + 15, 'text-anchor': 'middle', class: 'ad-num' }, o.fmt(x, 0).replace('-', '−'));
  }
  const ystep = (sys.y[1] - sys.y[0]) > 12 ? 2 : 1;
  for (let y = Math.ceil(sys.y[0] / ystep) * ystep; y <= sys.y[1]; y += ystep) {
    el('line', { x1: m.l - 4, x2: m.l, y1: Y(y), y2: Y(y), class: 'ad-tick' });
    el('text', { x: m.l - 7, y: Y(y) + 3.5, 'text-anchor': 'end', class: 'ad-num' }, o.fmt(y, 0).replace('-', '−'));
  }
  richText(el('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', class: 'ad-axis' }), xTitle);
  richText(el('text', { x: 13, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle', transform: `rotate(-90 13 ${(m.t + H - m.b) / 2})`, class: 'ad-axis' }), axisTitle(o.sysKey));
  // field labels
  for (const f of F) {
    const pxArea = Math.abs(area(f.poly.map(([x, y]) => [X(x), Y(y)])));
    if (pxArea < 1400) continue;
    const [cx, cy] = centroid(f.poly);
    let ly = Y(cy) + 4;
    // keep the field name clear of the water point and its label
    if (o.point && Number.isFinite(o.point.x) && Number.isFinite(o.point.y) && Math.hypot(X(o.point.x) - X(cx), Y(o.point.y) - Y(cy)) < 34) ly += Y(o.point.y) > Y(cy) ? -24 : 24;
    const cls = f.id === 'solution' ? 'ad-lbl-sol' : sys.kind === 'mg' ? 'ad-lbl-mg' : `ad-lbl-st${STAGE[f.id] ?? 2}`;
    el('text', { x: Math.min(Math.max(X(cx), m.l + 38), W - m.r - 42), y: ly, 'text-anchor': 'middle', class: `ad-lbl ${cls}` }, f.id === 'solution' ? o.T('dissolves', 'se dissout') : o.name(f.id));
  }
  // path and point
  const inside = (p) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const pts = (o.path ?? []).filter(inside);
  if (pts.length > 1) {
    el('polyline', { points: pts.map((p) => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join(' '), class: 'ad-path', 'clip-path': `url(#${clipId})` });
    const last = pts[pts.length - 1];
    if (o.pathEnd) el('circle', { cx: X(last.x), cy: Y(last.y), r: 3, class: 'ad-path-end', 'clip-path': `url(#${clipId})` });
  }
  let pointInBox = false;
  if (o.point && inside(o.point)) {
    const px = Math.min(Math.max(o.point.x, sys.x[0]), sys.x[1]);
    const py = Math.min(Math.max(o.point.y, sys.y[0]), sys.y[1]);
    pointInBox = px === o.point.x && py === o.point.y;
    el('circle', { cx: X(px), cy: Y(py), r: 6, class: pointInBox ? 'ad-mark' : 'ad-mark off' });
    const right = X(px) < W - 90;
    el('text', { x: X(px) + (right ? 10 : -10), y: Y(py) - 8, 'text-anchor': right ? 'start' : 'end', class: 'ad-mark-lbl' }, o.T('your water', 'votre eau'));
  }
  // hover read-out
  const wrap = document.createElement('div');
  wrap.className = 'adiag';
  const tip = document.createElement('div');
  tip.className = 'ad-tip';
  tip.hidden = true;
  const cross = el('g', { class: 'ad-cross', visibility: 'hidden' });
  const cx1 = el('line', { y1: m.t, y2: H - m.b }, undefined, cross);
  const cy1 = el('line', { x1: m.l, x2: W - m.r }, undefined, cross);
  const move = (ev) => {
    const r = s.getBoundingClientRect();
    const px = ((ev.clientX - r.left) / r.width) * W, py = ((ev.clientY - r.top) / r.height) * H;
    if (px < m.l || px > W - m.r || py < m.t || py > H - m.b) { tip.hidden = true; cross.setAttribute('visibility', 'hidden'); return; }
    const x = iX(px), y = iY(py);
    const st = stableAt(o.sysKey, x, y, o.tC);
    cx1.setAttribute('x1', px); cx1.setAttribute('x2', px); cy1.setAttribute('y1', py); cy1.setAttribute('y2', py);
    cross.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.replaceChildren();
    const b = document.createElement('strong');
    b.textContent = st === 'solution' ? o.T('the minerals dissolve', 'les minéraux se dissolvent') : o.name(st);
    const small = document.createElement('span');
    small.textContent = `x ${o.fmt(x, 2)} · y ${o.fmt(y, 2)}${x > sl.amorphous ? ` · ${o.T('beyond opal saturation', 'au-delà de la saturation de l’opale')}` : ''}`;
    tip.append(b, small);
    const left = (px / W) * 100;
    tip.style.left = `${Math.min(left, 62)}%`;
    tip.style.top = `${(py / H) * 100}%`;
  };
  s.addEventListener('pointermove', move);
  s.addEventListener('pointerdown', move);
  // On touch screens the read-out stays after the finger lifts.
  s.addEventListener('pointerleave', (ev) => { if (ev.pointerType !== 'mouse') return; tip.hidden = true; cross.setAttribute('visibility', 'hidden'); });
  wrap.append(s, tip);
  wrap.dataset.pointInBox = String(pointInBox);
  return wrap;
}

/**
 * Silica solubility against pH at tC: quartz and amorphous silica (mg/L SiO2), log scale.
 * o: { tC, pH, total(kind, pH) -> mg/L, T, fmt }
 */
export function silicaChart(o) {
  const W = 360, H = 240, m = { l: 48, r: 14, t: 14, b: 38 };
  const x0 = 2, x1 = 12, y0 = 0, y1 = 4; // log10 mg/L
  const X = (x) => m.l + ((x - x0) / (x1 - x0)) * (W - m.l - m.r);
  const Y = (ly) => m.t + (1 - (ly - y0) / (y1 - y0)) * (H - m.t - m.b);
  const { s, el } = svgEl(W, H, o.T(`Solubility of quartz and amorphous silica against pH at ${o.fmt(o.tC, 0)} °C`, `Solubilité du quartz et de la silice amorphe selon le pH à ${o.fmt(o.tC, 0)} °C`));
  for (let ly = y0; ly <= y1; ly++) {
    el('line', { x1: m.l, x2: W - m.r, y1: Y(ly), y2: Y(ly), class: 'ch-grid' });
    el('text', { x: m.l - 6, y: Y(ly) + 3.5, 'text-anchor': 'end', class: 'ch-num' }, o.fmt(10 ** ly, 0));
  }
  for (let x = x0; x <= x1; x += 2) el('text', { x: X(x), y: H - m.b + 15, 'text-anchor': 'middle', class: 'ch-num' }, String(x));
  el('text', { x: (m.l + W - m.r) / 2, y: H - 6, 'text-anchor': 'middle', class: 'ch-axis' }, 'pH');
  el('text', { x: 12, y: (m.t + H - m.b) / 2, 'text-anchor': 'middle', transform: `rotate(-90 12 ${(m.t + H - m.b) / 2})`, class: 'ch-axis' }, o.T('dissolved silica, mg/L SiO₂', 'silice dissoute, mg/L SiO₂'));
  const clip = `cl${++uid}`;
  el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: 'ch-frame' });
  const cp = el('clipPath', { id: clip });
  el('rect', { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b }, undefined, cp);
  for (const [kind, cls, name] of [['amorphous', 'ch-s2', o.T('amorphous silica (opal)', 'silice amorphe (opale)')], ['quartz', 'ch-s1', o.T('quartz', 'quartz')]]) {
    const pts = [];
    for (let x = x0; x <= x1 + 1e-9; x += 0.05) pts.push(`${X(x).toFixed(1)},${Y(Math.log10(o.total(kind, x))).toFixed(1)}`);
    el('polyline', { points: pts.join(' '), class: `ch-line ${cls}`, 'clip-path': `url(#${clip})` });
    const yl = Math.log10(o.total(kind, 4));
    el('text', { x: X(2.3), y: Y(yl) - 7, class: 'ch-lbl' }, name);
  }
  if (Number.isFinite(o.pH) && o.pH >= x0 && o.pH <= x1) {
    const v = o.total('quartz', o.pH);
    el('line', { x1: X(o.pH), x2: X(o.pH), y1: m.t, y2: H - m.b, class: 'ch-now' });
    el('circle', { cx: X(o.pH), cy: Y(Math.log10(v)), r: 5, class: 'ad-mark' });
  }
  return s;
}

// Goldich (1938) series, our own layout.
export const GOLDICH = {
  left: [['olivine', ['forsterite', 'fayalite']], ['pyroxene', ['enstatite', 'diopside']], ['amphibole', ['tremolite']], ['biotite', ['phlogopite', 'annite']]],
  right: [['Ca-plagioclase', ['anorthite']], ['Ca-Na plagioclase', []], ['Na-Ca plagioclase', []], ['Na-plagioclase', ['albite']]],
  tail: [['K-feldspar', ['K-feldspar']], ['muscovite', ['muscovite']], ['quartz', ['quartz']]],
};

/** o: { current, names: {key: label}, T } */
export function goldichChart(o) {
  const W = 340, H = 300;
  const { s, el } = svgEl(W, H, o.T('Goldich stability series: the higher, the faster a mineral weathers', 'Série de stabilité de Goldich : plus haut, plus vite le minéral s’altère'));
  const defs = el('defs');
  const mk = el('marker', { id: `ar${++uid}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, undefined, defs);
  el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'gd-arrowhead' }, undefined, mk);
  const arrow = `url(#ar${uid})`;
  const node = (x, y, key, members) => {
    const cur = members.includes(o.current);
    el('rect', { x: x - 66, y: y - 12, width: 132, height: 24, rx: 12, class: cur ? 'gd-node is-current' : 'gd-node' });
    el('text', { x, y: y + 4, 'text-anchor': 'middle', class: cur ? 'gd-txt is-current' : 'gd-txt' }, o.names[key]);
  };
  const L = 112, Rx = 262, ys = [24, 64, 104, 144];
  GOLDICH.left.forEach(([k, mem], i) => { node(L, ys[i], k, mem); if (i) el('line', { x1: L, x2: L, y1: ys[i - 1] + 12, y2: ys[i] - 13, class: 'gd-link', 'marker-end': arrow }); });
  GOLDICH.right.forEach(([k, mem], i) => { node(Rx, ys[i], k, mem); if (i) el('line', { x1: Rx, x2: Rx, y1: ys[i - 1] + 12, y2: ys[i] - 13, class: 'gd-link', 'marker-end': arrow }); });
  const ty = [194, 234, 274], tx = (L + Rx) / 2;
  el('line', { x1: L, y1: ys[3] + 12, x2: tx - 20, y2: ty[0] - 13, class: 'gd-link', 'marker-end': arrow });
  el('line', { x1: Rx, y1: ys[3] + 12, x2: tx + 20, y2: ty[0] - 13, class: 'gd-link', 'marker-end': arrow });
  GOLDICH.tail.forEach(([k, mem], i) => { node(tx, ty[i], k, mem); if (i) el('line', { x1: tx, x2: tx, y1: ty[i - 1] + 12, y2: ty[i] - 13, class: 'gd-link', 'marker-end': arrow }); });
  el('line', { x1: 18, x2: 18, y1: 20, y2: 280, class: 'gd-axis', 'marker-end': arrow });
  el('text', { x: 26, y: 34, class: 'gd-side' }, o.T('weathers first', 's’altère d’abord'));
  el('text', { x: 26, y: 278, class: 'gd-side' }, o.T('most', 'le plus'));
  el('text', { x: 26, y: 290, class: 'gd-side' }, o.T('stable', 'stable'));
  return s;
}

/**
 * Dot plot of grain lifetimes (years, log scale).
 * rows: [{key, label, years, current}]
 */
export function lifetimeChart(rows, o) {
  const W = 360, rowH = 22, m = { l: 118, r: 16, t: 8, b: 34 };
  const H = m.t + m.b + rows.length * rowH;
  const lo = 0, hi = 9;
  const X = (ly) => m.l + ((ly - lo) / (hi - lo)) * (W - m.l - m.r);
  const { s, el } = svgEl(W, H, o.T('Laboratory lifetime of a grain, years, logarithmic scale', 'Durée de vie d’un grain au laboratoire, en années, échelle logarithmique'));
  for (let ly = lo; ly <= hi; ly += 3) {
    el('line', { x1: X(ly), x2: X(ly), y1: m.t, y2: H - m.b, class: 'ch-grid' });
    el('text', { x: X(ly), y: H - m.b + 14, 'text-anchor': 'middle', class: 'ch-num' }, ly === 0 ? '1' : `10${'⁰¹²³⁴⁵⁶⁷⁸⁹'[ly]}`);
  }
  el('text', { x: (m.l + W - m.r) / 2, y: H - 5, 'text-anchor': 'middle', class: 'ch-axis' }, o.T('years (1 mm grain, laboratory rate)', 'années (grain de 1 mm, vitesse de laboratoire)'));
  rows.forEach((r, i) => {
    const y = m.t + i * rowH + rowH / 2;
    el('text', { x: m.l - 8, y: y + 4, 'text-anchor': 'end', class: r.current ? 'lt-lbl is-current' : 'lt-lbl' }, r.label);
    el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'lt-row' });
    const ly = Math.log10(r.years);
    if (!Number.isFinite(ly)) return;
    const c = el('circle', { cx: X(Math.min(hi, Math.max(lo, ly))), cy: y, r: r.current ? 6 : 4.5, class: r.current ? 'lt-dot is-current' : 'lt-dot' });
    const t = document.createElementNS(NS, 'title');
    t.textContent = `${r.label}: ${o.fmtYears(r.years)}`;
    c.appendChild(t);
  });
  return s;
}
