"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roleLabels, roleRedirects, useAuth } from '@/context/AuthContext';

const registerRoles = ['customer', 'seller', 'shipper'];
const socialProviders = [
  { id: 'google', label: 'Google' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' }
];

export default function LoginPage() {
  const { role, isLoading, login } = useAuth();
  const router = useRouter();
  const next = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('next') || '/'
    : '/';
  const [mode, setMode] = useState('login');
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'customer'
  });
  const [socialEmail, setSocialEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && role) {
      router.replace(next || roleRedirects[role] || '/');
    }
  }, [isLoading, role, next, router]);

  const completeLogin = (user) => {
    const isAcceptedUser = login(user);
    if (isAcceptedUser) {
      router.replace(next || roleRedirects[user.role] || '/');
    }
  };

  const submitCredentials = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Đăng nhập thất bại');
        return;
      }

      completeLogin(data.user);
    } catch (error) {
      setMessage('Đăng nhập thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Tạo tài khoản thất bại');
        return;
      }

      completeLogin(data.user);
    } catch (error) {
      setMessage('Tạo tài khoản thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSocial = async (provider) => {
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, email: socialEmail })
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Đăng nhập social thất bại');
        return;
      }

      completeLogin(data.user);
    } catch (error) {
      setMessage('Đăng nhập social thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#f7f7f8' }}>
      <div style={{ width: '100%', maxWidth: '720px', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '2rem', border: '1px solid #ececec' }}>
        <h1 style={{ marginBottom: '0.75rem', fontSize: '2rem', color: '#111' }}>Đăng nhập HustFood</h1>
        <p style={{ marginBottom: '1.5rem', color: '#555', lineHeight: '1.6' }}>
          Tài khoản test quản trị viên: <strong>huyhoangdao</strong> / <strong>1</strong>.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setMode('login')} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd', background: mode === 'login' ? '#111' : '#fff', color: mode === 'login' ? '#fff' : '#111', fontWeight: 700, cursor: 'pointer' }}>
            Đăng nhập
          </button>
          <button type="button" onClick={() => setMode('register')} style={{ padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ddd', background: mode === 'register' ? '#111' : '#fff', color: mode === 'register' ? '#fff' : '#111', fontWeight: 700, cursor: 'pointer' }}>
            Tạo tài khoản Gmail
          </button>
        </div>

        {message && (
          <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '8px', background: '#fff8e6', color: '#7c4a00', border: '1px solid #ffe0a3' }}>
            {message}
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={submitCredentials} style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Username hoặc Gmail</label>
              <input required type="text" value={credentials.identifier} onChange={e => setCredentials(prev => ({ ...prev, identifier: e.target.value }))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Mật khẩu</label>
              <input required type="password" value={credentials.password} onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.9rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitRegister} style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Tên hiển thị</label>
              <input type="text" value={registerData.displayName} onChange={e => setRegisterData(prev => ({ ...prev, displayName: e.target.value }))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Gmail</label>
              <input required type="email" value={registerData.email} onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))} placeholder="ten@gmail.com" style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Mật khẩu</label>
              <input required type="password" value={registerData.password} onChange={e => setRegisterData(prev => ({ ...prev, password: e.target.value }))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Vai trò</label>
              <select value={registerData.role} onChange={e => setRegisterData(prev => ({ ...prev, role: e.target.value }))} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
                {registerRoles.map((roleId) => (
                  <option key={roleId} value={roleId}>{roleLabels[roleId]}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.9rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </form>
        )}

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Đăng nhập social bằng Gmail</label>
          <input type="email" value={socialEmail} onChange={e => setSocialEmail(e.target.value)} placeholder="ten@gmail.com" style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '1rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
            {socialProviders.map((provider) => (
              <button key={provider.id} type="button" disabled={isSubmitting} onClick={() => submitSocial(provider.id)} style={{ padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                {provider.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
