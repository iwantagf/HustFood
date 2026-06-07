"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from '../../admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

export default function ShopDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.id;

  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    setFilterMonth(new Date().toISOString().slice(0, 7));
  }, []);

  useEffect(() => {
    if (!shopId) return;
    const fetchData = async () => {
      try {
        const [profilesRes, productsRes, ordersRes] = await Promise.all([
          fetch('/api/merchant-profile'),
          fetch('/api/products'),
          fetch('/api/orders')
        ]);
        const profilesData = await profilesRes.json();
        const productsData = await productsRes.json();
        const ordersData = await ordersRes.json();

        const shopProfile = Array.isArray(profilesData) ? profilesData.find(p => p.ownerId === shopId) : null;
        setProfile(shopProfile);
        
        setProducts(Array.isArray(productsData) ? productsData.filter(p => p.ownerId === shopId) : []);
        setOrders(Array.isArray(ordersData) ? ordersData.filter(o => o.merchantId === shopId) : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId]);

  const handleRequestDelete = async (product) => {
    const reason = prompt(`Nhập lý do yêu cầu xóa món "${product.name}":`);
    if (!reason || !reason.trim()) return;

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: shopId,
          message: `Admin yêu cầu xóa món "${product.name}". Lý do: ${reason}`
        })
      });
      if (res.ok) {
        alert('Đã gửi yêu cầu xóa món tới chủ cửa hàng.');
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi gửi yêu cầu');
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi gửi yêu cầu.');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!filterMonth) return true;
    const d = new Date(o.createdAt);
    return d.toISOString().slice(0, 7) === filterMonth;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  const rejectedOrders = filteredOrders.filter(o => o.status === 'rejected' || o.status === 'cancelled');

  const totalRevenue = completedOrders.reduce((acc, o) => acc + getOrderFinalTotal(o), 0);
  const totalFiltered = completedOrders.length + rejectedOrders.length;
  let completedDegree = 0;
  if (totalFiltered > 0) {
    completedDegree = (completedOrders.length / totalFiltered) * 360;
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  
  if (!profile) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Không tìm thấy cửa hàng.</h2>
      <button onClick={() => router.push('/admin/shops')} className={styles.actionBtn} style={{ marginTop: '1rem' }}>Quay lại</button>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/admin/shops')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: 'var(--text-muted)' }}>←</button>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Chi tiết Cửa Hàng: {profile.shopName}</h1>
      </div>

      <div className={styles.tableContainer} style={{ padding: '2rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {profile.image && (
          <img src={profile.image} alt={profile.shopName} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
        )}
        <div style={{ flex: 1, minWidth: '250px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{profile.shopName}</h2>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}><strong>Chủ quán:</strong> {profile.owner?.displayName || profile.owner?.email || 'Không rõ'}</p>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}><strong>SĐT:</strong> {profile.phone}</p>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}><strong>Địa chỉ:</strong> {profile.address}</p>
          <p style={{ margin: '0.25rem 0', color: 'var(--text-muted)' }}><strong>Giờ mở cửa:</strong> {profile.openTime} - {profile.closeTime}</p>
          <div style={{ marginTop: '1rem' }}>
             <span className={`${styles.statusBadge} ${profile.status === 'active' ? styles.statusCompleted : profile.status === 'blocked' ? styles.statusRejected : styles.statusPending}`}>
               {profile.status === 'active' ? 'Đang hoạt động' : profile.status === 'blocked' ? 'Bị khóa' : 'Chờ duyệt'}
             </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Thống kê tài chính */}
        <div className={styles.tableContainer} style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Thống Kê Tài Chính</h2>
            <input 
              type="month" 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 'bold' }}>TỔNG DOANH THU ({filterMonth || 'Tất cả'})</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d', marginTop: '0.5rem' }}>
              {totalRevenue.toLocaleString('vi-VN')}đ
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Tỉ lệ đơn hàng</h3>
          {totalFiltered === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Không có đơn hàng nào trong khoảng thời gian này</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: `conic-gradient(#10b981 ${completedDegree}deg, #ef4444 ${completedDegree}deg)`,
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#10b981', borderRadius: '4px' }}></div>
                  <span style={{ fontWeight: '500' }}>
                    Hoàn thành: {completedOrders.length} ({Math.round((completedOrders.length / totalFiltered) * 100)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '4px' }}></div>
                  <span style={{ fontWeight: '500' }}>
                    Hủy/Từ chối: {rejectedOrders.length} ({Math.round((rejectedOrders.length / totalFiltered) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thực đơn */}
        <div className={styles.tableContainer} style={{ padding: '2rem' }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem' }}>Thực Đơn Của Quán</h2>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Cửa hàng chưa có món ăn nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {products.map(product => (
                <div key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                  <img src={product.image} alt={product.name} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600' }}>{product.name}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.25rem' }}>{product.price}</div>
                  </div>
                  <button 
                    onClick={() => handleRequestDelete(product)}
                    className={styles.actionBtn} 
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', whiteSpace: 'nowrap' }}
                  >
                    Yêu cầu xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
