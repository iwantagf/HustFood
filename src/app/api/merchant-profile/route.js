import { prisma } from '@/lib/prisma';

const DEFAULT_OWNER_ROLE = 'seller';
const DEFAULT_PROFILE = {
  ownerRole: DEFAULT_OWNER_ROLE,
  shopName: 'HustFood Merchant',
  address: 'So 1 Dai Co Viet, Hai Ba Trung, Ha Noi',
  mapLocation: '21.0059,105.8431',
  openTime: '08:00',
  closeTime: '22:00',
  phone: '0987654321',
  image: '/images/burger.png',
  status: 'active'
};

function normalizeProfilePayload(body) {
  const requiredFields = ['shopName', 'address', 'openTime', 'closeTime', 'phone'];
  const missingField = requiredFields.find((field) => !String(body[field] || '').trim());

  if (missingField) {
    return { error: `Missing required field: ${missingField}` };
  }

  const normalizedPhone = String(body.phone).replace(/\s+/g, '');
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

  if (!phoneRegex.test(normalizedPhone)) {
    return { error: 'Invalid Vietnamese phone number' };
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
      status: body.status === 'paused' ? 'paused' : 'active'
    }
  };
}

export async function GET() {
  try {
    // The current demo auth has one Merchant role but no user table yet, so the
    // profile is stored as a singleton keyed by ownerRole.
    const profile = await prisma.merchantProfile.upsert({
      where: { ownerRole: DEFAULT_OWNER_ROLE },
      update: {},
      create: DEFAULT_PROFILE
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch merchant profile' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { data, error } = normalizeProfilePayload(body);

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    const profile = await prisma.merchantProfile.upsert({
      where: { ownerRole: DEFAULT_OWNER_ROLE },
      update: data,
      create: data
    });

    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update merchant profile' }), { status: 500 });
  }
}
