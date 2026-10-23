// The rock key: structure (the mistakes of the hand-drawn source key cannot
// come back), paths, material and credits.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { KEY, ROCKS, TESTS, FAMILIES } from '../site/tabs/rocks/js/data.js';
import { SOURCES, COMPARED, FIXES } from '../site/tabs/rocks/js/sources.js';
import { PHOTOS } from '../site/tabs/rocks/js/photos.js';
import { walk, pathsToRocks, parsePath, formatPath, checkKey } from '../site/tabs/rocks/js/walk.js';

test('the key has no structural problem', () => {
  assert.deepEqual(checkKey(KEY, ROCKS, TESTS, SOURCES, PHOTOS), []);
});

test('checkKey catches the errors of the source key', () => {
  // Duplicate answer ids, a missing node, an unreachable rock, a cycle.
  const bad = {
    start: 'a',
    nodes: {
      a: { q: { en: 'a', fr: 'a' }, how: { en: 'a', fr: 'a' }, tests: ['t'], answers: [
        { id: 'x', label: { en: 'x', fr: 'x' }, to: 'b', src: ['s'] },
        { id: 'x', label: { en: 'y', fr: 'y' }, to: 'nowhere', src: ['s'] }] },
      b: { q: { en: 'b', fr: 'b' }, how: { en: 'b', fr: 'b' }, tests: ['t'], answers: [
        { id: 'back', label: { en: 'b', fr: 'b' }, to: 'a', src: ['s'] },
        { id: 'r', label: { en: 'r', fr: 'r' }, rock: 'r1', src: [] }] },
    },
  };
  const rocks = { r1: { name: { en: 'r', fr: 'r' }, look: { en: 'l', fr: 'l' }, origin: { en: 'o', fr: 'o' }, src: ['s'] }, r2: { name: { en: 'r', fr: 'r' }, look: { en: 'l', fr: 'l' }, origin: { en: 'o', fr: 'o' }, src: ['s'] } };
  const p = checkKey(bad, rocks, { t: { title: { en: 't', fr: 't' }, how: { en: 'h', fr: 'h' }, src: ['s'] } }, [{ id: 's' }]).join('\n');
  assert.match(p, /duplicate answer ids/);
  assert.match(p, /missing node nowhere/);
  assert.match(p, /rock r2 cannot be reached/);
  assert.match(p, /cycle/);
  assert.match(p, /b\.r: no source/);
});

test('every rock is reached, by at most a handful of questions', () => {
  const paths = pathsToRocks(KEY);
  assert.equal(paths.size, Object.keys(ROCKS).length);
  for (const [rock, list] of paths) {
    const w = walk(KEY, list[0]);
    assert.equal(w.rock, rock);
    assert.equal(w.valid, true);
    assert.ok(list[0].length <= 7, `${rock}: ${list[0].length} questions`);
  }
  assert.ok(Object.keys(ROCKS).length >= 40);
});

test('walking: known paths, unknown ids stop the walk', () => {
  assert.equal(walk(KEY, ['coherent', 'fizz', 'fine', 'chalk']).rock, 'chalk');
  assert.equal(walk(KEY, ['coherent', 'none', 'crystals', 'mix', 'light', 'yes']).rock, 'granite');
  assert.equal(walk(KEY, ['coherent', 'none', 'crystals', 'mix', 'dark']).rock, 'gabbro');
  assert.equal(walk(KEY, ['coherent', 'none', 'foliated', 'plates', 'slate']).rock, 'slate');
  assert.equal(walk(KEY, ['loose', 'mud', 'clay']).rock, 'clay');
  const w = walk(KEY, ['coherent', 'nonsense', 'fizz']);
  assert.equal(w.node, 'acid');
  assert.equal(w.steps.length, 1);
  assert.equal(w.valid, false);
  assert.equal(walk(KEY, []).node, 'start');
  // Past a rock, nothing more is read.
  assert.equal(walk(KEY, ['loose', 'sand', 'extra']).valid, false);
  assert.deepEqual(parsePath('coherent.fizz..fine.'), ['coherent', 'fizz', 'fine']);
  assert.equal(formatPath(['a', 'b']), 'a.b');
});

test('fixes of the source key hold', () => {
  const paths = pathsToRocks(KEY);
  // Granite and gabbro are never under the foliated branch.
  for (const r of ['granite', 'gabbro', 'diorite', 'peridotite']) {
    for (const p of paths.get(r)) assert.ok(!p.includes('foliated'), `${r} under foliated: ${p}`);
  }
  // Greenschist and blueschist are one result, with a caveat about facies and thin sections.
  assert.ok(!ROCKS.greenschist && !ROCKS.blueschist);
  assert.match(ROCKS.metabasite.caveat.en, /thin section/);
  assert.match(ROCKS.eclogite.caveat.en, /thin section/);
  // No question is decided by colour alone among metamorphic facies.
  for (const n of Object.values(KEY.nodes)) for (const a of n.answers) assert.notEqual(a.rock === 'eclogite' && /colou?r/i.test(a.label.en), true);
  assert.ok(FIXES.length >= 6);
  assert.ok(COMPARED.length >= 6);
});

test('every question explains a test, every test has a how-to', () => {
  for (const [id, n] of Object.entries(KEY.nodes)) {
    assert.ok(n.tests.length > 0, id);
    assert.ok(n.how.en.length > 10 && n.how.fr.length > 10, id);
  }
  for (const t of Object.values(TESTS)) assert.ok(t.how.en.length > 80 && t.how.fr.length > 80, t.title.en);
});

test('families, photos and their files', () => {
  for (const r of Object.values(ROCKS)) assert.ok(FAMILIES[r.family], r.name.en);
  for (const [id, p] of Object.entries(PHOTOS)) {
    const f = new URL(`../site/tabs/rocks/img/${p.file}`, import.meta.url);
    assert.ok(existsSync(f), `${id}: ${p.file}`);
    assert.ok(statSync(f).size < 120_000, `${id}: file too large`);
    assert.match(p.licence, /^(CC0|Public domain|CC BY(-SA)? \d\.\d)/, `${id}: licence ${p.licence}`);
    assert.match(p.page, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/, id);
    assert.ok(p.alt.en && p.alt.fr, id);
    assert.ok(p.w > 0 && p.h > 0, id);
  }
});

test('sources: unique ids, a URL each, all cited somewhere', () => {
  const ids = SOURCES.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of SOURCES) assert.match(s.url, /^https?:\/\//, s.id);
  const used = new Set();
  const add = (l) => (l ?? []).forEach((x) => used.add(x));
  for (const n of Object.values(KEY.nodes)) for (const a of n.answers) add(a.src);
  for (const r of Object.values(ROCKS)) add(r.src);
  for (const t of Object.values(TESTS)) add(t.src);
  for (const c of COMPARED) add([c.src]);
  for (const f of FIXES) add(f.src);
  add(['geologiques', 'infoterre', 'auckland', 'bgs-ign', 'bgs-met', 'earle-ch7']); // cited in the page text
  for (const id of ids) assert.ok(used.has(id), `source ${id} is never cited`);
});
