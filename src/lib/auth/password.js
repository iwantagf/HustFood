import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function createPasswordHash(password) {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, passwordSalt, KEY_LENGTH).toString('hex');

  return { passwordHash, passwordSalt };
}

export function verifyPassword(password, passwordHash, passwordSalt) {
  if (!passwordHash || !passwordSalt) return false;

  const candidateHash = scryptSync(password, passwordSalt, KEY_LENGTH);
  const storedHash = Buffer.from(passwordHash, 'hex');

  if (candidateHash.length !== storedHash.length) return false;
  return timingSafeEqual(candidateHash, storedHash);
}
