// SVG drawings for the crystal-systems tab: unit cells built from their
// actual a, b, c, α, β, γ, a schematic of the symmetry axes, and a small
// gallery of crystal forms. All drawings are our own.

const NS = 'http://www.w3.org/2000/svg';

function s(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) n.append(kid);
  return n;
}

// The three unit-cell vectors in Cartesian coordinates, from the cell
// parameters. Standard crystallographic construction: a along x, b in the
// xy plane, c from its angles to a and b.
function vectors({ a, b, c, alpha, beta, gamma }) {
  const ar = (alpha * Math.PI) / 180;
  const br = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const va = [a, 0, 0];
  const vb = [b * Math.cos(gr), b * Math.sin(gr), 0];
  const cx = c * Math.cos(br);
  const cy = (c * (Math.cos(ar) - Math.cos(br) * Math.cos(gr))) / Math.sin(gr);
  const cz = Math.sqrt(Math.max(0, c * c - cx * cx - cy * cy));
  return [va, vb, [cx, cy, cz]];
}

const add = (u, v) => [u[0] + v[0], u[1] + v[1], u[2] + v[2]];
const mul = (u, k) => [u[0] * k, u[1] * k, u[2] * k];

/** A unit cell drawn in oblique projection, with a, b, c axes. */
export function cellSvg(sys, { width = 360, height = 280 } = {}) {
  const [va, vb, vc] = vectors(sys.cell);
  const proj = ([x, y, z]) => [x - 0.55 * y, -z - 0.38 * y];

  const corner = (i, j, k) => add(add(mul(va, i), mul(vb, j)), mul(vc, k));
  const all = [];
  for (const i of [0, 1]) for (const j of [0, 1]) for (const k of [0, 1]) all.push({ i, j, k, q: proj(corner(i, j, k)) });

  const xs = all.map((v) => v.q[0]);
  const ys = all.map((v) => v.q[1]);
  const minx = Math.min(...xs), maxx = Math.max(...xs);
  const miny = Math.min(...ys), maxy = Math.max(...ys);
  const pad = 46;
  const scale = Math.min((width - 2 * pad) / (maxx - minx || 1), (height - 2 * pad) / (maxy - miny || 1));
  const ox = (width - (maxx - minx) * scale) / 2 - minx * scale;
  const oy = (height - (maxy - miny) * scale) / 2 - miny * scale;
  const P = (i, j, k) => {
    const v = all.find((x) => x.i === i && x.j === j && x.k === k);
    return [v.q[0] * scale + ox, v.q[1] * scale + oy];
  };
  const poly = (...pts) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const face = (pts, cls = '') => s('polygon', { points: poly(...pts), class: `cx-face ${cls}` });
  const edge = (a, b, cls = '') => s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: `cx-edge ${cls}` });

  // The faces, then the three hidden edges that meet at the origin (dashed),
  // then the visible edges.
  const hidden = [
    edge(P(0, 0, 0), P(1, 0, 0), 'cx-hidden'),
    edge(P(0, 0, 0), P(0, 1, 0), 'cx-hidden'),
    edge(P(0, 0, 0), P(0, 0, 1), 'cx-hidden'),
  ];
  const top = face([P(0, 0, 1), P(1, 0, 1), P(1, 1, 1), P(0, 1, 1)], 'cx-top');
  const front = face([P(0, 1, 0), P(1, 1, 0), P(1, 1, 1), P(0, 1, 1)], 'cx-front');
  const right = face([P(1, 0, 0), P(1, 1, 0), P(1, 1, 1), P(1, 0, 1)], 'cx-side');

  const edges = [];
  for (const k of [0, 1]) for (const j of [0, 1]) if (!(j === 0 && k === 0)) edges.push(edge(P(0, j, k), P(1, j, k)));
  for (const i of [0, 1]) for (const k of [0, 1]) if (!(i === 0 && k === 0)) edges.push(edge(P(i, 0, k), P(i, 1, k)));
  for (const i of [0, 1]) for (const j of [0, 1]) if (!(i === 0 && j === 0)) edges.push(edge(P(i, j, 0), P(i, j, 1)));

  // Axis arrows, a little beyond the cell.
  const O = P(0, 0, 0);
  const arrow = (v, color, label) => {
    const end = P(v[0], v[1], v[2]);
    const tip = [O[0] + (end[0] - O[0]) * 1.18, O[1] + (end[1] - O[1]) * 1.18];
    const ang = Math.atan2(tip[1] - O[1], tip[0] - O[0]);
    const h1 = [tip[0] - 7 * Math.cos(ang - 0.42), tip[1] - 7 * Math.sin(ang - 0.42)];
    const h2 = [tip[0] - 7 * Math.cos(ang + 0.42), tip[1] - 7 * Math.sin(ang + 0.42)];
    const lx = tip[0] + 9 * Math.cos(ang), ly = tip[1] + 9 * Math.sin(ang);
    return s('g', { class: `cx-axis cx-axis-${color}` },
      s('line', { x1: O[0], y1: O[1], x2: tip[0], y2: tip[1] }),
      s('polygon', { points: poly(tip, h1, h2) }),
      s('text', { x: lx, y: ly, class: 'cx-axis-label', 'text-anchor': 'middle' }, label));
  };

  return s('svg', {
    viewBox: `0 0 ${width} ${height}`,
    class: 'cx-cell-svg',
    role: 'img',
    'aria-label': `${sys.en} unit cell: a, b, c and the axes`,
  },
  top, front, right, ...hidden, ...edges,
  arrow([1, 0, 0], 'a', 'a'),
  arrow([0, 1, 0], 'b', 'b'),
  arrow([0, 0, 1], 'c', 'c'));
}

/** A schematic of the rotation axes of a system (not a stereogram). */
export function symmetrySvg(sys) {
  const W = 240, H = 170;
  const c = [W / 2, H / 2 - 6];
  const line = (x1, y1, x2, y2, cls = '') => s('line', { x1, y1, x2, y2, class: `cx-sym-line ${cls}` });
  const marker = (x, y, kind) => {
    const r = 9;
    if (kind === '2') {
      return s('path', { d: `M ${x - r} ${y} Q ${x} ${y - r * 0.9} ${x + r} ${y} Q ${x} ${y + r * 0.9} ${x - r} ${y}`, class: 'cx-sym-mark' });
    }
    if (kind === '3' || kind === '4' || kind === '6') {
      const n = Number(kind);
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
        pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
      }
      return s('polygon', { points: pts.map(([px, py]) => `${px},${py}`).join(' '), class: 'cx-sym-mark' });
    }
    return s('circle', { cx: x, cy: y, r: 4, class: 'cx-sym-inv' });
  };
  const axis = (x1, y1, x2, y2, kind) => s('g', {}, line(x1, y1, x2, y2), marker(x2, y2, kind));
  const parts = [];
  if (sys.id === 'triclinic') {
    parts.push(s('circle', { cx: c[0], cy: c[1], r: 3.5, class: 'cx-sym-inv' }));
    parts.push(s('text', { x: c[0] + 10, y: c[1] + 4, class: 'cx-sym-t' }, '1̄'));
  } else if (sys.id === 'monoclinic') {
    parts.push(axis(c[0], H - 24, c[0], 24, '2'));
  } else if (sys.id === 'orthorhombic') {
    parts.push(axis(c[0], H - 24, c[0], 24, '2'));
    parts.push(axis(24, c[1], W - 24, c[1], '2'));
    parts.push(axis(48, H - 30, W - 48, 30, '2'));
  } else if (sys.id === 'tetragonal') {
    parts.push(axis(c[0], H - 24, c[0], 24, '4'));
    parts.push(axis(30, c[1], W - 30, c[1], '2'));
  } else if (sys.id === 'trigonal') {
    parts.push(axis(c[0], H - 24, c[0], 24, '3'));
  } else if (sys.id === 'hexagonal') {
    parts.push(axis(c[0], H - 24, c[0], 24, '6'));
  } else {
    parts.push(axis(c[0], H - 24, c[0], 24, '4'));
    parts.push(axis(30, c[1], W - 30, c[1], '4'));
    parts.push(marker(c[0], c[1], '4'));
    parts.push(axis(40, 40, W - 40, H - 40, '3'));
    parts.push(axis(W - 40, 40, 40, H - 40, '3'));
  }
  return s('svg', {
    viewBox: `0 0 ${W} ${H}`,
    class: 'cx-sym-svg',
    role: 'img',
    'aria-label': `${sys.en}: schematic of the rotation axes`,
  }, ...parts);
}

/** A small gallery of crystal forms, drawn in 2D. */
export function formSvg(kind) {
  const poly = (pts, cls = '') => s('polygon', { points: pts.map(([x, y]) => `${x},${y}`).join(' '), class: `cx-form-face ${cls}` });
  const line = (x1, y1, x2, y2, cls = '') => s('line', { x1, y1, x2, y2, class: `cx-form-edge ${cls}` });
  let body;
  if (kind === 'cube') {
    body = s('g', {},
      poly([[50, 10], [90, 30], [50, 50], [10, 30]], 'cx-form-top'),
      poly([[10, 30], [50, 50], [50, 90], [10, 70]], 'cx-form-left'),
      poly([[50, 50], [90, 30], [90, 70], [50, 90]], 'cx-form-right'));
  } else if (kind === 'octahedron') {
    body = s('g', {},
      poly([[50, 6], [10, 52], [50, 92]], 'cx-form-left'),
      poly([[50, 6], [90, 52], [50, 92]], 'cx-form-right'),
      poly([[50, 6], [10, 52], [50, 66]], 'cx-form-top'),
      poly([[50, 6], [90, 52], [50, 66]], 'cx-form-top'),
      line(10, 52, 50, 66), line(90, 52, 50, 66));
  } else if (kind === 'prism') {
    const top = [[50, 2], [76, 17], [76, 45], [50, 60], [24, 45], [24, 17]];
    const bot = top.map(([x, y]) => [x, y + 35]);
    body = s('g', {},
      poly(top, 'cx-form-top'),
      poly(bot, 'cx-form-right'),
      poly([top[0], top[1], bot[1], bot[0]], 'cx-form-left'),
      poly([top[1], top[2], bot[2], bot[1]], 'cx-form-left'),
      poly([top[2], top[3], bot[3], bot[2]], 'cx-form-right'),
      poly([top[3], top[4], bot[4], bot[3]], 'cx-form-right'),
      poly([top[4], top[5], bot[5], bot[4]], 'cx-form-left'));
  } else {
    body = s('g', {},
      poly([[25, 40], [70, 40], [70, 85], [25, 85]], 'cx-form-left'),
      poly([[25, 40], [45, 20], [90, 20], [70, 40]], 'cx-form-top'),
      poly([[70, 40], [90, 20], [90, 65], [70, 85]], 'cx-form-right'));
  }
  return s('svg', {
    viewBox: '0 0 100 100',
    class: 'cx-form-svg',
    role: 'img',
    'aria-label': kind,
  }, body);
}
