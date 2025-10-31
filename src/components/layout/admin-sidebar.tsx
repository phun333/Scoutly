'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, ClipboardList, Kanban, LogOut, PlusCircle, Settings, Table2, Users } from 'lucide-react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { SignOutButton } from '~/components/sign-out-button';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const navSections: NavSection[] = [
  {
    label: 'Genel',
    items: [
      { href: '/dashboard', label: 'Özet', icon: Table2 },
      {
        href: '/forms/manage',
        label: 'Formlar',
        icon: Users,
        match: (pathname) => pathname.startsWith('/forms/manage'),
      },
      { href: '/forms/new', label: 'Yeni form', icon: PlusCircle },
    ],
  },
  {
    label: 'Değerlendirme',
    items: [
      {
        href: '/applications',
        label: 'Başvurular',
        icon: ClipboardList,
        match: (pathname) => pathname.startsWith('/applications'),
      },
      {
        href: '/pipeline',
        label: 'Pipeline',
        icon: Kanban,
        match: (pathname) => pathname.startsWith('/pipeline'),
      },
    ],
  },
  {
    label: 'Planlama',
    items: [
      {
        href: '/schedule',
        label: 'Planlama',
        icon: CalendarClock,
        match: (pathname) => pathname.startsWith('/schedule'),
      },
    ],
  },
  {
    label: 'Hesap',
    items: [
      {
        href: '/settings',
        label: 'Ayarlar',
        icon: Settings,
        match: (pathname) => pathname.startsWith('/settings'),
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const nameFromSession = session?.user?.name?.trim();
  const emailPrefix = session?.user?.email?.split('@')[0]?.trim();
  const userName =
    nameFromSession && nameFromSession.length > 0
      ? nameFromSession
      : emailPrefix && emailPrefix.length > 0
        ? emailPrefix
        : 'Scoutly Admin';
  const userEmail = session?.user?.email ?? null;

  const initialsFromName = userName
    .split(' ')
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => segment.trim()[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  const initials = initialsFromName.length > 0 ? initialsFromName : 'S';

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r bg-muted/30 px-4 py-6 sm:flex">
      <header className="flex items-center justify-between gap-2 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-4xl font-semibold">
          <Image
            src="/scoutly-black-logo.svg"
            alt="Scoutly logo"
            width={48}
            height={48}
            className="h-12 w-12"
            priority
          />
          <span>Scoutly</span>
        </Link>
      </header>

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1 text-sm">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 space-y-3 border-t pt-4">
        <Button asChild variant="secondary" size="sm" className="w-full justify-start gap-2">
          <Link href="/forms/new">
            <PlusCircle className="h-4 w-4" aria-hidden />
            Yeni form oluştur
          </Link>
        </Button>

        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{userName}</p>
            {userEmail && <p className="text-xs text-muted-foreground">{userEmail}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
              aria-label="Profil ayarları"
            >
              <Link href="/settings">
                <Settings className="h-4 w-4" aria-hidden />
                <span className="sr-only">Profil ayarları</span>
              </Link>
            </Button>
            <SignOutButton
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
              aria-label="Oturumu kapat"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="sr-only">Çıkış yap</span>
            </SignOutButton>
          </div>
        </div>
      </div>
    </aside>
  );
}
