const VISIBLE_REVIEW_STATUS = 'visible';
const HIDDEN_REVIEW_STATUS = 'hidden';
const REVIEW_PROFANITY_TOKENS = new Set([
  'dit',
  'djt',
  'dm',
  'dcm',
  'dkm',
  'dmm',
  'vcl',
  'vl',
  'clgt'
]);
const REVIEW_PROFANITY_PHRASES = [
  'dit me',
  'djt me',
  'du ma',
  'du me',
  'duma',
  'dume',
  'ditmemay',
  'dumemay',
  'dumamay',
  'con cac',
  'cai lon',
  'nhu lon'
];
const NEGATIVE_SENTIMENT_TERMS = new Set([
  'te',
  'chan',
  'bad',
  'fail',
  'lau',
  'nguoi',
  'kho',
  'lanh',
  'nhat',
  'do',
  'hong',
  'loi',
  'kem',
  'thatvong'
]);
const NEGATIVE_SENTIMENT_PHRASES = [
  'qua te',
  'rat te',
  'khong ngon',
  'khong hai long',
  'that vong',
  'giao cham',
  'do an nguoi',
  'do an lanh',
  'dong goi kem',
  'phuc vu te',
  'khong quay lai'
];
const POSITIVE_SENTIMENT_TERMS = new Set([
  'ngon',
  'tot',
  'ok',
  'nhanh',
  'thich',
  'sach',
  'nong',
  'on',
  'tuyet',
  'xuat',
  'sac'
]);
const POSITIVE_SENTIMENT_PHRASES = [
  'rat ngon',
  'qua ngon',
  'hai long',
  'giao nhanh',
  'do an ngon',
  'dong goi dep',
  'se quay lai',
  'tuyet voi',
  'xuat sac'
];

export function normalizeReviewImages(images) {
  if (Array.isArray(images)) {
    return images.map((image) => String(image || '').trim()).filter(Boolean);
  }

  return [];
}

function normalizeModerationText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function inspectReviewModeration(comment) {
  const normalized = normalizeModerationText(comment);
  if (!normalized) {
    return {
      status: VISIBLE_REVIEW_STATUS,
      isViolation: false,
      matchedTerms: []
    };
  }

  const compact = normalized.replace(/\s+/g, '');
  const tokens = normalized.split(' ');
  const matchedTerms = [
    ...tokens.filter((token) => REVIEW_PROFANITY_TOKENS.has(token)),
    ...REVIEW_PROFANITY_PHRASES.filter((phrase) => normalized.includes(phrase) || compact.includes(phrase))
  ];

  return {
    status: matchedTerms.length ? HIDDEN_REVIEW_STATUS : VISIBLE_REVIEW_STATUS,
    isViolation: matchedTerms.length > 0,
    matchedTerms: [...new Set(matchedTerms)]
  };
}

export function analyzeReviewSentiment({ comment = '', foodRating = 0, shipperRating = null } = {}) {
  const normalized = normalizeModerationText(comment);
  const compact = normalized.replace(/\s+/g, '');
  const tokens = normalized ? normalized.split(' ') : [];
  const ratingValues = [foodRating, shipperRating]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((total, value) => total + value, 0) / ratingValues.length
    : 0;

  const negativeMatches = [
    ...tokens.filter((token) => NEGATIVE_SENTIMENT_TERMS.has(token)),
    ...NEGATIVE_SENTIMENT_PHRASES.filter((phrase) => normalized.includes(phrase) || compact.includes(phrase.replace(/\s+/g, '')))
  ];
  const positiveMatches = [
    ...tokens.filter((token) => POSITIVE_SENTIMENT_TERMS.has(token)),
    ...POSITIVE_SENTIMENT_PHRASES.filter((phrase) => normalized.includes(phrase) || compact.includes(phrase.replace(/\s+/g, '')))
  ];

  let score = 0;
  if (averageRating > 0) {
    score += (averageRating - 3) * 0.35;
  }
  score += positiveMatches.length * 0.35;
  score -= negativeMatches.length * 0.45;

  const sentiment = score <= -0.35 || averageRating <= 2
    ? 'negative'
    : score >= 0.35 || averageRating >= 4.5
      ? 'positive'
      : 'neutral';

  return {
    sentiment,
    sentimentScore: Math.max(-1, Math.min(1, Number(score.toFixed(2)))),
    sentimentReason: [
      averageRating ? `rating:${averageRating.toFixed(1)}` : '',
      positiveMatches.length ? `positive:${[...new Set(positiveMatches)].join(',')}` : '',
      negativeMatches.length ? `negative:${[...new Set(negativeMatches)].join(',')}` : ''
    ].filter(Boolean).join(' | ') || 'rule:neutral'
  };
}

export function serializeReview(review) {
  return {
    id: review.id,
    orderId: review.orderId || null,
    customerId: review.customerId || null,
    customerName: review.customer?.displayName || 'Khách hàng HustFood',
    merchantId: review.merchantId || null,
    productId: review.productId || null,
    shipperId: review.shipperId || null,
    foodRating: Number(review.foodRating || 0),
    shipperRating: review.shipperRating ? Number(review.shipperRating) : null,
    comment: String(review.comment || '').trim(),
    images: normalizeReviewImages(review.images),
    status: review.status || VISIBLE_REVIEW_STATUS,
    sentiment: review.sentiment || 'neutral',
    sentimentScore: Number(review.sentimentScore || 0),
    sentimentReason: review.sentimentReason || '',
    createdAt: review.createdAt instanceof Date
      ? review.createdAt.toISOString()
      : review.createdAt || null
  };
}

export function getVisibleReviews(reviews = []) {
  return reviews.filter((review) => review?.status === VISIBLE_REVIEW_STATUS);
}

export function hydrateDemoReviews(reviews = [], { users = [] } = {}) {
  const userById = new Map(users.map((user) => [user.id, user]));

  return getVisibleReviews(reviews).map((review) => serializeReview({
    ...review,
    customer: userById.get(review.customerId) || null
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
