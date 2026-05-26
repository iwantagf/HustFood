import { prisma } from '@/lib/prisma';
import { isGmailAddress, normalizeIdentifier, sanitizeUser, socialProviders } from '@/lib/auth/users';

export async function POST(request) {
  try {
    const body = await request.json();
    const provider = String(body.provider || '').toLowerCase();
    const email = normalizeIdentifier(body.email);

    if (!socialProviders.includes(provider)) {
      return new Response(JSON.stringify({ error: 'Unsupported social provider' }), { status: 400 });
    }

    if (!isGmailAddress(email)) {
      return new Response(JSON.stringify({ error: 'Enter a Gmail address to simulate social login' }), { status: 400 });
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return new Response(JSON.stringify({ user: sanitizeUser(existingByEmail) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
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
        provider,
        providerAccountId: email
      }
    });

    return new Response(JSON.stringify({ user: sanitizeUser(user) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to login with social provider' }), { status: 500 });
  }
}
