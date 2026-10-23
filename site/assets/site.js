// Shared page shell: language (fr/en) and light/dark theme.
// Language: ?lang= in the URL, then the saved choice, then the browser's
// preferred languages (French if any of them is French), else English.

const LANGS = ['en', 'fr'];

export function detectLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(q)) return q;
  try {
    const saved = localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch { /* private mode */ }
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  for (const p of prefs) {
    const base = String(p).toLowerCase().slice(0, 2);
    if (LANGS.includes(base)) return base;
  }
  return 'en';
}

let current = 'en';
const listeners = new Set();

export const lang = () => current;
export const onLangChange = (fn) => listeners.add(fn);

/** Apply a dictionary {key: {en, fr}} to [data-i18n], [data-i18n-html] and [data-i18n-attr] elements. */
export function applyDict(dict, root = document) {
  const t = (k) => dict[k]?.[current] ?? dict[k]?.en ?? k;
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  // Only for trusted, hard-coded strings in our own dictionaries.
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(';')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    }
  });
}

export function setLang(l, { save = true } = {}) {
  current = LANGS.includes(l) ? l : 'en';
  document.documentElement.lang = current;
  if (save) { try { localStorage.setItem('lang', current); } catch { /* ignore */ } }
  document.querySelectorAll('[data-lang-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.langBtn === current)));
  listeners.forEach((fn) => fn(current));
}

// Theme: 'auto' follows the OS; the toggle stamps data-theme on <html>.
export function setTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light' || mode === 'dark') root.dataset.theme = mode;
  else delete root.dataset.theme;
  try { localStorage.setItem('theme', mode); } catch { /* ignore */ }
  document.dispatchEvent(new CustomEvent('themechange'));
}

export function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t) return t;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SHELL_DICT = {
  'shell.theme': { en: 'Switch light / dark', fr: 'Basculer clair / sombre' },
  'shell.home': { en: 'outils-geo', fr: 'outils-geo' },
};

export function initShell(pageDict = {}) {
  const dict = { ...SHELL_DICT, ...pageDict };
  let theme = 'auto';
  try { theme = localStorage.getItem('theme') || 'auto'; } catch { /* ignore */ }
  setTheme(theme);
  document.querySelectorAll('[data-lang-btn]').forEach((b) =>
    b.addEventListener('click', () => setLang(b.dataset.langBtn))
  );
  document.querySelector('[data-theme-btn]')?.addEventListener('click', () => {
    setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () =>
    document.dispatchEvent(new CustomEvent('themechange'))
  );
  onLangChange(() => applyDict(dict));
  setLang(detectLang(), { save: false });
  return dict;
}
