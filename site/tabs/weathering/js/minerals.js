// Starting minerals and the weathering steps shown for each. Reactions are
// listed as the species taking part; coefficients come from the balancer.
// Texts are our own.

export const KINDS = {
  hydrolysis: { en: 'hydrolysis', fr: 'hydrolyse' },
  dissolution: { en: 'dissolution', fr: 'dissolution' },
  oxidation: { en: 'oxidation', fr: 'oxydation' },
  hydration: { en: 'hydration', fr: 'hydratation' },
  exchange: { en: 'ion exchange', fr: 'échange d’ions' },
  desilication: { en: 'desilication', fr: 'désilicification' },
  dehydration: { en: 'dehydration', fr: 'déshydratation' },
};

// Display names of phases (formulas come from thermo.js).
export const NAMES = {
  'K-feldspar': { en: 'K-feldspar', fr: 'feldspath potassique' },
  albite: { en: 'albite (Na-plagioclase)', fr: 'albite (plagioclase sodique)' },
  anorthite: { en: 'anorthite (Ca-plagioclase)', fr: 'anorthite (plagioclase calcique)' },
  muscovite: { en: 'muscovite', fr: 'muscovite' },
  illite: { en: 'illite (mica-like clay)', fr: 'illite (argile proche des micas)' },
  phlogopite: { en: 'biotite, Mg end member (phlogopite)', fr: 'biotite, pôle magnésien (phlogopite)' },
  annite: { en: 'biotite, Fe end member (annite)', fr: 'biotite, pôle ferreux (annite)' },
  vermiculite: { en: 'vermiculite', fr: 'vermiculite' },
  kaolinite: { en: 'kaolinite', fr: 'kaolinite' },
  gibbsite: { en: 'gibbsite', fr: 'gibbsite' },
  'beidellite-Na': { en: 'Na-smectite (beidellite)', fr: 'smectite sodique (beidellite)' },
  'beidellite-Ca': { en: 'Ca-smectite (beidellite)', fr: 'smectite calcique (beidellite)' },
  'beidellite-Mg': { en: 'Mg-smectite (beidellite)', fr: 'smectite magnésienne (beidellite)' },
  forsterite: { en: 'olivine, Mg end member (forsterite)', fr: 'olivine, pôle magnésien (forstérite)' },
  fayalite: { en: 'olivine, Fe end member (fayalite)', fr: 'olivine, pôle ferreux (fayalite)' },
  enstatite: { en: 'pyroxene: enstatite', fr: 'pyroxène : enstatite' },
  diopside: { en: 'pyroxene: diopside', fr: 'pyroxène : diopside' },
  tremolite: { en: 'amphibole: tremolite', fr: 'amphibole : trémolite' },
  quartz: { en: 'quartz', fr: 'quartz' },
  'SiO2(am)': { en: 'amorphous silica (opal)', fr: 'silice amorphe (opale)' },
  chalcedony: { en: 'chalcedony', fr: 'calcédoine' },
  goethite: { en: 'goethite', fr: 'goethite' },
  hematite: { en: 'hematite', fr: 'hématite' },
  chrysotile: { en: 'serpentine (chrysotile)', fr: 'serpentine (chrysotile)' },
  talc: { en: 'talc', fr: 'talc' },
  sepiolite: { en: 'sepiolite', fr: 'sépiolite' },
  brucite: { en: 'brucite', fr: 'brucite' },
  calcite: { en: 'calcite', fr: 'calcite' },
};

// Short names for diagram labels.
export const SHORT = {
  'K-feldspar': { en: 'K-feldspar', fr: 'feldspath K' },
  albite: { en: 'albite', fr: 'albite' },
  anorthite: { en: 'anorthite', fr: 'anorthite' },
  muscovite: { en: 'mica (illite)', fr: 'mica (illite)' },
  kaolinite: { en: 'kaolinite', fr: 'kaolinite' },
  gibbsite: { en: 'gibbsite', fr: 'gibbsite' },
  'beidellite-Na': { en: 'Na-smectite', fr: 'smectite Na' },
  'beidellite-Ca': { en: 'Ca-smectite', fr: 'smectite Ca' },
  'beidellite-Mg': { en: 'Mg-smectite', fr: 'smectite Mg' },
  forsterite: { en: 'forsterite', fr: 'forstérite' },
  enstatite: { en: 'enstatite', fr: 'enstatite' },
  chrysotile: { en: 'serpentine', fr: 'serpentine' },
  talc: { en: 'talc', fr: 'talc' },
  sepiolite: { en: 'sepiolite', fr: 'sépiolite' },
  brucite: { en: 'brucite', fr: 'brucite' },
};

// Formulas used only in reactions (not in the thermodynamic data).
export const EXTRA_FORMULA = {
  vermiculite: 'Mg0.5Mg3AlSi3O10(OH)2',
};

/**
 * Starting minerals. phase: thermo id; rate: kinetics key; vol: molar volume key;
 * system: activity diagram; steps: [{kind, species, product, when, text}]
 * when: 'poor' | 'moderate' | 'intense' | 'any' (drainage / leaching it belongs to).
 */
export const MINERALS = [
  {
    id: 'K-feldspar', group: 'feldspar', phase: 'K-feldspar', rate: 'K-feldspar', vol: 'K-feldspar', system: 'K',
    steps: [
      { kind: 'hydrolysis', from: 'K-feldspar', product: 'muscovite', when: 'poor', src: 'illite', species: ['KAlSi3O8', 'H+', 'H2O', 'KAl3Si3O10(OH)2', 'K+', 'H4SiO4'],
        text: { en: 'Where water moves slowly, potassium and silica stay around. Only part of the potassium leaves; the rest stays in a mica-like clay (illite, written here as muscovite, its well-defined relative).', fr: 'Là où l’eau circule lentement, potassium et silice restent sur place. Une partie seulement du potassium part ; le reste demeure dans une argile proche des micas (l’illite, écrite ici comme la muscovite, sa cousine bien définie).' } },
      { kind: 'hydrolysis', from: 'K-feldspar', product: 'kaolinite', when: 'moderate', species: ['KAlSi3O8', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'K+', 'H4SiO4'],
        text: { en: 'H⁺ ions from the water take the place of K⁺ and break the feldspar framework. All the potassium and two thirds of the silica go into the water; aluminium stays and builds kaolinite with the rest of the silica.', fr: 'Les ions H⁺ de l’eau prennent la place de K⁺ et cassent la charpente du feldspath. Tout le potassium et deux tiers de la silice partent dans l’eau ; l’aluminium reste et forme la kaolinite avec le reste de la silice.' } },
      { kind: 'hydrolysis', from: 'K-feldspar', product: 'gibbsite', when: 'intense', species: ['KAlSi3O8', 'H+', 'H2O', 'Al(OH)3', 'K+', 'H4SiO4'],
        text: { en: 'With heavy leaching all the silica is carried away too: only aluminium hydroxide is left (total hydrolysis).', fr: 'Avec un lessivage intense, toute la silice est emportée aussi : il ne reste que l’hydroxyde d’aluminium (hydrolyse totale).' } },
      { kind: 'hydrolysis', from: 'muscovite', product: 'kaolinite', when: 'moderate', src: 'illite', species: ['KAl3Si3O10(OH)2', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'K+'],
        text: { en: 'If drainage improves, the illite in turn loses its potassium and becomes kaolinite.', fr: 'Si le drainage s’améliore, l’illite perd à son tour son potassium et devient kaolinite.' } },
      { kind: 'desilication', from: 'kaolinite', product: 'gibbsite', when: 'intense', species: ['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4'],
        text: { en: 'Kaolinite itself loses its silica under long, intense leaching, as in the humid tropics: gibbsite remains (laterites, bauxite).', fr: 'La kaolinite perd elle-même sa silice sous un lessivage long et intense, comme sous les tropiques humides : il reste la gibbsite (latérites, bauxite).' } },
    ],
  },
  {
    id: 'albite', group: 'feldspar', phase: 'albite', rate: 'albite', vol: 'albite', system: 'Na',
    steps: [
      { kind: 'hydrolysis', from: 'albite', product: 'beidellite-Na', when: 'poor', species: ['NaAlSi3O8', 'H+', 'H2O', 'Na0.33Al2.33Si3.67O10(OH)2', 'Na+', 'H4SiO4'],
        text: { en: 'In poorly drained soils with silica-rich water, a swelling 2:1 clay (smectite) forms and keeps some sodium between its layers.', fr: 'Dans les sols mal drainés à l’eau riche en silice se forme une argile gonflante 2:1 (smectite), qui garde un peu de sodium entre ses feuillets.' } },
      { kind: 'hydrolysis', from: 'albite', product: 'kaolinite', when: 'moderate', species: ['NaAlSi3O8', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'Na+', 'H4SiO4'],
        text: { en: 'The same exchange as for K-feldspar: sodium and two thirds of the silica leave, kaolinite stays.', fr: 'Le même échange que pour le feldspath potassique : le sodium et deux tiers de la silice partent, la kaolinite reste.' } },
      { kind: 'hydrolysis', from: 'albite', product: 'gibbsite', when: 'intense', species: ['NaAlSi3O8', 'H+', 'H2O', 'Al(OH)3', 'Na+', 'H4SiO4'],
        text: { en: 'Total hydrolysis under intense leaching.', fr: 'Hydrolyse totale sous un lessivage intense.' } },
      { kind: 'hydrolysis', from: 'beidellite-Na', product: 'kaolinite', when: 'moderate', species: ['Na0.33Al2.33Si3.67O10(OH)2', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'Na+', 'H4SiO4'],
        text: { en: 'Better drainage turns the smectite into kaolinite.', fr: 'Un meilleur drainage transforme la smectite en kaolinite.' } },
      { kind: 'desilication', from: 'kaolinite', product: 'gibbsite', when: 'intense', species: ['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4'],
        text: { en: 'Then kaolinite loses its silica: gibbsite.', fr: 'Puis la kaolinite perd sa silice : gibbsite.' } },
    ],
  },
  {
    id: 'anorthite', group: 'feldspar', phase: 'anorthite', rate: 'anorthite', vol: 'anorthite', system: 'Ca',
    steps: [
      { kind: 'hydrolysis', from: 'anorthite', product: 'beidellite-Ca', when: 'poor', species: ['CaAl2Si2O8', 'H+', 'H2O', 'H4SiO4', 'Ca0.165Al2.33Si3.67O10(OH)2', 'Ca+2'],
        text: { en: 'A smectite needs more silica than anorthite holds: it forms only if the water brings silica from elsewhere (for example from other minerals of the rock).', fr: 'Une smectite demande plus de silice que n’en contient l’anorthite : elle ne se forme que si l’eau apporte de la silice d’ailleurs (par exemple d’autres minéraux de la roche).' } },
      { kind: 'hydrolysis', from: 'anorthite', product: 'kaolinite', when: 'moderate', species: ['CaAl2Si2O8', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'Ca+2'],
        text: { en: 'Anorthite has exactly as many silicon as aluminium atoms, like kaolinite: calcium leaves, and no silica is left over for the water.', fr: 'L’anorthite a exactement autant d’atomes de silicium que d’aluminium, comme la kaolinite : le calcium part, et il ne reste aucune silice pour l’eau.' } },
      { kind: 'hydrolysis', from: 'anorthite', product: 'gibbsite', when: 'intense', species: ['CaAl2Si2O8', 'H+', 'H2O', 'Al(OH)3', 'Ca+2', 'H4SiO4'],
        text: { en: 'Total hydrolysis under intense leaching.', fr: 'Hydrolyse totale sous un lessivage intense.' } },
      { kind: 'desilication', from: 'kaolinite', product: 'gibbsite', when: 'intense', species: ['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4'],
        text: { en: 'Then kaolinite loses its silica: gibbsite.', fr: 'Puis la kaolinite perd sa silice : gibbsite.' } },
    ],
  },
  {
    id: 'muscovite', group: 'mica', phase: 'muscovite', rate: 'muscovite', vol: 'muscovite', system: 'K',
    steps: [
      { kind: 'hydrolysis', from: 'muscovite', product: 'kaolinite', when: 'moderate', species: ['KAl3Si3O10(OH)2', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'K+'],
        text: { en: 'Muscovite weathers slowly; when it does, it loses its potassium and becomes kaolinite, without releasing silica.', fr: 'La muscovite s’altère lentement ; elle perd alors son potassium et devient kaolinite, sans libérer de silice.' } },
      { kind: 'hydrolysis', from: 'muscovite', product: 'gibbsite', when: 'intense', species: ['KAl3Si3O10(OH)2', 'H+', 'H2O', 'Al(OH)3', 'K+', 'H4SiO4'],
        text: { en: 'Total hydrolysis under intense leaching.', fr: 'Hydrolyse totale sous un lessivage intense.' } },
      { kind: 'desilication', from: 'kaolinite', product: 'gibbsite', when: 'intense', species: ['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4'],
        text: { en: 'Then kaolinite loses its silica: gibbsite.', fr: 'Puis la kaolinite perd sa silice : gibbsite.' } },
    ],
  },
  {
    id: 'phlogopite', group: 'mica', phase: 'phlogopite', rate: 'biotite', vol: 'phlogopite', system: 'K',
    steps: [
      { kind: 'exchange', from: 'phlogopite', product: 'vermiculite', when: 'any', species: ['KMg3AlSi3O10(OH)2', 'Mg+2', 'Mg0.5Mg3AlSi3O10(OH)2', 'K+'],
        text: { en: 'The first change is gentle: potassium between the sheets is swapped for magnesium surrounded by water, and the sheets open up (vermiculite). This releases potassium for plants. Simplified formula: the interlayer water is not written, and in real vermiculite the layer charge is lower.', fr: 'Le premier changement est doux : le potassium entre les feuillets est remplacé par du magnésium entouré d’eau, et les feuillets s’ouvrent (vermiculite). Cela libère du potassium pour les plantes. Formule simplifiée : l’eau entre les feuillets n’est pas écrite, et la charge des feuillets est plus faible dans une vraie vermiculite.' } },
      { kind: 'hydrolysis', from: 'phlogopite', product: 'kaolinite', when: 'moderate', species: ['KMg3AlSi3O10(OH)2', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'K+', 'Mg+2', 'H4SiO4'],
        text: { en: 'Further weathering removes magnesium and potassium: kaolinite remains.', fr: 'Une altération plus poussée enlève magnésium et potassium : la kaolinite reste.' } },
      { kind: 'desilication', from: 'kaolinite', product: 'gibbsite', when: 'intense', species: ['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4'],
        text: { en: 'Then kaolinite loses its silica: gibbsite.', fr: 'Puis la kaolinite perd sa silice : gibbsite.' } },
    ],
  },
  {
    id: 'annite', group: 'mica', phase: 'annite', rate: 'biotite', vol: 'annite', system: 'K',
    steps: [
      { kind: 'oxidation', from: 'Fe+2', product: 'goethite', when: 'any', species: ['Fe+2', 'O2', 'H2O', 'FeOOH', 'H+'],
        text: { en: 'Iron(II) released from the mica meets oxygen and turns into iron(III), which is almost insoluble: it precipitates at once as goethite, the rust-brown colour of weathered biotite. This step makes acid.', fr: 'Le fer(II) libéré par le mica rencontre l’oxygène et devient du fer(III), presque insoluble : il précipite aussitôt en goethite, la couleur rouille de la biotite altérée. Cette étape produit de l’acide.' } },
      { kind: 'oxidation', from: 'annite', product: 'kaolinite', when: 'moderate', species: ['KFe3AlSi3O10(OH)2', 'O2', 'H+', 'H2O', 'Al2Si2O5(OH)4', 'FeOOH', 'K+', 'H4SiO4'],
        text: { en: 'The whole change in one line: hydrolysis and oxidation together give kaolinite and goethite; potassium and silica go into the water.', fr: 'Toute la transformation en une ligne : hydrolyse et oxydation ensemble donnent kaolinite et goethite ; potassium et silice partent dans l’eau.' } },
      { kind: 'desilication', from: 'kaolinite', product: 'gibbsite', when: 'intense', species: ['Al2Si2O5(OH)4', 'H2O', 'Al(OH)3', 'H4SiO4'],
        text: { en: 'Then kaolinite loses its silica: gibbsite, with goethite (a laterite).', fr: 'Puis la kaolinite perd sa silice : gibbsite, avec la goethite (une latérite).' } },
    ],
  },
  {
    id: 'forsterite', group: 'mafic', phase: 'forsterite', rate: 'forsterite', vol: 'forsterite', system: 'Mg',
    steps: [
      { kind: 'dissolution', from: 'forsterite', product: null, when: 'any', src: 'delvigne', species: ['Mg2SiO4', 'H+', 'Mg+2', 'H4SiO4'],
        text: { en: 'Olivine has no aluminium to build a clay with: in well-drained soils it simply dissolves, everything goes into the water (congruent dissolution). It is among the fastest silicates to weather.', fr: 'L’olivine n’a pas d’aluminium pour construire une argile : dans les sols bien drainés elle se dissout simplement, tout passe dans l’eau (dissolution congruente). C’est l’un des silicates qui s’altèrent le plus vite.' } },
    ],
  },
  {
    id: 'fayalite', group: 'mafic', phase: 'fayalite', rate: 'fayalite', vol: 'fayalite', system: 'Fe',
    steps: [
      { kind: 'dissolution', from: 'fayalite', product: null, when: 'any', species: ['Fe2SiO4', 'H+', 'Fe+2', 'H4SiO4'],
        text: { en: 'First the iron olivine dissolves, giving iron(II) and silica to the water.', fr: 'D’abord l’olivine ferreuse se dissout, donnant du fer(II) et de la silice à l’eau.' } },
      { kind: 'oxidation', from: 'Fe+2', product: 'goethite', when: 'any', species: ['Fe+2', 'O2', 'H2O', 'FeOOH', 'H+'],
        text: { en: 'With oxygen, iron(II) becomes iron(III) and precipitates as goethite.', fr: 'Avec l’oxygène, le fer(II) devient fer(III) et précipite en goethite.' } },
      { kind: 'oxidation', from: 'fayalite', product: 'goethite', when: 'any', species: ['Fe2SiO4', 'O2', 'H2O', 'FeOOH', 'H4SiO4'],
        text: { en: 'Both steps together: no acid is consumed overall, and only silica leaves.', fr: 'Les deux étapes ensemble : au total aucun acide n’est consommé, et seule la silice part.' } },
      { kind: 'dehydration', from: 'goethite', product: 'hematite', when: 'any', src: 'delvigne', species: ['FeOOH', 'Fe2O3', 'H2O'],
        text: { en: 'The iron oxides left by olivine include yellow-brown goethite and red hematite; this loss of water links the two.', fr: 'Les oxydes de fer laissés par l’olivine comprennent la goethite brun-jaune et l’hématite rouge ; cette perte d’eau relie les deux.' } },
    ],
  },
  {
    id: 'enstatite', group: 'mafic', phase: 'enstatite', rate: 'enstatite', vol: 'enstatite', system: 'Mg',
    steps: [
      { kind: 'dissolution', from: 'enstatite', product: null, when: 'any', src: 'colin', species: ['MgSiO3', 'H+', 'H2O', 'Mg+2', 'H4SiO4'],
        text: { en: 'Without aluminium, this pyroxene dissolves completely in well-drained soils. Where water lingers, magnesium and silica can build Mg-clays (smectite) or talc.', fr: 'Sans aluminium, ce pyroxène se dissout entièrement dans les sols bien drainés. Là où l’eau stagne, magnésium et silice peuvent former des argiles magnésiennes (smectite) ou du talc.' } },
    ],
  },
  {
    id: 'diopside', group: 'mafic', phase: 'diopside', rate: 'diopside', vol: 'diopside', system: 'Mg',
    steps: [
      { kind: 'dissolution', from: 'diopside', product: null, when: 'any', src: 'colin', species: ['CaMgSi2O6', 'H+', 'H2O', 'Ca+2', 'Mg+2', 'H4SiO4'],
        text: { en: 'Calcium, magnesium and silica go into the water. If the water becomes saturated with calcite (see the notes), the calcium can come back as calcium carbonate.', fr: 'Calcium, magnésium et silice passent dans l’eau. Si l’eau devient saturée en calcite (voir les notes), le calcium peut revenir sous forme de carbonate de calcium.' } },
    ],
  },
  {
    id: 'tremolite', group: 'mafic', phase: 'tremolite', rate: 'tremolite', vol: 'tremolite', system: 'Mg',
    steps: [
      { kind: 'dissolution', from: 'tremolite', product: null, when: 'any', species: ['Ca2Mg5Si8O22(OH)2', 'H+', 'H2O', 'Ca+2', 'Mg+2', 'H4SiO4'],
        text: { en: 'This aluminium-free amphibole dissolves like the pyroxenes. Common amphiboles (hornblende) also hold aluminium and iron, and then leave clays and iron oxides.', fr: 'Cette amphibole sans aluminium se dissout comme les pyroxènes. Les amphiboles courantes (hornblende) contiennent aussi aluminium et fer, et laissent alors des argiles et des oxydes de fer.' } },
    ],
  },
  {
    id: 'quartz', group: 'silica', phase: 'quartz', rate: 'quartz', vol: 'quartz', system: 'Si',
    steps: [
      { kind: 'dissolution', from: 'quartz', product: null, when: 'any', species: ['SiO2', 'H2O', 'H4SiO4'],
        text: { en: 'Quartz only dissolves, very slowly, into silicic acid. No H⁺ is used: below pH 9 its solubility hardly depends on pH.', fr: 'Le quartz se dissout seulement, très lentement, en acide silicique. Aucun H⁺ n’est utilisé : sous pH 9 sa solubilité dépend à peine du pH.' } },
      { kind: 'dissolution', from: 'H4SiO4', product: null, to: { en: 'silicate ion', fr: 'ion silicate' }, when: 'any', species: ['H4SiO4', 'H3SiO4-', 'H+'],
        text: { en: 'In very alkaline water silicic acid loses a proton; the silicate ion formed lets more quartz dissolve.', fr: 'En eau très alcaline l’acide silicique perd un proton ; l’ion silicate formé permet à davantage de quartz de se dissoudre.' } },
    ],
  },
];

export const GROUPS = {
  feldspar: { en: 'Feldspars', fr: 'Feldspaths' },
  mica: { en: 'Micas', fr: 'Micas' },
  mafic: { en: 'Olivine, pyroxenes, amphibole', fr: 'Olivine, pyroxènes, amphibole' },
  silica: { en: 'Silica', fr: 'Silice' },
};

export const byId = (id) => MINERALS.find((m) => m.id === id);
