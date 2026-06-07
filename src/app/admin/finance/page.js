"use client";
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

export default function AdminFinancePage() {
  const [orders, setOrders] = useState([]);
  const [merchantProfiles, setMerchantProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTime, setFilterTime] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profilesRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/merchant-profile')
        ]);
        const ordersData = await ordersRes.json();
        const profilesData = await profilesRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setMerchantProfiles(Array.isArray(profilesData) ? profilesData : []);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  
  const filteredOrders = orders.filter(o => {
    if (filterTime === 'all') return true;
    const d = new Date(o.createdAt);
    if (filterTime === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (filterTime === 'week') {
      const today = new Date();
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
      firstDayOfWeek.setHours(0, 0, 0, 0);
      return d >= firstDayOfWeek;
    }
    if (filterTime === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const completedOrders = filteredOrders.filter(o => o.status === 'completed');
  const rejectedOrders = filteredOrders.filter(o => o.status === 'rejected' || o.status === 'cancelled');

  const totalRevenue = completedOrders.reduce((acc, o) => acc + getOrderFinalTotal(o), 0);
  const totalRejectedValue = rejectedOrders.reduce((acc, o) => acc + getOrderFinalTotal(o), 0);
  const rejectedCount = rejectedOrders.length;

  const totalFiltered = completedOrders.length + rejectedOrders.length;
  let completedDegree = 0;
  if (totalFiltered > 0) {
    completedDegree = (completedOrders.length / totalFiltered) * 360;
  }

  // Doanh thu theo cửa hàng
  const shopStats = {};
  merchantProfiles.forEach(p => {
    shopStats[p.ownerId] = {
      name: p.shopName || 'Cửa hàng không tên',
      totalRevenue: 0,
      completedCount: 0,
      rejectedCount: 0
    };
  });

  filteredOrders.forEach(o => {
    const mId = o.merchantId || 'unknown';
    if (!shopStats[mId]) {
      shopStats[mId] = {
        name: o.merchantName || 'Chưa xác định',
        totalRevenue: 0,
        completedCount: 0,
        rejectedCount: 0
      };
    }
    if (o.status === 'completed') {
      shopStats[mId].totalRevenue += getOrderFinalTotal(o);
      shopStats[mId].completedCount += 1;
    } else if (o.status === 'rejected' || o.status === 'cancelled') {
      shopStats[mId].rejectedCount += 1;
    }
  });

  const sortedShops = Object.values(shopStats).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Biểu đồ 7 ngày cho admin (không phụ thuộc vào filterTime để luôn hiển thị trend)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d,
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        dateString: d.toISOString().split('T')[0]
      });
    }
    return days;
  };

  const chartDays = getLast7Days();
  const globalRejectedOrders = orders.filter(o => o.status === 'rejected' || o.status === 'cancelled');
  const chartData = chartDays.map(day => {
    const dayOrders = globalRejectedOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d.toISOString().split('T')[0] === day.dateString;
    });
    return {
      label: day.label,
      count: dayOrders.length,
      value: dayOrders.reduce((acc, o) => acc + getOrderFinalTotal(o), 0)
    };
  });
  const maxChartCount = Math.max(...chartData.map(d => d.count), 1);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Thống Kê Tài Chính</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Theo dõi tổng quan doanh thu và tình trạng đơn hàng toàn hệ thống.
          </p>
        </div>
        <div>
          <select 
            value={filterTime} 
            onChange={(e) => setFilterTime(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff' }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
      </div>

      <div className={styles.statsGrid} style={{ marginBottom: '2.5rem' }}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>💰</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Tổng Doanh Thu</div>
            <div className={styles.statValue}>{totalRevenue.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>❌</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn Hủy/Từ Chối</div>
            <div className={styles.statValue}>{rejectedCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>📉</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Giá Trị Đơn Hủy</div>
            <div className={styles.statValue}>{totalRejectedValue.toLocaleString('vi-VN')}đ</div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 className={styles.sectionTitle} style={{ margin: 0, marginBottom: '2rem' }}>Tỉ Lệ Đơn Hàng</h2>
        
        {totalFiltered === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Không có đơn hàng nào trong khoảng thời gian này</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              background: `conic-gradient(#10b981 ${completedDegree}deg, #ef4444 ${completedDegree}deg)`,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#10b981', borderRadius: '6px' }}></div>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  Hoàn thành: {completedOrders.length} đơn ({Math.round((completedOrders.length / totalFiltered) * 100)}%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#ef4444', borderRadius: '6px' }}></div>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  Hủy/Từ chối: {rejectedOrders.length} đơn ({Math.round((rejectedOrders.length / totalFiltered) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.tableContainer} style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 className={styles.sectionTitle}>Doanh Thu Theo Cửa Hàng</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className={styles.table} style={{ marginTop: '1rem', width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Cửa Hàng</th>
                <th style={{ textAlign: 'center' }}>Đơn Hoàn Thành</th>
                <th style={{ textAlign: 'center' }}>Đơn Hủy/Từ Chối</th>
                <th style={{ textAlign: 'right' }}>Tổng Doanh Thu</th>
              </tr>
            </thead>
            <tbody>
              {sortedShops.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Không có dữ liệu</td>
                </tr>
              ) : (
                sortedShops.map((shop, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: '600' }}>{shop.name}</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: '500' }}>{shop.completedCount}</td>
                    <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: '500' }}>{shop.rejectedCount}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>{shop.totalRevenue.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ padding: '2rem' }}>
        <h2 className={styles.sectionTitle}>Biểu Đồ Đơn Hủy/Từ Chối (7 Ngày Gần Nhất)</h2>
        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'flex-end', height: '300px', gap: '1rem', paddingBottom: '2rem', borderBottom: '1px solid #eee' }}>
          {chartData.map((data, index) => {
            const heightPercent = (data.count / maxChartCount) * 100;
            return (
              <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                <div style={{ 
                  width: '100%', 
                  maxWidth: '60px', 
                  height: `${heightPercent}%`, 
                  minHeight: data.count > 0 ? '20px' : '0',
                  background: 'linear-gradient(180deg, #ef4444 0%, #fca5a5 100%)',
                  borderRadius: '6px 6px 0 0',
                  position: 'relative',
                  transition: 'height 0.5s ease-out'
                }}>
                  {data.count > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '-25px', 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      background: '#1f2937',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap'
                    }}>
                      {data.count} đơn
                    </div>
                  )}
                </div>
                <div style={{ position: 'absolute', bottom: '-25px', fontSize: '0.9rem', color: '#6b7280', fontWeight: '500' }}>
                  {data.label}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(180deg, #ef4444 0%, #fca5a5 100%)' }}></div>
            <span style={{ color: '#4b5563', fontSize: '0.9rem', fontWeight: '500' }}>Số lượng đơn hủy/từ chối</span>
          </div>
        </div>
      </div>
    </div>
  );
}
