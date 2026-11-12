// Integrity of the crystal-systems data: counts, cross-references, sources.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FAMILIES, SYSTEMS, CLASSES, BRAVAIS, CENTRING, FORMS, MINERALS, CONFUSIONS, FIXES,
} from '../site/tabs/crystals/js/data.js';
import { SOURCES } from '../site/tabs/crystals/js/sources.js';

const SRC = new Set(SOURCES.map((s) => s.id));
const SYS = new Map(SYSTEMS.map((s) => [s.id, s]));
const MIN = new Map(MINERALS.map((m) => [m.id, m]));
const FAM = new Map(FAMILIES.map((f) => [f.id, f]));

test('crystals: the canonical counts', () => {
  assert.equal(FAMILIES.length, 6);
  assert.equal(SYSTEMS.length, 7);
  assert.equal(CLASSES.length, 32);
  assert.equal(BRAVAIS.length, 14);
  assert.equal(FORMS.length, 4);
  assert.equal(MINERALS.length, 28);
});

test('crystals: families group the systems and their counts add up', () => {
  const covered = FAMILIES.flatMap((f) => f.systems);
  assert.deepEqual([...covered].sort(), SYSTEMS.map((s) => s.id).sort());
  assert.equal(new Set(covered).size, covered.length);
  assert.equal(FAMILIES.reduce((n, f) => n + f.classes, 0), 32);
  assert.equal(FAMILIES.reduce((n, f) => n + f.space, 0), 230);
  assert.equal(FAMILIES.reduce((n, f) => n + f.lattices, 0), 14);
  for (const f of FAMILIES) {
    const members = f.systems.map((id) => SYS.get(id));
    assert.equal(f.classes, members.reduce((n, s) => n + s.classes.length, 0), f.id);
    assert.equal(f.space, members.reduce((n, s) => n + s.space, 0), f.id);
    assert.ok(f.en && f.fr, f.id);
  }
});

test('crystals: the seven systems are complete and bilingual', () => {
  const expected = ['triclinic', 'monoclinic', 'orthorhombic', 'tetragonal', 'trigonal', 'hexagonal', 'cubic'];
  assert.deepEqual(SYSTEMS.map((s) => s.id), expected);
  const classes = [2, 3, 3, 7, 5, 7, 5];
  const space = [2, 13, 59, 68, 25, 27, 36];
  SYSTEMS.forEach((s, i) => {
    assert.ok(s.en && s.fr, s.id);
    assert.ok(FAM.has(s.family), s.id);
    assert.equal(s.classes.length, classes[i], s.id);
    assert.equal(s.space, space[i], s.id);
    assert.ok(s.constraints.en && s.constraints.fr, s.id);
    assert.ok(s.symmetry.en && s.symmetry.fr, s.id);
    assert.ok(s.look.en && s.look.fr, s.id);
    for (const k of ['a', 'b', 'c', 'alpha', 'beta', 'gamma']) {
      assert.ok(Number.isFinite(s.cell[k]), `${s.id}.cell.${k}`);
    }
    for (const id of s.classes) {
      assert.ok(CLASSES.some((c) => c.sys === s.id && c.id === id), `${s.id}:${id}`);
    }
    for (const id of s.examples) {
      assert.ok(MIN.has(id), `${s.id} example ${id}`);
      assert.equal(MIN.get(id).sys, s.id, `${id} should belong to ${s.id}`);
    }
    for (const l of s.lattices) assert.ok(l, s.id);
  });
  assert.equal(SYSTEMS.reduce((n, s) => n + s.classes.length, 0), 32);
  assert.equal(SYSTEMS.reduce((n, s) => n + s.space, 0), 230);
});

test('crystals: each of the 32 classes is unique, bilingual and placed', () => {
  const keys = CLASSES.map((c) => `${c.sys}:${c.id}`);
  assert.equal(new Set(keys).size, keys.length);
  for (const c of CLASSES) {
    assert.ok(SYS.has(c.sys), c.id);
    assert.ok(c.hm && c.schoen, c.id);
    assert.ok(c.en && c.fr, c.id);
    assert.ok(c.what.en && c.what.fr, c.id);
  }
  for (const s of SYSTEMS) {
    assert.equal(CLASSES.filter((c) => c.sys === s.id).length, s.classes.length, s.id);
  }
});

test('crystals: the 14 Bravais lattices and their examples', () => {
  const ids = BRAVAIS.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
  const perSys = new Map();
  for (const b of BRAVAIS) {
    assert.ok(SYS.has(b.sys), b.id);
    assert.ok(CENTRING[b.centring], b.id);
    assert.equal(b.id[1], b.centring, b.id);
    assert.ok(b.symbol, b.id);
    if (b.example) {
      assert.ok(MIN.has(b.example), b.id);
      assert.equal(MIN.get(b.example).sys, b.sys, b.id);
    }
    perSys.set(b.sys, (perSys.get(b.sys) ?? 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(perSys), {
    triclinic: 1, monoclinic: 2, orthorhombic: 4, tetragonal: 2, trigonal: 1, hexagonal: 1, cubic: 3,
  });
  assert.equal(BRAVAIS.filter((b) => !b.example).length, 4);
});

test('crystals: minerals are consistent and every one is an example', () => {
  const ids = MINERALS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const m of MINERALS) {
    assert.ok(SYS.has(m.sys), m.id);
    assert.ok(m.en && m.fr, m.id);
    assert.ok(m.formula, m.id);
    assert.ok(m.forms.en && m.forms.fr, m.id);
    assert.ok(m.cleavage.en && m.cleavage.fr, m.id);
    assert.ok(SRC.has(m.src), `${m.id} source ${m.src}`);
    const sys = SYS.get(m.sys);
    assert.ok(sys.examples.includes(m.id), `${m.id} missing from ${m.sys}.examples`);
    assert.ok(sys.classes.some((id) => CLASSES.some((c) => c.sys === m.sys && c.id === id && c.hm === m.cls)), `${m.id}: class ${m.cls}`);
  }
});

test('crystals: forms, confusions and fixes cite known sources', () => {
  for (const f of FORMS) {
    assert.ok(f.en && f.fr, f.id);
    assert.ok(f.index && f.body.en && f.body.fr, f.id);
  }
  for (const c of CONFUSIONS) {
    assert.ok(c.en && c.fr && c.body.en && c.body.fr);
    assert.ok(c.src.length, c.en);
    for (const id of c.src) assert.ok(SRC.has(id), id);
  }
  for (const f of FIXES) {
    assert.ok(f.what.en && f.what.fr && f.how.en && f.how.fr);
    assert.ok(f.src.length);
    for (const id of f.src) assert.ok(SRC.has(id), id);
  }
});

test('crystals: source ids are unique and have full URLs', () => {
  const ids = SOURCES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SOURCES) {
    assert.match(s.url, /^https:\/\//, s.id);
    assert.ok(s.text.length > 20, s.id);
  }
});
