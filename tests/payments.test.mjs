import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PAYMENT_STATUSES,
  buildPaymentChecksum,
  createMockPayment,
  getInitialPaymentState,
  verifyPaymentChecksum
} from '../src/lib/payments.js';

test('mock payment checksum verifies matching payloads', () => {
  const payment = createMockPayment({ method: 'momo', amount: 125000, status: 'paid' });

  assert.equal(verifyPaymentChecksum({ method: 'momo', amount: 125000, payment }), true);
  assert.equal(verifyPaymentChecksum({ method: 'momo', amount: 120000, payment }), false);
});

test('failed online payment starts a retry order state', () => {
  const payment = {
    provider: 'mock',
    transactionId: 'MOCK-MOMO-FAILED',
    status: 'failed',
    checksum: buildPaymentChecksum({
      method: 'momo',
      transactionId: 'MOCK-MOMO-FAILED',
      amount: 99000,
      status: 'failed'
    })
  };

  const state = getInitialPaymentState('momo', payment);

  assert.equal(state.paymentStatus, 'failed');
  assert.equal(state.orderStatus, 'payment_retry');
});

test('payment statuses include refund lifecycle', () => {
  assert.equal(PAYMENT_STATUSES.includes('refunded'), true);
});
