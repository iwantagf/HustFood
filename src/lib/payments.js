export const PAYMENT_METHODS = ['cod', 'momo', 'card'];
export const ONLINE_PAYMENT_METHODS = ['momo', 'card'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'retry_required'];
const MOCK_PAYMENT_SECRET = 'hustfood-mock-payment-secret';

function stableHash(value) {
  let hash = 5381;
  const input = String(value);

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash) + input.charCodeAt(index);
    hash &= 0xffffffff;
  }

  return Math.abs(hash).toString(16);
}

export function normalizePaymentMethod(method) {
  return PAYMENT_METHODS.includes(method) ? method : 'cod';
}

export function isOnlinePayment(method) {
  return ONLINE_PAYMENT_METHODS.includes(method);
}

export function buildPaymentChecksum({ method, transactionId, amount, status }) {
  return stableHash([
    MOCK_PAYMENT_SECRET,
    normalizePaymentMethod(method),
    transactionId,
    Number(amount || 0),
    status
  ].join('|'));
}

export function createMockPayment({ method, amount, status = 'paid' }) {
  const safeMethod = normalizePaymentMethod(method);
  const safeStatus = PAYMENT_STATUSES.includes(status) ? status : 'failed';
  const transactionId = `MOCK-${safeMethod.toUpperCase()}-${Date.now()}`;

  return {
    provider: safeMethod === 'cod' ? 'cod' : 'mock',
    transactionId,
    status: safeMethod === 'cod' ? 'pending' : safeStatus,
    checksum: buildPaymentChecksum({
      method: safeMethod,
      transactionId,
      amount,
      status: safeMethod === 'cod' ? 'pending' : safeStatus
    })
  };
}

export function verifyPaymentChecksum({ method, amount, payment }) {
  if (!payment?.transactionId || !payment?.status || !payment?.checksum) return false;

  return payment.checksum === buildPaymentChecksum({
    method,
    transactionId: payment.transactionId,
    amount,
    status: payment.status
  });
}

export function getInitialPaymentState(method, payment = null) {
  const safeMethod = normalizePaymentMethod(method);

  if (safeMethod === 'cod') {
    return {
      paymentMethod: safeMethod,
      paymentStatus: 'pending',
      paymentProvider: 'cod',
      paymentTransactionId: null,
      paymentChecksum: null,
      paymentFailureReason: null,
      orderStatus: 'pending'
    };
  }

  if (payment?.status === 'paid') {
    return {
      paymentMethod: safeMethod,
      paymentStatus: 'paid',
      paymentProvider: payment.provider || 'mock',
      paymentTransactionId: payment.transactionId,
      paymentChecksum: payment.checksum,
      paymentFailureReason: null,
      orderStatus: 'pending'
    };
  }

  return {
    paymentMethod: safeMethod,
    paymentStatus: 'failed',
    paymentProvider: payment?.provider || 'mock',
    paymentTransactionId: payment?.transactionId || null,
    paymentChecksum: payment?.checksum || null,
    paymentFailureReason: 'Thanh toán online thất bại, chờ khách thanh toán lại',
    orderStatus: 'payment_retry'
  };
}
