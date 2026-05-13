"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './admin.module.css';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (role !== 'admin') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, role, router, pathname]);

  if (!mounted || role !== 'admin') {
    return null;
  }

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>HustFood Admin</div>
        <nav className={styles.nav}>
          <Link href="/admin" className={pathname === '/admin' ? styles.activeLink : styles.navLink}>
            Dashboard
          </Link>
          <Link href="/admin/orders" className={pathname === '/admin/orders' ? styles.activeLink : styles.navLink}>
            Quản lý Đơn Hàng
          </Link>
          <Link href="/admin/menu" className={pathname === '/admin/menu' ? styles.activeLink : styles.navLink}>
            Quản lý Thực Đơn
          </Link>
          <Link href="/" className={styles.navLink} style={{ marginTop: 'auto' }}>
            ← Quay Lại Cửa Hàng
          </Link>
        </nav>
      </aside>
      
      <main className={styles.mainContent}>
        <header className={styles.topbar}>
          <div className={styles.adminProfile}>
            <span>Admin Manager</span>
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
