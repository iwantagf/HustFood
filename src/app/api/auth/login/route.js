import { prisma } from '@/lib/prisma';
import { normalizeIdentifier, sanitizeUser } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';

export async function POST(request) {
  try {
    const body = await request.json();
    const identifier = normalizeIdentifier(body.identifier);
    const password = String(body.password || '');

    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: 'Thiếu thông tin đăng nhập' }), { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        provider: 'credentials',
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return new Response(JSON.stringify({ error: 'Sai username/email hoặc mật khẩu' }), { status: 401 });
    }

    return new Response(JSON.stringify({ user: sanitizeUser(user) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không đăng nhập được' }), { status: 500 });
  }
}
