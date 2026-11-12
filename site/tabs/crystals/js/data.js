// Data of the crystal-systems tab: the seven systems, the six families, the
// 14 Bravais lattices, the 32 crystal classes (point groups), a gallery of
// forms, verified reference minerals and the corrections made to the course
// notes. Cell lengths in `cell` are illustrative, not measured: they are
// chosen so that the seven unit cells can be drawn side by side.

export const FAMILIES = [
  { id: 'triclinic', en: 'Triclinic', fr: 'Triclinique', systems: ['triclinic'], classes: 2, space: 2, lattices: 1 },
  { id: 'monoclinic', en: 'Monoclinic', fr: 'Monoclinique', systems: ['monoclinic'], classes: 3, space: 13, lattices: 2 },
  { id: 'orthorhombic', en: 'Orthorhombic', fr: 'Orthorhombique', systems: ['orthorhombic'], classes: 3, space: 59, lattices: 4 },
  { id: 'tetragonal', en: 'Tetragonal', fr: 'Tétragonal', systems: ['tetragonal'], classes: 7, space: 68, lattices: 2 },
  { id: 'hexagonal', en: 'Hexagonal', fr: 'Hexagonale', systems: ['trigonal', 'hexagonal'], classes: 12, space: 52, lattices: 2 },
  { id: 'cubic', en: 'Cubic', fr: 'Cubique', systems: ['cubic'], classes: 5, space: 36, lattices: 3 },
];

export const SYSTEMS = [
  {
    id: 'triclinic',
    en: 'Triclinic',
    fr: 'Triclinique',
    family: 'triclinic',
    cell: { a: 1, b: 0.82, c: 0.68, alpha: 78, beta: 74, gamma: 68 },
    constraints: {
      en: 'a ≠ b ≠ c; α ≠ β ≠ γ ≠ 90°',
      fr: 'a ≠ b ≠ c ; α ≠ β ≠ γ ≠ 90°',
    },
    symmetry: {
      en: 'No rotation; at most a centre of inversion',
      fr: 'Aucune rotation ; au plus un centre d’inversion',
    },
    lattices: ['P'],
    classes: ['1', '1bar'],
    space: 2,
    examples: ['kyanite', 'albite'],
    look: {
      en: 'Faces in no special direction, no symmetry visible. Well-formed crystals are rare; kyanite and albite are examples.',
      fr: 'Des faces sans direction privilégiée, aucune symétrie visible. Les cristaux bien formés sont rares ; le disthène et l’albite en sont des exemples.',
    },
  },
  {
    id: 'monoclinic',
    en: 'Monoclinic',
    fr: 'Monoclinique',
    family: 'monoclinic',
    cell: { a: 1, b: 0.8, c: 0.9, alpha: 90, beta: 115, gamma: 90 },
    constraints: {
      en: 'a ≠ b ≠ c; α = γ = 90°, β ≠ 90° (b is the unique axis)',
      fr: 'a ≠ b ≠ c ; α = γ = 90°, β ≠ 90° (b est l’axe unique)',
    },
    symmetry: {
      en: 'One 2-fold axis, or one mirror plane',
      fr: 'Un axe binaire, ou un plan miroir',
    },
    lattices: ['P', 'C'],
    classes: ['2', 'm', '2/m'],
    space: 13,
    examples: ['gypsum', 'orthoclase', 'augite'],
    look: {
      en: 'One direction of symmetry: tabular or prismatic crystals, often with a slanted end face. Gypsum, orthoclase and augite.',
      fr: 'Une seule direction de symétrie : cristaux tabulaires ou prismatiques, souvent avec une face terminale oblique. Gypse, orthose et augite.',
    },
  },
  {
    id: 'orthorhombic',
    en: 'Orthorhombic',
    fr: 'Orthorhombique',
    family: 'orthorhombic',
    cell: { a: 1, b: 0.78, c: 0.92, alpha: 90, beta: 90, gamma: 90 },
    constraints: {
      en: 'a ≠ b ≠ c; α = β = γ = 90°',
      fr: 'a ≠ b ≠ c ; α = β = γ = 90°',
    },
    symmetry: {
      en: 'Three perpendicular 2-fold axes (or one 2-fold axis and two mirrors)',
      fr: 'Trois axes binaires perpendiculaires (ou un axe binaire et deux miroirs)',
    },
    lattices: ['P', 'C', 'I', 'F'],
    classes: ['222', 'mm2', 'mmm'],
    space: 59,
    examples: ['aragonite', 'topaz', 'barite', 'hemimorphite'],
    look: {
      en: 'Three perpendicular symmetry directions: blocky or prismatic crystals with right-angled cross-sections. Aragonite, topaz, barite.',
      fr: 'Trois directions de symétrie perpendiculaires : cristaux massifs ou prismatiques à section droite. Aragonite, topaze, barytine.',
    },
  },
  {
    id: 'tetragonal',
    en: 'Tetragonal',
    fr: 'Tétragonal',
    family: 'tetragonal',
    cell: { a: 1, b: 1, c: 1.35, alpha: 90, beta: 90, gamma: 90 },
    constraints: {
      en: 'a = b ≠ c; α = β = γ = 90°',
      fr: 'a = b ≠ c ; α = β = γ = 90°',
    },
    symmetry: {
      en: 'One 4-fold axis (the c axis)',
      fr: 'Un axe quaternaire (l’axe c)',
    },
    lattices: ['P', 'I'],
    classes: ['4', '4bar', '4/m', '422', '4mm', '4bar2m', '4/mmm'],
    space: 68,
    examples: ['rutile', 'zircon', 'scheelite', 'leucite', 'chalcopyrite'],
    look: {
      en: 'One 4-fold axis: square cross-sections, four-sided pyramids, or a prism capped by a four-sided pyramid. Rutile, zircon, scheelite.',
      fr: 'Un axe quaternaire : sections carrées, pyramides à quatre faces, ou prisme coiffé d’une pyramide à quatre faces. Rutile, zircon, scheelite.',
    },
  },
  {
    id: 'trigonal',
    en: 'Trigonal',
    fr: 'Trigonal',
    family: 'hexagonal',
    cell: { a: 1, b: 1, c: 1.25, alpha: 90, beta: 90, gamma: 120 },
    constraints: {
      en: 'Hexagonal setting: a = b ≠ c, α = β = 90°, γ = 120°. Rhombohedral setting: a = b = c, α = β = γ ≠ 90°',
      fr: 'Maille hexagonale : a = b ≠ c, α = β = 90°, γ = 120°. Maille rhomboédrique : a = b = c, α = β = γ ≠ 90°',
    },
    symmetry: {
      en: 'One 3-fold axis',
      fr: 'Un axe ternaire',
    },
    lattices: ['R', 'P (hexagonal setting)'],
    classes: ['3', '3bar', '32', '3m', '3barm'],
    space: 25,
    examples: ['quartz', 'calcite', 'corundum', 'hematite', 'ilmenite', 'dolomite'],
    look: {
      en: 'One 3-fold axis: triangular faces, three-sided pyramids or rhombohedra; six-sided prisms are common too. Quartz, calcite, corundum.',
      fr: 'Un axe ternaire : faces triangulaires, pyramides à trois faces ou rhomboèdres ; les prismes à six faces sont fréquents aussi. Quartz, calcite, corindon.',
    },
  },
  {
    id: 'hexagonal',
    en: 'Hexagonal',
    fr: 'Hexagonal',
    family: 'hexagonal',
    cell: { a: 1, b: 1, c: 1.25, alpha: 90, beta: 90, gamma: 120 },
    constraints: {
      en: 'a = b ≠ c; α = β = 90°, γ = 120°',
      fr: 'a = b ≠ c ; α = β = 90°, γ = 120°',
    },
    symmetry: {
      en: 'One 6-fold axis',
      fr: 'Un axe sénaire',
    },
    lattices: ['P'],
    classes: ['6', '6bar', '6/m', '622', '6mm', '6barm2', '6/mmm'],
    space: 27,
    examples: ['apatite', 'beryl'],
    look: {
      en: 'One 6-fold axis: six-sided prisms or pyramids, often with a flat basal face. Apatite, beryl.',
      fr: 'Un axe sénaire : prismes ou pyramides à six faces, souvent avec une face basale plane. Apatite, béryl.',
    },
  },
  {
    id: 'cubic',
    en: 'Cubic (isometric)',
    fr: 'Cubique (isométrique)',
    family: 'cubic',
    cell: { a: 1, b: 1, c: 1, alpha: 90, beta: 90, gamma: 90 },
    constraints: {
      en: 'a = b = c; α = β = γ = 90°',
      fr: 'a = b = c ; α = β = γ = 90°',
    },
    symmetry: {
      en: 'Four 3-fold axes (and three 4-fold axes)',
      fr: 'Quatre axes ternaires (et trois axes quaternaires)',
    },
    lattices: ['P', 'I', 'F'],
    classes: ['23', 'm3bar', '432', '4bar3m', 'm3barm'],
    space: 36,
    examples: ['pyrite', 'sphalerite', 'fluorite', 'diamond', 'halite', 'langbeinite'],
    look: {
      en: 'Four 3-fold axes: cubes, octahedra, dodecahedra or combinations of these. Pyrite, fluorite, diamond.',
      fr: 'Quatre axes ternaires : cubes, octaèdres, dodécaèdres ou leurs combinaisons. Pyrite, fluorite, diamant.',
    },
  },
];

export const CLASSES = [
  // Triclinic
  { sys: 'triclinic', id: '1', hm: '1', schoen: 'C₁', en: 'Pedial', fr: 'Pédiale', what: { en: 'Identity only: no symmetry element besides the identity.', fr: 'Seulement l’identité : aucun élément de symétrie en dehors de l’identité.' } },
  { sys: 'triclinic', id: '1bar', hm: '1̄', schoen: 'Cᵢ', en: 'Pinacoidal', fr: 'Pinacoïdale', what: { en: 'One centre of inversion.', fr: 'Un centre d’inversion.' } },
  // Monoclinic
  { sys: 'monoclinic', id: '2', hm: '2', schoen: 'C₂', en: 'Sphenoidal', fr: 'Sphénoïdale', what: { en: 'One 2-fold rotation axis (180°).', fr: 'Un axe de rotation binaire (180°).' } },
  { sys: 'monoclinic', id: 'm', hm: 'm', schoen: 'Cₛ', en: 'Domatic', fr: 'Domatique', what: { en: 'One mirror plane.', fr: 'Un plan miroir.' } },
  { sys: 'monoclinic', id: '2/m', hm: '2/m', schoen: 'C₂ₕ', en: 'Prismatic', fr: 'Prismatique', what: { en: 'A 2-fold axis and a mirror plane perpendicular to it.', fr: 'Un axe binaire et un plan miroir perpendiculaire à cet axe.' } },
  // Orthorhombic
  { sys: 'orthorhombic', id: '222', hm: '222', schoen: 'D₂', en: 'Disphenoidal', fr: 'Disphénoïdale', what: { en: 'Three mutually perpendicular 2-fold axes.', fr: 'Trois axes binaires mutuellement perpendiculaires.' } },
  { sys: 'orthorhombic', id: 'mm2', hm: 'mm2', schoen: 'C₂ᵥ', en: 'Pyramidal', fr: 'Pyramidale', what: { en: 'One 2-fold axis and two mirror planes.', fr: 'Un axe binaire et deux plans miroirs.' } },
  { sys: 'orthorhombic', id: 'mmm', hm: 'mmm', schoen: 'D₂ₕ', en: 'Dipyramidal', fr: 'Dipyramidale', what: { en: 'Three 2-fold axes and three mirror planes, each perpendicular to an axis.', fr: 'Trois axes binaires et trois plans miroirs, chacun perpendiculaire à un axe.' } },
  // Tetragonal
  { sys: 'tetragonal', id: '4', hm: '4', schoen: 'C₄', en: 'Tetragonal pyramidal', fr: 'Pyramidale tétragonale', what: { en: 'One 4-fold rotation axis (90°).', fr: 'Un axe de rotation quaternaire (90°).' } },
  { sys: 'tetragonal', id: '4bar', hm: '4̄', schoen: 'S₄', en: 'Tetragonal disphenoidal', fr: 'Disphénoïdale tétragonale', what: { en: 'One 4-fold roto-inversion axis.', fr: 'Un axe de roto-inversion quaternaire.' } },
  { sys: 'tetragonal', id: '4/m', hm: '4/m', schoen: 'C₄ₕ', en: 'Tetragonal dipyramidal', fr: 'Dipyramidale tétragonale', what: { en: 'A 4-fold axis and a mirror plane perpendicular to it.', fr: 'Un axe quaternaire et un plan miroir perpendiculaire à cet axe.' } },
  { sys: 'tetragonal', id: '422', hm: '422', schoen: 'D₄', en: 'Tetragonal trapezohedral', fr: 'Trapézoédrique tétragonale', what: { en: 'A 4-fold axis and two 2-fold axes perpendicular to it.', fr: 'Un axe quaternaire et deux axes binaires perpendiculaires à l’axe quaternaire.' } },
  { sys: 'tetragonal', id: '4mm', hm: '4mm', schoen: 'C₄ᵥ', en: 'Ditetragonal pyramidal', fr: 'Pyramidale ditétragonale', what: { en: 'A 4-fold axis and two mirror planes.', fr: 'Un axe quaternaire et deux plans miroirs.' } },
  { sys: 'tetragonal', id: '4bar2m', hm: '4̄2m', schoen: 'D₂d', en: 'Tetragonal scalenohedral', fr: 'Scalénoédrique tétragonale', what: { en: 'A 4̄ axis, a 2-fold axis and a mirror plane.', fr: 'Un axe 4̄, un axe binaire et un plan miroir.' } },
  { sys: 'tetragonal', id: '4/mmm', hm: '4/mmm', schoen: 'D₄ₕ', en: 'Ditetragonal dipyramidal', fr: 'Dipyramidale ditétragonale', what: { en: 'A 4-fold axis, two 2-fold axes and three mirror planes.', fr: 'Un axe quaternaire, deux axes binaires et trois plans miroirs.' } },
  // Trigonal
  { sys: 'trigonal', id: '3', hm: '3', schoen: 'C₃', en: 'Trigonal pyramidal', fr: 'Pyramidale trigonale', what: { en: 'One 3-fold rotation axis (120°).', fr: 'Un axe de rotation ternaire (120°).' } },
  { sys: 'trigonal', id: '3bar', hm: '3̄', schoen: 'C₃ᵢ', en: 'Rhombohedral', fr: 'Rhomboédrique', what: { en: 'One 3-fold roto-inversion axis.', fr: 'Un axe de roto-inversion ternaire.' } },
  { sys: 'trigonal', id: '32', hm: '32', schoen: 'D₃', en: 'Trigonal trapezohedral', fr: 'Trapézoédrique trigonale', what: { en: 'A 3-fold axis and two 2-fold axes.', fr: 'Un axe ternaire et deux axes binaires.' } },
  { sys: 'trigonal', id: '3m', hm: '3m', schoen: 'C₃ᵥ', en: 'Ditrigonal pyramidal', fr: 'Pyramidale ditrigonale', what: { en: 'A 3-fold axis and two mirror planes.', fr: 'Un axe ternaire et deux plans miroirs.' } },
  { sys: 'trigonal', id: '3barm', hm: '3̄m', schoen: 'D₃d', en: 'Ditrigonal scalenohedral', fr: 'Scalénoédrique ditrigonale', what: { en: 'A 3̄ axis and two mirror planes.', fr: 'Un axe 3̄ et deux plans miroirs.' } },
  // Hexagonal
  { sys: 'hexagonal', id: '6', hm: '6', schoen: 'C₆', en: 'Hexagonal pyramidal', fr: 'Pyramidale hexagonale', what: { en: 'One 6-fold rotation axis (60°).', fr: 'Un axe de rotation sénaire (60°).' } },
  { sys: 'hexagonal', id: '6bar', hm: '6̄', schoen: 'C₃ₕ', en: 'Trigonal dipyramidal', fr: 'Dipyramidale trigonale', what: { en: 'One 6-fold roto-inversion axis.', fr: 'Un axe de roto-inversion sénaire.' } },
  { sys: 'hexagonal', id: '6/m', hm: '6/m', schoen: 'C₆ₕ', en: 'Hexagonal dipyramidal', fr: 'Dipyramidale hexagonale', what: { en: 'A 6-fold axis and a mirror plane perpendicular to it.', fr: 'Un axe sénaire et un plan miroir perpendiculaire à cet axe.' } },
  { sys: 'hexagonal', id: '622', hm: '622', schoen: 'D₆', en: 'Hexagonal trapezohedral', fr: 'Trapézoédrique hexagonale', what: { en: 'A 6-fold axis and two 2-fold axes.', fr: 'Un axe sénaire et deux axes binaires.' } },
  { sys: 'hexagonal', id: '6mm', hm: '6mm', schoen: 'C₆ᵥ', en: 'Dihexagonal pyramidal', fr: 'Pyramidale dihexagonale', what: { en: 'A 6-fold axis and two mirror planes.', fr: 'Un axe sénaire et deux plans miroirs.' } },
  { sys: 'hexagonal', id: '6barm2', hm: '6̄m2', schoen: 'D₃ₕ', en: 'Ditrigonal dipyramidal', fr: 'Dipyramidale ditrigonale', what: { en: 'A 6̄ axis, a 2-fold axis and a mirror plane.', fr: 'Un axe 6̄, un axe binaire et un plan miroir.' } },
  { sys: 'hexagonal', id: '6/mmm', hm: '6/mmm', schoen: 'D₆ₕ', en: 'Dihexagonal dipyramidal', fr: 'Dipyramidale dihexagonale', what: { en: 'A 6-fold axis, two 2-fold axes and three mirror planes.', fr: 'Un axe sénaire, deux axes binaires et trois plans miroirs.' } },
  // Cubic
  { sys: 'cubic', id: '23', hm: '23', schoen: 'T', en: 'Tetartoidal', fr: 'Tétartoïdale', what: { en: 'Four 3-fold axes.', fr: 'Quatre axes ternaires.' } },
  { sys: 'cubic', id: 'm3bar', hm: 'm3̄', schoen: 'Tₕ', en: 'Diploidal', fr: 'Diploïdale', what: { en: 'Four 3-fold axes and three mirror planes.', fr: 'Quatre axes ternaires et trois plans miroirs.' } },
  { sys: 'cubic', id: '432', hm: '432', schoen: 'O', en: 'Gyroidal', fr: 'Gyroïdale', what: { en: 'Four 3-fold axes and three 4-fold axes.', fr: 'Quatre axes ternaires et trois axes quaternaires.' } },
  { sys: 'cubic', id: '4bar3m', hm: '4̄3m', schoen: 'Td', en: 'Hextetrahedral', fr: 'Hexatétraédrique', what: { en: 'Four 3-fold axes, three 4̄ axes and six mirror planes.', fr: 'Quatre axes ternaires, trois axes 4̄ et six plans miroirs.' } },
  { sys: 'cubic', id: 'm3barm', hm: 'm3̄m', schoen: 'Oₕ', en: 'Hexoctahedral', fr: 'Hexoctaédrique', what: { en: 'Four 3-fold axes, three 4-fold axes, six 2-fold axes and nine mirror planes.', fr: 'Quatre axes ternaires, trois axes quaternaires, six axes binaires et neuf plans miroirs.' } },
];

export const FORMS = [
  {
    id: 'cube',
    index: '{100}',
    en: 'Cube',
    fr: 'Cube',
    body: {
      en: 'Six square faces, all equivalent in the cubic system. A cube is the typical habit of halite, fluorite and pyrite.',
      fr: 'Six faces carrées, toutes équivalentes dans le système cubique. Le cube est l’habit typique de la halite, de la fluorite et de la pyrite.',
    },
  },
  {
    id: 'octahedron',
    index: '{111}',
    en: 'Octahedron',
    fr: 'Octaèdre',
    body: {
      en: 'Eight equilateral triangles. In the cubic system it is the form of diamond and fluorite; in the tetragonal system the same indices give a four-sided dipyramid.',
      fr: 'Huit triangles équilatéraux. Dans le système cubique, c’est la forme du diamant et de la fluorite ; dans le système tétragonal, les mêmes indices donnent une dipyramide à quatre faces.',
    },
  },
  {
    id: 'prism',
    index: '{10-10}',
    en: 'Hexagonal prism',
    fr: 'Prisme hexagonal',
    body: {
      en: 'Six rectangular faces parallel to the c axis. Quartz, beryl and apatite commonly show it, often capped by a pyramid or a flat basal face.',
      fr: 'Six faces rectangulaires parallèles à l’axe c. Le quartz, le béryl et l’apatite le montrent souvent, coiffé d’une pyramide ou d’une face basale plane.',
    },
  },
  {
    id: 'rhombohedron',
    index: '{10-11}',
    en: 'Rhombohedron',
    fr: 'Rhomboèdre',
    body: {
      en: 'Six rhombic faces. Calcite and dolomite cleave into it; the angle between its faces is close to 75° or 105°, which is why calcite is said to have a rhombohedral cleavage.',
      fr: 'Six faces en losange. La calcite et la dolomite s’y clivent ; l’angle entre ses faces vaut environ 75° ou 105°, d’où le clivage rhomboédrique de la calcite.',
    },
  },
];

// The 14 Bravais lattices. `example` is a mineral of the tab whose space group
// uses that lattice; some lattices have no common example here and say so.
export const BRAVAIS = [
  { id: 'aP', sys: 'triclinic', centring: 'P', symbol: 'aP', example: 'kyanite' },
  { id: 'mP', sys: 'monoclinic', centring: 'P', symbol: 'mP', example: null },
  { id: 'mC', sys: 'monoclinic', centring: 'C', symbol: 'mC (mS)', example: 'orthoclase' },
  { id: 'oP', sys: 'orthorhombic', centring: 'P', symbol: 'oP', example: 'aragonite' },
  { id: 'oC', sys: 'orthorhombic', centring: 'C', symbol: 'oC (oS)', example: null },
  { id: 'oI', sys: 'orthorhombic', centring: 'I', symbol: 'oI', example: 'hemimorphite' },
  { id: 'oF', sys: 'orthorhombic', centring: 'F', symbol: 'oF', example: null },
  { id: 'tP', sys: 'tetragonal', centring: 'P', symbol: 'tP', example: 'rutile' },
  { id: 'tI', sys: 'tetragonal', centring: 'I', symbol: 'tI', example: 'zircon' },
  { id: 'hP', sys: 'hexagonal', centring: 'P', symbol: 'hP', example: 'apatite' },
  { id: 'hR', sys: 'trigonal', centring: 'R', symbol: 'hR', example: 'calcite' },
  { id: 'cP', sys: 'cubic', centring: 'P', symbol: 'cP', example: 'pyrite' },
  { id: 'cI', sys: 'cubic', centring: 'I', symbol: 'cI', example: null },
  { id: 'cF', sys: 'cubic', centring: 'F', symbol: 'cF', example: 'fluorite' },
];

export const CENTRING = {
  P: { en: 'primitive: one lattice point per cell', fr: 'primitif : un nœud par maille' },
  C: { en: 'base-centred: two lattice points, one at the centre of the C face', fr: 'centré sur une base : deux nœuds, un au centre de la face C' },
  I: { en: 'body-centred: two lattice points, one at the centre of the cell', fr: 'centré : deux nœuds, un au centre de la maille' },
  F: { en: 'face-centred: four lattice points, one at the centre of each face', fr: 'à faces centrées : quatre nœuds, un au centre de chaque face' },
  R: { en: 'rhombohedral centring: three lattice points, on the body diagonal', fr: 'centrage rhomboédrique : trois nœuds, sur la diagonale du corps' },
};

export const CONFUSIONS = [
  {
    en: '“Isometric” is not a separate system.',
    fr: '« Isométrique » n’est pas un système à part.',
    body: {
      en: 'Isometric is an older synonym of cubic: the three axes are equal and perpendicular, so the cell is a cube. The seven systems are triclinic, monoclinic, orthorhombic, tetragonal, trigonal, hexagonal and cubic.',
      fr: 'Isométrique est un ancien synonyme de cubique : les trois axes sont égaux et perpendiculaires, donc la maille est un cube. Les sept systèmes sont triclinique, monoclinique, orthorhombique, tétragonal, trigonal, hexagonal et cubique.',
    },
    src: ['sys'],
  },
  {
    en: 'Six crystal families, seven crystal systems.',
    fr: 'Six familles cristallines, sept systèmes cristallins.',
    body: {
      en: 'The hexagonal family contains two systems: trigonal (a 3-fold axis) and hexagonal (a 6-fold axis). It has 12 point groups (5 + 7), 52 space groups (25 + 27) and two lattices, hP and hR. All other families contain a single system.',
      fr: 'La famille hexagonale contient deux systèmes : trigonal (axe ternaire) et hexagonal (axe sénaire). Elle compte 12 groupes ponctuels (5 + 7), 52 groupes d’espace (25 + 27) et deux réseaux, hP et hR. Les autres familles ne contiennent qu’un seul système.',
    },
    src: ['sys', 'point', 'bravais'],
  },
  {
    en: 'Rhombohedral is a lattice setting, not a seventh system.',
    fr: 'Rhomboédrique est une maille, pas un septième système.',
    body: {
      en: 'The rhombohedral lattice (symbol R) is one of the 14 Bravais lattices. A trigonal crystal can be described in a rhombohedral cell (a = b = c, α = β = γ ≠ 90°) or in a hexagonal cell (a = b, γ = 120°); both describe the same crystal. Some older texts call “rhombohedral” a system; the usual count keeps seven systems.',
      fr: 'Le réseau rhomboédrique (symbole R) est l’un des 14 réseaux de Bravais. Un cristal trigonal peut se décrire dans une maille rhomboédrique (a = b = c, α = β = γ ≠ 90°) ou dans une maille hexagonale (a = b, γ = 120°) ; les deux décrivent le même cristal. Des textes anciens font de « rhomboédrique » un système ; le décompte usuel garde sept systèmes.',
    },
    src: ['sys', 'bravais'],
  },
  {
    en: 'A Bravais lattice is not the full crystal structure.',
    fr: 'Un réseau de Bravais n’est pas la structure complète.',
    body: {
      en: 'The lattice is the periodic array of points; the structure is the lattice plus the basis (the atoms or ions attached to each point). Two crystals with the same lattice, such as halite and galena, have different structures because their basis differs.',
      fr: 'Le réseau est l’ensemble périodique de nœuds ; la structure est le réseau plus le motif (les atomes ou ions attachés à chaque nœud). Deux cristaux de même réseau, comme la halite et la galène, ont des structures différentes parce que leur motif diffère.',
    },
    src: ['struct', 'bravais'],
  },
  {
    en: '32 point groups, 230 space groups.',
    fr: '32 groupes ponctuels, 230 groupes d’espace.',
    body: {
      en: 'The 32 crystal classes are the point groups: they describe the symmetry of a crystal as seen from outside, around a point. The 230 space groups add the translations, screw axes and glide planes that repeat the pattern through space. A mineral page usually gives the space group, written in Hermann–Mauguin notation.',
      fr: 'Les 32 classes cristallines sont les groupes ponctuels : ils décrivent la symétrie du cristal vue de l’extérieur, autour d’un point. Les 230 groupes d’espace ajoutent les translations, les axes hélicoïdaux et les plans de glissement qui répètent le motif dans l’espace. Une fiche minéralogique donne généralement le groupe d’espace, en notation Hermann–Mauguin.',
    },
    src: ['point', 'sys'],
  },
  {
    en: 'Habit is not proof of the system.',
    fr: 'L’habit ne prouve pas le système.',
    body: {
      en: 'Leucite forms pseudocubic icositetrahedra but is tetragonal; aragonite twins can look hexagonal; gypsum twins look like a swallow tail. The system is read from the symmetry of the faces (or from X-ray diffraction), not from the overall shape alone.',
      fr: 'La leucite forme des icositétraèdres pseudocubiques mais elle est tétragonale ; les macles de l’aragonite peuvent sembler hexagonales ; celles du gypse dessinent une queue d’aronde. Le système se lit sur la symétrie des faces (ou par diffraction des rayons X), pas sur la seule forme générale.',
    },
    src: ['leucite', 'aragonite', 'gypsum'],
  },
  {
    en: 'Amorphous solids have no crystal system.',
    fr: 'Les solides amorphes n’ont pas de système cristallin.',
    body: {
      en: 'Opal, obsidian and glass lack long-range order: there is no unit cell to describe, so no crystal system, no Bravais lattice and no space group. A crystal needs a pattern that repeats periodically in three dimensions.',
      fr: 'L’opale, l’obsidienne et le verre n’ont pas d’ordre à longue distance : il n’y a pas de maille à décrire, donc pas de système cristallin, pas de réseau de Bravais ni de groupe d’espace. Un cristal suppose un motif qui se répète périodiquement dans les trois dimensions.',
    },
    src: ['struct'],
  },
];

export const MINERALS = [
  {
    id: 'albite', en: 'Albite', fr: 'Albite', formula: 'NaAlSi₃O₈', sys: 'triclinic', cls: '1̄', space: 'C1̄',
    forms: { en: 'Tabular crystals, polysynthetic twinning', fr: 'Cristaux tabulaires, macles polysynthétiques' },
    cleavage: { en: '{001} perfect, {010} good', fr: '{001} parfait, {010} bon' }, src: 'albite',
  },
  {
    id: 'kyanite', en: 'Kyanite', fr: 'Disthène', formula: 'Al₂SiO₅', sys: 'triclinic', cls: '1̄', space: 'P1̄',
    forms: { en: 'Bladed, elongated crystals', fr: 'Cristaux lamellaires, allongés' },
    cleavage: { en: '{100} perfect, {010} good', fr: '{100} parfait, {010} bon' }, src: 'kyanite',
  },
  {
    id: 'gypsum', en: 'Gypsum', fr: 'Gypse', formula: 'CaSO₄·2H₂O', sys: 'monoclinic', cls: '2/m', space: 'I2/a',
    forms: { en: 'Tabular or prismatic, swallow-tail twins', fr: 'Tabulaires ou prismatiques, macles en queue d’aronde' },
    cleavage: { en: '{010} perfect', fr: '{010} parfait' }, src: 'gypsum',
  },
  {
    id: 'orthoclase', en: 'Orthoclase', fr: 'Orthose', formula: 'KAlSi₃O₈', sys: 'monoclinic', cls: '2/m', space: 'C2/m',
    forms: { en: 'Tabular, Carlsbad twinning', fr: 'Tabulaire, macle de Carlsbad' },
    cleavage: { en: '{001} and {010} perfect', fr: '{001} et {010} parfaits' }, src: 'orthoclase',
  },
  {
    id: 'augite', en: 'Augite', fr: 'Augite', formula: '(Ca,Na)(Mg,Fe,Al)(Si,Al)₂O₆', sys: 'monoclinic', cls: '2/m', space: 'C2/c',
    forms: { en: 'Short prismatic crystals, granular masses', fr: 'Cristaux prismatiques courts, masses grenues' },
    cleavage: { en: '{110} good', fr: '{110} bon' }, src: 'augite',
  },
  {
    id: 'aragonite', en: 'Aragonite', fr: 'Aragonite', formula: 'CaCO₃', sys: 'orthorhombic', cls: 'mmm', space: 'Pnma',
    forms: { en: 'Acicular, pseudo-hexagonal twins', fr: 'Aciculaires, macles pseudo-hexagonales' },
    cleavage: { en: '{010} distinct', fr: '{010} distinct' }, src: 'aragonite',
  },
  {
    id: 'topaz', en: 'Topaz', fr: 'Topaze', formula: 'Al₂SiO₄(F,OH)₂', sys: 'orthorhombic', cls: 'mmm', space: 'Pbnm',
    forms: { en: 'Prismatic, chisel-shaped terminations', fr: 'Prismatiques, terminaisons en biseau' },
    cleavage: { en: '{001} perfect', fr: '{001} parfait' }, src: 'topaz',
  },
  {
    id: 'barite', en: 'Barite', fr: 'Barytine', formula: 'BaSO₄', sys: 'orthorhombic', cls: 'mmm', space: 'Pnma',
    forms: { en: 'Tabular, prismatic, rose-like aggregates', fr: 'Tabulaires, prismatiques, agrégats en rosette' },
    cleavage: { en: '{001} perfect', fr: '{001} parfait' }, src: 'barite',
  },
  {
    id: 'hemimorphite', en: 'Hemimorphite', fr: 'Hémimorphite', formula: 'Zn₄Si₂O₇(OH)₂·H₂O', sys: 'orthorhombic', cls: 'mm2', space: 'Imm2',
    forms: { en: 'Hemimorphic crystals, coxcomb aggregates', fr: 'Cristaux hémimorphes, agrégats en crête de coq' },
    cleavage: { en: '{110} perfect', fr: '{110} parfait' }, src: 'hemimorphite',
  },
  {
    id: 'rutile', en: 'Rutile', fr: 'Rutile', formula: 'TiO₂', sys: 'tetragonal', cls: '4/mmm', space: 'P4₂/mnm',
    forms: { en: 'Prismatic, acicular, twinning on {011}', fr: 'Prismatiques, aciculaires, macles sur {011}' },
    cleavage: { en: '{110} good', fr: '{110} bon' }, src: 'rutile',
  },
  {
    id: 'zircon', en: 'Zircon', fr: 'Zircon', formula: 'ZrSiO₄', sys: 'tetragonal', cls: '4/mmm', space: 'I4₁/amd',
    forms: { en: 'Prismatic to tabular crystals', fr: 'Cristaux prismatiques à tabulaires' },
    cleavage: { en: '{110} indistinct', fr: '{110} indistinct' }, src: 'zircon',
  },
  {
    id: 'scheelite', en: 'Scheelite', fr: 'Schéelite', formula: 'CaWO₄', sys: 'tetragonal', cls: '4/m', space: 'I4₁/a',
    forms: { en: 'Dipyramidal pseudo-octahedra', fr: 'Pseudo-octaèdres dipyramidaux' },
    cleavage: { en: '{101} distinct', fr: '{101} distinct' }, src: 'scheelite',
  },
  {
    id: 'leucite', en: 'Leucite', fr: 'Leucite', formula: 'KAlSi₂O₆', sys: 'tetragonal', cls: '4/m', space: 'I4₁/a',
    forms: { en: 'Pseudocubic icositetrahedra', fr: 'Icositétraèdres pseudocubiques' },
    cleavage: { en: 'indistinct', fr: 'indistinct' }, src: 'leucite',
  },
  {
    id: 'chalcopyrite', en: 'Chalcopyrite', fr: 'Chalcopyrite', formula: 'CuFeS₂', sys: 'tetragonal', cls: '4̄2m', space: 'I4̄2d',
    forms: { en: 'Disphenoids, massive', fr: 'Disphénoïdes, massif' },
    cleavage: { en: '{011} distinct', fr: '{011} distinct' }, src: 'chalcopyrite',
  },
  {
    id: 'quartz', en: 'Quartz', fr: 'Quartz', formula: 'SiO₂', sys: 'trigonal', cls: '32', space: 'P3₂21 (or P3₁21)',
    forms: { en: 'Six-sided prism capped by a pyramid', fr: 'Prisme à six faces coiffé d’une pyramide' },
    cleavage: { en: 'none; conchoidal fracture', fr: 'aucun ; cassure conchoïdale' }, src: 'quartz',
  },
  {
    id: 'calcite', en: 'Calcite', fr: 'Calcite', formula: 'CaCO₃', sys: 'trigonal', cls: '3̄m', space: 'R3̄c',
    forms: { en: 'Rhombohedra and scalenohedra', fr: 'Rhomboèdres et scalénoèdres' },
    cleavage: { en: '{10-11} perfect', fr: '{10-11} parfait' }, src: 'calcite',
  },
  {
    id: 'corundum', en: 'Corundum', fr: 'Corindon', formula: 'Al₂O₃', sys: 'trigonal', cls: '3̄m', space: 'R3̄c',
    forms: { en: 'Steep bipyramids, tabular or prismatic', fr: 'Bipyramides aiguës, tabulaires ou prismatiques' },
    cleavage: { en: 'none', fr: 'aucun' }, src: 'corundum',
  },
  {
    id: 'hematite', en: 'Hematite', fr: 'Hématite', formula: 'Fe₂O₃', sys: 'trigonal', cls: '3̄m', space: 'R3̄c',
    forms: { en: 'Tabular, rhombohedral, micaceous', fr: 'Tabulaire, rhomboédrique, micacé' },
    cleavage: { en: 'none', fr: 'aucun' }, src: 'hematite',
  },
  {
    id: 'ilmenite', en: 'Ilmenite', fr: 'Ilménite', formula: 'FeTiO₃', sys: 'trigonal', cls: '3̄', space: 'R3̄',
    forms: { en: 'Thick tabular, lamellar exsolutions', fr: 'Tabulaires épais, exsolutions lamellaires' },
    cleavage: { en: 'none', fr: 'aucun' }, src: 'ilmenite',
  },
  {
    id: 'dolomite', en: 'Dolomite', fr: 'Dolomite', formula: 'CaMg(CO₃)₂', sys: 'trigonal', cls: '3̄', space: 'R3̄',
    forms: { en: 'Tabular, curved faces', fr: 'Tabulaire, faces courbes' },
    cleavage: { en: '{10-11} perfect', fr: '{10-11} parfait' }, src: 'dolomite',
  },
  {
    id: 'apatite', en: 'Apatite', fr: 'Apatite', formula: 'Ca₅(PO₄)₃(F,OH,Cl)', sys: 'hexagonal', cls: '6/m', space: 'P6₃/m',
    forms: { en: 'Tabular, prismatic, massive', fr: 'Tabulaires, prismatiques, massifs' },
    cleavage: { en: '{0001} indistinct', fr: '{0001} indistinct' }, src: 'apatite',
  },
  {
    id: 'beryl', en: 'Beryl', fr: 'Béryl', formula: 'Be₃Al₂Si₆O₁₈', sys: 'hexagonal', cls: '6/mmm', space: 'P6/mcc',
    forms: { en: 'Hexagonal columns, prismatic to tabular', fr: 'Colonnes hexagonales, prismatiques à tabulaires' },
    cleavage: { en: '{0001} indistinct', fr: '{0001} indistinct' }, src: 'beryl',
  },
  {
    id: 'pyrite', en: 'Pyrite', fr: 'Pyrite', formula: 'FeS₂', sys: 'cubic', cls: 'm3̄', space: 'Pa3̄',
    forms: { en: 'Cubes with striated faces, pyritohedra', fr: 'Cubes à faces striées, pyritoèdres' },
    cleavage: { en: 'indistinct', fr: 'indistinct' }, src: 'pyrite',
  },
  {
    id: 'sphalerite', en: 'Sphalerite', fr: 'Sphalérite', formula: 'ZnS', sys: 'cubic', cls: '4̄3m', space: 'F4̄3m',
    forms: { en: 'Tetrahedral crystals, granular', fr: 'Cristaux tétraédriques, grenus' },
    cleavage: { en: '{110} perfect', fr: '{110} parfait' }, src: 'sphalerite',
  },
  {
    id: 'fluorite', en: 'Fluorite', fr: 'Fluorite', formula: 'CaF₂', sys: 'cubic', cls: 'm3̄m', space: 'Fm3̄m',
    forms: { en: 'Cubes, octahedra, twinning on {111}', fr: 'Cubes, octaèdres, macles sur {111}' },
    cleavage: { en: '{111} perfect', fr: '{111} parfait' }, src: 'fluorite',
  },
  {
    id: 'diamond', en: 'Diamond', fr: 'Diamant', formula: 'C', sys: 'cubic', cls: 'm3̄m', space: 'Fd3̄m',
    forms: { en: 'Octahedra, cubes, rounded dodecahedra', fr: 'Octaèdres, cubes, dodécaèdres arrondis' },
    cleavage: { en: '{111} perfect', fr: '{111} parfait' }, src: 'diamond',
  },
  {
    id: 'halite', en: 'Halite', fr: 'Halite', formula: 'NaCl', sys: 'cubic', cls: 'm3̄m', space: 'Fm3̄m',
    forms: { en: 'Cubes, hopper crystals', fr: 'Cubes, cristaux en trémie' },
    cleavage: { en: '{001} perfect', fr: '{001} parfait' }, src: 'halite',
  },
  {
    id: 'langbeinite', en: 'Langbeinite', fr: 'Langbeinite', formula: 'K₂Mg₂(SO₄)₃', sys: 'cubic', cls: '23', space: 'P2₁3',
    forms: { en: 'Nodules, disseminated grains', fr: 'Nodules, grains disséminés' },
    cleavage: { en: 'none', fr: 'aucun' }, src: 'langbeinite',
  },
];

// Corrections made to the course notes; each one is sourced.
export const FIXES = [
  {
    what: { en: 'The trigonal unit cell was given as a = b, α = β = γ = 90°.', fr: 'La maille trigonale était donnée comme a = b, α = β = γ = 90°.' },
    how: {
      en: 'That is a tetragonal cell. In the hexagonal setting a trigonal cell has a = b, α = β = 90°, γ = 120°; in the rhombohedral setting a = b = c, α = β = γ ≠ 90°.',
      fr: 'C’est une maille tétragonale. En maille hexagonale, une maille trigonale a a = b, α = β = 90°, γ = 120° ; en maille rhomboédrique, a = b = c, α = β = γ ≠ 90°.',
    },
    src: ['sys'],
  },
  {
    what: { en: 'The five trigonal classes were listed under “Hexagonal”.', fr: 'Les cinq classes trigonales étaient rangées sous « Hexagonal ».' },
    how: {
      en: 'Trigonal and hexagonal are two crystal systems, both in the hexagonal crystal family. The trigonal classes (3, 3̄, 32, 3m, 3̄m) belong to the trigonal system.',
      fr: 'Trigonal et hexagonal sont deux systèmes cristallins, tous deux dans la famille hexagonale. Les classes trigonales (3, 3̄, 32, 3m, 3̄m) appartiennent au système trigonal.',
    },
    src: ['sys', 'point'],
  },
  {
    what: { en: 'Pyrite was placed in class 4̄3m.', fr: 'La pyrite était placée dans la classe 4̄3m.' },
    how: {
      en: 'Pyrite is m3̄ (space group Pa3̄); sphalerite is 4̄3m (F4̄3m).',
      fr: 'La pyrite est m3̄ (groupe d’espace Pa3̄) ; la sphalérite est 4̄3m (F4̄3m).',
    },
    src: ['pyrite', 'sphalerite'],
  },
  {
    what: { en: 'Gypsum was given as P2₁/c.', fr: 'Le gypse était donné comme P2₁/c.' },
    how: {
      en: 'The standard space group of gypsum is I2/a (a setting of C2/c); P2₁/c is not its space group.',
      fr: 'Le groupe d’espace standard du gypse est I2/a (une écriture de C2/c) ; P2₁/c n’est pas son groupe d’espace.',
    },
    src: ['gypsum'],
  },
  {
    what: { en: 'Ferroselite was described as cubic P2₁3.', fr: 'La ferrosélite était décrite comme cubique P2₁3.' },
    how: {
      en: 'Ferroselite, FeSe₂, is orthorhombic (marcasite type); the cubic P2₁3 example used here is langbeinite.',
      fr: 'La ferrosélite, FeSe₂, est orthorhombique (type marcasite) ; l’exemple cubique P2₁3 retenu ici est la langbeinite.',
    },
    src: ['ferroselite', 'langbeinite'],
  },
  {
    what: { en: 'Anapaite was given the formula Ca₂(PO₄)(OH).', fr: 'L’anapaïte recevait la formule Ca₂(PO₄)(OH).' },
    how: {
      en: 'Anapaite is Ca₂Fe²⁺(PO₄)₂·4H₂O. The wrong formula is not used in this tab.',
      fr: 'L’anapaïte est Ca₂Fe²⁺(PO₄)₂·4H₂O. La formule erronée n’est pas reprise dans cet onglet.',
    },
    src: ['anapaite'],
  },
  {
    what: { en: 'Many class examples repeated the same few minerals.', fr: 'De nombreux exemples de classes répétaient les mêmes quelques minéraux.' },
    how: {
      en: 'Quartz appeared under 6, 622, 6/m and 32; beryl under 6, 6̄, 6/m, 622 and 6mm; zircon and rutile under four tetragonal classes. The examples here are checked one by one against the mineral pages, and a class with no common mineral example is left without one.',
      fr: 'Le quartz apparaissait en 6, 622, 6/m et 32 ; le béryl en 6, 6̄, 6/m, 622 et 6mm ; le zircon et le rutile dans quatre classes tétragonales. Les exemples ici sont vérifiés un par un sur les pages des minéraux, et une classe sans exemple minéral courant reste sans exemple.',
    },
    src: ['quartz', 'beryl', 'zircon', 'rutile'],
  },
];
