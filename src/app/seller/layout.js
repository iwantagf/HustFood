"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import styles from '../admin/admin.module.css';

export default function SellerLayout({ children }) {
  const { role, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (role !== 'seller') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, role, router, pathname]);

  if (isLoading || role !== 'seller') {
    return null;
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>HustFood Người Bán</div>
        <nav className={styles.nav}>
          <Link href="/seller" className={pathname === '/seller' ? styles.activeLink : styles.navLink}>
            Tổng quan
          </Link>
          <Link href="/seller/menu" className={pathname === '/seller/menu' ? styles.activeLink : styles.navLink}>
            Quản lý Thực Đơn
          </Link>
          <Link href="/" className={styles.navLink} style={{ marginTop: 'auto' }}>
            ← Quay Lại Trang Chủ
          </Link>
        </nav>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.adminProfile}>
            <span>{user?.displayName || 'Người bán'}</span>
            <div className={styles.avatar}>{user?.displayName?.charAt(0)?.toUpperCase() || 'S'}</div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
