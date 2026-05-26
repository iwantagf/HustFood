import { prisma } from '@/lib/prisma';
import { createPasswordHash } from '@/lib/auth/password';
import { isGmailAddress, normalizeIdentifier, selfRegisterRoles } from '@/lib/auth/users';
import { sessionJson } from '@/lib/auth/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeIdentifier(body.email);
    const password = String(body.password || '');
    const displayName = String(body.displayName || '').trim();
    const role = selfRegisterRoles.includes(body.role) ? body.role : 'customer';

    if (!isGmailAddress(email)) {
      return new Response(JSON.stringify({ error: 'Demo này chỉ cho phép tự tạo tài khoản bằng Gmail' }), { status: 400 });
    }

    if (password.length < 1) {
      return new Response(JSON.stringify({ error: 'Mật khẩu là bắt buộc' }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Tài khoản Gmail này đã tồn tại' }), { status: 409 });
    }

    const { passwordHash, passwordSalt } = createPasswordHash(password);
    const user = await prisma.user.create({
      data: {
        email,
        displayName: displayName || email.split('@')[0],
        role,
        status: 'active',
        provider: 'credentials',
        providerAccountId: email,
        passwordHash,
        passwordSalt
      }
    });

    return sessionJson(user, { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không tạo được tài khoản' }), { status: 500 });
  }
}
