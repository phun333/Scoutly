import type { Metadata } from 'next';
import { SignInForm } from './sign-in-form';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export const metadata: Metadata = {
  title: 'Log in',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          <header className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">Scoutly&apos;ye giriş yap</h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Tek bir yönetici hesabı ile ilan oluştur, soruları seç ve Scoutly senin için başvuru bağlantısını
              üretip adayları otomatik değerlendirsin.
            </p>
          </header>
          <Card className="border-dashed bg-secondary/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">İçeride seni ne bekliyor?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-relaxed text-muted-foreground">
                <li>Yeni ilan oluştur: rolü, soruları ve AI değerlendirme hedeflerini tanımla.</li>
                <li>Scoutly paylaşılabilir bir link üretir; adaylar bu link üzerinden formu doldurur.</li>
                <li>Adaylar hesap açmaz — gelen başvuruları panelden yönetirsin.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col items-center gap-6">
          <SignInForm callbackUrl={params.callbackUrl} error={params.error} />
        </div>
      </section>
    </main>
  );
}
