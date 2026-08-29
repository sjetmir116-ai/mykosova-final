# 📚 DOKUMENTACIONI — MyKosova

> Repo: `sjetmir116-ai/mykosova-final` · Branch punës: `arena/01a03a3c-mykosova-final`

---

## 🚀 EKZEKUTIMI LOKAL

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build-i i prodhimit (dist/) — përfshin PWA (sw.js + manifest)
```

**RRUGËT (routes):**
| Rruga | Përmbajtja |
|-------|-----------|
| `/` | Aplikacioni i përdoruesit (9 ekrane) |
| `/admin` | Paneli Admin (login + 6 seksione) |
| `/biznesi` | Paneli i Biznesit (overview, profil, rezervime, paketa) |

---

## 🔐 HYRJA TE PANELI ADMIN

**URL:** `.../admin` (ose butoni ⚙️ te navbar)

1. **Vizita e parë (bootstrap):** s'ka asnjë admin ende → plotëso Emrin + Email + Fjalëkalim (6+ shenja) → **bëheni admini kryesor**
2. **Vizitat pas:** hyrje me të njëjtat kredenciale
3. Credentials ruhen te **Firebase Authentication** (server-side) — kurrë në kod ose në klient

---

## ⚙️ CONFIGURIMI I DETYRUAR TE FIREBASE CONSOLE (2 minuta)

> Para se hyrja/lllogaritë të funksionojnë plotësisht, aktivizoni këto **një herë**:

### Hapi 1 — Email/Password
1. Hapni [Firebase Console](https://console.firebase.google.com) → projekti **my-kosova**
2. **Build → Authentication → Sign-in method**
3. Klikoni **Email/Password** → **Enable** → Save

### Hapi 2 — Security Rules
1. **Build → Firestore Database → Rules**
2. Copioni **të gjithë përmbajtjen** e skedarit **`firestore.rules`** (nga repo)
3. **Publish**

> Pa hapat 1+2: app-i punon me të dhënat lokale, por regjistrimi/hyrja dhe shkrimet në cloud do të dështojnë (me mesazhe të qarta gabimi).

### Hapi 3 — (opsional, rekomanduar) Backup
1. **Firestore Database → Backup** (plan-ët me pagesë kanë point-in-time recovery)
2. Plan falas: eksporto manualisht çdo javë: Firestore → **Export** → mbyll CSV/JSON te një vend i sigur (Google Drive/Drive i dytë)
3. **Testo recovery-n** (W11): merr një eksport → rishkruaje → verifiko që bizneset kthehen

---

## 📜 AUDIT LOG

Çdo veprim kritik regjistrohet në koleksionin `auditLogs`:
- **KUSH**: uid + email i përdoruesit
- **KUR**: `serverTimestamp()` (koha e serverit, jo e orës së klientit)
- **ÇFARË**: veprimi + detajet

Veprimet e mbikëqyrura: regjistrim, hyrje, dalje, shtim/miratim/rifuzim/fshirje/ndryshim biznesi, sinkronizim, ndryshime kontenti.

**Shikohet:** Paneli Admin → 📜 Audit Log

---

## 🗂️ KOLEKSIONET E FIRESTORE

| Koleksioni | Përshkrim | Shkrimi |
|------------|-----------|---------|
| `bizneset` | Bizneset (status: pendshe/aprovar) | Autentikuar (vetëm pendshe) / Admin |
| `përdoruesit` | Llogaritë (uid, email, emri, roli) | Vetë (krijim) / Admin (role) |
| `adminet` | ⚠️ I vjetër (vazhdimësia e vjetër) — mund të fshihet | — |
| `konfigurimi` | Bootstrap i adminit të parë | Vetëm krijimi i parë |
| `auditLogs` | Audit log | Autentikuar (create) / Admin (lexim) |
| `kategorite` | Kategoritë e menaxhueshme | Vetëm Admin |
| `qytetet` | Qytetet e menaxhueshme | Vetëm Admin |
| `emergencyServices` | Numrat e urgjencës | Vetëm Admin |
| `reviews` | Vlerësimet (Phase 2) | Autentikuar |
| `favorites` | Të ruajturat (Phase 2) | Vetë |
| `bookings` | Rezervimet (Phase 4) | Autentikuar |
| `offers`, `packages`, `subscriptions`, `payments` | (Phase 3+) | sipas rules |

---

## 🧭 STRUKTURA E KODIT

```
src/
├── App.jsx              # Router: / + /admin + navbar + footer
├── AppContext.jsx       # darkMode, gjuha, GPS, kërkimi, PËRDORUESI
├── auth.js              # Autentikimi qendror (Firebase Auth + bootstrap)
├── audit.js             # Audit log (regjistroAudit)
├── firebase.js          # Firebase config (db + auth + analytics)
├── theme.js             # Tema
├── teDhenat.js          # Të dhënat lokale (7 vende)
├── useBizneset.js       # Burimi i bashkuar (lokal + Firestore) + filtrimi i pendsheve
├── useKontenti.js       # Kategoritë / Qytetet / Urgjenca (DB + fallback lokal)
├── biznesFoto.js        # Foto sipas kategorisë
├── Llogaria.jsx         # Llogaria e përdoruesit (regjistro/hyr/profil)
├── Legal.jsx            # Privacy Policy + Terms
├── HomeScreen.jsx       # Ballina
├── HartaScreen.jsx      # Harta
├── ShtoBiznes.jsx       # Shto biznes — WIZARD 6-hapësh (→ pendshe + audit)
├── BiznesiDetaji.jsx    # Profili i biznesit (butonat, reviews, booking, favorites)
├── TripScreen.jsx       # Trip: Zbulo + Planner + Tripat e mi
├── BookingForm.jsx      # Rezervimi (hotel/restorant/aktivitet)
├── paketa.js            # Paketat Basic/Gold/Premium (nga DB)
├── attraksionet.js      # Atraksionet turistike + qytetet (nga DB)
├── useBookings.js       # Rezervimet (krijim/status)
├── useTrips.js          # Trip-et + gjenerimi i itinerarit
├── useFavorites.js      # Favorites te përdoruesi
├── useReviews.js        # Review-ët (shtim/raportim)
├── distanca.js          # Haversine (GPS)
├── biznesi/
│   └── BiznesiPanel.jsx # Paneli i biznesit (/biznesi)
├── SmartSearch.jsx      # Kërkimi Inteligjent
├── ListaBizneseve.jsx   # Lista e bizneseve
├── EmergencyScreen.jsx  # Urgjenca (nga DB)
├── asistenti.jsx        # AI (motor diturish)
├── RatingStars.jsx      # Vlerësimet
└── admin/
    ├── AdminLayout.jsx  # Guard + sidebar + seksionet
    ├── Hyrja.jsx        # Login/regjistrim admin
    ├── Dashboard.jsx    # Statistikat + sinkronizim bazë
    ├── MenaxhoBizneset.jsx  # CRUD + miratim
    ├── Kontenti.jsx     # CRUD kategoritë/qytetet/urgjenca
    ├── AuditLog.jsx     # Historia e veprimeve
    └── auth.js          # Shtresa e hyrjes së adminit
```

---

## 📊 STATUSI I FAZAVE (sipas MASTER_SPECIFICATION.md)

| Faza | Gjendja |
|------|---------|
| **Phase 1 — Foundation** | ✅ E përfunduar në kod — mbyllet me Hapat 1+2 te Firebase Console |
| **Phase 2 — Yellow Pages** | ✅ E përfunduar në kod |
| **Phase 3 — Business Platform** | ✅ E përfunduar në kod (payment → Phase payments) |
| **Phase 4 — Booking** | ✅ E përfunduar në kod (payment booking → Phase payments) |
| **Phase 5 — Trip** | ✅ E përfunduar në kod |
| **Phase 6 — AI** | ✅ E përfunduar në kod (gjetja + urgjenca + nearby + trip planning) |
| **Phase 7 — Scale** | 🟡 E nisur: PWA + SEO + Netlify ✅ — app nativ/website/advertising → më vonë |

**Progresi total: 73/215 funksione ✅ + 26 🟡 = 99/215 ≈ 46% e platformës**

---

## ⚠️ SHËNIME MBI SIGURINË

1. **Firebase API key** (në `firebase.js`) është publike natyrshëm — siguria vjen nga **Security Rules** (Hapi 2), jo nga fshehja e key-së
2. Fjalëkalimet: vetëm te Firebase Auth (server-side)
3. Audit log: i shkruar me `serverTimestamp` — klienti nuk e rregullon kohën
4. `payments` collection: **i mbyllur nga klienti** — do të shkruhet vetëm nga backend (webhooks) kur të arrijë Phase 3-4
5. Para publikimit: test i recovery (W11) + review i plotë i rules

---

# 🔐 S1 — SIGURIA E FIRESTORE (MBYLLUR 26.08.2026)

## Çfarë u bë

1. **`firestore.rules` v2.0** (238 rreshta, SHA-256 `7b4af5ce…`) — i audituar dhe **i publikuar te Firebase Console nga pronari**
2. **4 ndryshime minimale kodi** (zero UI, secila e detyruar nga një pikë e S1):
   - `src/auth.js` — renditja e shkruarjes: profili para `konfigurimi` (bootstrap-i kalon rules v2)
   - `src/useReviews.js` — email-i s'ruhet më te review (dokumenti është publike)
   - `src/useOfertat.js` — ruhet `uidPronari` te oferta (kufizim shkrimi te pronari)
   - `src/useTrips.js` (+ 1 rresht te `Llogaria`) — subcollection `trips/{uid}` (mbyllje list-exposure; zero migrim)
3. **Testet**: audit statik i plotë (9 skenat, rregull-për-rregull) + faqja live **`/test-siguria.html`** (25 teste, 1 klikim, e gati për ekzekutim manual çdo çast)

## Rrezikët e mbyllur te v2.0

| Rreziku | Statusi |
|---|---|
| Self-promotion (user → admin) | ✅ E mbyllur |
| Bookings të huaj / PII | ✅ vetë / pronari / admin |
| Trips list-exposure | ✅ subcollection |
| Favorites (bug-u i read-it) | ✅ funksionon + private |
| Email i reviewer-it publik | ✅ s'ruhet |
| Offers të biznesit tjetër | ✅ vetëm pronari |
| Fushat sensitive të biznesit (status/verifikuar/paketa/uidPronari/shtuesit) | ✅ vetëm admin |
| Subscriptions / Payments nga klienti | ✅ `write: false` |

## Rrezikët e mbetur (shih raportin e mbylljes)

- `bookings/list: eAutentikuar()` (e detyruar nga query-t; mbyllja e plotë = subcollections/Functions)
- Review-et e vjetra me `email` në DB (pastrim manual nga Console)
- Stats `shikime/klik*` të bllokuara nga klienti (duhen Cloud Functions)
- Firebase config te frontend (standard Web SDK; hardening = hapi tjetër)
- Testi live (`/test-siguria.html`) — për t'u ekzekutuar çdo çast: hap linkun → EKZEKUTO TESTET → dërgo daljen

## Ekzekutimi i testit live (kur të jetë gati)

```
https://5173-i1syabp7erl7n31lmih2l.e2b.app/test-siguria.html
```
(i loguar si admin → shtyp EKZEKUTO TESTET → ~30 sek → ✅/❌ + rezultati dërgohet automatikisht te agjenti)
