import { prisma } from '@/lib/prisma';
import { isGmailAddress, normalizeIdentifier, socialProviders } from '@/lib/auth/users';
import { sessionJson } from '@/lib/auth/session';
import { getOrCreateDemoSocialUser, isDemoMode } from '@/lib/demo/store';

export async function POST(request) {
  try {
    const body = await request.json();
    const provider = String(body.provider || '').toLowerCase();
    const email = normalizeIdentifier(body.email);

    if (!socialProviders.includes(provider)) {
      return new Response(JSON.stringify({ error: 'Nhà cung cấp social không được hỗ trợ' }), { status: 400 });
    }

    if (!isGmailAddress(email)) {
      return new Response(JSON.stringify({ error: 'Nhập Gmail để mô phỏng đăng nhập social' }), { status: 400 });
    }

    if (isDemoMode()) {
      const user = getOrCreateDemoSocialUser({
        provider,
        email,
        displayName: body.displayName
      });

      return sessionJson(user, { status: 200 });
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      if (existingByEmail.status === 'blocked') {
        return new Response(JSON.stringify({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ HustFood.' }), { status: 403 });
      }

      return sessionJson(existingByEmail, { status: 200 });
    }

    const user = await prisma.user.upsert({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: email
        }
      },
      update: {
        email,
        displayName: body.displayName || email.split('@')[0]
      },
      create: {
        email,
        displayName: body.displayName || email.split('@')[0],
        role: 'customer',
        status: 'active',
        provider,
        providerAccountId: email
      }
    });

    if (user.status === 'blocked') {
      return new Response(JSON.stringify({ error: 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ HustFood.' }), { status: 403 });
    }

    return sessionJson(user, { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không đăng nhập được bằng social provider' }), { status: 500 });
  }
}
