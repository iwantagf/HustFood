"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ShipperLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    // Màn hình Người giao hàng được tách khỏi các luồng vai trò khác.
    if (role !== 'shipper') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, role, router]);

  if (role !== 'shipper') {
    return null;
  }

  return children;
}
