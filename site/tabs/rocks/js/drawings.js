// Our own schematic SVG drawings for the rock key: textures, foliation and
// bedding, grain size, hardness, colour index, grain shape... Schematic, not
// to scale unless said so. Colours come from CSS classes (rocks.css), so both
// themes work. Text goes through textContent only. A seeded random generator
// keeps every drawing the same from one visit to the next.

const NS = 'http://www.w3.org/2000/svg';

function svg(W, H, label) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('viewBox', `0 0 ${W} ${H}`);
  s.setAttribute('role', 'img');
  s.setAttribute('aria-label', label);
  s.classList.add('rk-svg');
  s.style.maxWidth = `${W}px`;
  const t = document.createElementNS(NS, 'title');
  t.textContent = label;
  s.append(t);
  const el = (n, a = {}, txt, parent = s) => {
    const x = document.createElementNS(NS, n);
    for (const [k, v] of Object.entries(a)) if (v !== undefined && v !== null) x.setAttribute(k, typeof v === 'number' ? +v.toFixed(2) : v);
    if (txt !== undefined) x.textContent = txt;
    parent.append(x);
    return x;
  };
  return { s, el };
}

/** Small seeded generator (mulberry32), so drawings do not change between visits. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let clipN = 0;
/** A rounded "specimen" frame with a clip path; returns the group to draw in. */
function frame(el, x, y, w, h, cls = 'rk-bg') {
  const id = `rkc${++clipN}`;
  const defs = el('defs');
  const cp = el('clipPath', { id }, undefined, defs);
  el('rect', { x, y, width: w, height: h, rx: 10 }, undefined, cp);
  el('rect', { x, y, width: w, height: h, rx: 10, class: cls });
  const g = el('g', { 'clip-path': `url(#${id})` });
  return { g, done: () => el('rect', { x, y, width: w, height: h, rx: 10, class: 'rk-frame' }) };
}

// ---------------------------------------------------------------- texture pictograms (120 × 80)
const PW = 120, PH = 80;

function mosaic(el, g, x0, y0, w, h, n, darkShare, seed) {
  // A jittered grid: neighbouring cells share their corners, so the
  // "crystals" fit together with no gaps, as in an igneous rock.
  const r = rng(seed);
  const cols = n, rows = Math.max(2, Math.round(n * h / w));
  const dx = w / cols, dy = h / rows;
  const P = [];
  for (let j = 0; j <= rows; j++) {
    P.push([]);
    for (let i = 0; i <= cols; i++) {
      const edge = i === 0 || j === 0 || i === cols || j === rows;
      P[j].push([x0 + i * dx + (edge ? 0 : (r() - 0.5) * dx * 0.7), y0 + j * dy + (edge ? 0 : (r() - 0.5) * dy * 0.7)]);
    }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const v = r();
    const cls = v < darkShare ? 'rk-dark' : v < darkShare + (1 - darkShare) * 0.45 ? 'rk-grey' : 'rk-light';
    const p = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]];
    el('path', { d: `M${p.map((q) => q.map((c) => c.toFixed(1)).join(',')).join('L')}Z`, class: `${cls} rk-cell` }, undefined, g);
  }
}

function grains(el, g, x0, y0, w, h, { n = 22, rmin = 4, rmax = 9, round = true, seed = 3 } = {}) {
  const r = rng(seed);
  const placed = [];
  for (let k = 0; k < n * 40 && placed.length < n; k++) {
    const rad = rmin + r() * (rmax - rmin);
    const cx = x0 + r() * w, cy = y0 + r() * h;
    if (placed.some((p) => Math.hypot(p[0] - cx, p[1] - cy) < p[2] + rad + 1.5)) continue;
    placed.push([cx, cy, rad]);
    const cls = r() < 0.25 ? 'rk-grey' : 'rk-light';
    if (round) {
      el('ellipse', { cx, cy, rx: rad, ry: rad * (0.75 + r() * 0.25), transform: `rotate(${(r() * 180).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})`, class: `${cls} rk-grain` }, undefined, g);
    } else {
      const m = 4 + Math.floor(r() * 3), pts = [];
      for (let i = 0; i < m; i++) {
        const a = (i / m) * Math.PI * 2 + r() * 0.6;
        const rr = rad * (0.6 + r() * 0.5);
        pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
      }
      el('polygon', { points: pts.join(' '), class: `${cls} rk-grain` }, undefined, g);
    }
  }
}

function stipple(el, g, x0, y0, w, h, n, seed, cls = 'rk-dot') {
  const r = rng(seed);
  for (let i = 0; i < n; i++) el('circle', { cx: x0 + r() * w, cy: y0 + r() * h, r: 0.6 + r() * 0.5, class: cls }, undefined, g);
}

const PICTOS = {
  crystals(el, g) { mosaic(el, g, 0, 0, PW, PH, 9, 0.22, 11); },
  grains(el, g) { el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-matrix' }, undefined, g); grains(el, g, 0, 0, PW, PH, { n: 26, rmin: 4, rmax: 9, seed: 5 }); },
  angular(el, g) { el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-matrix' }, undefined, g); grains(el, g, 0, 0, PW, PH, { n: 10, rmin: 9, rmax: 15, round: false, seed: 8 }); },
  rounded(el, g) { el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-matrix' }, undefined, g); grains(el, g, 0, 0, PW, PH, { n: 10, rmin: 9, rmax: 15, seed: 21 }); },
  fine(el, g) { el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-grey' }, undefined, g); stipple(el, g, 0, 0, PW, PH, 260, 4); },
  glass(el, g) {
    el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-glass' }, undefined, g);
    // Conchoidal fracture: nested curved ridges, like a shell.
    for (let i = 0; i < 6; i++) el('path', { d: `M${18 + i * 9},${78} Q${40 + i * 10},${10 + i * 6} ${118},${14 + i * 9}`, class: 'rk-ridge' }, undefined, g);
    el('path', { d: 'M8,12 L30,6', class: 'rk-shine' }, undefined, g);
  },
  vesicles(el, g) {
    el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-dark' }, undefined, g);
    const r = rng(9);
    for (let i = 0; i < 40; i++) { const rad = 1.5 + r() * 5; el('ellipse', { cx: r() * PW, cy: r() * PH, rx: rad, ry: rad * 0.8, class: 'rk-hole' }, undefined, g); }
  },
  foam(el, g) {
    el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-light' }, undefined, g);
    const r = rng(19);
    for (let i = 0; i < 110; i++) { const rad = 1 + r() * 3; el('ellipse', { cx: r() * PW, cy: r() * PH, rx: rad * 1.6, ry: rad, class: 'rk-pore' }, undefined, g); }
  },
  foliated(el, g) {
    el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-light' }, undefined, g);
    const r = rng(13);
    for (let i = 0; i < 70; i++) {
      const cx = r() * PW, cy = r() * PH, len = 6 + r() * 10;
      el('ellipse', { cx, cy, rx: len, ry: 1.2 + r() * 0.8, transform: `rotate(-12 ${cx.toFixed(1)} ${cy.toFixed(1)})`, class: r() < 0.5 ? 'rk-dark' : 'rk-mica' }, undefined, g);
    }
  },
  porphyritic(el, g) {
    el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-grey' }, undefined, g);
    stipple(el, g, 0, 0, PW, PH, 220, 6);
    const r = rng(31);
    for (let i = 0; i < 9; i++) {
      const cx = 8 + r() * (PW - 16), cy = 8 + r() * (PH - 16), w = 7 + r() * 7, hh = 3 + r() * 3;
      el('rect', { x: cx - w / 2, y: cy - hh / 2, width: w, height: hh, transform: `rotate(${(r() * 180).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})`, class: i % 3 ? 'rk-light rk-grain' : 'rk-dark rk-grain' }, undefined, g);
    }
  },
  bedding(el, g) {
    const bands = [['rk-light', 14], ['rk-grey', 10], ['rk-light', 18], ['rk-matrix', 12], ['rk-grey', 14], ['rk-light', 12]];
    let y = 0;
    for (const [cls, hh] of bands) { el('rect', { x: 0, y, width: PW, height: hh, class: cls }, undefined, g); y += hh; }
    stipple(el, g, 0, 24, PW, 18, 90, 2);
  },
};

/** A small texture pictogram for an answer button. kind: a key of PICTOS. */
export function picto(kind, label) {
  const { s, el } = svg(PW, PH, label);
  s.classList.add('rk-picto');
  const f = frame(el, 0, 0, PW, PH);
  PICTOS[kind](el, f.g);
  f.done();
  return s;
}
export const PICTO_KINDS = Object.keys(PICTOS);

// ---------------------------------------------------------------- larger drawings
function caption(el, x, y, text, cls = 'rk-cap', anchor = 'middle') { return el('text', { x, y, 'text-anchor': anchor, class: cls }, text); }

function panel(el, x, y, w, h, draw) {
  const f = frame(el, x, y, w, h);
  const g = el('g', { transform: `translate(${x} ${y}) scale(${w / PW} ${h / PH})` }, undefined, f.g);
  draw(el, g);
  f.done();
}

const DRAWINGS = {
  /** The five overall looks of the texture question. */
  textures(T) {
    const kinds = [['crystals', T('interlocking crystals', 'cristaux jointifs')], ['grains', T('grains stuck together', 'grains cimentés')], ['fine', T('too fine to see', 'trop fin pour voir')], ['glass', T('glass', 'verre')], ['foliated', T('foliated', 'foliée')]];
    const W = 640, H = 120;
    const { s, el } = svg(W, H, T('Five overall looks of a rock, schematic', 'Cinq aspects d’ensemble d’une roche, schéma'));
    kinds.forEach(([k, lab], i) => { panel(el, 8 + i * 126, 6, 118, 80, PICTOS[k]); caption(el, 67 + i * 126, 104, lab); });
    return s;
  },

  /** Bedding (sedimentary layers) against foliation (aligned minerals). */
  bedding(T) {
    const W = 520, H = 190;
    const { s, el } = svg(W, H, T('Sedimentary bedding compared with metamorphic foliation, schematic', 'Stratification sédimentaire et foliation métamorphique, schéma'));
    panel(el, 10, 10, 240, 140, PICTOS.bedding);
    panel(el, 270, 10, 240, 140, PICTOS.foliated);
    caption(el, 130, 170, T('bedding: layers of different grains or colours', 'strates : couches de grains ou de couleurs différents'));
    caption(el, 390, 170, T('foliation: flat minerals all lying parallel', 'foliation : minéraux plats tous parallèles'));
    caption(el, 130, 184, T('(sedimentary)', '(sédimentaire)'), 'rk-cap rk-cap-muted');
    caption(el, 390, 184, T('(metamorphic)', '(métamorphique)'), 'rk-cap rk-cap-muted');
    return s;
  },

  /** Slaty cleavage cutting across bedding. */
  cleavage(T) {
    const W = 300, H = 170;
    const { s, el } = svg(W, H, T('Slaty cleavage cutting across the original beds, schematic', 'Schistosité de l’ardoise recoupant les strates d’origine, schéma'));
    const f = frame(el, 10, 10, 280, 130, 'rk-grey');
    for (let i = 0; i < 4; i++) el('rect', { x: 10, y: 22 + i * 30, width: 280, height: 12, class: 'rk-bed' }, undefined, f.g);
    for (let x = -60; x < 300; x += 9) el('line', { x1: x, y1: 140, x2: x + 60, y2: 10, class: 'rk-cleave' }, undefined, f.g);
    f.done();
    caption(el, 150, 158, T('old beds (bands) and the cleavage (fine slanting lines) along which slate splits', 'anciennes strates (bandes) et schistosité (fines lignes obliques) selon laquelle l’ardoise se débite'));
    return s;
  },

  /** Four kinds of foliation, finest to coarsest. */
  foliations(T) {
    const W = 640, H = 128;
    const { s, el } = svg(W, H, T('Slate, phyllite, schist, gneiss and migmatite, schematic', 'Ardoise, phyllade, schiste, gneiss et migmatite, schéma'));
    const items = [
      [T('slate', 'ardoise'), (g) => { el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-dark' }, undefined, g); for (let y = 2; y < PH; y += 3.2) el('line', { x1: 0, y1: y, x2: PW, y2: y, class: 'rk-fine-line' }, undefined, g); }],
      [T('phyllite', 'phyllade'), (g) => { el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-grey' }, undefined, g); for (let y = 3; y < PH; y += 4) el('path', { d: `M0,${y} q7,-3 14,0 t14,0 t14,0 t14,0 t14,0 t14,0 t14,0 t14,0 t14,0`, class: 'rk-sheen' }, undefined, g); }],
      [T('schist', 'schiste'), (g) => PICTOS.foliated(el, g)],
      [T('gneiss', 'gneiss'), (g) => {
        const r = rng(41);
        let y = 0, k = 0;
        while (y < PH) { const hh = 6 + r() * 8; const gg = el('g', {}, undefined, g); mosaic(el, gg, 0, y, PW, hh, 14, k % 2 ? 0.95 : 0.02, 50 + k); y += hh; k++; }
      }],
      [T('migmatite', 'migmatite'), (g) => {
        el('rect', { x: 0, y: 0, width: PW, height: PH, class: 'rk-dark' }, undefined, g);
        for (let i = 0; i < 5; i++) el('path', { d: `M-5,${8 + i * 16} C25,${-6 + i * 16} 40,${30 + i * 16} 65,${10 + i * 16} S100,${26 + i * 16} 125,${6 + i * 16}`, class: 'rk-leuco' }, undefined, g);
        el('ellipse', { cx: 84, cy: 50, rx: 18, ry: 11, class: 'rk-light' }, undefined, g);
      }],
    ];
    items.forEach(([lab, draw], i) => { panel(el, 8 + i * 126, 6, 118, 80, (e, g) => draw(g)); caption(el, 67 + i * 126, 104, lab); });
    caption(el, 320, 122, T('finest grain → coarsest grain (higher temperature and pressure)', 'grain le plus fin → grain le plus grossier (température et pression plus fortes)'), 'rk-cap rk-cap-muted');
    return s;
  },

  /** Grain-size scale with the 1/256, 1/16 and 2 mm limits (log scale). */
  grainsize(T) {
    const W = 600, H = 150;
    const { s, el } = svg(W, H, T('Grain-size scale: clay, silt, sand, gravel (logarithmic)', 'Échelle granulométrique : argile, silt, sable, gravier (logarithmique)'));
    const x0 = 20, x1 = 580, lo = Math.log10(0.0005), hi = Math.log10(64);
    const X = (mm) => x0 + (Math.log10(mm) - lo) / (hi - lo) * (x1 - x0);
    const bands = [[0.0005, 1 / 256, 'rk-g1', T('clay', 'argile')], [1 / 256, 1 / 16, 'rk-g2', T('silt', 'silt')], [1 / 16, 2, 'rk-g3', T('sand', 'sable')], [2, 64, 'rk-g5', T('gravel', 'gravier')]];
    for (const [a, b, cls, lab] of bands) {
      el('rect', { x: X(a), y: 30, width: X(b) - X(a), height: 34, class: cls });
      caption(el, (X(a) + X(b)) / 2, 52, lab, `rk-cap rk-on-${cls.slice(3)}`);
    }
    for (const [mm, lab] of [[1 / 256, '1/256 mm'], [1 / 16, '1/16 mm'], [2, '2 mm']]) {
      el('line', { x1: X(mm), x2: X(mm), y1: 24, y2: 72, class: 'rk-tick' });
      caption(el, X(mm), 18, lab, 'rk-cap rk-strong');
    }
    const mud = (X(0.0005) + X(1 / 16)) / 2, sand = (X(1 / 16) + X(2)) / 2, grav = (X(2) + X(64)) / 2;
    caption(el, mud, 88, T('invisible, even with a ×10 lens', 'invisible, même à la loupe ×10'));
    caption(el, mud, 103, T('teeth: clay smooth, silt gritty', 'dent : argile lisse, silt qui crisse'), 'rk-cap rk-cap-muted');
    caption(el, sand, 88, T('visible to the eye or lens', 'visible à l’œil ou à la loupe'));
    caption(el, sand, 103, T('gritty between fingers', 'rugueux entre les doigts'), 'rk-cap rk-cap-muted');
    caption(el, grav, 88, T('pebbles', 'cailloux'));
    caption(el, 300, 136, T('Logarithmic scale; limits of the Udden–Wentworth scale (some keys differ slightly).', 'Échelle logarithmique ; limites de l’échelle d’Udden-Wentworth (certaines clés diffèrent un peu).'), 'rk-cap rk-cap-muted');
    return s;
  },

  /** Mohs scale with the field tools. */
  hardness(T) {
    const W = 600, H = 170;
    const { s, el } = svg(W, H, T('Mohs hardness scale with the field tools: fingernail, copper coin, steel knife, glass', 'Échelle de dureté de Mohs avec les outils de terrain : ongle, pièce de cuivre, lame d’acier, verre'));
    const x0 = 40, x1 = 570, X = (v) => x0 + (v - 1) / 9 * (x1 - x0);
    el('line', { x1: x0, x2: x1, y1: 70, y2: 70, class: 'rk-axis' });
    const minerals = [[1, T('talc', 'talc')], [2, T('gypsum', 'gypse')], [3, T('calcite', 'calcite')], [4, T('fluorite', 'fluorine')], [5, T('apatite', 'apatite')], [6, T('orthoclase', 'orthose')], [7, T('quartz', 'quartz')], [8, T('topaz', 'topaze')], [9, T('corundum', 'corindon')], [10, T('diamond', 'diamant')]];
    for (const [v, lab] of minerals) {
      el('circle', { cx: X(v), cy: 70, r: 4, class: 'rk-node' });
      caption(el, X(v), 58, String(v), 'rk-cap rk-strong');
      caption(el, X(v), 92, lab, 'rk-cap');
    }
    const tools = [[2.5, T('fingernail ≈ 2.5', 'ongle ≈ 2,5')], [3.5, T('copper coin ≈ 3.5', 'cuivre ≈ 3,5')], [5.5, T('knife, glass ≈ 5.5', 'couteau, verre ≈ 5,5')]];
    tools.forEach(([v, lab], i) => {
      el('path', { d: `M${X(v)},${108} l-5,-9 h10 z`, class: 'rk-tool' });
      caption(el, X(v), 124 + (i % 2) * 14, lab, 'rk-cap rk-tool-txt');
    });
    el('rect', { x: X(1), y: 26, width: X(2.5) - X(1), height: 8, rx: 4, class: 'rk-g2' });
    el('rect', { x: X(5.5), y: 26, width: X(10) - X(5.5), height: 8, rx: 4, class: 'rk-g5' });
    caption(el, X(1), 20, T('the fingernail scratches these', 'l’ongle les raye'), 'rk-cap rk-cap-muted', 'start');
    caption(el, X(10), 20, T('these scratch glass', 'ceux-ci rayent le verre'), 'rk-cap rk-cap-muted', 'end');
    caption(el, 300, 162, T('A material scratches everything below it on the scale. Values of the tools are approximate.', 'Un matériau raye tout ce qui est en dessous de lui sur l’échelle. Les valeurs des outils sont approchées.'), 'rk-cap rk-cap-muted');
    return s;
  },

  /** Colour index: share of dark minerals. */
  colourindex(T) {
    const W = 620, H = 130;
    const { s, el } = svg(W, H, T('Colour index: about 10, 40, 75 and 95 percent dark minerals, schematic', 'Indice de coloration : environ 10, 40, 75 et 95 % de minéraux sombres, schéma'));
    const items = [[0.1, T('light (granite)', 'clair (granite)')], [0.4, T('salt and pepper (diorite)', 'poivre et sel (diorite)')], [0.75, T('dark (gabbro)', 'sombre (gabbro)')], [0.95, T('nearly all (peridotite)', 'presque tout (péridotite)')]];
    items.forEach(([d, lab], i) => {
      panel(el, 10 + i * 152, 6, 144, 86, (e, g) => mosaic(e, g, 0, 0, PW, PH, 11, d, 70 + i));
      caption(el, 82 + i * 152, 108, `≈ ${Math.round(d * 100)} %`, 'rk-cap rk-strong');
      caption(el, 82 + i * 152, 123, lab);
    });
    return s;
  },

  /** Angular and rounded fragments. */
  shape(T) {
    const W = 420, H = 130;
    const { s, el } = svg(W, H, T('Angular fragments (breccia) and rounded pebbles (conglomerate), schematic', 'Fragments anguleux (brèche) et galets arrondis (poudingue), schéma'));
    panel(el, 10, 6, 190, 96, PICTOS.angular);
    panel(el, 220, 6, 190, 96, PICTOS.rounded);
    caption(el, 105, 120, T('angular: breccia', 'anguleux : brèche'));
    caption(el, 315, 120, T('rounded: conglomerate', 'arrondis : poudingue'));
    return s;
  },

  /** Fracture around grains (sandstone) or through grains (quartzite). */
  fracture(T) {
    const W = 420, H = 140;
    const { s, el } = svg(W, H, T('A crack goes around the grains in sandstone and through them in quartzite, schematic', 'La cassure contourne les grains dans le grès et les traverse dans le quartzite, schéma'));
    const draw = (x, through) => {
      const f = frame(el, x, 6, 190, 100, 'rk-matrix');
      const gr = [];
      for (let j = 0; j < 5; j++) for (let i = 0; i < 9; i++) gr.push([x + 12 + i * 21 + (j % 2) * 10, 16 + j * 21]);
      for (const [cx, cy] of gr) el('circle', { cx, cy, r: through ? 11.5 : 9, class: 'rk-light rk-grain' }, undefined, f.g);
      // Sandstone: the crack hugs the top of one row of grains; quartzite: it runs straight through them.
      const d = through ? `M${x},55 L${x + 190},49` : `M${x},58 ${gr.filter((p) => p[1] === 58).map(([cx]) => `L${cx - 9},58 A9 9 0 0 1 ${cx + 9},58`).join(' ')} L${x + 190},58`;
      el('path', { d, class: 'rk-crack' }, undefined, f.g);
      f.done();
    };
    draw(10, false);
    draw(220, true);
    caption(el, 105, 124, T('sandstone: breaks around the grains', 'grès : se casse autour des grains'));
    caption(el, 315, 124, T('quartzite: breaks through the grains', 'quartzite : se casse à travers les grains'));
    return s;
  },

  /** A drop of acid fizzing. */
  acid(T) {
    const W = 300, H = 150;
    const { s, el } = svg(W, H, T('A drop of dilute acid fizzing on a carbonate rock, schematic', 'Une goutte d’acide dilué qui fait effervescence sur une roche carbonatée, schéma'));
    el('path', { d: 'M20,120 Q30,92 90,96 Q170,84 230,98 Q280,104 284,120 Z', class: 'rk-light rk-frame' });
    el('path', { d: 'M150,20 C150,20 140,40 140,48 a10,10 0 0 0 20,0 C160,40 150,20 150,20 Z', class: 'rk-drop' });
    el('path', { d: 'M110,95 Q150,74 190,95 Z', class: 'rk-drop' });
    const r = rng(77);
    for (let i = 0; i < 14; i++) el('circle', { cx: 120 + r() * 60, cy: 72 + r() * 18, r: 1.5 + r() * 3, class: 'rk-bubble' });
    caption(el, 150, 140, T('bubbles of carbon dioxide: the rock contains calcite', 'bulles de dioxyde de carbone : la roche contient de la calcite'));
    return s;
  },

  /** Porphyritic texture. */
  porphyritic(T) {
    const W = 300, H = 130;
    const { s, el } = svg(W, H, T('Porphyritic texture: large crystals in a fine-grained mass, schematic', 'Texture porphyrique : grands cristaux dans une pâte fine, schéma'));
    panel(el, 10, 6, 280, 96, PICTOS.porphyritic);
    caption(el, 150, 122, T('phenocrysts in a fine mass', 'phénocristaux dans une pâte fine'));
    return s;
  },
};

/** A larger explanatory drawing by id. T(en, fr) picks the language. */
export function drawing(id, T) { return DRAWINGS[id](T); }
export const DRAWING_IDS = Object.keys(DRAWINGS);
