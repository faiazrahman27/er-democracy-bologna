'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute =
    pathname.startsWith('/login') || pathname.startsWith('/register');

  return (
    <>
      <Header variant={isAdminRoute ? 'admin' : 'public'} />

      <main className="min-h-screen">{children}</main>

      {!isAuthRoute ? <Footer /> : null}
    </>
  );
}
