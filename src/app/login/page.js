"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const roleLabels = {
  customer: 'Khách hàng',
  seller: 'Seller',
  admin: 'Quản trị viên'
};

export default function LoginPage() {
  const { role, login } = useAuth();
  const [next, setNext] = useState('/');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setNext(params.get('next')); // We'll handle default inside the effect below
    }
  }, []);

  const getRoleRedirect = (currentRole) => {
    if (currentRole === 'seller') return '/seller';
    if (currentRole === 'admin') return '/admin';
    return '/'; // customer or null
  };

  useEffect(() => {
    if (role) {
      router.replace(next || getRoleRedirect(role));
    }
  }, [role, next, router]);

  const handleLogin = (selectedRole) => {
    login(selectedRole);
    router.replace(next || getRoleRedirect(selectedRole));
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '2.5rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '2rem', color: '#111' }}>Chọn quyền truy cập</h1>
        <p style={{ marginBottom: '2rem', color: '#555', lineHeight: '1.7' }}>
          Vui lòng chọn vai trò để truy cập hệ thống. Mỗi vai trò sẽ có quyền riêng:
          <strong> Khách hàng</strong> mua hàng, <strong>Seller</strong> xử lý đơn, <strong>Admin</strong> quản lý toàn bộ.
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {Object.entries(roleLabels).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleLogin(value)}
              style={{
                width: '100%',
                padding: '1rem 1.2rem',
                borderRadius: '14px',
                border: '1px solid #e5e7eb',
                background: value === role ? '#fef2f2' : '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
