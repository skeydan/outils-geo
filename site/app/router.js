// Hash routing for the one-page app, kept free of the DOM so it can be
// unit-tested in Node. A route is `#/<tab>?<state>`: the tab id, then the
// tab's own state as URL parameters (only what differs from its defaults).
// Hashes that do not start with `#/` are in-page anchors, not routes.

/**
 * Read a location hash.
 * Returns {tab, params: URLSearchParams, canonical: boolean} or null for an
 * in-page anchor such as `#w-src-llnl`. An empty hash, `#/` or an unknown tab
 * gives the default tab; `canonical` is false when the hash should be
 * rewritten (unknown tab, empty hash, stray characters).
 */
export function parseHash(hash, tabIds, defaultTab = tabIds[0]) {
  const raw = String(hash ?? '').replace(/^#/, '');
  if (raw !== '' && !raw.startsWith('/')) return null;
  const body = raw.slice(1);
  const q = body.indexOf('?');
  const id = decodeURIComponent(q < 0 ? body : body.slice(0, q)).replace(/\/+$/, '');
  const params = new URLSearchParams(q < 0 ? '' : body.slice(q + 1));
  const known = tabIds.includes(id);
  const tab = known ? id : defaultTab;
  const p = known ? params : new URLSearchParams();
  return { tab, params: p, canonical: known && formatHash(tab, p) === `#${raw}` };
}

/** Write a route: `#/<tab>` plus `?<params>` when there are any. */
export function formatHash(tab, params) {
  const p = params instanceof URLSearchParams ? params : new URLSearchParams(params ?? {});
  const s = p.toString();
  return `#/${encodeURIComponent(tab)}${s ? `?${s}` : ''}`;
}

/** Index of the tab to move to for a key in an ARIA tablist (wraps), or -1. */
export function tabKeyTarget(key, index, count) {
  if (count < 1) return -1;
  switch (key) {
    case 'ArrowRight': case 'ArrowDown': return (index + 1) % count;
    case 'ArrowLeft': case 'ArrowUp': return (index - 1 + count) % count;
    case 'Home': return 0;
    case 'End': return count - 1;
    default: return -1;
  }
}
