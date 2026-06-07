"use client";
import { useState, useEffect } from 'react';
import styles from '../../admin/admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';

export default function FinancePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTime, setFilterTime] = useState('month');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Lỗi khi tải đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
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

  // Prepare data for the 7-day chart
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

  const maxChartCount = Math.max(...chartData.map(d => d.count), 1); // Avoid division by zero

  const completedFiltered = completedOrders.length;
  const rejectedFiltered = rejectedOrders.length;
  const totalFiltered = completedFiltered + rejectedFiltered;

  let completedDegree = 0;
  if (totalFiltered > 0) {
    completedDegree = (completedFiltered / totalFiltered) * 360;
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải dữ liệu...</div>;
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>Thống Kê Tài Chính</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Theo dõi doanh thu và thống kê các đơn bị hủy/từ chối.
      </p>

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
            <div className={styles.statLabel}>Số Đơn Hủy/Từ Chối</div>
            <div className={styles.statValue}>{rejectedCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>📉</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Giá Trị Đơn Hủy/Từ Chối</div>
            <div className={styles.statValue}>{totalRejectedValue.toLocaleString('vi-VN')}đ</div>
          </div>
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

      <div className={styles.tableContainer} style={{ padding: '2rem', marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Tỉ Lệ Đơn Hàng Hoàn Thành / Thất Bại</h2>
          <select 
            value={filterTime} 
            onChange={(e) => setFilterTime(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
          </select>
        </div>
        
        {totalFiltered === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Không có đơn hàng nào trong khoảng thời gian này</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem', marginTop: '3rem', flexWrap: 'wrap' }}>
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
                  Hoàn thành: {completedFiltered} đơn ({Math.round((completedFiltered / totalFiltered) * 100)}%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#ef4444', borderRadius: '6px' }}></div>
                <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                  Hủy/Từ chối: {rejectedFiltered} đơn ({Math.round((rejectedFiltered / totalFiltered) * 100)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {rejectedCount > 0 && (
        <div className={styles.tableContainer} style={{ marginTop: '2.5rem' }}>
          <h2 className={styles.sectionTitle} style={{ padding: '1.5rem 1.5rem 0' }}>Chi Tiết Các Đơn Hủy/Từ Chối</h2>
          <table className={styles.table} style={{ marginTop: '1rem' }}>
            <thead>
              <tr>
                <th>Mã ĐH</th>
                <th>Thời gian</th>
                <th>Khách hàng</th>
                <th>Loại hủy</th>
                <th>Lý do</th>
                <th>Giá trị</th>
              </tr>
            </thead>
            <tbody>
              {rejectedOrders.slice(0, 20).map(order => {
                const date = new Date(order.createdAt);
                const typeLabel = order.status === 'cancelled' ? 'Khách hủy' : 'Bạn từ chối';
                return (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>
                      <div>{date.toLocaleDateString('vi-VN')}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {date.toLocaleTimeString('vi-VN')}
                      </div>
                    </td>
                    <td>{order.customer?.name || 'Khách ẩn'}</td>
                    <td>
                      <span style={{ 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        background: order.status === 'cancelled' ? '#fff7ed' : '#fef2f2',
                        color: order.status === 'cancelled' ? '#c2410c' : '#ef4444'
                      }}>
                        {typeLabel}
                      </span>
                    </td>
                    <td style={{ color: '#ef4444' }}>{order.rejectionReason || 'Không có'}</td>
                    <td style={{ fontWeight: '700' }}>{getOrderFinalTotal(order).toLocaleString('vi-VN')}đ</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
