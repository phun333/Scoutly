'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export function AuthProvider({ session, children }: { session: Session | null; children: ReactNode }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
