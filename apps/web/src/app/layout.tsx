import type { Metadata } from 'next';
import './globals.css';

import { AuthProvider } from '@/providers/auth-provider';
import AppShell from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ER Democracy Bologna',
  description: 'Secure civic participation platform',

  // ✅ Important additions
  applicationName: 'ER Democracy Bologna',

  metadataBase: new URL('https://er-democracy-bologna.xyz'),

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'ER Democracy Bologna',
    description: 'Secure civic participation platform',
    url: 'https://er-democracy-bologna.xyz',
    siteName: 'ER Democracy Bologna',
    locale: 'en_US',
    type: 'website',
  },

  robots: {
    index: true,
    follow: true,
  },
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
