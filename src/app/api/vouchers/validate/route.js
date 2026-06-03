import { prisma } from '@/lib/prisma';
import { getDemoStore, isDemoMode } from '@/lib/demo/store';
import { normalizeVoucherCode, validateVoucher } from '@/lib/vouchers';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function findVoucher(code) {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.vouchers.find((voucher) => voucher.code === code);
  }

  return prisma.voucher.findUnique({
    where: { code }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const code = normalizeVoucherCode(body.code);
    const subtotal = Number(body.subtotal || 0);

    if (!code) {
      return json({ error: 'Vui lòng nhập mã giảm giá' }, 400);
    }

    const result = validateVoucher(await findVoucher(code), subtotal);
    if (result.error) return json({ error: result.error }, 400);

    return json(result.voucher);
  } catch (error) {
    return json({ error: 'Không kiểm tra được mã giảm giá' }, 500);
  }
}
