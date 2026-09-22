const crypto = require('crypto');
const config = require('../../config');
const { Errors } = require('../../utils/AppError');

const safeEqualHex = (a, b) => {
  const ba = Buffer.from(String(a), 'hex');
  const bb = Buffer.from(String(b), 'hex');
  return ba.length > 0 && ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const hmac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');

module.exports = {
  name: 'razorpay',

  /** Uses the plain REST API so no SDK is needed. https://razorpay.com/docs/api/orders/ */
  async createOrder({ amountInr, receipt, notes }) {
    const { keyId, keySecret } = config.razorpay;
    let res;
    try {
      res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        },
        body: JSON.stringify({ amount: amountInr * 100, currency: 'INR', receipt, notes }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.error('[razorpay] order request failed', err.message);
      throw Errors.paymentProviderDown();
    }
    if (!res.ok) {
      console.error('[razorpay] order rejected', res.status, await res.text().catch(() => ''));
      throw Errors.paymentProviderDown();
    }
    const order = await res.json();
    return { provider: 'razorpay', orderId: order.id, amountPaise: order.amount, currency: order.currency, keyId };
  },

  /** Checkout success callback signature: HMAC_SHA256(order_id|payment_id, key_secret) */
  verifyPayment({ orderId, paymentId, signature }) {
    return safeEqualHex(hmac(config.razorpay.keySecret, `${orderId}|${paymentId}`), signature);
  },

  /** Webhook signature: HMAC_SHA256(raw_body, webhook_secret). Must be computed over the RAW bytes. */
  verifyWebhook(rawBody, signatureHeader) {
    return safeEqualHex(hmac(config.razorpay.webhookSecret, rawBody), signatureHeader);
  },
};
