// Thermodynamic data and equilibrium constants.
//
// Main data set: llnl.dat as distributed with PHREEQC 3 (USGS), itself
// converted from the Lawrence Livermore thermo.com.V8.R6 data base (Jim
// Johnson, LLNL), whose silicate data descend from SUPCRT92 / Helgeson et al.
// (1978). Every number below is copied from that file (checked by
// scripts/check-thermo.mjs against a downloaded copy).
//
// Two independent data sets serve as a cross-check of the uncertainty:
// - Robie & Hemingway (1995), USGS Bulletin 2131: standard Gibbs energies and
//   enthalpies of formation at 298.15 K with their stated uncertainties.
// - phreeqc.dat (PHREEQC 3, USGS), mostly from the WATEQ4F lineage.
//
// Convention: every dissolution reaction is written with H+, the free cations
// (K+, Na+, Ca+2, Mg+2, Fe+2 or Fe+3), Al+3, H4SiO4, HCO3- and H2O, e.g.
//   KAlSi3O8 + 4 H+ + 4 H2O = K+ + Al+3 + 3 H4SiO4.
// llnl.dat writes SiO2(aq) instead of H4SiO4; the two differ only by water,
// whose activity is taken as 1, so log K is the same.

import { balanceQ, parse } from './formula.js';

export const T0 = 298.15;
export const R = 8.31446e-3; // kJ/(mol K)
const LN10 = Math.LN10;

// ---------------------------------------------------------------- phases
// f: formula; ferric: iron enters as Fe+3 (oxides); an: llnl -analytic A1..A5
// (log K = A1 + A2 T + A3/T + A4 log10 T + A5/T^2, T in K); lk: llnl log_k at 25 °C.
export const PHASES = {
  'K-feldspar': { f: 'KAlSi3O8', lk: -0.2753, an: [-1.0684e+0, 1.3111e-2, 1.1671e+4, -9.9129e+0, -1.5855e+6], llnl: 'K-Feldspar' },
  albite: { f: 'NaAlSi3O8', lk: 2.7645, an: [-1.1694e+1, 1.4429e-2, 1.3784e+4, -7.2866e+0, -1.6136e+6], llnl: 'Albite' },
  anorthite: { f: 'CaAl2Si2O8', lk: 26.578, an: [3.9717e-1, -1.8751e-2, 1.4897e+4, -6.3078e+0, -2.3885e+5], llnl: 'Anorthite' },
  muscovite: { f: 'KAl3Si3O10(OH)2', lk: 13.5858, an: [3.3085e+1, -1.2425e-2, 1.2477e+4, -2.0865e+1, -5.4692e+5], llnl: 'Muscovite' },
  phlogopite: { f: 'KMg3AlSi3O10(OH)2', lk: 37.44, an: [-8.773e+1, -1.7253e-2, 2.3748e+4, 2.4465e+1, -8.9045e+5], llnl: 'Phlogopite' },
  annite: { f: 'KFe3AlSi3O10(OH)2', lk: 29.4693, an: [-4.0186e+1, -1.4238e-2, 1.8929e+4, 7.9859e+0, -8.4343e+5], llnl: 'Annite' },
  kaolinite: { f: 'Al2Si2O5(OH)4', lk: 6.8101, an: [1.6835e+1, -7.8939e-3, 7.7636e+3, -1.219e+1, -3.2354e+5], llnl: 'Kaolinite' },
  gibbsite: { f: 'Al(OH)3', lk: 7.756, an: [-1.1403e+2, -3.6453e-2, 7.7236e+3, 4.3134e+1, 1.2055e+2], llnl: 'Gibbsite' },
  'beidellite-Na': { f: 'Na0.33Al2.33Si3.67O10(OH)2', lk: 5.6473, an: [1.1504e+1, 3.9871e-3, 1.5818e+4, -1.7762e+1, -1.4485e+6], llnl: 'Beidellite-Na' },
  'beidellite-Ca': { f: 'Ca0.165Al2.33Si3.67O10(OH)2', lk: 5.5914, an: [2.3887e+1, 4.4178e-3, 1.5296e+4, -2.2343e+1, -1.4025e+6], llnl: 'Beidellite-Ca' },
  'beidellite-K': { f: 'K0.33Al2.33Si3.67O10(OH)2', lk: 5.3088, an: [1.0792e+1, 3.4419e-3, 1.576e+4, -1.7333e+1, -1.4779e+6], llnl: 'Beidellite-K' },
  'beidellite-Mg': { f: 'Mg0.165Al2.33Si3.67O10(OH)2', lk: 5.5537, an: [1.3375e+1, 3.042e-3, 1.5947e+4, -1.8728e+1, -1.4242e+6], llnl: 'Beidellite-Mg' },
  forsterite: { f: 'Mg2SiO4', lk: 27.8626, an: [-7.6195e+1, -1.4013e-2, 1.4763e+4, 2.509e+1, -3.0379e+5], llnl: 'Forsterite' },
  fayalite: { f: 'Fe2SiO4', lk: 19.1113, an: [1.3853e+1, -3.5501e-3, 7.1496e+3, -6.871e+0, -6.331e+4], llnl: 'Fayalite' },
  enstatite: { f: 'MgSiO3', lk: 11.3269, an: [-4.9278e+1, -3.2832e-3, 9.5205e+3, 1.4437e+1, -5.4324e+5], llnl: 'Enstatite' },
  diopside: { f: 'CaMgSi2O6', lk: 20.9643, an: [7.124e+1, 1.5514e-2, 8.1437e+3, -3.0672e+1, -5.688e+5], llnl: 'Diopside' },
  tremolite: { f: 'Ca2Mg5Si8O22(OH)2', lk: 61.2367, an: [8.5291e+1, 4.6337e-2, 3.9465e+4, -5.4414e+1, -3.1913e+6], llnl: 'Tremolite' },
  chrysotile: { f: 'Mg3Si2O5(OH)4', lk: 31.1254, an: [-9.2462e+1, -1.1359e-2, 1.8312e+4, 2.9289e+1, -6.2342e+5], llnl: 'Chrysotile' },
  talc: { f: 'Mg3Si4O10(OH)2', lk: 21.1383, an: [1.1164e+1, 2.4724e-2, 1.981e+4, -1.7568e+1, -1.8241e+6], llnl: 'Talc' },
  sepiolite: { f: 'Mg4Si6O15(OH)2:6H2O', lk: 30.4439, an: [1.869e+1, 4.7544e-2, 2.6765e+4, -2.5301e+1, -2.6498e+6], llnl: 'Sepiolite' },
  brucite: { f: 'Mg(OH)2', lk: 16.298, an: [-1.028e+2, -1.9759e-2, 9.018e+3, 3.8282e+1, 1.4075e+2], llnl: 'Brucite' },
  quartz: { f: 'SiO2', lk: -3.9993, an: [7.7698e-2, 1.0612e-2, 3.4651e+3, -4.3551e+0, -7.2138e+5], llnl: 'Quartz' },
  chalcedony: { f: 'SiO2', lk: -3.7281, an: [-9.0068e+0, 9.3241e-3, 4.0535e+3, -1.083e+0, -7.5077e+5], llnl: 'Chalcedony' },
  'SiO2(am)': { f: 'SiO2', lk: -2.7136, an: [1.2109e+0, 7.0767e-3, 2.3634e+3, -3.4449e+0, -4.8591e+5], llnl: 'SiO2(am)' },
  goethite: { f: 'FeOOH', ferric: true, lk: 0.5345, an: [-6.0331e+1, -1.0847e-2, 4.7759e+3, 1.9429e+1, 8.1122e+1], llnl: 'Goethite' },
  hematite: { f: 'Fe2O3', ferric: true, lk: 0.1086, an: [-2.2015e+2, -6.029e-2, 1.1812e+4, 8.0253e+1, 1.8438e+2], llnl: 'Hematite' },
  calcite: { f: 'CaCO3', lk: 1.8487, an: [-1.4978e+2, -4.837e-2, 4.8974e+3, 6.0458e+1, 7.6464e+1], llnl: 'Calcite' },
};

// Aqueous and gas reactions (llnl.dat), written as in the file.
export const AQ = {
  // H2O = OH- + H+
  OH: { lk: -13.9951, an: [-6.7506e+1, -3.0619e-2, -1.9901e+3, 2.8004e+1, -3.1033e+1] },
  // H4SiO4 (SiO2 + H2O in the file) = H3SiO4- + H+   (HSiO3- in llnl.dat)
  H3SiO4: { lk: -9.9525, an: [6.4211e+1, -2.4872e-2, -1.2707e+4, -1.4681e+1, 1.0853e+6] },
  // H4SiO4 = H2SiO4-2 + 2 H+   (no temperature function in the file)
  H2SiO4: { lk: -22.96 },
  // CO2(g) + H2O = H+ + HCO3-
  CO2g: { lk: -7.8136, an: [-8.5938e+1, -3.0431e-2, 2.0702e+3, 3.2427e+1, 3.2328e+1] },
  // HCO3- = CO3-2 + H+
  CO3: { lk: -10.3288, an: [-6.9958e+1, -3.3526e-2, -7.0846e+1, 2.8224e+1, -1.0849e+0] },
  // HCO3- + H+ = CO2(aq) + H2O
  CO2aq: { lk: 6.3447, an: [-1.0534e+1, 2.1746e-2, 2.5216e+3, 7.9125e-1, 3.9351e+1] },
  // Fe+2 + H+ + 0.25 O2(aq) = Fe+3 + 0.5 H2O
  Fe3: { lk: 8.4899, an: [-1.7808e+1, -1.1753e-2, 4.7609e+3, 5.5866e+0, 7.4295e+1] },
  // O2(g) = O2(aq)
  O2g: { lk: -2.8983, an: [-7.5001e+0, 7.8981e-3, 0, 0, 2.0027e+5] },
};

// Activity model of llnl.dat (B-dot): parameters at 0.01, 25, 60, 100 °C, and ion sizes (Å).
export const DH = {
  t: [0.01, 25, 60, 100],
  A: [0.4939, 0.5114, 0.5465, 0.5995],
  B: [0.3253, 0.3288, 0.3346, 0.3421],
  bdot: [0.0374, 0.041, 0.0438, 0.046],
  size: { 'H+': 9, 'K+': 3, 'Na+': 4, 'Ca+2': 6, 'Mg+2': 8, 'Fe+2': 6, 'Al+3': 9, 'HCO3-': 4, 'CO3-2': 4.5, 'OH-': 3.5, 'H3SiO4-': 4, 'H2SiO4-2': 4, 'Cl-': 3, 'SO4-2': 4 },
};

const analytic = (a, T) => a[0] + a[1] * T + a[2] / T + a[3] * Math.log10(T) + a[4] / (T * T);

/**
 * log K at temperature tC (°C): the tabulated 25 °C value plus the change given
 * by the fitted temperature function (so 25 °C is exactly the tabulated value).
 */
export function logKAt(entry, tC) {
  const T = tC + 273.15;
  if (entry.an) return entry.lk + analytic(entry.an, T) - analytic(entry.an, T0);
  if (entry.dH !== undefined) return entry.lk - (entry.dH / (R * LN10)) * (1 / T - 1 / T0);
  return entry.lk;
}
export const analyticAt = analytic;

// ---------------------------------------------------------------- stoichiometry
const ION = { K: 'K+', Na: 'Na+', Ca: 'Ca+2', Mg: 'Mg+2', Al: 'Al+3', Si: 'H4SiO4', C: 'HCO3-' };

/** Balanced dissolution reaction of a phase: { species: [...], nu: {species: number} } with nu > 0 for products. */
export function dissolution(id) {
  const p = PHASES[id];
  if (!p) throw new Error(`unknown phase ${id}`);
  if (p._diss) return p._diss;
  const el = parse(p.f).el;
  const ions = [];
  for (const e of ['K', 'Na', 'Ca', 'Mg', 'Fe', 'Al', 'Si', 'C']) {
    if (!el[e]) continue;
    ions.push(e === 'Fe' ? (p.ferric ? 'Fe+3' : 'Fe+2') : ION[e]);
  }
  const species = [p.f, 'H+', ...ions, 'H2O'];
  const q = balanceQ(species);
  const nu = {};
  species.forEach((s, i) => { if (i > 0) nu[s] = -Number(q[i]); });
  // phase coefficient is +1 on the left; products positive.
  p._diss = { species, nu };
  return p._diss;
}

/** Number of H+ consumed by dissolving one formula unit. */
export const protons = (id) => -(dissolution(id).nu['H+'] ?? 0);

export function logK(id, tC, ds = 'llnl') {
  if (ds === 'llnl') return logKAt(PHASES[id], tC);
  const d = ds === 'rh' ? RH_K[id] : PQ_K[id];
  if (!d) return NaN;
  return logKAt(d, tC);
}

export const aqK = (k, tC) => logKAt(AQ[k], tC);

/** Debye-Hückel parameters at tC by linear interpolation in the llnl.dat table. */
export function dhParams(tC) {
  const t = DH.t;
  let i = 0;
  while (i < t.length - 2 && tC > t[i + 1]) i++;
  const f = (tC - t[i]) / (t[i + 1] - t[i]);
  const lerp = (arr) => arr[i] + f * (arr[i + 1] - arr[i]);
  return { A: lerp(DH.A), B: lerp(DH.B), bdot: lerp(DH.bdot) };
}

// ---------------------------------------------------------------- Robie & Hemingway (1995)
// Standard properties at 298.15 K, 1 bar: [ΔfH°, ΔfG°, uncertainty of ΔfG°] in kJ/mol.
// null: uncertainty not given in the summary table.
export const RH = {
  'H2O': [-285.8, -237.1, 0.1],
  'H+': [0, 0, 0],
  'Al+3': [-538.4, -489.4, 1.4],
  'K+': [-252.1, -282.5, 0.1],
  'Na+': [-240.3, -261.5, 0.1],
  'Ca+2': [-543.0, -553.6, null],
  'Mg+2': [-467.0, -455.4, 0.6],
  'Fe+2': [-91.1, -90.0, 2.0],
  'Fe+3': [-49.9, -16.7, 2.0],
  'H4SiO4': [-1460.0, -1307.5, 2.1],
  'K-feldspar': [-3974.6, -3749.3, 3.9], // microcline
  albite: [-3935.0, -3711.6, 2.6],
  anorthite: [-4234.0, -4007.9, 2.0],
  muscovite: [-5974.8, -5598.8, 4.9], // Al/Si disordered
  phlogopite: [-6226.0, -5846.0, 6.0], // Al/Si disordered
  annite: [-5149.3, -4798.3, 4.0],
  kaolinite: [-4119.0, -3797.5, 1.5],
  gibbsite: [-1293.1, -1154.9, 1.2],
  forsterite: [-2173.0, -2053.6, 2.0],
  fayalite: [-1478.2, -1379.1, null],
  enstatite: [-1545.6, -1458.3, 1.6],
  diopside: [-3201.5, -3026.8, 2.0],
  tremolite: [-12303.0, -11574.6, 7.0],
  chrysotile: [-4360.0, -4032.4, 3.1],
  talc: [-5900.0, -5520.2, 2.1],
  brucite: [-924.5, -833.5, 0.4],
  quartz: [-910.7, -856.3, 1.0],
  'SiO2(am)': [-901.6, -849.3, 2.1], // silica glass, the closest R&H entry
  goethite: [-562.6, -491.8, 2.1],
};

// Molar volumes at 298.15 K (cm3/mol), Robie & Hemingway (1995).
export const VOLUME = {
  'K-feldspar': 108.72, albite: 100.07, anorthite: 100.79, muscovite: 140.81, phlogopite: 149.65,
  annite: 154.30, kaolinite: 99.34, gibbsite: 31.96, forsterite: 43.65, fayalite: 46.31,
  enstatite: 31.31, diopside: 66.09, tremolite: 272.90, chrysotile: 107.50, talc: 136.20, quartz: 22.69,
};

/** log K, its 1-sigma uncertainty and ΔrH from Robie & Hemingway, for the dissolution reaction of a phase. */
export function rhReaction(id) {
  const { species, nu } = dissolution(id);
  const all = { [species[0]]: -1, ...nu };
  let G = 0, H = 0, var2 = 0, missing = [];
  for (const [s, v] of Object.entries(all)) {
    const key = s === species[0] ? id : s;
    const d = RH[key];
    if (!d) return null;
    H += v * d[0];
    G += v * d[1];
    if (d[2] === null) missing.push(key); else var2 += (v * d[2]) ** 2;
  }
  const k = 1 / (R * T0 * LN10);
  return { lk: -G * k, dH: H, sigma: Math.sqrt(var2) * k, missing };
}

const RH_K = {};
for (const id of Object.keys(RH)) if (PHASES[id]) {
  const r = rhReaction(id);
  if (r) RH_K[id] = { lk: r.lk, dH: r.dH, sigma: r.sigma, missing: r.missing };
}
export { RH_K };

// ---------------------------------------------------------------- phreeqc.dat
// As written in phreeqc.dat (kcal converted to kJ), then rewritten in our
// convention: alum = number of Al(OH)4- in the file's reaction, which we turn
// into Al+3 with  Al+3 + 4 H2O = Al(OH)4- + 4 H+  (log K -22.7, ΔH 42.3 kcal).
// scale: the file's formula unit relative to ours (sepiolite is written per half).
const KCAL = 4.184;
const PQ_RAW = {
  'K-feldspar': { lk: -20.573, dH: 30.82, alum: 1 },
  albite: { lk: -18.002, dH: 25.896, alum: 1 },
  anorthite: { lk: -19.714, dH: 11.58, alum: 2 },
  muscovite: { lk: 12.703, dH: -59.376 }, // K-mica
  kaolinite: { lk: 7.435, dH: -35.3 },
  gibbsite: { lk: 8.11, dH: -22.8 },
  'beidellite-Ca': { lk: -45.027, dH: 58.373, alum: 2.33 }, // Ca-Montmorillonite, same formula
  chrysotile: { lk: 32.2, an: [13.248, 0, 10217.1, -6.1894, 0] },
  talc: { lk: 21.399, dH: -46.352 },
  sepiolite: { lk: 15.76, dH: -10.7, scale: 2 },
  quartz: { lk: -3.98, an: [0.41, 0, -1309, 0, 0] },
  chalcedony: { lk: -3.55, an: [-0.09, 0, -1032, 0, 0] },
  'SiO2(am)': { lk: -2.71, an: [-0.26, 0, -731, 0, 0] },
  goethite: { lk: -1, dH: -14.48 },
};
export const PQ_ALUMINATE = { lk: -22.7, dH: 42.3 };
const PQ_K = {};
for (const [id, r] of Object.entries(PQ_RAW)) {
  const s = r.scale ?? 1;
  const n = r.alum ?? 0;
  const e = { lk: s * (r.lk - n * PQ_ALUMINATE.lk) };
  if (r.an) e.an = r.an.map((x) => s * x); // no aluminate conversion needed for these
  else e.dH = s * (r.dH - n * PQ_ALUMINATE.dH) * KCAL;
  PQ_K[id] = e;
}
export { PQ_K, PQ_RAW };
