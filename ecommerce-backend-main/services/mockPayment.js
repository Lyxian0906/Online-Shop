import { randomUUID } from 'crypto';

// The three kinds of "card" the checkout form can send. They work like the test
// cards of real payment companies: the number you type decides what happens.
export const PAYMENT_SCENARIOS = ['success', 'declined', 'insufficient_funds'];

// A FAKE payment company. It never touches real money.
// It answers { ok: true, reference } when the payment "worked",
// or { ok: false, message } when it did not.
export function chargeTestCard({ scenario, amountCents }) {
  if (scenario === 'declined') {
    return { ok: false, message: 'Your card was declined.' };
  }

  if (scenario === 'insufficient_funds') {
    return { ok: false, message: 'Your card has insufficient funds.' };
  }

  // 'success': make up a receipt number like MOCK-1A2B3C4D
  const reference = `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`;
  return { ok: true, reference, amountCents };
}
