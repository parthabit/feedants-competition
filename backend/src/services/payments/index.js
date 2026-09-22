const config = require('../../config');
const mock = require('./mockProvider');
const razorpay = require('./razorpayProvider');

/**
 * Payment provider interface:
 *   createOrder({ amountInr, receipt, notes }) -> { provider, orderId, amountPaise, currency, keyId? }
 *   verifyPayment({ orderId, paymentId, signature }) -> boolean
 *   verifyWebhook(rawBody: Buffer, signatureHeader) -> boolean
 */
const providers = { mock, razorpay };
const provider = providers[config.paymentProvider];
if (!provider) throw new Error(`Unknown PAYMENT_PROVIDER "${config.paymentProvider}"`);

module.exports = provider;
