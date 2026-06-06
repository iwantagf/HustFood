export function normalizeReviewImages(images) {
  if (Array.isArray(images)) {
    return images.map((image) => String(image || '').trim()).filter(Boolean);
  }

  return [];
}

export function serializeReview(review) {
  return {
    id: review.id,
    orderId: review.orderId || null,
    customerId: review.customerId || null,
    customerName: review.customer?.displayName || 'Khách hàng HustFood',
    merchantId: review.merchantId || null,
    productId: review.productId || null,
    productName: review.product?.name || review.productName || '',
    shipperId: review.shipperId || null,
    foodRating: Number(review.foodRating || 0),
    shipperRating: review.shipperRating ? Number(review.shipperRating) : null,
    comment: String(review.comment || '').trim(),
    images: normalizeReviewImages(review.images),
    status: review.status || 'visible',
    createdAt: review.createdAt instanceof Date
      ? review.createdAt.toISOString()
      : review.createdAt || null
  };
}

export function getVisibleReviews(reviews = []) {
  return reviews.filter((review) => review?.status === 'visible');
}

export function hydrateDemoReviews(reviews = [], { users = [], products = [] } = {}) {
  const userById = new Map(users.map((user) => [user.id, user]));
  const productById = new Map(products.map((product) => [product.id, product]));

  return getVisibleReviews(reviews).map((review) => serializeReview({
    ...review,
    customer: userById.get(review.customerId) || null,
    product: productById.get(review.productId) || null
  }));
}

function getAverage(values) {
  const ratings = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (!ratings.length) return 0;

  return ratings.reduce((total, value) => total + value, 0) / ratings.length;
}

export function createReviewStats(reviews = []) {
  const visibleReviews = getVisibleReviews(reviews);

  return {
    count: visibleReviews.length,
    averageFoodRating: getAverage(visibleReviews.map((review) => review.foodRating)),
    averageShipperRating: getAverage(visibleReviews.map((review) => review.shipperRating)),
    imageCount: visibleReviews.reduce((total, review) => total + normalizeReviewImages(review.images).length, 0)
  };
}

export function attachProductReviewStats(products = [], reviews = []) {
  const visibleReviews = getVisibleReviews(reviews);
  const reviewsByProductId = new Map();

  visibleReviews.forEach((review) => {
    if (!review.productId) return;
    const productReviews = reviewsByProductId.get(review.productId) || [];
    productReviews.push(review);
    reviewsByProductId.set(review.productId, productReviews);
  });

  return products.map((product) => {
    const productReviews = reviewsByProductId.get(product.id) || [];

    return {
      ...product,
      reviewStats: createReviewStats(productReviews),
      recentReviews: productReviews.slice(0, 2)
    };
  });
}
