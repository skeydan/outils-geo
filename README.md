# outils-geo

Small tools for anyone learning geology and geochemistry. French and English
(follows the browser language, with a switch), light and dark, works on
phones. A static site: no backend, no build step, no tracking, no cookies.
Every fact and number comes from a cited source, listed at the bottom of
each tool. A sibling of `outils-plantes`, with the same shell.

One page (`site/index.html`) with a tab bar at the top, one tab per tool.
There is no separate home page: the site opens on the first tab.

## The page

- **Tab bar**: ARIA tabs (`role="tablist"`, `tab`, `tabpanel`, roving
  `tabindex`); arrow keys, Home and End move between tabs and show them;
  Tab moves on into the panel. 44 px touch targets; the bar scrolls sideways
  on a phone once there are more tabs than fit.
- **Routes**: the hash holds the tab and its state,
  `#/<tab>?<state>`, e.g. `#/weathering?m=albite&xi=-2.6`, so a view can be
  shared or bookmarked. Only what differs from the defaults is written;
  changes inside a tab replace the history entry, choosing a tab adds one.
  An empty or unknown route opens the first tab. Citation links (`#w-src-…`)
  scroll to their source without changing the route.
- **Language and theme**: French or English from `?lang=`, then the saved
  choice, then the browser languages; the FR/EN switch changes the open tab
  in place and keeps the route. Light and dark follow the system, with a
  switch.
- **Adding a tool**: put it under `site/tabs/<id>/`, export
  `mount(root, {params, setParams})` returning `{show(params), relang()}`
  (see the weathering tab), and add an entry (id, FR/EN label, module, CSS)
  to `site/app/tabs.js`. Its code and CSS load the first time its tab is
  shown. Two more tools are planned: weathering indices from a
  chemical analysis, and carbonates and karst.

## Tools

- **Silicate weathering** (tab `weathering`, FR « Altération des silicates »,
  `site/tabs/weathering/`). Pick a starting mineral
  (K-feldspar, albite, anorthite, muscovite, biotite as phlogopite or annite,
  forsterite, fayalite, enstatite, diopside, tremolite, quartz) and the
  conditions: temperature (0–40 °C), how much mineral each litre of water
  dissolves before it drains away (the leaching intensity), and what sets the
  acidity (soil-air CO₂ pressure, or a fixed pH). Or type a measured water
  (two Sierra Nevada spring waters from Feth et al. 1964 as presets).
  - **The steps**: hydrolysis, desilication, oxidation, ion exchange,
    dissolution, dehydration, each as a reaction balanced by the code (exact
    fractions), with its mass and charge balance, what stays solid and what
    goes into the water, a plain-words note, and the version with carbonic
    acid. The step matching your conditions is highlighted.
  - **The result**: the stable secondary mineral (gibbsite, kaolinite, illite
    as muscovite, Na/Ca/Mg smectite as beidellite, goethite), Pédro's regime
    (allitisation, monosiallitisation, bisiallitisation), the water (pH, ions
    in mg/L, silica, bicarbonate, free Al³⁺) and notes (quartz or opal
    saturation, talc/sepiolite/serpentine/calcite saturation).
  - **Stability diagram**: log(a(M)/a(H⁺)ᶻ) against log a(H₄SiO₄) for K, Na,
    Ca and Mg, computed at your temperature, with your water as a point, the
    reaction path as a line, quartz and opal saturation, a hover/tap read-out,
    the boundaries as equations and reactions, and dashed comparison
    boundaries from Robie & Hemingway (1995) or phreeqc.dat.
  - **How fast**: laboratory rate (Palandri & Kharaka 2004) at the water's pH
    and temperature, the lifetime of a grain and the share dissolved after a
    given time, the Goldich series (own drawing) and the lifetimes of all
    minerals side by side, with the laboratory-versus-field warning.
  - **Quartz**: dissolution only, solubility against pH and temperature, and
    a gentle note that quartz cannot become kaolinite (no aluminium).

The state is kept in the route (`#/weathering?m=albite&xi=-2.6&sys=Na`).

- **Rock identification key** (tab `rocks`, FR « Clé des roches »,
  `site/tabs/rocks/`). A clickable key for hand specimens: one question at
  a time (loose or coherent, acid test, overall texture, then foliation,
  crystals, grain size, glass, hardness…), the path so far as clickable
  steps, a back button and “start again”. Under each question, “How to
  tell” explains the test (how to do it, what to look at, care with acid
  and glass), with our own schematic drawings and open-licence photos. It
  leads to 44 common rocks (loose sediments, sedimentary, volcanic,
  plutonic, metamorphic); each card gives what to check, how it forms, the
  look-alikes (links to their cards), the limits (thin section, chemistry)
  and the names in French, English and German. Below the key: an index of
  all rocks (each opens the shortest path to it), all tests explained, the
  keys compared (French, British, American and German), what was changed in
  the starting key, the sources and the photo credits.
  - **Inspiration**: the video “CLÉ de DÉTERMINATION des PRINCIPALES
    ROCHES” (6 May 2020, playlist “ROCHES”) of the French YouTube channel
    GÉO Logique (Yves Hardouin, with Fabrice Redois), credited in the tab;
    the channel's account is now closed. We started from a hand-drawn flow
    chart summarising it, reworked its structure and sourced every
    criterion. The flow chart's duplicate node names, the granite and
    gabbro under “oriented structures”, and greenschist / blueschist /
    eclogite “by colour” are fixed; greenschist and blueschist are one result
    with a thin-section warning (facies, not rock names, for the BGS).
  - **Structure**: the key is data (`js/data.js`); `js/walk.js` walks a path
    and checks the graph (every node reached, no loop, unique answer ids,
    every rock reached, every answer, test and rock sourced, English and
    French everywhere, every photo credited).

The path is kept in the route as answer ids (`#/rocks?p=coherent.none.crystals`).

## How the chemistry is done

- **Data**: `llnl.dat` from PHREEQC 3 (LLNL thermo.com.V8.R6) for every
  log K, its temperature function, the B-dot activity model and the ion
  sizes. The per-mineral references of thermo.com.V8.R6 (GWB copy, cited on
  the page) show most silicates from Helgeson et al. (1978) through SUPCRT92,
  gibbsite from Pokrovskii & Helgeson (1995), and the smectites (beidellites)
  as estimates (Wolery 1978), the least certain values used. log K at 25 °C is the tabulated value; the
  fitted function gives the change with temperature.
  `node scripts/check-thermo.mjs llnl.dat phreeqc.dat` re-reads downloaded
  copies of the data bases and checks all 255 copied numbers.
- **Uncertainty**: the same boundaries are computed with Robie & Hemingway
  (1995, Gibbs energies with their stated uncertainties, propagated as
  independent) and with phreeqc.dat. The spread is large for feldspars and
  clays (for K-feldspar log K differs by 2.4 between data sets; the
  gibbsite–kaolinite boundary moves from log a(H₄SiO₄) −5.1 to −4.35), small
  for quartz. The page shows this table.
- **Water**: free ions, silicic acid (two dissociations), carbonate; pH from
  the charge balance at a fixed CO₂ pressure, or given. No ion pairs.
- **Reaction path**: the primary mineral dissolves irreversibly; Al goes into
  the most stable secondary mineral(s) (one, two on a boundary, three at a
  triple point), Fe(II) is oxidised to goethite, the rest stays in the water;
  the path stops when the water reaches equilibrium with the primary
  mineral. Mg silicates, opal and calcite are only reported as saturated, not
  precipitated.
- **Diagrams**: in the K, Na, Ca systems each mineral is written per Al atom;
  the stable one needs the least dissolved Al. Fields are polygons clipped
  from these linear inequalities. The Mg system uses solubility lines.
- **Rates**: Palandri & Kharaka (2004) acid, neutral and basic mechanisms
  with Arrhenius temperature terms; a shrinking sphere gives the lifetime
  (molar volumes from Robie & Hemingway).

Left out, on purpose (see the page): Al and Fe complexes with organic acids
(podzols), solid solutions (real plagioclase and biotite are shown by end
members), precipitation kinetics of secondary minerals, sorption.

## Run locally

```bash
python3 -m http.server 9427 --directory site
# open http://localhost:9427/
```

or with Docker (the same image as for deployment):

```bash
docker build -t outils-geo .
docker run --rm -p 9428:8080 outils-geo
# open http://localhost:9428/   (the container listens on $PORT, default 8080)
```

All paths inside the site are relative and routing uses the hash only, so
it also works from a sub-path and needs no server rewrite rules.

## Tests

```bash
npm test               # unit tests, plain Node (no dependencies)
npm i && npm run e2e   # browser checks with Playwright, BASE=http://localhost:9427 by default
```

- `tests/router.test.mjs`: routes `#/<tab>?<state>` read and written back,
  in-page anchors are not routes, empty and unknown routes fall back to the
  first tab, tab-bar keys, the tab registry (unique ids, FR and EN labels,
  files exist).
- `tests/formula.test.mjs`: formula parsing (groups, decimals, hydrates,
  charges), textbook reactions with their usual coefficients, every step of
  every mineral balances uniquely.
- `tests/thermo.test.mjs`: copied 25 °C values, temperature functions, quartz
  6.0 mg/L and amorphous silica 115 mg/L at 25 °C (Hem 1985), Robie &
  Hemingway log K by hand, phreeqc.dat rewritten with Al³⁺, data-set spread.
- `tests/water.test.mjs`: rain pH 5.65 at 25 °C and 5.60 at 0 °C (Hem 1985),
  charge balance, the Sierra Nevada spring water in the kaolinite field
  (Feth et al. 1964), the K-feldspar path, mass balance along the path,
  anorthite and quartz cases.
- `tests/diagram-kinetics.test.mjs`: fields tile the diagram for every system,
  data set and temperature; boundaries equal the hand-written equilibria;
  Pédro's 10⁻⁴·⁷ M limit lies between the data sets; rate constants,
  Arrhenius, shrinking-sphere formula, the broad Goldich order.
- `tests/rocks.test.mjs`: the key has no structural problem; the checker
  catches the errors of the source key (duplicate ids, missing node, loop,
  unreachable rock, unsourced answer); every rock reached in at most seven
  questions; known paths; granite, gabbro, diorite and peridotite never
  under “foliated”; greenschist and blueschist one result with a
  thin-section caveat; photos exist, are small and openly licensed; every
  source cited.
- `scripts/e2e.mjs`: screenshots (desktop and phone, light and dark, French
  and English, into `/tmp/geo-shots`); the tab bar (ARIA roles and links,
  keyboard, tab label and title in both languages, 44 px tab on a phone);
  routes (unknown route rewritten, back and forward restore the state,
  citation keeps the route, anchor URL, brand link); no request to another
  host, no cookies; scripted interaction (sliders by keyboard, every
  mineral, balance tables, measured water, presets, invalid input, systems,
  comparison, hover and tap read-out, time, route, language and theme);
  the rock key (several paths walked, back, crumbs, start again, route,
  look-alike links, every rock of the index opens its card and its photo
  loads, bad paths rewritten, French, dark theme, phone).
  Fails on any console error or horizontal overflow.

## Deploy

The site runs locally only, either way from "Run locally":

- `npm run serve`, then open <http://localhost:9427/>;
- or the container: `docker build -t outils-geo .` and `docker run --rm -p 8080:8080 outils-geo`, then open
  <http://localhost:8080/>. The image is nginx with a strict content security policy
  (`deploy/default.conf.template`) and listens on `$PORT` (default 8080).

## Layout

```
site/
  index.html                       the one page: header, tab bar, panels
  app/main.js                      tab bar, panels, routing, in-page anchors
  app/router.js                    routes #/<tab>?<state> (no DOM, unit-tested)
  app/tabs.js                      the list of tabs
  assets/                          shell shared with outils-plantes (site.css, site.js, ui.js)
  tabs/weathering/css/             styles of the weathering tab
  tabs/weathering/js/formula.js    formulas, exact balancing
  tabs/weathering/js/thermo.js     data sets, log K(T), dissolution reactions
  tabs/weathering/js/water.js      speciation, activities, saturation
  tabs/weathering/js/path.js       reaction path
  tabs/weathering/js/diagram.js    stability fields and boundaries
  tabs/weathering/js/kinetics.js   rates, lifetimes
  tabs/weathering/js/minerals.js   starting minerals, steps, names, notes
  tabs/weathering/js/charts.js     our SVG drawings
  tabs/weathering/js/app.js        the tab: mount(), controls, rendering
  tabs/rocks/js/data.js            the key: questions, tests, rocks (FR/EN)
  tabs/rocks/js/sources.js         sources, keys compared, changes to the starting key
  tabs/rocks/js/photos.js          photo credits (Wikimedia Commons)
  tabs/rocks/js/walk.js            walking and checking the key (no DOM)
  tabs/rocks/js/drawings.js        our schematic SVG drawings
  tabs/rocks/js/app.js             the tab: mount(), one question at a time
  tabs/rocks/img/                  photos, resized WebP
deploy/default.conf.template nginx config
tests/                       node:test unit tests
scripts/                     e2e browser checks, data-base check
```

## Sources and respect

Texts and drawings are original (no copied text, code or figures). The
rock key's photos come from Wikimedia Commons (CC0, public domain, CC BY,
CC BY-SA), resized and recompressed, each with author, licence and link
under the photo and in the tab's credits list. Numbers
are copied from the sources listed in the tool, with unit conversions only
(kcal to kJ); our own calculations (reaction path, per-Al fields, lifetimes,
the words attached to the leaching slider) are labelled as such. The two
external comparisons are cited as data sets, not reproduced. Colours: an
earthy ordinal ramp for weathering stage (order and contrast checked in
both themes), two categorical colours for the silica chart (contrast
checked), the cyan mark for "your water"; field names are written
in the fields, so colour is never the only cue.
