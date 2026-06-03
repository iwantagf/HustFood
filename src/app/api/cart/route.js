import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeItems(items) {
  return Array.isArray(items) ? items : [];
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      const store = getDemoStore();
      const savedCart = store.savedCarts.find((cart) => cart.userId === auth.user.id);
      return json({ items: savedCart?.items || [] });
    }

    const savedCart = await prisma.savedCart.findUnique({
      where: { userId: auth.user.id }
    });

    return json({ items: savedCart?.items || [] });
  } catch (error) {
    return json({ error: 'Không tải được giỏ hàng đã lưu' }, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const items = normalizeItems(body.items);

    if (isDemoMode()) {
      const store = getDemoStore();
      let savedCart = store.savedCarts.find((cart) => cart.userId === auth.user.id);
      if (!savedCart) {
        savedCart = { userId: auth.user.id, items: [], updatedAt: new Date().toISOString() };
        store.savedCarts.push(savedCart);
      }
      savedCart.items = items;
      savedCart.updatedAt = new Date().toISOString();
      return json({ items });
    }

    await prisma.savedCart.upsert({
      where: { userId: auth.user.id },
      update: { items },
      create: {
        userId: auth.user.id,
        items
      }
    });

    return json({ items });
  } catch (error) {
    return json({ error: 'Không lưu được giỏ hàng' }, 500);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      const store = getDemoStore();
      store.savedCarts = store.savedCarts.filter((cart) => cart.userId !== auth.user.id);
      return json({ success: true });
    }

    await prisma.savedCart.deleteMany({
      where: { userId: auth.user.id }
    });

    return json({ success: true });
  } catch (error) {
    return json({ error: 'Không xóa được giỏ hàng đã lưu' }, 500);
  }
}
