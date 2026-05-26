"use client";
import Link from 'next/link';
import styles from '../admin/admin.module.css';

export default function ShipperPage() {
  const deliverySteps = [
    'Nhận đơn quanh khu vực',
    'Đến quán lấy món',
    'Cập nhật đang giao',
    'Hoàn thành và đối soát COD'
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className={styles.pageTitle} style={{ marginBottom: '0.5rem' }}>Người giao hàng Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
            Khu vực dành cho người giao hàng theo RBAC trong SRS. Module điều phối đơn sẽ gắn vào màn hình này ở update riêng.
          </p>
        </div>
        <Link href="/" className={styles.navLink} style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
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
            <div className={styles.statValue}>0</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>COD</div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Đối soát hôm nay</div>
            <div className={styles.statValue}>0đ</div>
          </div>
        </div>
      </div>

      <section className={styles.tableContainer} style={{ padding: '1.5rem' }}>
        <h2 className={styles.sectionTitle} style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>Luồng giao hàng dự kiến</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {deliverySteps.map((step, index) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: '#fff' }}>
              <strong style={{ color: 'var(--primary)' }}>Bước {index + 1}</strong>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
