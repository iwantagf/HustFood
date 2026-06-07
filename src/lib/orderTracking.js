export const ORDER_TRACKING_STEPS = [
  { status: 'pending', label: 'Chờ xác nhận' },
  { status: 'accepted', label: 'Đã nhận đơn' },
  { status: 'preparing', label: 'Đang chuẩn bị' },
  { status: 'ready_for_pickup', label: 'Chờ giao hàng' },
  { status: 'picked_up', label: 'Đã lấy hàng' },
  { status: 'delivering', label: 'Đang giao' },
  { status: 'completed', label: 'Hoàn thành' }
];

export function getOrderStatusLabel(status) {
  switch (status) {
    case 'payment_retry': return 'Chờ thanh toán lại';
    case 'pending': return 'Chờ xác nhận';
    case 'accepted': return 'Đã nhận đơn';
    case 'preparing': return 'Đang chuẩn bị';
    case 'ready_for_pickup':
    case 'processing': return 'Chờ giao hàng';
    case 'picked_up': return 'Đã lấy hàng';
    case 'delivering': return 'Đang giao';
    case 'completed': return 'Hoàn thành';
    case 'rejected': return 'Từ chối';
    case 'cancelled': return 'Đã hủy';
    default: return status || 'Chưa rõ';
  }
}

export function getOrderStepIndex(status) {
  if (status === 'payment_retry') return 0;
  if (status === 'processing') return 3;
  const index = ORDER_TRACKING_STEPS.findIndex((step) => step.status === status);
  return index >= 0 ? index : 0;
}

export function getOrderProgress(status) {
  if (status === 'rejected' || status === 'cancelled') return 100;
  const index = getOrderStepIndex(status);
  return Math.round(index / Math.max(ORDER_TRACKING_STEPS.length - 1, 1) * 100);
}

export function getEtaText(order) {
  switch (order?.status) {
    case 'payment_retry': return 'Chờ xác nhận lại thanh toán';
    case 'pending': return 'Khoảng 45-60 phút';
    case 'accepted': return 'Khoảng 35-45 phút';
    case 'preparing': return 'Khoảng 25-35 phút';
    case 'ready_for_pickup':
    case 'processing': return 'Đang tìm người giao hàng';
    case 'picked_up': return 'Khoảng 15-25 phút';
    case 'delivering': return 'Khoảng 5-15 phút';
    case 'completed': return 'Đã giao xong';
    case 'rejected': return 'Đơn đã bị từ chối';
    case 'cancelled': return 'Khách hàng đã hủy đơn';
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
