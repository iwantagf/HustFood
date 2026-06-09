export const REVIEW_MODERATION_STATUSES = Object.freeze({
  VISIBLE: 'visible',
  HIDDEN: 'hidden'
});

const RAW_BLOCKED_TERMS = [
  'địt',
  'đụ',
  'đéo',
  'lồn',
  'cặc'
];

const NORMALIZED_BLOCKED_PATTERNS = [
  /\bdm\b/,
  /\bdmm\b/,
  /\bdit\b/,
  /\bcac\b/,
  /\bdeo\b/,
  /\bloz\b/,
  /\bl0n\b/,
  /\bfuck\b/,
  /\bshit\b/
];

export function normalizeReviewModerationText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function findBlockedReviewLanguage(value) {
  const rawText = String(value || '').toLowerCase();
  const rawTerm = RAW_BLOCKED_TERMS.find((term) => rawText.includes(term));
  if (rawTerm) return rawTerm;

  const normalizedText = normalizeReviewModerationText(value);
  const normalizedPattern = NORMALIZED_BLOCKED_PATTERNS.find((pattern) => pattern.test(normalizedText));
  return normalizedPattern ? normalizedPattern.source : '';
}

export function moderateReviewComment(value) {
  const blockedTerm = findBlockedReviewLanguage(value);

  return {
    status: blockedTerm ? REVIEW_MODERATION_STATUSES.HIDDEN : REVIEW_MODERATION_STATUSES.VISIBLE,
    reason: blockedTerm ? 'blocked_language' : null
  };
}
