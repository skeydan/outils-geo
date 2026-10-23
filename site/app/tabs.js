// The tools of the one-page app, one tab each, in tab-bar order. To add a
// tool: put its files under site/tabs/<id>/, give its module a `mount`
// function (see site/tabs/weathering/js/app.js) and add an entry here.
// Paths are relative to the site root. Ideas for later (not built):
// weathering indices from a chemical analysis; carbonates and karst.

export const TABS = [
  {
    id: 'weathering',
    label: { en: 'Silicate weathering', fr: 'Altération des silicates' },
    module: 'tabs/weathering/js/app.js',
    css: 'tabs/weathering/css/weathering.css',
  },
  {
    id: 'rocks',
    label: { en: 'Rock key', fr: 'Clé des roches' },
    module: 'tabs/rocks/js/app.js',
    css: 'tabs/rocks/css/rocks.css',
  },
];

export const DEFAULT_TAB = TABS[0].id;
