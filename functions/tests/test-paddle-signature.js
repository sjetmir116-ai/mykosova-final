// TEST: Verifikimi i signature-s së Paddle (pa rrjet, pa Firebase)
process.env.PADDLE_WEBHOOK_SECRET = 'test-secret-123';
const crypto = require('crypto');
const { verifikoWebhook } = require('../src/providers/paddle');

const SECRET = 'test-secret-123';
const body = JSON.stringify({
  notification_id: 'ntf_test_001',
  event: 'subscription.activated',
  data: { id: 'sub_test_001' },
});

function buildSignature(bodyText, t, secret = SECRET) {
  return 't=' + t + ',v1=' + crypto.createHmac('sha256', secret).update(t + '.' + bodyText).digest('hex');
}

const tani = String(Math.floor(Date.now() / 1000));
const rezultate = [];
const kontrollo = (emri, kusht) => {
  rezultate.push({ emri, ok: kusht });
  console.log((kusht ? '✅' : '❌ GABIM') + ' ' + emri);
};

// 1. Signature e vlefshme → pritet
kontrollo('1. Signature e saktë pritet', verifikoWebhook(body, buildSignature(body, tani)).valide === true);

// 2. Body i keqardhur (tamper) → refuzohet
kontrollo('2. Body i ndryshuar refuzohet', verifikoWebhook(body + ' ', buildSignature(body, tani)).valide === false);

// 3. Secret i gabuar → refuzohet
kontrollo('3. Secret i gabuar refuzohet', verifikoWebhook(body, buildSignature(body, tani, 'secret-tjetër')).valide === false);

// 4. Timestamp i vjetër (>5 min) → refuzohet
kontrollo('4. Timestamp i vjetër refuzohet', verifikoWebhook(body, buildSignature(body, String(tani - 400))).valide === false);

// 5. Header i munguar → refuzohet
kontrollo('5. Header i munguar refuzohet', verifikoWebhook(body, undefined).valide === false);

// 6. Header i paplotë (vetëm t, pa v1) → refuzohet
kontrollo('6. Header i paplotë refuzohet', verifikoWebhook(body, 't=' + tani).valide === false);

module.exports = { rezultate };
