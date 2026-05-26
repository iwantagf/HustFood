"use client";
import styles from '@/app/page.module.css';
import { useCart } from '@/context/CartContext';
import { roleLabels, useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { totalItems, isMounted } = useCart();
  const { role, logout } = useAuth();
  const canUseCart = !role || role === 'customer';
  
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo}><Link href="/">HustFood.</Link></div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Trang Chủ</Link>
          {role === 'seller' && <Link href="/seller" className={styles.navLink}>Merchant</Link>}
          {role === 'shipper' && <Link href="/shipper" className={styles.navLink}>Shipper</Link>}
          {role === 'admin' && <Link href="/admin" className={styles.navLink}>Admin</Link>}
          <Link href="/#menu" className={styles.navLink}>Thực Đơn</Link>
        </nav>
        <div className={styles.headerActions}>
          {role ? (
            <>
              <span className={styles.roleBadge}>{roleLabels[role] || role}</span>
              <button type="button" className={styles.logoutBtn} onClick={logout}>Đăng xuất</button>
            </>
          ) : (
            <Link href="/login" className={styles.navLink}>Đăng nhập</Link>
          )}
        </div>
        {canUseCart && (
          <Link href="/cart" className={styles.cartBtn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {isMounted && totalItems > 0 && <span className={styles.cartCount}>{totalItems}</span>}
          </Link>
        )}
      </div>
    </header>
  );
}
