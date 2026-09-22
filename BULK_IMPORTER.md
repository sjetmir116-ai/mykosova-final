# 🚀 BULK IMPORTER — Importim masiv nga Google Places → Firestore

> **Qëllimi:** të mos shtohen bizneset një nga një. Një kategori + një qytet →
> qindra biznese në Firestore, të mapuara, të dedublikuara dhe të statusuara automatikisht.

---

## 1. Arkitektura e zgjedhur (dhe pse është më e shpejta)

Pas kontrollit të repo-s, zgjidhja **më e shpejtë për lansim** është një
**bërthamë e përbashkët (pure JS) + tre adaptera të hollë**:

```
                    ┌──────────────────────────────────────────┐
                    │  BËRTHAMA (pure, e testueshme, pa rrjet) │
                    │  functions/src/places/                   │
                    │   ├─ qytetet.js    (katalog + alias + bbox)
                    │   ├─ kategorite.js (kategori ⇄ Google types)
                    │   ├─ rrjeta.js     (tiling gjeografik)
                    │   ├─ plani.js      (planifikuesi i hapave)
                    │   ├─ mapping.js    (place → dok. biznesi + cilësia)
                    │   └─ client.js     (Places API New: fetch+retry+paging)
                    └────────────┬─────────────────────────────┘
                                 │
        ┌────────────────────────┼─────────────────────────┐
        │                        │                         │
┌───────▼────────┐     ┌─────────▼──────────┐   ┌──────────▼───────────┐
│ CALLABLE       │     │ CLI SCRIPT         │   │ ADMIN UI             │
│ importoMasiv   │     │ scripts/           │   │ /admin → 🚀 Import   │
│ (Admin SDK)    │     │ importo-masiv.js   │   │ Masiv (progres live) │
│ chunked+resume │     │ pa deploy, pa limit│   │ onSnapshot(importJobs)│
└────────────────┘     └────────────────────┘   └──────────────────────┘
```

### Pse jo importim nga browser-i (klient)?

| Problem | Pasoja |
|---|---|
| `firestore.rules` detyron `status == 'pendshe'` **dhe** `uidPronari == request.auth.uid` te `create` | Klienti **nuk mund** të shkruajë kurrë `aprovar` — do të duheshin 2 shkrime për biznes |
| API key te `localStorage` | Key-i i ekspozuar; kuota digjet nga kushdo që hap DevTools |
| Tab-i duhet të mbetet i hapur | Importi i 2000 bizneseve vdes me një refresh |
| CORS + rate-limit i browser-it | Paralelizim i dobët |

**Admin SDK-ja e anashkalon rules-in** → `status: 'aprovar'` shkruhet direkt, me
**një** shkrim për biznes. Kjo është arsyeja kryesore e zgjedhjes.

### Pse edhe CLI edhe Callable?

- **CLI** = zero deploy, zero timeout → mbushja e parë masive (gjithë Kosova) sot.
- **Callable** = butoni në panel për admin-in, pa terminal, pa service-account.

Të dyja thërrasin **të njëjtin orkestrator** (`functions/src/bulkImport.js`),
prandaj s'ka logjikë të dyfishuar.

---

## 2. Si tërhiqen "të gjitha rezultatet e mundshme"

Google Places **Text Search (New) kthen maksimum 60 rezultate** (3 faqe × 20) për
një query. Prandaj një `"restorante në Prishtinë"` **nuk** i jep dot të gjitha.

Zgjidhja: **fan-out në 2 kalime**, me deduplikim sipas `placeId`.

### Kalimi A — Text Search me variante (`strategjia: 'shpejt'`)
Për çdo kategori kemi disa **pyetje sinonime** (shqip + anglisht), p.sh. për
`Restorante`: `restorant`, `restaurant`, `pizzeri`, `fast food`, `ushqim tradicional`…
Secila ekzekutohet me:
- `locationRestriction.rectangle` = kutia e qytetit (jo vetëm tekst — s'dalin rezultate nga Shkupi)
- `pageToken` deri në 3 faqe

→ ~6–15 kërkesa API për (kategori × qytet), rezultat 100–300 vende unike. **I shpejtë.**

### Kalimi B — Nearby Search mbi rrjetë (`strategjia: 'rrjete'`)
Qyteti ndahet në një **rrjetë rrathësh** (`qelizaKm`, default 2.5 km). Për çdo
qelizë: `places:searchNearby` me `includedTypes` të kategorisë (20 rezultate/qelizë).

→ mbulim **shterrues**: bizneset e vogla pa emër "të kërkueshëm" dalin këtu.

### `strategjia: 'plote'` = A + B
Rekomandimi për lansim: `plote` për 7 qytetet kryesore, `shpejt` për të tjerat.

---

## 3. Mapimi ynë (kategori + qytet)

### Kategoria
`functions/src/places/kategorite.js` mban katalogun dydrejtimësh:

```js
{ emri: 'Restorante', googleTypes: ['restaurant', 'pizza_restaurant', ...], pyetjet: [...] }
```

- `kategoriaNgaTipi(primaryType, types)` → `{ emri, besueshmeria: 'e_larte' | 'e_ulet' }`
- `primaryType` → besueshmëri **e lartë**; ndonjë nga `types` → **e ulët**
- pa përputhje → përdoret kategoria e kërkuar (ajo që e nisi importin)

Besueshmëria futet te skori i cilësisë (shih §5).

### Qyteti — 4 shtresa fallback
1. `addressComponents` (`locality` / `administrative_area_level_2`)
2. `formattedAddress` kundrejt aliaseve (`Priština`, `Therandë`, `Uroševac`…)
3. **Qyteti më i afërt nga koordinatat** (haversine, ≤ 25 km) ← më i besueshmi për Kosovën
4. Qyteti i kërkuar

Katalogu mbulon **38 komuna/qytete** me koordinata të sakta dhe rreze.

---

## 4. Deduplikimi (transaksional)

Tre nivele, nga më i shpejti te më i sigurti:

| # | Niveli | Ku | Kap |
|---|---|---|---|
| 1 | **Indeks në memorie** | ngarkohet 1 herë me `.select()` në fillim të punës | dublikatat e njohura **pa asnjë shkrim** |
| 2 | **ID deterministe** `google_{placeId}` | `transaction.get(ref)` | të njëjtin vend, edhe kur është shtuar dorazi më parë |
| 3 | **Rezervim `biznesetIndeks/{sha1(emri\|qyteti)}`** | i njëjti transaksion | dy `placeId` të ndryshëm me të njëjtin emër+qytet, **në garë** |

```js
await db.runTransaction(async (tx) => {
  const [biznesiSnap, indeksSnap] = await tx.getAll(biznesiRef, indeksRef);
  if (biznesiSnap.exists) throw new GabimDublikat('dublikat_google');
  if (indeksSnap.exists) throw new GabimDublikat('dublikat_emri');
  tx.create(biznesiRef, dok);      // të dyja, ose asnjëra
  tx.create(indeksRef, { biznesiId, emri, qyteti });
});
```

Plus dedup **jo-bllokues** sipas telefonit (numër i normalizuar) → shënohet
`dublikat_telefoni` dhe biznesi kalon në `pendshe` në vend që të hidhet poshtë.

> Ky është i njëjti kontrat si te `ShtoBiznes.jsx` (`googlePlaceDocumentId` +
> `runTransaction`), prandaj importi masiv dhe regjistrimi individual **nuk mund
> të krijojnë kurrë dublikatë mes tyre**.

---

## 5. `aprovar` vs `pendshe` — vendimi automatik

> ⚠️ Repo-ja përdor `'aprovar'` (jo `'aprovuar'`) — shih `useBizneset.js`,
> `MenaxhoBizneset.jsx`. Importuesi ndjek të njëjtën fjalë kyçe.

`statusi: 'auto' | 'aprovar' | 'pendshe'`. Te `auto` llogaritet një **skor cilësie**:

| Kriteri | Pikë |
|---|---|
| Emër i vlefshëm | +2 |
| Koordinata (lat/lng) | +2 |
| Kategoria nga `primaryType` (besueshmëri e lartë) | +2 |
| ≥ 5 vlerësime në Google | +2 |
| Adresë | +1 |
| Telefon | +1 |
| Website | +1 |
| Rating ≥ 3.5 | +1 |
| Qyteti nga katalogu | +1 |
| Telefon dublikat me një biznes ekzistues | −4 |
| `businessStatus != OPERATIONAL` | −6 |

**≥ 8 pikë → `aprovar`**, ndryshe **`pendshe`** (shkon te radha e moderimit).
`CLOSED_PERMANENTLY` anashkalohet fare.

---

## 6. Chunking, resume dhe progres live

Cloud Functions ka timeout. Prandaj **callable-i nuk e bën gjithë punën njëherësh**:

1. Krijon `importJobs/{jobId}` me kërkesën.
2. Plani rigjenerohet **deterministikisht** nga kërkesa (asgjë e madhe s'ruhet në dok).
3. Punon derisa mbush `buxhetiMs` (default 300s nga 540s timeout).
4. Ruan `kursori = { task, qeliza, faqja }` dhe kthen `perfunduar: false`.
5. UI-ja / CLI-ja e thërret sërish me `{ jobId, vazhdo: true }`.

Paneli e ndjek dokumentin me `onSnapshot` → numëruesit lëvizin live.

---

## 7. Përdorimi

### A. Nga paneli (`/admin` → 🚀 Import Masiv)
Zgjidh kategoritë + qytetet + strategjinë → **Nis importin**. Butoni
"Provë (dry-run)" tregon sa vende do të gjenden **pa shkruar asgjë**.

Kërkon secret-in:
```bash
firebase functions:secrets:set GOOGLE_PLACES_API_KEY
firebase deploy --only functions:importoMasiv
```

### B. Nga terminali (pa deploy)
```bash
cd functions && npm install
export GOOGLE_APPLICATION_CREDENTIALS=/rruga/te/service-account.json
export GOOGLE_PLACES_API_KEY=AIza...

# Provë — s'shkruan asgjë
node scripts/importo-masiv.js --qytetet=Prishtinë --kategorite=Restorante --prove

# Import real
node scripts/importo-masiv.js \
  --qytetet=Prishtinë,Prizren,Pejë,Gjakovë,Ferizaj,Gjilan,Mitrovicë \
  --kategorite=Restorante,Kafene,Hotele \
  --strategjia=plote --statusi=auto --maks-biznese=2000
```

Flamujt: `--te-gjitha-qytetet`, `--te-gjitha-kategorite`, `--pa-foto`,
`--qeliza-km=2.5`, `--maks-kerkesa=400`, `--perditeso` (rifresko ekzistueset), `--json`.

---

## 8. Kontrolli i kostos

- `maksKerkesaApi` — tavan i fortë i thirrjeve Google për punë (default 400).
- `maksBiznese` — tavan i shkrimeve (default 1000).
- `merrFotot: false` → kursen **1 thirrje media për biznes** (`foto` mbetet
  bosh, app-i bie te `gjejFotoAutomatikisht`). `googleFotoRef` ruhet gjithsesi,
  sepse është e qëndrueshme dhe lejon rigjenerim më vonë.
- Field-mask-i i kontakteve (telefon/website/orar) merret **brenda Text Search**,
  jo me Place Details veç e veç → gjysma e thirrjeve.

Çdo punë e raporton `numeratori.kerkesaApi` — kostoja reale, e matshme.

---

## 9. Siguria

- API key-i **vetëm** te Firebase Secrets / env i CLI-së — kurrë te Firestore, kurrë te browser-i.
- `eSigurtPerRuajtje()` refuzon çdo URL fotoje që mbart `key=` (fusha `foto` lexohet publikisht).
- Roli verifikohet **server-side** nga `përdoruesit/{uid}` — jo nga custom claims të klientit.
- `importJobs` dhe `biznesetIndeks`: `allow write: if false` — i shkruan vetëm backend-i.
- Çdo punë regjistrohet te `auditLogs` (`import_masiv_nisur` / `import_masiv_perfundoi`).

---

## 10. Testet

```bash
cd functions && npm test     # 60+ testë pure: rrjeta, mapimi, dedup, statusi, plani
bash tests/run-all.sh        # suita e frontend-it (SSR smoke + build)
```
