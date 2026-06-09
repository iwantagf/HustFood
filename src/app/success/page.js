"use client";
import styles from './page.module.css';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function SuccessPage() {
  const { clearCart } = useCart();
  const [isPaymentRetry, setIsPaymentRetry] = useState(false);
  const [lastOrders, setLastOrders] = useState([]);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      setIsPaymentRetry(new URLSearchParams(window.location.search).get('payment') === 'retry');
      try {
        const parsedOrders = JSON.parse(window.sessionStorage.getItem('hustfood_last_orders') || '[]');
        setLastOrders(Array.isArray(parsedOrders) ? parsedOrders : []);
      } catch (error) {
        setLastOrders([]);
      }
      clearCart();
    }, 0);
    return () => clearTimeout(initialLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main>
      <Header />
      <div className={styles.successContainer}>
        <div className={styles.iconWrapper}>
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1 className={styles.successTitle}>{isPaymentRetry ? 'Đơn Đang Chờ Thanh Toán Lại' : 'Đặt Hàng Thành Công!'}</h1>
        <p className={styles.successDesc}>
          {isPaymentRetry
            ? 'Thanh toán online chưa hoàn tất. Đơn hàng đã được lưu ở trạng thái chờ thanh toán lại để bạn có thể xử lý tiếp với bộ phận hỗ trợ.'
            : 'Cảm ơn bạn đã đặt hàng tại HustFood. Đơn hàng đã được gửi tới cửa hàng để xác nhận và chuẩn bị. Người giao hàng sẽ nhận đơn sau khi cửa hàng chuyển đơn sang trạng thái chờ giao hàng.'}
        </p>
        <div className={styles.actionRow}>
          {lastOrders[0] && (
            <Link href={`/orders/${encodeURIComponent(lastOrders[0].id)}`} className={`btn btn-primary ${styles.homeBtn}`}>
              Theo Dõi Đơn Hàng
            </Link>
          )}
          <Link href="/" className={`btn btn-outline ${styles.homeBtn}`}>
            Quay Về Trang Chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
