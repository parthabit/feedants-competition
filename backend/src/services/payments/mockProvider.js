const crypto = require('crypto');

/** Offline provider so the whole flow is demoable without Razorpay credentials. */
module.exports = {
  name: 'mock',

  async createOrder({ amountInr }) {
    return {
      provider: 'mock',
      orderId: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
      amountPaise: amountInr * 100,
      currency: 'INR',
      keyId: 'mock_key',
    };
  },

  // The simulated payment sheet in the app sends the literal signature "mock_signature".
  verifyPayment({ signature }) {
    return signature === 'mock_signature';
  },

  verifyWebhook() {
    return false; // no webhooks in mock mode
  },
};
