import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeUser } from '@/lib/auth/users';

export const SESSION_COOKIE = 'hustfood_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'hustfood-dev-session-secret';

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(value) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

export function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
  const payload = base64UrlEncode({
    sub: user.id,
    role: user.role,
    iat: now,
    exp: now + SESSION_MAX_AGE
  });
  const unsignedToken = `${header}.${payload}`;

  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  try {
    const decodedPayload = base64UrlDecode(payload);
    if (!decodedPayload.sub || decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(response, user) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: createSessionToken(user),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE
  });
}

export function clearSessionCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

export function sessionJson(user, init = {}) {
  const response = NextResponse.json({ user: sanitizeUser(user) }, init);
  setSessionCookie(response, user);
  return response;
}

export async function getCurrentUserFromRequest(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);

  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || user.status === 'blocked') return null;

  return sanitizeUser(user);
}

export async function requireRole(request, allowedRoles) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return {
      response: NextResponse.json({ error: 'Vui lòng đăng nhập để tiếp tục' }, { status: 401 })
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      response: NextResponse.json({ error: 'Tài khoản không có quyền thực hiện thao tác này' }, { status: 403 })
    };
  }

  return { user };
}
