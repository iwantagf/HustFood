"use client";
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchOrders, 0);
    // Tự động làm mới mỗi 5 giây
    const interval = setInterval(fetchOrders, 5000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = async (id, newStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
    } catch (e) {
      console.error(e);
      fetchOrders();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ xác nhận</span>;
      case 'payment_retry': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Chờ thanh toán lại</span>;
      case 'ready_for_pickup': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Chờ giao hàng</span>;
      case 'processing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Chờ giao hàng</span>;
      case 'picked_up': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã lấy hàng</span>;
      case 'delivering': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      case 'rejected': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Từ chối</span>;
      default: return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  return (
    <>
      <h1 className={styles.pageTitle}>Quản lý Đơn Hàng {loading && <span style={{fontSize: '1rem', color: 'gray'}}>(Đang tải...)</span>}</h1>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách Hàng</th>
              <th>Chi Tiết</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Chưa có đơn hàng nào</td></tr>
            ) : orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>
                  <strong>{order.customer?.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    SĐT: {order.customer?.phone}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt).toLocaleTimeString('vi-VN')}
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>
                  {order.items?.map(item => (
                    <div key={item.id}>{item.quantity}x {item.name}</div>
                  ))}
                </td>
                <td style={{ fontWeight: '600' }}>
                  {getOrderFinalTotal(order).toLocaleString('vi-VN')}đ
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {order.paymentMethod?.toUpperCase() || 'COD'} · {order.paymentStatus || 'pending'}
                  </div>
                </td>
                <td>{getStatusBadge(order.status)}</td>
                <td>
                  {order.status === 'pending' && (
                    <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'ready_for_pickup')}>Sẵn sàng giao</button>
                  )}
                  {order.status === 'payment_retry' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chờ khách thanh toán lại</span>
                  )}
                  {['ready_for_pickup', 'processing', 'picked_up', 'delivering'].includes(order.status) && (
                    <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'completed')}>Hoàn thành</button>
                  )}
                  {order.status === 'completed' && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Không có</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
