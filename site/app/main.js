// The one-page app: header, a tab bar with one tab per tool, one panel per
// tab, and hash routing (#/<tab>?<state>, see router.js). A tool's code and
// styles are loaded the first time its tab is shown; its panel then stays in
// the page (hidden when another tab is chosen), so its state is kept.
import { initShell, lang, onLangChange } from '../assets/site.js';
import { parseHash, formatHash, tabKeyTarget } from './router.js';
import { TABS, DEFAULT_TAB } from './tabs.js';

const IDS = TABS.map((t) => t.id);
const ROOT = new URL('../', import.meta.url);
const tr = (o) => o?.[lang()] ?? o?.en ?? '';

const DICT = {
  'tabs.label': { en: 'Tools', fr: 'Outils' },
  'tabs.loading': { en: 'Loading…', fr: 'Chargement…' },
  'tabs.failed': { en: 'This tool could not be loaded. Reload the page to try again.', fr: 'Cet outil n’a pas pu être chargé. Rechargez la page pour réessayer.' },
  footer: {
    en: 'Independent personal project. No tracking, no cookies. Texts and drawings are original; data come from the sources listed in each tool.',
    fr: 'Projet personnel indépendant. Ni pistage ni cookies. Textes et dessins originaux ; les données viennent des sources citées dans chaque outil.',
  },
  ...Object.fromEntries(TABS.map((t) => [`tab.${t.id}`, t.label])),
};

const bar = document.getElementById('tabs');
const panels = document.getElementById('panels');
const views = new Map(); // id -> {tab, button, panel, instance, params, loading}
let active = null;

// ---------------------------------------------------------------- tab bar (ARIA tabs)
for (const tab of TABS) {
  const button = document.createElement('button');
  Object.assign(button, { type: 'button', id: `tab-${tab.id}`, tabIndex: -1 });
  button.setAttribute('role', 'tab');
  button.setAttribute('aria-selected', 'false');
  button.setAttribute('aria-controls', `panel-${tab.id}`);
  button.dataset.i18n = `tab.${tab.id}`;
  button.dataset.tab = tab.id;
  button.addEventListener('click', () => go(tab.id));
  bar.append(button);

  const panel = document.createElement('section');
  Object.assign(panel, { id: `panel-${tab.id}`, tabIndex: 0, hidden: true });
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
  panel.className = 'tab-panel';
  const wait = document.createElement('p');
  wait.className = 'muted';
  wait.dataset.i18n = 'tabs.loading';
  panel.append(wait);
  panels.append(panel);
  views.set(tab.id, { tab, button, panel, instance: null, params: '', loading: null });
}

bar.addEventListener('keydown', (e) => {
  const buttons = [...bar.querySelectorAll('[role="tab"]')];
  const i = tabKeyTarget(e.key, buttons.indexOf(document.activeElement), buttons.length);
  if (i < 0 || buttons.indexOf(document.activeElement) < 0) return;
  e.preventDefault();
  buttons[i].focus();
  go(buttons[i].dataset.tab); // automatic activation
});

/** Choose a tab from the bar: a new history entry, the tab's last state. */
function go(id) {
  const hash = formatHash(id, new URLSearchParams(views.get(id).params));
  if (location.hash !== hash) location.hash = hash;
}

function replaceRoute(id, query) {
  history.replaceState(null, '', `${location.pathname}${location.search}${formatHash(id, new URLSearchParams(query))}`);
}

function select(id) {
  active = id;
  for (const [vid, v] of views) {
    const on = vid === id;
    v.button.setAttribute('aria-selected', String(on));
    v.button.tabIndex = on ? 0 : -1;
    v.panel.hidden = !on;
  }
  views.get(id).button.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  setTitle();
}
const setTitle = () => { if (active) document.title = `${tr(views.get(active).tab.label)} · outils-geo`; };

// ---------------------------------------------------------------- loading a tool
function loadCss(href) {
  if (document.querySelector(`link[data-tab-css="${href}"]`)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
    link.dataset.tabCss = href;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`could not load ${href}`));
    document.head.append(link);
  });
}

async function mountView(v) {
  try {
    const [mod] = await Promise.all([
      import(new URL(v.tab.module, ROOT).href),
      v.tab.css ? loadCss(new URL(v.tab.css, ROOT).href) : null,
    ]);
    v.panel.replaceChildren();
    v.instance = mod.mount(v.panel, {
      params: new URLSearchParams(v.params),
      setParams: (p) => {
        v.params = new URLSearchParams(p).toString();
        if (active === v.tab.id) replaceRoute(v.tab.id, v.params);
      },
    });
  } catch (err) {
    v.loading = null;
    const p = document.createElement('p');
    p.className = 'err';
    p.textContent = tr(DICT['tabs.failed']);
    v.panel.replaceChildren(p);
    throw err;
  }
}

async function show(id, params, rewrite) {
  const v = views.get(id);
  const query = params.toString();
  select(id);
  if (rewrite) replaceRoute(id, query);
  if (!v.instance) {
    v.params = query;
    await (v.loading ??= mountView(v));
  } else if (query !== v.params) {
    v.params = query;
    v.instance.show(new URLSearchParams(query));
  }
}

// ---------------------------------------------------------------- in-page anchors
// Citations and other `#id` links scroll to their target without touching
// the route, so the URL keeps the tab and its state.
function jumpTo(id) {
  const el = id && document.getElementById(id);
  if (!el) return;
  document.querySelectorAll('.is-target').forEach((n) => n.classList.remove('is-target'));
  el.classList.add('is-target');
  if (!el.hasAttribute('tabindex')) el.tabIndex = -1;
  const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches;
  el.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  el.focus({ preventScroll: true });
}

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.('a[href^="#"]');
  const href = a?.getAttribute('href');
  if (!href || href.startsWith('#/')) return; // routes navigate normally
  e.preventDefault();
  jumpTo(decodeURIComponent(href.slice(1)));
});

function onHash() {
  const r = parseHash(location.hash, IDS, DEFAULT_TAB);
  if (r) return show(r.tab, r.params, !r.canonical);
  // An anchor typed or opened in a new tab: keep the current tool, then jump.
  const anchor = decodeURIComponent(location.hash.slice(1));
  const id = active ?? DEFAULT_TAB;
  return show(id, new URLSearchParams(views.get(id).params), true).then(() => jumpTo(anchor));
}

// ---------------------------------------------------------------- start
initShell(DICT);
onLangChange(() => {
  setTitle();
  for (const v of views.values()) v.instance?.relang();
});
window.addEventListener('hashchange', onHash);
onHash();
