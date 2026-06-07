"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', role: 'customer' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitSetup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/google/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setMessage(data.error || 'Phiên đã hết hạn. Vui lòng đăng nhập lại.');
          setTimeout(() => router.replace('/login'), 2000);
        } else {
          setMessage(data.error || 'Có lỗi xảy ra');
        }
        return;
      }

      if (data.success) {
        // Successful registration, hard reload to update context or just router.replace
        // the session cookie is already set
        window.location.href = data.redirectUrl || '/';
      }
    } catch (error) {
      setMessage('Không thể kết nối đến máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#f7f7f8' }}>
      <div style={{ width: '100%', maxWidth: '720px', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '2rem', border: '1px solid #ececec' }}>
        <h1 style={{ marginBottom: '0.75rem', fontSize: '2rem', color: '#111' }}>Tạo tài khoản mới</h1>
        <p style={{ marginBottom: '1.5rem', color: '#555', lineHeight: '1.5' }}>
          Chào bạn, có vẻ đây là lần đầu bạn sử dụng tài khoản Google này tại HustFood. Hãy chọn tên hiển thị và vai trò để hoàn tất đăng ký nhé!
        </p>

        {message && (
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={submitSetup} style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Username</label>
            <input 
              required 
              type="text" 
              placeholder="Nhập username của bạn"
              value={formData.username} 
              onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))} 
              style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Vai trò</label>
            <select 
              value={formData.role} 
              onChange={e => setFormData(prev => ({ ...prev, role: e.target.value }))} 
              style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}
            >
              <option value="customer">Khách hàng</option>
              <option value="seller">Người bán</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} style={{ padding: '0.9rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary, #e23744)', color: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: '0.5rem' }}>
            {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất'}
          </button>
        </form>
      </div>
    </main>
  );
}
