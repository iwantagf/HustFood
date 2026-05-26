"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { roleLabels, roleRedirects, useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { role, login } = useAuth();
  const next = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('next') || '/'
    : '/';
  const router = useRouter();

  useEffect(() => {
    if (role) {
      router.replace(next || roleRedirects[role] || '/');
    }
  }, [role, next, router]);

  const handleLogin = (selectedRole) => {
    const isAcceptedRole = login(selectedRole);
    if (isAcceptedRole) {
      router.replace(next || roleRedirects[selectedRole] || '/');
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: '100%', maxWidth: '520px', background: '#fff', borderRadius: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.08)', padding: '2.5rem' }}>
        <h1 style={{ marginBottom: '1rem', fontSize: '2rem', color: '#111' }}>Chọn quyền truy cập</h1>
        <p style={{ marginBottom: '2rem', color: '#555', lineHeight: '1.7' }}>
          Vui lòng chọn vai trò để truy cập hệ thống. Mỗi vai trò sẽ có quyền riêng:
          <strong> Khách hàng</strong> mua hàng, <strong>Merchant</strong> xử lý đơn,
          <strong> Shipper</strong> nhận giao hàng, <strong>Admin</strong> quản lý toàn bộ.
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
