"use client";
import { useState, useEffect, useRef } from 'react';
import styles from '../admin/admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

const IN_PROGRESS_STATUSES = ['accepted', 'preparing', 'ready_for_pickup', 'processing', 'picked_up', 'delivering'];

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

function playNewOrderSound() {
  if (typeof window === 'undefined') return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.28);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    // Browser autoplay policy can block audio
  }
}

export default function SellerPage() {
  const [orders, setOrders] = useState([]);
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
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderMessage, setOrderMessage] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const knownOrderIdsRef = useRef(new Set());
  const hasLoadedOrdersRef = useRef(false);

  const fetchData = async () => {
    try {
      const [ordersRes, notificationsRes, profileRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/notifications'),
        fetch('/api/merchant-profile')
      ]);
      const [ordersData, notifData, profileData] = await Promise.all([
        ordersRes.json(),
        notificationsRes.json(),
        profileRes.json()
      ]);
      const nextOrders = Array.isArray(ordersData) ? ordersData : [];
      const incomingOrders = nextOrders.filter((order) => (
        order.status === 'pending' && !knownOrderIdsRef.current.has(order.id)
      ));

      if (hasLoadedOrdersRef.current && incomingOrders.length > 0) {
        setNewOrderAlert({
          count: incomingOrders.length,
          latest: incomingOrders[0]
        });
        playNewOrderSound();
      }

      knownOrderIdsRef.current = new Set(nextOrders.map((order) => order.id));
      hasLoadedOrdersRef.current = true;
      setOrders(nextOrders);
      setNotifications(Array.isArray(notifData) ? notifData : []);
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

  const updateStatus = async (id, nextStatus, extraData = {}) => {
    setOrderMessage('');
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus, ...extraData })
      });
      const data = await res.json();

      if (!res.ok) {
        setOrderMessage(data.error || 'Không cập nhật được trạng thái đơn.');
        return;
      }

      setOrders((prev) => prev.map((order) => order.id === id ? data : order));
    } catch (error) {
      console.error('Không cập nhật được trạng thái đơn:', error);
      setOrderMessage('Không cập nhật được trạng thái đơn.');
    }
  };

  const rejectOrder = (order) => {
    const reason = prompt(`Nhập lý do từ chối đơn ${order.id}`);
    if (!reason || !reason.trim()) return;
    updateStatus(order.id, 'rejected', { rejectionReason: reason.trim() });
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
      case 'payment_retry': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Chờ thanh toán lại</span>;
      case 'accepted': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã nhận đơn</span>;
      case 'preparing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang chuẩn bị</span>;
      case 'ready_for_pickup': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Chờ giao hàng</span>;
      case 'processing': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Chờ giao hàng</span>;
      case 'picked_up': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã lấy hàng</span>;
      case 'delivering': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
      case 'rejected': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Từ chối</span>;
      default: return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const revenue = orders
    .filter(order => order.status === 'completed')
    .reduce((acc, order) => acc + getOrderFinalTotal(order), 0);

  const pendingCount = orders.filter(order => order.status === 'pending').length;
  const processingCount = orders.filter(order => IN_PROGRESS_STATUSES.includes(order.status)).length;
  const completedCount = orders.filter(order => order.status === 'completed').length;

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

  const filteredOrders = orders.filter(order => {
    if (filterType === 'all' || !filterValue) return true;
    const orderDate = new Date(order.createdAt);
    
    if (filterType === 'date') {
      const date = orderDate.getDate().toString().padStart(2, '0');
      const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      const year = orderDate.getFullYear();
      const orderDateStr = `${year}-${month}-${date}`;
      return orderDateStr === filterValue;
    }
    if (filterType === 'month') {
      const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
      const year = orderDate.getFullYear();
      const orderMonthStr = `${year}-${month}`;
      return orderMonthStr === filterValue;
    }
    if (filterType === 'year') {
      const year = orderDate.getFullYear().toString();
      return year === filterValue;
    }
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 className={styles.pageTitle} style={{ marginBottom: 0 }}>Tổng quan Cửa Hàng</h1>
        
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
        Cập nhật trạng thái đơn, theo dõi doanh thu và thiết lập hồ sơ.
      </p>

      {newOrderAlert && (
        <div style={{ marginBottom: '1rem', padding: '1rem 1.1rem', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <strong>Có {newOrderAlert.count} đơn mới</strong>
            <div style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>
              Đơn gần nhất: {newOrderAlert.latest?.id} · {newOrderAlert.latest?.customer?.name || 'Khách ẩn'}
            </div>
          </div>
          <button type="button" className={styles.actionBtn} onClick={() => setNewOrderAlert(null)} style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
            Đã xem
          </button>
        </div>
      )}

      {orderMessage && (
        <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {orderMessage}
        </div>
      )}

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
            <div className={styles.statLabel}>Đơn Đang Xử Lý</div>
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

      <div className={styles.tableContainer}>
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', margin: 0 }}>Đơn Hàng Gần Đây</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select 
              value={filterType} 
              onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="date">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="year">Theo năm</option>
            </select>
            
            {filterType === 'date' && (
              <input 
                type="date" 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            )}
            {filterType === 'month' && (
              <input 
                type="month" 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            )}
            {filterType === 'year' && (
              <input 
                type="number" 
                placeholder="Năm (VD: 2026)" 
                value={filterValue} 
                onChange={(e) => setFilterValue(e.target.value)} 
                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', width: '120px' }}
              />
            )}
          </div>
        </div>
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
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn hàng nào.</td></tr>
            ) : (
              filteredOrders.slice(0, 15).map(order => {
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
                    {order.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'accepted')}>
                          Nhận đơn
                        </button>
                        <button className={styles.actionBtn} onClick={() => rejectOrder(order)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                          Từ chối
                        </button>
                      </div>
                    )}
                    {order.status === 'accepted' && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'preparing')}>
                          Bắt đầu chuẩn bị
                        </button>
                        <button className={styles.actionBtn} onClick={() => rejectOrder(order)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }}>
                          Từ chối
                        </button>
                      </div>
                    )}
                    {order.status === 'preparing' && (
                      <button className={styles.actionBtn} onClick={() => updateStatus(order.id, 'ready_for_pickup')}>
                        Chờ giao hàng
                      </button>
                    )}
                    {order.status === 'payment_retry' && (
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
                    {order.status === 'completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Hoàn thành</span>
                        <button onClick={() => handleDeleteOrder(order.id)} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Xóa</button>
                      </div>
                    )}
                    {order.status === 'rejected' && (
                      <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>
                        {order.rejectionReason || 'Đã từ chối'}
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
    </div>
  );
}
