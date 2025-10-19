import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignInForm } from './auth/sign-in/sign-in-form';
import { auth } from '~/server/auth';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-6xl gap-16 px-4 py-16 lg:grid-cols-[2fr_1fr] lg:py-24">
        <article className="flex flex-col gap-10">
          <header className="space-y-4">
            <Badge variant="secondary" className="w-fit uppercase tracking-[0.35em] text-xs">
              AI Destekli Ön Eleme
            </Badge>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Scoutly ile başvuruları dakikalar içinde filtreleyip güçlü adaylara odaklan.
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              İlan formunu tanımla, başvuru bağlantını paylaş ve Scoutly’nin AI değerlendirmeleriyle teknik
              uyum, iletişim ve motivasyon sinyallerini tek panelde gör. İnsan yöneticiler sadece en umut
              vadeden başvurularla vakit kaybeder.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" /> Gerçek zamanlı AI skorları
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Paylaşılabilir form linkleri
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500" /> Manuel inceleme dostu raporlar
              </div>
            </div>
          </header>

          <div className="grid gap-6 lg:max-w-2xl">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Nasıl çalışır?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="grid gap-3 text-base leading-relaxed text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">1.</span> Admin olarak giriş yap, ilan için
                    soruları seç ve formu yayınla.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">2.</span> Scoutly senin için benzersiz bir
                    paylaşım linki üretir.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">3.</span> Adaylar linke tıklayıp formu doldurur;
                    AI saniyeler içinde skor üretir.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">4.</span> Dashboard’dan güçlü adayları seçip
                    süreci hızlandır.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card className="border-dashed">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Neden Scoutly?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 text-base leading-relaxed text-muted-foreground">
                  <li>
                    <span className="font-semibold text-foreground">Hızlı ön eleme:</span> CV + motivasyon metni aynı
                    anda analiz edilir.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Objektif sinyaller:</span> Güçlü yönler, riskler
                    ve karar önerisi tek bakışta.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Paylaşılabilirlik:</span> Form linkini ekip ve
                    topluluklarla paylaş, başvuru alanını genişlet.
                  </li>
                  <li>
                    <span className="font-semibold text-foreground">Kod gerektirmez:</span> Adaylar hesap açmaz, direkt
                    formu doldurur.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/forms/demo">Demo formu gör</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/AGENTS">Katkı rehberi</Link>
            </Button>
          </div>
        </article>

        <aside className="grid gap-6">
          <SignInForm callbackUrl="/dashboard" />
          <Card className="border-dashed bg-secondary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Aday deneyimi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>Adaylar yalnızca sana özel linki kullanır, hesap oluşturmaz.</p>
              <p>Başvurular otomatik skorlanır ve yönetici paneline düşer.</p>
              <p>Manuel kontrol için tüm yanıtlar ve AI raporu tek yerde.</p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
