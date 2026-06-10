import { randomUUID } from 'crypto';
import { DEMO_VOUCHERS } from '@/lib/vouchers';

const DEFAULT_PRODUCTS = [
  {
    id: 'demo-product-burger',
    ownerId: 'demo-user-dongmanhhung',
    categoryId: 'demo-category-burger',
    name: 'Burger Bò Phô Mai',
    desc: 'Burger bò nướng, phô mai cheddar, xà lách tươi và sốt đặc biệt.',
    price: '65.000đ',
    image: '/images/burger.png',
    options: {
      sizes: ['Vừa', 'Lớn'],
      toppings: ['Phô mai', 'Thịt bò thêm'],
      tastes: ['Ít cay', 'Không cay'],
      allowNote: true
    },
    isAvailable: true,
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-product-chicken',
    ownerId: 'demo-user-dongmanhhung',
    categoryId: 'demo-category-chicken',
    name: 'Gà Rán Giòn Rụm',
    desc: 'Gà rán giòn, thịt mềm mọng nước, tẩm ướp gia vị đậm đà.',
    price: '85.000đ',
    image: '/images/chicken.png',
    options: {
      sizes: ['2 miếng', '4 miếng'],
      toppings: ['Sốt cay', 'Sốt phô mai'],
      tastes: ['Cay vừa', 'Cay nhiều'],
      allowNote: true
    },
    isAvailable: true,
    isHidden: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-product-combo',
    ownerId: 'demo-user-dongmanhhung',
    categoryId: 'demo-category-combo',
    name: 'Combo Sinh Viên',
    desc: 'Burger bò, khoai tây chiên cỡ vừa và nước ngọt tự chọn.',
    price: '49.000đ',
    image: '/images/burger.png',
    options: {
      sizes: ['Tiêu chuẩn'],
      toppings: ['Thêm khoai', 'Thêm nước'],
      tastes: ['Không cay'],
      allowNote: true
    },
    isAvailable: true,
    isHidden: false,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_CATEGORIES = [
  {
    id: 'demo-category-burger',
    ownerId: 'demo-user-dongmanhhung',
    name: 'Burger',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-category-chicken',
    ownerId: 'demo-user-dongmanhhung',
    name: 'Gà rán',
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-category-combo',
    ownerId: 'demo-user-dongmanhhung',
    name: 'Combo',
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
  ownerId: 'demo-user-dongmanhhung',
  ownerRole: 'seller',
  shopName: 'HustFood Demo Store',
  address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
  mapLocation: '21.0059,105.8431',
  openTime: '08:00',
  closeTime: '22:00',
  phone: '0987654321',
  image: '/images/burger.png',
  rating: 0,
  reviewCount: 0,
  status: 'active',
  owner: {
    id: 'demo-user-dongmanhhung',
    displayName: 'dongmanhhung',
    email: null,
    role: 'seller'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function createDemoStore() {
  return {
    users: DEFAULT_USERS.map((user) => ({ ...user })),
    products: [...DEFAULT_PRODUCTS],
    menuCategories: [...DEFAULT_CATEGORIES],
    vouchers: DEMO_VOUCHERS.map((voucher) => ({ ...voucher })),
    savedCarts: [],
    orders: [],
    paymentTransactions: [],
    reviews: [],
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

  if (!Array.isArray(globalThis.__hustfoodDemoStore.reviews)) {
    globalThis.__hustfoodDemoStore.reviews = [];
  }

  if (!Array.isArray(globalThis.__hustfoodDemoStore.paymentTransactions)) {
    globalThis.__hustfoodDemoStore.paymentTransactions = [];
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

export function addDemoUser(userData) {
  const store = getDemoStore();
  const exists = store.users.find(
    (u) => (u.email && u.email === userData.email) || (u.providerAccountId && u.providerAccountId === userData.providerAccountId)
  );
  if (!exists) {
    store.users.push({
      id: `demo-user-${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString()
    });
  }
}

export function findDemoUserByProviderId(providerAccountId) {
  const store = getDemoStore();
  const user = store.users.find((u) => u.providerAccountId === providerAccountId);
  return sanitizeDemoUser(user);
}

export function findDemoUserByEmailOrUsername({ email, username }) {
  const store = getDemoStore();
  const normalizedEmail = email?.toLowerCase();
  const normalizedUsername = username?.toLowerCase();

  const user = store.users.find((item) => (
    (normalizedEmail && item.email?.toLowerCase() === normalizedEmail)
    || (normalizedUsername && item.username?.toLowerCase() === normalizedUsername)
  ));

  return sanitizeDemoUser(user);
}
