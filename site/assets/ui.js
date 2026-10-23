// Small DOM helpers shared by the calculators. All text goes through
// textContent; only our own dictionary strings may use innerHTML.

export function h(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid);
  return n;
}

/** Parse a user number: accepts a decimal comma, spaces and a trailing unit. NaN when empty. */
export function num(raw) {
  const s = String(raw ?? '').trim().replace(/\s+/g, '').replace(',', '.').replace(/[^\d.+\-eE]+$/, '');
  if (s === '') return NaN;
  const v = Number(s);
  return Number.isFinite(v) ? v : NaN;
}

/** Format a number for the UI language with a number of decimals. */
export function fmtn(v, lang, digits = 1) {
  if (!Number.isFinite(v)) return '–';
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v);
}

/**
 * Numbered citations for one tool. sources: [{id, text, url}] in page order.
 * `prefix` keeps the anchor ids of different tools on one page apart.
 */
export function citer(sources, prefix = '') {
  const index = new Map(sources.map((s, i) => [s.id, i + 1]));
  const cite = (...ids) => ids.map((id) => {
    const i = index.get(id);
    if (!i) throw new Error(`unknown source ${id}`);
    return h('a', { class: 'src', href: `#${prefix}src-${id}`, 'aria-label': `source ${i}` }, `[${i}]`);
  });
  const list = () => h('ol', {}, ...sources.map((s) => h('li', { id: `${prefix}src-${s.id}` }, `${s.text} `,
    h('a', { href: s.url, rel: 'noopener', target: '_blank' }, s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')))));
  return { cite, list };
}

/** A labelled input. Returns {wrap, input}. */
export function field({ id, label, value = '', unit = '', hint = '', inputmode = 'decimal', type = 'text', attrs = {} }) {
  const input = h('input', { id, type, inputmode, autocomplete: 'off', value, ...attrs });
  const wrap = h('div', { class: 'field' },
    h('label', { for: id, text: label }),
    h('div', { class: 'field-in' }, input, unit ? h('span', { class: 'unit', text: unit, 'aria-hidden': 'true' }) : null),
    hint ? h('p', { class: 'hint', text: hint }) : null);
  return { wrap, input };
}

/** A select. options: [{value, label}] */
export function select({ id, label, options, value, narrow = false }) {
  const s = h('select', { id }, ...options.map((o) => h('option', { value: o.value, text: o.label, selected: o.value === value })));
  const wrap = h('div', { class: narrow ? 'field' : 'field select' }, h('label', { for: id, text: label }), h('div', { class: 'field-in' }, s));
  return { wrap, input: s };
}
