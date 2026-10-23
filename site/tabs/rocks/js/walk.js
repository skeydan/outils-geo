// Walking the key, without the DOM (unit-tested in Node). The key is a
// directed acyclic graph: each question has answers, each answer leads to
// another question (`to`) or to a rock (`rock`). A path is the list of the
// answer ids chosen from the first question; it is what the route stores
// (#/rocks?p=coherent.nofizz.crystals).

/**
 * Follow a path from the start. Unknown answer ids end the walk there.
 * Returns {steps: [{node, answer}], node: id of the open question or null,
 * rock: id of the rock reached or null, valid: every id was used}.
 */
export function walk(key, path) {
  const steps = [];
  let node = key.start, rock = null, used = 0;
  for (const aid of path) {
    if (!node) break;
    const a = key.nodes[node].answers.find((x) => x.id === aid);
    if (!a) break;
    steps.push({ node, answer: a });
    used++;
    if (a.rock) { rock = a.rock; node = null; } else node = a.to;
  }
  return { steps, node, rock, valid: used === path.length };
}

/** Every path that ends at each rock: Map rock -> [[answer ids]...], shortest first. */
export function pathsToRocks(key) {
  const out = new Map();
  const visit = (node, path) => {
    for (const a of key.nodes[node].answers) {
      const p = [...path, a.id];
      if (a.rock) {
        if (!out.has(a.rock)) out.set(a.rock, []);
        out.get(a.rock).push(p);
      } else visit(a.to, p);
    }
  };
  visit(key.start, []);
  for (const list of out.values()) list.sort((x, y) => x.length - y.length);
  return out;
}

/** Read the `p` route parameter: answer ids separated by dots. */
export const parsePath = (s) => String(s ?? '').split('.').map((x) => x.trim()).filter(Boolean);
export const formatPath = (ids) => ids.join('.');

/**
 * Check the key for the mistakes found in the hand-drawn source key and
 * for missing material. Returns a list of problems (empty when all is well).
 * rocks: {id: {...}}, tests: {id: {...}}, sources: [{id}], photos: {id: {...}}.
 */
export function checkKey(key, rocks, tests, sources, photos = {}) {
  const problems = [];
  const srcIds = new Set(sources.map((s) => s.id));
  const both = (o, where) => { if (!o || !o.en || !o.fr) problems.push(`${where}: missing English or French text`); };
  const srcOk = (list, where) => {
    if (!list?.length) problems.push(`${where}: no source`);
    for (const s of list ?? []) if (!srcIds.has(s)) problems.push(`${where}: unknown source ${s}`);
  };
  if (!key.nodes[key.start]) problems.push('start node missing');
  // Reachability and cycles (depth-first search with colours).
  const state = new Map();
  const reachedRocks = new Set();
  const dfs = (id, trail) => {
    if (state.get(id) === 1) { problems.push(`cycle: ${[...trail, id].join(' > ')}`); return; }
    if (state.get(id) === 2) return;
    state.set(id, 1);
    const n = key.nodes[id];
    if (!n) { problems.push(`missing node ${id} (from ${trail.at(-1)})`); state.set(id, 2); return; }
    for (const a of n.answers) {
      if (a.rock) { reachedRocks.add(a.rock); if (!rocks[a.rock]) problems.push(`${id}.${a.id}: unknown rock ${a.rock}`); } else dfs(a.to, [...trail, id]);
    }
    state.set(id, 2);
  };
  if (key.nodes[key.start]) dfs(key.start, []);
  for (const [id, n] of Object.entries(key.nodes)) {
    if (!state.has(id)) problems.push(`node ${id} cannot be reached`);
    both(n.q, `node ${id} question`);
    both(n.how, `node ${id} how-to`);
    if (n.answers.length < 2) problems.push(`node ${id}: fewer than two answers`);
    const aids = n.answers.map((a) => a.id);
    if (new Set(aids).size !== aids.length) problems.push(`node ${id}: duplicate answer ids`);
    for (const t of n.tests ?? []) if (!tests[t]) problems.push(`node ${id}: unknown test ${t}`);
    if (!n.tests?.length) problems.push(`node ${id}: no test explained`);
    for (const a of n.answers) {
      both(a.label, `${id}.${a.id} label`);
      if (!!a.rock === !!a.to) problems.push(`${id}.${a.id}: needs exactly one of rock / to`);
      srcOk(a.src, `${id}.${a.id}`);
    }
  }
  for (const [id, r] of Object.entries(rocks)) {
    if (!reachedRocks.has(id)) problems.push(`rock ${id} cannot be reached`);
    both(r.name, `rock ${id} name`);
    both(r.look, `rock ${id} description`);
    both(r.origin, `rock ${id} origin`);
    srcOk(r.src, `rock ${id}`);
    for (const c of r.like ?? []) if (!rocks[c.rock]) problems.push(`rock ${id}: look-alike ${c.rock} unknown`);
    for (const ph of [r.photo, r.photo2]) if (ph && !photos[ph]) problems.push(`rock ${id}: photo ${ph} has no credit`);
  }
  for (const [id, t] of Object.entries(tests)) {
    both(t.title, `test ${id} title`);
    both(t.how, `test ${id} how-to`);
    srcOk(t.src, `test ${id}`);
    if (t.photo && !photos[t.photo]) problems.push(`test ${id}: photo ${t.photo} has no credit`);
  }
  for (const [id, p] of Object.entries(photos)) {
    for (const k of ['file', 'author', 'licence', 'licenceUrl', 'page']) if (!p[k]) problems.push(`photo ${id}: no ${k}`);
  }
  return problems;
}
