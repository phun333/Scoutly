"use client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

const calendlyDocsUrl =
  "https://developer.calendly.com/docs/embedding-calendly";
const calendlyAppUrl = "https://calendly.com";

export function ScheduleClient() {
  return (
    <main className="flex flex-1 flex-col gap-8 pb-12">
      <header className="space-y-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Görüşme planı
          </h1>
          <p className="text-muted-foreground">
            Yakında Calendly entegrasyonu ile adaylarla görüşme planlarken tüm
            süreci bu sayfadan yöneteceksin. O zamana kadar aşağıdaki
            yönergelerle toplantıları manuel takip edebilirsin.
          </p>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-2">
            <CardTitle>Calendly embed alanı</CardTitle>
            <CardDescription>
              Entegrasyon tamamlandığında Calendly’nin gömülü takvimi bu panelde
              görünecek.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-center text-sm text-muted-foreground">
              <svg
                viewBox="0 0 24 24"
                className="mb-3 h-10 w-10 text-muted-foreground/80"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M6 2a2 2 0 0 0-2 2v2H2v2h2v8H2v2h2v2a2 2 0 0 0 2 2h2v-2H6v-2h2v-2H6V8h2V6H6V4h2V2zm10 0v2h2v2h-2v2h2v8h-2v2h2v2h-2v2h2a2 2 0 0 0 2-2v-2h2v-2h-2V8h2V6h-2V4a2 2 0 0 0-2-2zM9 8v8h2v-4h2v4h2V8h-2v2h-2V8z"
                />
              </svg>
              <p className="max-w-sm">
                Calendly iframe kodunu eklediğimizde toplantılar otomatik olarak
                burada görünecek. Entegrasyon hazır olana kadar dışarıdaki
                takvim üzerinden plan yapmaya devam et.
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Hazırlık adımları</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Calendly’de şirket hesabı aç ve ilgili event türlerini oluştur
                  (ör. “Meet”, “Ofis”).
                </li>
                <li>
                  Embed kodunu veya API token’ını sakla. Entegrasyon sırasında
                  buraya ekleyeceğiz.
                </li>
                <li>
                  Görüşme tipleri için <Badge variant="secondary">etiket</Badge>{" "}
                  standartlarını belirle ki filtreleme kolay olsun.
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Şimdilik manuel takip</CardTitle>
            <CardDescription>
              Calendly gelene kadar toplantıları dış araçlar üzerinden planlayıp
              Scoutly’de not alabilirsin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="space-y-3">
              <p className="font-medium text-foreground">
                Önerilen çalışma şekli
              </p>
              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Adayı Calendly veya Google Calendar üzerinden davet et. Davet
                  detaylarına görüşme tipini ekle (ör. “Meet” / “Ofis”).
                </li>
                <li>
                  Scoutly’de ilgili aday kartına toplantı tarihini ve notlarını
                  yaz. Entegrasyon geldiğinde bu alanlar otomatik dolacak.
                </li>
                <li>
                  Görüşme sonrası değerlendirme notlarını yine Scoutly’de
                  paylaş; böylece ekip eşzamanlı ilerler.
                </li>
              </ol>
            </div>
            <div className="h-px bg-border" role="presentation" />
            <div className="space-y-3">
              <p className="font-medium text-foreground">Kaynaklar</p>
              <div className="flex flex-col gap-2">
                <Button asChild variant="outline" className="justify-start">
                  <a href={calendlyAppUrl} target="_blank" rel="noreferrer">
                    Calendly hesabını aç
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-start">
                  <a href={calendlyDocsUrl} target="_blank" rel="noreferrer">
                    Embed dokümantasyonunu incele
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
