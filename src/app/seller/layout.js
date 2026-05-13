"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SellerLayout({ children }) {
  const { role } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (role !== 'seller') {
      router.replace(`/login?next=/seller`);
    }
  }, [mounted, role, router]);

  if (!mounted || role !== 'seller') {
    return null;
  }

  return children;
}
