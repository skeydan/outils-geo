// Crystal-systems tab: the seven systems with a unit cell drawn from its
// parameters, the six families, the 14 Bravais lattices, the 32 crystal
// classes, Miller indices and forms, a filterable table of reference minerals,
// a short identification method, common confusions and the corrections made to
// the course notes. Mounted by the one-page shell (site/app/main.js); the state
// is kept in the route (#/crystals?s=cubic&m=cubic).
import { lang } from '../../../assets/site.js';
import { h, citer, select, fmtn } from '../../../assets/ui.js';
import {
  FAMILIES, SYSTEMS, CLASSES, BRAVAIS, CENTRING, FORMS, MINERALS, CONFUSIONS, FIXES,
} from './data.js';
import { SOURCES } from './sources.js';
import { cellSvg, symmetrySvg, formSvg } from './draw.js';

const T = (en, fr) => (lang() === 'fr' ? fr : en);
const tr = (o) => (o ? o[lang()] ?? o.en : '');
const { cite } = citer(SOURCES, 'c-');

// Hermann–Mauguin symbols use a bar over a digit (3̄, 4̄, m3̄m). The combining
// macron of the data is turned into a span with a CSS overline, which sits
// centred over the digit in every font (a bare U+0304 drifts or vanishes).
function barNodes(text) {
  const nodes = [];
  let pending = '';
  for (const ch of String(text)) {
    if (ch === '̄' || ch === '̅') {
      if (pending) {
        const chars = [...pending];
        const last = chars.pop();
        if (chars.length) nodes.push(chars.join(''));
        nodes.push(h('span', { class: 'cx-bar', text: last }));
        pending = '';
      }
    } else {
      pending += ch;
    }
  }
  if (pending) nodes.push(pending);
  return nodes;
}

const CLASS_BY = new Map(CLASSES.map((c) => [`${c.sys}:${c.id}`, c]));
const MIN_BY = new Map(MINERALS.map((m) => [m.id, m]));
const SYS_BY = new Map(SYSTEMS.map((s) => [s.id, s]));
const FAM_BY = new Map(FAMILIES.map((f) => [f.id, f]));

let ctx = null;
let sysId = 'cubic';
let mineralSys = 'all';
let query = '';
const out = {};

// ---------------------------------------------------------------- route state
function validSystem(id) { return SYS_BY.has(id); }

function readParams(p) {
  const s = p.get('s') ?? 'cubic';
  const m = p.get('m') ?? 'all';
  const okS = validSystem(s);
  const okM = m === 'all' || validSystem(m);
  sysId = okS ? s : 'cubic';
  mineralSys = okM ? m : 'all';
  return okS && okM && [...p.keys()].every((k) => k === 's' || k === 'm');
}

function writeParams() {
  const p = new URLSearchParams();
  p.set('s', sysId);
  if (mineralSys !== 'all') p.set('m', mineralSys);
  ctx.setParams(p);
}

// ---------------------------------------------------------------- small pieces
const num = (v) => fmtn(v, lang(), 2);

function scrollToId(id, block = 'start') {
  const el = document.getElementById(id);
  if (!el) return;
  const smooth = matchMedia('(prefers-reduced-motion: no-preference)').matches;
  el.scrollIntoView({ block, behavior: smooth ? 'smooth' : 'auto' });
}

function filterMinerals(id) {
  if (!validSystem(id)) return;
  mineralSys = id;
  writeParams();
  renderMinerals();
  scrollToId('cx-minerals');
}

function mineralLink(id) {
  const m = MIN_BY.get(id);
  if (!m) return null;
  return h('button', {
    type: 'button',
    class: 'cx-chip',
    onclick: () => filterMinerals(m.sys),
    title: T('Show the minerals of this system', 'Afficher les minéraux de ce système'),
  }, tr(m));
}

function systemExamples(sys) {
  return h('div', { class: 'cx-examples' },
    h('p', { class: 'small muted', text: T('Common minerals of this system (click one to filter the table below):', 'Minéraux courants de ce système (cliquez pour filtrer le tableau plus bas) :') }),
    h('div', { class: 'cx-chips' }, ...sys.examples.map(mineralLink)));
}

// ---------------------------------------------------------------- system panel
function fact(term, value) {
  return h('div', { class: 'cx-fact' }, h('dt', { text: term }), h('dd', {}, value));
}

function systemDetail(sys) {
  const fam = FAM_BY.get(sys.family);
  const c = sys.cell;
  const params = `a = ${num(c.a)}, b = ${num(c.b)}, c = ${num(c.c)} · α = ${num(c.alpha)}°, β = ${num(c.beta)}°, γ = ${num(c.gamma)}°`;
  const classItems = [];
  for (const id of sys.classes) {
    const cls = CLASS_BY.get(`${sys.id}:${id}`);
    if (!cls) continue;
    if (classItems.length) classItems.push(' · ');
    classItems.push(h('a', { class: 'cx-class-link', href: '#cx-classes', title: tr(cls) }, ...barNodes(cls.hm)));
  }

  return h('div', { class: 'cx-sys-inner' },
    h('div', { class: 'cx-sys-head' },
      h('div', {},
        h('p', { class: 'cx-kicker small muted', text: T('Crystal system', 'Système cristallin') }),
        h('h3', { tabindex: '-1', class: 'cx-sys-name' }, tr(sys), h('span', { class: 'cx-sys-fam', text: ` · ${tr(fam)}` }))),
      h('p', { class: 'cx-cell-params' }, h('strong', { text: T('Illustrative cell: ', 'Maille illustrative : ') }), params)),
    h('div', { class: 'cx-sys-figs' },
      h('figure', { class: 'cx-fig' }, cellSvg(sys), h('figcaption', { class: 'small muted', text: T('Unit cell built from a, b, c, α, β, γ. The axes a (green), b (blue) and c (yellow) are drawn beyond the cell.', 'Maille construite à partir de a, b, c, α, β, γ. Les axes a (vert), b (bleu) et c (jaune) dépassent la maille.') })),
      h('figure', { class: 'cx-fig cx-fig-sym' }, symmetrySvg(sys), h('figcaption', { class: 'small muted', text: T('Schematic of the rotation axes: a lens is 2-fold, a triangle 3-fold, a square 4-fold, a hexagon 6-fold, a dot a centre of inversion. This is a diagram, not a stereogram.', 'Schéma des axes de rotation : une lentille vaut 2, un triangle 3, un carré 4, un hexagone 6, un point un centre d’inversion. C’est un schéma, pas un stéréogramme.') }))),
    h('dl', { class: 'cx-facts' },
      fact(T('Cell constraints', 'Contraintes de la maille'), tr(sys.constraints)),
      fact(T('Symmetry', 'Symétrie'), tr(sys.symmetry)),
      fact(T('Bravais lattices', 'Réseaux de Bravais'), sys.lattices.join(', ')),
      fact(T('Crystal classes', 'Classes cristallines'), h('span', {}, `${sys.classes.length} : `, ...classItems)),
      fact(T('Space groups', 'Groupes d’espace'), String(sys.space)),
      fact(T('Crystal family', 'Famille cristalline'), tr(fam))),
    h('p', { class: 'cx-look' }, tr(sys.look)),
    h('p', { class: 'small muted' }, T('Sources: ', 'Sources : '), ...cite('sys', 'struct')),
    systemExamples(sys));
}

function updateTabs() {
  for (const [id, b] of out.sysButtons) {
    const on = id === sysId;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  }
}

function renderSystem() {
  const sys = SYS_BY.get(sysId);
  out.sysDetail.replaceChildren(systemDetail(sys));
  out.sysDetail.setAttribute('aria-labelledby', `cx-tab-${sysId}`);
  updateTabs();
  if (out.classGroups?.[sysId]) out.classGroups[sysId].open = true;
}

function selectSystem(id, { write = true } = {}) {
  if (!validSystem(id)) return;
  sysId = id;
  if (write) writeParams();
  renderSystem();
}

function onTabKey(e, i) {
  const n = SYSTEMS.length;
  let next = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
  else if (e.key === 'Home') next = 0;
  else if (e.key === 'End') next = n - 1;
  if (next === null) return;
  e.preventDefault();
  const id = SYSTEMS[next].id;
  selectSystem(id);
  out.sysButtons.get(id)?.focus();
}

function sysTabs() {
  const listEl = h('div', {
    class: 'cx-sys-tabs',
    role: 'tablist',
    'aria-label': T('Crystal systems', 'Systèmes cristallins'),
    'aria-orientation': 'vertical',
  });
  out.sysButtons = new Map();
  SYSTEMS.forEach((sys, i) => {
    const b = h('button', {
      type: 'button',
      role: 'tab',
      id: `cx-tab-${sys.id}`,
      'aria-controls': 'cx-sys-panel',
      'aria-selected': String(sys.id === sysId),
      tabindex: sys.id === sysId ? '0' : '-1',
      class: 'cx-sys-tab',
      onclick: () => selectSystem(sys.id),
    },
    h('span', { class: 'cx-sys-tab-name', text: tr(sys) }),
    h('span', { class: 'cx-sys-tab-fam small', text: tr(FAM_BY.get(sys.family)) }));
    b.addEventListener('keydown', (e) => onTabKey(e, i));
    out.sysButtons.set(sys.id, b);
    listEl.append(b);
  });
  return listEl;
}

// ---------------------------------------------------------------- sections
function stats() {
  const items = [
    ['6', T('crystal families', 'familles cristallines')],
    ['7', T('crystal systems', 'systèmes cristallins')],
    ['14', T('Bravais lattices', 'réseaux de Bravais')],
    ['32', T('crystal classes', 'classes cristallines')],
    ['230', T('space groups', 'groupes d’espace')],
  ];
  return h('ul', { class: 'cx-stats' }, ...items.map(([n, label]) => h('li', {}, h('strong', { text: n }), h('span', { text: label }))));
}

function intro() {
  return h('section', { class: 'card cx-intro', id: 'cx-intro' },
    h('h2', { text: T('Key numbers', 'Repères') }),
    h('p', {}, T('A crystal is described by a unit cell, repeated periodically in three dimensions. The cell has six parameters: three lengths a, b, c and three angles α, β, γ. The symmetry of the cell places the crystal in one of the seven systems; the way the points repeat gives one of the 14 Bravais lattices; the symmetry around a point gives one of the 32 classes; and the full symmetry, translations included, gives one of the 230 space groups.', 'Un cristal se décrit par une maille, répétée périodiquement dans les trois dimensions. La maille a six paramètres : trois longueurs a, b, c et trois angles α, β, γ. La symétrie de la maille range le cristal dans l’un des sept systèmes ; la façon dont les nœuds se répètent donne l’un des 14 réseaux de Bravais ; la symétrie autour d’un point donne l’une des 32 classes ; la symétrie complète, translations comprises, donne l’un des 230 groupes d’espace.'), ' ', ...cite('sys', 'bravais', 'point', 'struct')),
    stats(),
    h('p', { class: 'note small' }, T('The lengths drawn in this tab are illustrative: they are chosen so that the seven cells can be compared on screen, not measured on a real crystal. Only the constraints (equalities, right angles, 120°) matter.', 'Les longueurs dessinées dans cet onglet sont illustratives : elles sont choisies pour comparer les sept mailles à l’écran, pas mesurées sur un cristal réel. Seules les contraintes (égalités, angles droits, 120°) comptent.')),
    h('p', { class: 'small muted' }, T('The PDF course notes this tab starts from contained several classification errors; they are listed and corrected at the end of the page.', 'Le document PDF à l’origine de cet onglet contenait plusieurs erreurs de classement ; elles sont listées et corrigées en bas de page.')));
}

function systemsSection() {
  out.sysDetail = h('div', { class: 'cx-sys-panel', id: 'cx-sys-panel', role: 'tabpanel', tabindex: '0' });
  return h('section', { class: 'card', id: 'cx-systems' },
    h('h2', { text: T('The seven crystal systems', 'Les sept systèmes cristallins') }),
    h('p', {}, T('Pick a system: the cell is drawn from its a, b, c, α, β, γ, and the rotation axes are sketched beside it. The three systems with right angles (orthorhombic, tetragonal, cubic) are easiest to read; monoclinic has one slanted angle and triclinic three.', 'Choisissez un système : la maille est dessinée à partir de a, b, c, α, β, γ, et les axes de rotation sont schématisés à côté. Les trois systèmes à angles droits (orthorhombique, tétragonal, cubique) se lisent le plus facilement ; le monoclinique a un seul angle oblique et le triclinique trois.')),
    h('div', { class: 'cx-sys-layout' }, sysTabs(), out.sysDetail));
}

function familyCard(fam) {
  const systems = fam.systems.map((id) => SYS_BY.get(id));
  return h('div', { class: `cx-fam-card cx-fam-${fam.id}` },
    h('h3', { text: tr(fam) }),
    h('div', { class: 'cx-chips' }, ...systems.map((s) => h('button', {
      type: 'button',
      class: 'cx-chip',
      onclick: () => { selectSystem(s.id); scrollToId('cx-systems'); },
    }, tr(s)))),
    h('p', { class: 'small muted', text: T(`${fam.classes} classes · ${fam.space} space groups · ${fam.lattices} lattice${fam.lattices > 1 ? 's' : ''}`, `${fam.classes} classes · ${fam.space} groupes d’espace · ${fam.lattices} réseau${fam.lattices > 1 ? 'x' : ''}`) }));
}

function familiesSection() {
  return h('section', { class: 'card', id: 'cx-families' },
    h('h2', { text: T('Six families, seven systems', 'Six familles, sept systèmes') }),
    h('p', {}, T('A crystal family groups the systems that share the same Bravais lattice type. Five families contain one system; the hexagonal family contains two, trigonal and hexagonal, because a 3-fold axis and a 6-fold axis share the same hexagonal lattice.', 'Une famille cristalline regroupe les systèmes qui partagent le même type de réseau de Bravais. Cinq familles ne contiennent qu’un système ; la famille hexagonale en contient deux, trigonal et hexagonal, car un axe ternaire et un axe sénaire partagent le même réseau hexagonal.'), ' ', ...cite('sys', 'bravais')),
    h('div', { class: 'cx-fam-grid' }, ...FAMILIES.map(familyCard)));
}

function bravaisSection() {
  return h('section', { class: 'card', id: 'cx-bravais' },
    h('h2', { text: T('The 14 Bravais lattices', 'Les 14 réseaux de Bravais') }),
    h('p', {}, T('A Bravais lattice describes how the points repeat. The centring symbol says where the extra points sit: P primitive, C base-centred, I body-centred, F face-centred, R rhombohedral. The full crystal structure adds the basis (the atoms or ions) to the lattice.', 'Un réseau de Bravais décrit la répétition des nœuds. Le symbole de centrage indique où se trouvent les nœuds supplémentaires : P primitif, C centré sur une base, I centré, F à faces centrées, R rhomboédrique. La structure cristalline complète ajoute le motif (les atomes ou ions) au réseau.'), ' ', ...cite('bravais', 'struct')),
    h('div', { class: 'table-scroll' }, h('table', { class: 'data cx-bravais' },
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col', text: T('System', 'Système') }),
        h('th', { scope: 'col', text: T('Symbol', 'Symbole') }),
        h('th', { scope: 'col', text: T('Centring', 'Centrage') }),
        h('th', { scope: 'col', text: T('Example in this tab', 'Exemple dans cet onglet') }))),
      h('tbody', {}, ...BRAVAIS.map((b) => {
        const m = b.example ? MIN_BY.get(b.example) : null;
        return h('tr', {},
          h('td', { text: tr(SYS_BY.get(b.sys)) }),
          h('td', { class: 'cx-mono', text: b.symbol }),
          h('td', { text: tr(CENTRING[b.centring]) }),
          h('td', {}, m ? mineralLink(b.example) : h('span', { class: 'muted', text: T('no common example here', 'pas d’exemple courant ici') })));
      })))),
    h('p', { class: 'small muted' }, T('Pearson notation writes the base-centred lattices mS and oS; C and S are the same lattice, just a different choice of cell. Monoclinic crystals are sometimes described in an I-centred cell (gypsum, I2/a), which is equivalent to a C-centred cell.', 'La notation de Pearson écrit mS et oS pour les réseaux centrés sur une base ; C et S sont le même réseau, avec un autre choix de maille. Les cristaux monocliniques se décrivent parfois dans une maille centrée I (le gypse, I2/a), équivalente à une maille centrée C.')));
}

function classesSection() {
  out.classGroups = {};
  return h('section', { class: 'card', id: 'cx-classes' },
    h('h2', { text: T('The 32 crystal classes', 'Les 32 classes cristallines') }),
    h('p', {}, T('A crystal class (or point group) describes the symmetry around a point: the rotations, mirrors and inversion that leave the crystal unchanged when you turn it in your hand. There are 32, shared between the seven systems. The Hermann–Mauguin symbol is the one used on mineral pages; the Schönflies symbol is common in chemistry and physics.', 'Une classe cristalline (ou groupe ponctuel) décrit la symétrie autour d’un point : les rotations, miroirs et l’inversion qui laissent le cristal inchangé quand on le tourne dans la main. Il y en a 32, réparties entre les sept systèmes. Le symbole de Hermann–Mauguin est celui des fiches minéralogiques ; le symbole de Schönflies est courant en chimie et en physique.'), ' ', ...cite('point', 'sys')),
    h('div', { class: 'cx-class-groups' }, ...SYSTEMS.map((sys) => {
      const rows = sys.classes.map((id) => CLASS_BY.get(`${sys.id}:${id}`)).filter(Boolean);
      const det = h('details', { class: 'cx-classes-group', 'data-sys': sys.id, open: sys.id === sysId },
        h('summary', {}, h('strong', { text: tr(sys) }), ' ', h('span', { class: 'small muted', text: T(`${rows.length} classes · ${sys.space} space groups`, `${rows.length} classes · ${sys.space} groupes d’espace`) })),
        h('div', { class: 'table-scroll' }, h('table', { class: 'data cx-classes' },
          h('thead', {}, h('tr', {},
            h('th', { scope: 'col', text: 'H–M' }),
            h('th', { scope: 'col', text: 'Schönflies' }),
            h('th', { scope: 'col', text: T('Class', 'Classe') }),
            h('th', { scope: 'col', text: T('Symmetry elements', 'Éléments de symétrie') }))),
          h('tbody', {}, ...rows.map((c) => h('tr', {},
            h('td', { class: 'cx-mono' }, ...barNodes(c.hm)),
            h('td', { class: 'cx-mono' }, ...barNodes(c.schoen)),
            h('td', { text: tr(c) }),
            h('td', {}, ...barNodes(tr(c.what)))))))));
      out.classGroups[sys.id] = det;
      return det;
    })));
}

function formsSection() {
  return h('section', { class: 'card', id: 'cx-forms' },
    h('h2', { text: T('Miller indices and crystal forms', 'Indices de Miller et formes cristallines') }),
    h('p', {}, T('A lattice plane is written (hkl): the indices are the inverses of the plane’s intercepts with the axes, reduced to the smallest integers. Braces {hkl} collect all the faces equivalent by the symmetry of the system; square brackets [uvw] give a direction. In the cubic system, the spacing between the planes of a family is d = a / √(h² + k² + l²).', 'Un plan réticulaire s’écrit (hkl) : les indices sont les inverses des intersections du plan avec les axes, ramenés aux plus petits entiers. Les accolades {hkl} rassemblent toutes les faces équivalentes par la symétrie du système ; les crochets [uvw] donnent une direction. Dans le système cubique, la distance entre les plans d’une famille vaut d = a / √(h² + k² + l²).'), ' ', ...cite('miller')),
    h('div', { class: 'cx-forms' }, ...FORMS.map((f) => h('div', { class: 'cx-form-card' },
      h('div', { class: 'cx-form-fig' }, formSvg(f.id)),
      h('div', {}, h('h3', {}, tr(f), ' ', h('span', { class: 'cx-form-index', text: f.index })), h('p', { text: tr(f.body) }))))),
    h('p', { class: 'note small' }, T('The same indices do not give the same shape in every system: {111} is an octahedron in the cubic system but a four-sided dipyramid in the tetragonal system. A form is defined by its face set within one system.', 'Les mêmes indices ne donnent pas la même forme dans tous les systèmes : {111} est un octaèdre dans le cubique, mais une dipyramide à quatre faces dans le tétragonal. Une forme se définit par son ensemble de faces dans un système donné.')));
}

function mineralRow(m) {
  const sys = SYS_BY.get(m.sys);
  const other = lang() === 'fr' ? m.en : m.fr;
  return h('tr', {},
    h('td', {}, h('strong', { text: tr(m) }), other && other !== tr(m) ? h('span', { class: 'cx-other', text: ` · ${other}` }) : null),
    h('td', { class: 'cx-mono', text: m.formula }),
    h('td', { text: tr(sys) }),
    h('td', { class: 'cx-mono' }, ...barNodes(m.cls)),
    h('td', { class: 'cx-mono' }, ...barNodes(m.space)),
    h('td', { text: tr(m.forms) }),
    h('td', { text: tr(m.cleavage) }),
    h('td', { class: 'cx-src-cell' }, ...cite(m.src)));
}

function renderMinerals() {
  const q = query.trim().toLowerCase();
  const rows = MINERALS.filter((m) => {
    if (mineralSys !== 'all' && m.sys !== mineralSys) return false;
    if (!q) return true;
    return [m.en, m.fr, m.formula, m.cls, m.space, tr(m.forms)].join(' ').toLowerCase().includes(q);
  }).sort((a, b) => tr(a).localeCompare(tr(b), lang()));
  out.mineralBody.replaceChildren(...rows.map(mineralRow));
  out.mineralCount.textContent = T(`${rows.length} of ${MINERALS.length} minerals shown.`, `${rows.length} minéraux sur ${MINERALS.length} affichés.`);
  if (out.mineralSelect && out.mineralSelect.value !== mineralSys) out.mineralSelect.value = mineralSys;
}

function mineralsSection() {
  const opts = [{ value: 'all', label: T('All systems', 'Tous les systèmes') },
    ...SYSTEMS.map((s) => ({ value: s.id, label: tr(s) }))];
  const sel = select({ id: 'cx-min-sys', label: T('System', 'Système'), options: opts, value: mineralSys });
  out.mineralSelect = sel.input;
  sel.input.addEventListener('change', (e) => { mineralSys = e.target.value; writeParams(); renderMinerals(); });
  const search = h('input', {
    id: 'cx-min-q',
    type: 'search',
    autocomplete: 'off',
    placeholder: T('Name, formula, space group…', 'Nom, formule, groupe d’espace…'),
    value: query,
  });
  search.addEventListener('input', (e) => { query = e.target.value; renderMinerals(); });
  out.mineralBody = h('tbody');
  out.mineralCount = h('p', { class: 'small muted', 'aria-live': 'polite' });

  return h('section', { class: 'card', id: 'cx-minerals' },
    h('h2', { text: T('28 reference minerals', '28 minéraux de référence') }),
    h('p', {}, T('Each mineral is given with its system, class, space group, habit and cleavage. The examples were checked one by one against the mineral pages listed in the sources; several examples given in the course notes were wrong, and have been replaced.', 'Chaque minéral est donné avec son système, sa classe, son groupe d’espace, son habit et son clivage. Les exemples ont été vérifiés un par un sur les pages minéralogiques listées dans les sources ; plusieurs exemples du document de départ étaient faux et ont été remplacés.')),
    h('div', { class: 'cx-filters' },
      sel.wrap,
      h('div', { class: 'field' }, h('label', { for: 'cx-min-q', text: T('Search', 'Rechercher') }), h('div', { class: 'field-in' }, search))),
    out.mineralCount,
    h('div', { class: 'table-scroll' }, h('table', { class: 'data cx-minerals' },
      h('thead', {}, h('tr', {},
        h('th', { scope: 'col', text: T('Mineral', 'Minéral') }),
        h('th', { scope: 'col', text: T('Formula', 'Formule') }),
        h('th', { scope: 'col', text: T('System', 'Système') }),
        h('th', { scope: 'col', text: T('Class', 'Classe') }),
        h('th', { scope: 'col', text: T('Space group', 'Groupe d’espace') }),
        h('th', { scope: 'col', text: T('Habit', 'Habit') }),
        h('th', { scope: 'col', text: T('Cleavage', 'Clivage') }),
        h('th', { scope: 'col', text: T('Source', 'Source') }))),
      out.mineralBody)));
}

function findSection() {
  const steps = [
    T('Look for four 3-fold axes. If you find them, the crystal is cubic. Cubes, octahedra and dodecahedra suggest it, but a pseudocubic crystal such as leucite is in fact tetragonal.', 'Cherchez quatre axes ternaires. Si vous en trouvez, le cristal est cubique. Les cubes, octaèdres et dodécaèdres le suggèrent, mais un cristal pseudocubique comme la leucite est en fait tétragonal.'),
    T('Otherwise, look for a 6-fold axis: the crystal is hexagonal.', 'Sinon, cherchez un axe sénaire : le cristal est hexagonal.'),
    T('If there is a 3-fold axis but no 6-fold axis, it is trigonal. A six-sided prism can be trigonal (quartz) or hexagonal (beryl); the symmetry, not the number of faces, decides.', 'S’il y a un axe ternaire mais pas d’axe sénaire, il est trigonal. Un prisme à six faces peut être trigonal (quartz) ou hexagonal (béryl) ; c’est la symétrie, pas le nombre de faces, qui tranche.'),
    T('If there is a 4-fold axis, it is tetragonal.', 'S’il y a un axe quaternaire, il est tétragonal.'),
    T('If there are three perpendicular 2-fold axes, or the cell has three unequal lengths and right angles, it is orthorhombic.', 'S’il y a trois axes binaires perpendiculaires, ou si la maille a trois longueurs inégales et des angles droits, il est orthorhombique.'),
    T('If there is a single 2-fold axis or a single mirror plane, it is monoclinic.', 'S’il n’y a qu’un axe binaire ou un seul plan miroir, il est monoclinique.'),
    T('If there is no rotation axis, at most a centre of inversion, it is triclinic.', 'S’il n’y a aucun axe de rotation, au plus un centre d’inversion, il est triclinique.'),
  ];
  return h('section', { class: 'card', id: 'cx-find' },
    h('h2', { text: T('Finding the system of a crystal', 'Reconnaître le système d’un cristal') }),
    h('p', {}, T('Start from the symmetry, not from the overall shape, and go from the most symmetric case to the least. On a well-formed crystal, the angles between faces are measured with a goniometer; X-ray diffraction gives the space group without ambiguity. A broken fragment, an aggregate or a twinned crystal can mislead.', 'Partez de la symétrie, pas de la forme générale, et allez du cas le plus symétrique au moins symétrique. Sur un cristal bien formé, on mesure les angles entre faces au goniomètre ; la diffraction des rayons X donne le groupe d’espace sans ambiguïté. Un éclat cassé, un agrégat ou un cristal maclé peuvent tromper.'), ' ', ...cite('sys', 'struct', 'miller')),
    h('ol', { class: 'cx-steps' }, ...steps.map((s) => h('li', { text: s }))),
    h('p', { class: 'note small' }, h('strong', { text: T('Care: ', 'Prudence : ') }), T('a crystal that looks like a cube may be tetragonal, and aragonite twins can look hexagonal. Twinning adds apparent symmetry that the single crystal does not have.', 'un cristal qui ressemble à un cube peut être tétragonal, et les macles de l’aragonite peuvent sembler hexagonales. Le maclage ajoute une symétrie apparente que le cristal unique n’a pas.')));
}

function confusionsSection() {
  return h('section', { class: 'card', id: 'cx-confusions' },
    h('h2', { text: T('Common confusions', 'Confusions fréquentes') }),
    h('dl', { class: 'cx-confusions' }, ...CONFUSIONS.flatMap((c) => [
      h('dt', {}, ...barNodes(tr(c)), c.src?.length ? h('span', { class: 'cx-cite' }, ...cite(...c.src)) : null),
      h('dd', {}, ...barNodes(tr(c.body))),
    ])));
}

function fixesSection() {
  return h('section', { class: 'card', id: 'cx-fixes' },
    h('h2', { text: T('What we corrected in the starting document', 'Ce que nous avons corrigé dans le document de départ') }),
    h('p', {}, T('The course notes distributed as systemescristallins.pdf mix the six families and the seven systems, put pyrite and gypsum in the wrong class, and give several wrong mineral examples. Each correction below is sourced. The wrong statements are quoted only to explain what changed.', 'Le document distribué sous le nom systemescristallins.pdf mélange les six familles et les sept systèmes, place la pyrite et le gypse dans la mauvaise classe et donne plusieurs exemples minéraux faux. Chaque correction ci-dessous est sourcée. Les affirmations erronées ne sont citées que pour expliquer ce qui a changé.')),
    h('ul', { class: 'cx-fixes' }, ...FIXES.map((f) => h('li', {},
      h('strong', {}, ...barNodes(tr(f.what))), ' ', ...barNodes(tr(f.how)), f.src?.length ? ' ' : null, ...(f.src?.length ? cite(...f.src) : [])))));
}

function sourceList() {
  return h('ol', {}, ...SOURCES.map((s) => h('li', { id: `c-src-${s.id}` },
    ...barNodes(s.text), ' ',
    h('a', { href: s.url, rel: 'noopener', target: '_blank' }, s.url.replace(/^https?:\/\//, '').replace(/\/$/, '')))));
}

function sourcesSection() {
  return h('section', { class: 'card sources', id: 'cx-sources' },
    h('h2', { text: 'Sources' }),
    sourceList(),
    h('p', { class: 'small muted' }, T('The texts and drawings of this page are our own. The facts, counts and mineral data come from the sources listed; no text or table was copied. The unit cells are drawn from the parameters given, with an oblique projection written for this page.', 'Les textes et dessins de cette page sont les nôtres. Les faits, les décomptes et les données minéralogiques viennent des sources listées ; aucun texte ni tableau n’a été recopié. Les mailles sont dessinées à partir des paramètres indiqués, avec une projection oblique écrite pour cette page.')));
}

// ---------------------------------------------------------------- build
function build() {
  ctx.root.replaceChildren(h('div', { class: 'cx' },
    h('h1', { text: T('Crystal systems', 'Systèmes cristallins') }),
    h('p', { class: 'lead muted', text: T('How to place a crystal in one of the seven systems, read its unit cell and symmetry, and connect this to the 14 Bravais lattices, the 32 classes and common minerals. The drawings are built from the cell parameters.', 'Comment ranger un cristal dans l’un des sept systèmes, lire sa maille et sa symétrie, et relier cela aux 14 réseaux de Bravais, aux 32 classes et aux minéraux courants. Les dessins sont construits à partir des paramètres de maille.') }),
    intro(),
    systemsSection(),
    familiesSection(),
    bravaisSection(),
    classesSection(),
    formsSection(),
    mineralsSection(),
    findSection(),
    confusionsSection(),
    fixesSection(),
    sourcesSection()));
  renderSystem();
  renderMinerals();
}

// ---------------------------------------------------------------- tab interface
export function mount(root, { params, setParams }) {
  ctx = { root, setParams };
  if (!readParams(params)) writeParams();
  build();
  return {
    show(p) {
      if (!readParams(p)) writeParams();
      renderSystem();
      renderMinerals();
    },
    relang() { build(); },
  };
}
