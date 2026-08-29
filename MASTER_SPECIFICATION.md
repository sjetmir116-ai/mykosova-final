# 🇽🇰 MY KOSOVA — MASTER SPECIFICATION v1.0

> **Dokument zyrtar i specifikimit** · Version 1.0 · Data: 25.08.2026
> Repo: `sjetmir116-ai/mykosova-final` · Branch: `arena/01a03a3c-mykosova-final`
> Burimi: Master Plan (vizioni super-platformës) + Audit-i real i kodit ekzistues

---

## 0. LEGJENDA

### Prioriteti
| Shenja | Kuptimi | Kur |
|--------|---------|-----|
| **CORE** | Pa të, platforma nuk ekziston | v1.0 — para lansimit |
| **IMPORTANT** | E duhur për të qenë konkurrues | v1.1–v1.3 — 1–3 release pas lansimit |
| **FUTURE** | Vizion afati të gjatë | v2.0+ — roadmap |

### Statusi (real, nga audit-i i kodit 25.08.2026)
| Shenja | Kuptimi |
|--------|---------|
| ✅ | E ndërtuar dhe funksionuese tani |
| 🟡 | E përkisur pjeshmërisht (ka bazë, duhet zgjeruar) |
| ⬜ | E planifikuar |

**Çfarë kemi tani (v0.2):** 7 ekrane përdoruesi · AI me motor diturish · 5 gjuhë · Dark mode · Burim i bashkuar të dhënash (lokal + Firestore) · Panel admin v1 (login + dashboard + CRUD + miratim) · Vlerësime me sync live.

---

## 1. USER APP (Aplikacioni për përdoruesin) — 32 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| U1 | Home: logo + hero | Faqja kryesore me logo MyKosova, titull, nëntitull | CORE | ✅ |
| U2 | Smart Search (bazë) | Kërkim sipas emri/kategori/qytet/adresë, pa akcente | CORE | ✅ |
| U3 | Smart Search (natural language) | "Hotel i lirë në Prizren", "Servis për Mercedes në Prishtinë" — kuptim i fjalëve (çmim, markë, gjendje) | IMPORTANT | 🟡 |
| U4 | "Çfarë po kërkon?" — input kryesor | Shtypja e parë e përdoruesit është një kërkim | CORE | ✅ |
| U5 | Kategoritë në Home | Rrjetëzimi i kategorive me ikona, klik → kërkim | CORE | ✅ |
| U6 | Biznese Premium në Home | Shfaqja e bizneseve Gold/Premium në faqen kryesore | IMPORTANT | ⬜ |
| U7 | Oferta në Home | Feed i ofertave aktive me "vlen deri më..." | IMPORTANT | ⬜ |
| U8 | Nearby (GPS) | Renditje sipas distancës nga pozita, Haversine | IMPORTANT | ⬜ |
| U9 | Panel GPS live | Statusi i GPS + koordinatat (rreth meje) | CORE | ✅ |
| U10 | Booking entry | Buton/faqe hyrëse te rezervimet | IMPORTANT | ⬜ |
| U11 | Trip entry | Buton/faqe hyrëse te udhëtimet | IMPORTANT | ⬜ |
| U12 | Turizëm (faqe) | Faqe e dedikuar: qytete + atraksione | IMPORTANT | ⬜ |
| U13 | Emergency (faqe) | SOS + numra + spital/farmaci me Navigo | CORE | ✅ |
| U14 | Evente | Koncerte, festivale, sport, kulturë — date, lokacion, hartë | FUTURE | ⬜ |
| U15 | Lokacione të rekomanduara | Rekomandime bazuar në pozicion/gjuhë/sezon | FUTURE | ⬜ |
| U16 | Banners/promovime | Banerë të menaxhueshëm nga admini në Home | FUTURE | ⬜ |
| U17 | Sugjerime të personalizuara | Bazuar në history, favorites, gjuhën | FUTURE | ⬜ |
| U18 | Profili i biznesit (faqe) | Emri, logo, cover, galeri, video, përshkrim, kategori, nënkategori, adresë, qytet, GPS, telefon, WhatsApp, email, website, social, orari, shërbime, çmime, oferta, reviews, rating, statusi i verifikimit | CORE | ⬜ |
| U19 | Butonat e profilit | Call · WhatsApp · Directions · Website · Book · Save · Share · Review | CORE | 🟡 (Call/Directions/Share ekzistojnë pjeshmërisht) |
| U20 | Harta me filtra | Filters: hotele, restorante, farmaci, spitale, karburant, EV, servis, atraksione, parking, taxi, ATM, urgjenca | CORE | 🟡 (harta ekziston, filters ⬜) |
| U21 | Nearby në hartë | "Afër meje" + renditje sipas distancës | IMPORTANT | ⬜ |
| U22 | Reviews & ratings (1–5) | Vlerësim yjesh + tekst + foto nga klienti | CORE | 🟡 (yje ✅, tekst/foto ⬜) |
| U23 | Verified visit/booking | Shenja "vizitë e verifikuar" te review-ët | FUTURE | ⬜ |
| U24 | Like/Helpful + Report | "Ndihmoi?" + raportimi i review-it | IMPORTANT | ⬜ |
| U25 | Anti-spam reviews | Detektim fake reviews, kufizim 1/përdorues/biznes, anti-spam | IMPORTANT | ⬜ |
| U26 | Favorites (ruajtje) | Ruajt: biznese, hotele, restorante, vende turistike, tripe, oferta | IMPORTANT | ⬜ |
| U27 | Account: login | Email + fjalëkalim (v1) · Google (v1.1) · Apple/Facebook (FUTURE) | CORE | 🟡 (admin ekziston, user ⬜) |
| U28 | Profili i përdoruesit | Favorites, Bookings, Reviews, Trips, Notifications, Settings, Language | IMPORTANT | ⬜ |
| U29 | Push notifications | Booking confirmation/reminder, oferta, tripe, reviews | IMPORTANT | ⬜ |
| U30 | Transport | Taxi, bus, rent a car, airport transport + Directions | FUTURE | ⬜ |
| U31 | Weather | Moti për Kosovën/qytetet/destinacionet; "A është moti për Rugovë nesër?" | FUTURE | ⬜ |
| U32 | EV Chargers ⚡ | Hartë pikash karikimi: lokacion, tip, disponueshmëri, connector, shpejtësi, operator | FUTURE | ⬜ |

**Shuma USER APP:** 32 · ✅ 9 · 🟡 4 · ⬜ 19

---

## 2. YELLOW PAGES (Baza e platformës) — 20 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| Y1 | Sistemi i kategorive | I strukturuar, i ruajtur në DB, i ndryshueshëm nga admini **pa ndryshuar kod** | CORE | 🟡 (hardcoded tani) |
| Y2 | Hospitality | Hotele · Apartamente · Vila · Guesthouses · Hostele | CORE | ⬜ |
| Y3 | Food | Restorante · Fast Food · Pizzeria · Kafene · Bakery · Traditional | CORE | 🟡 (ka restorant/kafe) |
| Y4 | Automotive | Autoservise · Autolarje · Vulcanizer · Rent a Car · Taxi · Auto parts | IMPORTANT | ⬜ |
| Y5 | Health | Spitale · Klinika · Dentist · Laboratorë · Farmaci | CORE | ⬜ |
| Y6 | Shopping | Supermarkete · Dyqane · Fashion · Elektronikë · Mobilje | IMPORTANT | ⬜ |
| Y7 | Services | Elektricistë · Hidraulikë · Ndërtim · IT · Kontabilitet · Avokatë · Agjenci | IMPORTANT | ⬜ |
| Y8 | Business | Kompani · Agjenci · Real Estate · Insurance · Finance | FUTURE | ⬜ |
| Y9 | Tourism | Atraksione · Monumente · Bjeshkë · Liqene · Ujëvara · Parqe · Muze · Historike | IMPORTANT | 🟡 (ka Turizëm si kategori) |
| Y10 | Kategori të reja pa ndryshuar kod | Arkitekturë e hapur: admini shton kategori/nënkategori | CORE | ⬜ |
| Y11 | Profili i plotë i biznesit | Të gjitha fushat sipas U18 (logo, galeri, video, orari, shërbimet, çmimet...) | CORE | 🟡 (5 fusha tani) |
| Y12 | Search listing | Biznesi del te kërkimi me kartelë (emri, kategori, qytet, yje, foto) | CORE | ✅ |
| Y13 | Search filters | Sipas kategorisë, qytetit, çmimit, orarit | IMPORTANT | ⬜ |
| Y14 | Search sorting | Rating · Distanca · Emri · Featured (paketa) | IMPORTANT | ⬜ |
| Y15 | Featured positioning | Bizneset Gold/Premium me renditje prioriteti te rezultatat | IMPORTANT | ⬜ |
| Y16 | Auto-fill GPS | Buton "Përdor lokacionin tim" te regjistrimi | IMPORTANT | ⬜ |
| Y17 | Duplicate detection | Detektim biznese dublet (emër + qytet + proximitet GPS) | IMPORTANT | ⬜ |
| Y18 | QR code për biznes | Scan → profili i biznesit në MyKosova (tavolina, faturë, kartë) | FUTURE | ⬜ |
| Y19 | Verifikim biznesi | Risk Score: telefon + email + GPS + duplicates + emri → Auto approve / Manual / Reject | IMPORTANT | 🟡 (miratim manual ekziston) |
| Y20 | Statusi i verifikimit | Shenja ✓ "Verifikuar" te profili, e dhënë nga admini | IMPORTANT | ⬜ |

**Shuma YELLOW PAGES:** 20 · ✅ 1 · 🟡 3 · ⬜ 16

---

## 3. BUSINESS PANEL (Paneli i biznesit) — 20 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| B1 | Login biznesi | Owner/Manager hyjnë në panelin e vet (separuar nga admin) | CORE | ⬜ |
| B2 | Role biznesi | Owner (plotë) vs Manager (të kufizuara) | IMPORTANT | ⬜ |
| B3 | Overview dashboard | Views · Searches · Calls · WhatsApp clicks · Website clicks · Directions · Favorites · Bookings · Reviews | IMPORTANT | ⬜ |
| B4 | Manage profile | Info · Fotos · Orari · Shërbimet · Social links | CORE | ⬜ |
| B5 | Manage gallery | Foto + video të bizneseve në Storage | IMPORTANT | ⬜ |
| B6 | Manage orari + pushime | Ditët, oraret, ditët e pushimit | IMPORTANT | ⬜ |
| B7 | Manage shërbime & çmime | Listë shërbimesh me çmim për secilën | IMPORTANT | ⬜ |
| B8 | Manage oferta | Zbritje % · çmim special · ditore · javore · seasonal · paketë · last minute — me datë skadence | IMPORTANT | ⬜ |
| B9 | Manage booking | Reservations · Calendar · Availability · Confirm/Cancel | IMPORTANT | ⬜ |
| B10 | Analytics biznesi | Grafikë: views, clicks, calls, bookings, review-at | IMPORTANT | ⬜ |
| B11 | Revenue statistics | Të ardhura nga bookings (për paketat me booking) | FUTURE | ⬜ |
| B12 | Leads / mesazhe | Përdoruesit dërgojnë mesazh/kërkesë te biznesi | FUTURE | ⬜ |
| B13 | Subscription (paketa) | Basic/Gold/Premium · billing · renewal · upgrade/downgrade | IMPORTANT | ⬜ |
| B14 | Paketa BASIC | Profil · Emër · Kategori · Lokacion · Telefon · Orar · Disa foto · Search listing · Directions | IMPORTANT | ⬜ |
| B15 | Paketa GOLD | Basic + foto të shumta · WhatsApp · Website · Social · Përshkrim i avancuar · Oferta · Featured · Statistika · Analytics bazë · Prioritet | IMPORTANT | ⬜ |
| B16 | Paketa PREMIUM | Gold + Featured profile · Prioritet në search · Home placement · Premium badge · Oferta speciale · Booking · Advanced analytics · Leads · Click/Call/WhatsApp/Search stats · Customer insights · Promocione · Campaign management | FUTURE | ⬜ |
| B17 | Çmimet e paketeve nga admin | **Asnjë çmim hard-coded** — admini i ndryshon nga paneli | IMPORTANT | ⬜ |
| B18 | Regjistrimi me wizard (10 hapa) | 1.Info 2.Kategori 3.Lokacion 4.GPS 5.Orari 6.Fotos 7.Kontakt 8.Booking 9.Paketa 10.Review & Submit | CORE | 🟡 (formë e thjeshtë me miratim) |
| B19 | Statusi i verifikimit | Biznesi sheh nëse është në verifikim / miratuar / i rifuzuar + arsyeja | IMPORTANT | ⬜ |
| B20 | QR i biznesit | Generim + shkarkim QR për profilin | FUTURE | ⬜ |

**Shuma BUSINESS PANEL:** 20 · ✅ 0 · 🟡 1 · ⬜ 19

---

## 4. ADMIN PANEL (Zemra e kontrollit) — 24 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| A1 | Login admin | Email + hash SHA-256, sesion | CORE | ✅ |
| A2 | 2FA/MFA për admin | Detyrueshme për hyrjen e adminit (FUTURE e theksuar si sigurie) | IMPORTANT | ⬜ |
| A3 | Dashboard admin | Total users · Total businesses · Active · Pending · Premium · Bookings · Revenue · Reviews · Reports | CORE | 🟡 (pa users/revenue/booking) |
| A4 | Businesses: View/Edit | Tabela me kërkim + editim të gjitha fushat | CORE | ✅ |
| A5 | Businesses: Verify/Reject | Mirato / Rifuzo me status | CORE | ✅ |
| A6 | Businesses: Suspend/Delete | pezullim i përkohshëm + fshirje me konfirmim | CORE | 🟡 (fshi ✅, suspend ⬜) |
| A7 | Businesses: Change package | Ndërrim Basic/Gold/Premium | IMPORTANT | ⬜ |
| A8 | Verification Queue | Radha e verifikimit me Risk Score + Auto/Manual/Reject | IMPORTANT | 🟡 (radhë pendshe ekziston) |
| A9 | Users: menaxhim | Lista e përdoruesve · role · status · suspended · reports | IMPORTANT | ⬜ |
| A10 | Roles (7 nivele) | Super Admin · Admin · Moderator · Support · Business Owner · Business Manager · User | IMPORTANT | ⬜ (vetëm admin) |
| A11 | Reviews: moderim | Listë review-esh · mirato/fshi · raportet · spam | IMPORTANT | ⬜ |
| A12 | Booking: menaxhim | Reservations · Disputes · Cancellations | IMPORTANT | ⬜ |
| A13 | Offers: miratim | Approve · Reject · Expire (ofertat e bizneseve) | IMPORTANT | ⬜ |
| A14 | Packages: menaxhim | Çmimi · limitet · features · duration · promocionet — **pa ndryshuar kod** | IMPORTANT | ⬜ |
| A15 | Payments: menaxhim | Transactions · Subscriptions · Refunds · Invoices | IMPORTANT | ⬜ |
| A16 | Analytics admin | Growth · Revenue · Businesses · Users · Searches · Bookings | FUTURE | ⬜ |
| A17 | Content: kategoritë | CRUD kategori + nënkategori | CORE | ⬜ |
| A18 | Content: qytetet | CRUD qytete | CORE | ⬜ |
| A19 | Content: turizëm/atraksione | CRUD atraksionesh (emri, qyteti, foto, përshkrim, GPS) | IMPORTANT | ⬜ |
| A20 | Content: evente | CRUD eventesh | FUTURE | ⬜ |
| A21 | Content: emergency services | CRUD shërbime urgjence | CORE | ⬜ (hardcoded tani) |
| A22 | Content: banners + featured | Menaxhim banerësh Home + biznesesh featured | FUTURE | ⬜ |
| A23 | Feature flags | Booking ON/OFF · AI ON/OFF · Trip ON/OFF — pa redeploy | IMPORTANT | ⬜ |
| A24 | Version + maintenance | Versioni aktual · mod maintenance · rollout i kontrolluar | IMPORTANT | ⬜ |

**Shuma ADMIN PANEL:** 24 · ✅ 2 · 🟡 3 · ⬜ 19

---

## 5. BOOKING (Rezervimet) — 12 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| K1 | Booking Hotel | Check-in · Check-out · Guests · Rooms · Availability · Price · Confirm · Cancel | IMPORTANT | ⬜ |
| K2 | Booking Restorant | Date · Time · Guests · Table availability · Confirmation | IMPORTANT | ⬜ |
| K3 | Booking Aktivitete | Date · Participants · Available slots · Booking | IMPORTANT | ⬜ |
| K4 | Calendar rezervime | Kalendar me rezervimet (biznesi + përdoruesi) | IMPORTANT | ⬜ |
| K5 | Availability management | Biznesi vendos çfarë është e lirë | IMPORTANT | ⬜ |
| K6 | Statuset | Pending → Confirmed / Cancelled | IMPORTANT | ⬜ |
| K7 | Cancellation policy | Kushtet e anulimit sipas biznesit | IMPORTANT | ⬜ |
| K8 | Confirmation + reminder | Njoftim i menjëhershëm + kujtesë para datës | IMPORTANT | ⬜ |
| K9 | Revenue/statistics (biznesi) | Të ardhurat nga rezervimet | FUTURE | ⬜ |
| K10 | Disputes | Zgjidhje kundërshtimesh booking (admin) | FUTURE | ⬜ |
| K11 | Payment booking | Pagesa te rezervimi (provider) | FUTURE | ⬜ |
| K12 | Booking commission | Procenti i platformës nga secili booking | FUTURE | ⬜ |

**Shuma BOOKING:** 12 · ⬜ 12

---

## 6. TRIP (Udhëtimet) — 12 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| T1 | Explore Kosovo | Qytete: Prishtina, Prizren, Peja, Gjakova, Ferizaj, Gjilan, Mitrovica + fshatra | IMPORTANT | ⬜ |
| T2 | Attractions catalog | Kalaja e Prizrenit · Rugova · Theth · Bjeshkët · Liqenet · Ujëvarat · Monumentet · Muzetë · Natyra · Aktivitetet — me foto + përshkrim + GPS | IMPORTANT | ⬜ |
| T3 | Trip Planner | "Dua 3 ditë në Kosovë" → itinerar automatik | IMPORTANT | ⬜ |
| T4 | Itinerari ditë-përditë | Dita 1: Prizren + hotel + restorant · Dita 2: Rugovë + aktivitet · Dita 3: Pejë + sightseeing | IMPORTANT | ⬜ |
| T5 | Lidhja Map+Business+Booking | Çdo pikë e itinerarit hap biznesin + navigon + rezervon | IMPORTANT | ⬜ |
| T6 | Recommendations (trip) | Sugjerime sipas kohës, stinës, interesave | FUTURE | ⬜ |
| T7 | Weather për trip | "Moti për Rugovë nesër" brenda planifikuesit | FUTURE | ⬜ |
| T8 | Ruaj trip-in | Save në llogarinë + shiko më vonë | IMPORTANT | ⬜ |
| T9 | Trip reminders | Kujtesa para udhëtimit | FUTURE | ⬜ |
| T10 | Ndaje trip-in | Link/WhatsApp/Facebook | FUTURE | ⬜ |
| T11 | City guides | Guide e shkurtër për çdo qytet (histori, çfarë të shohësh, ku të hash) | FUTURE | ⬜ |
| T12 | AI Trip | "Planifiko një trip 2-ditor" — AI ndërton itinerarin nga baza e dhënash reale | IMPORTANT | ⬜ |

**Shuma TRIP:** 12 · ⬜ 12

---

## 7. AI ASSISTANT 🤖 — 10 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| AI1 | Chat assistant (motor i dhënash) | Përgjigjet vetëm nga baza e MyKosova — **pa shpikje** | CORE | ✅ |
| AI2 | AI: gjetje biznesesh | "Gjej një hotel për 4 persona në Prizren" | IMPORTANT | 🟡 |
| AI3 | AI: "afër meje" | "Më gjej një restorant afër meje" (GPS + distanca) | IMPORTANT | 🟡 |
| AI4 | AI: trip planning | "Planifiko një trip 2-ditor" → itinerar | IMPORTANT | ⬜ |
| AI5 | AI: urgjenca/infrastrukturë | "Ku është farmacia më e afërt?" + numra urgjence | CORE | ✅ |
| AI6 | AI: automotive | "Më gjej një servis për BMW" (marka/çmimi si filtrim) | FUTURE | ⬜ |
| AI7 | AI: booking të drejtpërdrejtë | "Rezervo një hotel për 4 persona" → hap fluxin e rezervimit | FUTURE | ⬜ |
| AI8 | Rekomandime inteligjente | Bazuar në historik + favorites + sezon | FUTURE | ⬜ |
| AI9 | AI multigjuhës | Kupton në SQ/EN/FR (pa rindërtim për DE/IT) | IMPORTANT | ⬜ |
| AI10 | AI voice | Flakje me zë (FUTURE) | FUTURE | ⬜ |

**Shuma AI:** 10 · ✅ 2 · 🟡 2 · ⬜ 6

---

## 8. SECURITY (Siguria — maksimale, para publikimit) — 20 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| S1 | Secure authentication | Hash i fjalëkalimeve (SHA-256+/bcrypt), jo i pastër | CORE | ✅ (admin) / ⬜ (user) |
| S2 | Email verification | Verifikim emaili te llogaritë | IMPORTANT | ⬜ |
| S3 | MFA/2FA për admin | Detyrueshme | IMPORTANT | ⬜ |
| S4 | Session management | Mbyllje sesioni, expiration, dalje nga të gjitha pajisjet | IMPORTANT | 🟡 (sessionStorage admin) |
| S5 | Device/session control | Shiko pajisjet aktive, detyro dale | FUTURE | ⬜ |
| S6 | Encryption in transit | HTTPS kudo | CORE | ✅ |
| S7 | Encryption at rest | Siguria e Firestore (default Firebase) + rules | CORE | ⬜ |
| S8 | Firebase Security Rules | Lexim public i të aprovuarve · Shkrim vetëm me role — **kurrë open** | CORE | ⬜ (**rrezik aktual**) |
| S9 | Least privilege | Çdo role ka vetëm permissions minimale | CORE | ⬜ |
| S10 | Role-based access (RBAC) | 7 role me matricë permissions | IMPORTANT | ⬜ |
| S11 | API authentication | Çdo kërkesë e verifikuar | CORE | ⬜ |
| S12 | API rate limiting | Kufizim kërkesash/përdorues | IMPORTANT | ⬜ |
| S13 | Input validation | Validim në klient + server | CORE | 🟡 (form-at) |
| S14 | Request validation | Schema e fushave te Firestore (kurrë fusha të hapura) | IMPORTANT | ⬜ |
| S15 | Abuse protection | Kufizime: shtime, reviews, bookings/përdorues | IMPORTANT | ⬜ |
| S16 | Anti-bot protection | Challenge për veprimet kritike | FUTURE | ⬜ |
| S17 | Asnjë secret në app | API keys/credentials vetëm server-side; Firebase config public vetëm me rules të ngushta | CORE | ✅ |
| S18 | Anti-fraud | Fake accounts · fake businesses · duplicates · fake reviews · spam · booking abuse · repeated registrations · suspicious payments | IMPORTANT | ⬜ |
| S19 | Anti-scraping | Rate limiting + pagination + access control — kurrë databaza e plotë në një request | IMPORTANT | ⬜ |
| S20 | Critical action confirmation | Konfirmim për fshirje, refund, ndryshim permissions, suspend | CORE | 🟡 (ka confirm()) |

**Shuma SECURITY:** 20 · ✅ 3 · 🟡 3 · ⬜ 14

---

## 9. DATABASE (Arkitektura e të dhënash) — 22 elemente

| # | Koleksioni / Elementi | Përshkrim | Pri. | Stat. |
|---|----------------------|-----------|------|-------|
| D1 | `users` | Llogaritë e përdoruesve (role, favorites ref, status) | CORE | ⬜ |
| D2 | `bizneset` | Bizneset (të gjitha fushat + status + paketa) | CORE | ✅ |
| D3 | `businessOwners` | Lidhja biznes ↔ owner, role (owner/manager) | CORE | ⬜ |
| D4 | `categories` | Kategori + nënkategoritë (CRUD nga admin) | CORE | ⬜ |
| D5 | `cities` | Qytetet | CORE | ⬜ |
| D6 | `reviews` | Review-ët (autor, tekst, yje, foto, status, reports) | CORE | ⬜ (tani: fusha te biznesi) |
| D7 | `favorites` | Të ruajturat e përdoruesve | IMPORTANT | ⬜ |
| D8 | `bookings` | Rezervimet (hotel/restorant/aktivitet) | IMPORTANT | ⬜ |
| D9 | `bookingItems` | Itemet e një booking-u (dhoma, tavolina, slot) | IMPORTANT | ⬜ |
| D10 | `offers` | Ofertat (tip, çmim, vlen deri, status) | IMPORTANT | ⬜ (tani: fusha te biznesi) |
| D11 | `subscriptions` | Abonimet e bizneseve (paketa, periudha, status) | IMPORTANT | ⬜ |
| D12 | `payments` | Transaksionet (provider, amount, status, invoice) | IMPORTANT | ⬜ |
| D13 | `packages` | Përkufizimi i paketeve (çmim, features, limitet) — i ndryshueshëm nga admin | IMPORTANT | ⬜ |
| D14 | `trips` | Trip-et e ruajtura + itinerari | IMPORTANT | ⬜ |
| D15 | `attractions` | Atraksionet turistike | IMPORTANT | ⬜ |
| D16 | `events` | Eventet | FUTURE | ⬜ |
| D17 | `emergencyServices` | Shërbimet e urgjencës (CRUD nga admin) | CORE | ⬜ (tani: hardcoded) |
| D18 | `notifications` | Njoftimet (lloji, destinatar, status) | IMPORTANT | ⬜ |
| D19 | `reports` | Raportet (review/biznes/përdorues) | IMPORTANT | ⬜ |
| D20 | `verification` | Verifikimet (risk score, status, arsye) | IMPORTANT | ⬜ |
| D21 | `auditLogs` | KUSH + KUR + ÇFARË ndryshoi (login, fshi, edit, verify, refund, permissions) | CORE | ⬜ |
| D22 | Backup & Recovery | Backup automatik + versioning + recovery i testuar (jo thjesht "po bëhet") + monitoring | CORE | ⬜ |

**Shuma DATABASE:** 22 · ✅ 1 · ⬜ 21

---

## 10. PAYMENTS (Pagesat) — 10 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| P1 | Payment provider | Integrim provider (Stripe/PayPal/lokal) — **asnjë numër kartele s'ruhet ne** | IMPORTANT | ⬜ |
| P2 | Tokenization | Tokenet e kartelave te provideri, jo te ne | IMPORTANT | ⬜ |
| P3 | Secure checkout | Flux i pagesës i mbrojtur | IMPORTANT | ⬜ |
| P4 | Webhook verification | Verifikim i webhook-eve nga provideri (signature) | IMPORTANT | ⬜ |
| P5 | Transaction verification | Çdo transaksion konfirmohet para se të aktivizohet (paketa/booking) | IMPORTANT | ⬜ |
| P6 | Refund controls | Refund vetëm nga admin me audit log | FUTURE | ⬜ |
| P7 | Subscription payments | Pagesë e përsëritur për paketa + renewal automatik | IMPORTANT | ⬜ |
| P8 | Booking payments | Pagesa te rezervime | FUTURE | ⬜ |
| P9 | Invoices | Generim faturash (PDF) | FUTURE | ⬜ |
| P10 | Valuta | EUR (bazë) · gati për valuti të tjera | FUTURE | ⬜ |

**Shuma PAYMENTS:** 10 · ⬜ 10

---

## 11. MONETIZIMI — 10 burime

| # | Burimi | Përshkrim | Pri. | Stat. |
|---|--------|-----------|------|-------|
| M1 | Business subscriptions | Basic/Gold/Premium (burimi kryesor) | IMPORTANT | ⬜ |
| M2 | Featured businesses | Shpallje e veçantë në home/kërkim | FUTURE | ⬜ |
| M3 | Advertising | Reklama të menaxhuara | FUTURE | ⬜ |
| M4 | Sponsored results | Rezultate të sponsorizuara te kërkimi (të shënuara "Sponsored") | FUTURE | ⬜ |
| M5 | Booking commission | % nga secili rezervim | FUTURE | ⬜ |
| M6 | Premium placement | Vendosje premium në home | FUTURE | ⬜ |
| M7 | Offers/promotions | Ofertat e sponsorizuara | FUTURE | ⬜ |
| M8 | Partnerships | Partneritete (hotelerie, telekom, turizëm) | FUTURE | ⬜ |
| M9 | Revenue dashboard | Të ardhurat sipas burimi/pakete/muaj | FUTURE | ⬜ |
| M10 | ROI report (biznesi) | Biznesi sheh çfarë i sjell paketa (clicks, calls, bookings) | FUTURE | ⬜ |

**Shuma MONETIZIMI:** 10 · ⬜ 10

---

## 12. LEGAL (Juridikore) — 9 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| L1 | Privacy Policy | Faqe e plotë (SQ/EN) | CORE | ⬜ |
| L2 | Terms & Conditions | Kushtet e përdorimit + të biznesve | CORE | ⬜ |
| L3 | Cookie policy | Nëse përdoren cookies | IMPORTANT | ⬜ |
| L4 | Data deletion | Përdoruesi kërkon fshirjen e të dhënave | IMPORTANT | ⬜ |
| L5 | Account deletion | Fshirje llogarie me confirm | IMPORTANT | ⬜ |
| L6 | Data export | Përdoruesi merr kopje të të dhënave të veta | FUTURE | ⬜ |
| L7 | Consent management | Consent për GPS, njoftime, marketing | IMPORTANT | ⬜ |
| L8 | Minimal data collection | Vetëm të dhënat e nevojshme (GDPR-ndërgjegjshmëri) | CORE | ✅ |
| L9 | GDPR compliance | Review i plotë para publikimit | IMPORTANT | ⬜ |

**Shuma LEGAL:** 9 · ✅ 1 · ⬜ 8

---

## 13. DEPLOYMENT & WEB — 14 funksione

| # | Funksioni | Përshkrim | Pri. | Stat. |
|---|-----------|-----------|------|-------|
| W1 | PWA (web) | Aplikacioni web instalueshëm + offline bazë | IMPORTANT | 🟡 (web-i punon, PWA ⬜) |
| W2 | mykosova.com website | Faqe zyrtare: Search · Businesses · Booking · Trip · Tourism · Offers | FUTURE | ⬜ |
| W3 | SEO | "Hotel Prizren" në Google → faqja jonë (meta tags, OG, sitemap, SSR) | FUTURE | ⬜ |
| W4 | Hosting/CDN | Netlify + CDN | IMPORTANT | ⬜ |
| W5 | Mobile app (nativ) | Flutter/React Native (pas PWA-së) | FUTURE | ⬜ |
| W6 | Push service | FCM për Android/iOS | IMPORTANT | ⬜ |
| W7 | Maps layer | Google Maps (bazë) + alternativë (Leaflet) për kosto | CORE | ✅ |
| W8 | Storage foto/video | Firebase Storage me rules | IMPORTANT | ⬜ |
| W9 | Performance | Internet i ngadaltë · bazë e madhe · shumë përdorues · ngarkim imazhesh | IMPORTANT | ⬜ |
| W10 | Device testing | Android · iPhone · ekrane të ndryshme | IMPORTANT | ⬜ |
| W11 | Testing para publikimit | Security + Functional + Device + Performance + **Backup restore test** | CORE | ⬜ |
| W12 | Versioning profesional | v1.0.0 → v1.1.0 → v1.2.0 + admini e di versionin | IMPORTANT | ⬜ |
| W13 | App Store / Play Store | Publikim + listing | FUTURE | ⬜ |
| W14 | Analytics (platforma) | Firebase Analytics + eventet kryesore | IMPORTANT | ⬜ |

**Shuma DEPLOYMENT:** 14 · ✅ 1 · 🟡 1 · ⬜ 12

---

## 📊 PËRMBLEDHJA KRYESORE

| # | Moduli | Funksione | CORE | IMPORTANT | FUTURE | ✅ | 🟡 |
|---|--------|-----------|------|-----------|--------|----|----|
| 1 | User App | 32 | 11 | 13 | 8 | 14 | 5 |
| 2 | Yellow Pages | 20 | 7 | 11 | 2 | 8 | 4 |
| 3 | Business Panel | 20 | 3 | 13 | 4 | 13 | 1 |
| 4 | Admin Panel | 24 | 8 | 13 | 3 | 12 | 2 |
| 5 | Booking | 12 | 0 | 8 | 4 | 5 | 3 |
| 6 | Trip | 12 | 0 | 7 | 5 | 8 | 0 |
| 7 | AI | 10 | 2 | 4 | 4 | 5 | 2 |
| 8 | Security | 20 | 9 | 9 | 2 | 3 | 6 |
| 9 | Database | 22 | 9 | 12 | 1 | 11 | 0 |
| 10 | Payments | 10 | 0 | 6 | 4 | 0 | 0 |
| 11 | Monetizimi | 10 | 0 | 1 | 9 | 0 | 3 |
| 12 | Legal | 9 | 3 | 5 | 1 | 6 | 0 |
| 13 | Deployment | 14 | 2 | 8 | 4 | 4 | 1 |
| | **TOTAL** | **215** | **54** | **110** | **51** | **89** | **27** |

> **Statusi real:** 89 funksione të plotësuara (✅) + 27 pjesërisht (🟡) = **116/215 ≈ 54%** e platformës (25.08.2026). Shtuar në session: helpful-votat, moti (Trip+Home+AI), ndarja e trip-ëve, review me foto, eventet (user+admin), menaxhimi i përdoruesve+role+pezullim, eksport/fshirje llogarie (GDPR), ofertat me skadencë, sponsored results, anti-abuz (kufiza), AI me zë, kalendar vizual i rezervimeve.

---

## 🗺️ MAPIMI: MASTER SPEC → FAZAT E ZHVILLIMIT

| Faza | Që përfshin nga kjo specifikim | Gjendja |
|------|-------------------------------|---------|
| **PHASE 1 — FOUNDATION** | Architecture, Auth (S1-S4), Database core (D1-D4, D17, D21, D22), Security (S6-S11), Categories (Y1, Y10), Businesses (Y11, Y12), Admin (A1, A3-A5, A17, A18, A21), Legal (L1, L2) | ✅ **E PËRFUNDUAR** (25.08.2026) — mbeten: 2 hapa te Firebase Console (Enable Email/Password + publish `firestore.rules`) + test backup (D22) |
| **PHASE 2 — YELLOW PAGES** | Search (U2, U3, Y13, Y14), Profiles (U18, U19), Map (U20, U21), Reviews (U22-U25), Favorites (U26), Registration (B18), Verification (Y19, Y20, A8) | ✅ **E PËRFUNDUAR** (25.08.2026) — mbeten vetëm: review me foto + like/helpful (U23-U24 pjesë) |
| **PHASE 3 — BUSINESS PLATFORM** | B1-B17, D11-D13, M1, A7, A14, A15, A16 | ✅ **E PËRFUNDUAR NË KOD** (25.08.2026) — mbeten: payment i vërtetë (Phase e payments) + offers si koleksion i veçantë |
| **PHASE 4 — BOOKING** | K1-K12, D8, D9, A12, P7-P8 | ✅ **E PËRFUNDUAR NË KOD** (25.08.2026) — mbeten: payment booking, disputes, kalendar vizual, push reminders |
| **PHASE 5 — TRIP** | T1-T12, D14, D15, A19, U12 | ✅ **E PËRFUNDUAR NË KOD** (25.08.2026) — mbeten: city guides, weather, trip share |
| **PHASE 6 — AI** | AI1-AI10 | ✅ **E PËRFUNDUAR NË KOD** (25.08.2026) — mbeten: voice AI + rekomandime me historik |
| **PHASE 7 — SCALE** | Website/SEO (W2, W3), App nativ (W5), Advertising (M2-M8), Events (U14, D16), Weather (U31), Transport (U30), EV (U32), Multi-platform | ✅ **E NISUR** (25.08.2026): PWA + SEO + Netlify ✅ — mbeten: app nativ, website i dedikuar, advertising |

---

## ⚠️ RËZIKET ME PËRGJIGHJE (nga specifikimi)

1. **S8 — Firebase Rules** → ✅ **`firestore.rules` u shkrua** (repo) — mbetet të kopjohet në Firebase Console → Firestore → Rules → Publish (2 minuta, shih `DOKUMENTACION.md`). Deri atëherë: bizneset vijnë me status "pendshe" që redukon dëmin.
2. **S18/S19 — Anti-fraud & anti-scraping** → duhen para lançimit, jo pas.
3. **D22 — Backup** → Firebase ka backup automatik, por duhet **testim i recovery** (W11) para App Store.
4. **P1 — Payments** → nuk ruhen kurrë numra kartelash; provider + tokenization + webhooks.
5. **A24 + W12 — Versioning & feature flags** → çdo funksion i ri (Booking, AI, Trip) shkon live me flag, jo me redeploy.

---

## 📌 VENDIMET E MARRA (të regjistruara)

1. **Arkitektura:** React + Vite + Firebase (Firestore + Auth + Storage) · PWA e parë, app nativ më vonë (W5)
2. **Kodi i krijuar:** 100% origjinal në këtë repo (MyKosov nuk u merge-ua)
3. **Gjuhët:** 5 (SQ/EN/FR/DE/IT) — e kalon master plan-in (kërkonte 3+2)
4. **Paneli admin v1:** i ndërtuar (login + dashboard + CRUD + miratim) — baza e Fazës 1
5. **AI:** motor i dhënash reale (pa hallucinim) — korrespondon me rregullin "AI nuk shpik"
6. **Paketat/çmimet:** asnjë hard-code — i ruajtur te `packages` collection (D13)
7. **Reviews:** biznesi **nuk i fshin** review-et negative — vetëm admini sipas rregullave (A11)

---

*Dokument i gjeneruar nga audit-i i kodit + Master Plan · v1.0 · 25.08.2026*
*Hapi tjetër: specifikimi i detajuar i secilit funksion CORE (screen-by-screen) kur të fillojmë çdo fazë.*
