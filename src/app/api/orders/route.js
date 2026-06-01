import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';
import { calculateOrderTotals } from '@/lib/pricing';

const SELLER_STATUSES = ['pending', 'ready_for_pickup', 'rejected'];
const SHIPPER_STATUSES = ['picked_up', 'delivering', 'completed'];
const LEGACY_SHIPPER_READY_STATUSES = ['processing'];

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

  const quantityByProductId = new Map();

  for (const item of rawItems) {
    const id = String(item?.id || '').trim();
    const quantity = Number(item?.quantity);

    if (!id || !Number.isInteger(quantity) || quantity <= 0) {
      return { error: 'Dữ liệu món trong giỏ hàng không hợp lệ' };
    }

    quantityByProductId.set(id, (quantityByProductId.get(id) || 0) + quantity);
  }

  return {
    items: Array.from(quantityByProductId, ([id, quantity]) => ({ id, quantity }))
  };
}

function buildOrderCreateData(body, products) {
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
      quantity: item.quantity
    };
  });

  const { totalPrice, deliveryFee, finalTotal } = calculateOrderTotals(items);

  return {
    data: {
      customer: {
        ...(body.customer || {}),
        deliveryFee,
        finalTotal
      },
      items,
      totalItems: items.reduce((total, item) => total + item.quantity, 0),
      totalPrice
    }
  };
}

async function getOrderProducts(productIds) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.products.filter((product) => productIds.includes(product.id));
  }

  return prisma.product.findMany({
    where: {
      id: {
        in: productIds
      }
    }
  });
}

function buildOrderRecord(orderData, extraData = {}) {
  return {
    ...extraData,
    customer: {
      ...orderData.customer
    },
    items: orderData.items,
    totalItems: orderData.totalItems,
    totalPrice: orderData.totalPrice,
    status: 'pending'
  };
}

function buildOrderUpdate({ order, status, action, user }) {
  const update = {};
  const now = new Date();

  if (action === 'accept') {
    if (!['ready_for_pickup', ...LEGACY_SHIPPER_READY_STATUSES].includes(order.status)) {
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
    if (!SELLER_STATUSES.includes(status) && !(user.role === 'admin' && status === 'completed')) {
      return { error: 'Trạng thái này không thuộc luồng xử lý của người bán' };
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

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'shipper', 'admin']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      const store = getDemoStore();
      return json(store.orders);
    }

    const orders = await prisma.order.findMany({
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
    const orderResult = buildOrderCreateData(body, products);
    if (orderResult.error) return json({ error: orderResult.error }, 400);

    const orderData = orderResult.data;

    if (isDemoMode()) {
      const store = getDemoStore();
      const newOrder = buildOrderRecord(orderData, {
        id: '#HF' + Math.floor(1000 + Math.random() * 9000),
        shipperId: null,
        shipperName: null,
        acceptedAt: null,
        pickedUpAt: null,
        deliveredAt: null,
        createdAt: new Date().toISOString()
      });
      store.orders.unshift(newOrder);

      return json(newOrder, 201);
    }
    
    const newOrder = await prisma.order.create({
      data: buildOrderRecord(orderData, {
        id: '#HF' + Math.floor(1000 + Math.random() * 9000) // Custom ID prefix
      })
    });
    
    return json(newOrder, 201);
  } catch (error) {
    return json({ error: 'Failed to create order' }, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['seller', 'shipper', 'admin']);
    if (auth.response) return auth.response;

    const { id, status, action } = await request.json();

    if (!id) {
      return json({ error: 'Thiếu mã đơn hàng' }, 400);
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const order = store.orders.find((item) => item.id === id);
      if (!order) {
        return json({ error: 'Order not found' }, 404);
      }

      const result = buildOrderUpdate({ order, status, action, user: auth.user });
      if (result.error) return json({ error: result.error }, 400);

      Object.assign(order, result.update);
      return json(order);
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return json({ error: 'Order not found' }, 404);

    const result = buildOrderUpdate({ order, status, action, user: auth.user });
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
      store.orders = store.orders.filter((order) => order.id !== id);

      return json({ success: true });
    }
    
    await prisma.order.delete({
      where: { id }
    });
    
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete order' }, 500);
  }
}
