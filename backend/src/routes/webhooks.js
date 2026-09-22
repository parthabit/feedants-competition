const express = require('express');
const payments = require('../services/payments');
const { confirmPayment } = require('../services/registrationService');

const router = express.Router();

/**
 * Razorpay webhook. Guarantees a paid user is confirmed even if the app was killed
 * right after paying. Mounted with express.raw() because the signature is computed
 * over the exact bytes Razorpay sent.
 */
router.post('/razorpay', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
  try {
    const signature = req.header('x-razorpay-signature');
    if (!signature || !Buffer.isBuffer(req.body) || !payments.verifyWebhook(req.body, signature)) {
      return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Bad webhook signature' } });
    }
    const event = JSON.parse(req.body.toString('utf8'));
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload?.payment?.entity;
      if (payment?.order_id && payment?.id) {
        await confirmPayment({ orderId: payment.order_id, paymentId: payment.id });
      }
    }
    // Always 200 for handled/ignored events so Razorpay does not retry endlessly.
    res.json({ received: true });
  } catch (e) {
    next(e); // 5xx makes Razorpay retry, which is what we want for transient failures
  }
});

module.exports = router;
