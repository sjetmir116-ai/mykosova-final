// ===== ADAPTERI PADDLE =====
// I vetmi skedar që e prek API-në e Paddle. Kërcimi te provider tjetër
// (Stripe/lokal) = zëvendësim i këtij skedari, jo i gjithë sistemi.
const crypto = require('crypto');
const { config } = require('../config');

const TOLERANCE_SEKONDA = 300; // 5 min — afati i Paddle për timestamp

// ================= VERIFIKIMI I WEBHOOK =================
// Paddle dërgon header: paddle-signature = "t=<timestamp>,v1=<hmac>"
// ku hmac = HMAC-SHA256(webhookSecret, `${t}.${rawBody}`)
function verifikoWebhook(rawBody, headerSignature) {
  try {
    const parts = {};
    String(headerSignature || '').split(',').forEach((kv) => {
      const i = kv.indexOf('=');
      if (i > 0) parts[kv.slice(0, i).trim()] = kv.slice(i + 1).trim();
    });
    const t = parts.t;
    const v1 = parts.v1;
    if (!t || !v1) return { valide: false, gabim: 'Header i paplotë (mungon t ose v1)' };
    if (!config.paddle.webhookSecret) return { valide: false, gabim: 'S\u2019ka secret i konfiguruar' };

    const diff = Math.abs(Date.now() / 1000 - Number(t));
    if (isNaN(diff) || diff > TOLERANCE_SEKONDA) return { valide: false, gabim: 'Timestamp i vjetër ose i pavlefshëm' };

    const expected = crypto
      .createHmac('sha256', config.paddle.webhookSecret)
      .update(t + '.' + rawBody)
      .digest('hex');

    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(v1, 'hex');
    if (a.length !== b.length) return { valide: false, gabim: 'Signature e pavlefshme' };
    const ok = crypto.timingSafeEqual(a, b);
    return { valide: ok, gabim: ok ? null : 'Signature s\u2019u përputh' };
  } catch (e) {
    return { valide: false, gabim: e.message };
  }
}

// ================= API CALLS =================
async function apiPaddle(path, options = {}) {
  const res = await fetch(`${config.paddle.baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.paddle.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Paddle API ${res.status}: ${data ? JSON.stringify(data).slice(0, 300) : res.statusText}`);
  }
  return data;
}

// krijonCheckout: krijon checkout me custom_data (lidh biznesiId/uidPronari/paketa)
// kthen URL-në e faqes së pagesës
async function krijonCheckout({ priceId, customData }) {
  const body = {
    items: [{ price_id: priceId, quantity: 1 }],
  };
  if (customData) body.custom_data = customData;
  if (config.paddle.testMode) body.test_mode = 1;

  const r = await apiPaddle('/checkouts/checkout', { method: 'POST', body: JSON.stringify(body) });
  const url = (r && r.data && (r.data.value || r.data.url)) || null;
  if (!url) throw new Error('Paddle s\u2019ktheu URL checkout — kontrollo priceId/test mode');
  return url;
}

// hapPortal: URL-ja e portalit të klientit (ri-novim/ndërrim kartele/anulim nga biznesi)
function hapPortal() {
  const base = 'https://app.paddle.com/billing-information';
  return config.paddle.testMode ? `${base}?test_mode=1` : base;
}

// anuloSubscription: menjëherë ose në fund të periodit
async function anuloSubscription(subscriptionId, { menjehere = false } = {}) {
  const body = { cancellation_type: menjehere ? 'immediate' : 'at_period_end' };
  return apiPaddle(`/subscriptions/${subscriptionId}/cancel`, { method: 'POST', body: JSON.stringify(body) });
}

// refundimi: i lidhur me një transaksion specifik (amount 0 = e gjithë transaksioni)
async function refundimi({ transactionId, priceId }) {
  const body = {
    transaction_id: transactionId,
    amounts: [{ price_id: priceId, quantity: 1, amount: 0 }],
  };
  return apiPaddle('/refunds', { method: 'POST', body: JSON.stringify(body) });
}

// merrSubscription: lexon gjendjen nga Paddle
async function merrSubscription(subscriptionId) {
  return apiPaddle(`/subscriptions/${subscriptionId}`);
}

module.exports = {
  verifikoWebhook,
  krijonCheckout,
  hapPortal,
  anuloSubscription,
  refundimi,
  merrSubscription,
  apiPaddle,
};
