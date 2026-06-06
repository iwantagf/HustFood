"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { getOrderFinalTotal } from '@/lib/pricing';
import { getEtaText, getOrderProgress, getOrderStatusLabel } from '@/lib/orderTracking';
import styles from './page.module.css';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function getStatusClass(status) {
  if (status === 'completed') return `${styles.statusBadge} ${styles.statusDone}`;
  if (['rejected', 'payment_retry'].includes(status)) return `${styles.statusBadge} ${styles.statusProblem}`;
  return styles.statusBadge;
}

export default function OrdersPage() {
  const { role, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [message, setMessage] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Không tải được đơn hàng.');
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage('Không tải được đơn hàng.');
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && role !== 'customer') {
      router.replace('/login?next=/orders');
    }
  }, [isLoading, role, router]);

  useEffect(() => {
    if (isLoading || role !== 'customer') return undefined;

    const initialFetch = setTimeout(fetchOrders, 0);

    if (typeof EventSource === 'undefined') {
      const interval = setInterval(fetchOrders, 5000);
      return () => {
        clearTimeout(initialFetch);
        clearInterval(interval);
      };
    }

    let fallbackInterval = null;
    const source = new EventSource('/api/orders/stream');
    source.addEventListener('orders', (event) => {
      setOrders(JSON.parse(event.data));
      setLoadingOrders(false);
    });
    source.addEventListener('error', () => {
      source.close();
      if (!fallbackInterval) {
        fallbackInterval = setInterval(fetchOrders, 5000);
      }
    });

    return () => {
      clearTimeout(initialFetch);
      source.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchOrders, isLoading, role]);

  const sortedOrders = useMemo(() => (
    [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  ), [orders]);

  if (isLoading || role !== 'customer') return null;

  return (
    <main>
      <Header />
      <div className={`container ${styles.ordersPage}`}>
        <div className={styles.ordersHeader}>
          <div>
            <h1 className={styles.ordersTitle}>Theo dõi đơn hàng</h1>
            <p className={styles.ordersSubtitle}>Cập nhật trạng thái đơn theo thời gian thực và xem tiến độ giao hàng.</p>
          </div>
          <Link href="/" className="btn btn-outline">Tiếp tục đặt món</Link>
        </div>

        {message && <div className={styles.emptyState}>{message}</div>}

        {loadingOrders ? (
          <div className={styles.emptyState}>Đang tải danh sách đơn...</div>
        ) : sortedOrders.length === 0 ? (
          <div className={styles.emptyState}>Bạn chưa có đơn hàng nào.</div>
        ) : (
          <div className={styles.orderGrid}>
            {sortedOrders.map((order) => {
              const progress = getOrderProgress(order.status);

              return (
                <article key={order.id} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <div>
                      <div className={styles.orderId}>{order.id}</div>
                      <div className={styles.merchantName}>{order.merchantName || 'HustFood'}</div>
                    </div>
                    <span className={getStatusClass(order.status)}>{getOrderStatusLabel(order.status)}</span>
                  </div>

                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                  </div>

                  <div className={styles.orderMeta}>
                    <div>
                      <div className={styles.metaLabel}>Tổng tiền</div>
                      <div className={styles.metaValue}>{formatMoney(getOrderFinalTotal(order))}</div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>ETA</div>
                      <div className={styles.metaValue}>{getEtaText(order)}</div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>Người giao hàng</div>
                      <div className={styles.metaValue}>{order.shipperName || 'Đang phân công'}</div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>Tạo lúc</div>
                      <div className={styles.metaValue}>{new Date(order.createdAt).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>

                  <Link href={`/orders/${encodeURIComponent(order.id)}`} className="btn btn-primary">
                    Xem chi tiết
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
