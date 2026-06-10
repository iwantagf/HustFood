import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSignedJwt,
  getAuthSecret,
  verifySignedJwt
} from '../src/lib/auth/jwt.js';

const TEST_SECRET = 'test-secret-with-at-least-32-characters';

test('creates and verifies a signed JWT with expected claims', () => {
  const token = createSignedJwt(
    { sub: 'user-1', role: 'customer' },
    {
      expiresInSeconds: 60,
      tokenType: 'session',
      secret: TEST_SECRET,
      now: 1000
    }
  );

  const payload = verifySignedJwt(token, {
    tokenType: 'session',
    secret: TEST_SECRET,
    now: 1010
  });

  assert.equal(payload.sub, 'user-1');
  assert.equal(payload.role, 'customer');
  assert.equal(payload.tokenType, 'session');
  assert.equal(payload.iss, 'hustfood');
  assert.equal(payload.aud, 'hustfood-web');
  assert.equal(typeof payload.jti, 'string');
});

test('rejects tampered JWT payloads', () => {
  const token = createSignedJwt(
    { sub: 'user-1', role: 'customer' },
    {
      expiresInSeconds: 60,
      tokenType: 'session',
      secret: TEST_SECRET,
      now: 1000
    }
  );
  const [header, , signature] = token.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({
    sub: 'user-1',
    role: 'admin',
    iss: 'hustfood',
    aud: 'hustfood-web',
    tokenType: 'session',
    iat: 1000,
    exp: 1060,
    jti: 'tampered'
  })).toString('base64url');

  assert.equal(
    verifySignedJwt(`${header}.${tamperedPayload}.${signature}`, {
      tokenType: 'session',
      secret: TEST_SECRET,
      now: 1010
    }),
    null
  );
});

test('rejects expired or wrong-type JWTs', () => {
  const token = createSignedJwt(
    { sub: 'user-1' },
    {
      expiresInSeconds: 60,
      tokenType: 'session',
      secret: TEST_SECRET,
      now: 1000
    }
  );

  assert.equal(
    verifySignedJwt(token, {
      tokenType: 'session',
      secret: TEST_SECRET,
      now: 1091
    }),
    null
  );
  assert.equal(
    verifySignedJwt(token, {
      tokenType: 'oauth_temp',
      secret: TEST_SECRET,
      now: 1010
    }),
    null
  );
});

test('requires a strong AUTH_SECRET in production', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAuthSecret = process.env.AUTH_SECRET;
  const originalNextAuthSecret = process.env.NEXTAUTH_SECRET;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_SECRET;
    delete process.env.NEXTAUTH_SECRET;

    assert.throws(() => getAuthSecret(), /AUTH_SECRET is required/);

    process.env.AUTH_SECRET = 'short';
    assert.throws(() => getAuthSecret(), /at least 32 characters/);
  } finally {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }

    if (originalNextAuthSecret === undefined) {
      delete process.env.NEXTAUTH_SECRET;
    } else {
      process.env.NEXTAUTH_SECRET = originalNextAuthSecret;
    }
  }
});
