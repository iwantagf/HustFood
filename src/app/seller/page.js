"use client";
import { useState, useEffect } from 'react';
import styles from '../admin/admin.module.css';

export default function SellerPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products')
      ]);
      const [ordersData, productsData] = await Promise.all([ordersRes.json(), productsRes.json()]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Không tải được dữ liệu seller:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, nextStatus) => {
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus })
      });
      setOrders((prev) => prev.map((order) => order.id === id ? { ...order, status: nextStatus } : order));
    } catch (error) {
      console.error('Không cập nhật được trạng thái đơn:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ xác nhận</span>;
      case 'processing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      default: return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const revenue = orders
    .filter(order => order.status === 'completed')
    .reduce((acc, order) => acc + (order.totalPrice || 0), 0);

  const pendingCount = orders.filter(order => order.status === 'pending').length;
  const processingCount = orders.filter(order => order.status === 'processing').length;
  const completedCount = orders.filter(order => order.status === 'completed').length;

  const productSales = orders.reduce((acc, order) => {
    order.items?.forEach(item => {
      if (!acc[item.id]) {
        acc[item.id] = { ...item, sold: 0 };
      }
      acc[item.id].sold += item.quantity;
    });
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  return (
    <>
      <h1 className={styles.pageTitle}>Seller Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Trang dành cho người bán: cập nhật trạng thái đơn và theo dõi doanh thu.
      </p>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>₫</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Doanh Thu Hoàn Thành</div>
            <div className={styles.statValue}>{revenue.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>⏳</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn Đang Chờ</div>
            <div className={styles.statValue}>{pendingCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>🚚</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn Đang Giao</div>
            <div className={styles.statValue}>{processingCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn Hoàn Thành</div>
            <div className={styles.statValue}>{completedCount}</div>
          </div>
        </div>
      </div>

      <div className={styles.menuLayout} style={{ gap: '1.5rem' }}>
        <div className={styles.tableContainer} style={{ flex: 2 }}>
          <div style={{ padding: '1.5rem 1.5rem 0' }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>Đơn Hàng Gần Đây</h2>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã ĐH</th>
                <th>Khách</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn hàng nào.</td></tr>
              ) : (
                orders.slice(0, 8).map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer?.name || 'Khách ẩn'}</td>
                    <td style={{ fontWeight: '700' }}>{order.totalPrice?.toLocaleString('vi-VN')}đ</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      {order.status === 'pending' && (
                        <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'processing')}>
                          Xác nhận
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'completed')}>
                          Hoàn thành
                        </button>
                      )}
                      {order.status === 'completed' && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hoàn thành</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.tableContainer} style={{ flex: 1, padding: '1.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Sản phẩm bán chạy</h2>
          {topProducts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Chưa có sản phẩm bán chạy.</p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {topProducts.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '12px' }} />
                  <div>
                    <div style={{ fontWeight: '700' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{item.sold} bán</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Số món đang bán</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className={styles.statCard} style={{ flex: '1 1 100%', padding: '1rem' }}>
                <div className={styles.statInfo}>
                  <div className={styles.statLabel}>Tổng món</div>
                  <div className={styles.statValue}>{products.length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
