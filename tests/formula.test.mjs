// Formula parsing and reaction balancing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, reaction, balanceQ, plain, Q } from '../site/tabs/weathering/js/formula.js';
import { MINERALS } from '../site/tabs/weathering/js/minerals.js';

const els = (f) => Object.fromEntries(Object.entries(parse(f).el).map(([k, v]) => [k, Number(v)]));
const coefs = (sp) => { const r = reaction(sp); return Object.fromEntries([...r.left.map((t) => [t.f, Number(t.c)]), ...r.right.map((t) => [t.f, -Number(t.c)])]); };

test('parse: groups, decimals, hydrates, charges', () => {
  assert.deepEqual(els('Al2Si2O5(OH)4'), { Al: 2, Si: 2, O: 9, H: 4 });
  assert.deepEqual(els('Na0.33Al2.33Si3.67O10(OH)2'), { Na: 0.33, Al: 2.33, Si: 3.67, O: 12, H: 2 });
  assert.deepEqual(els('Mg4Si6O15(OH)2:6H2O'), { Mg: 4, Si: 6, O: 23, H: 14 });
  assert.equal(Number(parse('Ca+2').charge), 2);
  assert.equal(Number(parse('CO3-2').charge), -2);
  assert.equal(Number(parse('Al(OH)4-').charge), -1);
  assert.equal(Number(parse('K+').charge), 1);
  assert.deepEqual(els('SiO2(am)'), { Si: 1, O: 2 });
  assert.equal(plain('Ca+2'), 'Ca²⁺');
  assert.equal(plain('Al2Si2O5(OH)4'), 'Al₂Si₂O₅(OH)₄');
});

test('exact fractions', () => {
  assert.ok(Q.of('0.165').eq(new Q(33n, 200n)));
  assert.ok(Q.of('2.33').mul(3).eq(Q.of('6.99')));
});

test('textbook weathering reactions come out with their usual coefficients', () => {
  // K-feldspar to kaolinite: 2 KAlSi3O8 + 2 H+ + 9 H2O -> kaolinite + 2 K+ + 4 H4SiO4
  assert.deepEqual(coefs(['KAlSi3O8', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'K+', 'H4SiO4']), { KAlSi3O8: 2, 'H+': 2, H2O: 9, 'Al2Si2O5(OH)4': -1, 'K+': -2, H4SiO4: -4 });
  // K-feldspar to muscovite: 3 KAlSi3O8 + 2 H+ + 12 H2O -> muscovite + 2 K+ + 6 H4SiO4
  assert.deepEqual(coefs(['KAlSi3O8', 'H+', 'H2O', 'KAl3Si3O10(OH)2', 'K+', 'H4SiO4']), { KAlSi3O8: 3, 'H+': 2, H2O: 12, 'KAl3Si3O10(OH)2': -1, 'K+': -2, H4SiO4: -6 });
  // anorthite to kaolinite releases no silica
  assert.deepEqual(coefs(['CaAl2Si2O8', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'Ca+2']), { CaAl2Si2O8: 1, 'H+': 2, H2O: 1, 'Al2Si2O5(OH)4': -1, 'Ca+2': -1 });
  // desilication of kaolinite
  assert.deepEqual(coefs(['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4']), { 'Al2Si2O5(OH)4': 1, H2O: 5, 'Al(OH)3': -2, H4SiO4: -2 });
  // fayalite oxidation: 2 Fe2SiO4 + O2 + 6 H2O -> 4 FeOOH + 2 H4SiO4
  assert.deepEqual(coefs(['Fe2SiO4', 'O2', 'H2O', 'FeOOH', 'H4SiO4']), { Fe2SiO4: 2, O2: 1, H2O: 6, FeOOH: -4, H4SiO4: -2 });
  // Fe2+ oxidation makes acid
  assert.deepEqual(coefs(['Fe+2', 'O2', 'H2O', 'FeOOH', 'H+']), { 'Fe+2': 4, O2: 1, H2O: 6, FeOOH: -4, 'H+': -8 });
});

test('decimal formulas are normalised to short exact coefficients', () => {
  const r = reaction(['NaAlSi3O8', 'H+', 'H2O', 'Na0.33Al2.33Si3.67O10(OH)2', 'Na+', 'H4SiO4']);
  assert.equal(r.integer, false);
  const c = Object.fromEntries([...r.left, ...r.right].map((t) => [t.f, Number(t.c)]));
  assert.equal(c.NaAlSi3O8, 2.33);
  assert.equal(c['H+'], 2);
  assert.equal(c['Na+'], 2);
  assert.ok(r.check.ok);
});

test('every step on the page balances in atoms and charge, uniquely', () => {
  let n = 0;
  for (const m of MINERALS) for (const s of m.steps) {
    const r = reaction(s.species);
    assert.ok(r.check.ok, `${m.id}: ${s.species.join(' ')}`);
    assert.ok(r.left.length && r.right.length, `${m.id}: two sides`);
    n++;
  }
  assert.ok(n >= 30);
});

test('impossible or ambiguous reactions are refused', () => {
  assert.throws(() => balanceQ(['KAlSi3O8', 'Al2Si2O5(OH)4']));
  assert.throws(() => balanceQ(['SiO2', 'H2O', 'H4SiO4', 'H2O2', 'O2']));
});
