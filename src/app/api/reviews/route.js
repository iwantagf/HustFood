import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { createDemoId, getDemoStore, isDemoMode } from '@/lib/demo/store';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeRating(value, { required = true } = {}) {
  if ((value === null || value === undefined || value === '') && !required) {
    return null;
  }

  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return null;
  }

  return rating;
}

function normalizeComment(value) {
  const comment = String(value || '').trim();

  if (comment.length > 1000) {
    return { error: 'Bình luận không được vượt quá 1000 ký tự' };
  }

  return { comment };
}

function normalizeImages(value) {
  const rawImages = Array.isArray(value) ? value : [];
  const images = [...new Set(rawImages.map((image) => String(image || '').trim()).filter(Boolean))];

  if (images.length > 5) {
    return { error: 'Mỗi đánh giá chỉ được tải tối đa 5 ảnh' };
  }

  const hasInvalidImage = images.some((image) => !/^\/uploads\/[a-zA-Z0-9._-]+$/.test(image));
  if (hasInvalidImage) {
    return { error: 'Danh sách ảnh đánh giá không hợp lệ' };
  }

  return { images };
}

function sanitizeReview(review) {
  if (!review) return null;

  return {
    id: review.id,
    orderId: review.orderId,
    customerId: review.customerId,
    merchantId: review.merchantId,
    productId: review.productId,
    shipperId: review.shipperId,
    foodRating: review.foodRating,
    shipperRating: review.shipperRating,
    comment: review.comment || '',
    images: Array.isArray(review.images) ? review.images : [],
    status: review.status,
    createdAt: review.createdAt
  };
}

async function findCustomerOrder(orderId, customerId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.orders.find((order) => order.id === orderId && order.customerId === customerId) || null;
  }

  return prisma.order.findFirst({
    where: {
      id: orderId,
      customerId
    }
  });
}

async function findExistingReview(orderId, customerId) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.reviews.find((review) => (
      review.orderId === orderId && review.customerId === customerId
    )) || null;
  }

  return prisma.review.findFirst({
    where: {
      orderId,
      customerId
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get('orderId') || '').trim();

    if (!orderId) {
      return json({ error: 'Thiếu mã đơn hàng' }, 400);
    }

    const order = await findCustomerOrder(orderId, auth.user.id);
    if (!order) {
      return json({ error: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này' }, 404);
    }

    const review = await findExistingReview(orderId, auth.user.id);
    return json({ review: sanitizeReview(review) });
  } catch (error) {
    return json({ error: 'Không tải được đánh giá đơn hàng' }, 500);
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const orderId = String(body.orderId || '').trim();
    const foodRating = normalizeRating(body.foodRating);
    const shipperRating = normalizeRating(body.shipperRating, { required: false });
    const commentResult = normalizeComment(body.comment);
    const imageResult = normalizeImages(body.images);

    if (!orderId) {
      return json({ error: 'Thiếu mã đơn hàng' }, 400);
    }

    if (!foodRating) {
      return json({ error: 'Vui lòng chọn điểm đánh giá món ăn từ 1 đến 5 sao' }, 400);
    }

    if (commentResult.error) {
      return json({ error: commentResult.error }, 400);
    }

    if (imageResult.error) {
      return json({ error: imageResult.error }, 400);
    }

    const order = await findCustomerOrder(orderId, auth.user.id);
    if (!order) {
      return json({ error: 'Không tìm thấy đơn hàng hoặc bạn không có quyền đánh giá đơn này' }, 404);
    }

    if (order.status !== 'completed') {
      return json({ error: 'Chỉ có thể đánh giá sau khi đơn đã hoàn thành' }, 400);
    }

    if (await findExistingReview(orderId, auth.user.id)) {
      return json({ error: 'Bạn đã gửi đánh giá cho đơn hàng này' }, 409);
    }

    const reviewData = {
      orderId: order.id,
      customerId: auth.user.id,
      merchantId: order.merchantId || null,
      productId: null,
      shipperId: order.shipperId || null,
      foodRating,
      shipperRating,
      comment: commentResult.comment || null,
      images: imageResult.images.length ? imageResult.images : null,
      status: 'visible'
    };

    if (isDemoMode()) {
      const store = getDemoStore();
      const review = {
        id: createDemoId('demo-review'),
        ...reviewData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      store.reviews.unshift(review);
      return json({ review: sanitizeReview(review) }, 201);
    }

    const review = await prisma.review.create({
      data: reviewData
    });

    return json({ review: sanitizeReview(review) }, 201);
  } catch (error) {
    return json({ error: 'Không gửi được đánh giá đơn hàng' }, 500);
  }
}
