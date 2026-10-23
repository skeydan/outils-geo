// Hash routes of the one-page app and the tab registry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { parseHash, formatHash, tabKeyTarget } from '../site/app/router.js';
import { TABS, DEFAULT_TAB } from '../site/app/tabs.js';

const IDS = ['weathering', 'indices'];

test('routes: tab and state round-trip, anchors are not routes', () => {
  const r = parseHash('#/weathering?m=albite&xi=-2.6', IDS);
  assert.equal(r.tab, 'weathering');
  assert.equal(r.params.get('m'), 'albite');
  assert.equal(r.params.get('xi'), '-2.6');
  assert.equal(r.canonical, true);
  assert.equal(formatHash(r.tab, r.params), '#/weathering?m=albite&xi=-2.6');
  assert.equal(parseHash('#/indices', IDS).tab, 'indices');
  assert.equal(formatHash('weathering', new URLSearchParams()), '#/weathering');
  assert.equal(formatHash('weathering', { m: 'K-feldspar' }), '#/weathering?m=K-feldspar');
  // In-page anchors (citations) leave the route alone.
  assert.equal(parseHash('#w-src-llnl', IDS), null);
  assert.equal(parseHash('#main', IDS), null);
});

test('routes: empty, unknown and untidy hashes fall back to the default tab', () => {
  for (const h of ['', '#', '#/', '#/nope?m=albite', '#/WEATHERING']) {
    const r = parseHash(h, IDS);
    assert.equal(r.tab, 'weathering', h);
    assert.equal([...r.params].length, 0, h);
    assert.equal(r.canonical, false, h);
  }
  const t = parseHash('#/indices/?x=1', IDS);
  assert.equal(t.tab, 'indices');
  assert.equal(t.canonical, false);
  assert.equal(parseHash('#/weathering?', IDS).canonical, false);
  assert.equal(parseHash('', IDS, 'indices').tab, 'indices');
});

test('tab bar keys: arrows wrap, Home and End, other keys ignored', () => {
  assert.equal(tabKeyTarget('ArrowRight', 0, 3), 1);
  assert.equal(tabKeyTarget('ArrowRight', 2, 3), 0);
  assert.equal(tabKeyTarget('ArrowLeft', 0, 3), 2);
  assert.equal(tabKeyTarget('Home', 2, 3), 0);
  assert.equal(tabKeyTarget('End', 0, 3), 2);
  assert.equal(tabKeyTarget('ArrowRight', 0, 1), 0);
  assert.equal(tabKeyTarget('Enter', 0, 3), -1);
  assert.equal(tabKeyTarget('Home', 0, 0), -1);
});

test('tab registry: unique ids, both languages, files exist', () => {
  const ids = TABS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(DEFAULT_TAB, 'weathering');
  for (const t of TABS) {
    assert.match(t.id, /^[a-z][a-z0-9-]*$/);
    assert.ok(t.label.en && t.label.fr, t.id);
    assert.ok(existsSync(new URL(`../site/${t.module}`, import.meta.url)), t.module);
    if (t.css) assert.ok(existsSync(new URL(`../site/${t.css}`, import.meta.url)), t.css);
  }
  assert.equal(TABS[0].label.fr, 'Altération des silicates');
});
