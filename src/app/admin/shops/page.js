"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../admin.module.css';

export default function ShopsPage() {
  const [merchantProfiles, setMerchantProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchData = async () => {
    try {
      const profilesRes = await fetch('/api/merchant-profile');
      const profilesData = await profilesRes.json();
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

  const getMerchantStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Đã duyệt</span>;
      case 'paused': return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Tạm dừng</span>;
      case 'blocked': return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Đã khóa</span>;
      case 'pending_review': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ duyệt</span>;
      default: return <span className={styles.statusBadge}>{status}</span>;
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

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Quản Lý Cửa Hàng</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Duyệt và quản lý trạng thái các cửa hàng trên hệ thống.</p>
        </div>
        <div>
          <input
            type="text"
            placeholder="Tìm kiếm cửa hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', minWidth: '250px' }}
          />
        </div>
      </div>
      
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
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Đang tải dữ liệu...</td></tr>
            ) : merchantProfiles.filter(profile => 
                (profile.shopName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (profile.owner?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
              ).map(profile => (
              <tr 
                key={profile.id} 
                onClick={() => router.push(`/admin/shops/${profile.ownerId}`)}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
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
                      <button onClick={(e) => { e.stopPropagation(); handleMerchantStatus(profile.id, 'active'); }} className={styles.actionBtn}>Duyệt</button>
                    )}
                    {profile.status !== 'blocked' && (
                      <button onClick={(e) => { e.stopPropagation(); handleMerchantStatus(profile.id, 'blocked'); }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Khóa</button>
                    )}
                    {profile.status === 'blocked' && (
                      <button onClick={(e) => { e.stopPropagation(); handleMerchantStatus(profile.id, 'pending_review'); }} style={{ background: '#f3f4f6', color: '#111', border: '1px solid #ddd', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>Mở xét duyệt</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && merchantProfiles.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Chưa có hồ sơ cửa hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
