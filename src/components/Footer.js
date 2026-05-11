"use client";

export default function Footer() {
  return (
    <footer style={{ background: '#111', color: '#fff', padding: '4rem 0 2rem' }}>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '1rem', letterSpacing: '-1px' }}>HustFood.</h2>
          <p style={{ color: '#aaa', lineHeight: '1.6' }}>Vị ngon thượng hạng, giao hàng nhanh chóng. Mang đến trải nghiệm ẩm thực tuyệt vời nhất ngay tại nhà.</p>
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Liên Kết</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#aaa', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><a href="#" style={{ textDecoration: 'none', color: 'inherit' }}>Trang Chủ</a></li>
            <li><a href="#menu" style={{ textDecoration: 'none', color: 'inherit' }}>Thực Đơn</a></li>
            <li><a href="#promo" style={{ textDecoration: 'none', color: 'inherit' }}>Khuyến Mãi</a></li>
          </ul>
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Liên Hệ</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#aaa', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li>📞 Hotline: 1900 1234</li>
            <li>📧 Email: cskh@hustfood.vn</li>
            <li>📍 1 Đại Cồ Việt, Bách Khoa, Hà Nội</li>
          </ul>
        </div>
      </div>
      <div className="container" style={{ borderTop: '1px solid #333', paddingTop: '2rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        &copy; {new Date().getFullYear()} HustFood. Tác phẩm mô phỏng phục vụ giáo dục.
      </div>
    </footer>
  );
}
