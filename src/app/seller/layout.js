"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SellerLayout({ children }) {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (role !== 'seller') {
      router.replace(`/login?next=/seller`);
    }
  }, [isLoading, role, router]);

  if (isLoading || role !== 'seller') {
    return null;
  }

  return children;
}
