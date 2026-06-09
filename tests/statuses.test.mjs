import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACTIVE_ORDER_STATUS_VALUES,
  ORDER_STATUSES,
  SHIPPER_READY_STATUS_VALUES
} from '../src/lib/statuses.js';

test('order statuses include SRS workflow values', () => {
  assert.equal(ORDER_STATUSES.PENDING, 'pending');
  assert.equal(ORDER_STATUSES.READY_FOR_PICKUP, 'ready_for_pickup');
  assert.equal(ORDER_STATUSES.COMPLETED, 'completed');
});

test('shipper ready statuses keep legacy processing compatibility', () => {
  assert.deepEqual(SHIPPER_READY_STATUS_VALUES, ['ready_for_pickup', 'processing']);
});

test('active order statuses block deleting products in open orders', () => {
  assert.equal(ACTIVE_ORDER_STATUS_VALUES.includes('delivering'), true);
  assert.equal(ACTIVE_ORDER_STATUS_VALUES.includes('completed'), false);
});
