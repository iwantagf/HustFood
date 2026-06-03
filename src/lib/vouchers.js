import { calculateVoucherDiscount } from '@/lib/pricing';

export const DEMO_VOUCHERS = [
  {
    id: 'demo-voucher-hustfood10',
    code: 'HUSTFOOD10',
    description: 'Giảm 10% cho đơn từ 50.000đ',
    discountType: 'percent',
    discountValue: 10,
    minSubtotal: 50000,
    expiresAt: '2027-12-31T23:59:59.000Z',
    usageLimit: 100,
    usedCount: 0,
    active: true
  },
  {
    id: 'demo-voucher-sv20',
    code: 'SV20',
    description: 'Giảm 20.000đ cho đơn từ 100.000đ',
    discountType: 'fixed',
    discountValue: 20000,
    minSubtotal: 100000,
    expiresAt: '2027-12-31T23:59:59.000Z',
    usageLimit: 50,
    usedCount: 0,
    active: true
  }
];

export function normalizeVoucherCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function serializeVoucher(voucher, subtotal) {
  if (!voucher) return null;

  return {
    id: voucher.id,
    code: voucher.code,
    description: voucher.description,
    discountType: voucher.discountType,
    discountValue: voucher.discountValue,
    minSubtotal: voucher.minSubtotal,
    expiresAt: voucher.expiresAt,
    discount: calculateVoucherDiscount(subtotal, voucher)
  };
}

export function validateVoucher(voucher, subtotal) {
  if (!voucher || !voucher.active) {
    return { error: 'Mã giảm giá không tồn tại hoặc đã bị tắt' };
  }

  const safeSubtotal = Number(subtotal || 0);
  if (safeSubtotal < Number(voucher.minSubtotal || 0)) {
    return { error: `Đơn hàng cần tối thiểu ${Number(voucher.minSubtotal || 0).toLocaleString('vi-VN')}đ để dùng mã này` };
  }

  if (voucher.expiresAt && new Date(voucher.expiresAt).getTime() < Date.now()) {
    return { error: 'Mã giảm giá đã hết hạn' };
  }

  if (voucher.usageLimit && Number(voucher.usedCount || 0) >= Number(voucher.usageLimit)) {
    return { error: 'Mã giảm giá đã hết lượt sử dụng' };
  }

  return {
    voucher: serializeVoucher(voucher, safeSubtotal)
  };
}
