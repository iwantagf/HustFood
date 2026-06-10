import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';
import { createDemoId, getDemoStore, isDemoMode } from '@/lib/demo/store';
import { formatVndPrice } from '@/lib/pricing';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

    if (isDemoMode()) {
      const store = getDemoStore();
      return new Response(JSON.stringify(store.proposals), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return new Response(JSON.stringify(proposals), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch proposals' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['seller']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const price = formatVndPrice(body.price);

    if (isDemoMode()) {
      const store = getDemoStore();
      const newProposal = {
        id: createDemoId('demo-proposal'),
        ownerId: auth.user.id,
        name: body.name,
        desc: body.desc,
        price,
        image: body.image || '/images/burger.png',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      store.proposals.unshift(newProposal);

      return new Response(JSON.stringify(newProposal), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const newProposal = await prisma.proposal.create({
      data: {
        ownerId: auth.user.id,
        name: body.name,
        desc: body.desc,
        price,
        image: body.image || '/images/burger.png',
        status: 'pending'
      }
    });
    
    return new Response(JSON.stringify(newProposal), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create proposal' }), { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const { id, status } = await request.json();

    if (isDemoMode()) {
      const store = getDemoStore();
      const proposal = store.proposals.find((item) => item.id === id);
      if (!proposal) {
        return new Response(JSON.stringify({ error: 'Proposal not found' }), { status: 404 });
      }

      proposal.status = status;

      const notificationMsg = status === 'accepted'
        ? `Món ăn "${proposal.name}" của bạn đã được duyệt!`
        : `Món ăn "${proposal.name}" của bạn đã bị từ chối.`;

      store.notifications.unshift({
        id: createDemoId('demo-notification'),
        ownerId: proposal.ownerId || null,
        message: notificationMsg,
        read: false,
        createdAt: new Date().toISOString()
      });

      if (status === 'accepted') {
        store.products.unshift({
          id: createDemoId('demo-product'),
          ownerId: proposal.ownerId || null,
          categoryId: null,
          name: proposal.name,
          desc: proposal.desc,
          price: proposal.price,
          image: proposal.image || '/images/burger.png',
          options: {
            sizes: [],
            toppings: [],
            tastes: [],
            allowNote: true
          },
          isAvailable: true,
          isHidden: false,
          createdAt: new Date().toISOString()
        });
      }

      return new Response(JSON.stringify(proposal), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return new Response(JSON.stringify({ error: 'Proposal not found' }), { status: 404 });
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: { status }
    });
    
    // Create notification
    const notificationMsg = status === 'accepted' 
      ? `Món ăn "${proposal.name}" của bạn đã được duyệt!`
      : `Món ăn "${proposal.name}" của bạn đã bị từ chối.`;
      
    await prisma.notification.create({
      data: {
        ownerId: proposal.ownerId,
        message: notificationMsg,
        read: false
      }
    });

    if (status === 'accepted') {
      await prisma.product.create({
        data: {
          name: proposal.name,
          desc: proposal.desc,
          price: proposal.price,
          image: proposal.image || '/images/burger.png',
          ownerId: proposal.ownerId,
          options: {
            sizes: [],
            toppings: [],
            tastes: [],
            allowNote: true
          },
          isAvailable: true,
          isHidden: false
        }
      });
    }

    return new Response(JSON.stringify(updatedProposal), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to process proposal' }), { status: 500 });
  }
}
