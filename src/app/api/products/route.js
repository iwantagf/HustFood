import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'products.json');

function getProducts() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function saveProducts(products) {
  fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2));
}

export async function GET() {
  const products = getProducts();
  return new Response(JSON.stringify(products), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request) {
  const body = await request.json();
  const products = getProducts();
  
  const newProduct = {
    id: Date.now(),
    ...body
  };
  
  products.push(newProduct);
  saveProducts(products);
  
  return new Response(JSON.stringify(newProduct), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function DELETE(request) {
  const { id } = await request.json();
  let products = getProducts();
  
  products = products.filter(p => p.id !== id);
  saveProducts(products);
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
