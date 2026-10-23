// Rock identification key tab: one question at a time, with the way to do
// each test, the path so far, a back button, and a result card with the
// look-alikes. Mounted by the one-page shell (site/app/main.js); the path is
// kept in the route (#/rocks?p=coherent.nofizz.crystals).
import { lang } from '../../../assets/site.js';
import { h, citer } from '../../../assets/ui.js';
import { KEY, ROCKS, TESTS, FAMILIES } from './data.js';
import { SOURCES, COMPARED, FIXES } from './sources.js';
import { PHOTOS } from './photos.js';
import { walk, pathsToRocks, parsePath, formatPath } from './walk.js';
import { picto, drawing } from './drawings.js';

const T = (en, fr) => (lang() === 'fr' ? fr : en);
const tr = (o) => (o ? o[lang()] ?? o.en : '');
const { cite, list } = citer(SOURCES, 'r-');
const PATHS = pathsToRocks(KEY);
const firstPath = (rock) => PATHS.get(rock)?.[0] ?? [];
const linkTo = (path) => `#/rocks${path.length ? `?p=${formatPath(path)}` : ''}`;

let ctx = null; // {root, setParams}
let path = [];
const out = {};

/** Read the path from the route; returns false when it had to be cleaned. */
function readParams(p) {
  const w = walk(KEY, parsePath(p.get('p')));
  path = w.steps.map((s) => s.answer.id); // drop unknown ids
  return w.valid && [...p.keys()].every((k) => k === 'p') && (p.get('p') ?? '') === formatPath(path);
}
function writeParams() {
  const p = new URLSearchParams();
  if (path.length) p.set('p', formatPath(path));
  ctx.setParams(p);
}

// ---------------------------------------------------------------- pieces
function photoFigure(id, { small = false } = {}) {
  const ph = PHOTOS[id];
  if (!ph) return null;
  return h('figure', { class: small ? 'rk-photo small' : 'rk-photo' },
    h('img', { src: `tabs/rocks/img/${ph.file}`, width: ph.w, height: ph.h, alt: tr(ph.alt), loading: 'lazy', decoding: 'async' }),
    h('figcaption', {}, `${T('Photo', 'Photo')}: ${ph.author}, `,
      h('a', { href: ph.licenceUrl, rel: 'noopener license', target: '_blank', text: ph.licence }), ', ',
      h('a', { href: ph.page, rel: 'noopener', target: '_blank', text: T('Wikimedia Commons', 'Wikimedia Commons') }),
      T(' (resized).', ' (redimensionnée).')));
}

function testBlock(id, { open = false, inKey = true } = {}) {
  const t = TESTS[id];
  const body = [
    t.drawing ? h('div', { class: 'rk-drawing' }, drawing(t.drawing, T)) : null,
    t.photo ? photoFigure(t.photo, { small: true }) : null,
    h('p', {}, h('strong', { text: T('How: ', 'Comment : ') }), tr(t.how)),
    t.look ? h('p', {}, h('strong', { text: T('What to look at: ', 'Quoi regarder : ') }), tr(t.look)) : null,
    t.care ? h('p', { class: 'note' }, h('strong', { text: T('Care: ', 'Prudence : ') }), tr(t.care)) : null,
    h('p', { class: 'small muted' }, T('Sources: ', 'Sources : '), ...cite(...t.src)),
  ];
  if (!inKey) return h('div', { class: 'rk-test', id: `rk-test-${id}` }, h('h3', { text: tr(t.title) }), ...body);
  return h('details', { class: 'rk-test', open }, h('summary', {}, h('span', { class: 'rk-how-label', text: T('How to tell', 'Comment faire') }), ' ', tr(t.title)), ...body);
}

function crumbs(w) {
  if (!w.steps.length) return h('p', { class: 'small muted rk-crumbs-empty', text: T('Your answers will appear here.', 'Vos réponses s’afficheront ici.') });
  return h('ol', { class: 'rk-crumbs' }, ...w.steps.map((s, i) => h('li', {},
    h('a', { href: linkTo(path.slice(0, i)), title: T('Go back to this question', 'Revenir à cette question') },
      h('span', { class: 'rk-crumb-q', text: tr(KEY.nodes[s.node].short ?? KEY.nodes[s.node].q) }), ' ',
      h('span', { class: 'rk-crumb-a', text: tr(s.answer.short ?? s.answer.label) })))));
}

function familyBadge(fam) {
  return h('span', { class: `rk-badge rk-fam-${fam}`, text: tr(FAMILIES[fam]) });
}

function questionView(w) {
  const n = KEY.nodes[w.node];
  const step = w.steps.length + 1;
  return h('div', { class: 'rk-step' },
    h('h2', { tabindex: '-1', class: 'rk-focus' }, h('span', { class: 'step', text: String(step) }), tr(n.q)),
    h('p', { class: 'rk-how' }, tr(n.how)),
    ...(n.tests ?? []).map((t, i) => testBlock(t, { open: i === 0 })),
    h('ul', { class: 'rk-answers', role: 'list' }, ...n.answers.map((a) => h('li', {},
      h('button', { type: 'button', class: 'rk-answer', 'data-answer': a.id, onclick: () => choose(a.id) },
        a.picto ? picto(a.picto, tr(a.label)) : null,
        h('span', { class: 'rk-answer-txt' }, h('strong', { text: tr(a.label) }), a.detail ? h('span', { class: 'rk-answer-detail', text: tr(a.detail) }) : null)),
      h('span', { class: 'rk-answer-src small muted' }, ...cite(...a.src))))),
    n.unsure ? h('p', { class: 'note small' }, h('strong', { text: T('Not sure? ', 'Vous hésitez ? ') }), tr(n.unsure)) : null);
}

function rockView(id, { heading = 'h2' } = {}) {
  const r = ROCKS[id];
  const names = [['fr', r.name.fr], ['en', r.name.en], ['de', r.name.de]].filter(([, v]) => v);
  return h('div', { class: 'rk-result', id: `rk-rock-${id}` },
    h('p', { class: 'rk-result-kicker small muted', text: T('The key points to', 'La clé mène à') }),
    h(heading, { tabindex: '-1', class: 'rk-focus rk-result-name', text: tr(r.name) }),
    h('p', { class: 'rk-badges' }, familyBadge(r.family)),
    h('div', { class: PHOTOS[r.photo] ? 'rk-result-cols' : 'rk-result-one' },
      PHOTOS[r.photo] ? h('div', { class: 'rk-photos' }, photoFigure(r.photo), r.photo2 ? photoFigure(r.photo2) : null) : null,
      h('div', {},
        h('h3', { text: T('Check that it fits', 'Vérifiez que cela colle') }), h('p', {}, tr(r.look), ' ', ...cite(...r.src)),
        r.caveat ? h('p', { class: 'note' }, h('strong', { text: T('Limits: ', 'Limites : ') }), tr(r.caveat)) : null,
        h('h3', { text: T('How it forms', 'Comment elle se forme') }), h('p', {}, tr(r.origin)),
        r.like?.length ? h('h3', { text: T('Easily confused with', 'À ne pas confondre avec') }) : null,
        r.like?.length ? h('ul', { class: 'rk-like' }, ...r.like.map((c) => h('li', {},
          h('a', { href: linkTo(firstPath(c.rock)), text: tr(ROCKS[c.rock].name) }), ': ', tr(c.how)))) : null,
        h('p', { class: 'small muted rk-names' }, T('Names: ', 'Noms : '), names.map(([l, v]) => `${v} (${l})`).join(' · ')))));
}

function stepView() {
  const w = walk(KEY, path);
  const back = h('button', { type: 'button', class: 'chip-btn', id: 'rk-back', disabled: !path.length, onclick: () => goBack() }, T('← Back', '← Retour'));
  const again = h('button', { type: 'button', class: 'chip-btn', id: 'rk-restart', disabled: !path.length, onclick: () => restart() }, T('Start again', 'Recommencer'));
  out.stage.replaceChildren(
    h('nav', { class: 'rk-path', 'aria-label': T('Your path through the key', 'Votre chemin dans la clé') },
      h('div', { class: 'rk-path-head' }, h('span', { class: 'field-label', text: T('Your path', 'Votre chemin') }), h('div', { class: 'rk-controls' }, back, again)),
      crumbs(w)),
    w.rock ? rockView(w.rock) : questionView(w));
}

function focusStage() {
  const target = out.stage.querySelector('.rk-focus');
  target?.focus({ preventScroll: true });
  const top = out.stage.getBoundingClientRect().top;
  if (top < 0 || top > innerHeight * 0.6) out.stage.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: no-preference)').matches ? 'smooth' : 'auto' });
}

function choose(aid) { path = [...path, aid]; writeParams(); stepView(); focusStage(); }
function goBack() { path = path.slice(0, -1); writeParams(); stepView(); focusStage(); }
function restart() { path = []; writeParams(); stepView(); focusStage(); }

// ---------------------------------------------------------------- the page
function indexView() {
  const groups = Object.keys(FAMILIES).map((fam) => [fam, Object.entries(ROCKS).filter(([, r]) => r.family === fam)]).filter(([, l]) => l.length);
  return h('section', { class: 'card', id: 'rk-index' },
    h('h2', { text: T('All the rocks in this key', 'Toutes les roches de cette clé') }),
    h('p', { class: 'small muted', text: T('Each link opens the rock at the end of the shortest path that leads to it, so you can see which answers it needs.', 'Chaque lien ouvre la roche au bout du plus court chemin qui y mène, pour voir quelles réponses elle demande.') }),
    h('div', { class: 'rk-index-cols' }, ...groups.map(([fam, rocks]) => h('div', {},
      h('h3', {}, familyBadge(fam)),
      h('ul', {}, ...rocks.sort((a, b) => tr(a[1].name).localeCompare(tr(b[1].name), lang())).map(([id, r]) => h('li', {}, h('a', { href: linkTo(firstPath(id)), text: tr(r.name) }))))))));
}

function howToUse() {
  return h('details', { class: 'card rk-use', id: 'rk-use' },
    h('summary', {}, h('h2', { text: T('How to use this key', 'Mode d’emploi') }), h('span', { class: 'small muted', text: T(' · method, equipment, limits', ' · méthode, matériel, limites') })),
    h('ol', {},
      h('li', {}, T('Work on a fresh, clean break of the rock, not on a weathered or dirty surface: weathering changes colour and hardness. Wash and dry it; a hammer gives a fresh face.', 'Travaillez sur une cassure fraîche et propre, pas sur une surface altérée ou sale : l’altération change la couleur et la dureté. Lavez et séchez ; un marteau donne une face fraîche.'), ' ', ...cite('auckland')),
      h('li', {}, T('Answer one question at a time. Under each question, “How to tell” explains the test and what to look at. If two answers seem to fit, follow one, then come back with “Back” and try the other: the result card lists the look-alikes.', 'Répondez à une question à la fois. Sous chaque question, « Comment faire » explique le test et ce qu’il faut regarder. Si deux réponses semblent convenir, suivez-en une, puis revenez avec « Retour » et essayez l’autre : la fiche du résultat liste les roches qui lui ressemblent.')),
      h('li', {}, T('At the end, check the description of the rock against your sample. If it does not fit, the sample may be unusual, weathered, or a rock that this key does not cover.', 'À la fin, comparez la description de la roche avec votre échantillon. Si elle ne colle pas, l’échantillon est peut-être inhabituel, altéré, ou c’est une roche que cette clé ne couvre pas.')),
      h('li', {}, T('Where the rock comes from helps a lot: the geological map of the place (in France, the BRGM maps on InfoTerre) tells you which rocks to expect.', 'Le lieu de récolte aide beaucoup : la carte géologique (en France, les cartes du BRGM sur InfoTerre) dit quelles roches on peut y trouver.'), ' ', ...cite('infoterre'))),
    h('h3', { text: T('What you need', 'Le matériel') }),
    h('ul', {},
      h('li', { text: T('a hand lens (×10), to see grains and crystals of a few tenths of a millimetre;', 'une loupe (×10), pour voir des grains et des cristaux de quelques dixièmes de millimètre ;') }),
      h('li', { text: T('your fingernail, a copper coin, a steel knife, and a glass plate (or a bottle shard with smoothed edges), for hardness;', 'votre ongle, une pièce de cuivre, une lame d’acier et une plaque de verre (ou un tesson aux bords émoussés), pour la dureté ;') }),
      h('li', { text: T('a dropper bottle of cold dilute hydrochloric acid (about 10 %), with goggles and water to rinse; white vinegar is a weaker stand-in;', 'un flacon compte-gouttes d’acide chlorhydrique dilué froid (environ 10 %), avec des lunettes et de l’eau pour rincer ; le vinaigre blanc est un remplaçant plus faible ;') }),
      h('li', { text: T('water, a ruler with millimetres, and a notebook.', 'de l’eau, une règle graduée en millimètres et un carnet.') })),
    h('p', { class: 'small muted' }, T('Equipment as in the keys compared: ', 'Matériel comme dans les clés comparées : '), ...cite('lmu', 'msa-acid', 'deline', 'sae-sed')),
    h('p', { class: 'note small' }, h('strong', { text: T('Limits. ', 'Limites. ') }),
      T('A key works by sight and simple tests, so it gives a probable name, not a certainty. It covers about forty common rocks; many others (and many transitions between them) are not in it. Several names, especially of metamorphic rocks, need a thin section under the microscope or a chemical analysis to be sure: the result cards say so where it matters.', 'Une clé fonctionne à l’œil et avec des tests simples : elle donne un nom probable, pas une certitude. Elle couvre une quarantaine de roches courantes ; beaucoup d’autres (et beaucoup de termes de passage) n’y sont pas. Plusieurs noms, surtout de roches métamorphiques, demandent une lame mince au microscope ou une analyse chimique pour être sûrs : les fiches le disent là où cela compte.'), ' ', ...cite('bgs-ign', 'bgs-met', 'earle-ch7')));
}

function aboutView() {
  return h('section', { class: 'card', id: 'rk-about' },
    h('h2', { text: T('About this key', 'À propos de cette clé') }),
    h('p', {}, T('Our own synthesis, written for this site. It is inspired by the video “CLÉ de DÉTERMINATION des PRINCIPALES ROCHES” (2020) of the French YouTube channel GÉO Logique (Yves Hardouin), which we thank: we started from a hand-drawn flow chart summarising it and kept its spirit (the acid test early, then the structure, then minerals and colour), but reworked its structure as listed below. Then we compared it with the keys and classifications listed in the table, and sourced every criterion.', 'Notre propre synthèse, écrite pour ce site. Elle s’inspire de la vidéo « CLÉ de DÉTERMINATION des PRINCIPALES ROCHES » (2020) de la chaîne YouTube française GÉO Logique (Yves Hardouin), que nous remercions : nous sommes partis d’un organigramme dessiné à la main qui la résume et en avons gardé l’esprit (le test à l’acide tôt, puis la structure, puis les minéraux et la couleur), mais nous en avons remanié la structure comme listé ci-dessous. Puis nous l’avons comparée aux clés et classifications du tableau, et chaque critère est sourcé.'), ' ', ...cite('geologiques')),
    h('h3', { text: T('What we changed in the starting key', 'Ce que nous avons changé dans la clé de départ') }),
    h('ul', { class: 'rk-fixes' }, ...FIXES.map((f) => h('li', {}, h('strong', { text: tr(f.what) }), ' ', tr(f.how), f.src?.length ? ' ' : null, ...(f.src?.length ? cite(...f.src) : [])))),
    h('h3', { text: T('Keys and classifications compared', 'Clés et classifications comparées') }),
    h('div', { class: 'table-scroll' }, h('table', { class: 'data rk-compared' },
      h('thead', {}, h('tr', {}, h('th', { text: T('Key or reference', 'Clé ou référence') }), h('th', { text: T('Order of the criteria', 'Ordre des critères') }), h('th', { text: T('What we took', 'Ce que nous en avons retenu') }))),
      h('tbody', {}, ...COMPARED.map((c) => h('tr', {}, h('td', {}, tr(c.name), ' ', ...cite(c.src)), h('td', { text: tr(c.order) }), h('td', { text: tr(c.took) })))))),
    h('h3', { text: T('Why one question at a time', 'Pourquoi une question à la fois') }),
    h('p', {}, T('Most keys we compared start by sorting the rock into its family, from its texture, its layers or its orientation, often with the acid test early, because these need almost no equipment. Hardness and colour come later, inside a family, where they mean something: colour alone is a poor guide, as it is unreliable for many minerals.', 'La plupart des clés comparées commencent par ranger la roche dans sa famille, d’après sa texture, ses couches ou son orientation, souvent avec le test à l’acide tôt, parce que cela ne demande presque aucun matériel. La dureté et la couleur viennent ensuite, à l’intérieur d’une famille, là où elles ont un sens : la couleur seule guide mal, car elle est trompeuse pour bien des minéraux.'), ' ', ...cite('cnpf', 'msa-key', 'frankfurt', 'earle-ch2')));
}

function testsView() {
  return h('section', { class: 'card', id: 'rk-tests' },
    h('h2', { text: T('The tests and criteria, explained', 'Les tests et les critères, expliqués') }),
    h('div', { class: 'rk-tests-grid' }, ...Object.keys(TESTS).map((id) => testBlock(id, { inKey: false }))));
}

function creditsView() {
  const used = Object.entries(PHOTOS);
  return h('section', { class: 'card sources', id: 'rk-credits' },
    h('h2', { text: T('Photo credits', 'Crédits des photos') }),
    h('p', { class: 'small muted', text: T('All photos come from Wikimedia Commons under the licence named; we only resized and recompressed them. Drawings are our own.', 'Toutes les photos viennent de Wikimedia Commons, sous la licence indiquée ; nous les avons seulement redimensionnées et recompressées. Les dessins sont les nôtres.') }),
    h('ol', {}, ...used.map(([, p]) => h('li', {}, `${tr(p.alt)}: ${p.author}, `,
      h('a', { href: p.licenceUrl, rel: 'noopener license', target: '_blank', text: p.licence }), ', ',
      h('a', { href: p.page, rel: 'noopener', target: '_blank', text: p.title })))));
}

function build() {
  out.stage = h('section', { class: 'card rk-stage', id: 'rk-stage', 'aria-live': 'polite' });
  ctx.root.replaceChildren(h('div', { class: 'rk' },
    h('h1', { text: T('Rock identification key', 'Clé de détermination des roches') }),
    h('p', { class: 'lead muted', text: T('A step-by-step key for hand specimens: one question at a time, with how to do each test and what to look at. It leads to about forty common rocks, then lists the look-alikes to rule out.', 'Une clé pas à pas pour les échantillons à la main : une question à la fois, avec la façon de faire chaque test et ce qu’il faut regarder. Elle mène à une quarantaine de roches courantes, puis liste les roches qui leur ressemblent, à écarter.') }),
    howToUse(),
    out.stage,
    indexView(),
    testsView(),
    aboutView(),
    h('section', { class: 'card sources', id: 'rk-sources' }, h('h2', { text: 'Sources' }), list(),
      h('p', { class: 'small muted', text: T('Texts and drawings on this page are our own; facts and thresholds come from the sources listed, and no text was copied from them.', 'Les textes et dessins de cette page sont les nôtres ; les faits et les seuils viennent des sources listées, sans texte recopié.') })),
    creditsView()));
  stepView();
}

// ---------------------------------------------------------------- tab interface
/**
 * Draw the tab into `root` with the state in `params` (URLSearchParams).
 * Returns what the shell calls later: `show(params)` when the route changes,
 * `relang()` when the language changes.
 */
export function mount(root, { params, setParams }) {
  ctx = { root, setParams };
  if (!readParams(params)) writeParams();
  build();
  return {
    show(p) { if (!readParams(p)) writeParams(); stepView(); focusStage(); },
    relang() { build(); },
  };
}
