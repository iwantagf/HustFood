import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { createDemoId, getDemoStore, isDemoMode } from '@/lib/demo/store';
import { DEMO_DELIVERY_FEE, calculateItemsSubtotal, calculateVoucherDiscount } from '@/lib/pricing';
import { normalizeVoucherCode, serializeVoucher, validateVoucher } from '@/lib/vouchers';
import { getInitialPaymentState, isOnlinePayment, normalizePaymentMethod, verifyPaymentChecksum } from '@/lib/payments';

const SELLER_STATUSES = ['accepted', 'preparing', 'ready_for_pickup', 'rejected', 'payment_retry'];
const SHIPPER_STATUSES = ['picked_up', 'delivering', 'completed'];
const LEGACY_SHIPPER_READY_STATUSES = ['processing'];
const SHIPPER_READY_STATUSES = ['ready_for_pickup', ...LEGACY_SHIPPER_READY_STATUSES];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeRequestedItems(rawItems) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Giỏ hàng không có món nào' };
  }

  const items = [];

  rawItems.forEach((item, index) => {
    const id = String(item?.id || '').trim();
    const quantity = Number(item?.quantity);

    if (!id || !Number.isInteger(quantity) || quantity <= 0) {
      items.push({ error: 'Dữ liệu món trong giỏ hàng không hợp lệ' });
      return;
    }

    items.push({
      id,
      cartKey: String(item?.cartKey || `${id}-${index}`),
      quantity,
      selectedOptions: item?.selectedOptions || {},
      itemNote: String(item?.itemNote || '').trim()
    });
  });

  const invalidItem = items.find((item) => item.error);
  if (invalidItem) return { error: invalidItem.error };

  return { items };
}

function getProductMerchant(product) {
  const profile = product?.owner?.merchantProfile;
  return {
    merchantId: profile?.ownerId || product?.ownerId || product?.owner?.id || 'shared-menu',
    merchantName: profile?.shopName || 'HustFood'
  };
}

function buildOrderCreateData(body, products, voucher = null, paymentState = null) {
  const requestedItems = normalizeRequestedItems(body.items);
  if (requestedItems.error) return requestedItems;

  const productById = new Map(products.map((product) => [product.id, product]));
  const missingItem = requestedItems.items.find((item) => !productById.has(item.id));

  if (missingItem) {
    return { error: 'Món trong giỏ hàng không tồn tại' };
  }

  const items = requestedItems.items.map((item) => {
    const product = productById.get(item.id);

    return {
      id: product.id,
      name: product.name,
      desc: product.desc,
      price: product.price,
      image: product.image,
      merchantId: getProductMerchant(product).merchantId,
      merchantName: getProductMerchant(product).merchantName,
      selectedOptions: item.selectedOptions,
      itemNote: item.itemNote,
      quantity: item.quantity
    };
  });

  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.merchantId)) {
      groups.set(item.merchantId, {
        merchantId: item.merchantId,
        merchantName: item.merchantName,
        items: []
      });
    }
    groups.get(item.merchantId).items.push(item);
  }

  const subtotal = calculateItemsSubtotal(items);
  const totalDiscount = calculateVoucherDiscount(subtotal, voucher);
  let assignedDiscount = 0;
  const groupList = Array.from(groups.values());

  const orders = groupList.map((group, index) => {
    const totalPrice = calculateItemsSubtotal(group.items);
    const discount = index === groupList.length - 1
      ? totalDiscount - assignedDiscount
      : Math.floor(totalDiscount * totalPrice / Math.max(subtotal, 1));
    assignedDiscount += discount;
    const deliveryFee = DEMO_DELIVERY_FEE;
    const finalTotal = Math.max(totalPrice - discount, 0) + deliveryFee;

    return {
      merchantId: group.merchantId,
      merchantName: group.merchantName,
      customer: {
        ...(body.customer || {}),
        deliveryFee,
        discount,
        finalTotal,
        voucher: voucher ? serializeVoucher(voucher, subtotal) : null
      },
      items: group.items,
      totalItems: group.items.reduce((total, item) => total + item.quantity, 0),
      totalPrice,
      deliveryFee,
      discount,
      finalTotal,
      paymentState
    };
  });

  return {
    data: orders
  };
}

async function getOrderProducts(productIds) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const profileByOwnerId = new Map(store.merchantProfiles.map((profile) => [profile.ownerId, profile]));
    return store.products.filter((product) => (
      productIds.includes(product.id)
      && product.isAvailable !== false
      && product.isHidden !== true
    )).map((product) => ({
      ...product,
      owner: {
        id: product.ownerId,
        merchantProfile: profileByOwnerId.get(product.ownerId) || null
      }
    }));
  }

  return prisma.product.findMany({
    where: {
      id: {
        in: productIds
      },
      isAvailable: true,
      isHidden: false
    },
    include: {
      owner: {
        select: {
          id: true,
          merchantProfile: true
        }
      }
    }
  });
}

function buildOrderRecord(orderData, extraData = {}) {
  return {
    ...extraData,
    merchantId: orderData.merchantId,
    merchantName: orderData.merchantName,
    customer: {
      ...orderData.customer
    },
    items: orderData.items,
    totalItems: orderData.totalItems,
    totalPrice: orderData.totalPrice,
    deliveryFee: orderData.deliveryFee,
    discount: orderData.discount,
    finalTotal: orderData.finalTotal,
    paymentMethod: orderData.paymentState?.paymentMethod || 'cod',
    paymentStatus: orderData.paymentState?.paymentStatus || 'pending',
    paymentProvider: orderData.paymentState?.paymentProvider || null,
    paymentTransactionId: orderData.paymentState?.paymentTransactionId || null,
    paymentChecksum: orderData.paymentState?.paymentChecksum || null,
    paymentFailureReason: orderData.paymentState?.paymentFailureReason || null,
    status: orderData.paymentState?.orderStatus || 'pending'
  };
}

async function findVoucher(code) {
  const normalizedCode = normalizeVoucherCode(code);
  if (!normalizedCode) return null;

  if (isDemoMode()) {
    const store = getDemoStore();
    return store.vouchers.find((voucher) => voucher.code === normalizedCode);
  }

  return prisma.voucher.findUnique({ where: { code: normalizedCode } });
}

async function markVoucherUsed(voucher) {
  if (!voucher) return;

  if (isDemoMode()) {
    voucher.usedCount = Number(voucher.usedCount || 0) + 1;
    return;
  }

  await prisma.voucher.update({
    where: { id: voucher.id },
    data: { usedCount: { increment: 1 } }
  });
}

async function notifySellerNewOrders(orders) {
  if (isDemoMode()) {
    const store = getDemoStore();
    for (const order of orders) {
      store.notifications.unshift({
        id: createDemoId('demo-notification'),
        ownerId: order.merchantId || null,
        message: `Bạn có đơn mới ${order.id} trị giá ${Number(order.finalTotal || order.customer?.finalTotal || 0).toLocaleString('vi-VN')}đ.`,
        read: false,
        createdAt: new Date().toISOString()
      });
    }
    return;
  }

  await prisma.notification.createMany({
    data: orders.map((order) => ({
      ownerId: order.merchantId,
      message: `Bạn có đơn mới ${order.id} trị giá ${Number(order.finalTotal || 0).toLocaleString('vi-VN')}đ.`,
      read: false
    }))
  });
}

function buildOrderUpdate({ order, status, action, rejectionReason, user }) {
  const update = {};
  const now = new Date();
  const reason = String(rejectionReason || '').trim();

  if (action === 'accept') {
    if (!SHIPPER_READY_STATUSES.includes(order.status)) {
      return { error: 'Đơn hàng chưa sẵn sàng để nhận giao' };
    }

    if (order.shipperId && order.shipperId !== user.id) {
      return { error: 'Đơn hàng đã được người giao hàng khác nhận' };
    }

    update.status = 'picked_up';
    update.shipperId = user.id;
    update.shipperName = user.displayName || user.username || 'Người giao hàng';
    update.acceptedAt = now;
    update.pickedUpAt = now;
    return { update };
  }

  if (!status) {
    return { error: 'Thiếu trạng thái đơn hàng' };
  }

  if (user.role === 'seller' || user.role === 'admin') {
    if (['failed', 'retry_required'].includes(order.paymentStatus) && status !== 'payment_retry') {
      return { error: 'Đơn đang chờ thanh toán lại, chưa thể chuyển trạng thái xử lý' };
    }

    if (!SELLER_STATUSES.includes(status) && !(user.role === 'admin' && status === 'completed')) {
      return { error: 'Trạng thái này không thuộc luồng xử lý của người bán' };
    }

    const allowedTransitions = {
      pending: ['accepted', 'rejected'],
      payment_retry: ['payment_retry'],
      accepted: ['preparing', 'rejected'],
      preparing: ['ready_for_pickup'],
      ready_for_pickup: [],
      processing: [],
      picked_up: [],
      delivering: [],
      completed: [],
      rejected: []
    };

    if (user.role !== 'admin' && !(allowedTransitions[order.status] || []).includes(status)) {
      return { error: 'Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này' };
    }

    if (status === 'rejected') {
      if (!['pending', 'accepted'].includes(order.status) && user.role !== 'admin') {
        return { error: 'Chỉ có thể từ chối đơn trước khi bắt đầu chuẩn bị' };
      }

      if (!reason) {
        return { error: 'Vui lòng nhập lý do từ chối đơn' };
      }

      update.rejectionReason = reason;
      update.rejectedAt = now;
    }

    if (status === 'accepted' && !order.sellerAcceptedAt) {
      update.sellerAcceptedAt = now;
    }

    if (status === 'ready_for_pickup' && !order.readyForPickupAt) {
      update.readyForPickupAt = now;
    }

    update.status = status;
    return { update };
  }

  if (user.role === 'shipper') {
    if (!SHIPPER_STATUSES.includes(status)) {
      return { error: 'Trạng thái này không thuộc luồng giao hàng' };
    }

    if (order.shipperId && order.shipperId !== user.id) {
      return { error: 'Bạn không được phân công đơn hàng này' };
    }

    update.status = status;
    update.shipperId = order.shipperId || user.id;
    update.shipperName = order.shipperName || user.displayName || user.username || 'Người giao hàng';

    if (status === 'picked_up' && !order.pickedUpAt) {
      update.pickedUpAt = now;
    }

    if (status === 'completed') {
      update.deliveredAt = now;
    }

    return { update };
  }

  return { error: 'Tài khoản không có quyền cập nhật đơn hàng' };
}

function sellerOwnsOrder(order, user) {
  return user.role !== 'seller' || order.merchantId === user.id;
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'shipper', 'admin']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      const store = getDemoStore();
      const orders = auth.user.role === 'seller'
        ? store.orders.filter((order) => order.merchantId === auth.user.id)
        : auth.user.role === 'shipper'
          ? store.orders.filter((order) => (
            (SHIPPER_READY_STATUSES.includes(order.status) && !order.shipperId)
            || order.shipperId === auth.user.id
          ))
        : store.orders;
      return json(orders);
    }

    const where = auth.user.role === 'seller'
      ? { merchantId: auth.user.id }
      : auth.user.role === 'shipper'
        ? {
          OR: [
            { status: { in: SHIPPER_READY_STATUSES }, shipperId: null },
            { shipperId: auth.user.id }
          ]
        }
        : undefined;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    return json(orders);
  } catch (error) {
    return json({ error: 'Failed to fetch orders' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const requestedItems = normalizeRequestedItems(body.items);
    if (requestedItems.error) return json({ error: requestedItems.error }, 400);

    const productIds = requestedItems.items.map((item) => item.id);
    const products = await getOrderProducts(productIds);
    const preliminaryOrderResult = buildOrderCreateData(body, products);
    if (preliminaryOrderResult.error) {
      return json({
        error: preliminaryOrderResult.error === 'Món trong giỏ hàng không tồn tại'
          ? 'Món trong giỏ hàng không tồn tại, đã hết hàng hoặc đã bị ẩn'
          : preliminaryOrderResult.error
      }, 400);
    }

    const subtotal = preliminaryOrderResult.data.reduce((total, order) => total + order.totalPrice, 0);
    const voucher = await findVoucher(body.voucherCode);
    if (body.voucherCode) {
      const voucherResult = validateVoucher(voucher, subtotal);
      if (voucherResult.error) return json({ error: voucherResult.error }, 400);
    }

    const paymentMethod = normalizePaymentMethod(body.customer?.paymentMethod);
    const preliminaryDiscount = voucher ? calculateVoucherDiscount(subtotal, voucher) : 0;
    const expectedFinalTotal = Math.max(subtotal - preliminaryDiscount, 0) + (DEMO_DELIVERY_FEE * preliminaryOrderResult.data.length);
    const payment = body.payment || null;

    if (isOnlinePayment(paymentMethod) && !verifyPaymentChecksum({ method: paymentMethod, amount: expectedFinalTotal, payment })) {
      return json({ error: 'Thông tin thanh toán không hợp lệ hoặc sai checksum' }, 400);
    }

    const paymentState = getInitialPaymentState(paymentMethod, payment);
    if (paymentState.paymentStatus === 'failed') {
      paymentState.paymentStatus = 'retry_required';
    }

    const orderResult = buildOrderCreateData(body, products, voucher, paymentState);
    if (orderResult.error) {
      return json({
        error: orderResult.error === 'Món trong giỏ hàng không tồn tại'
          ? 'Món trong giỏ hàng không tồn tại, đã hết hàng hoặc đã bị ẩn'
          : orderResult.error
      }, 400);
    }

    const orderGroups = orderResult.data;

    if (isDemoMode()) {
      const store = getDemoStore();
      const newOrders = orderGroups.map((orderData, index) => buildOrderRecord(orderData, {
        id: '#HF' + Math.floor(1000 + Math.random() * 9000),
        shipperId: null,
        shipperName: null,
        rejectionReason: null,
        sellerAcceptedAt: null,
        readyForPickupAt: null,
        rejectedAt: null,
        acceptedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        createdAt: new Date(Date.now() + index).toISOString()
      }));
      store.orders.unshift(...newOrders);
      await markVoucherUsed(voucher);
      await notifySellerNewOrders(newOrders);

      return json(newOrders, 201);
    }
    
    const newOrders = [];
    for (const [index, orderData] of orderGroups.entries()) {
      const newOrder = await prisma.order.create({
        data: buildOrderRecord(orderData, {
          id: '#HF' + Math.floor(1000 + Math.random() * 9000 + index)
        })
      });
      newOrders.push(newOrder);
    }
    await markVoucherUsed(voucher);
    await notifySellerNewOrders(newOrders);
    
    return json(newOrders, 201);
  } catch (error) {
    return json({ error: 'Failed to create order' }, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['seller', 'shipper', 'admin']);
    if (auth.response) return auth.response;

    const { id, status, action, rejectionReason } = await request.json();

    if (!id) {
      return json({ error: 'Thiếu mã đơn hàng' }, 400);
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const order = store.orders.find((item) => item.id === id);
      if (!order) {
        return json({ error: 'Order not found' }, 404);
      }

      if (!sellerOwnsOrder(order, auth.user)) {
        return json({ error: 'Bạn không được xử lý đơn của cửa hàng khác' }, 403);
      }

      const result = buildOrderUpdate({ order, status, action, rejectionReason, user: auth.user });
      if (result.error) return json({ error: result.error }, 400);

      Object.assign(order, result.update);
      return json(order);
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return json({ error: 'Order not found' }, 404);

    if (!sellerOwnsOrder(order, auth.user)) {
      return json({ error: 'Bạn không được xử lý đơn của cửa hàng khác' }, 403);
    }

    const result = buildOrderUpdate({ order, status, action, rejectionReason, user: auth.user });
    if (result.error) return json({ error: result.error }, 400);
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: result.update
    });
    
    return json(updatedOrder);
  } catch (error) {
    return json({ error: 'Order not found or failed to update' }, 404);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

    const { id } = await request.json();

    if (isDemoMode()) {
      const store = getDemoStore();
      const order = store.orders.find((item) => item.id === id);
      if (!order) return json({ error: 'Order not found' }, 404);
      if (!sellerOwnsOrder(order, auth.user)) {
        return json({ error: 'Bạn không được xóa đơn của cửa hàng khác' }, 403);
      }

      store.orders = store.orders.filter((order) => order.id !== id);

      return json({ success: true });
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return json({ error: 'Order not found' }, 404);
    if (!sellerOwnsOrder(order, auth.user)) {
      return json({ error: 'Bạn không được xóa đơn của cửa hàng khác' }, 403);
    }
    
    await prisma.order.delete({
      where: { id }
    });
    
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete order' }, 500);
  }
}
