import { prisma } from '@/lib/prisma';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';

export async function GET() {
  try {
    if (isDemoMode()) {
      const store = getDemoStore();
      const profiles = store.merchantProfiles.filter((profile) => profile.status === 'active');

      return new Response(JSON.stringify(profiles), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
