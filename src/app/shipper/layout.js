"use client";
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ShipperLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    // Nguoi giao hang screens are isolated from other role flows.
    if (role !== 'shipper') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, role, router]);

  if (role !== 'shipper') {
    return null;
  }

  return children;
}
