// Stability diagrams and dissolution rates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fields, boundaries, stableAt, SYSTEMS, boundarySigmaRH } from '../site/tabs/weathering/js/diagram.js';
import { logK, RH, R, T0 } from '../site/tabs/weathering/js/thermo.js';
import { rate, lifetimeYears, fractionDissolved, RATES } from '../site/tabs/weathering/js/kinetics.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const area = (p) => Math.abs(p.reduce((s, [x1, y1], i) => { const [x2, y2] = p[(i + 1) % p.length]; return s + x1 * y2 - x2 * y1; }, 0) / 2);

test('fields tile the diagram with no gap or overlap', () => {
  for (const key of Object.keys(SYSTEMS)) for (const ds of ['llnl', 'rh', 'pq']) for (const tC of [0, 25, 40]) {
    const s = SYSTEMS[key];
    const total = fields(key, tC, ds).reduce((a, f) => a + area(f.poly), 0);
    near(total, (s.x[1] - s.x[0]) * (s.y[1] - s.y[0]), 1e-6, `${key} ${ds} ${tC}`);
  }
});

test('boundaries agree with the hand-written equilibria', () => {
  const b = Object.fromEntries(boundaries('K', 25).map((x) => [`${x.a}/${x.b}`, x.line]));
  // 2 Al(OH)3 + 2 H4SiO4 = kaolinite + 5 H2O  ->  log a(H4SiO4) = log K_kaol / 2 - log K_gibbsite
  near(b['gibbsite/kaolinite'].x, logK('kaolinite', 25) / 2 - logK('gibbsite', 25), 1e-9, 'gibbsite/kaolinite');
  // 3 kaolinite + 2 K+ = 2 muscovite + 2 H+ + 3 H2O  ->  log(aK/aH) = (2 log K_musc - 3 log K_kaol) / 2
  near(b['kaolinite/muscovite'].icept, (2 * logK('muscovite', 25) - 3 * logK('kaolinite', 25)) / 2, 1e-9, 'kaolinite/muscovite');
  near(b['kaolinite/muscovite'].slope, 0, 1e-12, 'horizontal');
  // kaolinite + 4 H4SiO4 + 2 K+ = 2 K-feldspar + 2 H+ + 9 H2O: slope -2
  near(b['kaolinite/K-feldspar'].slope, -2, 1e-12, 'slope');
  assert.equal(stableAt('K', -4, 2, 25), 'kaolinite');
  assert.equal(stableAt('K', -5.5, 0, 25), 'gibbsite');
  assert.equal(stableAt('Mg', -5, 6, 25), 'solution');
});

test('gibbsite-kaolinite boundary lies near the 10^-4.7 M limit of Pedro, between the data sets', () => {
  const x = (ds) => boundaries('K', 25, ds).find((b) => b.a === 'gibbsite' && b.b === 'kaolinite').line.x;
  const xs = ['llnl', 'rh', 'pq'].map(x);
  assert.ok(Math.min(...xs) < -4.7 && Math.max(...xs) > -4.7, xs.join(' '));
  const s = boundarySigmaRH('K', 'gibbsite', 'kaolinite', RH, R, T0);
  assert.ok(s > 0.3 && s < 1.5, `sigma ${s}`);
});

test('rates: Palandri & Kharaka parameters at pH 0 and 25 °C, Arrhenius, mechanisms', () => {
  const r0 = rate('albite', 0, 25);
  near(Math.log10(r0.parts.acid), -10.16, 1e-9, 'albite acid k');
  near(Math.log10(r0.parts.neutral), -12.56, 1e-9, 'albite neutral k');
  // neutral mechanism of quartz: E 87.7 kJ/mol, about 3.3 times faster from 25 to 35 °C
  near(rate('quartz', 7, 35).parts.neutral / rate('quartz', 7, 25).parts.neutral, Math.exp((87.7 / R) * (1 / T0 - 1 / 308.15)), 1e-9, 'Arrhenius');
  assert.ok(rate('K-feldspar', 3, 25).parts.acid > rate('K-feldspar', 3, 25).parts.neutral);
  for (const k of Object.keys(RATES)) assert.ok(rate(k, 5, 25).total > 0, k);
});

test('grain lifetimes: shrinking sphere, and the broad Goldich order', () => {
  const life = (k, v) => lifetimeYears(k, v, 5, 25, 1);
  // t = d / (2 Vm r)
  const r = rate('K-feldspar', 5, 25).total;
  near(life('K-feldspar', 'K-feldspar'), 1e-3 / (2 * 108.72e-6 * r) / (365.25 * 86400), 1e-6, 'formula');
  assert.ok(life('forsterite', 'forsterite') < life('albite', 'albite'));
  assert.ok(life('anorthite', 'anorthite') < life('albite', 'albite'));
  assert.ok(life('albite', 'albite') < life('muscovite', 'muscovite'));
  assert.ok(life('muscovite', 'muscovite') < life('quartz', 'quartz'));
  assert.ok(life('quartz', 'quartz') > 1e7);
  near(fractionDissolved('albite', 'albite', 5, 25, 1, 0), 0, 1e-12, 'nothing at t=0');
  near(fractionDissolved('albite', 'albite', 5, 25, 1, 1e12), 1, 1e-12, 'all after long');
});
