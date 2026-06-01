"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin/admin.module.css';
import { useAuth } from '@/context/AuthContext';
import { getOrderFinalTotal } from '@/lib/pricing';

const READY_STATUSES = ['ready_for_pickup', 'processing'];
const ACTIVE_STATUSES = ['picked_up', 'delivering'];

function getStatusBadge(status) {
  switch (status) {
    case 'ready_for_pickup':
    case 'processing':
      return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ nhận giao</span>;
    case 'picked_up':
      return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã lấy hàng</span>;
    case 'delivering':
      return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
    case 'completed':
      return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
    default:
      return <span className={styles.statusBadge}>{status}</span>;
  }
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

export default function ShipperPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Không tải được danh sách đơn.');
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage('Không tải được danh sách đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchOrders, 0);
    const interval = setInterval(fetchOrders, 5000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  const updateOrder = async ({ id, status, action }) => {
    setMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, action })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Không cập nhật được đơn hàng.');
        return;
      }

      setOrders((prev) => prev.map((order) => order.id === id ? data : order));
    } catch (error) {
      setMessage('Không cập nhật được đơn hàng.');
    }
  };

  const availableOrders = useMemo(() => (
    orders.filter((order) => READY_STATUSES.includes(order.status) && (!order.shipperId || order.shipperId === user?.id))
  ), [orders, user?.id]);

  const activeOrders = useMemo(() => (
    orders.filter((order) => ACTIVE_STATUSES.includes(order.status) && order.shipperId === user?.id)
  ), [orders, user?.id]);

  const completedOrders = useMemo(() => (
    orders.filter((order) => order.status === 'completed' && order.shipperId === user?.id)
  ), [orders, user?.id]);

  const codTotal = completedOrders.reduce((total, order) => total + getOrderFinalTotal(order), 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Người giao hàng Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            Nhận đơn đã sẵn sàng, cập nhật trạng thái lấy hàng và hoàn tất giao cho khách.
          </p>
        </div>
        <Link href="/" className={styles.navLink} style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
          Quay lại cửa hàng
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>ON</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Trạng thái</div>
            <div className={styles.statValue}>Sẵn sàng</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>0</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn chờ nhận</div>
            <div className={styles.statValue}>{availableOrders.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>RUN</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn đang giao</div>
            <div className={styles.statValue}>{activeOrders.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>COD</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đối soát hôm nay</div>
            <div className={styles.statValue}>{formatMoney(codTotal)}</div>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {message}
        </div>
      )}

      <section className={styles.tableContainer} style={{ marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>Đơn chờ nhận</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Địa chỉ</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : availableOrders.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn chờ giao.</td></tr>
            ) : (
              availableOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name || 'Khách ẩn'}</td>
                  <td>{order.customer?.address || 'Chưa có địa chỉ'}</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(getOrderFinalTotal(order))}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => updateOrder({ id: order.id, action: 'accept' })}>
                      Nhận đơn
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.tableContainer}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>Đơn của tôi</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Điện thoại</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : activeOrders.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Bạn chưa nhận đơn nào.</td></tr>
            ) : (
              activeOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name || 'Khách ẩn'}</td>
                  <td>{order.customer?.phone || 'Chưa có SĐT'}</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(getOrderFinalTotal(order))}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    {order.status === 'picked_up' && (
                      <button className={styles.actionBtn} onClick={() => updateOrder({ id: order.id, status: 'delivering' })}>
                        Đang giao
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button className={styles.actionBtn} onClick={() => updateOrder({ id: order.id, status: 'completed' })}>
                        Hoàn thành
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
