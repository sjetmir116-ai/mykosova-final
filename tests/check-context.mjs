// ===== KONTROLLI STATIK: VARIABLAT E APPCONTEXT =====
// Kap bug-et e stilit "gpsStatus is not defined": çdo variabël i AppContext
// që përdoret te kodi i një skedari duhet të jetë në destruktimin e tij.
// Lista e variablave MERRHET AUTOMATIKisht nga Provider-i te AppContext.jsx
// (nëse shton një variabël të ri te context, automatikisht futet te kontrolli).
import fs from 'fs';
import path from 'path';

const ROOT = path.dirname(new URL('.', import.meta.url).pathname);
const SRC = path.join(ROOT, 'src');

// Skanues i saktë: hiq stringjet + komente (regex-at e thjeshta dështojnë te apostrofet)
const paZëvendës = (kod) => {
  let pa = '';
  let i = 0;
  let mod = null;
  const n = kod.length;
  while (i < n) {
    const c = kod[i];
    const c2 = kod[i + 1];
    if (mod === null) {
      if (c === '/' && c2 === '/') { mod = 'line'; i += 2; continue; }
      if (c === '/' && c2 === '*') { mod = 'block'; i += 2; continue; }
      if (c === "'" || c === '"' || c === '`') { mod = c; i++; continue; }
      pa += c;
      i++;
    } else if (mod === 'line') {
      if (c === '\n') { mod = null; pa += '\n'; }
      i++;
    } else if (mod === 'block') {
      if (c === '*' && c2 === '/') { mod = null; i += 2; }
      else i++;
    } else {
      if (c === '\\') { i += 2; continue; }
      if (c === mod) mod = null;
      i++;
    }
  }
  for (let j = 0; j < 6; j++) {
    const eRi = pa.replace(/>([^<>]*)</g, '> <');
    if (eRi === pa) break;
    pa = eRi;
  }
  return pa;
};

// 1. MERR listën e variablave nga Provider-i te AppContext.jsx
const ctxKodi = fs.readFileSync(path.join(SRC, 'AppContext.jsx'), 'utf8');
const mProvider = ctxKodi.match(/value=\{\{([\s\S]*?)\}\}/);
if (!mProvider) { console.error('❌ S\u2019u gjet Provider-i te AppContext.jsx'); process.exit(1); }
const keys = new Set();
// \p{L} = çdo shkronjë (përfshirë ë/ç të shqipes) — me flag-u
for (const id of mProvider[1].matchAll(/[\p{L}_][\p{L}0-9_]{2,}/gu)) keys.add(id[0]);
console.log('Variablat e context-it (' + keys.size + '): ' + [...keys].join(', '));

// 2. Skano të gjithë skedarët
let gabim = 0;
let skedarëMeContext = 0;

const kontrollo = (fys) => {
  const kod = fs.readFileSync(fys, 'utf8');
  if (!kod.includes('useContext(AppContext)')) return;
  skedarëMeContext++;
  const m = kod.match(/=\s*useContext\(AppContext\)/);
  if (!m) return;
  const filli = kod.lastIndexOf('const {', m.index);
  if (filli === -1) {
    console.log(`❌ ${path.relative(ROOT, fys)}: useContext pa destruktim!`);
    gabim++;
    return;
  }
  const fundi = kod.indexOf('}', filli);
  const destruktimi = kod.slice(filli, fundi + 1);
  const kodi = paZëvendës(kod);
  for (const k of keys) {
    const re = new RegExp('(?<![\\p{L}0-9_])' + k + '(?![\\p{L}0-9_])', 'u');
    if (re.test(kodi) && !re.test(destruktimi)) {
      console.log(`❌ ${path.relative(ROOT, fys)}: përdor "${k}" te kodi por s'e ka te destruktim!`);
      gabim++;
    }
  }
};

for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.jsx')) kontrollo(path.join(SRC, entry.name));
  else if (entry.isDirectory()) {
    for (const f2 of fs.readdirSync(path.join(SRC, entry.name))) {
      if (f2.endsWith('.jsx')) kontrollo(path.join(SRC, entry.name, f2));
    }
  }
}

console.log(gabim === 0
  ? `✅ GJITHË variablat e context-it janë të destruktuara aty ku përdoren (${skedarëMeContext} skedarë me context)`
  : `⚠️ ${gabim} variabël i/humbur!`);
process.exit(gabim ? 1 : 0);
