import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { createDemoId, getDemoStore, isDemoMode } from '@/lib/demo/store';
import { analyzeReviewSentiment, inspectReviewModeration } from '@/lib/reviews';
import { getImageUploadError, removeUploadedImages, saveUploadedImage } from '@/lib/uploads';

const MAX_REVIEW_IMAGES = 5;

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
    sentiment: review.sentiment || 'neutral',
    sentimentScore: Number(review.sentimentScore || 0),
    sentimentReason: review.sentimentReason || '',
    customerName: review.customer?.displayName || 'Khách hàng HustFood',
    createdAt: review.createdAt instanceof Date ? review.createdAt.toISOString() : review.createdAt
  };
}

function getModerationMessage(review) {
  if (review?.status === 'hidden') {
    return 'Đánh giá đã được ghi nhận nhưng đang bị ẩn vì nội dung không phù hợp.';
  }

  return 'Đã gửi đánh giá. Cảm ơn bạn đã phản hồi.';
}

async function readReviewPayload(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.toLowerCase().includes('multipart/form-data')) {
    const formData = await request.formData();
    const imageEntries = formData.getAll('images');
    const hasInvalidImageEntry = imageEntries.some((entry) => entry && typeof entry.arrayBuffer !== 'function');

    return {
      orderId: formData.get('orderId'),
      foodRating: formData.get('foodRating'),
      shipperRating: formData.get('shipperRating'),
      comment: formData.get('comment'),
      imageFiles: imageEntries.filter((entry) => entry && typeof entry.arrayBuffer === 'function'),
      hasInvalidImageEntry,
      hasDetachedImageUrls: false
    };
  }

  const body = await request.json();

  return {
    orderId: body.orderId,
    foodRating: body.foodRating,
    shipperRating: body.shipperRating,
    comment: body.comment,
    imageFiles: [],
    hasInvalidImageEntry: false,
    hasDetachedImageUrls: Array.isArray(body.images) && body.images.length > 0
  };
}

function validateReviewImages(imageFiles, hasInvalidImageEntry, hasDetachedImageUrls) {
  if (hasDetachedImageUrls) {
    return 'Ảnh đánh giá phải được gửi cùng form đánh giá';
  }

  if (hasInvalidImageEntry) {
    return 'Danh sách ảnh đánh giá không hợp lệ';
  }

  if (imageFiles.length > MAX_REVIEW_IMAGES) {
    return 'Mỗi đánh giá chỉ được tải tối đa 5 ảnh';
  }

  const invalidFile = imageFiles.find((file) => getImageUploadError(file));
  if (invalidFile) {
    return getImageUploadError(invalidFile);
  }

  return '';
}

async function saveReviewImages(imageFiles) {
  const savedImages = [];

  try {
    for (const file of imageFiles) {
      const savedImage = await saveUploadedImage(file);
      if (savedImage.error) {
        throw new Error(savedImage.error);
      }
      savedImages.push(savedImage);
    }

    return savedImages;
  } catch (error) {
    await removeUploadedImages(savedImages);
    throw error;
  }
}

function isDuplicateReviewError(error) {
  return error?.code === 'P2002';
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

function enrichDemoReview(review) {
  if (!review || !isDemoMode()) return review;

  const store = getDemoStore();
  const customer = store.users.find((user) => user.id === review.customerId);

  return {
    ...review,
    customer: customer ? { displayName: customer.displayName } : null
  };
}

async function findReadableReviews(user, { orderId, sentiment } = {}) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.reviews
      .filter((review) => {
        if (user.role === 'admin') return true;
        if (user.role === 'seller') return review.merchantId === user.id;
        return review.customerId === user.id;
      })
      .filter((review) => !orderId || review.orderId === orderId)
      .filter((review) => !sentiment || review.sentiment === sentiment)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(enrichDemoReview);
  }

  const where = {
    ...(user.role === 'seller' ? { merchantId: user.id } : {}),
    ...(user.role === 'customer' ? { customerId: user.id } : {}),
    ...(orderId ? { orderId } : {}),
    ...(sentiment ? { sentiment } : {})
  };

  return prisma.review.findMany({
    where,
    include: {
      customer: {
        select: {
          displayName: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['customer', 'seller', 'admin']);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get('orderId') || '').trim();
    const sentiment = String(searchParams.get('sentiment') || '').trim();

    if (auth.user.role === 'customer' && !orderId) {
      return json({ error: 'Thiếu mã đơn hàng' }, 400);
    }

    if (auth.user.role === 'customer') {
      const order = await findCustomerOrder(orderId, auth.user.id);
      if (!order) {
        return json({ error: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này' }, 404);
      }

      const review = await findExistingReview(orderId, auth.user.id);
      return json({ review: sanitizeReview(enrichDemoReview(review)) });
    }

    const reviews = await findReadableReviews(auth.user, { orderId, sentiment });
    return json({ reviews: reviews.map(sanitizeReview) });
  } catch (error) {
    return json({ error: 'Không tải được đánh giá đơn hàng' }, 500);
  }
}

export async function POST(request) {
  let savedImages = [];

  try {
    const auth = await requireRole(request, ['customer']);
    if (auth.response) return auth.response;

    const payload = await readReviewPayload(request);
    const orderId = String(payload.orderId || '').trim();
    const foodRating = normalizeRating(payload.foodRating);
    const shipperRating = normalizeRating(payload.shipperRating, { required: false });
    const commentResult = normalizeComment(payload.comment);
    const imageError = validateReviewImages(
      payload.imageFiles,
      payload.hasInvalidImageEntry,
      payload.hasDetachedImageUrls
    );

    if (!orderId) {
      return json({ error: 'Thiếu mã đơn hàng' }, 400);
    }

    if (!foodRating) {
      return json({ error: 'Vui lòng chọn điểm đánh giá món ăn từ 1 đến 5 sao' }, 400);
    }

    if (commentResult.error) {
      return json({ error: commentResult.error }, 400);
    }

    if (imageError) {
      return json({ error: imageError }, 400);
    }

    const moderation = inspectReviewModeration(commentResult.comment);
    const sentiment = analyzeReviewSentiment({
      comment: commentResult.comment,
      foodRating,
      shipperRating
    });

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

    savedImages = await saveReviewImages(payload.imageFiles);
    const imageUrls = savedImages.map((image) => image.url);
    const reviewData = {
      orderId: order.id,
      customerId: auth.user.id,
      merchantId: order.merchantId || null,
      productId: null,
      shipperId: order.shipperId || null,
      foodRating,
      shipperRating,
      comment: commentResult.comment || null,
      images: imageUrls.length ? imageUrls : null,
      status: moderation.status,
      sentiment: sentiment.sentiment,
      sentimentScore: sentiment.sentimentScore,
      sentimentReason: sentiment.sentimentReason
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
      return json({
        review: sanitizeReview(review),
        moderation: {
          hidden: moderation.isViolation,
          message: getModerationMessage(review)
        }
      }, 201);
    }

    const review = await prisma.review.create({
      data: reviewData
    });

    return json({
      review: sanitizeReview(review),
      moderation: {
        hidden: moderation.isViolation,
        message: getModerationMessage(review)
      }
    }, 201);
  } catch (error) {
    await removeUploadedImages(savedImages);

    if (isDuplicateReviewError(error)) {
      return json({ error: 'Bạn đã gửi đánh giá cho đơn hàng này' }, 409);
    }

    return json({ error: 'Không gửi được đánh giá đơn hàng' }, 500);
  }
}
