'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/providers/auth-provider';
import { isAdminRole } from '@/lib/roles';
import { ROUTES } from '@/lib/routes';

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdminUser = !!user && isAdminRole(user.role);

  const isAuthRoute =
    pathname.startsWith(ROUTES.public.login) ||
    pathname.startsWith(ROUTES.public.register) ||
    pathname.startsWith(ROUTES.public.forgotPassword) ||
    pathname.startsWith(ROUTES.public.resetPassword) ||
    pathname.startsWith(ROUTES.public.verifyEmail);

  return (
    <>
      <Header variant={isAdminUser ? 'admin' : 'public'} />

      <main className="min-h-screen">{children}</main>

      {!isAuthRoute ? <Footer /> : null}
    </>
  );
}
