"use client";
import styles from './page.module.css';
import Header from '@/components/Header';
import Link from 'next/link';
import { useEffect } from 'react';
import { useCart } from '@/context/CartContext';

export default function SuccessPage() {
  const { removeFromCart, cart } = useCart();

  useEffect(() => {
    // Clear cart upon successful order
    cart.forEach(item => removeFromCart(item.id));
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
        <h1 className={styles.successTitle}>Đặt Hàng Thành Công!</h1>
        <p className={styles.successDesc}>
          Cảm ơn bạn đã đặt hàng tại HustFood. Đơn hàng của bạn đã được tiếp nhận và đang được bếp chuẩn bị. Nguoi giao hang sẽ liên hệ với bạn trong thời gian sớm nhất. Chúc bạn có một bữa ăn ngon miệng!
        </p>
        <Link href="/" className={`btn btn-primary ${styles.homeBtn}`}>
          Quay Về Trang Chủ
        </Link>
      </div>
    </main>
  );
}
