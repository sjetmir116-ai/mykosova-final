# 🇽 MyKosova — Super-platforma e Kosovës

**Gjej, Rezervo, Udhëto në Kosovë** — Yellow Pages + Booking + Trip Planner + Harta + Vlerësime + AI Asistent, në 5 gjuhë, me dark mode dhe funksionim offline (PWA).

> Statusi: **v1.0.9** · Fazat 1–3 të përfunduara (shih `PLAN_PROJEKTI.md` dhe `RAPORT_FAZA*.md`)

---

## ✨ Veçoritë

| Ekran | Çfarë bën |
|---|---|
| 🏠 **Ballina** | Kërkim, GPS live, moti, "Afër meje", Turizmi, Ofertat, Made in Kosovo, 10 kategori |
| 🗺️ **Harta** | Google Maps embed + paneli i lokacionit + butoni "Afër meje" |
| 📋 **Lista** | Kartela me foto, vlerësime, oferta, distancë, Navigo, filtri "Afër meje" |
| 🔍 **Kërkimi Inteligjent** | Filtrim pa akcente, renditje sipas distancës, Navigo |
| 🏔️ **Turizmi** | 10 atraksione (foto, histori, aktivitetet), ullërimi i 10 qyteteve, filtra, Navigo |
| 🎁 **Ofertat** | Të gjitha ofertat aktive (me skadencë + të përhershme), filtri i qytetit |
| 🏢 **Shto Biznes** | Wizard 6-hapësh → statusi `pendshe` → e miraton admini |
|  **AI Asistenti** | Motor diturish me të dhëna reale (biznese, atraksione, urgjenca, moti) |
| 📅 **Trip** | Plane udhëtimi me itinerar, moti, eventet |
| 🚨 **Urgjenca** | SOS me GPS, 192/193/194/112, spital/farmaci |
| ⭐ **Vlerësimet** | Yje + tekst + foto, "Ndihmoi?", raportim, moderim nga admini |
| 📊 **Analytics** | 8 ngjarje live + Paneli Admin → Analitika (top biznese, kërkime, 7 ditë) |
| ⚙️ **Paneli Admin** | `/admin` — Dashboard, Menaxho Bizneset, Rezervimet, Paketa, Përdoruesit, Kontenti, Moderimi, Analitika, Audit Log |
| 🏢 **Paneli i Biznesit** | `/biznesi` — profili i biznesit (vetëm pronari) |

**5 gjuhë:** SQ / EN / FR / DE / IT · **Dark/Light mode** · **PWA** (instalueshme, offline)

---

## 🛠️ Stack-u

- **React 18** + **Vite 5** (dev server: `npm run dev -- --host 0.0.0.0 --port 5173`)
- **Firebase** (Firestore + Auth + Functions) — projekti `my-kosova`
- **react-router-dom 6** — routet `/admin` dhe `/biznesi`
- **vite-plugin-pwa** — manifest + service worker (offline)
- **Firebase Security Rules v2.1** — `firestore.rules` (audituara; shih `TEST_SIGURIA.md`)

---

## 🚀 Si ekzekutohet (lokalisht)

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
# hap: http://localhost:5173
```

> Shënim: Firebase-i (Firestore/Auth) kërkohet nga **browser-i** i përdoruesit — kodi i app-it shërbehet nga Vite, të dhënat vijnë live nga Firebase.

---

## 📁 Struktura

```
src/
├── App.jsx              # Routet + navbar-i + ekranet kryesore
├── AppContext.jsx       # Gjuha, dark mode, GPS (watchPosition), përdoruesi, biznesiIzgjedhur
├── firebase.js          # Konfigurimi i Firebase (projekti "my-kosova")
├── main.jsx             # Hyrja + ErrorBoundary + shenjuesi i versionit
│
├── Ekranet
│   ├── HomeScreen.jsx   # Ballina
│   ├── HartaScreen.jsx  # Harta
│   ├── ListaBizneseve.jsx / SmartSearch.jsx / ShtoBiznes.jsx
│   ├── Turizmi.jsx / Ofertat.jsx / TripScreen.jsx
│   ├── EmergencyScreen.jsx / asistenti.jsx (AI)
│   ├── BiznesiDetaji.jsx / BookingForm.jsx
│   ├── Llogaria.jsx / Legal.jsx
│
├── Të dhënat & logjika
│   ├── teDhenat.js      # 7 bizneset fillestare (me GPS)
│   ├── attraksionet.js  # 10 atraksione + 10 qytete (hook: useAttraksioneve)
│   ├── useBizneset.js   # Burimi i bashkuar (lokal + Firestore, vetëm të aprovuarat)
│   ├── useReviews.js / useOfertat.js / useBookings.js / useTrips.js / useFavorites.js
│   ├── distanca.js      # Haversine + meDistanca (Afër meje)
│   ├── moti.js          # Moti (Open-Meteo, pa key)
│   ├── qyteteGPS.js     # 33 qytete me koordinata (pika referencë MANUALE)
│   ├── analytics.js     # 8 ngjarjet e përdoruesve (Faza 3.4)
│   ├── hapLinkun.js     # Navigo me 3 shtesa (tab i ri → embed → tabi aktual)
│   ├── Foto.jsx         # Imazhe me fallback elegant (gradient + ikonë)
│   ├── auth.js / audit.js / paketa.js / eventet.js / useKontenti.js
│   ├── biznesi/BiznesiPanel.jsx   # /biznesi
│   └── admin/           # /admin — 9 seksionet e panelit
│
tests/
├── run-all.sh           # SUNITA E PLOTË (4/4 kontrollet + build)
├── run-smoke.sh         # SSR smoke test — kap gabimet runtime PARA përdoruesit
├── check-konstantet.mjs # Variabël i përdorur pa u shënuar (54 skedarë)
└── check-context.mjs    # Variablat e AppContext të pa destruktuara
```

---

## 🧪 Testet

```bash
bash tests/run-all.sh
```

Egzekuton: (1) kontrolli i konstanteve, (2) kontrolli i context-it, (3) **SSR smoke test** (renderon app-in e plotë server-side — çdo `X is not defined` kapet këtu), (4) build i prodhimit.

Testet unitare të fazave (57 gjithsej): Haversine + renditja (30), koordinatat e atraksioneve (11), skadencat e ofertave (5), ngjarjet e analytics (7), link-et embed (4) — kryhen gjatë zhvillimit; suita `run-all.sh` është detyrim me çdo commit.

**Rregulli i projektit:** çdo funksion i ri testohet **para** se të kalojmë te tjetri.

---

## 📦 Deploy

### Netlify (plan falas — zero pagesë)
1. `app.netlify.com` → **Add new site → Import an existing project** → GitHub → `sjetmir116-ai/mykosova-final`
2. Branch: `arena/01a03a3c-mykosova-final`
3. Build: `npm run build` · Publish: `dist` (të dyja janë në `netlify.toml` — Netlify i merr vetë)
4. **Deploy** → adresa `https://<emri>.netlify.app`
5. SPA redirectet + header-et e sigurisë janë te `netlify.toml`

### Firebase (nëse nuk janë publikuar ende)
- **Rules:** Firebase Console → Firestore → Rules → copiofa `firestore.rules` (**v2.1**) → *Publish*. Pa rules, Analytics dhe shkrimet e përdoruesve nuk ruhen.
- **Cloud Functions** (`functions/`): opsionale për faza të ardhshme (pagesa, statistikë).

---

## 🔐 Siguria (v2.1 e rregullave)

1. Role-ët ndryshohen **vetëm** nga admin (self-promotion = e mblyer)
2. Bookings/trips/favorites: vetëm pronari + admin
3. Reviews/offers: shkrim i kufizuar sipas fushave (email-i i reviewer-it s'ruhet te dokumenti publik)
4. Subscriptions/payments: e mblyer nga klienti (i shkruan vetëm backend-i)
5. `analytics_events`: create vetëm me fushat e sakta + ngjarje të njohura + koha e serverit; read vetëm admin
6. Çdo collection e panjohur: **e mblyer**
7. Testi i plotë i sigurisë: `TEST_SIGURIA.md` (ekzekutohet te browser-i)

---

## 💾 Backup-et (pikat e rikthimit)

Çdo fazë e mbyllur ka një tag + branch te GitHub:

| Tag | Çka përmban |
|---|---|
| `backup-faza1-final-2026-08-29` | Paneli Admin + siguria + PWA |
| `backup-faza2-final` | Shto Biznes 2.0 + Detajit + Vlerësimet + Moderimi + Ndaje |
| `backup-afërmeje-final-2026-08-29` | GPS real + MANUAL 33 qytete |
| `backup-turizmi-final-2026-08-29` | Turizmi + Navigo embed |
| `backup-ofertat-final-2026-08-29` | Ofertat + menuja 2-vitesh |
| `backup-faza3-final-2026-08-29` | **Faza 3 e plotë (v1.0.9)** |
| `backup-faza4-start-2026-08-29` | Fillimi i Fazës 4 |

Rikthim: `git checkout <tag>` (ose `git reset --hard <tag>` te branch-i punues).

---

## 🗺️ Rruga (shih `PLAN_PROJEKTI.md`)

- ✅ **Faza 1** — Paneli Admin + Siguria (25.08.2026)
- ✅ **Faza 2** — Shto Biznes 2.0 + Detajit + Vlerësimet (29.08.2026)
- ✅ **Faza 3** — Afër meje + Turizmi + Ofertat + Analytics (29.08.2026)
- 🚧 **Faza 4** — Poliseri + Lansim (README, PWA ikona, deploy Netlify, testet formale)

---

Made in Kosovo 🇽 — kodohet nga MyKosova, me dashuri dhe teste.
