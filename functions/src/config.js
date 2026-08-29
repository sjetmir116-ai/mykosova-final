// ===== KONFIGURIMI I FUNCTIONS =====
// Vlerat sensitive vijnë nga Firebase Secrets (process.env) — kurrë të hard-coded
const config = {
  provider: process.env.PROVIDER || 'paddle',
  paddle: {
    apiKey: process.env.PADDLE_API_KEY || '',
    webhookSecret: process.env.PADDLE_WEBHOOK_SECRET || '',
    baseUrl: process.env.PADDLE_API_BASE_URL || 'https://api.paddle.com',
    // Test mode: ON deri sa të mos kalohet në live (S2.5)
    testMode: (process.env.PADDLE_TEST_MODE || 'true') === 'true',
    // Price ID-t e Paddle — vendosen kur krijohen produktet te Paddle (S2.2)
    prices: {
      gold: process.env.PADDLE_PRICE_GOLD || '',
      premium: process.env.PADDLE_PRICE_PREMIUM || '',
    },
  },
  // Grace period për pagesat e dështuara para downgrade-it (ditë)
  gracePeriodDite: 7,
};

module.exports = { config };
