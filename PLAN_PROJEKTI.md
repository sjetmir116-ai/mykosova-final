# 📋 PLANI I PLOTË I PROJEKTIT — MyKosova

> Statusi i fundit: 25.08.2026 · Repo: `sjetmir116-ai/mykosova-final` · Branch: `arena/01a03a3c-mykosova-final`

---

## 1. AUDIT — ÇKA KA TANI PROJEKTI (e funksionueshme)

| # | Moduli | Statusi | Shënime |
|---|--------|---------|---------|
| 1 | **Ballina** 🏠 | ✅ Funksionuese | GPS live, kërkim i lidhur, Made in Kosovo, 10 kategori, 5 gjuhë |
| 2 | **Harta** 🗺️ | ✅ Funksionuese | Google Maps embed + panel koordinatash GPS |
| 3 | **Shto Biznes** 🏢 | ⚠️ E kufizuar | Vetëm 5 fusha, shkon **drejptë live** pa miratim, pa foto/pershkrim/telefon |
| 4 | **Kërkimi Inteligjent** 🔍 | ✅ Funksionuese | Filtrim pa akcente, 7+ vende reale, Navigo |
| 5 | **Lista e Bizneseve** 📋 | ✅ Funksionuese | Kartela me foto, vlerësime, oferta, Navigo |
| 6 | **Urgjenca** 🚨 | ✅ Funksionuese | SOS me GPS, 192/193/194/112, spital/farmaci |
| 7 | **AI Asistenti** 🤖 | ✅ Funksionuese | Motor diturish me të dhëna reale, sinonime, sugjerime |
| 8 | **Vlerësimet** ⭐ | ✅ Funksionuese | RatingStars me sync live Firestore |
| 9 | **5 gjuhët + Dark Mode** 🌐 | ✅ Funksionuese | SQ/EN/FR/DE/IT, theme dark/light |
| 10 | **Burimi i të dhënash** 🗄️ | ✅ I bashkuar | Lokale (7 vende) + Firestore live |

**Stack:** React 18 + Vite 5 + Firebase (Firestore) · `react-router-dom` është në package.json por **nuk përdoret ende** — do të përdoret për `/admin`.

---

## 2. GAPS — ÇKA MUNGON (dhe prioritetet)

### 🔴 KRITIKE (për t'u bërë të parat)

**A. PANELI ADMIN — s'ekziston fare** ⭐ (kërkesa direktë)
- Hyrja e adminit (Firebase Auth — email/fjalëkalim)
- Dashboard me statistika: numri i bizneseve, sipas kategorisë/qytetit, mesatarja e yjeve, shtimet e fundit
- Menaxhim biznese: **edho, fshi, mirato/rirefu** (status `pendshe` → `aprovar`)
- Moderim i vlerësimeve

**B. AUTENTIKIMI — s'ka asnjë login**
- Tani çdo vizitor e shton biznesin **drejptë në listën publike** (pa kontroll)
- Duhej: Firebase Auth (email + Google), role: `vizitor` / `admin`

**C. FLUSI I SHTIMIT — pa miratim**
- Modeli i të dhënash duhet të shtojë: `status`, `foto`, `adresa`, `telefoni`, `pershkrimi`, `oferta`, `shtuarM nga`
- Fushat aktuale: vetëm emri, kategoria, qyteti, lat, lng

### 🟠 E LARTË (pas adminit)

**D. Faqja e Detajit të Biznesit** — kliko një biznes → faqe e dedikuar: foto, pershkrimi, telefon (buton thirrje), hartë me pin, komentet, oferta, buton Ndaje

**E. Komentet / Review-at** — modeli ka `komentet` (te teDhenat.js) por s'ka UI për të shtuar; i duhet formë + listë + modifikim nga admini

**F. "Afër meje" (distanca GPS)** — renditje sipas Haversine nga lokacioni i përdoruesit

**G. Seksioni Turizëm** 🏔️ — faqe e dedikuar për Rugova, kalat, muzetët, parket (tani ekziston vetëm si rezultat kërkimi)

**H. Seksioni Ofertat** 🎁 — faqe e dedikuar (AI-ja i di, por s'ka ekran)

### 🟡 MESATARE (pasi app-i jeton)

**I. PWA** — manifest, service worker, instalueshme, punon offline (rëndësi e madhe për diasporë me internet të dobët)

**J. Deploy + SEO** — netlify.toml (kishte repoja tjetër), meta tags, OG image, sitemap

**K. Analytics** — Firebase Analytics është inicializuar por **s'trackohet asgjë**; event: `search`, `business_view`, `navigate`, `rate`, `sos_press`

**L. Ndaje (Share)** — buton WhatsApp/Facebook në detajin e biznesit

### ⚪ KUALITET (kontinues)

**M. Firebase Security Rules** — ⚠️ **rrezik**: nëse rules janë open, çdo vizitor mund të fshijë/të ndryshojë të gjitha të dhënat. Duhet: lexim public, shkrim vetëm me role
**N. Testet** — Vitest + React Testing Library (motori i AI-së ka 10 teste të suksesshme si skript — të kthehen testet e vërteta)
**O. README** — dokumentacioni i repo-t (si ekzekutohet, struktura, credentials)

---

## 3. ARCHITECTURA E PËRMIRËSUAR

```
src/
├── App.jsx                 # Router: / , /admin (react-router-dom)
├── AppContext.jsx          # darkMode, gjuha, GPS, kërkimi, USERI (e re)
├── teDhenat.js             # të dhënat lokale (7 vende)
├── useBizneset.js          # burimi i bashkuar (lokale + Firestore)
├── theme.js                # tema
├── biznesFoto.js           # foto sipas kategorisë
├── firebase.js             # Firebase config
├── motorDiturive.js        # (re) motori i AI-së i shkëputur nga UI → testueshëm
│
├── ekranet/                # (opsionale: organizim)
│   ├── HomeScreen.jsx
│   ├── HartaScreen.jsx
│   ├── ShtoBiznes.jsx      # → forma e plotë + status "pendshe"
│   ├── SmartSearch.jsx
│   ├── ListaBizneseve.jsx
│   ├── EmergencyScreen.jsx
│   ├── asistenti.jsx
│   ├── BiznesiDetaji.jsx   # (RE)
│   ├── Turizmi.jsx         # (RE)
│   └── Ofertat.jsx         # (RE)
│
├── admin/                  # (RE) PANELI ADMIN
│   ├── AdminLayout.jsx     # sidebar + header + guard
│   ├── Hyrja.jsx           # login
│   ├── Dashboard.jsx       # statistika
│   ├── MenaxhoBizneset.jsx # tabela CRUD + miratim
│   └── Moderimi.jsx        # vlerësimet/komentet
│
└── Auth.jsx                # (RE) provider-i i autentikimit
```

**Modeli i të dhënash i ri (biznesi):**
```js
{
  emri, kategoria, qyteti, adresa, foto, telefoni,
  lat, lng, pershkrimi, oferta,
  vleresimi (mesatare), numriIvleresimeve,
  status: 'pendshe' | 'aprovar',      // ← e re
  shtuarM nga: { emri, email, data }, // ← e re
  komentet: [{ autor, tekst, yje, data }]
}
```

---

## 4. ROADMAP — FAZAT E PËRKRAHJA

### 🥇 FAZA 1 — PANELI ADMIN ✅ E MBYLLUR ZYRTARE (testuar nga përdoruesi 29.08.2026)
1. ✅ Hyrja me email/fjalëkalim — hash SHA-256 në koleksionin `adminet` (sistemi i bootstrap-it: admini i parë regjistrohet vetë nga browseri, pa ndryshime në Firebase Console)
2. ✅ Route `/admin` (react-router-dom) + butoni ⚙️ te navbar; pa sesion → faqja e hyrjes
3. ✅ **Dashboard**: biznese totale, aprovuar/pendshe, sipas kategorisë, sipas qytetit, mesatarja e yjeve, 5 shtimet e fundit + butoni "Ngarko bazën në cloud"
4. ✅ **Menaxho Bizneset**: kërkim + filtra (të gjitha/pendshe/aprovar), butonat **Mirato ✓ / Rifuzo ✗ / Edho ✏️ / Fshi 🗑️**, bizneset lokale me "Ungjit në cloud"
5. ✅ Forma e editimit me të gjitha fushat (emri, kategoria, qyteti, adresa, foto, telefoni, lat/lng, pershkrimi, oferta, statusi, vlerësimi)
6. ✅ Viza e të dhënash: bizneset nga "Shto Biznes" me `status: 'pendshe'` + `shtuarMNga` — publiku i shoh vetëm të aprovuarat (`useBizneset({vetemAprovuar})`)

**Rezultati:** app-i u kthye i kontrollueshëm nga admini.

**Mbyllja zyrtare (29.08.2026):** përdoruesi e testoi nga browser-i — Ballina hapet pa gabime ✅, kërkimi "kafe" jep rezultate ✅, paneli Admin hapet ✅. Raporti: `RAPORT_FAZA1.md`. Backup: tag `backup-faza1-final-2026-08-29` + branch `backup/faza1-2026-08-29`.

### 🥈 FAZA 2 — SHTO BIZNES 2.0 + DETAJI + KOMENTET ✅ E PËRFUNDUAR (29.08.2026)
1. ✅ **Forma e plotë (Shto Biznes 2.0)** — wizard 6 hapa: emri, pershkrim, **oferta** (e shtuar 29.08), kategoria, qyteti, adresa, GPS me buton "Përdor lokacionin tim (GPS)", foto (URL + preview), telefon, WhatsApp, website, review & submit → status `pendshe` + anti-abuz (max 5 biznese/llogari)
2. ✅ **`BiznesiDetaji.jsx`** — çdo biznes hapet në profilin e vet (nga Lista, Kërkimi, AI, Favorites): foto, vlerësim, pershkrim, oferta, **Telefon ☎️**, WhatsApp, Navigo, Website, Booking, Favorites ❤️, distanca GPS
3. ✅ **Vlerësimet (Komentet)** — përdoruesi shton (emri + tekst + yje + foto), anti-spam (max 3/përdorues/biznes), "Ndihmoi? 👍", raportim ⚑ + **Moderimi te Paneli Admin** (tabi i ri `⭐ Moderimi`: listë live, stat, kërkim, filtri "vetëm me raporte", fshie/çzero raportet, audit log)
4. ✅ **Ndaje (Share)** — men me 3 opsione: 💬 Ndaje te WhatsApp, 📋 Kopjo linkun, 📤 Ndaje me browser-in — linku `#biznesi=Emri` hap direkt detajin te personi që e hapt

**Rezultati:** përvoja e plotë përdoruesi si Google Maps.

**Mbyllja zyrtare (29.08.2026):** përdoruesi e testoi nga browser-i — Profili i Biznesit ✅, Ndaje me 3 opsione (WhatsApp/Kopjo Linkun/Browser) ✅, linku `#biznesi=Emri` hap biznesin direkt ✅, Moderimi te Admin ✅, Oferta te Shto Biznes ✅. Backup: tag `backup-faza2-final` + branch `backup/faza2-2026-08-29` (commit `311a426`, verifikuar te GitHub).

### 🥉 FAZA 3 — VEÇORITË E LARTË ✅ E MBYLLUR ZYRTARE (29.08.2026)
1. ✅ **"Afër meje" — distanca GPS (Haversine) + butoni në Ballina/Harta** (29.08.2026): buton te Ballina + shiriti "Të afërt me ju" (4 më të afërtat me foto + distancë), ndërrues "📍 Afër meje ✓" te Lista (renditje live + shenja "X km nga ju" + statusi i GPS me riprovim), buton "📍 Afër meje" te Harta. **v2 (kërkesë e përdoruesit):** watchPosition (auto-rifreskim kur lëviz), ASGJË auto-Prishtina, pika referencë MANUALE (33 qytete) kur GPS refuzohet, saktësia ±m — testuar me GPS real të telefonit (përputhet me Google Maps). U shtuan lat/lng te 7 bizneset lokale + u rregullua bug i vjetër `meDistanca` — gjetur me 30 teste unitare
2. ✅ **`Turizmi.jsx` — pika turistike me foto, histori, navigo** (29.08.2026): faqe e dedikuar me 10 atraksione (foto me fallback gradient+ikonë, përshkrim, aktivitetet, Navigo), ullërimi i 10 qyteteve (filtrim), filtri i kategorive, renditje sipas distancës nga lokacioni real/manual, buton te navbar (5 gjuhë) + 4 kartela te Ballina. U rregulluan 8 gabime koordinatash (p.sh. Kalaja e Gjakovës ishte 100 km larg — te koordinatat e Prizrenit) — verifikuar me 11 teste
3. ✅ **`Ofertat.jsx` — të gjitha ofertat në një vend** (29.08.2026): faqe e dedikuar me dy burime (ofertat dinamike me skadencë nga `offers` + të përhershme nga bizneset), filtri i qytetit, distanca, Navigo (embed fallback), "Hap biznesin" → profilli, seksion i skaduarave, gjendja bosh me CTA, buton navbar + seksion te Ballina — 5 teste të skadencës
4. ✅ **Analytics** (29.08.2026): 8 ngjarje (kërkim, hapje_biznesi, navigo, telefon, vlerësim, sos, ndaje, shtim_biznesi) nga çdo vizitor te `analytics_events` (fire-and-forget), **Paneli Admin → 📊 Analitika** (statistika live, top biznese/kërkime, veprat, 7 ditët e fundit), rules v2.1 me validim të mbyllur (fushat e sakta + ngjarje të njohura + koha e serverit) — 7 teste

**Mbyllja zyrtare (29.08.2026):** të 4 veçoritë testuara me sukses nga përdoruesi (GPS real te telefoni, Navigo me embed, Ofertat → profilli, Analitika live). Raporti: `RAPORT_FAZA3.md`. Backup: `backup-faza3-final-2026-08-29`. Versioni: v1.0.9.

### 🏁 FAZA 4 — POLISHERI + LANSIM 🚧 (në vazhdim)
1. ✅ **PWA: manifest + service worker (offline)** — manifesti ekzistonte; u shtuan ikonat PNG 192/512 + apple-touch-icon (29.08.2026) → instalueshme te telefoni
2. 🚧 **Deploy Netlify** — `netlify.toml` i gati (build `npm run build`, publish `dist`, SPA redirects, header-e sigurie); **pret veprimin e përdoruesit** (llogari Netlify falas → import GitHub → deploy)
3. ✅ **Firebase Security Rules** — v2.1 (me analytics_events) e publikuar nga përdoruesi (29.08.2026)
4. ✅ **Testet formale** — 57 teste unitare të qëndrueshme (`tests/test-*.mjs`) + suita 5-hapëshe (`tests/run-all.sh`: unitare + konstante + context + SSR smoke + build)
5. ✅ **README** — dokumentacioni i plotë (stack, struktura, teste, deploy, siguria, backup-et)

---

## 5. RËZIKET DHE NËNVEPRIMET

| Rreziku | Nënveprimi |
|---------|-----------|
| Firebase rules open (shkrim publik) | Shkruaj rules: `allow read: if true; allow write: if isAdmin()` — **FAZA 4, por rrezik tani** |
| Të dhënat lokale (7 vende) s'janë në Firestore | Të gjitha e shohin; në Fazën 1 admini ta miratojë bazën fillestare → kalohen në Firestore me `status: 'aprovar'` |
| `react-router-dom` i ri (nuk u testua) | Install tani + test i shpejtë përpara Fazës 1 |
| Preview sandbox pa internet ndaj Google API | Testet bëhen nga browser-i i përdoruesit; sandbox-u e shërben vetëm kodin |

---

## 6. RREGULLAT E PËRDOREUSIT (të respektuara nga agjenti)

1. **Backup para çdo ndryshimi** — tag + branch backup në GitHub para se të preket kodi (i pari: `backup-faza1-final-2026-08-29`)
2. **Asnjë pagesë pa miratimin e përdoruesit** — çdo veprim që mund të kushtojë (deploy e paguar, plan Firebase, domen, etj.) kërkon miratim të përdoruesit me para. Të gjitha mjetet deri tani: falas (npm, Firebase Spark, GitHub)

---

## 7. VENDIMET E MARRA TANI DERI TANI

1. ✅ MyKosov (repoja tjetër) **nuk u merge-ua** — gjithçka u rishkrua nga zero këtu
2. ✅ `teDhenat.js` u aktivizua si bazë lokale + Firestore si shtesë live
3. ✅ AI-ja u rindërtua: simulim i rremë → motor diturish me të dhëna reale
4. ✅ Gjuhët: 5 (SQ/EN/FR/DE/IT) — më mirë se repoja tjetër (4)
5. ✅ Paneli admin: **i përfunduar** (25.08.2026) — login, dashboard, menaxhim biznese, kontent
6. ✅ Bug "Cannot read properties of null (reading 'useState')": rregulluar me `resolve.dedupe` + `optimizeDeps.include` te `vite.config.js` (shkaqi: dy kopje të React në Vite — rregullimi standard `resolve.dedupe`)
