import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignInForm } from './auth/sign-in/sign-in-form';
import { auth } from '~/server/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { PIPELINE_STAGE_LABELS, type PipelineStage } from '~/lib/pipeline';

const heroHighlights = [
  {
    color: 'bg-primary',
    title: '15 dakikada formunu kur',
    description: 'Rol sorularını seç, AI değerlendirme kriterlerini ekle ve paylaşılabilir linki üret.',
  },
  {
    color: 'bg-emerald-500',
    title: "AI analizleri pipeline'da birleşir",
    description: 'Başvurular saniyeler içinde skorlanır, güçlü sinyaller kanbanda görünür.',
  },
  {
    color: 'bg-indigo-500',
    title: 'Tek panelde karar süreci',
    description: 'Mülakat, teklif ve kabul aşamaları tek yerde akarken ekip notları kaybolmaz.',
  },
];

const heroMetrics = [
  {
    value: '15 dk',
    label: 'Başlangıç süresi',
    description: 'Form builder şablonları işe alım sürecini hızlandırır.',
  },
  {
    value: '30 sn',
    label: 'AI analiz süresi',
    description: 'Başvurular gelir gelmez skorlanır ve özetlenir.',
  },
  {
    value: '%70',
    label: 'Zaman tasarrufu',
    description: 'Pipeline otomasyonu manuel seçim yükünü azaltır.',
  },
];

const featureSections = [
  {
    title: 'Akıllı form builder',
    description:
      'Role özel soruları, AI değerlendirme rehberini ve paylaşılabilir başvuru linkini dakikalar içinde kur.',
    bullets: [
      'Sürükle-bırak alanlarla role uygun sorular topla',
      'AI değerlendirme kriterlerini tanımla, başvurular otomatik puanlansın',
      'Demo modu ile formu paylaş, geri bildirim topla',
    ],
  },
  {
    title: 'Pipeline otomasyonu',
    description:
      "Başvurular Kanban'a akar, ekip tek bakışta kimin ilerlemesi gerektiğini görür.",
    bullets: [
      'Aşamalar arasında sürükle-bırak, tek tıkla eleme aksiyonları',
      'AI skorları ve risk etiketleri kararları hızlandırır',
      'Analytics yakında: funnel dönüşümlerini ölç, darboğazı tespit et',
    ],
  },
  {
    title: 'Planlama & ekip ritmi',
    description:
      'Görüşme planlama modülü takvim entegrasyonu için hazır altyapı ve check-listler sunar.',
    bullets: [
      'Görüşme şablonları ile tutarlı aday deneyimi',
      'Görev atamaları ve ortak not alma alanı',
      'Google/Calendly entegrasyonuna hazır embed slotları',
    ],
  },
];

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden border-b border-border/70 bg-background">
        <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/15 via-background to-background blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 pb-16 pt-20 lg:grid-cols-[1.25fr_0.75fr] lg:pb-24 lg:pt-24">
          <article className="space-y-10">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Scoutly ile teknik işe alım formunu 15 dakikada kur.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Form builder ile rol sorularını tanımla, başvuruları paylaşılabilir linkten topla. Scoutly başvuruları otomatik
                skorlar, kanbanda aşama aşama ilerletir ve ekip görüşlerini tek panelde toplar.
              </p>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                Küçük ekipler enterprise işe alım hızına AI destekli analiz ve pipeline otomasyonuyla erişir.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="mailto:ali@wiredium.com">Erken erişim iste</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="#product-overview">Ürünü keşfet</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {heroMetrics.map((metric) => (
                <Card key={metric.label} className="border border-border/60 bg-background/80 shadow-sm backdrop-blur">
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-3xl font-semibold text-foreground">{metric.value}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">{metric.label}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">{metric.description}</CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4">
              {heroHighlights.map((highlight) => (
                <div key={highlight.title} className="flex gap-3 text-sm text-muted-foreground">
                  <span className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${highlight.color}`} />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{highlight.title}</p>
                    <p>{highlight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="grid gap-6">
            <SignInForm callbackUrl="/dashboard" />
          </aside>
        </div>
      </section>

      <section id="product-overview" className="mx-auto w-full max-w-6xl px-4 py-16 lg:py-20">
        <header className="max-w-3xl space-y-3 pb-10">
          <Badge variant="outline" className="w-fit uppercase tracking-[0.25em] text-xs">
            Ürün özeti
          </Badge>
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">Tek platform, uçtan uca işe alım ritmi</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Scoutly, başvuru formundan işe alım planına kadar tüm adımları tek akışta birleştirir. Modüller standalone çalışır;
            birlikte kullanıldığında karar döngüsünü katlar.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-3">
          {featureSections.map((feature) => (
            <Card key={feature.title} className="relative h-full border border-border/60 bg-background/80 shadow-sm backdrop-blur">
              <CardHeader className="space-y-3 pb-4">
                <CardTitle className="text-xl font-semibold text-foreground">{feature.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="grid gap-2">
                  {feature.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-1 h-2 w-2 flex-none rounded-full bg-primary/70" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <PipelinePreview />
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-24">
        <Card className="border border-border/70 bg-background/90 shadow-sm">
          <CardHeader className="space-y-3 pb-4 text-center">
            <CardTitle className="text-2xl font-semibold text-foreground sm:text-3xl">
              İşe alım ritmini Scoutly ile başlat
            </CardTitle>
            <CardDescription className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground">
              Form builder&apos;ı 15 dakikada ayarlayıp başvuruları toplamaya başla. AI skorları ve kanban pipeline ile ekibinin zamanı
              gerçek aday değerlendirmesine kalsın.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="mailto:ali@wiredium.com">Erken erişim iste</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/auth/sign-in">Zaten hesabım var</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

const pipelinePreviewData: Array<{
  stage: PipelineStage;
  badgeClass: string;
  columnClass: string;
  cards: Array<{
    name: string;
    score: number;
    summary: string;
    age: string;
  }>;
}> = [
  {
    stage: 'Applied',
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
    columnClass: 'bg-gradient-to-br from-sky-500/10 via-transparent to-transparent',
    cards: [
      {
        name: 'Abraham Dixon',
        score: 78,
        summary: 'Frontend deneyimi güçlü, React + Tailwind pratiği var.',
        age: '2 gün önce',
      },
      {
        name: 'Claire Miller',
        score: 74,
        summary: 'Storybook deneyimi ve tasarım sistemi katkıları mevcut.',
        age: '4 gün önce',
      },
    ],
  },
  {
    stage: 'Interview',
    badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200',
    columnClass: 'bg-gradient-to-br from-fuchsia-500/10 via-transparent to-transparent',
    cards: [
      {
        name: 'Ana Waltz',
        score: 88,
        summary: 'Canlı kod testinde başarı; performans optimizasyonuna hâkim.',
        age: 'Bugün',
      },
    ],
  },
  {
    stage: 'Offer',
    badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
    columnClass: 'bg-gradient-to-br from-amber-400/15 via-transparent to-transparent',
    cards: [
      {
        name: 'Zac Johnson',
        score: 90,
        summary: 'Takım liderliği tecrübesi mevcut, teklif hazırlığında.',
        age: '12 saat önce',
      },
    ],
  },
  {
    stage: 'Hired',
    badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    columnClass: 'bg-gradient-to-br from-emerald-400/15 via-transparent to-transparent',
    cards: [
      {
        name: 'Zoe Banks',
        score: 94,
        summary: 'Kabul edildi. Başlangıç tarihi ve onboarding planı hazır.',
        age: '3 gün önce',
      },
    ],
  },
];

function PipelinePreview() {
  return (
    <section className="space-y-4 rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Örnek kanban görünümü</p>
        <h2 className="text-2xl font-semibold text-foreground">
          Başvuruları pipeline&apos;da nasıl takip edeceğini keşfet
        </h2>
      </header>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {pipelinePreviewData.map((column) => (
          <article
            key={column.stage}
            className={`min-w-[220px] flex-1 rounded-2xl border border-border/60 p-4 shadow-sm ${column.columnClass}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                {PIPELINE_STAGE_LABELS[column.stage] ?? column.stage}
              </span>
              <Badge className={`text-xs uppercase tracking-wide ${column.badgeClass}`}>
                {column.cards.length}
              </Badge>
            </div>
            <div className="grid gap-3">
              {column.cards.map((card) => (
                <Card key={card.name} className="border-border/60 bg-background/90 shadow-sm">
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-foreground">
                        {card.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Skor {card.score}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground">
                      {card.age}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {card.summary}
                  </CardContent>
                </Card>
              ))}
            </div>
          </article>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Bu örnek, gerçek pipeline görünümünün birebir ön izlemesidir. Canlı ortamda adaylar aşamalar arasında tek tıkla ilerler.
      </p>
    </section>
  );
}
