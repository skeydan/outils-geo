// A small aqueous model: free ions, silicic acid, carbonate, B-dot activity
// coefficients (the activity model of llnl.dat in PHREEQC). No complexes: in
// the dilute waters of weathering (well under 0.01 mol/kg) ion pairs such as
// CaHCO3+ hold only a few percent of the total.
//
// Inputs are totals in mol per kg of water. Either the pH is given, or the
// water is open to a gas with a given CO2 pressure and the pH follows from the
// charge balance (cations released by weathering are balanced by HCO3-).

import { aqK, dhParams, DH, dissolution, logK, PHASES } from './thermo.js';

export const CATIONS = ['K+', 'Na+', 'Ca+2', 'Mg+2'];
const Z = { 'H+': 1, 'K+': 1, 'Na+': 1, 'Ca+2': 2, 'Mg+2': 2, 'Fe+2': 2, 'OH-': -1, 'HCO3-': -1, 'CO3-2': -2, 'H3SiO4-': -1, 'H2SiO4-2': -2, 'Cl-': -1, 'SO4-2': -2 };

export function logGamma(sp, I, dh) {
  const z = Z[sp];
  if (!z) return 0;
  const a = DH.size[sp] ?? 4;
  const s = Math.sqrt(I);
  return (-dh.A * z * z * s) / (1 + a * dh.B * s) + dh.bdot * I;
}

/**
 * Speciate a water.
 * tot: { K, Na, Ca, Mg, Si, Cl, SO4 } in mol/kgw (missing = 0)
 * opts: { tC, pH } or { tC, logPCO2 }
 * Returns { pH, I, m: {species: molality}, la: {species: log activity}, ok }.
 */
export function speciate(tot, opts) {
  const tC = opts.tC ?? 25;
  const dh = dhParams(tC);
  const kw = aqK('OH', tC), k1 = aqK('H3SiO4', tC), k2 = aqK('H2SiO4', tC);
  const kco2 = aqK('CO2g', tC), kco3 = aqK('CO3', tC);
  const T = { K: 0, Na: 0, Ca: 0, Mg: 0, Si: 0, Cl: 0, SO4: 0, ...tot };
  const open = Number.isFinite(opts.logPCO2);
  let I = 0.5 * (T.K + T.Na + 4 * T.Ca + 4 * T.Mg + T.Cl + 4 * T.SO4) + 1e-7;

  const at = (laH, I) => {
    const g = (sp) => logGamma(sp, I, dh);
    const m = { 'K+': T.K, 'Na+': T.Na, 'Ca+2': T.Ca, 'Mg+2': T.Mg, 'Cl-': T.Cl, 'SO4-2': T.SO4 };
    m['H+'] = 10 ** (laH - g('H+'));
    m['OH-'] = 10 ** (kw - laH - g('OH-'));
    // silica: H4SiO4 (neutral, gamma 1), H3SiO4-, H2SiO4-2
    const r1 = 10 ** (k1 - laH - g('H3SiO4-'));
    const r2 = 10 ** (k2 - 2 * laH - g('H2SiO4-2'));
    const h4 = T.Si / (1 + r1 + r2);
    m.H4SiO4 = h4; m['H3SiO4-'] = h4 * r1; m['H2SiO4-2'] = h4 * r2;
    if (open) {
      const laHCO3 = kco2 + opts.logPCO2 - laH;
      m['HCO3-'] = 10 ** (laHCO3 - g('HCO3-'));
      m['CO3-2'] = 10 ** (kco3 + laHCO3 - laH - g('CO3-2'));
    } else { m['HCO3-'] = T.HCO3 ?? 0; m['CO3-2'] = 0; }
    return m;
  };
  const charge = (m) => Object.entries(m).reduce((s, [sp, v]) => s + (Z[sp] ?? 0) * v, 0);

  let laH = open ? -7 : -opts.pH;
  let m;
  for (let it = 0; it < 6; it++) {
    if (open) {
      let lo = -13, hi = -1; // log a(H+): charge is increasing in laH
      for (let k = 0; k < 44; k++) {
        const mid = (lo + hi) / 2;
        if (charge(at(mid, I)) > 0) hi = mid; else lo = mid;
      }
      laH = (lo + hi) / 2;
    }
    m = at(laH, I);
    const I2 = 0.5 * Object.entries(m).reduce((s, [sp, v]) => s + (Z[sp] ?? 0) ** 2 * v, 0);
    if (Math.abs(I2 - I) < 1e-10 + 1e-6 * I) { I = I2; break; }
    I = I2;
  }
  const la = {};
  for (const [sp, v] of Object.entries(m)) la[sp] = v > 0 ? Math.log10(v) + logGamma(sp, I, dh) : -Infinity;
  la['H+'] = laH;
  return { pH: -laH, I, m, la, tC };
}

/**
 * log a(Al+3) at equilibrium with an aluminium phase in a given water (la).
 * The phase that gives the lowest value is the stable one: any other would
 * dissolve and feed it.
 */
export function logAlEq(id, la, tC) {
  const { nu } = dissolution(id);
  let s = logK(id, tC);
  for (const [sp, v] of Object.entries(nu)) {
    if (sp === 'Al+3' || sp === 'H2O') continue;
    s -= v * (la[sp] ?? -Infinity);
  }
  return s / nu['Al+3'];
}

/** Saturation index log(IAP/K) of a phase without aluminium (or with a known log a(Al+3)). */
export function satIndex(id, la, tC, laAl) {
  const { nu } = dissolution(id);
  let iap = 0;
  for (const [sp, v] of Object.entries(nu)) {
    if (sp === 'H2O') continue;
    const a = sp === 'Al+3' ? laAl : la[sp];
    if (a === undefined || a === -Infinity) return v > 0 ? -Infinity : Infinity;
    iap += v * a;
  }
  return iap - logK(id, tC);
}

export const hasAl = (id) => (dissolution(id).nu['Al+3'] ?? 0) > 0;

// ---------------------------------------------------------------- units
export const MOLAR_MASS = { K: 39.098, Na: 22.990, Ca: 40.078, Mg: 24.305, SiO2: 60.084, Si: 28.086, HCO3: 61.017, Cl: 35.453, SO4: 96.06 };
/** mg/L (taken as mg/kg of water in dilute water) to mol/kg. */
export const mgToMol = (mg, key) => mg / 1000 / MOLAR_MASS[key];
export const molToMg = (mol, key) => mol * 1000 * MOLAR_MASS[key];

export const phaseFormula = (id) => PHASES[id].f;
