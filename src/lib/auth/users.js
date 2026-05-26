export const accountRoleLabels = {
  customer: 'Khach hang',
  seller: 'Nguoi ban',
  shipper: 'Nguoi giao hang',
  admin: 'Quan tri vien'
};

export const selfRegisterRoles = ['customer', 'seller', 'shipper'];

export const socialProviders = ['google', 'facebook', 'instagram'];

export function sanitizeUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    provider: user.provider
  };
}

export function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

export function isGmailAddress(value) {
  return /^[^\s@]+@gmail\.com$/i.test(String(value || '').trim());
}
