import assert from 'node:assert/strict';
import test from 'node:test';
import { formatVndPrice, parsePriceToNumber } from '../src/lib/pricing.js';

test('formats plain numeric prices as Vietnamese dong', () => {
  assert.equal(formatVndPrice('50000'), '50.000đ');
  assert.equal(formatVndPrice(65000), '65.000đ');
});

test('keeps formatted Vietnamese prices stable', () => {
  assert.equal(formatVndPrice('85.000đ'), '85.000đ');
});

test('parses formatted Vietnamese prices for totals', () => {
  assert.equal(parsePriceToNumber('50.000đ'), 50000);
});
