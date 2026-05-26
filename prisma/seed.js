require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();
const adminUsername = process.env.SEED_ADMIN_USERNAME;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;

function createPasswordHash(password) {
  const passwordSalt = randomBytes(16).toString('hex');
  const passwordHash = scryptSync(password, passwordSalt, 64).toString('hex');

  return { passwordHash, passwordSalt };
}

async function main() {
  // Clear existing products just in case
  await prisma.product.deleteMany({});

  const products = [
    {
      name: "Burger Bò Phô Mai",
      desc: "Burger bò Wagyu nướng lửa hồng, kèm lớp phô mai cheddar tan chảy, xà lách tươi và sốt đặc biệt.",
      price: "65.000đ",
      image: "/images/burger.png"
    },
    {
      name: "Gà Rán Giòn Rụm",
      desc: "Gà rán chuẩn vị KFC, lớp vỏ giòn tan, thịt bên trong mềm mọng nước, tẩm ướp gia vị đậm đà.",
      price: "85.000đ",
      image: "/images/chicken.png"
    },
    {
      name: "Combo Sinh Viên",
      desc: "Combo siêu hời gồm 1 burger bò, 1 khoai tây chiên cỡ vừa và 1 nước ngọt tự chọn.",
      price: "49.000đ",
      image: "/images/burger.png"
    },
    {
      name: "Gà Rán Cay",
      desc: "Đùi gà chiên giòn sốt cay Hàn Quốc, cay nồng đậm vị, rắc thêm chút vừng rang thơm lừng.",
      price: "90.000đ",
      image: "/images/chicken.png"
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }

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

  console.log("Database seeded with products.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
