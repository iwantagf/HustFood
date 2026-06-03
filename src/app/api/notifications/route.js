import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      const store = getDemoStore();
      const notifications = store.notifications.filter((notification) => (
        !notification.ownerId || notification.ownerId === auth.user.id
      ));
      return new Response(JSON.stringify(notifications), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { ownerId: null },
          { ownerId: auth.user.id }
        ]
      },
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

    if (isDemoMode()) {
      const store = getDemoStore();
      if (id === 'all') {
        store.notifications
          .filter((notification) => !notification.ownerId || notification.ownerId === auth.user.id)
          .forEach((notification) => {
            notification.read = true;
          });
      } else {
        const notification = store.notifications.find((item) => (
          item.id === id && (!item.ownerId || item.ownerId === auth.user.id)
        ));
        if (notification) notification.read = true;
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (id === 'all') {
      await prisma.notification.updateMany({
        where: {
          OR: [
            { ownerId: null },
            { ownerId: auth.user.id }
          ]
        },
        data: { read: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: {
          id,
          OR: [
            { ownerId: null },
            { ownerId: auth.user.id }
          ]
        },
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
