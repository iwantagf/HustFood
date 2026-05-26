import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller']);
    if (auth.response) return auth.response;

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return new Response(JSON.stringify(notifications), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch notifications' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['seller']);
    if (auth.response) return auth.response;

    const { id } = await request.json();
    
    if (id === 'all') {
      await prisma.notification.updateMany({
        data: { read: true }
      });
    } else {
      await prisma.notification.update({
        where: { id },
        data: { read: true }
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update notification' }), { status: 500 });
  }
}
