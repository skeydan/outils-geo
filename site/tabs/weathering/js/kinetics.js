// Dissolution rates far from equilibrium, from the compilation of Palandri &
// Kharaka (2004), USGS Open-File Report 2004-1068:
//   rate = k_acid e^(-Ea/R (1/T - 1/298.15)) a(H+)^n_acid
//        + k_neutral e^(-En/R (...))
//        + k_base e^(-Eb/R (...)) a(H+)^n_base          [mol m^-2 s^-1]
// k at 25 °C (log10), E in kJ/mol, n the reaction order on H+ (negative for the
// basic mechanism). Laboratory rates on fresh surfaces: field rates are
// commonly two to four orders of magnitude slower (White & Brantley, 2003).

import { VOLUME } from './thermo.js';

const R = 8.31446e-3;
const T0 = 298.15;

// [log k, E, n] per mechanism; table numbers in Palandri & Kharaka (2004).
export const RATES = {
  'K-feldspar': { acid: [-10.06, 51.7, 0.5], neutral: [-12.41, 38.0], base: [-21.20, 94.1, -0.823], table: 15 },
  albite: { acid: [-10.16, 65.0, 0.457], neutral: [-12.56, 69.8], base: [-15.60, 71.0, -0.572], table: 13 },
  anorthite: { acid: [-3.50, 16.6, 1.411], neutral: [-9.12, 17.8], table: 13 },
  biotite: { acid: [-9.84, 22.0, 0.525], neutral: [-12.55, 22.0], table: 28 },
  muscovite: { acid: [-11.85, 22.0, 0.37], neutral: [-13.55, 22.0], base: [-14.55, 22.0, -0.22], table: 28 },
  forsterite: { acid: [-6.85, 67.2, 0.47], neutral: [-10.64, 79.0], table: 23 },
  fayalite: { acid: [-4.80, 94.4, 1.0], neutral: [-12.80, 94.4], table: 23 },
  enstatite: { acid: [-9.02, 80.0, 0.6], neutral: [-12.72, 80.0], table: 26 },
  diopside: { acid: [-6.36, 96.1, 0.71], neutral: [-11.11, 40.6], table: 26 },
  tremolite: { acid: [-8.40, 18.9, 0.7], neutral: [-10.60, 94.4], table: 27 },
  quartz: { neutral: [-13.99, 87.7], base: [-16.29, 108.366, -0.5], table: 4 },
  kaolinite: { acid: [-11.31, 65.9, 0.777], neutral: [-13.18, 22.2], base: [-17.05, 17.9, -0.472], table: 29 },
  gibbsite: { acid: [-7.65, 47.5, 0.992], neutral: [-11.50, 61.2], base: [-16.65, 80.1, -0.784], table: 32 },
};

/** Rate in mol m^-2 s^-1 and the share of each mechanism. */
export function rate(key, pH, tC) {
  const p = RATES[key];
  if (!p) return null;
  const T = tC + 273.15;
  const arr = (E) => Math.exp((-E / R) * (1 / T - 1 / T0));
  const aH = 10 ** -pH;
  const parts = {};
  if (p.acid) parts.acid = 10 ** p.acid[0] * arr(p.acid[1]) * aH ** p.acid[2];
  if (p.neutral) parts.neutral = 10 ** p.neutral[0] * arr(p.neutral[1]);
  if (p.base) parts.base = 10 ** p.base[0] * arr(p.base[1]) * aH ** p.base[2];
  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  return { total, parts };
}

const YEAR = 365.25 * 24 * 3600;

/**
 * Shrinking sphere: a grain of diameter d loses volume at rate r per unit
 * area, so its diameter shrinks by 2 Vm r per second and it is gone after
 * t = d / (2 Vm r). (Our own geometric step; Vm from Robie & Hemingway.)
 * d in mm, volumeKey a key of VOLUME. Returns years.
 */
export function lifetimeYears(key, volumeKey, pH, tC, dmm = 1) {
  const r = rate(key, pH, tC);
  const vm = VOLUME[volumeKey] * 1e-6; // m3/mol
  if (!r || !vm) return NaN;
  return (dmm / 1000) / (2 * vm * r.total) / YEAR;
}

/** Fraction of a grain's mass dissolved after `years` (same model). */
export function fractionDissolved(key, volumeKey, pH, tC, dmm, years) {
  const life = lifetimeYears(key, volumeKey, pH, tC, dmm);
  if (!Number.isFinite(life)) return NaN;
  const left = Math.max(0, 1 - years / life);
  return 1 - left ** 3;
}
