// Reaction path: a primary mineral dissolves into water, little by little.
// xi = moles of the mineral dissolved per kg of water. Aluminium is kept in
// the solids: it goes into whichever secondary mineral is stable (gibbsite,
// kaolinite, a mica, a smectite), the other elements stay in the water unless
// that mineral takes them. Iron(II) is oxidised by the air and precipitates as
// goethite. A "partial equilibrium" model:
// the primary mineral is out of equilibrium, the secondary ones are in
// equilibrium with the water (the classic partial-equilibrium approach).

import { PHASES, dissolution, logK } from './thermo.js';
import { parse } from './formula.js';
import { speciate, logAlEq, satIndex, hasAl } from './water.js';

const CAT = { K: 'K+', Na: 'Na+', Ca: 'Ca+2', Mg: 'Mg+2' };
const SMECTITE = { K: null, Na: 'beidellite-Na', Ca: 'beidellite-Ca', Mg: 'beidellite-Mg' };

const comp = (id) => {
  const el = parse(PHASES[id].f).el;
  const o = {};
  for (const e of ['K', 'Na', 'Ca', 'Mg', 'Fe', 'Al', 'Si']) o[e] = el[e] ? Number(el[e]) : 0;
  return o;
};

/** Secondary aluminium minerals considered for a primary mineral. */
export function candidates(primary) {
  const c = comp(primary);
  const list = ['gibbsite', 'kaolinite'];
  if (c.K) list.push('muscovite');
  for (const e of ['Na', 'Ca', 'Mg']) if (c[e] && SMECTITE[e]) list.push(SMECTITE[e]);
  // The starting mineral itself is not a product; its saturation ends the path.
  return list.filter((id) => id !== primary);
}

// Non-aluminium minerals whose saturation is reported (not precipitated).
export const WATCH = ['quartz', 'SiO2(am)', 'chrysotile', 'talc', 'sepiolite', 'brucite', 'calcite'];

/**
 * State of the water and solids after dissolving xi mol/kgw of `primary`.
 * opts: { tC, logPCO2 } or { tC, pH }
 */
export function stateAt(primary, xi, opts) {
  const c = comp(primary);
  const tC = opts.tC ?? 25;
  const totals = { K: c.K * xi, Na: c.Na * xi, Ca: c.Ca * xi, Mg: c.Mg * xi, Si: c.Si * xi };
  const solids = {};
  if (c.Fe) solids.goethite = c.Fe * xi;
  const base = { tC, ...(Number.isFinite(opts.pH) ? { pH: opts.pH } : { logPCO2: opts.logPCO2 }) };
  const result = (sp, assemblage, amounts, A) => {
    const out = { xi, primary, sp, assemblage, solids: { ...solids, ...amounts }, laAl: A, tC };
    out.siPrimary = hasAl(primary) ? satIndex(primary, sp.la, tC, A) : satIndex(primary, sp.la, tC);
    out.si = Object.fromEntries(WATCH.map((id) => [id, satIndex(id, sp.la, tC)]));
    out.saturated = out.siPrimary >= -1e-6;
    return out;
  };
  if (!c.Al) {
    const sp = speciate(totals, base);
    return result(sp, [], {}, undefined);
  }
  const cands = candidates(primary);
  const cc = Object.fromEntries(cands.map((id) => [id, comp(id)]));
  const water = (amounts) => {
    const t = { ...totals };
    for (const [id, m] of Object.entries(amounts)) {
      for (const e of ['K', 'Na', 'Ca', 'Mg', 'Si']) t[e] -= cc[id][e] * m;
    }
    for (const e of ['K', 'Na', 'Ca', 'Mg', 'Si']) {
      if (t[e] < -1e-15 * xi) return null;
      t[e] = Math.max(0, t[e]);
    }
    return t;
  };
  const evalA = (amounts) => {
    const t = water(amounts);
    if (!t) return null;
    const sp = speciate(t, base);
    const A = Object.fromEntries(cands.map((id) => [id, logAlEq(id, sp.la, tC)]));
    return { sp, A };
  };
  const tol = 1e-7;
  // One secondary mineral holds all the aluminium.
  for (const s of cands) {
    const am = { [s]: (c.Al * xi) / cc[s].Al };
    const r = evalA(am);
    if (!r) continue;
    if (cands.every((j) => r.A[s] <= r.A[j] + tol)) return result(r.sp, [s], am, r.A[s]);
  }
  // Two minerals share the aluminium: find the split where both are stable.
  for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) {
    const s = cands[i], t = cands[j];
    const amt = (f) => ({ [s]: (f * c.Al * xi) / cc[s].Al, [t]: ((1 - f) * c.Al * xi) / cc[t].Al });
    const g = (f) => { const r = evalA(amt(f)); return r ? { d: r.A[s] - r.A[t], r } : null; };
    let lo = 0, hi = 1;
    let glo = g(lo), ghi = g(hi);
    if (!glo || !ghi) {
      // Find a feasible sub-interval (mass balance can fail at one end).
      const fs = Array.from({ length: 41 }, (_, k) => k / 40);
      const ok = fs.map((f) => g(f));
      let found = false;
      for (let k = 0; k < fs.length - 1; k++) {
        if (ok[k] && ok[k + 1] && Math.sign(ok[k].d) !== Math.sign(ok[k + 1].d)) { lo = fs[k]; hi = fs[k + 1]; glo = ok[k]; ghi = ok[k + 1]; found = true; break; }
      }
      if (!found) continue;
    }
    if (Math.sign(glo.d) === Math.sign(ghi.d)) continue;
    let mid, gm;
    for (let k = 0; k < 60 && hi - lo > 1e-9; k++) {
      mid = (lo + hi) / 2;
      gm = g(mid);
      if (!gm) break;
      if (Math.sign(gm.d) === Math.sign(glo.d)) { lo = mid; glo = gm; } else { hi = mid; }
    }
    if (!gm) continue;
    const r = gm.r;
    const Amin = Math.min(r.A[s], r.A[t]);
    if (cands.every((k) => Amin <= r.A[k] + 1e-5)) return result(r.sp, [s, t], amt(mid), Amin);
  }
  // Three minerals (a triple point): the water composition is fixed by the
  // two boundaries; solve the amounts from the mass balance.
  for (let i = 0; i < cands.length; i++) for (let j = i + 1; j < cands.length; j++) for (let k = j + 1; k < cands.length; k++) {
    const tri = [cands[i], cands[j], cands[k]];
    const r = triple(tri, cc, c, xi, totals, base, cands, tC);
    if (r) return result(r.sp, tri, r.amounts, r.A);
  }
  return { xi, primary, unsolved: true, tC };
}

// Triple point in a single-cation system: unknowns are 3 amounts; we search
// the amount of the cation-free minerals by a 2-D grid refinement on the
// mismatch of the three aluminium activities.
function triple(tri, cc, c, xi, totals, base, cands, tC) {
  const evalA = (am) => {
    const t = { ...totals };
    for (const [id, m] of Object.entries(am)) for (const e of ['K', 'Na', 'Ca', 'Mg', 'Si']) t[e] -= cc[id][e] * m;
    for (const e of ['K', 'Na', 'Ca', 'Mg', 'Si']) { if (t[e] < -1e-15 * xi) return null; t[e] = Math.max(0, t[e]); }
    const sp = speciate(t, base);
    const A = Object.fromEntries(cands.map((id) => [id, logAlEq(id, sp.la, tC)]));
    return { sp, A };
  };
  const Al = c.Al * xi;
  const amt = (f1, f2) => ({ [tri[0]]: (f1 * Al) / cc[tri[0]].Al, [tri[1]]: (f2 * Al) / cc[tri[1]].Al, [tri[2]]: ((1 - f1 - f2) * Al) / cc[tri[2]].Al });
  const cost = (f1, f2) => {
    if (f1 < 0 || f2 < 0 || f1 + f2 > 1) return null;
    const r = evalA(amt(f1, f2));
    if (!r) return null;
    const a = tri.map((id) => r.A[id]);
    return { e: (a[0] - a[1]) ** 2 + (a[1] - a[2]) ** 2, r };
  };
  let best = null, bf = [0, 0];
  const N = 12;
  for (let a = 0; a <= N; a++) for (let b = 0; a + b <= N; b++) {
    const cst = cost(a / N, b / N);
    if (cst && (!best || cst.e < best.e)) { best = cst; bf = [a / N, b / N]; }
  }
  if (!best) return null;
  let step = 1 / N;
  for (let it = 0; it < 40; it++) {
    let improved = false;
    for (const [d1, d2] of [[step, 0], [-step, 0], [0, step], [0, -step], [step, -step], [-step, step]]) {
      const cst = cost(bf[0] + d1, bf[1] + d2);
      if (cst && cst.e < best.e) { best = cst; bf = [bf[0] + d1, bf[1] + d2]; improved = true; }
    }
    if (!improved) step /= 2;
    if (step < 1e-9) break;
  }
  if (best.e > 1e-6) return null;
  const A = Math.min(...tri.map((id) => best.r.A[id]));
  if (!cands.every((k) => A <= best.r.A[k] + 1e-3)) return null;
  return { sp: best.r.sp, amounts: amt(bf[0], bf[1]), A };
}

/**
 * xi at which the water reaches equilibrium with the primary mineral (it stops
 * dissolving), searched between 1e-8 and 1 mol/kgw. Returns Infinity if not reached.
 */
export function endOfPath(primary, opts) {
  const si = (lx) => { const s = stateAt(primary, 10 ** lx, opts); return s.unsolved ? NaN : s.siPrimary; };
  // siPrimary rises along the path; NaN (unsolved) counts as not yet saturated.
  let lo = -8, hi = 0;
  const shi = si(hi);
  if (!(shi > 0)) return Infinity;
  if (si(lo) > 0) return 10 ** lo;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    const s = si(mid);
    if (s > 0) hi = mid; else lo = mid;
  }
  return 10 ** ((lo + hi) / 2);
}

/** Path sampled in log xi; stops at saturation with the primary. */
export function pathPoints(primary, opts, { from = -7, to = -1, n = 61 } = {}) {
  const end = endOfPath(primary, opts);
  const lend = Math.log10(end);
  const pts = [];
  for (let k = 0; k < n; k++) {
    const lx = from + ((to - from) * k) / (n - 1);
    if (lx > lend) break;
    const s = stateAt(primary, 10 ** lx, opts);
    if (!s.unsolved) pts.push(s);
  }
  if (Number.isFinite(lend) && lend > from && lend <= to) {
    const s = stateAt(primary, end, opts);
    if (!s.unsolved) { s.end = true; pts.push(s); }
  }
  return { pts, end };
}

/** Where the stable secondary mineral changes along the path (log xi of each change). */
export function transitions(primary, opts, range = [-7, -1]) {
  const end = Math.log10(endOfPath(primary, opts));
  range = [range[0], Math.min(range[1], end)];
  const key = (s) => (s.unsolved ? '?' : s.assemblage.join('+'));
  const out = [];
  const n = 121;
  let prev = null;
  for (let k = 0; k < n; k++) {
    const lx = range[0] + ((range[1] - range[0]) * k) / (n - 1);
    const s = stateAt(primary, 10 ** lx, opts);
    const kk = key(s);
    if (kk !== prev) out.push({ lx, assemblage: s.assemblage ?? [], unsolved: !!s.unsolved });
    prev = kk;
  }
  return out;
}

export { comp };
void logK; void dissolution;
