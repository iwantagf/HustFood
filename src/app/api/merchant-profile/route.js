import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

const DEFAULT_OWNER_ROLE = 'seller';

function buildDefaultProfile(user) {
  return {
    ownerId: user.id,
    ownerRole: DEFAULT_OWNER_ROLE,
    shopName: `${user.displayName || 'HustFood'} Store`,
    address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
    mapLocation: '21.0059,105.8431',
    openTime: '08:00',
    closeTime: '22:00',
    phone: '0987654321',
    image: '/images/burger.png',
    status: 'pending_review'
  };
}

function normalizeProfilePayload(body, currentStatus) {
  const requiredFields = ['shopName', 'address', 'openTime', 'closeTime', 'phone'];
  const missingField = requiredFields.find((field) => !String(body[field] || '').trim());

  if (missingField) {
    return { error: `Thiếu trường bắt buộc: ${missingField}` };
  }

  const normalizedPhone = String(body.phone).replace(/\s+/g, '');
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

  if (!phoneRegex.test(normalizedPhone)) {
    return { error: 'Số điện thoại Việt Nam không hợp lệ' };
  }

  return {
    data: {
      ownerRole: DEFAULT_OWNER_ROLE,
      shopName: String(body.shopName).trim(),
      address: String(body.address).trim(),
      mapLocation: String(body.mapLocation || '').trim() || null,
      openTime: String(body.openTime).trim(),
      closeTime: String(body.closeTime).trim(),
      phone: normalizedPhone,
      image: String(body.image || '').trim() || '/images/burger.png',
      status: ['active', 'paused'].includes(currentStatus)
        ? (body.status === 'paused' ? 'paused' : 'active')
        : currentStatus || 'pending_review'
    }
  };
}

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

    if (auth.user.role === 'admin') {
      const profiles = await prisma.merchantProfile.findMany({
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              role: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return new Response(JSON.stringify(profiles), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const profile = await prisma.merchantProfile.upsert({
      where: { ownerId: auth.user.id },
      update: {},
      create: buildDefaultProfile(auth.user)
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không tải được hồ sơ cửa hàng' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['seller']);
    if (auth.response) return auth.response;

    const existingProfile = await prisma.merchantProfile.findUnique({
      where: { ownerId: auth.user.id }
    });

    if (existingProfile?.status === 'blocked') {
      return new Response(JSON.stringify({ error: 'Cửa hàng đã bị khóa. Vui lòng liên hệ Quản trị viên.' }), { status: 403 });
    }

    const body = await request.json();
    const { data, error } = normalizeProfilePayload(body, existingProfile?.status);

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    const profile = await prisma.merchantProfile.upsert({
      where: { ownerId: auth.user.id },
      update: data,
      create: {
        ...data,
        ownerId: auth.user.id,
        status: 'pending_review'
      }
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không cập nhật được hồ sơ cửa hàng' }), { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const { id, status } = await request.json();
    const nextStatus = ['active', 'blocked', 'pending_review'].includes(status) ? status : null;

    if (!id || !nextStatus) {
      return new Response(JSON.stringify({ error: 'Thiếu hồ sơ hoặc trạng thái hợp lệ' }), { status: 400 });
    }

    const profile = await prisma.merchantProfile.update({
      where: { id },
      data: { status: nextStatus },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            role: true
          }
        }
      }
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không cập nhật được trạng thái cửa hàng' }), { status: 500 });
  }
}
