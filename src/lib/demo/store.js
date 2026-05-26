import { randomUUID } from 'crypto';

const DEFAULT_PRODUCTS = [
  {
    id: 'demo-product-burger',
    name: 'Burger Bò Phô Mai',
    desc: 'Burger bò nướng, phô mai cheddar, xà lách tươi và sốt đặc biệt.',
    price: '65.000đ',
    image: '/images/burger.png',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-product-chicken',
    name: 'Gà Rán Giòn Rụm',
    desc: 'Gà rán giòn, thịt mềm mọng nước, tẩm ướp gia vị đậm đà.',
    price: '85.000đ',
    image: '/images/chicken.png',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-product-combo',
    name: 'Combo Sinh Viên',
    desc: 'Burger bò, khoai tây chiên cỡ vừa và nước ngọt tự chọn.',
    price: '49.000đ',
    image: '/images/burger.png',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_USERS = [
  {
    id: 'demo-user-dongmanhhung',
    email: null,
    username: 'dongmanhhung',
    displayName: 'dongmanhhung',
    role: 'seller',
    status: 'active',
    provider: 'credentials',
    password: '1'
  },
  {
    id: 'demo-user-tadinhtam',
    email: null,
    username: 'tadinhtam',
    displayName: 'tadinhtam',
    role: 'customer',
    status: 'active',
    provider: 'credentials',
    password: '1'
  },
  {
    id: 'demo-user-doanducmanh',
    email: null,
    username: 'doanducmanh',
    displayName: 'doanducmanh',
    role: 'shipper',
    status: 'active',
    provider: 'credentials',
    password: '1'
  },
  {
    id: 'demo-user-nguyendanhthai',
    email: null,
    username: 'nguyendanhthai',
    displayName: 'nguyendanhthai',
    role: 'customer',
    status: 'active',
    provider: 'credentials',
    password: '1'
  }
];

const DEFAULT_PROFILE = {
  id: 'demo-merchant-profile',
  ownerId: 'demo-seller',
  ownerRole: 'seller',
  shopName: 'HustFood Demo Store',
  address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
  mapLocation: '21.0059,105.8431',
  openTime: '08:00',
  closeTime: '22:00',
  phone: '0987654321',
  image: '/images/burger.png',
  status: 'active',
  owner: {
    id: 'demo-seller',
    displayName: 'Người bán Demo',
    email: 'seller.demo@gmail.com',
    role: 'seller'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function createDemoStore() {
  return {
    users: DEFAULT_USERS.map((user) => ({ ...user })),
    products: [...DEFAULT_PRODUCTS],
    orders: [],
    proposals: [],
    notifications: [],
    merchantProfiles: [{ ...DEFAULT_PROFILE }]
  };
}

export function isDemoMode() {
  return process.env.DEMO_MODE === 'true';
}

export function getDemoStore() {
  if (!globalThis.__hustfoodDemoStore) {
    globalThis.__hustfoodDemoStore = createDemoStore();
  }

  return globalThis.__hustfoodDemoStore;
}

export function createDemoId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

export function getConfiguredDemoAdmin() {
  const username = process.env.DEMO_ADMIN_USERNAME;
  const password = process.env.DEMO_ADMIN_PASSWORD;

  if (!username || !password) return null;

  return {
    id: 'demo-admin',
    username,
    email: null,
    displayName: 'Quản trị viên Demo',
    role: 'admin',
    status: 'active',
    provider: 'demo',
    password
  };
}

export function sanitizeDemoUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || null,
    username: user.username || null,
    displayName: user.displayName,
    role: user.role,
    status: user.status || 'active',
    provider: user.provider || 'demo'
  };
}

export function findDemoUserByCredentials(identifier, password) {
  const admin = getConfiguredDemoAdmin();
  if (admin && admin.username.toLowerCase() === identifier && admin.password === password) {
    return sanitizeDemoUser(admin);
  }

  const store = getDemoStore();
  const user = store.users.find((item) => {
    const email = item.email?.toLowerCase();
    const username = item.username?.toLowerCase();
    return (email === identifier || username === identifier) && item.password === password;
  });

  return sanitizeDemoUser(user);
}

export function createDemoUser({ email, password, displayName, role }) {
  const store = getDemoStore();
  const existingUser = store.users.find((item) => item.email?.toLowerCase() === email);

  if (existingUser) return { error: 'Tài khoản Gmail này đã tồn tại' };

  const user = {
    id: createDemoId('demo-user'),
    email,
    username: null,
    displayName: displayName || email.split('@')[0],
    role,
    status: 'active',
    provider: 'credentials',
    password
  };

  store.users.push(user);

  if (role === 'seller') {
    store.merchantProfiles.push({
      ...DEFAULT_PROFILE,
      id: createDemoId('demo-profile'),
      ownerId: user.id,
      shopName: `${user.displayName} Store`,
      status: 'pending_review',
      owner: sanitizeDemoUser(user),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return { user: sanitizeDemoUser(user) };
}

export function getOrCreateDemoSocialUser({ provider, email, displayName }) {
  const store = getDemoStore();
  let user = store.users.find((item) => item.email?.toLowerCase() === email);

  if (!user) {
    user = {
      id: createDemoId('demo-social'),
      email,
      username: null,
      displayName: displayName || email.split('@')[0],
      role: 'customer',
      status: 'active',
      provider
    };
    store.users.push(user);
  }

  return sanitizeDemoUser(user);
}
