import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { createDemoId, getDemoStore, isDemoMode } from '@/lib/demo/store';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeCategoryPayload(body) {
  const name = String(body.name || '').trim();

  if (!name) {
    return { error: 'Thiếu tên danh mục' };
  }

  return { data: { name } };
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    if (isDemoMode()) {
      const store = getDemoStore();
      const categories = scope === 'mine'
        ? store.menuCategories.filter((category) => category.ownerId === auth.user.id)
        : store.menuCategories;

      return json(categories);
    }

    const categories = await prisma.menuCategory.findMany({
      where: scope === 'mine' ? { ownerId: auth.user.id } : undefined,
      orderBy: { createdAt: 'asc' }
    });

    return json(categories);
  } catch (error) {
    return json({ error: 'Không tải được danh mục thực đơn' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { data, error } = normalizeCategoryPayload(body);

    if (error) {
      return json({ error }, 400);
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const category = {
        id: createDemoId('demo-category'),
        ownerId: auth.user.role === 'seller' ? auth.user.id : null,
        ...data,
        createdAt: new Date().toISOString()
      };
      store.menuCategories.push(category);

      return json(category, 201);
    }

    const category = await prisma.menuCategory.create({
      data: {
        ...data,
        ownerId: auth.user.role === 'seller' ? auth.user.id : null
      }
    });

    return json(category, 201);
  } catch (error) {
    return json({ error: 'Không tạo được danh mục thực đơn' }, 500);
  }
}
