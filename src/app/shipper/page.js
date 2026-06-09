"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '../admin/admin.module.css';
import { useAuth } from '@/context/AuthContext';
import { getOrderFinalTotal } from '@/lib/pricing';

const READY_STATUSES = ['ready_for_pickup', 'processing'];
const ACTIVE_STATUSES = ['picked_up', 'delivering'];
const DISTANCE_FILTERS = [
  { label: 'Tất cả', value: 'all' },
  { label: '3 km', value: '3' },
  { label: '5 km', value: '5' },
  { label: '10 km', value: '10' }
];

function getStatusBadge(status) {
  switch (status) {
    case 'ready_for_pickup':
    case 'processing':
      return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Chờ nhận giao</span>;
    case 'picked_up':
      return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đã lấy hàng</span>;
    case 'delivering':
      return <span className={`${styles.statusBadge} ${styles.statusProcessing}`}>Đang giao</span>;
    case 'completed':
      return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Hoàn thành</span>;
    default:
      return <span className={styles.statusBadge}>{status}</span>;
  }
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function parseLocation(value) {
  if (!value) return null;
  const [latitude, longitude] = String(value).split(',').map((part) => Number(part.trim()));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
}

function calculateDistanceKm(from, to) {
  if (!from || !to) return null;

  const earthRadiusKm = 6371;
  const toRad = (degree) => degree * Math.PI / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined) return 'Chưa có GPS';
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

function getOrderPickupLocation(order) {
  return parseLocation(order.pickupLocation || order.customer?.pickupLocation);
}

function getRouteMapHref(order) {
  const pickup = order.pickupAddress || order.merchantName || '';
  const dropoff = order.customer?.address || '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(dropoff)}`;
}

export default function ShipperPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [locationMessage, setLocationMessage] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Không tải được danh sách đơn.');
        return;
      }

      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage('Không tải được danh sách đơn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialFetch = setTimeout(fetchOrders, 0);
    const interval = setInterval(fetchOrders, 5000);
    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  const updateOrder = async ({ id, status, action, issue, location }) => {
    setMessage('');

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, action, issue, location })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Không cập nhật được đơn hàng.');
        return;
      }

      setOrders((prev) => prev.map((order) => order.id === id ? data : order));
    } catch (error) {
      setMessage('Không cập nhật được đơn hàng.');
    }
  };

  const getBrowserLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Trình duyệt không hỗ trợ GPS.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }),
      () => reject(new Error('Không lấy được vị trí hiện tại.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });

  const enableLocationFilter = async () => {
    setLocationMessage('');
    try {
      const location = await getBrowserLocation();
      setCurrentLocation(location);
      setLocationMessage('Đã cập nhật vị trí để lọc đơn gần bạn.');
    } catch (error) {
      setLocationMessage(error.message || 'Không lấy được vị trí hiện tại.');
    }
  };

  const updateLiveLocation = async (order) => {
    setLocationMessage('');
    try {
      const location = await getBrowserLocation();
      setCurrentLocation(location);
      await updateOrder({ id: order.id, action: 'update_location', location });
      setLocationMessage(`Đã lưu GPS cho đơn ${order.id}.`);
    } catch (error) {
      setLocationMessage(error.message || 'Không cập nhật được GPS.');
    }
  };

  const collectCod = (order) => {
    updateOrder({ id: order.id, action: 'collect_cod' });
  };

  const reportIssue = (order) => {
    const issue = prompt(`Nhập sự cố cho đơn ${order.id}`, 'Khách không nghe máy');
    if (!issue || !issue.trim()) return;
    updateOrder({ id: order.id, action: 'report_issue', issue: issue.trim() });
  };

  const availableOrders = useMemo(() => (
    orders
      .filter((order) => READY_STATUSES.includes(order.status) && (!order.shipperId || order.shipperId === user?.id))
      .map((order) => ({
        ...order,
        distanceKm: calculateDistanceKm(currentLocation, getOrderPickupLocation(order))
      }))
      .filter((order) => {
        if (distanceFilter === 'all' || order.distanceKm === null) return true;
        return order.distanceKm <= Number(distanceFilter);
      })
      .sort((a, b) => (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER))
  ), [orders, user?.id, currentLocation, distanceFilter]);

  const activeOrders = useMemo(() => (
    orders.filter((order) => ACTIVE_STATUSES.includes(order.status) && order.shipperId === user?.id)
  ), [orders, user?.id]);

  const completedOrders = useMemo(() => (
    orders.filter((order) => order.status === 'completed' && order.shipperId === user?.id)
  ), [orders, user?.id]);

  const codToCollect = activeOrders
    .filter((order) => order.paymentMethod === 'cod' && !order.codCollectedAt)
    .reduce((total, order) => total + Number(order.codAmount || getOrderFinalTotal(order)), 0);
  const codCollectedToday = completedOrders
    .filter((order) => order.paymentMethod === 'cod' && order.codCollectedAt)
    .reduce((total, order) => total + Number(order.codAmount || getOrderFinalTotal(order)), 0);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Người giao hàng Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            Nhận đơn đã sẵn sàng, cập nhật trạng thái lấy hàng và hoàn tất giao cho khách.
          </p>
        </div>
        <Link href="/" className={styles.backLink}>
          Quay lại cửa hàng
        </Link>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>ON</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Trạng thái</div>
            <div className={styles.statValue}>Sẵn sàng</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconYellow}`}>0</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn chờ nhận</div>
            <div className={styles.statValue}>{availableOrders.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>RUN</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đơn đang giao</div>
            <div className={styles.statValue}>{activeOrders.length}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>COD</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>COD cần thu</div>
            <div className={styles.statValue}>{formatMoney(codToCollect)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Đã thu: {formatMoney(codCollectedToday)}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <strong>Lọc đơn gần bạn</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {currentLocation ? `GPS: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}` : 'Chưa bật GPS'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={distanceFilter} onChange={(event) => setDistanceFilter(event.target.value)} style={{ padding: '0.65rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
              {DISTANCE_FILTERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <button type="button" className={styles.actionBtn} onClick={enableLocationFilter}>
              Lấy GPS hiện tại
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          {message}
        </div>
      )}

      {locationMessage && (
        <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '8px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
          {locationMessage}
        </div>
      )}

      <section className={styles.tableContainer} style={{ marginBottom: '2rem', overflowX: 'auto' }}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>Đơn chờ nhận</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Điểm lấy</th>
              <th>Điểm giao</th>
              <th>Khoảng cách</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : availableOrders.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Chưa có đơn chờ giao phù hợp. Đơn mới đặt chỉ hiển thị ở đây sau khi cửa hàng bấm Chờ giao hàng.</td></tr>
            ) : (
              availableOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name || 'Khách ẩn'}</td>
                  <td>{order.pickupAddress || order.merchantName || 'Cửa hàng'}</td>
                  <td>{order.customer?.address || 'Chưa có địa chỉ'}</td>
                  <td>{formatDistance(order.distanceKm)}</td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(getOrderFinalTotal(order))}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => updateOrder({ id: order.id, action: 'accept' })}>
                      Nhận đơn
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className={styles.tableContainer} style={{ overflowX: 'auto' }}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem' }}>Đơn của tôi</h2>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Điện thoại</th>
              <th>Lộ trình</th>
              <th>Giá trị</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</td></tr>
            ) : activeOrders.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Bạn chưa nhận đơn nào.</td></tr>
            ) : (
              activeOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name || 'Khách ẩn'}</td>
                  <td>{order.customer?.phone || 'Chưa có SĐT'}</td>
                  <td>
                    <div style={{ display: 'grid', gap: '0.25rem', minWidth: '180px' }}>
                      <span><strong>Lấy:</strong> {order.pickupAddress || order.merchantName || 'Cửa hàng'}</span>
                      <span><strong>Giao:</strong> {order.customer?.address || 'Chưa có địa chỉ'}</span>
                      <a href={getRouteMapHref(order)} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 700 }}>
                        Mở lộ trình
                      </a>
                      {order.shipperLocationAt && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          GPS cuối: {new Date(order.shipperLocationAt).toLocaleTimeString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatMoney(getOrderFinalTotal(order))}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {order.paymentMethod === 'cod' && (
                        order.codCollectedAt ? (
                          <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Đã thu COD</span>
                        ) : (
                          <button className={styles.actionBtn} onClick={() => collectCod(order)} style={{ background: '#e6f8f1', color: '#047857', border: '1px solid #bbf7d0' }}>
                            Thu COD {formatMoney(order.codAmount || getOrderFinalTotal(order))}
                          </button>
                        )
                      )}
                      {order.status === 'picked_up' && (
                        <button className={styles.actionBtn} onClick={() => updateOrder({ id: order.id, status: 'delivering' })}>
                          Đang giao
                        </button>
                      )}
                      {order.status === 'delivering' && (
                        <button className={styles.actionBtn} onClick={() => updateOrder({ id: order.id, status: 'completed' })}>
                          Hoàn thành
                        </button>
                      )}
                      <button className={styles.actionBtn} onClick={() => updateLiveLocation(order)} style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                        Cập nhật GPS
                      </button>
                      <button className={styles.actionBtn} onClick={() => reportIssue(order)} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                        Báo sự cố
                      </button>
                      {order.shipperIssue && (
                        <div style={{ flexBasis: '100%', color: '#b91c1c', fontSize: '0.85rem' }}>
                          Sự cố: {order.shipperIssue}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
