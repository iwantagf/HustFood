export const DEMO_DELIVERY_FEE = 15000;

export function parsePriceToNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const price = Number.parseInt(String(value || '').replace(/\D/g, ''), 10);
  return Number.isFinite(price) ? price : 0;
}

export function calculateItemsSubtotal(items = []) {
  if (!Array.isArray(items)) return 0;

  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity || 0);
    const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
    return total + parsePriceToNumber(item?.price) * safeQuantity;
  }, 0);
}

export function calculateFinalTotal(totalPrice, deliveryFee = DEMO_DELIVERY_FEE) {
  const safeTotalPrice = Number.isFinite(Number(totalPrice)) ? Number(totalPrice) : 0;
  const safeDeliveryFee = Number.isFinite(Number(deliveryFee)) ? Number(deliveryFee) : 0;
  return safeTotalPrice + safeDeliveryFee;
}

export function calculateVoucherDiscount(subtotal, voucher) {
  if (!voucher) return 0;

  const safeSubtotal = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
  if (safeSubtotal <= 0) return 0;

  if (voucher.discountType === 'percent') {
    const percent = Math.min(Math.max(Number(voucher.discountValue || 0), 0), 100);
    return Math.floor(safeSubtotal * percent / 100);
  }

  return Math.min(Math.max(Number(voucher.discountValue || 0), 0), safeSubtotal);
}

export function calculateOrderTotals(items = [], voucher = null) {
  const totalPrice = calculateItemsSubtotal(items);
  const deliveryFee = DEMO_DELIVERY_FEE;
  const discount = calculateVoucherDiscount(totalPrice, voucher);
  const finalTotal = calculateFinalTotal(totalPrice - discount, deliveryFee);

  return { totalPrice, deliveryFee, discount, finalTotal };
}

export function getOrderFinalTotal(order) {
  const finalTotal = Number(order?.customer?.finalTotal);
  if (Number.isFinite(finalTotal)) return finalTotal;

  return Number(order?.totalPrice || 0);
}
