import type { PaymentInfo } from '../api/types';

export interface CheckoutResult {
  paymentId: string;
  signature: string;
}

/**
 * Native Razorpay checkout hook-up point.
 *
 * Razorpay's SDK is a native module, so it does not run inside Expo Go. To enable real payments:
 *   1. npx expo install react-native-razorpay   (then build a dev client: npx expo run:android / run:ios)
 *   2. Set PAYMENT_PROVIDER=razorpay and the RAZORPAY_* variables on the backend
 *   3. Replace the body below with:
 *
 *        import RazorpayCheckout from 'react-native-razorpay';
 *        const r = await RazorpayCheckout.open({
 *          key: payment.keyId, order_id: payment.orderId, amount: payment.amountPaise,
 *          currency: payment.currency, name: 'Feedants', description: payment.description,
 *          prefill: { name: user.name }, theme: { color: '#0A7570' },
 *        });
 *        return { paymentId: r.razorpay_payment_id, signature: r.razorpay_signature };
 *
 * The backend already verifies the signature and also listens to Razorpay webhooks as a safety net.
 * With PAYMENT_PROVIDER=mock (default) the app uses the simulated <PaymentSheet /> instead.
 */
export async function openRazorpayCheckout(_payment: PaymentInfo): Promise<CheckoutResult> {
  throw new Error('RAZORPAY_NATIVE_MODULE_NOT_INSTALLED');
}
