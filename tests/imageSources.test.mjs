import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PRODUCT_IMAGE,
  normalizeImageSource,
  validateImageSource
} from '../src/lib/imageSources.js';

test('image source validation rejects local filesystem paths', () => {
  const result = validateImageSource('/Downloads/Khmer_Prince.png');

  assert.equal(typeof result.error, 'string');
});

test('image source validation accepts data image URLs', () => {
  const result = validateImageSource('data:image/png;base64,aaaa');

  assert.equal(result.image, 'data:image/png;base64,aaaa');
});

test('image source normalization falls back for unsupported paths', () => {
  assert.equal(normalizeImageSource('/Downloads/Khmer_Prince.png'), DEFAULT_PRODUCT_IMAGE);
});
