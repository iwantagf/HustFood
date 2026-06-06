"use client";
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { getOrderFinalTotal } from '@/lib/pricing';
import {
  ORDER_TRACKING_STEPS,
  getEtaText,
  getLatestShipperLocation,
  getOrderProgress,
  getOrderStatusLabel,
  getOrderStepIndex,
  getTrackingMapHref
} from '@/lib/orderTracking';
import styles from '../page.module.css';

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function statusClass(status) {
  if (status === 'completed') return `${styles.statusBadge} ${styles.statusDone}`;
  if (['rejected', 'payment_retry'].includes(status)) return `${styles.statusBadge} ${styles.statusProblem}`;
  return styles.statusBadge;
}

function RatingButtons({ label, value, onChange }) {
  return (
    <div className={styles.ratingGroup}>
      <span className={styles.ratingLabel}>{label}</span>
      <div className={styles.starRow}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className={`${styles.starButton} ${rating <= value ? styles.starButtonActive : ''}`}
            onClick={() => onChange(rating)}
            aria-label={`${rating} sao`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const router = useRouter();
  const { role, isLoading } = useAuth();
  const orderId = decodeURIComponent(String(id || ''));
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [message, setMessage] = useState('');
  const [review, setReview] = useState(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewForm, setReviewForm] = useState({
    foodRating: 5,
    shipperRating: 5
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Không tải được đơn hàng.');
        return;
      }

      const foundOrder = Array.isArray(data) ? data.find((item) => item.id === orderId) : null;
      setOrder(foundOrder || null);
      if (!foundOrder) setMessage('Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.');
    } catch (error) {
      setMessage('Không tải được đơn hàng.');
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId]);

  const fetchReview = useCallback(async () => {
    setLoadingReview(true);
    setReviewMessage('');

    try {
      const res = await fetch(`/api/reviews?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json();

      if (!res.ok) {
        setReviewMessage(data.error || 'Không tải được đánh giá đơn hàng.');
        return;
      }

      setReview(data.review || null);
    } catch (error) {
      setReviewMessage('Không tải được đánh giá đơn hàng.');
    } finally {
      setLoadingReview(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isLoading && role !== 'customer') {
      router.replace(`/login?next=/orders/${encodeURIComponent(orderId)}`);
    }
  }, [isLoading, role, router, orderId]);

  useEffect(() => {
    if (isLoading || role !== 'customer') return undefined;

    const initialFetch = setTimeout(fetchOrder, 0);

    if (typeof EventSource === 'undefined') {
      const interval = setInterval(fetchOrder, 5000);
      return () => {
        clearTimeout(initialFetch);
        clearInterval(interval);
      };
    }

    let fallbackInterval = null;
    const source = new EventSource(`/api/orders/stream?id=${encodeURIComponent(orderId)}`);
    source.addEventListener('orders', (event) => {
      const nextOrders = JSON.parse(event.data);
      const nextOrder = Array.isArray(nextOrders) ? nextOrders[0] : null;
      setOrder(nextOrder || null);
      setLoadingOrder(false);
      if (!nextOrder) setMessage('Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn này.');
    });
    source.addEventListener('error', () => {
      source.close();
      if (!fallbackInterval) {
        fallbackInterval = setInterval(fetchOrder, 5000);
      }
    });

    return () => {
      clearTimeout(initialFetch);
      source.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [fetchOrder, isLoading, role, orderId]);

  useEffect(() => {
    if (isLoading || role !== 'customer' || order?.status !== 'completed') {
      return undefined;
    }

    const reviewFetch = setTimeout(fetchReview, 0);
    return () => clearTimeout(reviewFetch);
  }, [fetchReview, isLoading, role, order?.status]);

  const handleReviewRatingChange = (field, value) => {
    setReviewForm(prev => ({ ...prev, [field]: value }));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!order || order.status !== 'completed') return;

    setIsSubmittingReview(true);
    setReviewMessage('');

    try {
      const hasShipper = Boolean(order.shipperId || order.shipperName);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          foodRating: reviewForm.foodRating,
          shipperRating: hasShipper ? reviewForm.shipperRating : null
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setReviewMessage(data.error || 'Không gửi được đánh giá.');
        return;
      }

      setReview(data.review);
      setReviewMessage('Đã gửi đánh giá. Cảm ơn bạn đã phản hồi.');
    } catch (error) {
      setReviewMessage('Không gửi được đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const progress = getOrderProgress(order?.status);
  const currentStepIndex = getOrderStepIndex(order?.status);
  const latestLocation = getLatestShipperLocation(order);
  const items = Array.isArray(order?.items) ? order.items : [];
  const hasShipper = Boolean(order?.shipperId || order?.shipperName);

  if (isLoading || role !== 'customer') return null;

  return (
    <main>
      <Header />
      <div className={`container ${styles.ordersPage}`}>
        <div className={styles.ordersHeader}>
          <div>
            <h1 className={styles.ordersTitle}>Đơn {orderId}</h1>
            <p className={styles.ordersSubtitle}>Trang theo dõi tiến độ đơn hàng, vị trí giao hàng và ETA dự kiến.</p>
          </div>
          <Link href="/orders" className="btn btn-outline">Tất cả đơn hàng</Link>
        </div>

        {loadingOrder ? (
          <div className={styles.emptyState}>Đang tải trạng thái đơn...</div>
        ) : !order ? (
          <div className={styles.emptyState}>{message || 'Không tìm thấy đơn hàng.'}</div>
        ) : (
          <div className={styles.trackingLayout}>
            <section className={styles.panel}>
              <div className={styles.orderCardHeader}>
                <div>
                  <div className={styles.orderId}>{order.id}</div>
                  <div className={styles.merchantName}>{order.merchantName || 'HustFood'}</div>
                </div>
                <span className={statusClass(order.status)}>{getOrderStatusLabel(order.status)}</span>
              </div>

              <div className={styles.progressTrack} style={{ margin: '1.25rem 0' }}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>

              <div className={styles.timeline}>
                {ORDER_TRACKING_STEPS.map((step, index) => (
                  <div key={step.status} className={styles.timelineItem}>
                    <span className={`${styles.timelineDot} ${index <= currentStepIndex && order.status !== 'rejected' ? styles.timelineDotActive : ''}`} />
                    <div>
                      <div className={styles.timelineLabel}>{step.label}</div>
                      <div className={styles.timelineHint}>
                        {index === currentStepIndex && order.status !== 'completed' && order.status !== 'rejected'
                          ? 'Đang xử lý bước này'
                          : index < currentStepIndex ? 'Đã hoàn tất' : 'Đang chờ'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {order.status === 'rejected' && (
                <div className={styles.emptyState} style={{ marginTop: '1rem', color: '#b91c1c' }}>
                  Lý do từ chối: {order.rejectionReason || 'Cửa hàng không thể xử lý đơn này.'}
                </div>
              )}
            </section>

            <aside className={styles.panel}>
              <h2 className={styles.panelTitle}>Thông tin giao hàng</h2>
              <div className={styles.detailList}>
                <div className={styles.detailRow}>
                  <span>ETA</span>
                  <strong>{getEtaText(order)}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Tổng tiền</span>
                  <strong>{formatMoney(getOrderFinalTotal(order))}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Thanh toán</span>
                  <strong>{(order.paymentMethod || 'cod').toUpperCase()} · {order.paymentStatus || 'pending'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Người giao hàng</span>
                  <strong>{order.shipperName || 'Đang phân công'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Điểm lấy</span>
                  <strong>{order.pickupAddress || order.merchantName || 'Cửa hàng'}</strong>
                </div>
                <div className={styles.detailRow}>
                  <span>Điểm giao</span>
                  <strong>{order.customer?.address || 'Chưa có địa chỉ'}</strong>
                </div>
              </div>

              <div className={styles.mapPreview} style={{ marginTop: '1rem' }}>
                <div>
                  <strong>{latestLocation ? 'Vị trí shipper mới nhất' : 'Chưa có GPS shipper'}</strong>
                  <p style={{ margin: '0.5rem 0 1rem', color: 'var(--text-muted)' }}>
                    {latestLocation
                      ? `${latestLocation.latitude.toFixed(5)}, ${latestLocation.longitude.toFixed(5)} · ${new Date(latestLocation.updatedAt).toLocaleString('vi-VN')}`
                      : 'Hiển thị lộ trình từ cửa hàng tới địa chỉ giao hàng trong khi chờ shipper cập nhật vị trí.'}
                  </p>
                  <a href={getTrackingMapHref(order)} target="_blank" rel="noreferrer" className="btn btn-primary">
                    Mở bản đồ
                  </a>
                </div>
              </div>
            </aside>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Món đã đặt</h2>
              <div className={styles.detailList}>
                {items.map((item) => (
                  <div key={item.cartKey || item.id} className={styles.detailRow}>
                    <span>{item.quantity}x {item.name}</span>
                    <strong>{item.price}</strong>
                  </div>
                ))}
              </div>
            </section>

            {order.status === 'completed' && (
              <section className={`${styles.panel} ${styles.reviewPanel}`}>
                <h2 className={styles.panelTitle}>Đánh giá đơn hàng</h2>
                {loadingReview ? (
                  <div className={styles.emptyState}>Đang tải đánh giá...</div>
                ) : review ? (
                  <div className={styles.reviewSubmitted}>
                    <strong>Đã gửi đánh giá</strong>
                    <div className={styles.reviewSummary}>
                      <span>Món ăn: {review.foodRating}/5 sao</span>
                      {review.shipperRating && <span>Người giao hàng: {review.shipperRating}/5 sao</span>}
                    </div>
                    {reviewMessage && <p className={styles.reviewSuccess}>{reviewMessage}</p>}
                  </div>
                ) : (
                  <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
                    <RatingButtons
                      label="Món ăn"
                      value={reviewForm.foodRating}
                      onChange={(value) => handleReviewRatingChange('foodRating', value)}
                    />
                    {hasShipper && (
                      <RatingButtons
                        label="Người giao hàng"
                        value={reviewForm.shipperRating}
                        onChange={(value) => handleReviewRatingChange('shipperRating', value)}
                      />
                    )}
                    {reviewMessage && <p className={styles.reviewError}>{reviewMessage}</p>}
                    <button type="submit" className="btn btn-primary" disabled={isSubmittingReview}>
                      {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                  </form>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
