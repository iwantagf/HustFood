import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

export const JWT_ISSUER = 'hustfood';
export const JWT_AUDIENCE = 'hustfood-web';

const DEFAULT_DEV_AUTH_SECRET = 'hustfood-dev-session-secret';
const MIN_PRODUCTION_SECRET_LENGTH = 32;

function base64UrlEncodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecodeJson(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function signJwtInput(unsignedToken, secret) {
  return createHmac('sha256', secret).update(unsignedToken).digest('base64url');
}

function safeEqualString(a, b) {
  const actual = Buffer.from(String(a || ''));
  const expected = Buffer.from(String(b || ''));

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function getAuthSecret() {
  const configuredSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (configuredSecret) {
    if (process.env.NODE_ENV === 'production' && configuredSecret.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error(`AUTH_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production.`);
    }

    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production.');
  }

  return DEFAULT_DEV_AUTH_SECRET;
}

export function createSignedJwt(
  payload,
  {
    expiresInSeconds,
    tokenType,
    issuer = JWT_ISSUER,
    audience = JWT_AUDIENCE,
    secret = getAuthSecret(),
    now = Math.floor(Date.now() / 1000)
  } = {}
) {
  if (!expiresInSeconds || expiresInSeconds <= 0) {
    throw new Error('expiresInSeconds must be a positive number.');
  }

  if (!tokenType) {
    throw new Error('tokenType is required.');
  }

  const header = base64UrlEncodeJson({ alg: 'HS256', typ: 'JWT' });
  const jwtPayload = base64UrlEncodeJson({
    ...payload,
    iss: issuer,
    aud: audience,
    tokenType,
    iat: now,
    exp: now + expiresInSeconds,
    jti: randomUUID()
  });
  const unsignedToken = `${header}.${jwtPayload}`;

  return `${unsignedToken}.${signJwtInput(unsignedToken, secret)}`;
}

export function verifySignedJwt(
  token,
  {
    tokenType,
    issuer = JWT_ISSUER,
    audience = JWT_AUDIENCE,
    secret = getAuthSecret(),
    now = Math.floor(Date.now() / 1000),
    clockToleranceSeconds = 30
  } = {}
) {
  if (!token || typeof token !== 'string' || !tokenType) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signature] = parts;
  const expectedSignature = signJwtInput(`${headerPart}.${payloadPart}`, secret);

  if (!safeEqualString(signature, expectedSignature)) {
    return null;
  }

  try {
    const header = base64UrlDecodeJson(headerPart);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    const payload = base64UrlDecodeJson(payloadPart);
    if (
      payload.iss !== issuer
      || payload.aud !== audience
      || payload.tokenType !== tokenType
      || typeof payload.exp !== 'number'
      || typeof payload.iat !== 'number'
      || !payload.jti
    ) {
      return null;
    }

    if (payload.exp + clockToleranceSeconds < now) {
      return null;
    }

    if (payload.nbf && payload.nbf - clockToleranceSeconds > now) {
      return null;
    }

    if (payload.iat - clockToleranceSeconds > now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
