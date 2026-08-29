# 💳 ANALIZA E PAGESAVE — MyKosova (S2)

> Version 1.0 · 26.08.2026 · Statusi: **analizë** (pa kod — në pritje të vendimeve)
> Shqyrton: provider për Kosovën · checkout · verifikim server-side · webhook · subscriptions · renewal · cancel · refund · expiration · anti-fraud/duplicate · struktura Cloud Functions

---

## 1. FAKTET E VERIFIKUARA (kush e ka bërë kërkim)

| Fakti | Burimi |
|---|---|
| **Stripe s'pranon tregtarë të regjistruar në Kosovë** (deri 2026; ~46 shtete të mbështetura, XK s'është) | ruleandlaw.com (27.06.2026) + raporte përdoruesish (Reddit r/kosovo) |
| **PayPal s'pranon tregtarë nga Kosova** | ruleandlaw.com (2026) + përvojë përdoruesish |
| Kosova **s'është në SEPA** (EUR lëviz vetëm SWIFT/korespondent) | ruleandlaw.com (2026) |
| **Paddle / Lemon Squeezy (Merchant of Record) funksionojnë pavarësisht vendit të biznesit** — marrin dhe tatat | ruleandlaw.com (2026) |
| Opsionet lokale: **Nestpay (TEB Bank)**, **UPCNIH/Raiffeisen**, **Procredit**, **Paysera Kosova** (gateway), **IBAS** | Reddit r/kosovo (2022–2025) |
| Mollie / 2Checkout e kanë refuzuar regjistrimin XK | Reddit r/kosovo (2022) |
| Payoneer: pranon EUR/USD/GBP te llogari XK, por **s'është checkout** (s'ka subscriptions/hosted checkout) | ruleandlaw.com (2026) |

**Përfundimi kyç:** Rekomandimi i mëparshëm "Stripe direkt" **nuk vlen** për biznes të regjistruar në Kosovë. Opsionet reale janë 3 (poshtë).

---

## 2. TRE OPSIONET REALE

### A. 🔵 PADDLE (Merchant of Record) — **REKOMANDIMI PËR V1**

Paddle bëhet tregtar zyrtar: klienti i blen Paddle-it, Paddle të paguan ty (net), dhe Paddle merr përsipër **të gjitha tatat** (VAT 18% XK, EU OSS, US sales tax, globale).

| Aspekti | Vlerësimi |
|---|---|
| Përfitueshmëri për XK | ✅ Regjistrohesh me biznes XK (SHPK) ose si individ — s'duhet entitet i huaj |
| Subscriptions | ✅ Billetimi nativ: retry, dunning, grace period, customer portal, webhooks |
| Tatat | ✅ **E zgjidhur** (MoR mbledh/remiton gjithçka — zero kompjance për ty) |
| Checkout | ✅ Hosted (s'prekësh kartelat — PCI SAQ-A) |
| Payout | ✅ SWIFT te IBAN XK (EUR) ose Payoneer |
| API | ✅ REST + SDK Node, webhook me signature |
| Kostoja | ⚠️ ~**5% + 50¢**/transaksion (më e lartë se Stripe 2.9%+30¢) — pranueshme në v1 (te 29€/m: ~1.95€/m provizion) |
| Koha deri live | ✅ **2–5 ditë** (regjistrim + test mode + live) |

### B. 🟡 STRIPE — me entitet EU/US (opsion shkallëzimi)

Stripe vetëm nëse formon entitet (p.sh. LLC SHBA ose GmbH/Zoek EU) dhe hap llogari Stripe aty.

| Aspekti | Vlerësimi |
|---|---|
| Kostoja | ✅ **2.9% + 30¢** (më e ulëta) |
| API/ekosistemi | ✅ I mëti (Radar, Billing, Portal, Tax) |
| Tatat | ⚠️ **Të vetmet** (VAT XK + EU OSS + US sales tax) — duhet Stripe Tax ose kontabilist |
| Struktura | ⚠️ Entitet i huaj (kosto vjetore formimi/mbajtje, shenjat e transfer-pricing) |
| Koha | ⚠️ **4–8 javë** (formimi + aprovimi Stripe + banka) |

**Kur të ketë kuptim:** pas ~50–100 subscriptionesh aktiva (provizionet e kursuara mbipërmbushin koston e entitetit).

### C. 🟢 GATEWAY LOKAL — Nestpay (TEB) / Paysera Kosova

Llogari merchant te banka lokale + API për pagesa karta.

| Aspekti | Vlerësimi |
|---|---|
| Kostoja | ✅ ~1.5–2.5% (më e ulëta lokale) |
| Tatat | ⚠️ Të vetmet (VAT 18% — duhet regjistrim/të dhënë) |
| Subscriptions | ⚠️ **Shumica nuk i mbështetin nativisht** — do të ndërtosh vetë: tokenizim kartele + ngarkesa periodike + retry/dunning vetë (më shumë kod + rrezik) |
| Koha | ⚠️ **2–6 javë** (aplikim te banka, dokumentacion, integrim API i çdo PSP) |
| Bonus lokal | ✅ Mundësisht më shumë pranim kartelash lokale + besim tregtari lokal |

**Kur të ketë kuptim:** kur klienti kryesor bëhet tregtari lokal i Kosovës dhe kërkon pagesë karte lokale me kosto minimale — si faza e dytë, jo v1.

### Përmbledhje vendimesh

| | Kosto | Tatat | Koha deri live | Subscriptions nativ | Rreziku |
|---|---|---|---|---|---|
| **A. Paddle (MoR)** | 5%+50¢ | ✅ i zgjidhur | **2–5 ditë** | ✅ | i ulët |
| B. Stripe (entitet EU/US) | 2.9%+30¢ | ⚠️ të vetmet | 4–8 javë | ✅ | mesatar (strukturë) |
| C. Lokal (Nestpay/Paysera) | 1.5–2.5% | ⚠️ të vetmet | 2–6 javë | ⚠ë të ndërtuara vetë | mesatar (integrim) |

**REKOMANDIMI: A (Paddle) për v1** → arkitektura e Cloud Functions është **provider-agnostike** (adapter layer, shih §5) → kërcimi te B ose C më vonë prek **1 skedar**.

---

## 3. SHTOJCA E KOSOVËS (pavarësisht provider-it)

- **Monedha:** EUR (nënkuptim i natyrshëm — XK përdor Euro; të gjitha çmimet 0/29/59€)
- **VAT 18%:**
  - Me **Paddle (MoR)**: Paddle e mban — **zero punë** (që është pikërisht arsyeja kryesore e rekomandimit)
  - Me Stripe/lokal: duhet regjistrim tatimor (pragje regjistrimi për shërbime: 30.000€/vite — **konfirmohet me kontabilist**); shitje te EU = OSS/reverse-charge; te SHBA = sales tax sipas shteteve
- **Entiteti:** Paddle kërkon biznes të regjistruar ose punëtor të pavarur (të dyja lejohen tek shumica e vendeve — **pyetje hapur**, shih §7)
- **Banka për payout:** IBAN XK (EUR) me SWIFT, ose Payoneer (rekomandohet si alternativë më e shpejtë)
- **Kartelat e klientëve:** Visa/Mastercard (përfshirë ato të emetuara në XK) — të pranueshme te të tre opsionet

---

## 4. ARCHITEKTURA E FLUSIT (provider-agnostike)

```
PËRDORUESI (Business Panel)
  │ 1. zgjedh paketen (Basic/Gold/Premium)
  ▼
[Callable Function: nisPagesën]
  │ • verifikon rolin SERVER-SIDE (përdoruesit/{uid}.roli + biznesi.uidPronari)
  │ • kontrollon: s'ka subscription aktiv tjetër për këtë biznes (anti-duplicate)
  │ • krijon Checkout Session tek provider-i (Paddle/Stripe) me metadata:
  │     { biznesiId, biznesiEmri, uidPronari, paketa, priceId }
  │ 2. kthen URL → browser-i i përdoruesit hap faqen e pagesës së provider-it
  ▼
PROVIDERI (faqja e pagesës — PCI te ta, jo te ne)
  │ • klienti paguan
  │ 3. provider-i dërgon WEBHOOK (event) te [HTTPS Function: apiWebhook]
  ▼
[HTTPS Function: apiWebhook]
  │ • VERIFIKON SIGNATURE-në e event-it (secreti i provider-it — vetëm server-side)
  │ • IDEMPOTENCE: shkruan webhookEvents/{eventId} me transaction
  │     (nëse event-i erdhi dy herë → i dyti refuzohet → anti-aktivizim-dyfish)
  │ • router: purchase.created | subscription.updated | payment_failed |
  │           subscription.deleted | refund.created
  ▼
[billing.js — makina e gjendjes] (vetëm kjo funksion prekë Firestore)
  │ • purchases → subscriptions/{id} = active + biznesi.paketa = X
  │ • payment_failed (pas retry-ve) → overdue → (grace) → canceled + paketa = basic
  │ • canceled_at_period_end → expiring → canceled në fund të periodit
  │ • refund → canceled + audit
  ▼
FIRESTORE (rules v2.0: klienti S'MUND të shkruajë subscriptions/payments — vetëm Functions me Admin SDK)
  ▼
APP (live): biznesi merr rolin/paketën; Business Panel-i tregon statusin; Audit Log regjistron gjithçka
```

### Çka mban çdo anë (parimi i artë: **asgjë sekrete klient-side**)

| Të dhëna | Ku jetojnë | Pse |
|---|---|---|
| Provider secret key + webhook secret | **Cloud Functions** (secrets) | kurrë te browser |
| Publishable/API key e publikë | mund të jetë te browser (standard) | nuk mban akses shkrimi |
| Kartelat | **vetëm te provider-i** (PCI SAQ-A) | ne s'i shohim asnjëherë |
| Statusi i subscription | Firestore (`subscriptions`) | i shkruar vetëm nga Functions |
| Paketa e aktivizuar | `bizneset/{id}.paketa` | e lexon app-i publikisht (s'është e sensitivë) |

---

## 5. STRUKTURA E CLOUD FUNCTIONS

```
functions/
├── .env.example              (emrat e secrets — vlerat kurrë në repo)
├── package.json              (firebase-functions v2, stripe/paddle SDK, firebase-admin)
├── index.js                  (eksportet publike)
└── src/
    ├── config.js             (lë leximin e secrets: PROVIDER=paddle|stripe, etj.)
    ├── providers/
    │   ├── index.js          (fletë-kim: merr adapterin sipas PROVIDER)
    │   ├── paddle.js         (adapter: krijonCheckout, verifikonWebhook, portal, refund)
    │   └── stripe.js         (adapter i rezervuar — implementohet te opsioni B)
    ├── webhook.js            (apiWebhook: signature + idempotency + router)
    ├── subscriptions.js      (callables: nisPagesën, hapPortalin, anulo)
    ├── billing.js            (makina e gjendjes — e vetmja që shkruan subscriptions/paketa)
    ├── audit.js              (regjiston në auditLogs: aktivizim, refund, dështim)
    └── stats.js              (BONUS: counter shikime/klik* atomic — zgjidh S1-Remaining)
```

### Funksionet (8)

| Functioni | Lloji | Çka bën | Security |
|---|---|---|---|
| `apiWebhook` | HTTPS | merr event-in e provider-it → verifikon signature → idempotency → router → `billing.js` | secret + signature (vetëm provider-i arrin) |
| `nisPagesën` | Callable | krijon checkout (1 biznes = 1 checkout aktiv) | rol: pronari i atij biznesit (server-side) |
| `hapPortalin` | Callable | URL-ja e Customer Portal (renewal/cancel/ndërrim kartele nga biznesi) | pronari |
| `anuloSubscription` | Callable | cancel me fund periodit (ose menjëherë) | pronari ose admin |
| `refundimi` | Callable | refund te provider + `canceled` + audit | **vetëm admin** |
| `riperditStatistikat` | Callable | increment atomic shikime/klikTelefoni/klikWhatsApp/klikNavigo | pronari (zgjidh S1-Remaining #6) |
| `riperditOfertat` | Scheduled (1 ditë) | pastron/ofron skadimin e ofertave (`vlenDeri < sot`) | server |
| `kontrolloDunning` | Scheduled (1 ditë) | statuset `overdue` → grace → `canceled` + njoftim | server |

### Modeli i të dhënash (Firestore — përputhet me rules v2.0)

```js
// subscriptions/{id}  (i shkruan VETËM Functions — rules: write false nga klienti ✅)
{
  biznesiId, biznesiEmri, uidPronari,
  provider: 'paddle',                    // provider-i (ndërshkembueshmëri e lehtë)
  providerCustomerId, providerSubscriptionId,
  paketa: 'gold',                        // basic | gold | premium
  status: 'active',                      // pending|active|overdue|expiring|canceled
  fillimi, fundit, autoRenew: true,
  koha
}

// payments/{id}  (historia e pagesave — për admin + audit)
{
  subscriptionId, biznesiId, uidPronari,
  providerEventId, providerTransactionId,
  shuma: 2900, monedha: 'EUR',           // cent
  lloji: 'fillim|rinovim|refund',
  status: 'e-paguar|e-deshtuar|e-refuzuar',
  koha
}

// webhookEvents/{eventId}  (idempotency — anti double-delivery)
{ marrurM, trajtuar: true }

// bizneset/{id} (fusha të reja — të shkruara vetëm nga Functions)
{ paketa: 'gold', paketaAktiveDeriM: '2026-09-26', status: 'aprovar' /* i pandryshuar */ }
```

---

## 6. SIGURIA — ANTI-FRAUD / ANTI-DUPLICATE (pikët e planit tënd origjinal)

| Rreziku | Mbrojtja |
|---|---|
| **Duplicate payments/aktivizime** (webhook dyfish) | `webhookEvents/{eventId}` me **transaction** (i pari fiton, i dyti refuzohet) + 1 subscription aktiv/biznes (kontroll para checkout-it) |
| **Fake webhook** (ndonkush POST-on event "i paguar") | **Verifikim signature** me secretin e provider-it — event pa signature të vlefshme = refuzohet 100% |
| **Falsifikim përdoruesi** (biznesi A blen për biznesin B) | `metadata` lidh biznesiId+uidPronari; callable verifikon pronësinë **server-side** nga `përdoruesit/{uid}` (jo nga claims klienti) |
| **Pryshje klienti** (browser ndryshon paketa/çmim) | Çmimi vjen **vetëm nga provider-i** (priceId server-side); rules v2.0: klienti s'prek `paketa`/`subscriptions`/`payments` (verifikuar te S1 ✅) |
| **Fraud i kartelave** | Test mode fillimisht; Radar/Paddle fraud tools; kartela test: `4242 4242 4242 4242` (sukses), `4000 0000 0000 0002` (dështim), `4000 0000 0000 9995` (Radar test) |
| **Secrete te frontend-i** | Zero — vetëm publishable key (pa akses shkrimi); secrets te Functions |
| **Kthim pasiv** (rollback) | Çdo ndryshim në `billing.js` shkruan edhe te `auditLogs` — gjurma e plotë kush/kur/çfarë |

---

## 7. PYETJE HAPËR (vendimet e tua para se të nisë kodi)

1. **Entiteti:** A ke biznes të regjistruar (SHPK) në Kosovë, apo vejon/vepron si **punëtor i pavarur** (individual)? *(Paddle pranonte të dyja, por duhet konfirmuar te ta për XK)*
2. **Banka/payout:** Ke **IBAN XK (EUR)** te bankë, apo përdor **Payoneer/Wise** për të marrur paratë?
3. **Provider-i:** Miratojnë **Paddle (rekomandimi — 2–5 ditë, tatat të mbanë ta)** apo duam të shqyrtojmë sërish Stripe-me-entitet-EU/lokalin?
4. **Aksesi:** Kush do të ketë akses te llogaria e provider-it (vetëm ti, apo edhe unë ndërmjetëzuar vetëm me secrets në Functions)?
5. **Çmimet:** Mbeten 0/29/59€/mënyjë, apo i përditësoni tani që çmimet caktohen te provider-i?

## 8. ROADMAP I S2 (pas përgjigjeve)

| Hapi | Çka | Koha |
|---|---|---|
| S2.1 | Skeleton Functions + adapter layer + secrets + provider **test mode** | 1 session |
| S2.2 | Checkout + webhook + aktivizimi i paketës (end-to-end me kartelë test) | 1 session |
| S2.3 | Customer Portal (renewal/cancel nga biznesi) + refund (admin) | 1 session |
| S2.4 | Idempotency + dunning + monitoring/alerts + **stats counter** (S1-Remaining) | 1 session |
| S2.5 | **Live mode** + par klienti real | pas miratimit tënd |

**Testi para secilit hap:** build + test i Functions (emulator ku të mundur) + skenarët: pagesë e suksesshme, e dështuar, webhook dyfish, falsifikim roli, refund.

---

*Dokument i analizës v1.0 — pa ndryshime kodi. Hapi tjetër niset vetëm pas përgjigjeve te §7.*
