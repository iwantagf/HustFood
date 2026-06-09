import { COMPLETED_ORDER_STATUS } from '@/lib/statuses';

function getOrderItems(order) {
  return Array.isArray(order?.items) ? order.items : [];
}

export function attachProductSalesStats(products = [], orders = []) {
  const productIds = new Set(products.map((product) => product.id));
  const soldCountByProductId = new Map(products.map((product) => [product.id, 0]));

  orders
    .filter((order) => order?.status === COMPLETED_ORDER_STATUS)
    .forEach((order) => {
      getOrderItems(order).forEach((item) => {
        const productId = item?.id;
        const quantity = Number(item?.quantity || 0);

        if (!productIds.has(productId) || !Number.isFinite(quantity) || quantity <= 0) {
          return;
        }

        soldCountByProductId.set(productId, (soldCountByProductId.get(productId) || 0) + quantity);
      });
    });

  return products.map((product) => ({
    ...product,
    soldCount: soldCountByProductId.get(product.id) || 0
  }));
}
