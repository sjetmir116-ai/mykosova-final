# 🚀 S2 GUIDE — DEPLOY I FUNCTIONS + SETUP PADDLE

> Ky guidi ekzekutohet **te kompjuetri yt** (sandbox-i nuk arrin Firebase/Paddle).
> Rregulli i artë: **secretet i mbash vetëm ti** — i vendos te Firebase Secrets,
> kurrë në repo, s'i shoh dot dot dot askush (as agjenti).

---

## HAPI 1 — Setup Paddle (10 minuta, te browser-i yt)

1. **Regjistrohu**: [https://vendor.paddle.com](https://vendor.paddle.com) (email + fjalëkalim — vetëm ti ke akses)
2. **Test mode ON**: te dashboard → switch "Test mode" (përderisa jemi në zhvillim)
3. **Krijo 2 produkte** (Settings → Products and pricing):
   - **Gold** — 29 € / muaj (recurring/monthly)
   - **Premium** — 59 € / muaj (recurring/monthly)
   - (Basic = 0€ — s'krijojmë produkt, paketa bazale është default)
4. **Kopjo 2 Price ID-t** (fillon me `test_` në test mode) → i mbajmë si `PADDLE_PRICE_GOLD` / `PADDLE_PRICE_PREMIUM`
5. **Gjenero API Key (Test)**: Settings → API keys → "Generate API key" (test mode) → kopjo
6. **Webhook**: Settings → Webhooks → **+ New webhook** → URL do ta vendosim pas deploy-it (Hapi 3) → pas vendosjes, **kopjo Webhook Secret**

> ⏸️ **Ndalo këtu** deri sa të kryesh Hapin 2-3 dhe të të jap URL-në e webhook.

## HAPI 2 — Firebase CLI te kompjuteri yt (15 minuta)

```bash
# 1. Instalo Firebase CLI (nëse s'e ke)
npm install -g firebase-tools

# 2. Logohu me llogarinë tëndë Google (hap browser)
firebase login

# 3. Hap repo-n
cd mykosova-final

# 4. Lidh me projektin (e ka edhe .firebaserc — kontroll: firebase projects:list)
firebase use my-kosova
```

## HAPI 3 — Deploy + Secrets (10 minuta)

```bash
# 5. Vendos secrets (do të kërkoj vlerën — ngjite atë që kopjeve te Paddle)
cd functions
npm install
cd ..
firebase functions:secrets:set PADDLE_API_KEY          # ← ngjit API key (test)
firebase functions:secrets:set PADDLE_WEBHOOK_SECRET    # ← ngjit webhook secret (pas Hapi 1.6)
firebase functions:secrets:set PADDLE_PRICE_GOLD        # ← ngjit Price ID i Gold
firebase functions:secrets:set PADDLE_PRICE_PREMIUM     # ← ngjit Price ID i Premium

# 6. Deploy (do të dërgojë functions te Firebase — 1-2 min)
firebase deploy --only functions
```

Pas deploy-it, Firebase do të të jap URL-në e function-ut `apiWebhook`:
```
https://apiv2.googleapis.com/v2/projects/my-kosova/locations/europe-west1/functions/apiWebhook-XXXXX/execute
```
**Këtë URL vendose te Paddle → Settings → Webhooks → URL** (Hapi 1.6 përfundohet).

## HAPI 4 — Verifikimi i parë (5 minuta)

1. Te Paddle → Webhooks → shtyp **"Test"** (dërgon një event test)
2. Duhet të kthehet `200 OK` (nëse 400 "s'ka secret" → kontroll Hapi 1.6 + secrets)
3. Te Firebase Console → **Functions → Logs** → duhet të shohësh "Webhook i përpunuar"

## ✅ GJENDJA PAS KËTYRE HAPEVE

- Functions live te Firebase (test mode)
- Webhook i lidhur + i verifikuar
- Price ID-t të vendosur
- **Gati për S2.2**: lidhja e Business Panel-it me `nisPagesën` + test end-to-end me kartelë test

## 🔐 SIGURIA (për t'a ditur)

| Cila vlerë | Ku jeton | Kush e shikon |
|---|---|---|
| Paddle account (login) | Paddle | **vetëm ti** |
| API key (test) | Firebase Secrets + Paddle | ti (+ Functions server-side) |
| Webhook secret | Firebase Secrets + Paddle | ti (+ Functions server-side) |
| Price ID-t | Firebase Secrets | ti (+ Functions server-side) |
| `functions/.env` | **s'ekziston** (vetëm `.env.example`) | — (s'është asnjëherë në repo) |

## ⚠️ Nëse diçka s'kalon

- `firebase deploy` dështon → dërgo log-un (më saktë rreshtin e kuq)
- Webhook 400 → 90% = secret i gabuar ose URL i paplotë
- Testi te Paddle kthen 500 → dërgo Logs te Firebase Console → Functions
