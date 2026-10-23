// Check every llnl.dat / phreeqc.dat number copied into site/weathering/js/thermo.js
// against a downloaded copy of the data bases (they are not stored in this repository).
//
//   curl -o /tmp/llnl.dat https://raw.githubusercontent.com/usgs-coupled/phreeqc3/master/database/llnl.dat
//   curl -o /tmp/phreeqc.dat https://raw.githubusercontent.com/usgs-coupled/phreeqc3/master/database/phreeqc.dat
//   node scripts/check-thermo.mjs /tmp/llnl.dat /tmp/phreeqc.dat

import { readFileSync } from 'node:fs';
import { PHASES, AQ, PQ_RAW, PQ_ALUMINATE } from '../site/tabs/weathering/js/thermo.js';

const [llnlPath = '/tmp/llnl.dat', pqPath = '/tmp/phreeqc.dat'] = process.argv.slice(2);
const llnl = readFileSync(llnlPath, 'latin1').split('\n');
const pq = readFileSync(pqPath, 'latin1').split('\n');
let bad = 0, ok = 0;
const same = (a, b, what) => { if (Math.abs(a - b) > 1e-9 * Math.max(1, Math.abs(a))) { bad++; console.log(`MISMATCH ${what}: ours ${a}, file ${b}`); } else ok++; };

function block(lines, start, name, isHeader) {
  for (let i = start; i < lines.length; i++) {
    if (isHeader(lines[i], name)) {
      const out = { lk: null, an: null, dH: null, rxn: null };
      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const l = lines[j].trim();
        if (j > i && lines[j] !== '' && !/^[\s#]/.test(lines[j])) break; // next entry
        if (!out.rxn && l.includes('=')) out.rxn = l;
        let m;
        if (out.lk === null && (m = /^-?log_k\s+([-+0-9.eE]+)/.exec(l))) out.lk = Number(m[1]);
        if (!out.an && (m = /^-analytic\s+(.*?)(#|$)/.exec(l))) out.an = m[1].trim().split(/\s+/).map(Number);
        if (out.dH === null && (m = /-?delta_h\s+([-+0-9.eE]+)/i.exec(l))) out.dH = Number(m[1]);
      }
      return out;
    }
  }
  return null;
}
const phasesStart = llnl.findIndex((l) => l.startsWith('PHASES'));
for (const [id, p] of Object.entries(PHASES)) {
  const b = block(llnl, phasesStart, p.llnl, (l, n) => l.trim() === n);
  if (!b) { bad++; console.log(`NOT FOUND in llnl.dat: ${p.llnl}`); continue; }
  same(p.lk, b.lk, `${id} log_k`);
  p.an.forEach((v, k) => same(v, b.an[k], `${id} analytic[${k}]`));
}
const aqHeads = { OH: 'H2O = OH- + H+', H3SiO4: 'SiO2 + H2O = HSiO3- + H+', H2SiO4: '2 H2O + SiO2 = H2SiO4-2 + 2 H+', CO2g: 'CO2 + H2O = H+ + HCO3-', CO3: 'HCO3- = CO3-2 + H+', CO2aq: 'HCO3- + H+ = CO2 + H2O', Fe3: 'H+ + Fe+2 + 0.25 O2 = Fe+3 + 0.5 H2O', O2g: 'O2 = O2' };
for (const [k, a] of Object.entries(AQ)) {
  const start = k === 'CO2g' || k === 'O2g' ? phasesStart : 0;
  const b = block(llnl, start, aqHeads[k], (l, n) => l.trim() === n);
  if (!b) { bad++; console.log(`NOT FOUND: ${aqHeads[k]}`); continue; }
  same(a.lk, b.lk, `${k} log_k`);
  if (a.an) a.an.forEach((v, i) => same(v, b.an[i], `${k} analytic[${i}]`));
}
const pqNames = { 'K-feldspar': 'K-feldspar', albite: 'Albite', anorthite: 'Anorthite', muscovite: 'K-mica', kaolinite: 'Kaolinite', gibbsite: 'Gibbsite', 'beidellite-Ca': 'Ca-Montmorillonite', chrysotile: 'Chrysotile', talc: 'Talc', sepiolite: 'Sepiolite', quartz: 'Quartz', chalcedony: 'Chalcedony', 'SiO2(am)': 'SiO2(a)', goethite: 'Goethite' };
const pqStart = pq.findIndex((l) => l.startsWith('PHASES'));
for (const [id, r] of Object.entries(PQ_RAW)) {
  const b = block(pq, pqStart, pqNames[id], (l, n) => l.trim() === n);
  if (!b) { bad++; console.log(`NOT FOUND in phreeqc.dat: ${pqNames[id]}`); continue; }
  same(r.lk, b.lk, `pq ${id} log_k`);
  if (r.dH !== undefined) same(r.dH, b.dH, `pq ${id} delta_h`);
  if (r.an) r.an.forEach((v, k) => same(v, b.an[k] ?? 0, `pq ${id} analytic[${k}]`));
  if (r.alum) assert(b.rxn.includes('Al(OH)4-'), `pq ${id} uses Al(OH)4-`);
}
const al = block(pq, 0, 'Al+3 + 4 H2O = Al(OH)4- + 4 H+', (l, n) => l.trim() === n);
same(PQ_ALUMINATE.lk, al.lk, 'pq aluminate log_k');
same(PQ_ALUMINATE.dH, al.dH, 'pq aluminate delta_h');
function assert(c, msg) { if (!c) { bad++; console.log(`FAIL ${msg}`); } else ok++; }
console.log(`${ok} numbers match, ${bad} problems`);
process.exit(bad ? 1 : 0);
