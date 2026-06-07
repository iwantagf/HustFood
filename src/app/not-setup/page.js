import Link from 'next/link';

export default function NotSetupPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#f7f7f8' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '3rem 2rem', border: '1px solid #ececec', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
        <h1 style={{ marginBottom: '1rem', fontSize: '1.75rem', color: '#111' }}>Chưa thiết lập</h1>
        <p style={{ marginBottom: '2rem', color: '#555', lineHeight: '1.5' }}>
          Tính năng đăng nhập này hiện chưa được thiết lập. Vui lòng thử phương thức đăng nhập khác.
        </p>
        <Link href="/login" style={{ padding: '0.9rem 1.5rem', borderRadius: '8px', background: 'var(--primary, #e23744)', color: '#fff', fontWeight: 800, textDecoration: 'none', display: 'inline-block' }}>
          Quay lại đăng nhập
        </Link>
      </div>
    </main>
  );
}
