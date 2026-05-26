import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'shipper', 'admin']);
    if (auth.response) return auth.response;

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return new Response(JSON.stringify(orders), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    const body = await request.json();
    
    const newOrder = await prisma.order.create({
      data: {
        id: '#HF' + Math.floor(1000 + Math.random() * 9000), // Custom ID prefix
        customer: body.customer,
        items: body.items,
        totalItems: body.totalItems,
        totalPrice: body.totalPrice,
        status: 'pending'
      }
    });
    
    return new Response(JSON.stringify(newOrder), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['seller', 'shipper', 'admin']);
    if (auth.response) return auth.response;

    const { id, status } = await request.json();
    
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });
    
    return new Response(JSON.stringify(updatedOrder), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Order not found or failed to update' }), { status: 404 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

    const { id } = await request.json();
    
    await prisma.order.delete({
      where: { id }
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete order' }), { status: 500 });
  }
}
