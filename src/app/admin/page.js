"use client";
import { useState, useEffect } from 'react';
import styles from './admin.module.css';

export default function DashboardPage() {
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
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const todayTotal = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ xác nhận</span>;
      case 'processing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang nấu & giao</span>;
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      default: return null;
    }
  };

  return (
    <>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>$</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Doanh Thu (Hoàn thành)</div>
            <div className={styles.statValue}>{todayTotal.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>📦</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn Chờ Xác Nhận</div>
            <div className={styles.statValue}>{pendingCount} Đơn</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đã Giao Xong</div>
            <div className={styles.statValue}>{completedCount} Đơn</div>
          </div>
        </div>
      </div>

      <h2 className={styles.pageTitle} style={{ fontSize: '1.5rem' }}>Đơn Hàng Mới Nhất</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách Hàng</th>
              <th>Tổng Tiền</th>
              <th>Trạng Thái</th>
              <th>Thời Gian</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer?.name}</td>
                <td style={{ fontWeight: '600' }}>{order.totalPrice?.toLocaleString('vi-VN')}đ</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Chưa có đơn hàng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
