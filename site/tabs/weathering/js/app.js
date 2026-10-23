// Silicate weathering tab: pick a mineral and the conditions, see the steps,
// the water, the stable secondary mineral, the stability diagram and the rate.
// Mounted by the one-page shell (site/app/main.js) into its tab panel; the
// state comes from and goes to the route (#/weathering?m=albite&xi=-2.6).
import { lang } from '../../../assets/site.js';
import { h, num, fmtn, citer } from '../../../assets/ui.js';
import { reaction, displayParts, fmtCoef, parse, plain } from './formula.js';
import { PHASES, logK, RH, R, T0, VOLUME, dissolution, aqK, protons } from './thermo.js';
import { speciate, logAlEq, satIndex, mgToMol, molToMg, MOLAR_MASS } from './water.js';
import { stateAt, endOfPath, pathPoints } from './path.js';
import { SYSTEMS, boundaries, point, silicaLines, boundarySigmaRH, stableAt } from './diagram.js';
import { activityDiagram, silicaChart, goldichChart, lifetimeChart, GOLDICH } from './charts.js';
import { rate, lifetimeYears, fractionDissolved, RATES } from './kinetics.js';
import { MINERALS, GROUPS, NAMES, SHORT, KINDS, EXTRA_FORMULA, byId } from './minerals.js';

const T = (en, fr) => (lang() === 'fr' ? fr : en);
const f = (v, d = 1) => fmtn(v, lang(), d);
const tr = (o) => (o ? o[lang()] ?? o.en : '');
const nm = (id) => tr(NAMES[id]) || id;
const shortName = (id) => tr(SHORT[id]) || nm(id);
// As a weathering product, the mica field stands for illite.
const prodName = (id) => (id === 'muscovite' && S.m !== 'muscovite' ? T('illite (as muscovite)', 'illite (comme muscovite)') : nm(id));
const sig = (v, n = 2) => {
  if (!Number.isFinite(v) || v === 0) return f(0, 0);
  const d = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))));
  return f(v, Math.min(d, 6));
};
const minus = (s) => String(s).replace(/^-/, '−');

// ---------------------------------------------------------------- sources
const SOURCES = [
  { id: 'llnl', text: 'llnl.dat, thermodynamic data base distributed with PHREEQC version 3 (U.S. Geological Survey), converted from thermo.com.V8.R6.230 prepared by J. Johnson at Lawrence Livermore National Laboratory. Equilibrium constants (log_k at 25 °C and their temperature functions), the B-dot activity model and ion sizes.', url: 'https://github.com/usgs-coupled/phreeqc3/blob/master/database/llnl.dat' },
  { id: 'gwb', text: 'thermo.com.V8.R6+ (Lawrence Livermore data set in Geochemist’s Workbench format, the same data as llnl.dat): per-mineral references show that most silicate data come from Helgeson et al. (1978, American Journal of Science 278-A) through SUPCRT92, gibbsite from Pokrovskii & Helgeson (1995), and the beidellites (smectites) from estimates by Wolery (1978).', url: 'https://www.gwb.com/data/thermo.com.V8.R6+.tdat' },
  { id: 'phreeqc', text: 'Parkhurst, D.L. & Appelo, C.A.J. (2013) Description of input and examples for PHREEQC version 3. USGS Techniques and Methods 6-A43. The program for which llnl.dat and phreeqc.dat are written.', url: 'https://pubs.usgs.gov/tm/06/a43/' },
  { id: 'pqdat', text: 'phreeqc.dat, the default data base of PHREEQC version 3 (U.S. Geological Survey); mineral constants used here as an independent comparison (aluminate constant log K −22.7).', url: 'https://github.com/usgs-coupled/phreeqc3/blob/master/database/phreeqc.dat' },
  { id: 'rh', text: 'Robie, R.A. & Hemingway, B.S. (1995) Thermodynamic properties of minerals and related substances at 298.15 K and 1 bar pressure and at higher temperatures. USGS Bulletin 2131. Gibbs energies and enthalpies of formation with their uncertainties, molar volumes (summary tables pp. 5–39).', url: 'https://pubs.usgs.gov/bul/2131/report.pdf' },
  { id: 'pk', text: 'Palandri, J.L. & Kharaka, Y.K. (2004) A compilation of rate parameters of water-mineral interaction kinetics for application to geochemical modeling. USGS Open-File Report 2004-1068. Rate equation (eqn. 9) and parameters (Tables 4, 13, 15, 23, 26–29, 32); quartz precipitation is very slow at low supersaturation (p. 7).', url: 'https://pubs.usgs.gov/of/2004/1068/pdf/OFR_2004_1068.pdf' },
  { id: 'wb', text: 'White, A.F. & Brantley, S.L. (2003) The effect of time on the weathering of silicate minerals: why do weathering rates differ in the laboratory and field? Chemical Geology 202, 479–506. Laboratory rates are commonly two to four orders of magnitude faster than field rates.', url: 'https://doi.org/10.1016/j.chemgeo.2003.03.001' },
  { id: 'goldich', text: 'Goldich, S.S. (1938) A study in rock-weathering. Journal of Geology 46, 17–58. The original stability series.', url: 'https://doi.org/10.1086/624619' },
  { id: 'wiki', text: 'Wikipedia, “Goldich dissolution series” (CC BY-SA): summary of the series, its link with Bowen’s reaction series, and its limits.', url: 'https://en.wikipedia.org/wiki/Goldich_dissolution_series' },
  { id: 'serc', text: 'SERC, Carleton College: summary of Goldich (1938), noting that biotite weathers faster than its place in the series predicts.', url: 'https://serc.carleton.edu/resources/896.html' },
  { id: 'hem', text: 'Hem, J.D. (1985) Study and interpretation of the chemical characteristics of natural water, 3rd ed. USGS Water-Supply Paper 2254. Soil air 10 to 100 times richer in CO₂ than air (pp. 33, 93); rain pH near 5.6 (p. 63); quartz 6.0 mg/L and amorphous silica 115 mg/L at 25 °C, silicic acid half dissociated at pH 9.4–9.9, usual silica 1–30 mg/L (pp. 72–73).', url: 'https://pubs.usgs.gov/wsp/wsp2254/pdf/wsp2254a.pdf' },
  { id: 'noaa', text: 'NOAA Global Monitoring Laboratory, global annual mean CO₂: 425.62 ppm in 2025 (provisional).', url: 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_gl.txt' },
  { id: 'feth', text: 'Feth, J.H., Roberson, C.E. & Polzer, W.L. (1964) Sources of mineral constituents in water from granitic rocks, Sierra Nevada, California and Nevada. USGS Water-Supply Paper 1535-I. Table 2 (p. I16): mean composition of ephemeral and perennial springs; the spring water is stable with respect to kaolinite (p. I2).', url: 'https://pubs.usgs.gov/wsp/1535i/report.pdf' },
  { id: 'pedro', text: 'Pédro, G., “Pédologie expérimentale et recherches sur les argiles”, in Mélanges Hénin (ORSTOM/IRD), Tableau I p. 23: total hydrolysis (allitisation, gibbsite) when SiO₂ < 10⁻⁴·⁷ M; partial hydrolysis above (monosiallitisation, kaolinite; bisiallitisation, 2:1 clays). After Pédro (1968), Revue de Géographie Physique et de Géologie Dynamique 10, 457–470.', url: 'https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers07/38515.pdf' },
  { id: 'volkoff', text: 'Volkoff, B. (1998) Red and lateritic soils: world scenario (IRD Horizon). P. 58: gibbsite in strongly leached, kaolinite in moderately leached, smectites in less leached environments.', url: 'https://horizon.documentation.ird.fr/exl-doc/pleins_textes/pleins_textes_7/b_fdi_51-52/010015208.pdf' },
  { id: 'price', text: 'Price, J.R. & Velbel, M.A. (2014) Rates of biotite weathering, and clay mineral transformation and neoformation, determined from watershed geochemical mass-balance methods. Aquatic Geochemistry, doi:10.1007/s10498-013-9190-y (author copy, USDA Forest Service). Interlayer K exchanged for hydrated cations, with oxidation of octahedral Fe²⁺; further weathering to kaolin minerals and gibbsite; K release for plants.', url: 'https://research.fs.usda.gov/treesearch/download/44392.pdf' },
  { id: 'delvigne', text: 'Delvigne, J., Bisdom, E.B.A., Sleeman, J. & Stoops, G. (1979) Olivines, their pseudomorphs and secondary products. Pédologie 29, 247–309 (IRD Horizon). Olivine among the least stable silicates; iron hydroxides under good drainage, smectite where Si and Mg stay; iddingsite (pp. 248–260).', url: 'https://horizon.documentation.ird.fr/exl-doc/pleins_textes/pleins_textes_5/b_fdi_08-09/10020.pdf' },
  { id: 'colin', text: 'Colin, F., Noack, Y., Trescases, J.-J. & Nahon, D. (1985) L’altération latéritique débutante des pyroxénites de Jacuba, Niquelândia, Brésil. Clay Minerals 20, 93–113 (IRD Horizon). Pyroxenes weather to smectite (saponite) and talc, with goethite.', url: 'https://horizon.documentation.ird.fr/exl-doc/pleins_textes/pleins_textes_6/b_fdi_39-40/43392.pdf' },
  { id: 'illite', text: 'USGS Open-File Report 01-041, A laboratory manual for X-ray powder diffraction, “Illite group”: illite is structurally similar to muscovite with slightly less interlayer K, forms from feldspar weathering and muscovite degradation, favoured by high Al and K.', url: 'https://pubs.usgs.gov/of/2001/of01-041/htmldocs/clays/illite.htm' },
  { id: 'bauxite', text: 'Patterson, S.H., Descriptive model of laterite type bauxite deposits (Model 38b), USGS Bulletin 1693: mainly gibbsite; intensive weathering on well-drained plateaus in warm, wet climates.', url: 'https://pubs.usgs.gov/bul/b1693/html/bull21ut.htm' },
  { id: 'earle', text: 'Earle, S. (2019) Physical Geology, 2nd ed., BCcampus (CC BY 4.0), section 5.2 Chemical weathering: carbonic acid; quartz virtually unaffected, feldspar easily altered; weathering greatest in warm, wet climates; more CO₂ in soil than in air.', url: 'https://opentextbc.ca/physicalgeology2ed/chapter/5-2-chemical-weathering/' },
];
const { cite, list } = citer(SOURCES, 'w-');

// ---------------------------------------------------------------- state
const DEFAULTS = { m: 'K-feldspar', t: 15, mode: 'path', xi: -4, acid: 'co2', pco2: -2, ph: 5.5, sio2: 16.4, k: 1.09, na: 3.03, ca: 3.11, mg: 0.7, hco3: 20, wph: 6.2, sys: '', cmp: '', yr: 10000, d: 1 };
const S = { ...DEFAULTS };
let ctx = null; // {root, setParams} from the shell
function readParams(p) {
  Object.assign(S, DEFAULTS);
  for (const k of Object.keys(DEFAULTS)) {
    if (!p.has(k)) continue;
    const v = p.get(k);
    S[k] = typeof DEFAULTS[k] === 'number' ? (Number.isFinite(Number(v)) ? Number(v) : DEFAULTS[k]) : v;
  }
  if (!byId(S.m)) S.m = DEFAULTS.m;
  if (!['path', 'water'].includes(S.mode)) S.mode = 'path';
  if (!['co2', 'ph'].includes(S.acid)) S.acid = 'co2';
  if (S.sys && !SYSTEMS[S.sys]) S.sys = '';
  if (!['', 'rh', 'pq'].includes(S.cmp)) S.cmp = '';
}
function writeParams() {
  const p = new URLSearchParams();
  for (const k of Object.keys(DEFAULTS)) if (S[k] !== DEFAULTS[k]) p.set(k, String(S[k]));
  ctx.setParams(p);
}

const mineral = () => byId(S.m);
const defaultSys = (m) => (m.system === 'Fe' || m.system === 'Si' ? 'K' : m.system);
const sysKey = () => S.sys || defaultSys(mineral());

// ---------------------------------------------------------------- formulas and reactions in HTML
function fml(formula) {
  const span = h('span', { class: 'fml' });
  for (const p of displayParts(formula)) span.append(p.sub ? h('sub', { text: p.t }) : p.sup ? h('sup', { text: p.t }) : p.small ? h('small', { text: p.t }) : p.t);
  return span;
}
function rxnNode(r) {
  const side = (terms) => terms.flatMap((t, i) => [i ? h('span', { class: 'op', text: '+' }) : null,
    h('span', { class: 'sp' }, Number(t.c) !== 1 ? h('span', { class: 'co', text: fmtCoef(t.c, lang()) }) : null, fml(t.f))]);
  return h('p', { class: 'rxn' }, ...side(r.left), h('span', { class: 'arrow', 'aria-label': T('gives', 'donne'), text: '→' }), ...side(r.right));
}
function balanceTable(r) {
  const val = (q) => fmtCoef(q, lang());
  return h('details', { class: 'bal-d' }, h('summary', { text: T('Mass and charge balance', 'Bilan de masse et de charge') }),
    h('table', { class: 'bal' },
      h('thead', {}, h('tr', {}, h('th', { text: T('Element', 'Élément') }), h('th', { text: T('left', 'gauche') }), h('th', { text: T('right', 'droite') }), h('th', { text: '' }))),
      h('tbody', {},
        ...r.check.rows.map((row) => h('tr', {}, h('td', { text: row.el }), h('td', { text: val(row.left) }), h('td', { text: val(row.right) }), h('td', { class: row.ok ? 'ok' : 'msg error', text: row.ok ? '✓' : '✗' }))),
        h('tr', {}, h('td', { text: T('charge', 'charge') }), h('td', { text: val(r.check.charge.left) }), h('td', { text: val(r.check.charge.right) }), h('td', { class: r.check.charge.ok ? 'ok' : 'msg error', text: r.check.charge.ok ? '✓' : '✗' })))),
    h('p', { class: 'hint', text: T('Coefficients are computed by solving the element and charge balance exactly (fractions), not typed by hand.', 'Les coefficients sont calculés en résolvant exactement le bilan des éléments et des charges (en fractions), pas recopiés à la main.') }));
}

// ---------------------------------------------------------------- calculations
const AL_ALL = ['gibbsite', 'kaolinite', 'muscovite', 'beidellite-Na', 'beidellite-Ca', 'beidellite-Mg', 'K-feldspar', 'albite', 'anorthite'];
const WATCH = ['quartz', 'SiO2(am)', 'chrysotile', 'talc', 'sepiolite', 'calcite'];
const AW = { K: 39.098, Na: 22.990, Ca: 40.078, Mg: 24.305, Fe: 55.845, Al: 26.982, Si: 28.086, O: 15.999, H: 1.008, C: 12.011 };
const molarMass = (formula) => Object.entries(parse(formula).el).reduce((s, [e, v]) => s + AW[e] * Number(v), 0);

const acidOpts = () => (S.acid === 'co2' ? { tC: S.t, logPCO2: S.pco2 } : { tC: S.t, pH: S.ph });

let pathCache = { key: '', data: null };
let endCache = { key: '', end: NaN };
function pathData() {
  const m = mineral();
  const key = [m.phase, S.t, S.acid, S.pco2, S.ph].join('|');
  if (pathCache.key !== key) pathCache = { key, data: pathPoints(m.phase, acidOpts(), { from: -7, to: -1, n: 49 }) };
  return pathCache.data;
}

function currentWater() {
  const m = mineral();
  if (S.mode === 'path') {
    const ekey = [m.phase, S.t, S.acid, S.pco2, S.ph].join('|');
    if (endCache.key !== ekey) endCache = { key: ekey, end: endOfPath(m.phase, acidOpts()) };
    const end = endCache.end;
    const xi = Math.min(10 ** S.xi, end);
    const st = stateAt(m.phase, xi, acidOpts());
    return { kind: 'path', st, sp: st.sp, saturated: 10 ** S.xi >= end, end, xi };
  }
  const tot = { Si: mgToMol(S.sio2, 'SiO2'), K: mgToMol(S.k, 'K'), Na: mgToMol(S.na, 'Na'), Ca: mgToMol(S.ca, 'Ca'), Mg: mgToMol(S.mg, 'Mg'), HCO3: mgToMol(S.hco3, 'HCO3') };
  const sp = speciate(tot, { tC: S.t, pH: S.wph });
  const A = Object.fromEntries(AL_ALL.map((id) => [id, logAlEq(id, sp.la, S.t)]));
  const best = AL_ALL.reduce((a, b) => (A[b] < A[a] ? b : a));
  const si = Object.fromEntries(WATCH.map((id) => [id, satIndex(id, sp.la, S.t)]));
  return { kind: 'water', sp, stable: best, laAl: A[best], si, tot };
}

// ---------------------------------------------------------------- page
const out = {};

function rangeRow({ id, label, min, max, step, value, onInput, valText, ends }) {
  const input = h('input', { id, type: 'range', min, max, step, value: String(value), 'aria-label': label });
  const val = h('span', { class: 'val', 'aria-live': 'polite' });
  const upd = () => { val.textContent = valText(Number(input.value)); };
  input.addEventListener('input', () => { onInput(Number(input.value)); upd(); });
  upd();
  return h('div', { class: 'range-row' }, h('label', { for: id, class: 'field-label', text: label }), input, val,
    ends ? h('div', { class: 'range-ends', 'aria-hidden': 'true' }, h('span', { text: ends[0] }), h('span', { text: ends[1] })) : null);
}

const leachWord = (lx) => (lx <= -5.5 ? T('very intense leaching', 'lessivage très intense') : lx <= -4.5 ? T('intense leaching', 'lessivage intense') : lx <= -3.5 ? T('moderate leaching', 'lessivage modéré') : lx <= -2.5 ? T('weak leaching, slow drainage', 'lessivage faible, drainage lent') : T('almost stagnant water', 'eau presque stagnante'));
const pco2Text = (l) => {
  const ppm = 10 ** l * 1e6;
  const air = ppm / 425.62;
  return `${minus(f(l, 1))} · ${ppm >= 10000 ? `${f(ppm / 10000, 1)} %` : `${f(ppm, 0)} ppm`} · ${air < 1.15 ? T('about the air', 'environ l’air') : T(`${f(air, 0)}× the air`, `${f(air, 0)} × l’air`)}`;
};

function numField(id, label, key, unit, onChange) {
  const input = h('input', { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', value: String(S[key]).replace('.', lang() === 'fr' ? ',' : '.') });
  input.addEventListener('input', () => {
    const v = num(input.value);
    const ok = Number.isFinite(v) && v >= 0 && (key !== 'wph' || (v >= 1 && v <= 13));
    input.setAttribute('aria-invalid', String(!ok));
    if (ok) { S[key] = v; onChange(); }
  });
  return h('div', { class: 'field' }, h('label', { for: id, text: label }), h('div', { class: 'field-in' }, input, unit ? h('span', { class: 'unit', text: unit, 'aria-hidden': 'true' }) : null));
}

function build() {
  const main = ctx.root;
  const m = mineral();
  // 1. mineral
  const sel = h('select', { id: 'w-mineral' },
    ...Object.entries(GROUPS).map(([g, gn]) => h('optgroup', { label: tr(gn) },
      ...MINERALS.filter((x) => x.group === g).map((x) => h('option', { value: x.id, text: nm(x.id), selected: x.id === S.m })))));
  sel.addEventListener('change', () => { S.m = sel.value; S.sys = ''; pathCache.key = ''; build(); });
  out.formula = h('p', { class: 'small muted' });

  // 2. conditions
  const temp = rangeRow({ id: 'w-temp', label: T('Temperature of the water', 'Température de l’eau'), min: 0, max: 40, step: 1, value: S.t, onInput: (v) => { S.t = v; schedule(); }, valText: (v) => `${f(v, 0)} °C`, ends: ['0 °C', '40 °C'] });
  const modeRadios = h('fieldset', { class: 'opt' }, h('legend', { text: T('The water', 'L’eau') }),
    h('div', { class: 'radio-row' },
      ...[['path', T('made by this mineral alone', 'faite par ce minéral seul')], ['water', T('a water I know (analysis)', 'une eau connue (analyse)')]].map(([v, lbl]) =>
        h('label', {}, h('input', { type: 'radio', name: 'w-mode', value: v, checked: S.mode === v, onchange: () => { S.mode = v; build(); } }), lbl))));
  const pathPanel = h('div', { class: 'mode-panel', hidden: S.mode !== 'path' },
    rangeRow({ id: 'w-xi', label: T('How much mineral each litre of water dissolves before it drains away', 'Quantité de minéral dissoute par litre d’eau avant qu’elle ne s’écoule'), min: -7, max: -1, step: 0.1, value: S.xi,
      onInput: (v) => { S.xi = v; schedule(); },
      valText: (v) => { const mg = 10 ** v * molarMass(PHASES[m.phase].f) * 1000; return `${leachWord(v)} · ${sig(10 ** v * 1e6, 2)} µmol/L ≈ ${sig(mg, 2)} mg/L`; },
      ends: [T('heavy rain, fast drainage', 'forte pluie, drainage rapide'), T('dry, slow drainage', 'sec, drainage lent')] }),
    h('p', { class: 'hint', text: T('This is the reaction progress: the longer water stays in contact with the mineral, the more it dissolves. Rainfall, drainage and time set it together; the words are a rough guide, not a measurement.', 'C’est l’avancement de la réaction : plus l’eau reste au contact du minéral, plus elle en dissout. Pluie, drainage et durée le fixent ensemble ; les mots sont un repère grossier, pas une mesure.') }),
    h('fieldset', { class: 'opt' }, h('legend', { text: T('What sets the acidity', 'Ce qui fixe l’acidité') }),
      h('div', { class: 'radio-row' },
        ...[['co2', T('CO₂ of the soil air', 'le CO₂ de l’air du sol')], ['ph', T('a fixed pH (e.g. organic acids)', 'un pH fixé (p. ex. acides organiques)')]].map(([v, lbl]) =>
          h('label', {}, h('input', { type: 'radio', name: 'w-acid', value: v, checked: S.acid === v, onchange: () => { S.acid = v; build(); } }), lbl)))),
    S.acid === 'co2'
      ? h('div', {}, rangeRow({ id: 'w-pco2', label: T('CO₂ pressure, log(atm)', 'Pression de CO₂, log(atm)'), min: -3.4, max: -1, step: 0.1, value: S.pco2, onInput: (v) => { S.pco2 = v; schedule(); }, valText: pco2Text, ends: [T('air', 'air'), T('10 % CO₂', '10 % de CO₂')] }),
        h('p', { class: 'hint' }, T('Air holds about 426 ppm CO₂; soil air is commonly 10 to 100 times richer, because roots and microbes breathe. The pH then follows from the balance between carbonic acid and the cations released.', 'L’air contient environ 426 ppm de CO₂ ; l’air du sol en contient souvent 10 à 100 fois plus, car racines et microbes respirent. Le pH découle alors de l’équilibre entre l’acide carbonique et les cations libérés.'), ' ', ...cite('noaa', 'hem')))
      : rangeRow({ id: 'w-ph', label: 'pH', min: 3, max: 9, step: 0.1, value: S.ph, onInput: (v) => { S.ph = v; schedule(); }, valText: (v) => f(v, 1), ends: ['3', '9'] }));
  const presets = [
    ['eph', T('Sierra Nevada, ephemeral springs', 'Sierra Nevada, sources temporaires'), { sio2: 16.4, k: 1.09, na: 3.03, ca: 3.11, mg: 0.7, hco3: 20, wph: 6.2 }],
    ['per', T('Sierra Nevada, perennial springs', 'Sierra Nevada, sources pérennes'), { sio2: 24.6, k: 1.57, na: 5.95, ca: 10.4, mg: 1.7, hco3: 54.6, wph: 6.8 }],
  ];
  const waterPanel = h('div', { class: 'mode-panel', hidden: S.mode !== 'water' },
    h('p', { class: 'hint' }, T('Measured waters from granite (mean of each group, median pH):', 'Eaux mesurées sur granite (moyenne de chaque groupe, pH médian) :'), ' ', ...cite('feth')),
    h('div', { class: 'presets' }, ...presets.map(([id, lbl, vals]) => h('button', { type: 'button', id: `w-preset-${id}`, text: lbl, onclick: () => { Object.assign(S, vals); build(); } }))),
    h('div', { class: 'fields' },
      numField('w-sio2', 'SiO₂', 'sio2', 'mg/L', update), numField('w-k', 'K⁺', 'k', 'mg/L', update), numField('w-na', 'Na⁺', 'na', 'mg/L', update),
      numField('w-ca', 'Ca²⁺', 'ca', 'mg/L', update), numField('w-mg', 'Mg²⁺', 'mg', 'mg/L', update), numField('w-hco3', 'HCO₃⁻', 'hco3', 'mg/L', update), numField('w-wph', 'pH', 'wph', '', update)),
    h('p', { class: 'hint', text: T('mg/L are taken as mg per kg of water (dilute water). Silica is given as SiO₂, as in most analyses.', 'Les mg/L sont pris comme mg par kg d’eau (eau diluée). La silice est donnée en SiO₂, comme dans la plupart des analyses.') }));

  // 3. result, steps, diagram, kinetics
  out.hero = h('p', { class: 'hero', id: 'w-result' });
  out.sub = h('p', { class: 'sub' });
  out.regime = h('p', { class: 'regime' });
  out.water = h('tbody');
  out.notes = h('ul', { class: 'notes' });
  out.steps = h('ol', { class: 'steps-list', id: 'w-steps' });
  out.diag = h('div', { id: 'w-diagram' });
  out.diagLegend = h('ul', { class: 'legend' });
  out.diagNote = h('p', { class: 'small muted' });
  out.bounds = h('tbody');
  out.unc = h('tbody');
  out.kin = h('div');
  out.goldich = h('div', { class: 'chart' });
  out.life = h('div', { class: 'chart' });
  out.quartz = h('section', { class: 'card wide', id: 'w-quartz', hidden: m.id !== 'quartz' });

  const sysBtns = h('div', { class: 'seg sys', role: 'group', 'aria-label': T('System', 'Système'), id: 'w-sys' },
    ...Object.keys(SYSTEMS).map((k) => h('button', { type: 'button', 'aria-pressed': String(sysKey() === k), 'data-sys': k, text: k,
      onclick: () => { S.sys = k; ctx.root.querySelectorAll('#w-sys button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sys === k))); update(); } })));
  const cmpSel = h('select', { id: 'w-cmp' },
    ...[['', T('no comparison', 'pas de comparaison')], ['rh', 'Robie & Hemingway (1995)'], ['pq', 'phreeqc.dat']].map(([v, l]) => h('option', { value: v, text: l, selected: S.cmp === v })));
  cmpSel.addEventListener('change', () => { S.cmp = cmpSel.value; update(); });

  const timeField = h('div', { class: 'fields' },
    numField('w-yr', T('Time', 'Durée'), 'yr', T('years', 'ans'), update),
    numField('w-d', T('Grain size', 'Taille du grain'), 'd', 'mm', update));

  main.replaceChildren(
    h('h1', { text: T('Silicate weathering', 'L’altération des silicates') }),
    h('p', { class: 'lead muted', text: T('At the surface, rain, carbonic acid and oxygen slowly take rocks apart. Choose a mineral and the conditions: see each step as a balanced reaction, what goes into the water, which clay or oxide is stable, and how fast it goes.', 'En surface, la pluie, l’acide carbonique et l’oxygène défont lentement les roches. Choisissez un minéral et les conditions : chaque étape en réaction équilibrée, ce qui part dans l’eau, quelle argile ou quel oxyde est stable, et à quelle vitesse.') }),
    h('div', { class: 'tool-cols' },
      h('section', { class: 'card' },
        h('h2', {}, h('span', { class: 'step', text: '1' }), T('Mineral and conditions', 'Minéral et conditions')),
        h('div', { class: 'fields' }, h('div', { class: 'field select' }, h('label', { for: 'w-mineral', text: T('Starting mineral', 'Minéral de départ') }), h('div', { class: 'field-in' }, sel))),
        out.formula, temp, modeRadios, pathPanel, waterPanel),
      h('section', { class: 'card', 'aria-live': 'polite' },
        h('h2', { text: T('Under these conditions', 'Dans ces conditions') }),
        out.hero, out.sub, out.regime,
        h('table', { class: 'water' }, h('caption', { class: 'visually-hidden', text: T('The water', 'L’eau') }), out.water),
        out.notes)),
    h('section', { class: 'card' },
      h('h2', {}, h('span', { class: 'step', text: '2' }), T('The steps', 'Les étapes')),
      h('p', { class: 'small muted' }, T('Highlighted: the step that matches the stable product under your conditions. Each reaction is balanced for atoms and charge.', 'En surbrillance : l’étape qui correspond au produit stable dans vos conditions. Chaque réaction est équilibrée en atomes et en charges.')),
      out.steps),
    h('section', { class: 'card' },
      h('h2', {}, h('span', { class: 'step', text: '3' }), T('Stability diagram', 'Diagramme de stabilité')),
      h('p', { class: 'small muted' }, T('Which mineral is stable depends on the water: its silica (across) and its cations relative to its acidity (up). Fields are computed from equilibrium constants at your temperature. Your water is the cyan point; the line is the path of a water dissolving the mineral, step by step.', 'Le minéral stable dépend de l’eau : sa silice (en abscisse) et ses cations rapportés à son acidité (en ordonnée). Les domaines sont calculés à partir des constantes d’équilibre à votre température. Votre eau est le point cyan ; la ligne est le chemin d’une eau qui dissout le minéral, pas à pas.'), ' ', ...cite('llnl')),
      h('div', { class: 'ctrl-row' }, h('div', {}, h('span', { class: 'field-label', text: T('Cations', 'Cations') }), sysBtns),
        h('div', { class: 'field' }, h('label', { for: 'w-cmp', text: T('Compare boundaries with', 'Comparer les limites avec') }), h('div', { class: 'field-in' }, cmpSel))),
      out.diag, out.diagLegend, out.diagNote,
      h('details', { class: 'more' }, h('summary', { text: T('The boundaries as equations', 'Les limites en équations') }),
        h('div', { class: 'table-scroll' }, h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', { text: T('Between', 'Entre') }), h('th', { text: T('Line', 'Droite') }), h('th', { text: T('Reaction', 'Réaction') }))), out.bounds))),
      h('details', { class: 'more', id: 'w-unc' }, h('summary', { text: T('Data and uncertainty', 'Données et incertitude') }),
        h('p', { class: 'small' }, T('Main data: llnl.dat (PHREEQC 3). Most of its silicate data come from Helgeson et al. (1978) through SUPCRT92; the smectites are estimates, the least certain values here. log K at 25 °C is the tabulated value; its change with temperature comes from the fitted function of the file. Activities use the B-dot model of the same file; ion pairs are ignored.', 'Données principales : llnl.dat (PHREEQC 3). La plupart de ses données de silicates viennent de Helgeson et al. (1978) via SUPCRT92 ; les smectites sont des estimations, les valeurs les moins sûres ici. Le log K à 25 °C est la valeur tabulée ; sa variation avec la température vient de la fonction ajustée du fichier. Les activités suivent le modèle B-dot du même fichier ; les paires d’ions sont négligées.'), ' ', ...cite('llnl', 'gwb', 'phreeqc')),
        h('p', { class: 'small' }, T('How sure is a boundary? Below, its position with three independent data sets. For Robie & Hemingway, ± is one standard deviation propagated from their stated uncertainties (taken as independent). Clay minerals are the least certain: their real composition varies, and smectites are not in Robie & Hemingway.', 'Quelle confiance accorder à une limite ? Ci-dessous, sa position avec trois jeux de données indépendants. Pour Robie & Hemingway, ± est un écart-type propagé depuis leurs incertitudes (supposées indépendantes). Les argiles sont les moins sûres : leur composition réelle varie, et les smectites ne figurent pas chez Robie & Hemingway.'), ' ', ...cite('rh', 'pqdat')),
        h('div', { class: 'table-scroll' }, h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', { text: T('Boundary', 'Limite') }), h('th', { text: T('Position at 25 °C', 'Position à 25 °C') }), h('th', { text: 'llnl.dat' }), h('th', { text: 'Robie & Hemingway' }), h('th', { text: 'phreeqc.dat' }))), out.unc)))),
    h('section', { class: 'card' },
      h('h2', {}, h('span', { class: 'step', text: '4' }), T('How fast?', 'À quelle vitesse ?')),
      h('div', { class: 'two' },
        h('div', {}, timeField, out.kin),
        h('div', {}, h('h3', { text: T('Goldich stability series', 'Série de stabilité de Goldich') }),
          h('p', { class: 'small muted' }, T('From the study of weathered rocks: minerals that crystallise first from a magma, at high temperature, weather first at the surface.', 'D’après l’étude de roches altérées : les minéraux qui cristallisent les premiers dans un magma, à haute température, s’altèrent les premiers en surface.'), ' ', ...cite('goldich', 'wiki')),
          out.goldich)),
      h('h3', { text: T('Laboratory lifetime of a 1 mm grain, at your pH and temperature', 'Durée de vie au laboratoire d’un grain de 1 mm, à votre pH et votre température') }),
      out.life,
      h('p', { class: 'small muted' }, T('Computed from the laboratory rate laws; in soils, grains last far longer (see the note on the left). Lab rates broadly follow Goldich, with exceptions: here enstatite comes out slow, and biotite in nature weathers faster than its place in the series.', 'Calculé à partir des lois de vitesse de laboratoire ; dans les sols, les grains durent bien plus longtemps (voir la note à gauche). Les vitesses de laboratoire suivent en gros Goldich, avec des exceptions : ici l’enstatite paraît lente, et dans la nature la biotite s’altère plus vite que ne le dit sa place dans la série.'), ' ', ...cite('pk', 'serc'))),
    out.quartz,
    facts(),
    h('section', { class: 'card sources' }, h('h2', { text: 'Sources' }), list(),
      h('p', { class: 'small muted', text: T('Numbers are copied from the sources (energies in kJ/mol, kcal converted). The reaction path, the per-aluminium stability fields, the grain lifetimes and the drainage words are our own calculations from those numbers. Texts and drawings on this page are our own.', 'Les nombres sont repris des sources (énergies en kJ/mol, kcal convertis). Le chemin réactionnel, les domaines de stabilité par atome d’aluminium, les durées de vie des grains et les mots sur le drainage sont nos propres calculs à partir de ces nombres. Les textes et dessins de cette page sont les nôtres.') })));
  update();
}

function facts() {
  return h('section', { class: 'card' },
    h('h2', { text: T('Good to know', 'Bon à savoir') }),
    h('dl', { class: 'facts' },
      h('dt', { text: T('Does quartz turn into kaolinite?', 'Le quartz se transforme-t-il en kaolinite ?') }),
      h('dd', {}, T('No. Kaolinite is built from aluminium and silicon, and quartz has no aluminium. Quartz only dissolves, very slowly, into silicic acid; most of it stays as sand grains in soils. The aluminium of kaolinite comes from feldspars and micas. The silica dissolved from quartz does matter, though: it is part of the silica of the water, which decides between gibbsite, kaolinite and smectite.', 'Non. La kaolinite est faite d’aluminium et de silicium, et le quartz n’a pas d’aluminium. Le quartz se dissout seulement, très lentement, en acide silicique ; l’essentiel reste dans les sols sous forme de grains de sable. L’aluminium de la kaolinite vient des feldspaths et des micas. La silice dissoute du quartz compte pourtant : elle fait partie de la silice de l’eau, qui décide entre gibbsite, kaolinite et smectite.'), ' ', ...cite('earle', 'hem')),
      h('dt', { text: T('Three ways to lose silica', 'Trois façons de perdre la silice') }),
      h('dd', {}, T('French soil science names the three outcomes of hydrolysis: bisiallitisation (2:1 clays such as smectite, little leaching), monosiallitisation (kaolinite, moderate leaching) and allitisation (gibbsite, strong leaching). Pédro placed the limit for gibbsite at a silica concentration of about 10⁻⁴·⁷ mol/L; the diagram above puts the gibbsite–kaolinite boundary between 10⁻⁵·¹ and 10⁻⁴·³ depending on the data set.', 'La pédologie française nomme les trois issues de l’hydrolyse : bisiallitisation (argiles 2:1 comme la smectite, peu de lessivage), monosiallitisation (kaolinite, lessivage modéré) et allitisation (gibbsite, lessivage fort). Pédro place la limite de la gibbsite vers une concentration en silice de 10⁻⁴·⁷ mol/L ; le diagramme ci-dessus met la limite gibbsite–kaolinite entre 10⁻⁵·¹ et 10⁻⁴·³ selon le jeu de données.'), ' ', ...cite('pedro', 'volkoff', 'rh')),
      h('dt', { text: T('Illite and muscovite', 'Illite et muscovite') }),
      h('dd', {}, T('Illite, the common mica-like clay of soils, has a variable composition with a little less potassium than muscovite. Its thermodynamic data are uncertain, so the diagram uses muscovite for the mica field, as is usual.', 'L’illite, l’argile proche des micas fréquente dans les sols, a une composition variable avec un peu moins de potassium que la muscovite. Ses données thermodynamiques sont incertaines : le diagramme utilise la muscovite pour le domaine des micas, comme c’est l’usage.'), ' ', ...cite('illite')),
      h('dt', { text: T('Gibbsite, laterites and bauxite', 'Gibbsite, latérites et bauxite') }),
      h('dd', {}, T('Where weathering is intense and long, on well-drained land in warm, wet climates, even kaolinite loses its silica: gibbsite accumulates and can form bauxite, the ore of aluminium.', 'Là où l’altération est intense et longue, sur des terrains bien drainés en climat chaud et humide, même la kaolinite perd sa silice : la gibbsite s’accumule et peut former de la bauxite, le minerai d’aluminium.'), ' ', ...cite('bauxite')),
      h('dt', { text: T('Biotite, vermiculite and potassium for plants', 'Biotite, vermiculite et potassium des plantes') }),
      h('dd', {}, T('Biotite first swaps the potassium between its sheets for hydrated magnesium or calcium, while its iron oxidises: this gives vermiculite and releases potassium, a major plant nutrient. Further weathering leads to kaolinite and gibbsite.', 'La biotite échange d’abord le potassium entre ses feuillets contre du magnésium ou du calcium hydratés, tandis que son fer s’oxyde : cela donne la vermiculite et libère du potassium, un nutriment majeur des plantes. Une altération plus poussée mène à la kaolinite et à la gibbsite.'), ' ', ...cite('price')),
      h('dt', { text: T('Olivine and pyroxene', 'Olivine et pyroxène') }),
      h('dd', {}, T('With good drainage olivine leaves iron oxides; where silica and magnesium stay, smectite forms; iddingsite is a mixture of goethite and clay that replaces olivine. Pyroxenes give smectite (saponite) and talc, with goethite. This page models only the dissolution and reports when the water becomes saturated with talc, sepiolite or serpentine.', 'Avec un bon drainage l’olivine laisse des oxydes de fer ; là où silice et magnésium restent, une smectite se forme ; l’iddingsite est un mélange de goethite et d’argile qui remplace l’olivine. Les pyroxènes donnent smectite (saponite) et talc, avec de la goethite. Cette page modélise seulement la dissolution et signale quand l’eau devient saturée en talc, sépiolite ou serpentine.'), ' ', ...cite('delvigne', 'colin')),
      h('dt', { text: T('What the model leaves out', 'Ce que le modèle laisse de côté') }),
      h('dd', {}, T('Aluminium is assumed to stay in the solids; complexes with organic acids, which move aluminium and iron in podzols, are not included. Mixed minerals (a real plagioclase, an iron-magnesium biotite) are shown by their end members. Rates are for fresh surfaces far from equilibrium.', 'L’aluminium est supposé rester dans les solides ; les complexes avec les acides organiques, qui déplacent aluminium et fer dans les podzols, ne sont pas pris en compte. Les minéraux mixtes (un vrai plagioclase, une biotite fer-magnésium) sont représentés par leurs pôles purs. Les vitesses valent pour des surfaces fraîches loin de l’équilibre.'))));
}

// ---------------------------------------------------------------- updates
let pathTimer = 0;
let raf = 0;
// Sliders fire many events: coalesce them into one update per frame.
function schedule() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); }
function update() {
  writeParams();
  const m = mineral();
  const W = currentWater();
  out.formula.replaceChildren(T('Formula: ', 'Formule : '), fml(PHASES[m.phase].f), m.id === 'phlogopite' || m.id === 'annite' ? ` · ${T('real biotite lies between phlogopite and annite', 'une vraie biotite est entre phlogopite et annite')}` : '');
  renderResult(m, W);
  renderSteps(m, W);
  renderDiagram(m, W, false);
  clearTimeout(pathTimer);
  if (S.mode === 'path') pathTimer = setTimeout(() => renderDiagram(m, currentWater(), true), 60);
  renderKinetics(m, W);
  renderQuartz(m, W);
}

function stableSet(m, W) {
  if (W.kind === 'path') return W.st.assemblage ?? [];
  return [W.stable];
}

function renderResult(m, W) {
  const sp = W.sp;
  const set = stableSet(m, W);
  const hasAl = PHASES[m.phase].f.includes('Al');
  let big, sub = '';
  if (W.kind === 'path' && W.st.unsolved) { big = '–'; sub = T('The calculation did not settle here; try another value.', 'Le calcul ne converge pas ici ; essayez une autre valeur.'); }
  else if (W.kind === 'path' && !hasAl) {
    if (m.id === 'fayalite') { big = nm('goethite'); sub = T('Iron stays as goethite; the silica goes into the water.', 'Le fer reste en goethite ; la silice part dans l’eau.'); }
    else if (m.id === 'quartz') {
      big = W.saturated ? T('Saturated', 'Saturée') : T('Dissolves slowly', 'Se dissout lentement');
      sub = W.saturated ? T('The water holds as much silica as quartz allows; the remaining quartz stays as grains.', 'L’eau contient autant de silice que le quartz le permet ; le reste du quartz demeure en grains.') : T('Quartz only gives silicic acid to the water; there is no aluminium to build a clay.', 'Le quartz donne seulement de l’acide silicique à l’eau ; il n’y a pas d’aluminium pour construire une argile.');
    } else {
      const mgSat = ['talc', 'sepiolite', 'chrysotile'].filter((id) => W.st.si?.[id] > 0);
      big = T('Dissolves completely', 'Se dissout entièrement');
      sub = mgSat.length ? T(`No aluminium for a clay; but the water is now saturated with ${mgSat.map(nm).join(', ')}, which could start to form where water lingers.`, `Pas d’aluminium pour une argile ; mais l’eau est maintenant saturée en ${mgSat.map(nm).join(', ')}, qui pourrait commencer à se former là où l’eau stagne.`)
        : T('No aluminium: nothing solid is left, everything goes into the water.', 'Pas d’aluminium : il ne reste rien de solide, tout part dans l’eau.');
    }
  } else {
    big = set.map(prodName).join(' + ');
    sub = W.kind === 'path'
      ? (set.length > 1 ? T('Both are stable here: the water sits on their boundary, and one turns into the other as weathering goes on.', 'Les deux sont stables ici : l’eau est sur leur limite, et l’un se transforme en l’autre à mesure que l’altération avance.') : T('is the stable product: the aluminium released by the mineral ends up there.', 'est le produit stable : l’aluminium libéré par le minéral finit là.'))
      : T('is the most stable aluminium mineral in this water, among those considered.', 'est le minéral d’aluminium le plus stable dans cette eau, parmi ceux considérés.');
    if (m.id === 'annite' && W.kind === 'path') big += ` + ${nm('goethite')}`;
  }
  if (W.kind === 'path' && W.saturated && !W.st.unsolved) sub = `${sub} ${T(`The water has reached equilibrium with ${nm(m.id)} (after ${sig(W.end * 1e6, 2)} µmol/L): it stops dissolving, and the water stops changing.`, `L’eau a atteint l’équilibre avec ${nm(m.id)} (après ${sig(W.end * 1e6, 2)} µmol/L) : il ne se dissout plus, et l’eau ne change plus.`)}`;
  out.hero.textContent = big;
  out.hero.style.fontSize = big.length > 22 ? 'clamp(1.5rem, 1.2rem + 1.2vw, 2rem)' : '';
  out.sub.textContent = sub;
  // regime
  out.regime.replaceChildren();
  const reg = set.includes('gibbsite') ? ['allitisation', T('total hydrolysis: all the silica leaves', 'hydrolyse totale : toute la silice part')]
    : set.includes('kaolinite') ? ['monosiallitisation', T('1:1 clay, part of the silica stays', 'argile 1:1, une partie de la silice reste')]
      : set.some((id) => /beidellite|muscovite/.test(id)) ? ['bisiallitisation', T('2:1 clay, silica and cations largely stay', 'argile 2:1, silice et cations restent en grande partie')] : null;
  if (reg && hasAl) out.regime.append(h('span', { class: 'badge now', text: reg[0] }), ' ', reg[1], ' ', ...cite('pedro'));
  // water table
  const rows = [];
  if (sp) {
    rows.push(['pH', f(sp.pH, 2)]);
    const tot = (sp2) => ({ Si: sp2.m.H4SiO4 + sp2.m['H3SiO4-'] + sp2.m['H2SiO4-2'] });
    const si = tot(sp).Si;
    const ions = [['K+', 'K'], ['Na+', 'Na'], ['Ca+2', 'Ca'], ['Mg+2', 'Mg']];
    for (const [ion, key] of ions) if (sp.m[ion] > 0) rows.push([fml(ion), `${sig(molToMg(sp.m[ion], key), 2)} mg/L`]);
    rows.push([h('span', {}, T('silica ', 'silice '), fml('H4SiO4'), ' (', T('as ', 'en '), fml('SiO2'), ')'), `${sig(molToMg(si, 'SiO2'), 2)} mg/L`]);
    if (sp.m['HCO3-'] > 0) rows.push([fml('HCO3-'), `${sig(molToMg(sp.m['HCO3-'], 'HCO3'), 2)} mg/L`]);
    const laAl = W.kind === 'path' ? W.st.laAl : W.laAl;
    if (Number.isFinite(laAl)) rows.push([h('span', {}, fml('Al+3'), T(' (free, at equilibrium)', ' (libre, à l’équilibre)')), `${sig(10 ** laAl * AW.Al * 1e6, 2)} µg/L`]);
    if (W.kind === 'path') {
      for (const [id, mol] of Object.entries(W.st.solids)) if (mol > 0) rows.push([h('span', {}, T('formed: ', 'formé : '), nm(id)), `${sig(mol * 1e6, 2)} µmol/L`]);
    }
  }
  out.water.replaceChildren(...rows.map(([k, v]) => h('tr', {}, h('th', {}, k), h('td', { class: 'v', text: v }))));
  // notes
  const notes = [];
  const si = W.kind === 'path' ? W.st.si : W.si;
  if (si) {
    if (si['SiO2(am)'] > 0) notes.push([T('More silica than amorphous silica can hold: opal would precipitate (not modelled).', 'Plus de silice que la silice amorphe ne peut en tenir : de l’opale précipiterait (non modélisé).'), 'hem']);
    else if (si.quartz > 0) notes.push([T('The water holds more silica than quartz can (it is supersaturated with quartz), yet quartz hardly grows at these temperatures.', 'L’eau contient plus de silice que le quartz ne peut en tenir (sursaturée en quartz), mais le quartz ne croît presque pas à ces températures.'), 'pk']);
    for (const id of ['talc', 'sepiolite', 'chrysotile']) if (si[id] > 0) notes.push([T(`Saturated with ${nm(id)}: a magnesium silicate could form (not modelled).`, `Saturée en ${nm(id)} : un silicate de magnésium pourrait se former (non modélisé).`), 'colin']);
    if (si.calcite > 0) notes.push([T('Saturated with calcite: calcium carbonate could precipitate (not modelled).', 'Saturée en calcite : du carbonate de calcium pourrait précipiter (non modélisé).'), 'llnl']);
  }
  if (W.kind === 'path' && S.acid === 'co2' && protons(m.phase) > 0) notes.push([T('pH rises as the mineral dissolves: each cation released uses up acid. Rain alone is near pH 5.6.', 'Le pH monte à mesure que le minéral se dissout : chaque cation libéré consomme de l’acide. La pluie seule est vers pH 5,6.'), 'hem']);
  out.notes.replaceChildren(...notes.map(([t, src]) => h('li', {}, t, ' ', ...cite(src))));
}

const WHEN = {
  poor: { en: 'poor drainage, little leaching', fr: 'mauvais drainage, peu de lessivage' },
  moderate: { en: 'moderate leaching', fr: 'lessivage modéré' },
  intense: { en: 'intense leaching', fr: 'lessivage intense' },
  any: { en: 'in any case', fr: 'dans tous les cas' },
};

function released(r) {
  const solids = new Set(Object.values(PHASES).map((p) => p.f).concat(Object.values(EXTRA_FORMULA)));
  return r.right.filter((t) => t.f !== 'H2O' && t.f !== 'H+').map((t) => ({ ...t, solid: solids.has(t.f) }));
}

function renderSteps(m, W) {
  const set = new Set(stableSet(m, W));
  const hasAl = PHASES[m.phase].f.includes('Al');
  out.steps.replaceChildren(...m.steps.map((st) => {
    const r = reaction(st.species);
    const current = hasAl ? (st.product && set.has(st.product)) || (st.kind === 'exchange') || (m.id === 'annite' && st.from === 'Fe+2') : true;
    const from = st.from in NAMES ? prodName(st.from) : plain(st.from);
    const to = st.to ? tr(st.to) : st.product ? prodName(st.product) : T('solution', 'solution');
    const title = `${from} → ${to}`;
    const rel = released(r);
    return h('li', { class: current ? 'wstep is-current' : 'wstep' },
      h('div', { class: 'step-head' }, h('h3', {}, title), h('span', { class: 'badge', text: tr(KINDS[st.kind]) }), h('span', { class: 'badge when', text: tr(WHEN[st.when]) }), current && hasAl ? h('span', { class: 'badge now', text: T('your conditions', 'vos conditions') }) : null),
      rxnNode(r),
      rel.length ? h('ul', { class: 'released', 'aria-label': T('Products', 'Produits') }, ...rel.map((t) => h('li', { class: t.solid ? 'solid' : '' }, t.solid ? T('stays: ', 'reste : ') : T('to water: ', 'dans l’eau : '), fml(t.f)))) : null,
      h('p', {}, tr(st.text), ' ', ...cite(st.src ?? (st.kind === 'exchange' ? 'price' : st.kind === 'oxidation' || st.kind === 'dehydration' ? 'earle' : st.when === 'poor' ? 'volkoff' : st.when === 'intense' ? 'pedro' : 'earle'))),
      st.kind === 'hydrolysis' && st.species.includes('H+') ? co2Variant(st) : null,
      balanceTable(r));
  }));
}

// The same hydrolysis written with carbonic acid as the source of H+.
function co2Variant(st) {
  const sp = st.species.filter((s) => s !== 'H+');
  sp.splice(1, 0, 'CO2');
  sp.push('HCO3-');
  try {
    const r = reaction(sp);
    return h('details', { class: 'bal-d' }, h('summary', { text: T('Written with carbonic acid (CO₂ + water) as the acid', 'Écrite avec l’acide carbonique (CO₂ + eau) comme acide') }), rxnNode(r),
      h('p', { class: 'hint' }, T('Each H⁺ comes from CO₂ + H₂O → H⁺ + HCO₃⁻: the cations leave with bicarbonate, which is why weathering draws CO₂ from the air over geological time.', 'Chaque H⁺ vient de CO₂ + H₂O → H⁺ + HCO₃⁻ : les cations partent avec du bicarbonate, c’est pourquoi l’altération retire du CO₂ de l’air à l’échelle géologique.'), ' ', ...cite('earle')));
  } catch { return null; }
}

function renderDiagram(m, W, withPath) {
  const key = sysKey();
  const sys = SYSTEMS[key];
  const pt = W.sp ? point(key, W.sp.la) : null;
  let path = [];
  let pathEnd = false;
  if (S.mode === 'path') {
    if (withPath) {
      const pd = pathData();
      path = pd.pts.map((s) => point(key, s.sp.la));
      pathEnd = pd.pts.some((s) => s.end);
      out.lastPath = path;
    } else path = out.lastPathKey === pathCache.key ? out.lastPath ?? [] : [];
    if (withPath) out.lastPathKey = pathCache.key;
  }
  out.diag.replaceChildren(activityDiagram({ sysKey: key, tC: S.t, cmp: S.cmp || null, point: pt, path, pathEnd, name: shortName, T, fmt: f }));
  // legend
  const stages = [...new Set(sys.phases.map((id) => id))];
  const lg = [];
  if (sys.kind === 'al') {
    for (const id of stages) {
      const stg = { 'K-feldspar': 1, albite: 1, anorthite: 1, muscovite: 2, 'beidellite-Na': 2, 'beidellite-Ca': 2, kaolinite: 3, gibbsite: 4 }[id];
      lg.push(h('li', {}, h('span', { class: 'sw', style: `background:var(--g${[0, 1, 3, 4, 6][stg]})` }), shortName(id)));
    }
  } else {
    lg.push(h('li', {}, h('span', { class: 'sw', style: 'background:var(--surface);border:1px solid var(--border)' }), T('undersaturated: the minerals dissolve', 'sous-saturée : les minéraux se dissolvent')));
    lg.push(h('li', {}, h('span', { class: 'sw', style: 'background:var(--surface-2);border:1px solid var(--border)' }), T('saturated: the named mineral can form', 'saturée : le minéral nommé peut se former')));
  }
  lg.push(h('li', {}, h('span', { class: 'sw hatch' }), T('beyond opal saturation', 'au-delà de la saturation de l’opale')));
  lg.push(h('li', {}, h('span', { class: 'sw dot' }), T('your water', 'votre eau')));
  if (S.mode === 'path') lg.push(h('li', {}, h('span', { class: 'sw path' }), T('path of the water', 'chemin de l’eau')));
  if (S.cmp) lg.push(h('li', {}, h('span', { class: 'sw line' }), S.cmp === 'rh' ? T('boundaries with Robie & Hemingway (1995)', 'limites avec Robie & Hemingway (1995)') : T('boundaries with phreeqc.dat', 'limites avec phreeqc.dat')));
  out.diagLegend.replaceChildren(...lg);
  const notes = [];
  if (sys.kind === 'al') notes.push(T('Fields shade step by step from the fresh mineral to the most leached product (light to dark in light mode, the reverse in dark mode). Dotted lines: saturation with quartz and with amorphous silica (opal).', 'Les domaines changent de teinte pas à pas, du minéral frais au produit le plus lessivé (du clair au foncé en mode clair, l’inverse en mode sombre). Pointillés : saturation en quartz et en silice amorphe (opale).'));
  else notes.push(T('Forsterite, enstatite and brucite never appear: from 0 to 40 °C serpentine and talc are always more stable, so olivine and pyroxene can only dissolve or turn into them.', 'Forstérite, enstatite et brucite n’apparaissent jamais : de 0 à 40 °C serpentine et talc sont toujours plus stables, si bien que olivine et pyroxène ne peuvent que se dissoudre ou se transformer en eux.'));
  if (pt && !(Number.isFinite(pt.x) && Number.isFinite(pt.y))) notes.push(T(`This water holds no ${sys.cation.replace(/\+.*/, '')}: it has no point on this diagram. Pick another cation system above.`, `Cette eau ne contient pas de ${sys.cation.replace(/\+.*/, '')} : elle n’a pas de point sur ce diagramme. Choisissez un autre système de cations ci-dessus.`));
  else if (out.diag.firstChild?.dataset.pointInBox === 'false' && pt) notes.push(T('Your water lies outside the frame; the dashed circle marks the nearest edge.', 'Votre eau est hors du cadre ; le cercle en tirets marque le bord le plus proche.'));
  if (S.cmp === 'rh' && key !== 'K') notes.push(T('Robie & Hemingway have no smectite: their dashed lines show fields without it.', 'Robie & Hemingway n’ont pas de smectite : leurs tirets montrent des domaines sans elle.'));
  out.diagNote.replaceChildren(...notes.map((n) => h('span', { text: `${n} ` })));
  renderBounds(key);
}

function lineText(l) {
  const y = 'y';
  if (l.x !== undefined) return `x = ${minus(f(l.x, 2))}`;
  const s = Math.abs(l.slope) < 1e-9 ? '' : ` ${l.slope < 0 ? '−' : '+'} ${f(Math.abs(l.slope), 2)} x`;
  return `${y} = ${minus(f(l.icept, 2))}${s}`;
}

function renderBounds(key) {
  const sys = SYSTEMS[key];
  const B = boundaries(key, S.t, 'llnl');
  out.bounds.replaceChildren(...B.map((b) => {
    let rx = null;
    try { rx = rxnNode(reaction([PHASES[b.a].f, PHASES[b.b].f, sys.cation, 'H+', 'H4SiO4', 'H2O'])); } catch { /* not unique */ }
    return h('tr', {}, h('td', { text: `${shortName(b.a)} / ${shortName(b.b)}` }), h('td', { class: 'v', text: lineText(b.line) }), h('td', {}, rx ?? '–'));
  }));
  // uncertainty at 25 °C
  const at = (ds) => Object.fromEntries(boundaries(key, 25, ds).map((b) => [`${b.a}/${b.b}`, b.line]));
  const L = at('llnl'), Rh = at('rh'), Pq = at('pq');
  const pos = (l) => (!l ? null : l.x !== undefined ? l.x : l.icept + l.slope * -4);
  out.unc.replaceChildren(...boundaries(key, 25, 'llnl').map((b) => {
    const k = `${b.a}/${b.b}`;
    const vertical = b.line.x !== undefined;
    const what = vertical ? `log a H₄SiO₄` : T('y at log a H₄SiO₄ = −4', 'y pour log a H₄SiO₄ = −4');
    const sg = boundarySigmaRH(key, b.a, b.b, RH, R, T0);
    const lrh = Rh[k];
    let rhTxt = '–';
    if (lrh && Number.isFinite(pos(lrh))) {
      const denom = vertical ? Math.abs(potDiffX(key, b.a, b.b)) : Math.abs(potDiffY(key, b.a, b.b));
      rhTxt = `${minus(f(pos(lrh), 2))}${sg !== null && denom > 0 ? ` ± ${f(sg / denom, 2)}` : ''}`;
    }
    return h('tr', {}, h('td', { text: `${shortName(b.a)} / ${shortName(b.b)}` }), h('td', { text: what }),
      h('td', { class: 'v', text: minus(f(pos(L[k]), 2)) }), h('td', { class: 'v', text: rhTxt }), h('td', { class: 'v', text: Pq[k] ? minus(f(pos(Pq[k]), 2)) : '–' }));
  }));
}
// coefficients of the boundary line dx x + dy y = c, per aluminium (or Mg) atom
function coefs(key, id) {
  const sys = SYSTEMS[key];
  const nu = reactionNu(id);
  const n = sys.kind === 'al' ? nu['Al+3'] : nu[sys.cation];
  return { cx: -(nu.H4SiO4 ?? 0) / n, cy: sys.kind === 'al' ? -(nu[sys.cation] ?? 0) / n : 0 };
}
const reactionNu = (id) => dissolution(id).nu;
const potDiffX = (key, a, b) => coefs(key, a).cx - coefs(key, b).cx;
const potDiffY = (key, a, b) => (SYSTEMS[key].kind === 'mg' ? 1 : coefs(key, a).cy - coefs(key, b).cy);

function fmtYears(y) {
  if (!Number.isFinite(y)) return '–';
  if (y < 1) return T(`${sig(y * 365.25, 2)} days`, `${sig(y * 365.25, 2)} jours`);
  if (y < 1e4) return T(`${sig(y, 2)} years`, `${sig(y, 2)} ans`);
  if (y < 1e6) return T(`${sig(y / 1e3, 2)} thousand years`, `${sig(y / 1e3, 2)} mille ans`);
  if (y < 1e9) return T(`${sig(y / 1e6, 2)} million years`, `${sig(y / 1e6, 2)} millions d’années`);
  return T(`${sig(y / 1e9, 2)} billion years`, `${sig(y / 1e9, 2)} milliards d’années`);
}

function renderKinetics(m, W) {
  const pH = W.sp ? W.sp.pH : S.ph;
  const r = rate(m.rate, pH, S.t);
  const life = lifetimeYears(m.rate, m.vol, pH, S.t, S.d);
  const frac = fractionDissolved(m.rate, m.vol, pH, S.t, S.d, S.yr);
  const share = Object.entries(r.parts).map(([k, v]) => `${{ acid: T('acid', 'acide'), neutral: T('neutral', 'neutre'), base: T('basic', 'basique') }[k]} ${f((100 * v) / r.total, 0)} %`).join(', ');
  const exp = Math.floor(Math.log10(r.total));
  const mant = r.total / 10 ** exp;
  out.kin.replaceChildren(
    h('p', { class: 'hero', id: 'w-life' }, fmtYears(life)),
    h('p', { class: 'sub' }, T(`for a ${f(S.d, 2)} mm grain of ${nm(m.id)} to dissolve completely in the laboratory, at pH ${f(pH, 1)} and ${f(S.t, 0)} °C.`, `pour qu’un grain de ${f(S.d, 2)} mm de ${nm(m.id)} se dissolve entièrement au laboratoire, à pH ${f(pH, 1)} et ${f(S.t, 0)} °C.`), ' ', ...cite('pk', 'rh')),
    h('table', { class: 'water' }, h('tbody', {},
      h('tr', {}, h('th', { text: T('Dissolution rate', 'Vitesse de dissolution') }), h('td', { class: 'v' }, `${f(mant, 1)} × 10`, h('sup', { text: minus(String(exp)) }), ' mol m', h('sup', { text: '−2' }), ' s', h('sup', { text: '−1' }))),
      h('tr', {}, h('th', { text: T('Mechanisms', 'Mécanismes') }), h('td', { class: 'v', text: share })),
      h('tr', {}, h('th', { text: T(`Dissolved after ${f(S.yr, 0)} years`, `Dissous après ${f(S.yr, 0)} ans`) }), h('td', { class: 'v', id: 'w-frac', text: `${f(frac * 100, frac < 0.01 ? 2 : 0)} %` })))),
    h('p', { class: 'note' }, T('In soils, grains last much longer: field rates are commonly two to four orders of magnitude slower than laboratory rates (old, coated surfaces, water near equilibrium, little contact). Read the lifetime as a lower bound, perhaps 100 to 10 000 times too short.', 'Dans les sols, les grains durent bien plus longtemps : les vitesses mesurées sur le terrain sont souvent de deux à quatre ordres de grandeur plus lentes qu’au laboratoire (surfaces anciennes et recouvertes, eau proche de l’équilibre, peu de contact). Lisez cette durée comme un minimum, peut-être 100 à 10 000 fois trop courte.'), ' ', ...cite('wb')),
    h('p', { class: 'hint', text: T('Shrinking-sphere model (our calculation): the grain loses a layer at the rate above over its whole surface. Rates far from equilibrium; T dependence by the Arrhenius law with the activation energies of the compilation.', 'Modèle de la sphère qui rétrécit (notre calcul) : le grain perd une couche à la vitesse ci-dessus sur toute sa surface. Vitesses loin de l’équilibre ; effet de la température par la loi d’Arrhenius avec les énergies d’activation de la compilation.') }));
  const gnames = { olivine: T('olivine', 'olivine'), pyroxene: T('pyroxene', 'pyroxène'), amphibole: T('amphibole', 'amphibole'), biotite: T('biotite', 'biotite'), 'Ca-plagioclase': T('Ca-plagioclase', 'plagioclase Ca'), 'Ca-Na plagioclase': T('Ca-Na plagioclase', 'plagioclase Ca-Na'), 'Na-Ca plagioclase': T('Na-Ca plagioclase', 'plagioclase Na-Ca'), 'Na-plagioclase': T('Na-plagioclase', 'plagioclase Na'), 'K-feldspar': T('K-feldspar', 'feldspath K'), muscovite: T('muscovite', 'muscovite'), quartz: T('quartz', 'quartz') };
  out.goldich.replaceChildren(goldichChart({ current: m.id, names: gnames, T }));
  const order = ['forsterite', 'fayalite', 'enstatite', 'diopside', 'tremolite', 'phlogopite', 'anorthite', 'albite', 'K-feldspar', 'muscovite', 'quartz'];
  const rows = order.map((id) => { const mm = byId(id); return { key: id, label: shortLabel(id), years: lifetimeYears(mm.rate, mm.vol, pH, S.t, 1), current: id === m.id || (id === 'phlogopite' && m.id === 'annite') }; });
  out.life.replaceChildren(lifetimeChart(rows, { T, fmtYears }));
  void GOLDICH; void RATES; void VOLUME;
}
const shortLabel = (id) => ({ forsterite: T('forsterite', 'forstérite'), fayalite: T('fayalite', 'fayalite'), enstatite: T('enstatite', 'enstatite'), diopside: T('diopside', 'diopside'), tremolite: T('tremolite', 'trémolite'), phlogopite: T('biotite', 'biotite'), anorthite: T('anorthite', 'anorthite'), albite: T('albite', 'albite'), 'K-feldspar': T('K-feldspar', 'feldspath K'), muscovite: T('muscovite', 'muscovite'), quartz: T('quartz', 'quartz') }[id]);

// Quartz: solubility against pH and temperature (llnl.dat constants).
function silicaTotal(kind, pH, tC) {
  const lk = logK(kind === 'quartz' ? 'quartz' : 'SiO2(am)', tC);
  const k1 = aqK('H3SiO4', tC), k2 = aqK('H2SiO4', tC);
  const h4 = 10 ** lk; // activity coefficients taken as 1 (dilute)
  const totMol = h4 * (1 + 10 ** (k1 + pH) + 10 ** (k2 + 2 * pH));
  return molToMg(totMol, 'SiO2');
}
function renderQuartz(m, W) {
  out.quartz.hidden = m.id !== 'quartz';
  if (m.id !== 'quartz') return;
  const pH = W.sp ? W.sp.pH : S.ph;
  const temps = [0, 10, 20, 25, 30, 40];
  out.quartz.replaceChildren(
    h('h2', { text: T('Quartz: it dissolves, it does not turn into clay', 'Le quartz : il se dissout, il ne devient pas argile') }),
    h('p', { class: 'quartz-note gentle' }, T('A common idea is that quartz weathers into kaolinite. It cannot: kaolinite needs aluminium, and quartz is pure silica. Quartz only dissolves, very slowly, into silicic acid, which is why its grains are left behind as sand when the other minerals are gone. Kaolinite forms from feldspars and micas; the silica in the water, including what quartz releases, then decides which clay is stable.', 'On lit parfois que le quartz s’altère en kaolinite. C’est impossible : la kaolinite demande de l’aluminium, et le quartz est de la silice pure. Le quartz se dissout seulement, très lentement, en acide silicique, ce qui explique que ses grains restent sous forme de sable quand les autres minéraux ont disparu. La kaolinite se forme à partir des feldspaths et des micas ; la silice de l’eau, y compris celle que libère le quartz, décide ensuite quelle argile est stable.'), ' ', ...cite('earle')),
    h('div', { class: 'two' },
      h('div', { class: 'chart' }, silicaChart({ tC: S.t, pH, total: (k, p) => silicaTotal(k, p, S.t), T, fmt: f }),
        h('ul', { class: 'legend' }, h('li', {}, h('span', { class: 'sw s1' }), T('quartz', 'quartz')), h('li', {}, h('span', { class: 'sw s2' }), T('amorphous silica (opal)', 'silice amorphe (opale)')), h('li', {}, h('span', { class: 'sw dot' }), T('your pH', 'votre pH')))),
      h('div', {},
        h('p', { class: 'small' }, T(`At ${f(S.t, 0)} °C and pH ${f(pH, 1)}, water in equilibrium with quartz holds ${sig(silicaTotal('quartz', pH, S.t), 2)} mg/L of SiO₂; with amorphous silica, ${sig(silicaTotal('am', pH, S.t), 2)} mg/L. Below pH 9 the value hardly changes; above, the silicate ion forms and solubility climbs.`, `À ${f(S.t, 0)} °C et pH ${f(pH, 1)}, une eau en équilibre avec le quartz contient ${sig(silicaTotal('quartz', pH, S.t), 2)} mg/L de SiO₂ ; avec la silice amorphe, ${sig(silicaTotal('am', pH, S.t), 2)} mg/L. Sous pH 9 la valeur change à peine ; au-delà, l’ion silicate se forme et la solubilité grimpe.`), ' ', ...cite('llnl', 'hem')),
        h('table', { class: 'data' }, h('thead', {}, h('tr', {}, h('th', { text: T('Temperature', 'Température') }), h('th', { text: T('quartz, mg/L', 'quartz, mg/L') }), h('th', { text: T('opal, mg/L', 'opale, mg/L') }))),
          h('tbody', {}, ...temps.map((t) => h('tr', {}, h('td', { text: `${t} °C` }), h('td', { class: 'v', text: sig(silicaTotal('quartz', 7, t), 2) }), h('td', { class: 'v', text: sig(silicaTotal('am', 7, t), 3) }))))),
        h('p', { class: 'hint' }, T('At pH 7, from the llnl.dat constants. Hem (1985) gives 6.0 mg/L for quartz and 115 mg/L for amorphous silica at 25 °C.', 'À pH 7, d’après les constantes de llnl.dat. Hem (1985) donne 6,0 mg/L pour le quartz et 115 mg/L pour la silice amorphe à 25 °C.'), ' ', ...cite('hem')))));
}

// ---------------------------------------------------------------- tab interface
/**
 * Draw the tab into `root` with the state in `params` (URLSearchParams).
 * `setParams(p)` is called with the state that differs from the defaults
 * after every change. Returns what the shell calls later: `show(params)`
 * when the route changes, `relang()` when the language changes.
 */
export function mount(root, { params, setParams }) {
  ctx = { root, setParams };
  readParams(params);
  build();
  return {
    show(p) { readParams(p); build(); },
    relang() { build(); },
  };
}
void stableAt; void silicaLines; void MOLAR_MASS;
