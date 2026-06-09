"use client";
import Image from 'next/image';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { getOrderFinalTotal } from '@/lib/pricing';
import {
  REPORT_PERIODS,
  buildMerchantRevenueCsv,
  buildOrdersCsv,
  downloadTextFile,
  filterOrdersByPeriod,
  getFinancialSummary,
  getRevenueByMerchant,
  getRevenueSeries,
  printFinancialReport
} from '@/lib/financialDashboard';

export default function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [products, setProducts] = useState([]);
  const [merchantProfiles, setMerchantProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [reportPeriod, setReportPeriod] = useState('month');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ordersRes, proposalsRes, productsRes, profilesRes, usersRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/proposals'),
        fetch('/api/products'),
        fetch('/api/merchant-profile'),
        fetch('/api/admin/users')
      ]);
      const [ordersData, proposalsData, productsData, profilesData, usersData] = await Promise.all([
        ordersRes.json(),
        proposalsRes.json(),
        productsRes.json(),
        profilesRes.json(),
        usersRes.json()
      ]);
      setOrders(ordersData);
      setProposals(proposalsData);
      setProducts(productsData);
      setMerchantProfiles(Array.isArray(profilesData) ? profilesData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
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

  const reportOrders = filterOrdersByPeriod(orders, reportPeriod);
  const reportSummary = getFinancialSummary(reportOrders);
  const revenueByMerchant = getRevenueByMerchant(reportOrders, merchantProfiles);
  const revenueSeries = getRevenueSeries(orders, reportPeriod);
  const maxSeriesValue = Math.max(...revenueSeries.map((item) => item.value), 1);
  const pendingCount = reportOrders.filter(o => o.status === 'pending').length;
  
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

  const getUserRoleLabel = (role) => {
    switch (role) {
      case 'customer': return 'Khách hàng';
      case 'seller': return 'Người bán';
      case 'shipper': return 'Người giao hàng';
      case 'admin': return 'Quản trị viên';
      default: return role || 'Chưa rõ';
    }
  };

  const getUserStatusBadge = (status) => (
    status === 'blocked'
      ? <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Đã khóa</span>
      : <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Đang hoạt động</span>
  );

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

  const handleUserUpdate = async (id, patch) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không cập nhật được tài khoản.');
        return;
      }

      setUsers(prev => prev.map(user => user.id === id ? data : user));
    } catch (error) {
      console.error('Không cập nhật được tài khoản:', error);
      alert('Có lỗi xảy ra khi cập nhật tài khoản.');
    }
  };

  const handleRefundOrder = async (id) => {
    if (!confirm(`Đánh dấu đã hoàn tiền cho đơn ${id}?`)) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'refund' })
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Không cập nhật được trạng thái hoàn tiền.');
        return;
      }

      setOrders(prev => prev.map(order => order.id === id ? data : order));
    } catch (error) {
      console.error('Không cập nhật được hoàn tiền:', error);
      alert('Có lỗi xảy ra khi cập nhật hoàn tiền.');
    }
  };

  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const issueOrders = orders.filter(order => (
    order.rejectionReason
    || order.shipperIssue
    || ['failed', 'retry_required', 'refunded'].includes(order.paymentStatus)
  ));

  const exportAdminCsv = () => {
    downloadTextFile(`hustfood-admin-orders-${reportPeriod}.csv`, buildOrdersCsv(reportOrders));
    downloadTextFile(`hustfood-merchant-revenue-${reportPeriod}.csv`, buildMerchantRevenueCsv(revenueByMerchant));
  };

  const exportAdminPdf = () => {
    printFinancialReport({
      title: `Báo cáo tài chính HustFood - ${REPORT_PERIODS.find((period) => period.value === reportPeriod)?.label || 'Tất cả'}`,
      summary: reportSummary,
      rows: revenueByMerchant
    });
  };

  return (
    <>
      <div className={styles.reportHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.reportSubtitle}>Theo dõi tài chính, đơn hoàn thành và đơn bị từ chối theo kỳ báo cáo.</p>
        </div>
        <div className={styles.reportActions}>
          <div className={styles.segmentedControl} aria-label="Bộ lọc thời gian">
            {REPORT_PERIODS.map((period) => (
              <button
                key={period.value}
                type="button"
                className={reportPeriod === period.value ? styles.segmentActive : ''}
                onClick={() => setReportPeriod(period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.actionBtn} onClick={exportAdminCsv}>Export CSV</button>
          <button type="button" className={styles.actionBtn} onClick={exportAdminPdf}>Export PDF</button>
        </div>
      </div>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>$</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Doanh Thu (Hoàn thành)</div>
            <div className={styles.statValue}>{reportSummary.revenue.toLocaleString('vi-VN')}đ</div>
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
            <div className={styles.statValue}>{reportSummary.completedCount} Đơn</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>!</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn Từ Chối/Hủy</div>
            <div className={styles.statValue}>{reportSummary.rejectedCount} Đơn</div>
          </div>
        </div>
      </div>

      <div className={styles.reportGrid}>
        <section className={styles.chartPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Biểu đồ doanh thu</h2>
            <span className={styles.statusBadge}>AOV {reportSummary.averageOrderValue.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className={styles.barChart}>
            {revenueSeries.map((item) => (
              <div key={item.label} className={styles.barItem}>
                <div className={styles.barTrack}>
                  <div className={styles.barFill} style={{ height: `${Math.max(item.value / maxSeriesValue * 100, item.value ? 8 : 0)}%` }} />
                </div>
                <div className={styles.barLabel}>{item.label}</div>
                <div className={styles.barValue}>{item.value.toLocaleString('vi-VN')}đ</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.chartPanel}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Doanh thu theo cửa hàng</h2>
            <span className={styles.statusBadge}>{revenueByMerchant.length} cửa hàng</span>
          </div>
          <div className={styles.reportList}>
            {revenueByMerchant.length === 0 ? (
              <p className={styles.emptyText}>Chưa có doanh thu trong kỳ này.</p>
            ) : revenueByMerchant.slice(0, 6).map((merchant) => (
              <div key={merchant.merchantId} className={styles.reportListItem}>
                <div>
                  <strong>{merchant.merchantName}</strong>
                  <span>{merchant.orders} đơn hoàn thành</span>
                </div>
                <strong>{merchant.revenue.toLocaleString('vi-VN')}đ</strong>
              </div>
            ))}
          </div>
        </section>
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
                    {profile.image ? <Image src={profile.image} alt={profile.shopName} width={48} height={48} style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} unoptimized /> : null}
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

      <h2 className={styles.pageTitle} style={{ fontSize: '1.5rem', marginTop: '2rem' }}>Quản Lý Tài Khoản & RBAC</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Provider</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{user.displayName || user.username || user.email || user.id}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email || user.username || user.id}</div>
                </td>
                <td>{user.provider || 'credentials'}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(event) => handleUserUpdate(user.id, { role: event.target.value })}
                    style={{ padding: '0.55rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border)', background: '#fff', fontWeight: 700 }}
                    aria-label={`Đổi vai trò ${user.displayName || user.id}`}
                  >
                    {['customer', 'seller', 'shipper', 'admin'].map(role => (
                      <option key={role} value={role}>{getUserRoleLabel(role)}</option>
                    ))}
                  </select>
                </td>
                <td>{getUserStatusBadge(user.status)}</td>
                <td>
                  {user.status === 'blocked' ? (
                    <button className={styles.actionBtn} onClick={() => handleUserUpdate(user.id, { status: 'active' })}>
                      Mở khóa
                    </button>
                  ) : (
                    <button onClick={() => handleUserUpdate(user.id, { status: 'blocked' })} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' }}>
                      Khóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Chưa có tài khoản nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className={styles.pageTitle} style={{ fontSize: '1.5rem', marginTop: '2rem' }}>Khiếu Nại & Hoàn Tiền</h2>
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Vấn đề</th>
              <th>Thanh toán</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {issueOrders.map(order => {
              const issueText = order.shipperIssue || order.rejectionReason || order.paymentFailureReason || 'Cần kiểm tra thanh toán';

              return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name || 'Khách ẩn'}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{issueText}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {order.shipperIssueAt ? `Báo sự cố: ${new Date(order.shipperIssueAt).toLocaleString('vi-VN')}` : order.rejectedAt ? `Từ chối: ${new Date(order.rejectedAt).toLocaleString('vi-VN')}` : 'Theo dõi thanh toán'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{order.paymentMethod?.toUpperCase() || 'COD'}</div>
                    <div style={{ color: order.paymentStatus === 'refunded' ? '#10b981' : 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {order.paymentStatus || 'pending'}
                    </div>
                  </td>
                  <td>
                    {order.paymentStatus === 'refunded' ? (
                      <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Đã hoàn tiền</span>
                    ) : (
                      <button className={styles.actionBtn} onClick={() => handleRefundOrder(order.id)}>
                        Đánh dấu hoàn tiền
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {issueOrders.length === 0 && (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>Chưa có khiếu nại hoặc yêu cầu hoàn tiền.</td></tr>
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
                  {proposal.image ? <Image src={proposal.image} alt={proposal.name} width={40} height={40} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} unoptimized /> : 'Không có'}
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
                  {product.image ? <Image src={product.image} alt={product.name} width={40} height={40} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} unoptimized /> : 'Không có'}
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
