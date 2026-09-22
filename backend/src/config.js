require('dotenv').config();

const int = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d);

const config = {
  env: process.env.NODE_ENV || 'development',
  port: int(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/feedants',

  holdMinutes: int(process.env.HOLD_MINUTES, 10),
  hurryThresholdHours: int(process.env.HURRY_THRESHOLD_HOURS, 48),
  sweeperIntervalMs: 30 * 1000,
  staticCacheTtlMs: 60 * 1000,

  paymentProvider: process.env.PAYMENT_PROVIDER || 'mock',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },

  referral: {
    baseUrl: process.env.REFERRAL_BASE_URL || 'https://feedants.com/r',
    rewardInr: int(process.env.REFERRAL_REWARD_INR, 10),
  },

  enableDevRoutes: process.env.ENABLE_DEV_ROUTES === 'true',
};

if (config.paymentProvider === 'razorpay') {
  const { keyId, keySecret, webhookSecret } = config.razorpay;
  if (!keyId || !keySecret || !webhookSecret) {
    throw new Error('PAYMENT_PROVIDER=razorpay requires RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET');
  }
}

module.exports = config;
