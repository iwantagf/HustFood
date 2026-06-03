"use client";
import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [products, setProducts] = useState([]);
  const [merchantProfiles, setMerchantProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersRes, proposalsRes, productsRes, profilesRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/proposals'),
        fetch('/api/products'),
        fetch('/api/merchant-profile')
      ]);
      const [ordersData, proposalsData, productsData, profilesData] = await Promise.all([
        ordersRes.json(),
        proposalsRes.json(),
        productsRes.json(),
        profilesRes.json()
      ]);
      setOrders(ordersData);
      setProposals(proposalsData);
      setProducts(productsData);
      setMerchantProfiles(Array.isArray(profilesData) ? profilesData : []);
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
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      case 'rejected': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Từ chối</span>;
      default: return null;
    }
  };

  const getMerchantStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Đã duyệt</span>;
      case 'paused': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Tạm dừng</span>;
      case 'blocked': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Đã khóa</span>;
      case 'pending_review': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ duyệt</span>;
      default: return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const handleProposal = async (id, status) => {
    try {
      await fetch('/api/proposals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi duyệt món.');
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

  const handleDeleteProduct = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món này khỏi thực đơn?')) return;
    try {
      await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi xóa món.');
    }
  };

  const handleMerchantStatus = async (id, status) => {
    try {
      const res = await fetch('/api/merchant-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không cập nhật được cửa hàng.');
        return;
      }

      setMerchantProfiles(prev => prev.map(profile => profile.id === id ? data : profile));
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi cập nhật cửa hàng.');
    }
  };

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const pendingProfiles = merchantProfiles.filter(profile => profile.status === 'pending_review').length;

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

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>🏪</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Cửa Hàng Chờ Duyệt</div>
            <div className={styles.statValue}>{pendingProfiles}</div>
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
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.customer?.name}</td>
                <td style={{ fontWeight: '600' }}>{getOrderFinalTotal(order).toLocaleString('vi-VN')}đ</td>
                <td>{getStatusBadge(order.status)}</td>
                <td>{new Date(order.createdAt).toLocaleTimeString('vi-VN')}</td>
                <td>
                  {order.status === 'completed' && (
                    <button onClick={() => handleDeleteOrder(order.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '2rem'}}>Chưa có đơn hàng nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.pageTitle} style={{ fontSize: '1.5rem', marginTop: '2rem' }}>Duyệt Cửa Hàng Người Bán</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cửa Hàng</th>
              <th>Người Bán</th>
              <th>Liên Hệ</th>
              <th>Trạng Thái</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {merchantProfiles.map(profile => (
              <tr key={profile.id}>
                <td>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {profile.image ? <img src={profile.image} alt={profile.shopName} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} /> : null}
                    <div>
                      <div style={{ fontWeight: '700' }}>{profile.shopName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profile.address}</div>
                    </div>
                  </div>
                </td>
                <td>{profile.owner?.displayName || profile.owner?.email || 'Chưa gắn user'}</td>
                <td>{profile.phone}</td>
                <td>{getMerchantStatusBadge(profile.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {profile.status !== 'active' && (
                      <button onClick={() => handleMerchantStatus(profile.id, 'active')} className={styles.actionBtn}>Duyệt</button>
                    )}
                    {profile.status !== 'blocked' && (
                      <button onClick={() => handleMerchantStatus(profile.id, 'blocked')} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Khóa</button>
                    )}
                    {profile.status === 'blocked' && (
                      <button onClick={() => handleMerchantStatus(profile.id, 'pending_review')} style={{ background: '#f3f4f6', color: '#111', border: '1px solid #ddd', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Mở xét duyệt</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {merchantProfiles.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Chưa có hồ sơ cửa hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.pageTitle} style={{ fontSize: '1.5rem', marginTop: '2rem' }}>Yêu Cầu Món Mới</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên Món</th>
              <th>Mô Tả</th>
              <th>Giá</th>
              <th>Hình Ảnh</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {pendingProposals.map(proposal => (
              <tr key={proposal.id}>
                <td style={{ fontWeight: '600' }}>{proposal.name}</td>
                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proposal.desc}</td>
                <td>{proposal.price}</td>
                <td>
                  {proposal.image ? <img src={proposal.image} alt={proposal.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} /> : 'Không có'}
                </td>
                <td>
                  <button onClick={() => handleProposal(proposal.id, 'accepted')} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontWeight: 'bold' }}>Duyệt</button>
                  <button onClick={() => handleProposal(proposal.id, 'rejected')} style={{ background: '#f3f4f6', color: '#111', border: '1px solid #ddd', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Từ chối</button>
                </td>
              </tr>
            ))}
            {pendingProposals.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Không có yêu cầu món mới nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.pageTitle} style={{ fontSize: '1.5rem', marginTop: '2rem' }}>Quản Lý Thực Đơn</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Hình Ảnh</th>
              <th>Tên Món</th>
              <th>Giá</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>
                  {product.image ? <img src={product.image} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} /> : 'Không có'}
                </td>
                <td style={{ fontWeight: '600' }}>{product.name}</td>
                <td>{product.price}</td>
                <td>
                  <button onClick={() => handleDeleteProduct(product.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xóa</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '2rem'}}>Không có món nào trong thực đơn.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
