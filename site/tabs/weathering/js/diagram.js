// Activity (stability) diagrams, computed from the equilibrium constants.
//
// Aluminium systems (K, Na, Ca): aluminium is assumed to stay in the solids,
// so each mineral is written per aluminium atom and the stable one at a point
// (x = log a(H4SiO4), y = log(a(M)/a(H+)^z)) is the one that needs the least
// dissolved aluminium. The boundaries are straight lines.
// Magnesium system (no aluminium): lines are the solubility limits; below the
// lowest one the water dissolves every phase.

import { dissolution, logK, PHASES } from './thermo.js';

export const SYSTEMS = {
  K: { cation: 'K+', z: 1, phases: ['gibbsite', 'kaolinite', 'muscovite', 'K-feldspar'], x: [-6, -2], y: [-1, 8], kind: 'al' },
  Na: { cation: 'Na+', z: 1, phases: ['gibbsite', 'kaolinite', 'beidellite-Na', 'albite'], x: [-6, -2], y: [-1, 10], kind: 'al' },
  Ca: { cation: 'Ca+2', z: 2, phases: ['gibbsite', 'kaolinite', 'beidellite-Ca', 'anorthite'], x: [-6, -2], y: [2, 26], kind: 'al' },
  Mg: { cation: 'Mg+2', z: 2, phases: ['brucite', 'forsterite', 'enstatite', 'chrysotile', 'talc', 'sepiolite'], x: [-6, -2], y: [4, 20], kind: 'mg' },
};

// Ordinal weathering stage for the fill colour: 1 fresh ... 4 most leached.
export const STAGE = {
  'K-feldspar': 1, albite: 1, anorthite: 1,
  muscovite: 2, 'beidellite-Na': 2, 'beidellite-Ca': 2,
  kaolinite: 3, gibbsite: 4,
};

/** Coefficients of a phase in a system: per its dissolution reaction. */
function coeffs(id, sys) {
  const { nu } = dissolution(id);
  return { nM: nu[sys.cation] ?? 0, nSi: nu.H4SiO4 ?? 0, nAl: nu['Al+3'] ?? 0 };
}

/** Linear "potential" of each phase: value = c0 + cx x + cy y; the stable phase has the lowest value. */
export function potentials(sysKey, tC, ds = 'llnl', phases) {
  const sys = SYSTEMS[sysKey];
  const list = (phases ?? sys.phases).filter((id) => Number.isFinite(logK(id, tC, ds)));
  return list.map((id) => {
    const c = coeffs(id, sys);
    const K = logK(id, tC, ds);
    if (sys.kind === 'al') return { id, c0: K / c.nAl, cx: -c.nSi / c.nAl, cy: -c.nM / c.nAl };
    // Mg: saturation line y = (K - nSi x)/nM; phase i stable where its line is lowest.
    return { id, c0: K / c.nM, cx: -c.nSi / c.nM, cy: 0 };
  });
}

// Sutherland-Hodgman clip of a polygon by a half-plane a x + b y <= c.
function clip(poly, a, b, c) {
  const out = [];
  const inside = (p) => a * p[0] + b * p[1] <= c + 1e-12;
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const pin = inside(P), qin = inside(Q);
    if (pin) out.push(P);
    if (pin !== qin) {
      const fp = a * P[0] + b * P[1] - c, fq = a * Q[0] + b * Q[1] - c;
      const t = fp / (fp - fq);
      out.push([P[0] + t * (Q[0] - P[0]), P[1] + t * (Q[1] - P[1])]);
    }
  }
  return out;
}

const box = (sys) => [[sys.x[0], sys.y[0]], [sys.x[1], sys.y[0]], [sys.x[1], sys.y[1]], [sys.x[0], sys.y[1]]];

/** Field polygons in data coordinates: [{id, poly}] (+ {id: 'solution'} for Mg). */
export function fields(sysKey, tC, ds = 'llnl', phases) {
  const sys = SYSTEMS[sysKey];
  const pots = potentials(sysKey, tC, ds, phases);
  const out = [];
  for (const p of pots) {
    let poly = box(sys);
    for (const q of pots) {
      if (q === p) continue;
      // p.value <= q.value  <=>  (p.cx - q.cx) x + (p.cy - q.cy) y <= q.c0 - p.c0
      poly = clip(poly, p.cx - q.cx, p.cy - q.cy, q.c0 - p.c0);
      if (poly.length < 3) break;
    }
    if (sys.kind === 'mg' && poly.length >= 3) poly = clip(poly, p.cx, -1, -p.c0); // above its own line: y >= c0 + cx x
    if (poly.length >= 3) out.push({ id: p.id, poly });
  }
  if (sys.kind === 'mg') {
    let poly = box(sys);
    for (const p of pots) poly = clip(poly, -p.cx, 1, p.c0); // y <= c0 + cx x
    if (poly.length >= 3) out.push({ id: 'solution', poly });
  }
  return out;
}

/** Stable phase at a point (or 'solution' in the Mg system when undersaturated). */
export function stableAt(sysKey, x, y, tC, ds = 'llnl') {
  const sys = SYSTEMS[sysKey];
  const pots = potentials(sysKey, tC, ds);
  let best = null;
  for (const p of pots) { const v = p.c0 + p.cx * x + p.cy * y; if (!best || v < best.v) best = { id: p.id, v }; }
  if (sys.kind === 'mg' && y < best.v) return 'solution';
  return best.id;
}

/**
 * Boundaries actually shown between two fields: [{a, b, line: {slope, icept} | {x}}].
 * A boundary between a and b is the line where their potentials are equal.
 */
export function boundaries(sysKey, tC, ds = 'llnl') {
  const sys = SYSTEMS[sysKey];
  const pots = potentials(sysKey, tC, ds);
  const out = [];
  for (let i = 0; i < pots.length; i++) for (let j = i + 1; j < pots.length; j++) {
    const p = pots[i], q = pots[j];
    const dx = p.cx - q.cx, dy = p.cy - q.cy, dc = q.c0 - p.c0; // dx x + dy y = dc
    // sample the line inside the box, keep it if somewhere both are the lowest
    let shown = false;
    for (let k = 0; k <= 200 && !shown; k++) {
      let x, y;
      if (Math.abs(dy) > 1e-12) { x = sys.x[0] + ((sys.x[1] - sys.x[0]) * k) / 200; y = (dc - dx * x) / dy; }
      else { x = dc / dx; y = sys.y[0] + ((sys.y[1] - sys.y[0]) * k) / 200; }
      if (y < sys.y[0] || y > sys.y[1] || x < sys.x[0] || x > sys.x[1]) continue;
      const v = p.c0 + p.cx * x + p.cy * y;
      if (pots.every((r) => r.c0 + r.cx * x + r.cy * y >= v - 1e-9)) {
        if (sys.kind === 'mg' && y < v) continue;
        shown = true;
      }
    }
    if (!shown) continue;
    const line = Math.abs(dy) > 1e-12 ? { slope: -dx / dy, icept: dc / dy } : { x: dc / dx };
    out.push({ a: p.id, b: q.id, line });
  }
  return out;
}

/** Silica saturation lines (log a(H4SiO4)) at tC. */
export const silicaLines = (tC, ds = 'llnl') => ({ quartz: logK('quartz', tC, ds), amorphous: logK('SiO2(am)', tC, ds) });

/** Axis value for a water: { x, y } from log activities. */
export function point(sysKey, la) {
  const sys = SYSTEMS[sysKey];
  return { x: la.H4SiO4, y: la[sys.cation] - sys.z * la['H+'] };
}

export { PHASES };

/**
 * 1-sigma uncertainty (log units) of the position of a boundary computed from
 * Robie & Hemingway (1995): the boundary reaction per aluminium (or magnesium)
 * atom, with the stated uncertainties of the Gibbs energies of every species
 * taken as independent. Returns null if a species has no value there.
 */
export function boundarySigmaRH(sysKey, a, b, RH, R, T0) {
  const sys = SYSTEMS[sysKey];
  const norm = sys.kind === 'al' ? 'Al+3' : sys.cation;
  const v = {};
  for (const [id, sgn] of [[a, -1], [b, 1]]) {
    const { nu } = dissolution(id);
    const n = nu[norm];
    v[id] = (v[id] ?? 0) - sgn / n; // the mineral itself
    for (const [sp, c] of Object.entries(nu)) v[sp] = (v[sp] ?? 0) + (sgn * c) / n;
  }
  let var2 = 0;
  for (const [sp, c] of Object.entries(v)) {
    if (Math.abs(c) < 1e-12 || sp === 'H+') continue;
    const d = RH[sp];
    if (!d) return null;
    if (d[2] === null) continue;
    var2 += (c * d[2]) ** 2;
  }
  return Math.sqrt(var2) / (R * T0 * Math.LN10);
}
