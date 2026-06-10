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
  const [registerForm, setRegisterForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    role: 'customer'
  });
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');
  const [registerCheck, setRegisterCheck] = useState({ errors: {} });
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

  useEffect(() => {
    if (mode !== 'register') return undefined;

    const email = registerForm.email.trim();
    const username = registerForm.username.trim();

    if (!email && !username) return undefined;

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (email) params.set('email', email);
        if (username) params.set('username', username);

        const res = await fetch(`/api/auth/register?${params.toString()}`, {
          signal: controller.signal
        });
        const data = await res.json();

        if (res.ok) {
          setRegisterCheck(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setRegisterCheck({ errors: {} });
        }
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [mode, registerForm.email, registerForm.username]);

  const completeLogin = (user) => {
    const isAcceptedUser = login(user);
    if (isAcceptedUser) {
      router.replace(next || roleRedirects[user.role] || '/');
    }
  };

  const updateRegisterField = (field, value) => {
    setRegisterForm(prev => ({ ...prev, [field]: value }));
    if (field === 'email' || field === 'username') {
      setRegisterCheck(prev => ({
        ...prev,
        errors: {
          ...(prev.errors || {}),
          [field]: ''
        }
      }));
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

  const submitRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || 'Đăng ký thất bại');
        return;
      }

      completeLogin(data.user);
    } catch (error) {
      setMessage('Đăng ký thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', background: '#f7f7f8' }}>
      <div style={{ width: '100%', maxWidth: '720px', background: '#fff', borderRadius: '16px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '2rem', border: '1px solid #ececec' }}>
        <h1 style={{ marginBottom: '0.75rem', fontSize: '2rem', color: '#111' }}>{mode === 'login' ? 'Đăng nhập HustFood' : 'Đăng ký HustFood'}</h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.25rem', borderRadius: '10px', background: '#f4f4f5' }}>
          <button type="button" onClick={() => { setMode('login'); setMessage(''); }} style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: mode === 'login' ? '#fff' : 'transparent', color: mode === 'login' ? 'var(--primary)' : '#555', fontWeight: 800, cursor: 'pointer', boxShadow: mode === 'login' ? '0 6px 18px rgba(0,0,0,0.08)' : 'none' }}>
            Đăng nhập
          </button>
          <button type="button" onClick={() => { setMode('register'); setMessage(''); }} style={{ padding: '0.75rem', borderRadius: '8px', border: 'none', background: mode === 'register' ? '#fff' : 'transparent', color: mode === 'register' ? 'var(--primary)' : '#555', fontWeight: 800, cursor: 'pointer', boxShadow: mode === 'register' ? '0 6px 18px rgba(0,0,0,0.08)' : 'none' }}>
            Đăng ký
          </button>
        </div>

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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Gmail</label>
              <input required type="email" value={registerForm.email} onChange={e => updateRegisterField('email', e.target.value)} placeholder="ten@gmail.com" style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              {registerCheck.errors?.email && <small style={{ display: 'block', marginTop: '0.35rem', color: '#b91c1c', fontWeight: 700 }}>{registerCheck.errors.email}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Username</label>
              <input required type="text" value={registerForm.username} onChange={e => updateRegisterField('username', e.target.value)} placeholder="nguyenvana" style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
              {registerCheck.errors?.username && <small style={{ display: 'block', marginTop: '0.35rem', color: '#b91c1c', fontWeight: 700 }}>{registerCheck.errors.username}</small>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Tên hiển thị</label>
              <input required type="text" value={registerForm.displayName} onChange={e => updateRegisterField('displayName', e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Vai trò</label>
              <select value={registerForm.role} onChange={e => updateRegisterField('role', e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc', background: '#fff' }}>
                {['customer', 'seller', 'shipper'].map((item) => (
                  <option key={item} value={item}>{roleLabels[item]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Mật khẩu</label>
              <input required minLength={6} type="password" value={registerForm.password} onChange={e => updateRegisterField('password', e.target.value)} style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #ccc' }} />
            </div>
            <button type="submit" disabled={isSubmitting} style={{ padding: '0.9rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 800, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>
        )}

        {message && (
          <div style={{ marginBottom: '1rem', padding: '0.85rem', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', fontWeight: 700 }}>
            {message}
          </div>
        )}

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
