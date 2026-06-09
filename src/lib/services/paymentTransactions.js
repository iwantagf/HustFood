import { getOrderFinalTotal } from '@/lib/pricing';

export function getPaymentTransactionAmount(order) {
  return getOrderFinalTotal(order);
}

export function buildPaymentTransactionData(order, overrides = {}) {
  return {
    orderId: order.id,
    provider: overrides.provider ?? order.paymentProvider ?? (order.paymentMethod === 'cod' ? 'cod' : null),
    method: overrides.method ?? order.paymentMethod ?? 'cod',
    transactionId: overrides.transactionId ?? order.paymentTransactionId ?? null,
    status: overrides.status ?? order.paymentStatus ?? 'pending',
    amount: Number(overrides.amount ?? getPaymentTransactionAmount(order) ?? 0),
    checksum: overrides.checksum ?? order.paymentChecksum ?? null,
    failureReason: overrides.failureReason ?? order.paymentFailureReason ?? null,
    type: overrides.type ?? 'payment'
  };
}

export function buildRefundPaymentTransactionData(order, reason = null) {
  return buildPaymentTransactionData(order, {
    type: 'refund',
    status: 'refunded',
    amount: getPaymentTransactionAmount(order),
    failureReason: reason || order.paymentFailureReason || null
  });
}
