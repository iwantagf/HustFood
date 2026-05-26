import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.response) return auth.response;

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
    
    const newProposal = await prisma.proposal.create({
      data: {
        name: body.name,
        desc: body.desc,
        price: body.price,
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
          image: proposal.image || '/images/burger.png'
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
