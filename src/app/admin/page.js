"use client";
import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

function formatFacebookTime(dateString) {
  if (!dateString) return { exactDate: '', relativeTime: '' };
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const exactDate = `${day}/${month}/${year}`;
  
  let relativeTime = '';
  if (diffInSeconds < 60) {
    relativeTime = 'Vài giây trước';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    relativeTime = `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    relativeTime = `${hours} giờ trước`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    relativeTime = `${days} ngày trước`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    relativeTime = `${months} tháng trước`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    relativeTime = `${years} năm trước`;
  }
  
  return { exactDate, relativeTime };
}

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      setOrders(ordersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchData, 0);
    const interval = setInterval(fetchData, 5000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  const todayTotal = orders
    .filter(o => o.status === 'completed')
    .reduce((acc, curr) => acc + getOrderFinalTotal(curr), 0);
  
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ xác nhận</span>;
      case 'payment_retry': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Chờ thanh toán lại</span>;
      case 'accepted': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã nhận đơn</span>;
      case 'preparing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang chuẩn bị</span>;
      case 'ready_for_pickup':
      case 'processing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Chờ giao hàng</span>;
      case 'picked_up': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã lấy hàng</span>;
      case 'delivering': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
      case 'delivering': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      case 'rejected': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Từ chối</span>;
      case 'cancelled': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Khách hủy</span>;
      default: return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const handleDeleteOrder = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi xóa đơn hàng.');
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
              <th>Thời gian</th>
              <th>Khách</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn hàng nào.</td></tr>
            ) : (
              orders.slice(0, 15).map(order => {
                const { exactDate, relativeTime } = formatFacebookTime(order.createdAt);
                return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    <div>{exactDate}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{relativeTime}</div>
                  </td>
                  <td>{order.customer?.name || 'Khách ẩn'}</td>
                  <td style={{ fontWeight: '700' }}>
                    {getOrderFinalTotal(order).toLocaleString('vi-VN')}đ
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {order.paymentMethod?.toUpperCase() || 'COD'} · {order.paymentStatus || 'pending'}
                    </div>
                  </td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    {order.status === 'completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hoàn thành</span>
                        <button onClick={() => handleDeleteOrder(order.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Xóa</button>
                      </div>
                    )}
                    {['payment_retry'].includes(order.status) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chờ khách thanh toán lại</span>
                    )}
                    {['ready_for_pickup', 'processing'].includes(order.status) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Đang chờ shipper</span>
                    )}
                    {['picked_up', 'delivering'].includes(order.status) && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {order.shipperName ? `Shipper: ${order.shipperName}` : 'Shipper đang xử lý'}
                      </span>
                    )}
                    {order.status === 'rejected' && (
                      <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                        Bạn đã từ chối: {order.rejectionReason || 'Không có lý do'}
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                        Khách hủy: {order.rejectionReason || 'Không có lý do'}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
