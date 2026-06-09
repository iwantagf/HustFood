import { createPasswordHash } from '@/lib/auth/password';
import { isGmailAddress, normalizeIdentifier } from '@/lib/auth/users';

export function getConfiguredAdminCredentials() {
  const account = normalizeIdentifier(process.env.ADMIN_ACCOUNT);
  const password = String(process.env.ADMIN_PASSWORD || '');

  if (!account || !password) return null;

  return { account, password };
}

export function adminCredentialsMatch(identifier, password) {
  const configuredAdmin = getConfiguredAdminCredentials();
  if (!configuredAdmin) return false;

  return configuredAdmin.account === normalizeIdentifier(identifier) && configuredAdmin.password === String(password || '');
}

export async function ensureConfiguredAdminUser(prisma, identifier) {
  const account = normalizeIdentifier(identifier);
  const password = String(process.env.ADMIN_PASSWORD || '');
  const { passwordHash, passwordSalt } = createPasswordHash(password);
  const isEmail = isGmailAddress(account) || account.includes('@');
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { provider: 'credentials', providerAccountId: account },
        isEmail ? { email: account } : { username: account }
      ]
    }
  });

  if (existingUser) {
    return prisma.user.update({
      where: { id: existingUser.id },
      data: {
        email: isEmail ? account : existingUser.email,
        username: isEmail ? existingUser.username : account,
        displayName: existingUser.displayName || account,
        role: 'admin',
        status: 'active',
        provider: 'credentials',
        providerAccountId: account,
        passwordHash,
        passwordSalt
      }
    });
  }

  return prisma.user.create({
    data: {
      email: isEmail ? account : null,
      username: isEmail ? null : account,
      displayName: account,
      role: 'admin',
      status: 'active',
      provider: 'credentials',
      providerAccountId: account,
      passwordHash,
      passwordSalt
    }
  });
}
