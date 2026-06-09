import { getOrderFinalTotal } from '@/lib/pricing';

export const REPORT_PERIODS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'all', label: 'Tất cả' }
];

const COMPLETED_STATUS = 'completed';
const REJECTED_STATUSES = new Set(['rejected']);

function startOfDay(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function startOfWeek(date) {
  const nextDate = startOfDay(date);
  const day = nextDate.getDay() || 7;
  nextDate.setDate(nextDate.getDate() - day + 1);
  return nextDate;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function addMonths(date, amount) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + amount);
  return nextDate;
}

function getOrderReportDate(order) {
  return new Date(order?.deliveredAt || order?.createdAt || Date.now());
}

export function getReportRange(period, now = new Date()) {
  if (period === 'today') {
    const start = startOfDay(now);
    return { start, end: addDays(start, 1) };
  }

  if (period === 'week') {
    const start = startOfWeek(now);
    return { start, end: addDays(start, 7) };
  }

  if (period === 'month') {
    const start = startOfMonth(now);
    return { start, end: addMonths(start, 1) };
  }

  return { start: null, end: null };
}

export function filterOrdersByPeriod(orders = [], period = 'all') {
  const { start, end } = getReportRange(period);
  if (!start || !end) return orders;

  return orders.filter((order) => {
    const reportDate = getOrderReportDate(order);
    return reportDate >= start && reportDate < end;
  });
}

export function getFinancialSummary(orders = []) {
  const completedOrders = orders.filter((order) => order.status === COMPLETED_STATUS);
  const rejectedOrders = orders.filter((order) => REJECTED_STATUSES.has(order.status));
  const revenue = completedOrders.reduce((total, order) => total + getOrderFinalTotal(order), 0);

  return {
    revenue,
    totalOrders: orders.length,
    completedCount: completedOrders.length,
    rejectedCount: rejectedOrders.length,
    averageOrderValue: completedOrders.length ? Math.round(revenue / completedOrders.length) : 0
  };
}

export function getRevenueByMerchant(orders = [], profiles = []) {
  const profileByOwnerId = new Map(profiles.map((profile) => [profile.ownerId, profile]));
  const revenueByMerchant = new Map();

  orders
    .filter((order) => order.status === COMPLETED_STATUS)
    .forEach((order) => {
      const merchantId = order.merchantId || 'unknown';
      const profile = profileByOwnerId.get(merchantId);
      const current = revenueByMerchant.get(merchantId) || {
        merchantId,
        merchantName: order.merchantName || profile?.shopName || 'Cửa hàng chưa rõ',
        orders: 0,
        revenue: 0
      };

      current.orders += 1;
      current.revenue += getOrderFinalTotal(order);
      revenueByMerchant.set(merchantId, current);
    });

  return Array.from(revenueByMerchant.values()).sort((a, b) => b.revenue - a.revenue);
}

export function getRevenueSeries(orders = [], period = 'all') {
  const filteredOrders = filterOrdersByPeriod(orders, period);
  const completedOrders = filteredOrders.filter((order) => order.status === COMPLETED_STATUS);
  const now = new Date();
  const seriesMap = new Map();

  let keys = [];
  if (period === 'today') {
    keys = Array.from({ length: 6 }, (_, index) => {
      const startHour = index * 4;
      return `${String(startHour).padStart(2, '0')}:00`;
    });
  } else if (period === 'week') {
    const start = startOfWeek(now);
    keys = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      return date.toLocaleDateString('vi-VN', { weekday: 'short' });
    });
  } else if (period === 'month') {
    keys = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5'];
  } else {
    keys = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  }

  keys.forEach((key) => seriesMap.set(key, 0));

  completedOrders.forEach((order) => {
    const date = getOrderReportDate(order);
    let key;

    if (period === 'today') {
      key = `${String(Math.floor(date.getHours() / 4) * 4).padStart(2, '0')}:00`;
    } else if (period === 'week') {
      key = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    } else if (period === 'month') {
      key = `Tuần ${Math.min(Math.ceil(date.getDate() / 7), 5)}`;
    } else {
      key = `Tháng ${date.getMonth() + 1}`;
    }

    seriesMap.set(key, (seriesMap.get(key) || 0) + getOrderFinalTotal(order));
  });

  return Array.from(seriesMap.entries()).map(([label, value]) => ({ label, value }));
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '');
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildOrdersCsv(orders = []) {
  const rows = [
    ['Mã đơn', 'Cửa hàng', 'Khách hàng', 'Trạng thái', 'Tổng tiền', 'Ngày tạo'],
    ...orders.map((order) => [
      order.id,
      order.merchantName || '',
      order.customer?.name || '',
      order.status,
      getOrderFinalTotal(order),
      order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : ''
    ])
  ];

  return rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

export function buildMerchantRevenueCsv(rows = []) {
  const csvRows = [
    ['Cửa hàng', 'Số đơn hoàn thành', 'Doanh thu'],
    ...rows.map((row) => [row.merchantName, row.orders, row.revenue])
  ];

  return csvRows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
}

export function downloadTextFile(filename, content, mimeType = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function printFinancialReport({ title, summary, rows = [] }) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rowHtml = rows.map((row) => `
    <tr>
      <td>${escapeHtml(row.merchantName || row.label || '')}</td>
      <td>${Number(row.orders || row.completedCount || 0).toLocaleString('vi-VN')}</td>
      <td>${Number(row.revenue || row.value || 0).toLocaleString('vi-VN')}đ</td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { margin: 0 0 16px; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
          .label { color: #6b7280; font-size: 12px; }
          .value { font-weight: 700; font-size: 18px; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <div class="summary">
          <div class="card"><div class="label">Doanh thu</div><div class="value">${summary.revenue.toLocaleString('vi-VN')}đ</div></div>
          <div class="card"><div class="label">Tổng đơn</div><div class="value">${summary.totalOrders}</div></div>
          <div class="card"><div class="label">Hoàn thành</div><div class="value">${summary.completedCount}</div></div>
          <div class="card"><div class="label">Từ chối/hủy</div><div class="value">${summary.rejectedCount}</div></div>
        </div>
        <table>
          <thead><tr><th>Nhóm</th><th>Số đơn</th><th>Doanh thu</th></tr></thead>
          <tbody>${rowHtml}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
