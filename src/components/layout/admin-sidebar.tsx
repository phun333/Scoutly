'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { LogOut, PlusCircle, Settings, Table2, Users } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { SignOutButton } from '~/components/sign-out-button';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Özet', icon: Table2 },
  {
    href: '/forms/manage',
    label: 'Formlar',
    icon: Users,
    match: (pathname) => pathname.startsWith('/forms/manage'),
  },
  { href: '/forms/new', label: 'Yeni form', icon: PlusCircle },
  {
    href: '/settings',
    label: 'Ayarlar',
    icon: Settings,
    match: (pathname) => pathname.startsWith('/settings'),
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r bg-muted/30 px-4 py-6 sm:flex">
      <header className="flex items-center justify-between gap-2 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-3 w-3 rounded-full bg-primary" aria-hidden /> Scoutly
        </Link>
        <SignOutButton variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" aria-hidden />
        </SignOutButton>
      </header>

      <nav className="flex-1 space-y-1 text-sm">
        {navItems.map((item) => {
          const matchFn = item.match ?? ((current: string) => current === item.href);
          const isActive = matchFn(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground">
        <p>Scoutly hesabından çıkış yap veya yeni bir form oluştur.</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/forms/new">Yeni form</Link>
          </Button>
          <SignOutButton variant="destructive" size="sm" className="flex-1" />
        </div>
      </div>
    </aside>
  );
}
