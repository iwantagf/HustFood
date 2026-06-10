export const accountRoleLabels = {
  customer: 'Khách hàng',
  seller: 'Người bán',
  shipper: 'Người giao hàng',
  admin: 'Quản trị viên'
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
    status: user.status,
    provider: user.provider
  };
}

export function normalizeIdentifier(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

export function getUsernameError(value) {
  const username = normalizeUsername(value);

  if (!username) return 'Vui lòng nhập username';
  if (username.length < 3) return 'Username phải có ít nhất 3 ký tự';
  if (username.length > 32) return 'Username không được vượt quá 32 ký tự';
  if (!/^[a-z0-9_]+$/.test(username)) return 'Username chỉ được dùng chữ thường, số và dấu gạch dưới';

  return '';
}

export function isGmailAddress(value) {
  return /^[^\s@]+@gmail\.com$/i.test(String(value || '').trim());
}
