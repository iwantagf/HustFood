import assert from 'node:assert/strict';
import test from 'node:test';
import { moderateReviewComment } from '../src/lib/reviewModeration.js';

test('review moderation keeps clean comments visible', () => {
  assert.equal(moderateReviewComment('Đồ ăn ngon, giao hàng nhanh.').status, 'visible');
});

test('review moderation hides blocked language', () => {
  const result = moderateReviewComment('Dịch vụ quá dở, địt mẹ.');

  assert.equal(result.status, 'hidden');
  assert.equal(result.reason, 'blocked_language');
});
