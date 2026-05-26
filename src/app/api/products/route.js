import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/session';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const body = await request.json();
    const newProduct = await prisma.product.create({
      data: {
        name: body.name,
        desc: body.desc,
        price: body.price,
        image: body.image || '/images/burger.png'
      }
    });
    
    return new Response(JSON.stringify(newProduct), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create product' }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ['admin']);
    if (auth.response) return auth.response;

    const { id } = await request.json();
    await prisma.product.delete({
      where: { id }
    });
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete product' }), { status: 500 });
  }
}
