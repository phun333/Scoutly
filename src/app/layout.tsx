import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '~/components/providers/session-provider';
import { TRPCProvider } from '~/components/providers/trpc-provider';
import { auth } from '~/server/auth';
import './globals.css';
import { cn } from '~/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Scoutly',
    template: '%s | Scoutly',
  },
  description:
    'Scoutly is an AI-powered applicant evaluation system for modern hiring teams to capture, analyse, and prioritise candidates.',
  icons: {
    icon: '/scoutly-white-logo.svg',
    shortcut: '/scoutly-white-logo.svg',
    apple: '/scoutly-white-logo.svg',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <body className={cn('min-h-screen bg-background font-sans text-foreground antialiased')}>
        <AuthProvider session={session}>
          <TRPCProvider>
            <div className="flex min-h-screen flex-col">{children}</div>
          </TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
