import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sanitizeUser } from '@/lib/auth/users';
import { isDemoMode } from '@/lib/demo/store';
import { createSignedJwt, verifySignedJwt } from '@/lib/auth/jwt';

export const SESSION_COOKIE = 'hustfood_session';
export const TEMP_SESSION_COOKIE = 'hustfood_oauth_temp';
export const SESSION_MAX_AGE = 60 * 60 * 24;
export const TEMP_SESSION_MAX_AGE = 15 * 60;

export function createSessionToken(user) {
  return createSignedJwt({
    sub: user.id,
    email: user.email || null,
    username: user.username || null,
    displayName: user.displayName,
    role: user.role,
    status: user.status || 'active',
    provider: user.provider || 'credentials'
  }, {
    expiresInSeconds: SESSION_MAX_AGE,
    tokenType: 'session'
  });
}

export function verifySessionToken(token) {
  const session = verifySignedJwt(token, { tokenType: 'session' });
  if (!session?.sub) return null;

  return session;
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

  if (isDemoMode()) {
    if (session.status === 'blocked') return null;

    return {
      id: session.sub,
      email: session.email,
      username: session.username,
      displayName: session.displayName,
      role: session.role,
      status: session.status || 'active',
      provider: session.provider || 'demo'
    };
  }

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

export function createTempSessionToken(payload) {
  return createSignedJwt({
    ...payload,
  }, {
    expiresInSeconds: TEMP_SESSION_MAX_AGE,
    tokenType: 'oauth_temp'
  });
}

export function verifyTempSessionToken(token) {
  return verifySignedJwt(token, { tokenType: 'oauth_temp' });
}
