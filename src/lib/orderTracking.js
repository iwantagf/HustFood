import { ORDER_STATUSES } from '@/lib/statuses';

export const ORDER_TRACKING_STEPS = [
  { status: ORDER_STATUSES.PENDING, label: 'Chờ xác nhận' },
  { status: ORDER_STATUSES.ACCEPTED, label: 'Đã nhận đơn' },
  { status: ORDER_STATUSES.PREPARING, label: 'Đang chuẩn bị' },
  { status: ORDER_STATUSES.READY_FOR_PICKUP, label: 'Chờ giao hàng' },
  { status: ORDER_STATUSES.PICKED_UP, label: 'Đã lấy hàng' },
  { status: ORDER_STATUSES.DELIVERING, label: 'Đang giao' },
  { status: ORDER_STATUSES.COMPLETED, label: 'Hoàn thành' }
];

export function getOrderStatusLabel(status) {
  switch (status) {
    case ORDER_STATUSES.PAYMENT_RETRY: return 'Chờ thanh toán lại';
    case ORDER_STATUSES.PENDING: return 'Chờ xác nhận';
    case ORDER_STATUSES.ACCEPTED: return 'Đã nhận đơn';
    case ORDER_STATUSES.PREPARING: return 'Đang chuẩn bị';
    case ORDER_STATUSES.READY_FOR_PICKUP:
    case ORDER_STATUSES.LEGACY_PROCESSING: return 'Chờ giao hàng';
    case ORDER_STATUSES.PICKED_UP: return 'Đã lấy hàng';
    case ORDER_STATUSES.DELIVERING: return 'Đang giao';
    case ORDER_STATUSES.COMPLETED: return 'Hoàn thành';
    case ORDER_STATUSES.REJECTED: return 'Từ chối';
    default: return status || 'Chưa rõ';
  }
}

export function getOrderStepIndex(status) {
  if (status === ORDER_STATUSES.PAYMENT_RETRY) return 0;
  if (status === ORDER_STATUSES.LEGACY_PROCESSING) return 3;
  const index = ORDER_TRACKING_STEPS.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
}

export function getOrderProgress(status) {
  if (status === ORDER_STATUSES.REJECTED) return 100;
  const index = getOrderStepIndex(status);
  return Math.round(index / Math.max(ORDER_TRACKING_STEPS.length - 1, 1) * 100);
}

export function getEtaText(order) {
  switch (order?.status) {
    case ORDER_STATUSES.PAYMENT_RETRY: return 'Chờ xác nhận lại thanh toán';
    case ORDER_STATUSES.PENDING: return 'Khoảng 45-60 phút';
    case ORDER_STATUSES.ACCEPTED: return 'Khoảng 35-45 phút';
    case ORDER_STATUSES.PREPARING: return 'Khoảng 25-35 phút';
    case ORDER_STATUSES.READY_FOR_PICKUP:
    case ORDER_STATUSES.LEGACY_PROCESSING: return 'Đang tìm người giao hàng';
    case ORDER_STATUSES.PICKED_UP: return 'Khoảng 15-25 phút';
    case ORDER_STATUSES.DELIVERING: return 'Khoảng 5-15 phút';
    case ORDER_STATUSES.COMPLETED: return 'Đã giao xong';
    case ORDER_STATUSES.REJECTED: return 'Đơn đã bị từ chối';
    default: return 'Đang cập nhật';
  }
}

export function getLatestShipperLocation(order) {
  const latitude = Number(order?.shipperLatitude);
  const longitude = Number(order?.shipperLongitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    latitude,
    longitude,
    updatedAt: order.shipperLocationAt
  };
}

export function getTrackingMapHref(order) {
  const latestLocation = getLatestShipperLocation(order);
  const destination = order?.customer?.address || '';

  if (latestLocation) {
    return `https://www.google.com/maps/dir/?api=1&origin=${latestLocation.latitude},${latestLocation.longitude}&destination=${encodeURIComponent(destination)}`;
  }

  const pickup = order?.pickupAddress || order?.merchantName || '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`;
}
