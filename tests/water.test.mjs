// Aqueous model and reaction path, against published numbers and balances.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speciate, mgToMol, logAlEq } from '../site/tabs/weathering/js/water.js';
import { stateAt, endOfPath, transitions, comp } from '../site/tabs/weathering/js/path.js';
import { logK } from '../site/tabs/weathering/js/thermo.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test('pure water under air: pH 5.65 at 25 °C and 5.60 at 0 °C (Hem 1985, p. 63)', () => {
  near(speciate({}, { tC: 25, logPCO2: -3.5 }).pH, 5.65, 0.03, '25 °C');
  near(speciate({}, { tC: 0, logPCO2: -3.5 }).pH, 5.60, 0.03, '0 °C');
});

test('charge balance holds in an open CO2 system', () => {
  const sp = speciate({ K: 1e-4, Si: 2e-4 }, { tC: 15, logPCO2: -2 });
  const Z = { 'H+': 1, 'K+': 1, 'OH-': -1, 'HCO3-': -1, 'CO3-2': -2, 'H3SiO4-': -1, 'H2SiO4-2': -2 };
  const q = Object.entries(Z).reduce((s, [k, z]) => s + z * (sp.m[k] ?? 0), 0);
  near(q, 0, 1e-12, 'charge');
  near(sp.m['HCO3-'], 1e-4 + sp.m['H+'], 2e-6, 'K+ is balanced by bicarbonate');
});

test('Sierra Nevada ephemeral spring water is in the kaolinite field (Feth et al. 1964, p. I2)', () => {
  const tot = { Si: mgToMol(16.4, 'SiO2'), K: mgToMol(1.09, 'K'), Na: mgToMol(3.03, 'Na'), Ca: mgToMol(3.11, 'Ca'), Mg: mgToMol(0.7, 'Mg'), HCO3: mgToMol(20, 'HCO3') };
  for (const tC of [5, 15, 25]) {
    const sp = speciate(tot, { tC, pH: 6.2 });
    const ids = ['gibbsite', 'kaolinite', 'muscovite', 'beidellite-Na', 'beidellite-Ca', 'beidellite-Mg', 'K-feldspar', 'albite', 'anorthite'];
    const best = ids.reduce((a, b) => (logAlEq(b, sp.la, tC) < logAlEq(a, sp.la, tC) ? b : a));
    assert.equal(best, 'kaolinite', `at ${tC} °C`);
  }
});

test('K-feldspar path: gibbsite, then kaolinite, then equilibrium with the feldspar', () => {
  const opts = { tC: 25, logPCO2: -2 };
  const seq = transitions('K-feldspar', opts).map((t) => t.assemblage.join('+'));
  assert.deepEqual(seq, ['gibbsite', 'gibbsite+kaolinite', 'kaolinite']);
  const end = endOfPath('K-feldspar', opts);
  near(stateAt('K-feldspar', end, opts).siPrimary, 0, 1e-6, 'saturated at the end');
  // On the gibbsite-kaolinite boundary the silica activity is fixed by the two minerals.
  const s = stateAt('K-feldspar', 10 ** -4.72, opts);
  assert.deepEqual(s.assemblage, ['gibbsite', 'kaolinite']);
  near(s.sp.la.H4SiO4, logK('kaolinite', 25) / 2 - logK('gibbsite', 25), 1e-4, 'boundary silica');
});

test('mass balance along the path', () => {
  for (const [id, xi] of [['K-feldspar', 3e-5], ['albite', 2e-3], ['phlogopite', 1e-4], ['annite', 1e-4]]) {
    const s = stateAt(id, xi, { tC: 15, logPCO2: -2 });
    const c = comp(id);
    let Al = 0, Si = s.sp.m.H4SiO4 + s.sp.m['H3SiO4-'] + s.sp.m['H2SiO4-2'];
    for (const [ph, m] of Object.entries(s.solids)) { const k = comp(ph); Al += k.Al * m; Si += k.Si * m; }
    near(Al, c.Al * xi, 1e-9 * xi + 1e-15, `${id} Al`);
    near(Si, c.Si * xi, 1e-6 * xi, `${id} Si`);
    if (c.Fe) near(s.solids.goethite, c.Fe * xi, 1e-15, `${id} Fe into goethite`);
  }
});

test('anorthite holds as much Si as Al, like kaolinite: the path stays on the gibbsite-kaolinite boundary', () => {
  const s = stateAt('anorthite', 1e-3, { tC: 25, logPCO2: -2 });
  assert.deepEqual(s.assemblage, ['gibbsite', 'kaolinite']);
});

test('quartz path ends at quartz solubility; forsterite dissolves completely', () => {
  near(Math.log10(endOfPath('quartz', { tC: 25, logPCO2: -2 })), logK('quartz', 25), 0.01, 'quartz');
  const s = stateAt('forsterite', 1e-4, { tC: 25, logPCO2: -2 });
  assert.deepEqual(s.assemblage, []);
  near(s.sp.m['Mg+2'], 2e-4, 1e-12, 'all Mg in the water');
  assert.ok(s.sp.pH > 6, 'pH rises');
});
