import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { createDemoId, getDemoStore, isDemoMode } from '@/lib/demo/store';
import { validateImageSource } from '@/lib/imageSources';
import { formatVndPrice } from '@/lib/pricing';
import { ACTIVE_ORDER_STATUS_VALUES } from '@/lib/statuses';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function splitOptionText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOptions(options = {}) {
  return {
    sizes: splitOptionText(options.sizes),
    toppings: splitOptionText(options.toppings),
    tastes: splitOptionText(options.tastes),
    allowNote: options.allowNote !== false
  };
}

function normalizeProductPayload(body) {
  const requiredFields = ['name', 'desc', 'price'];
  const missingField = requiredFields.find((field) => !String(body[field] || '').trim());
  const imageResult = validateImageSource(body.image);

  if (missingField) {
    return { error: `Thiếu trường bắt buộc: ${missingField}` };
  }

  if (imageResult.error) {
    return { error: imageResult.error };
  }

  return {
    data: {
      name: String(body.name).trim(),
      desc: String(body.desc).trim(),
      price: formatVndPrice(body.price),
      image: imageResult.image,
      categoryId: String(body.categoryId || '').trim() || null,
      options: normalizeOptions(body.options),
      isAvailable: body.isAvailable !== false,
      isHidden: Boolean(body.isHidden)
    }
  };
}

function canManageProduct(user, product) {
  return user.role === 'admin' || product.ownerId === user.id;
}

function orderIncludesProduct(order, productId) {
  if (!ACTIVE_ORDER_STATUS_VALUES.includes(order.status)) return false;

  const items = Array.isArray(order.items) ? order.items : [];
  return items.some((item) => item?.id === productId);
}

function attachCategory(products, categories) {
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return products.map((product) => ({
    ...product,
    category: product.category || categoryById.get(product.categoryId) || null
  }));
}

async function categoryIsAllowed({ categoryId, user }) {
  if (!categoryId) return true;

  if (isDemoMode()) {
    const store = getDemoStore();
    const category = store.menuCategories.find((item) => item.id === categoryId);
    return Boolean(category && (user.role === 'admin' || category.ownerId === user.id));
  }

  const category = await prisma.menuCategory.findUnique({
    where: { id: categoryId },
    select: { ownerId: true }
  });

  return Boolean(category && (user.role === 'admin' || category.ownerId === user.id));
}

async function productIsInActiveOrder(productId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.orders.some((order) => orderIncludesProduct(order, productId));
  }

  const orders = await prisma.order.findMany({
    select: { items: true, status: true }
  });

  return orders.some((order) => orderIncludesProduct(order, productId));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    let auth = null;

    if (scope === 'mine') {
      auth = await requireRole(request, ['seller']);
      if (auth.response) return auth.response;
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const products = scope === 'mine'
        ? store.products.filter((product) => product.ownerId === auth.user.id)
        : store.products;

      return json(attachCategory(products, store.menuCategories));
    }

    const products = await prisma.product.findMany({
      where: scope === 'mine' ? { ownerId: auth.user.id } : undefined,
      include: { category: true },
      orderBy: { createdAt: 'desc' }
    });
    return json(products);
  } catch (error) {
    return json({ error: 'Failed to fetch products' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['admin', 'seller']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { data, error } = normalizeProductPayload(body);

    if (error) {
      return json({ error }, 400);
    }

    if (!(await categoryIsAllowed({ categoryId: data.categoryId, user: auth.user }))) {
      return json({ error: 'Danh mục không thuộc cửa hàng của bạn' }, 403);
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const newProduct = {
        id: createDemoId('demo-product'),
        ownerId: auth.user.role === 'seller' ? auth.user.id : null,
        ...data,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      store.products.unshift(newProduct);

      return json(attachCategory([newProduct], store.menuCategories)[0], 201);
    }

    const newProduct = await prisma.product.create({
      data: {
        ...data,
        ownerId: auth.user.role === 'seller' ? auth.user.id : null
      },
      include: { category: true }
    });
    
    return json(newProduct, 201);
  } catch (error) {
    return json({ error: 'Failed to create product' }, 500);
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['admin', 'seller']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const { id } = body;
    const { data, error } = normalizeProductPayload(body);

    if (!id) {
      return json({ error: 'Thiếu mã món ăn' }, 400);
    }

    if (error) {
      return json({ error }, 400);
    }

    if (!(await categoryIsAllowed({ categoryId: data.categoryId, user: auth.user }))) {
      return json({ error: 'Danh mục không thuộc cửa hàng của bạn' }, 403);
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const product = store.products.find((item) => item.id === id);

      if (!product) {
        return json({ error: 'Không tìm thấy món ăn' }, 404);
      }

      if (!canManageProduct(auth.user, product)) {
        return json({ error: 'Bạn chỉ được sửa món của cửa hàng mình' }, 403);
      }

      Object.assign(product, {
        ...data,
        updatedAt: new Date().toISOString()
      });

      return json(attachCategory([product], store.menuCategories)[0]);
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, ownerId: true }
    });

    if (!product) {
      return json({ error: 'Không tìm thấy món ăn' }, 404);
    }

    if (!canManageProduct(auth.user, product)) {
      return json({ error: 'Bạn chỉ được sửa món của cửa hàng mình' }, 403);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
      include: { category: true }
    });

    return json(updatedProduct);
  } catch (error) {
    return json({ error: 'Failed to update product' }, 500);
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['admin', 'seller']);
    if (auth.response) return auth.response;

    const { id } = await request.json();

    if (isDemoMode()) {
      const store = getDemoStore();
      const product = store.products.find((item) => item.id === id);

      if (!product) {
        return json({ error: 'Không tìm thấy món ăn' }, 404);
      }

      if (!canManageProduct(auth.user, product)) {
        return json({ error: 'Bạn chỉ được xóa món của cửa hàng mình' }, 403);
      }

      if (await productIsInActiveOrder(id)) {
        return json({ error: 'Món đang nằm trong đơn đang xử lý. Hãy chuyển sang Hết hàng hoặc Ẩn món.' }, 409);
      }

      store.products = store.products.filter((product) => product.id !== id);

      return json({ success: true });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, ownerId: true }
    });

    if (!product) {
      return json({ error: 'Không tìm thấy món ăn' }, 404);
    }

    if (!canManageProduct(auth.user, product)) {
      return json({ error: 'Bạn chỉ được xóa món của cửa hàng mình' }, 403);
    }

    if (await productIsInActiveOrder(id)) {
      return json({ error: 'Món đang nằm trong đơn đang xử lý. Hãy chuyển sang Hết hàng hoặc Ẩn món.' }, 409);
    }

    await prisma.product.delete({
      where: { id }
    });
    
    return json({ success: true });
  } catch (error) {
    return json({ error: 'Failed to delete product' }, 500);
  }
}
