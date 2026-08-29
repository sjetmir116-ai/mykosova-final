// ===== KONTROLLI STATIK: KONSTANTET ME SHKRIM TË MADH =====
// Kap bug-et e stilit "ATRAKSIOET_LOKALE is not defined" / "BAZA_DEFAULT i hequr":
// çdo identifikues me SHKRIM TË MADH (konstante) që përdoret te kodi i një skedari
// duhet të jetë i deklaruar ose i importuar te AYTI.
import fs from 'fs';
import path from 'path';

const ROOT = new URL('../src/', import.meta.url).pathname;

// Skanues i saktë i karaktereve: hiq stringjet (', ", `), komenteve //, /* */
// (rregullat e thjeshta me regex dëmtohen nga apostrofet brenda stringjeve, p.sh. "d'urgence")
const paZëvendës = (kod) => {
  let pa = '';
  let i = 0;
  let mod = null; // null | "'" | '"' | '`' | 'line' | 'block'
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
  // Hiq TEKSTIN e JSX-it (midis > dhe <) — etiketa si "VLERËSIMET GJITHSEJ" s'janë variabël
  for (let j = 0; j < 6; j++) {
    const eRi = pa.replace(/>([^<>]*)</g, '> <');
    if (eRi === pa) break;
    pa = eRi;
  }
  return pa;
};

// Globalët e njohur (JS/browser) që janë të lejuar pa deklarim
const GLOBALËT = new Set(['JSON', 'URL', 'URLSearchParams', 'URLPattern', 'Date', 'Math', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Error', 'Promise', 'RegExp', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Symbol', 'Proxy', 'Reflect', 'BigInt', 'Int32Array', 'Uint8Array', 'Float64Array', 'Int8Array', 'Uint32Array', 'Uint8ClampedArray', 'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'JSON', 'Intl', 'globalThis', 'fetch', 'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'isNaN', 'isFinite', 'parseInt', 'parseFloat', 'atob', 'btoa', 'structuredClone', 'eval', 'function']);

let gabime = 0;
let skedarë = 0;

const kontrollo = (fys) => {
  const kod = fs.readFileSync(fys, 'utf8');
  skedarë++;
  const pa = paZëvendës(kod);

  // Konstante të PËRDORURA (uppercase me 3+ karaktere)
  const perdorura = new Set([...pa.matchAll(/\b[A-Z][A-Z0-9_]{2,}\b/g)].map((m) => m[0]));

  // Konstante të DEKLARUARA ose të IMPORTUARA te ky skedar
  const deklaruara = new Set();
  for (const m of pa.matchAll(/\b(?:const|let|var)\s+([A-Z][A-Z0-9_]{2,})\b/g)) deklaruara.add(m[1]);
  for (const m of pa.matchAll(/\bfunction\s+([A-Z][A-Z0-9_]{2,})\b/g)) deklaruara.add(m[1]);
  // import { X, Y } from ...
  for (const m of pa.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
    for (const pjese of m[1].split(',')) {
      const emri = pjese.trim().split(/\s+as\s+/).pop().trim();
      if (/^[A-Z][A-Z0-9_]{2,}$/.test(emri)) deklaruara.add(emri);
    }
  }
  // import X from ...
  for (const m of pa.matchAll(/import\s+([A-Z][A-Z0-9_]{2,})\s+from/g)) deklaruara.add(m[1]);
  // export const X
  for (const m of pa.matchAll(/\bexport\s+const\s+([A-Z][A-Z0-9_]{2,})\b/g)) deklaruara.add(m[1]);
  // destruktim te parametra: function f({ X }) — jo i zakonshëm për uppercase, por
  // parametra të thjeshtë: function f(X)
  for (const m of pa.matchAll(/function\s+\w+\s*\(([^)]*)\)/g)) {
    for (const pjese of m[1].split(',')) {
      const emri = pjese.trim();
      if (/^[A-Z][A-Z0-9_]{2,}$/.test(emri)) deklaruara.add(emri);
    }
  }
  // class X
  for (const m of pa.matchAll(/\bclass\s+([A-Z][A-Z0-9_]{2,})\b/g)) deklaruara.add(m[1]);

  for (const k of perdorura) {
    if (!deklaruara.has(k) && !GLOBALËT.has(k)) {
      console.log(`❌ ${path.relative(ROOT, fys)}: përdor konstanten "${k}" por s'e ka të deklaruar/importuar te ky skedar!`);
      gabime++;
    }
  }
};

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) kontrollo(path.join(ROOT, entry.name));
  else if (entry.isDirectory()) {
    for (const f2 of fs.readdirSync(path.join(ROOT, entry.name))) {
      if (f2.endsWith('.js') || f2.endsWith('.jsx')) kontrollo(path.join(ROOT, entry.name, f2));
    }
  }
}

console.log(gabime === 0
  ? `✅ GJITHË konstantet janë të deklaruara aty ku përdoren (${skedarë} skedarë)`
  : `⚠️ ${gabime} konstante të pa deklaruara!`);
process.exit(gabime ? 1 : 0);
