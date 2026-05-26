import { prisma } from '@/lib/prisma';
import { createPasswordHash } from '@/lib/auth/password';
import { isGmailAddress, normalizeIdentifier, sanitizeUser, selfRegisterRoles } from '@/lib/auth/users';

export async function POST(request) {
  try {
    const body = await request.json();
    const email = normalizeIdentifier(body.email);
    const password = String(body.password || '');
    const displayName = String(body.displayName || '').trim();
    const role = selfRegisterRoles.includes(body.role) ? body.role : 'customer';

    if (!isGmailAddress(email)) {
      return new Response(JSON.stringify({ error: 'Only Gmail addresses can self-register in this demo' }), { status: 400 });
    }

    if (password.length < 1) {
      return new Response(JSON.stringify({ error: 'Password is required' }), { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'This Gmail account already exists' }), { status: 409 });
    }

    const { passwordHash, passwordSalt } = createPasswordHash(password);
    const user = await prisma.user.create({
      data: {
        email,
        displayName: displayName || email.split('@')[0],
        role,
        provider: 'credentials',
        providerAccountId: email,
        passwordHash,
        passwordSalt
      }
    });

    return new Response(JSON.stringify({ user: sanitizeUser(user) }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to register account' }), { status: 500 });
  }
}
