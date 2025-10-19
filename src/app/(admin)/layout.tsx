import type { ReactNode } from 'react';
import { AdminSidebar } from '~/components/layout/admin-sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/20">
      <AdminSidebar />
      <div className="flex-1">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
