import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const profiles = await prisma.merchantProfile.findMany({
      where: { status: 'active' },
      include: {
        owner: {
          select: {
            displayName: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return new Response(JSON.stringify(profiles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Không tải được danh sách cửa hàng' }), { status: 500 });
  }
}
