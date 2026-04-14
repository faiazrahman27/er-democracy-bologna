import type { Metadata } from 'next';
import './globals.css';

import { AuthProvider } from '@/providers/auth-provider';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ER Democracy Bologna',
  description: 'Secure civic participation platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
