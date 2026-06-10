"use client";
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { formatVndPrice, getOrderFinalTotal } from '@/lib/pricing';
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

const MAX_REVIEW_IMAGES = 5;
const MAX_REVIEW_IMAGE_BYTES = 5 * 1024 * 1024;
const REVIEW_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function readFileAsDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
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
    shipperRating: 5,
    comment: ''
  });
  const [reviewImages, setReviewImages] = useState([]);
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

  const handleReviewCommentChange = (event) => {
    setReviewForm(prev => ({ ...prev, comment: event.target.value }));
  };

  const handleReviewImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) return;

    const remainingSlots = MAX_REVIEW_IMAGES - reviewImages.length;
    if (remainingSlots <= 0) {
      setReviewMessage('Mỗi đánh giá chỉ được tải tối đa 5 ảnh.');
      return;
    }

    const invalidFile = files.find((file) => !REVIEW_IMAGE_TYPES.has(file.type));
    if (invalidFile) {
      setReviewMessage('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.');
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_REVIEW_IMAGE_BYTES);
    if (oversizedFile) {
      setReviewMessage('Mỗi ảnh đánh giá không được vượt quá 5MB.');
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    const nextImages = await Promise.all(selectedFiles.map(async (file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}-${Date.now()}`,
      file,
      previewUrl: await readFileAsDataUrl(file)
    })));

    setReviewImages(prev => [...prev, ...nextImages]);
    setReviewMessage(files.length > remainingSlots ? 'Hệ thống chỉ nhận tối đa 5 ảnh cho mỗi đánh giá.' : '');
  };

  const handleRemoveReviewImage = (imageId) => {
    setReviewImages(prev => prev.filter((image) => image.id !== imageId));
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!order || order.status !== 'completed') return;

    setIsSubmittingReview(true);
    setReviewMessage('');

    try {
      const hasShipper = Boolean(order.shipperId || order.shipperName);
      const reviewData = new FormData();
      reviewData.append('orderId', order.id);
      reviewData.append('foodRating', String(reviewForm.foodRating));
      reviewData.append('shipperRating', hasShipper ? String(reviewForm.shipperRating) : '');
      reviewData.append('comment', reviewForm.comment);
      reviewImages.forEach((image) => {
        reviewData.append('images', image.file);
      });

      const res = await fetch('/api/reviews', {
        method: 'POST',
        body: reviewData
      });
      const data = await res.json();

      if (!res.ok) {
        setReviewMessage(data.error || 'Không gửi được đánh giá.');
        return;
      }

      setReview(data.review);
      setReviewImages([]);
      setReviewMessage(
        data.review?.status === 'hidden'
          ? 'Đánh giá đã gửi nhưng đang bị ẩn công khai vì có ngôn từ vi phạm.'
          : 'Đã gửi đánh giá. Cảm ơn bạn đã phản hồi.'
      );
    } catch (error) {
      setReviewMessage(error.message || 'Không gửi được đánh giá.');
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
                    <strong>{formatVndPrice(item.price)}</strong>
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
                    {review.status === 'hidden' && (
                      <p className={styles.reviewError}>Đánh giá này đang bị ẩn công khai vì có ngôn từ vi phạm.</p>
                    )}
                    <div className={styles.reviewSummary}>
                      <span>Món ăn: {review.foodRating}/5 sao</span>
                      {review.shipperRating && <span>Người giao hàng: {review.shipperRating}/5 sao</span>}
                    </div>
                    {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                    {Array.isArray(review.images) && review.images.length > 0 && (
                      <div className={styles.reviewImageGrid}>
                        {review.images.map((image, index) => (
                          <Image
                            key={image}
                            src={image}
                            alt={`Ảnh đánh giá ${index + 1}`}
                            className={styles.reviewImage}
                            width={160}
                            height={160}
                            unoptimized
                          />
                        ))}
                      </div>
                    )}
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
                    <label className={styles.reviewTextGroup}>
                      <span>Bình luận</span>
                      <textarea
                        value={reviewForm.comment}
                        onChange={handleReviewCommentChange}
                        maxLength={1000}
                        rows={4}
                        placeholder="Chia sẻ cảm nhận về món ăn, đóng gói hoặc trải nghiệm giao hàng"
                      />
                      <small>{reviewForm.comment.length}/1000 ký tự</small>
                    </label>
                    <div className={styles.reviewUploadGroup}>
                      <label className={styles.reviewUploadButton}>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          multiple
                          onChange={handleReviewImageChange}
                          disabled={reviewImages.length >= MAX_REVIEW_IMAGES || isSubmittingReview}
                        />
                        Chọn ảnh
                      </label>
                      <span className={styles.reviewUploadHint}>Tối đa 5 ảnh, mỗi ảnh không quá 5MB.</span>
                    </div>
                    {reviewImages.length > 0 && (
                      <div className={styles.reviewImageGrid}>
                        {reviewImages.map((image) => (
                          <div key={image.id} className={styles.reviewImagePreview}>
                            <Image
                              src={image.previewUrl}
                              alt={image.file.name || 'Ảnh đánh giá'}
                              className={styles.reviewImage}
                              width={160}
                              height={160}
                              unoptimized
                            />
                            <button type="button" onClick={() => handleRemoveReviewImage(image.id)}>
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {reviewMessage && <p className={styles.reviewError}>{reviewMessage}</p>}
                    <button type="submit" className="btn btn-primary" disabled={isSubmittingReview}>
                      {isSubmittingReview && reviewImages.length ? 'Đang gửi ảnh...' : isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
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
