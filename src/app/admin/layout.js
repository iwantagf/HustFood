"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (role !== 'admin') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, role, router, pathname]);

  if (isLoading || role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>HustFood Quản trị viên</div>
        <nav className={styles.nav}>
          <Link href="/admin" className={`${styles.navLink} ${pathname === '/admin' ? styles.activeLink : ''}`}>
            Dashboard
          </Link>
          <Link href="/admin/orders" className={`${styles.navLink} ${pathname === '/admin/orders' ? styles.activeLink : ''}`}>
            Quản lý Đơn Hàng
          </Link>
          <Link href="/admin/menu" className={`${styles.navLink} ${pathname === '/admin/menu' ? styles.activeLink : ''}`}>
            Quản lý Thực Đơn
          </Link>
          <Link href="/" className={`${styles.navLink} ${styles.backLink}`} style={{ marginTop: 'auto' }}>
            ← Quay Lại Cửa Hàng
          </Link>
        </nav>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.adminProfile}>
            <span>Quản trị viên</span>
            <div className={styles.avatar}>A</div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
