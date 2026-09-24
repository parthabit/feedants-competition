import type { PaymentInfo } from '../api/types';

export interface CheckoutResult {
  paymentId: string;
  signature: string;
}

 
export async function openRazorpayCheckout(_payment: PaymentInfo): Promise<CheckoutResult> {
  throw new Error('RAZORPAY_NATIVE_MODULE_NOT_INSTALLED');
}
