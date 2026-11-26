import { buildUpiUri, type Paise } from "@/domain";

export interface PaymentRequest {
  vpa: string;
  payeeName: string;
  amount: Paise;
  note: string;
  reference: string;
}

export interface PaymentAdapter {
  readonly name: string;
  /** A link the payer opens to pay. */
  paymentLink(req: PaymentRequest): string;
}

/**
 * Free interim path: a UPI intent link straight to the gym's VPA. Confirmation is manual (desk)
 * or, in the demo, a "simulate payment received" button. A Razorpay adapter would add webhooks.
 */
export const upiIntentPayments: PaymentAdapter = {
  name: "upi_intent",
  paymentLink: (req) => buildUpiUri(req),
};

export function payments(): PaymentAdapter {
  return upiIntentPayments;
}
