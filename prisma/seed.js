require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();
const adminUsername = process.env.ADMIN_ACCOUNT || process.env.SEED_ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
const seedUsers = [
  { username: 'dongmanhhung', password: '1', role: 'seller', displayName: 'dongmanhhung' },
  { username: 'tadinhtam', password: '1', role: 'customer', displayName: 'tadinhtam' },
  { username: 'doanducmanh', password: '1', role: 'shipper', displayName: 'doanducmanh' },
  { username: 'nguyendanhthai', password: '1', role: 'customer', displayName: 'nguyendanhthai' }
];

function createPasswordHash(password) {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');

  return { passwordHash, passwordSalt };
}

async function main() {
  // Clear existing products just in case
  await prisma.product.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.voucher.deleteMany({});
  let sellerId = null;

  if (adminUsername && adminPassword) {
    const { passwordHash, passwordSalt } = createPasswordHash(adminPassword);

    await prisma.user.upsert({
      where: { username: adminUsername },
      update: {
        displayName: adminUsername,
        role: 'admin',
        status: 'active',
        provider: 'credentials',
        passwordHash,
        passwordSalt
      },
      create: {
        username: adminUsername,
        displayName: adminUsername,
        role: 'admin',
        status: 'active',
        provider: 'credentials',
        providerAccountId: adminUsername,
        passwordHash,
        passwordSalt
      }
    });
  }

  for (const user of seedUsers) {
    const { passwordHash, passwordSalt } = createPasswordHash(user.password);

    const savedUser = await prisma.user.upsert({
      where: { username: user.username },
      update: {
        displayName: user.displayName,
        role: user.role,
        status: 'active',
        provider: 'credentials',
        providerAccountId: user.username,
        passwordHash,
        passwordSalt
      },
      create: {
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        status: 'active',
        provider: 'credentials',
        providerAccountId: user.username,
        passwordHash,
        passwordSalt
      }
    });

    if (user.role === 'seller') {
      sellerId = savedUser.id;
    }
  }

  if (sellerId) {
    await prisma.merchantProfile.upsert({
      where: { ownerId: sellerId },
      update: {
        shopName: 'HustFood Demo Store',
        address: 'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
        mapLocation: '21.0059,105.8431',
        openTime: '08:00',
        closeTime: '22:00',
        phone: '0987654321',
        image: '/images/burger.png',
        rating: 0,
        reviewCount: 0,
        status: 'active'
      },
      create: {
        ownerId: sellerId,
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
        status: 'active'
      }
    });
  }

  const categories = [
    { ownerId: sellerId, name: 'Burger' },
    { ownerId: sellerId, name: 'Gà rán' },
    { ownerId: sellerId, name: 'Combo' }
  ];
  const savedCategories = {};

  for (const category of categories) {
    const savedCategory = await prisma.menuCategory.create({
      data: category
    });
    savedCategories[category.name] = savedCategory.id;
  }

  const products = [
    {
      ownerId: sellerId,
      categoryId: savedCategories.Burger,
      name: "Burger Bò Phô Mai",
      desc: "Burger bò Wagyu nướng lửa hồng, kèm lớp phô mai cheddar tan chảy, xà lách tươi và sốt đặc biệt.",
      price: "65.000đ",
      image: "/images/burger.png",
      options: {
        sizes: ['Vừa', 'Lớn'],
        toppings: ['Phô mai', 'Thịt bò thêm'],
        tastes: ['Không cay', 'Ít cay'],
        allowNote: true
      }
    },
    {
      ownerId: sellerId,
      categoryId: savedCategories['Gà rán'],
      name: "Gà Rán Giòn Rụm",
      desc: "Gà rán chuẩn vị KFC, lớp vỏ giòn tan, thịt bên trong mềm mọng nước, tẩm ướp gia vị đậm đà.",
      price: "85.000đ",
      image: "/images/chicken.png",
      options: {
        sizes: ['2 miếng', '4 miếng'],
        toppings: ['Sốt cay', 'Sốt phô mai'],
        tastes: ['Cay vừa', 'Cay nhiều'],
        allowNote: true
      }
    },
    {
      ownerId: sellerId,
      categoryId: savedCategories.Combo,
      name: "Combo Sinh Viên",
      desc: "Combo siêu hời gồm 1 burger bò, 1 khoai tây chiên cỡ vừa và 1 nước ngọt tự chọn.",
      price: "49.000đ",
      image: "/images/burger.png",
      options: {
        sizes: ['Tiêu chuẩn'],
        toppings: ['Thêm khoai', 'Thêm nước'],
        tastes: ['Không cay'],
        allowNote: true
      }
    },
    {
      ownerId: sellerId,
      categoryId: savedCategories['Gà rán'],
      name: "Gà Rán Cay",
      desc: "Đùi gà chiên giòn sốt cay Hàn Quốc, cay nồng đậm vị, rắc thêm chút vừng rang thơm lừng.",
      price: "90.000đ",
      image: "/images/chicken.png",
      options: {
        sizes: ['1 miếng', '2 miếng'],
        toppings: ['Sốt Hàn Quốc', 'Sốt mật ong'],
        tastes: ['Cay vừa', 'Cay nhiều'],
        allowNote: true
      }
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }

  await prisma.voucher.createMany({
    data: [
      {
        code: 'HUSTFOOD10',
        description: 'Giảm 10% cho đơn từ 50.000đ',
        discountType: 'percent',
        discountValue: 10,
        minSubtotal: 50000,
        expiresAt: new Date('2027-12-31T23:59:59.000Z'),
        usageLimit: 100,
        active: true
      },
      {
        code: 'SV20',
        description: 'Giảm 20.000đ cho đơn từ 100.000đ',
        discountType: 'fixed',
        discountValue: 20000,
        minSubtotal: 100000,
        expiresAt: new Date('2027-12-31T23:59:59.000Z'),
        usageLimit: 50,
        active: true
      }
    ]
  });

  console.log("Database seeded with products and user accounts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
