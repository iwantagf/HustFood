import { prisma } from '@/lib/prisma';
import { createPasswordHash } from '@/lib/auth/password';
import {
  getUsernameError,
  isGmailAddress,
  normalizeIdentifier,
  normalizeUsername,
  selfRegisterRoles
} from '@/lib/auth/users';
import { sessionJson } from '@/lib/auth/session';
import { addDemoUser, findDemoUserByEmailOrUsername, isDemoMode } from '@/lib/demo/store';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function normalizeRegisterPayload(body) {
  const email = normalizeIdentifier(body.email);
  const username = normalizeUsername(body.username);
  const password = String(body.password || '');
  const displayName = String(body.displayName || '').trim();
  const role = selfRegisterRoles.includes(body.role) ? body.role : 'customer';

  if (!email || !username || !password || !displayName) {
    return { error: 'Vui lòng nhập đầy đủ Gmail, username, tên hiển thị và mật khẩu' };
  }

  if (!isGmailAddress(email)) {
    return { error: 'Tài khoản đăng ký phải dùng Gmail' };
  }

  const usernameError = getUsernameError(username);
  if (usernameError) {
    return { error: usernameError };
  }

  if (password.length < 6) {
    return { error: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }

  return {
    data: {
      email,
      username,
      password,
      displayName,
      role
    }
  };
}

function isDuplicateUserError(error) {
  return error?.code === 'P2002';
}

async function getExistingAccount({ email, username }) {
  if (isDemoMode()) {
    return findDemoUserByEmailOrUsername({ email, username });
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { username }
      ]
    },
    select: {
      email: true,
      username: true
    }
  });
}

function getExistingAccountError(existingAccount, { email, username }) {
  if (!existingAccount) return '';

  if (existingAccount.email?.toLowerCase() === email) {
    return 'Gmail này đã được đăng ký';
  }

  if (existingAccount.username?.toLowerCase() === username) {
    return 'Username này đã được sử dụng';
  }

  return 'Tài khoản đã tồn tại';
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = normalizeIdentifier(searchParams.get('email'));
    const username = normalizeUsername(searchParams.get('username'));
    const result = {
      emailAvailable: true,
      usernameAvailable: true,
      errors: {}
    };

    if (email) {
      if (!isGmailAddress(email)) {
        result.emailAvailable = false;
        result.errors.email = 'Tài khoản đăng ký phải dùng Gmail';
      } else {
        const existingEmail = await getExistingAccount({ email, username: '' });
        if (existingEmail) {
          result.emailAvailable = false;
          result.errors.email = 'Gmail này đã được đăng ký';
        }
      }
    }

    if (username) {
      const usernameError = getUsernameError(username);
      if (usernameError) {
        result.usernameAvailable = false;
        result.errors.username = usernameError;
      } else {
        const existingUsername = await getExistingAccount({ email: '', username });
        if (existingUsername) {
          result.usernameAvailable = false;
          result.errors.username = 'Username này đã được sử dụng';
        }
      }
    }

    return json(result);
  } catch (error) {
    return json({ error: 'Không kiểm tra được tài khoản' }, 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, error } = normalizeRegisterPayload(body);
    if (error) return json({ error }, 400);

    const existingAccount = await getExistingAccount(data);
    const existingAccountError = getExistingAccountError(existingAccount, data);
    if (existingAccountError) {
      return json({ error: existingAccountError }, 409);
    }

    if (isDemoMode()) {
      const providerAccountId = data.email;

      addDemoUser({
        email: data.email,
        username: data.username,
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
        username: data.username,
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
