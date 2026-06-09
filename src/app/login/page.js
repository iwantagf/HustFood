"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roleLabels, roleRedirects, useAuth } from '@/context/AuthContext';


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
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && role) {
      router.replace(next || roleRedirects[role] || '/');
    }
  }, [isLoading, role, next, router]);

  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        setIsSubmitting(false);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

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

  const submitSocial = (provider) => {
    setIsSubmitting(true);
    if (provider === 'google') {
      window.location.assign('/api/auth/google');
    } else {
      router.push('/not-setup');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#f7f7f8' }}>
      <div style={{ width: '100%', maxWidth: '720px', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '2rem', border: '1px solid #ececec' }}>
        <h1 style={{ marginBottom: '0.75rem', fontSize: '2rem', color: '#111' }}>Đăng nhập HustFood</h1>

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

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 700 }}>Đăng nhập qua mạng xã hội</label>
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
