import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';
import { SHIPPER_READY_STATUS_VALUES } from '@/lib/statuses';

function canReadOrder(order, user) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return order.customerId === user.id;
  if (user.role === 'seller') return order.merchantId === user.id;
  if (user.role === 'shipper') {
    return (
      (SHIPPER_READY_STATUS_VALUES.includes(order.status) && !order.shipperId)
      || order.shipperId === user.id
    );
  }
  return false;
}

async function getReadableOrders({ user, id }) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.orders
      .filter((order) => canReadOrder(order, user))
      .filter((order) => !id || order.id === id);
  }

  const where = user.role === 'customer'
    ? { customerId: user.id }
    : user.role === 'seller'
      ? { merchantId: user.id }
      : user.role === 'shipper'
        ? {
          OR: [
            { status: { in: SHIPPER_READY_STATUS_VALUES }, shipperId: null },
            { shipperId: user.id }
          ]
        }
        : undefined;

  return prisma.order.findMany({
    where: id ? { AND: [where || {}, { id }] } : where,
    orderBy: { createdAt: 'desc' }
  });
}

export async function GET(request) {
  const auth = await requireRole(request, ['customer', 'seller', 'shipper', 'admin']);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      const send = async () => {
        if (closed) return;

        try {
          const orders = await getReadableOrders({ user: auth.user, id });
          controller.enqueue(encoder.encode(`event: orders\ndata: ${JSON.stringify(orders)}\n\n`));
        } catch (error) {
          controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Không tải được trạng thái đơn' })}\n\n`));
        }
      };

      await send();
      const interval = setInterval(send, 5000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
