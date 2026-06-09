import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { accountRoleLabels, sanitizeUser } from '@/lib/auth/users';
import { getConfiguredDemoAdmin, getDemoStore, isDemoMode, sanitizeDemoUser } from '@/lib/demo/store';

const USER_STATUSES = ['active', 'blocked'];
const USER_ROLES = Object.keys(accountRoleLabels);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function getDemoUsers() {
  const store = getDemoStore();
  const admin = getConfiguredDemoAdmin();
  const users = store.users.map(sanitizeDemoUser);

  if (admin && !users.some((user) => user.id === admin.id)) {
    users.unshift(sanitizeDemoUser(admin));
  }

  return users;
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      return json(getDemoUsers());
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return json(users.map(sanitizeUser));
  } catch (error) {
    return json({ error: 'Không tải được danh sách tài khoản' }, 500);
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const { id, role, status } = await request.json();
    const nextRole = USER_ROLES.includes(role) ? role : null;
    const nextStatus = USER_STATUSES.includes(status) ? status : null;

    if (!id || (!nextRole && !nextStatus)) {
      return json({ error: 'Thiếu tài khoản hoặc dữ liệu cập nhật hợp lệ' }, 400);
    }

    if (id === auth.user.id && nextStatus === 'blocked') {
      return json({ error: 'Không thể tự khóa tài khoản đang đăng nhập' }, 400);
    }

    if (id === auth.user.id && nextRole && nextRole !== auth.user.role) {
      return json({ error: 'Không thể tự đổi vai trò tài khoản đang đăng nhập' }, 400);
    }

    if (isDemoMode()) {
      const store = getDemoStore();
      const user = store.users.find((item) => item.id === id);
      const configuredAdmin = getConfiguredDemoAdmin();

      if (!user && configuredAdmin?.id === id) {
        return json({ error: 'Không thể chỉnh tài khoản admin demo cấu hình bằng biến môi trường' }, 400);
      }

      if (!user) {
        return json({ error: 'Không tìm thấy tài khoản' }, 404);
      }

      if (nextRole) user.role = nextRole;
      if (nextStatus) user.status = nextStatus;
      user.updatedAt = new Date().toISOString();

      return json(sanitizeDemoUser(user));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(nextRole ? { role: nextRole } : {}),
        ...(nextStatus ? { status: nextStatus } : {})
      }
    });

    return json(sanitizeUser(updatedUser));
  } catch (error) {
    return json({ error: 'Không cập nhật được tài khoản' }, 500);
  }
}
