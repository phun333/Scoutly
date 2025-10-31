import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, ClipboardList, FilePlus, LineChart, Users } from 'lucide-react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';

const quickLinks: Array<{
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}> = [
  {
    title: 'Başvuruları incele',
    description: 'AI skorlarına göre qualified / disqualified kararlarını listele.',
    href: '/applications',
    icon: ClipboardList,
  },
  {
    title: 'Görüşmeleri planla',
    description: 'Takvim entegrasyonunu bağla, ekip üyelerini ata ve adayla toplantı slotu paylaş.',
    href: '/schedule',
    icon: CalendarClock,
  },
  {
    title: 'Yeni form oluştur',
    description: 'Yeni rol için form yayınla ve paylaşım linkini ekip arkadaşlarınla paylaş.',
    href: '/forms/new',
    icon: FilePlus,
  },
  {
    title: 'Formları yönet',
    description: 'Alanları güncelle, AI değerlendirme rehberini düzenle ve form durumunu değiştir.',
    href: '/forms/manage',
    icon: Users,
  },
  {
    title: 'Raporlar (yakında)',
    description: 'Qualified oranları, risk sinyalleri ve zaman serisi analitikleri burada görülecek.',
    href: '#',
    icon: LineChart,
    disabled: true,
  },
];

export default async function DashboardPage() {
  const caller = await createServerCaller();
  const forms = await caller.form.list();
  const totalSubmissions = forms.reduce((sum, form) => sum + form._count.submissions, 0);
  const activeForms = forms.filter((form) => form.status === 'ACTIVE').length;

  return (
    <main className="flex flex-1 flex-col gap-12">
      <header className="flex flex-col gap-4 rounded-xl border bg-card/60 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Badge variant="outline" className="w-fit bg-primary/10 text-xs uppercase tracking-wide text-primary">
            Scoutly Insights
          </Badge>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">İşe Alım Özeti</h1>
            <p className="text-sm text-muted-foreground">
              {forms.length} form ile {totalSubmissions} başvuru toplandı. Hızlıca aksiyon almak için aşağıdaki adımları kullan.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/applications">
              <ClipboardList className="h-4 w-4" aria-hidden />
              Başvuruları incele
            </Link>
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/forms/new">
              <FilePlus className="h-4 w-4" aria-hidden />
              Yeni form oluştur
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Toplam başvurular</CardDescription>
            <CardTitle className="text-3xl font-semibold">{totalSubmissions}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Formlarının tamamından gelen gönderimler.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-1">
            <CardDescription>Aktif formlar</CardDescription>
            <CardTitle className="text-3xl font-semibold">{activeForms}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Aday toplamaya devam eden form sayısı.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          const isDisabled = Boolean(link.disabled);

          const content = (
            <div className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-border/60 bg-background/70 p-8 text-left shadow-sm transition hover:border-primary/40 hover:shadow-lg">
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" aria-hidden />
                </span>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-foreground">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{isDisabled ? 'Bu özellik yakında aktif olacak.' : 'Detay sayfasına giderek hemen aksiyon al.'}</span>
                {isDisabled ? (
                  <Badge variant="secondary" className="uppercase tracking-wide">
                    Yakında
                  </Badge>
                ) : (
                  <span className="text-sm font-medium text-primary">Detaylara git →</span>
                )}
              </div>
            </div>
          );

          if (isDisabled) {
            return (
              <div key={link.title} className="opacity-70">
                {content}
              </div>
            );
          }

          return (
            <Link key={link.href} href={link.href} className="block">
              {content}
            </Link>
          );
        })}
      </section>
    </main>
  );
}
