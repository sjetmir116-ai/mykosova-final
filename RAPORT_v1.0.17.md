# MyKosova v1.0.17 — Rregullimi i Dashboard-it, `emriKerkim` dhe PWA-ja e re

**Data:** 06.11.2026 · **Baza:** `main` (`b7142e6`) · **Versioni:** `1.0.14 → 1.0.17`

> **Shënim i rëndësishëm:** patch-i i ngrirë i v1.0.17 nuk gjendej në repo, në
> remote, në tag-e apo në `git fsck` (asnjë commit i varur, asnjë `stash`).
> Prandaj të tre ndryshimet u **rindërtuan nga përshkrimi**, sipas konventave
> të kodit ekzistues. Interpretimi i secilit kërkesë është dokumentuar më poshtë
> — nëse patch-i origjinal ka detaje të tjera (emra fushash, tekst UI), sillni
> patch-in dhe e barazojmë.

---

## 1. Dashboard-i — "35 leximet" → 1 lexim

**Ku:** `src/admin/Dashboard.jsx`

**Problemi:** `sinkronizoBazen()` bënte një kërkesë Firestore **për çdo biznes
fillestar**:

```js
for (const b of biznesetFillestare) {
  const ekziston = await getDocs(query(collection(db, 'bizneset'), where('emri', '==', b.emri)));
  ...
}
```

Me 35 biznese në bazën fillestare kjo prodhonte **35 lexime/kërkesa radhazi**
(një `where` për secilin), që është i ngadalshëm dhe i kushtueshëm në kuota.

**Rregullimi:** një **lex i vetëm** i koleksionit + deduplikim në memorie:

```js
const ekzistuesit = await getDocs(collection(db, 'bizneset')); // 1 lexim
const emratEkzistues = new Set();
ekzistuesit.forEach((d) => emratEkzistues.add(d.data().emriKerkim || normalizo(d.data().emri)));
```

- Përdoret `emriKerkim` nëse ekziston, përndryshe normalizohet emri (dokumentet e vjetra).
- Sinkronizimi shkruan `emriKerkim` automatikisht te bizneset e reja.
- UI-ja tregon numrin e leximeve të sinkronizimit të fundit dhe shënimin
  "më parë: një kërkesë për çdo biznes — 35 lexime".

**Rezultat:** 35 kërkesa → **1 kërkesë** për të njëjtin funksion.

---

## 2. Fusha `emriKerkim`

**Ku:** `src/kerkimi.js` (i ri), `useBizneset.js`, `ShtoBiznes.jsx`,
`admin/ImportMasiv.jsx`, `biznesi/BiznesiPanel.jsx`, `firestore.rules`,
`ListaBizneseve.jsx`, `SmartSearch.jsx`, `admin/MenaxhoBizneset.jsx`.

Firestore nuk bën kërkim case-insensitive dhe as pa diakritika. Tani emri i
normalizuar ruhet **tek dokumenti** i biznesit:

| Funksion | Roli |
|---|---|
| `normalizo(v)` | shkronja të vogla, `ë→e`, `ç→c`, hapësira të vetme |
| `ndertoEmrinKerkim(b)` | `"hotel solid prizren"` — vlera që ruhet në `emriKerkim` |
| `tekstiKerkimit(b)` | `b.emriKerkim` ose fallback për dokumentet e vjetra |
| `perputhetKerkimi(b, q)` | filtër i unifikuar (emri, qyteti, kategoria, adresa, përshkrimi) |
| `kufijteKerkimit(q)` | kufijtë për kërkim **prefix në server** (`>=` / `<=` + `\uf8ff`) |

**Ku shkruhet:** shtimi i biznesit nga përdoruesi, importi masiv nga Google
Places, sinkronizimi i bazës fillestare dhe ruajtja e profilit nga pronari.
**Ku lexohet:** Lista e bizneseve, Kërkimi inteligjent, Menaxho bizneset,
bashkimi lokal↔cloud në `useBizneset` (dedup më i saktë).

`firestore.rules`: `'emriKerkim'` u shtua te `fushaTePronarit()` — pa këtë,
pronari që ndryshon emrin do të bllokohej nga rules.
⚠️ **Duhet publikuar manualisht në Firebase Console** (Rules → Publish).

---

## 3. Manifesti i ri i PWA-së

**Ku:** `vite.config.js`, `index.html`

Shtuar në manifest: `id`, `dir`, `lang`, `categories`
(`travel, food, business, navigation`), `display_override`
(`window-controls-overlay → standalone → minimal-ui`),
`prefer_related_applications: false`, ikona **maskable** të ndara,
`apple-touch-icon` 180×180 dhe **shortcuts** (Kërkim, Harta, Paneli i adminit).

Workbox: `globPatterns` tani përfshin `webmanifest`, plus `cleanupOutdatedCaches`.

`index.html`: `application-name` dhe `apple-mobile-web-app-title` = `MyKosova`.

---

## Versioni 1.0.17

- `src/main.jsx` → `VERSIONI = '1.0.17'` (dhe krahasimet e error-boundary-t)
- `src/App.jsx` → footer `MyKosova 🇽 v1.0.17`
- `package.json` → `"version": "1.0.17"`

---

## Verifikimi

```
node tests/test-kerkimi.mjs      # 16 testë të reja — KALUAR
bash tests/run-all.sh            # unitare + konstante + context + SSR + build → KALUAR
npm run build                    # ✓ built; dist/manifest.webmanifest përmban fushat e reja
```

`tests/test-embed.mjs` u përditësua që të stub-ojë edhe importin e ri
`./kerkimi` (Node ESM kërkon prapashtesë në stub-in e gjeneruar).

---

## Hapat pas deploy-it

1. **Firebase Console → Firestore → Rules** → publikoni `firestore.rules`
   (ndryshe pronarët nuk mund ta ruajnë `emriKerkim`).
2. Hapni `/admin` → Dashboard → "Ngarko në cloud" për të parë sinkronizimin me
   1 lexim (dokumentet e reja marrin `emriKerkim`).
3. Për PWA-n e re: në Chrome → Application → Manifest (kontrollo shortcuts),
   pastaj "Install app". Për të vjetrën në cache: hard refresh (Ctrl+Shift+R).
