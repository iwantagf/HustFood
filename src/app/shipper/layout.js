"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ShipperLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isLoading } = useAuth();

  useEffect(() => {
    // Màn hình Người giao hàng được tách khỏi các luồng vai trò khác.
    if (isLoading) return;
    if (role !== 'shipper') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, pathname, role, router]);

  if (isLoading || role !== 'shipper') {
    return null;
  }

  return children;
}
