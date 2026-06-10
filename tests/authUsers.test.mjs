import assert from 'node:assert/strict';
import test from 'node:test';
import { getUsernameError, normalizeUsername } from '../src/lib/auth/users.js';

test('normalizes usernames for registration', () => {
  assert.equal(normalizeUsername('  User_01  '), 'user_01');
});

test('rejects invalid usernames', () => {
  assert.equal(getUsernameError('ab'), 'Username phải có ít nhất 3 ký tự');
  assert.equal(getUsernameError('bad-name'), 'Username chỉ được dùng chữ thường, số và dấu gạch dưới');
});

test('accepts valid usernames', () => {
  assert.equal(getUsernameError('seller_01'), '');
});
