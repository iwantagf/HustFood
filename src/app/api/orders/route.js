import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'orders.json');

function getOrders() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2));
}

export async function GET() {
  const orders = getOrders();
  // Sort by date descending (newest first)
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return new Response(JSON.stringify(orders), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request) {
  const body = await request.json();
  const orders = getOrders();
  
  const newOrder = {
    id: '#HF' + Math.floor(1000 + Math.random() * 9000),
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  saveOrders(orders);
  
  return new Response(JSON.stringify(newOrder), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT(request) {
  const { id, status } = await request.json();
  const orders = getOrders();
  
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
  }
  
  orders[orderIndex].status = status;
  saveOrders(orders);
  
  return new Response(JSON.stringify(orders[orderIndex]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
