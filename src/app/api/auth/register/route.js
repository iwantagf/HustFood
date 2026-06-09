import { prisma } from '@/lib/prisma';
import { createPasswordHash } from '@/lib/auth/password';
import { isGmailAddress, normalizeIdentifier, selfRegisterRoles } from '@/lib/auth/users';
import { sessionJson } from '@/lib/auth/session';
import { addDemoUser, findDemoUserByProviderId, isDemoMode } from '@/lib/demo/store';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeRegisterPayload(body) {
  const email = normalizeIdentifier(body.email);
  const password = String(body.password || '');
  const displayName = String(body.displayName || '').trim();
  const role = selfRegisterRoles.includes(body.role) ? body.role : 'customer';

  if (!email || !password || !displayName) {
    return { error: 'Vui lòng nhập đầy đủ Gmail, tên hiển thị và mật khẩu' };
  }

  if (!isGmailAddress(email)) {
    return { error: 'Tài khoản đăng ký phải dùng Gmail' };
  }

  if (password.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }

  return {
    data: {
      email,
      password,
      displayName,
      role
    }
  };
}

function isDuplicateUserError(error) {
  return error?.code === 'P2002';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = normalizeRegisterPayload(body);
    if (error) return json({ error }, 400);

    if (isDemoMode()) {
      const providerAccountId = data.email;
      const existingUser = findDemoUserByProviderId(providerAccountId);

      if (existingUser) {
        return json({ error: 'Gmail này đã được đăng ký' }, 409);
      }

      addDemoUser({
        email: data.email,
        username: null,
        displayName: data.displayName,
        role: data.role,
        status: 'active',
        provider: 'credentials',
        providerAccountId,
        password: data.password
      });

      const demoUser = findDemoUserByProviderId(providerAccountId);
      return sessionJson(demoUser, { status: 201 });
    }

    const { passwordHash, passwordSalt } = createPasswordHash(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: null,
        displayName: data.displayName,
        role: data.role,
        status: 'active',
        provider: 'credentials',
        providerAccountId: data.email,
        passwordHash,
        passwordSalt
      }
    });

    return sessionJson(user, { status: 201 });
  } catch (error) {
    if (isDuplicateUserError(error)) {
      return json({ error: 'Gmail này đã được đăng ký' }, 409);
    }

    return json({ error: 'Không đăng ký được tài khoản' }, 500);
  }
}
