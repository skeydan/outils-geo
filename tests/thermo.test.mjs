// Equilibrium constants: copied values, temperature functions, the two
// comparison data sets, and checks against independent published numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHASES, AQ, logK, analyticAt, dissolution, RH_K, PQ_K, rhReaction, T0, protons } from '../site/tabs/weathering/js/thermo.js';
import { molToMg } from '../site/tabs/weathering/js/water.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('25 °C values are the tabulated ones; fitted functions agree within 0.35', () => {
  for (const [id, p] of Object.entries(PHASES)) {
    near(logK(id, 25), p.lk, 1e-12, id);
    near(analyticAt(p.an, T0), p.lk, 0.35, `${id} analytic`);
  }
  for (const [k, a] of Object.entries(AQ)) if (a.an) near(analyticAt(a.an, T0), a.lk, 0.05, k);
});

test('dissolution reactions use H+, free ions, Al+3 and H4SiO4', () => {
  assert.deepEqual(dissolution('K-feldspar').nu, { 'H+': -4, 'K+': 1, 'Al+3': 1, H4SiO4: 3, H2O: -4 });
  assert.equal(protons('kaolinite'), 6);
  assert.equal(protons('quartz'), 0);
  assert.equal(protons('beidellite-Ca'), 7.32);
  assert.equal(dissolution('goethite').nu['Fe+3'], 1);
});

test('silica solubility agrees with Hem (1985): quartz 6.0 mg/L, amorphous 115 mg/L at 25 °C', () => {
  near(molToMg(10 ** logK('quartz', 25), 'SiO2'), 6.0, 0.1, 'quartz');
  near(molToMg(10 ** logK('SiO2(am)', 25), 'SiO2'), 115, 2, 'amorphous');
  // solubility rises with temperature (Hem: 26 mg/L at 84 °C for quartz)
  assert.ok(logK('quartz', 40) > logK('quartz', 25) && logK('quartz', 25) > logK('quartz', 5));
});

test('Robie & Hemingway log K computed from their Gibbs energies', () => {
  // quartz: dG = -1307.5 - (-856.3 + 2 x -237.1) = 23.0 kJ -> log K = -4.03
  near(RH_K.quartz.lk, -23.0 / (8.31446e-3 * T0 * Math.LN10), 1e-9, 'quartz');
  // kaolinite: 2(-489.4) + 2(-1307.5) + (-237.1) - (-3797.5) = -33.4 kJ -> 5.85
  near(RH_K.kaolinite.lk, 5.851, 0.005, 'kaolinite');
  const r = rhReaction('kaolinite');
  assert.ok(r.sigma > 0.5 && r.sigma < 1.2, `sigma ${r.sigma}`);
  assert.deepEqual(rhReaction('anorthite').missing, ['Ca+2']); // not given in the summary table
});

test('phreeqc.dat constants rewritten with Al+3', () => {
  // K-feldspar + 8 H2O = K+ + Al(OH)4- + 3 H4SiO4 (-20.573) plus Al(OH)4- + 4 H+ = Al+3 + 4 H2O (+22.7)
  near(PQ_K['K-feldspar'].lk, 2.127, 1e-9, 'K-feldspar');
  near(PQ_K['beidellite-Ca'].lk, -45.027 + 2.33 * 22.7, 1e-9, 'Ca-montmorillonite');
  near(PQ_K.sepiolite.lk, 31.52, 1e-9, 'sepiolite per Mg4 formula');
  near(logK('quartz', 25, 'pq'), -3.98, 0.01, 'quartz analytic');
});

test('the three data sets disagree most on feldspars and clays', () => {
  const spread = (id) => { const v = [logK(id, 25), logK(id, 25, 'rh'), logK(id, 25, 'pq')].filter(Number.isFinite); return Math.max(...v) - Math.min(...v); };
  assert.ok(spread('quartz') < 0.1);
  assert.ok(spread('K-feldspar') > 2);
  assert.ok(spread('kaolinite') > 1);
});
