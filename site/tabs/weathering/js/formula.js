// Chemical formulas and reaction balancing, with exact fractions.
//
// parse('Na0.33Al2.33Si3.67O10(OH)2') -> { el: {Na: 33/100, ...}, charge: 0 }
// Charges are written the PHREEQC way: K+, Ca+2, CO3-2, Al(OH)4-.
// balance() solves the element and charge balance as a null space, so every
// reaction shown on the page is computed, never typed by hand.

// ---------------------------------------------------------------- fractions
const babs = (a) => (a < 0n ? -a : a);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };

export class Q {
  constructor(n, d = 1n) {
    n = BigInt(n); d = BigInt(d);
    if (d === 0n) throw new Error('division by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = bgcd(n, d) || 1n;
    this.n = n / g; this.d = d / g;
  }
  static of(x) {
    if (x instanceof Q) return x;
    if (typeof x === 'bigint') return new Q(x);
    const s = String(x);
    const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(s);
    if (!m) throw new Error(`not a decimal: ${s}`);
    const frac = m[3] || '';
    const n = BigInt((m[2] || '0') + frac) * (m[1] ? -1n : 1n);
    return new Q(n, 10n ** BigInt(frac.length));
  }
  add(b) { b = Q.of(b); return new Q(this.n * b.d + b.n * this.d, this.d * b.d); }
  sub(b) { b = Q.of(b); return new Q(this.n * b.d - b.n * this.d, this.d * b.d); }
  mul(b) { b = Q.of(b); return new Q(this.n * b.n, this.d * b.d); }
  div(b) { b = Q.of(b); return new Q(this.n * b.d, this.d * b.n); }
  neg() { return new Q(-this.n, this.d); }
  isZero() { return this.n === 0n; }
  sign() { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
  eq(b) { b = Q.of(b); return this.n === b.n && this.d === b.d; }
  valueOf() { return Number(this.n) / Number(this.d); }
  toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
}
const ZERO = new Q(0n);

// ---------------------------------------------------------------- parsing
/** Parse a formula. Returns { el: {symbol: Q}, charge: Q }. */
export function parse(formula) {
  let s = String(formula).trim();
  let charge = ZERO;
  const cm = /([+-])(\d*)$/.exec(s);
  if (cm && !/^e-$/.test(s)) {
    charge = Q.of(cm[2] || '1');
    if (cm[1] === '-') charge = charge.neg();
    s = s.slice(0, cm.index);
  }
  s = s.replace(/\((aq|am|g|s|l)\)$/i, ''); // state labels such as SiO2(am), CO2(g)
  const parts = s.split(':');
  const el = {};
  const addAll = (into, from, k) => { for (const [e, v] of Object.entries(from)) into[e] = (into[e] ?? ZERO).add(v.mul(k)); };
  parts.forEach((p, i) => {
    let k = Q.of(1);
    if (i > 0) { const m = /^(\d*\.?\d+)/.exec(p); if (m) { k = Q.of(m[1]); p = p.slice(m[1].length); } }
    addAll(el, group(p), k);
  });
  for (const e of Object.keys(el)) if (el[e].isZero()) delete el[e];
  return { el, charge };
}

function group(s) {
  let i = 0;
  const num = () => { const m = /^\d*\.?\d+/.exec(s.slice(i)); if (!m) return Q.of(1); i += m[0].length; return Q.of(m[0]); };
  const seq = () => {
    const out = {};
    const add = (e, v) => { out[e] = (out[e] ?? ZERO).add(v); };
    while (i < s.length && s[i] !== ')') {
      if (s[i] === '(') {
        i++;
        const inner = seq();
        if (s[i] !== ')') throw new Error(`unbalanced parenthesis in ${s}`);
        i++;
        const k = num();
        for (const [e, v] of Object.entries(inner)) add(e, v.mul(k));
      } else {
        const m = /^[A-Z][a-z]?/.exec(s.slice(i));
        if (!m) throw new Error(`cannot read "${s}" at ${i}`);
        i += m[0].length;
        add(m[0], num());
      }
    }
    return out;
  };
  const r = seq();
  if (i !== s.length) throw new Error(`cannot read "${s}"`);
  return r;
}

// ---------------------------------------------------------------- balancing
/**
 * Balance a reaction. species: formulas; the first one gets coefficient 1
 * (before integer scaling). Returns signed coefficients as Q: positive = left
 * side (consumed), negative = right side (produced). Throws when the balance
 * is not unique (missing or extra species).
 */
export function balanceQ(species) {
  const parsed = species.map(parse);
  const els = [...new Set(parsed.flatMap((p) => Object.keys(p.el)))].sort();
  const rows = [...els.map((e) => parsed.map((p) => p.el[e] ?? ZERO)), parsed.map((p) => p.charge)];
  const n = species.length;
  // Solve rows * v = 0 with v[0] = 1: A w = b with A = cols 1..n-1, b = -col 0.
  const A = rows.map((r) => [...r.slice(1), r[0].neg()]);
  const m = n - 1;
  let rank = 0;
  const pivots = [];
  for (let c = 0; c < m && rank < A.length; c++) {
    let p = rank;
    while (p < A.length && A[p][c].isZero()) p++;
    if (p === A.length) continue;
    [A[rank], A[p]] = [A[p], A[rank]];
    const pv = A[rank][c];
    A[rank] = A[rank].map((x) => x.div(pv));
    for (let r = 0; r < A.length; r++) {
      if (r === rank || A[r][c].isZero()) continue;
      const f = A[r][c];
      A[r] = A[r].map((x, j) => x.sub(A[rank][j].mul(f)));
    }
    pivots.push(c);
    rank++;
  }
  for (let r = rank; r < A.length; r++) if (!A[r][m].isZero()) throw new Error(`no balance for ${species.join(' + ')}`);
  if (rank < m) throw new Error(`balance not unique for ${species.join(' + ')}`);
  const w = new Array(m).fill(ZERO);
  pivots.forEach((c, r) => { w[c] = A[r][m]; });
  return [Q.of(1), ...w];
}

const lcm = (a, b) => (a / bgcd(a, b)) * b;

/** Scale signed coefficients to the smallest integers, if they stay small; else per 1 of the first species. */
export function niceCoefficients(coefs, maxInt = 40) {
  const L = coefs.reduce((acc, c) => lcm(acc, c.d), 1n);
  let ints = coefs.map((c) => c.mul(new Q(L)));
  const g = ints.reduce((acc, c) => bgcd(acc, c.n), 0n) || 1n;
  ints = ints.map((c) => c.div(new Q(g)));
  if (ints.every((c) => babs(c.n) <= BigInt(maxInt))) return { coefs: ints, integer: true };
  // Otherwise set one species to 1, choosing the one that gives the shortest
  // exact decimals (e.g. per 1 smectite: 2.33 albite ... 2 Na+).
  const digits = (c) => {
    for (let k = 0; k <= 3; k++) { const s = c.mul(new Q(10n ** BigInt(k))); if (s.d === 1n) return k; }
    return 100;
  };
  let best = coefs, bestScore = Infinity;
  for (const c0 of coefs) {
    if (c0.isZero()) continue;
    const scaled = coefs.map((c) => c.div(c0.sign() < 0 ? c0.neg() : c0));
    const score = scaled.reduce((s, c) => s + digits(c), 0);
    if (score < bestScore) { best = scaled; bestScore = score; }
  }
  return { coefs: best, integer: false };
}

/**
 * Balance and split into sides. Returns { left: [{f, c}], right: [{f, c}], check }
 * where c are positive Q and check lists each element and the charge on both sides.
 */
export function reaction(species, { maxInt = 40 } = {}) {
  const raw = balanceQ(species);
  const { coefs, integer } = niceCoefficients(raw, maxInt);
  const left = [], right = [];
  species.forEach((f, i) => {
    const c = coefs[i];
    if (c.sign() > 0) left.push({ f, c });
    else if (c.sign() < 0) right.push({ f, c: c.neg() });
  });
  return { left, right, integer, check: check(left, right) };
}

/** Element and charge totals on each side (exact). */
export function check(left, right) {
  const tot = (side) => {
    const el = {}; let charge = ZERO;
    for (const { f, c } of side) {
      const p = parse(f);
      for (const [e, v] of Object.entries(p.el)) el[e] = (el[e] ?? ZERO).add(v.mul(c));
      charge = charge.add(p.charge.mul(c));
    }
    return { el, charge };
  };
  const L = tot(left), R = tot(right);
  const order = ['K', 'Na', 'Ca', 'Mg', 'Fe', 'Al', 'Si', 'C', 'O', 'H'];
  const els = [...new Set([...Object.keys(L.el), ...Object.keys(R.el)])]
    .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b));
  const rows = els.map((e) => ({ el: e, left: L.el[e] ?? ZERO, right: R.el[e] ?? ZERO }));
  rows.forEach((r) => { r.ok = r.left.eq(r.right); });
  const charge = { left: L.charge, right: R.charge, ok: L.charge.eq(R.charge) };
  return { rows, charge, ok: rows.every((r) => r.ok) && charge.ok };
}

/** Number of moles of element e in one formula unit (as a JS number). */
export function count(formula, e) {
  const v = parse(formula).el[e];
  return v ? Number(v) : 0;
}

/** Format a coefficient: integers as is, otherwise up to 3 decimals. */
export function fmtCoef(c, lang = 'en') {
  const v = Number(c);
  if (Number.isInteger(v)) return String(v);
  const s = (Math.round(v * 1000) / 1000).toString();
  return lang === 'fr' ? s.replace('.', ',') : s;
}

/**
 * Split a formula for display: [{t: text, sub?: true, sup?: true}].
 * Numbers after elements or ')' become subscripts; the charge becomes a superscript
 * written the usual way (Ca2+, CO3 2-).
 */
export function displayParts(formula) {
  let s = String(formula);
  const out = [];
  let sup = '';
  const cm = /([+-])(\d*)$/.exec(s);
  if (cm) { sup = `${cm[2] && cm[2] !== '1' ? cm[2] : ''}${cm[1] === '-' ? '−' : '+'}`; s = s.slice(0, cm.index); }
  const state = /\((aq|am|g|s|l)\)$/i.exec(s);
  if (state) s = s.slice(0, state.index);
  const re = /([A-Z][a-z]?|\(|\)|:|·)(\d*\.?\d*)/g;
  let m; let last = 0;
  // A leading number in a hydrate (":6H2O") stays full size.
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: s.slice(last, m.index) });
    if (m[1] === ':') { out.push({ t: '·' }); if (m[2]) out.push({ t: m[2] }); }
    else { out.push({ t: m[1] }); if (m[2]) out.push({ t: m[2], sub: true }); }
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  if (sup) out.push({ t: sup, sup: true });
  if (state) out.push({ t: `(${state[1]})`, small: true });
  return out;
}

/** Plain-text version with Unicode sub/superscripts (for aria labels, titles, tests). */
export function plain(formula) {
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '.': '.' };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '−': '⁻' };
  return displayParts(formula).map((p) => (p.sub ? [...p.t].map((ch) => SUB[ch] ?? ch).join('') : p.sup ? [...p.t].map((ch) => SUP[ch] ?? ch).join('') : p.t)).join('');
}
