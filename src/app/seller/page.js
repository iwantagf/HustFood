"use client";
import { useState, useEffect } from 'react';
import styles from '../admin/admin.module.css';
import Link from 'next/link';

export default function SellerPage() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [merchantProfile, setMerchantProfile] = useState({
    shopName: '',
    address: '',
    mapLocation: '',
    openTime: '08:00',
    closeTime: '22:00',
    phone: '',
    image: '',
    status: 'active'
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [proposal, setProposal] = useState({ name: '', desc: '', price: '', image: '' });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isProposing, setIsProposing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, notificationsRes, profileRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/products'),
        fetch('/api/notifications'),
        fetch('/api/merchant-profile')
      ]);
      const [ordersData, productsData, notifData, profileData] = await Promise.all([
        ordersRes.json(),
        productsRes.json(),
        notificationsRes.json(),
        profileRes.json()
      ]);
      setOrders(ordersData);
      setProducts(productsData);
      setNotifications(notifData);
      setMerchantProfile(profileData);
    } catch (error) {
      console.error('Không tải được dữ liệu seller:', error);
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

  const handlePropose = async (e) => {
    e.preventDefault();
    setIsProposing(true);
    try {
      await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      });
      alert('Đã gửi đề xuất món mới! Đang chờ Quản trị viên duyệt.');
      setProposal({ name: '', desc: '', price: '', image: '' });
    } catch (err) {
      alert('Có lỗi xảy ra khi gửi đề xuất.');
    } finally {
      setIsProposing(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setMerchantProfile(prev => ({ ...prev, [field]: value }));
  };

  const getProfileStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'paused': return 'Tạm dừng';
      case 'blocked': return 'Đã bị khóa';
      case 'pending_review': return 'Chờ Quản trị viên duyệt';
      default: return status || 'Chờ Quản trị viên duyệt';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      let imageUrl = merchantProfile.image || '/images/burger.png';

      if (profileImageFile) {
        const uploadData = new FormData();
        uploadData.append('file', profileImageFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });
        const uploadResult = await uploadRes.json();

        if (!uploadRes.ok || !uploadResult.success) {
          alert(uploadResult.error || 'Không tải được ảnh đại diện.');
          return;
        }

        imageUrl = uploadResult.url;
      }

      const res = await fetch('/api/merchant-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...merchantProfile, image: imageUrl })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không lưu được hồ sơ cửa hàng.');
        return;
      }

      setMerchantProfile(data);
      setProfileImageFile(null);
      alert('Đã lưu hồ sơ cửa hàng.');
    } catch (error) {
      console.error('Không lưu được hồ sơ cửa hàng:', error);
      alert('Có lỗi xảy ra khi lưu hồ sơ cửa hàng.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const markAsRead = async (id) => {
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Người bán Dashboard</h1>
          <Link href="/" style={{ textDecoration: 'none', background: '#f3f4f6', padding: '0.5rem 1rem', borderRadius: '8px', color: '#333', fontWeight: '500', fontSize: '0.9rem', border: '1px solid #ddd' }}>
            ← Quay lại trang chủ
          </Link>
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            type="button" 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', fontSize: '1.5rem' }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div style={{ position: 'absolute', top: '40px', right: '0', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '1rem', zIndex: 100 }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Thông Báo</h3>
              {notifications.length === 0 ? (
                <p style={{ color: '#888', textAlign: 'center', margin: '2rem 0' }}>Không có thông báo nào.</p>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.slice().reverse().map(notif => (
                    <div 
                      key={notif.id} 
                      style={{ padding: '0.75rem', background: notif.read ? '#f9f9f9' : '#eff6ff', borderRadius: '8px', cursor: notif.read ? 'default' : 'pointer' }}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                    >
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.9rem', color: notif.read ? '#555' : '#000', fontWeight: notif.read ? 'normal' : '600' }}>{notif.message}</p>
                      <span style={{ fontSize: '0.75rem', color: '#999' }}>{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Trang dành cho người bán: cập nhật trạng thái đơn và theo dõi doanh thu.
      </p>

      <div className={styles.tableContainer} style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', marginBottom: '0.35rem' }}>Hồ sơ cửa hàng</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Thiết lập thông tin gian hàng để khách hàng có thể xem địa chỉ, giờ mở cửa và liên hệ.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${merchantProfile.status === 'active' ? styles.statusCompleted : merchantProfile.status === 'blocked' ? styles.statusRejected : styles.statusPending}`}>
            {getProfileStatusLabel(merchantProfile.status)}
          </span>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Tên quán</label>
            <input required type="text" value={merchantProfile.shopName || ''} onChange={e => handleProfileChange('shopName', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Số điện thoại</label>
            <input required type="tel" value={merchantProfile.phone || ''} onChange={e => handleProfileChange('phone', e.target.value)} placeholder="0987654321" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Giờ mở cửa</label>
            <input required type="time" value={merchantProfile.openTime || '08:00'} onChange={e => handleProfileChange('openTime', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Giờ đóng cửa</label>
            <input required type="time" value={merchantProfile.closeTime || '22:00'} onChange={e => handleProfileChange('closeTime', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Địa chỉ</label>
            <input required type="text" value={merchantProfile.address || ''} onChange={e => handleProfileChange('address', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Tọa độ bản đồ</label>
            <input type="text" value={merchantProfile.mapLocation || ''} onChange={e => handleProfileChange('mapLocation', e.target.value)} placeholder="21.0059,105.8431" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Ảnh đại diện</label>
            <input type="file" accept="image/*" onChange={e => setProfileImageFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px dashed var(--primary)', background: 'var(--primary-light)' }} />
            {merchantProfile.image && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.65rem' }}>
                <img src={merchantProfile.image} alt={merchantProfile.shopName || 'Ảnh cửa hàng'} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{profileImageFile ? profileImageFile.name : 'Ảnh hiện tại'}</span>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Trạng thái</label>
            <select value={merchantProfile.status || 'active'} onChange={e => handleProfileChange('status', e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
              <option value="pending_review" disabled>Chờ Quản trị viên duyệt</option>
              <option value="active">Đang hoạt động</option>
              <option value="paused">Tạm dừng nhận đơn</option>
              <option value="blocked" disabled>Đã bị khóa</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="submit" disabled={isSavingProfile} className={styles.actionBtn} style={{ width: '100%', padding: '0.75rem', opacity: isSavingProfile ? 0.7 : 1 }}>
              {isSavingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>

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
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hoàn thành</span>
                          <button onClick={() => handleDeleteOrder(order.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Xóa</button>
                        </div>
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
          
          <div style={{ marginTop: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '16px', border: '1px solid #eee' }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Đề Xuất Món Mới</h2>
            <form onSubmit={handlePropose} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Tên món</label>
                <input required type="text" value={proposal.name} onChange={e => setProposal({...proposal, name: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Mô tả</label>
                <textarea required value={proposal.desc} onChange={e => setProposal({...proposal, desc: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', minHeight: '80px' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>Giá (VD: 65.000đ)</label>
                <input required type="text" value={proposal.price} onChange={e => setProposal({...proposal, price: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.9rem' }}>URL Hình ảnh (Tùy chọn)</label>
                <input type="text" value={proposal.image} onChange={e => setProposal({...proposal, image: e.target.value})} placeholder="/images/burger.png" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              </div>
              <button type="submit" disabled={isProposing} style={{ padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: isProposing ? 'not-allowed' : 'pointer', opacity: isProposing ? 0.7 : 1 }}>
                {isProposing ? 'Đang gửi...' : 'Gửi Đề Xuất'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
