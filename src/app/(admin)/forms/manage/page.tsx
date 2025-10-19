import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';

export default async function ManageFormsIndex() {
  const caller = await createServerCaller();
  const forms = await caller.form.list();

  return (
    <main className="flex flex-1 flex-col gap-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Formlar</h1>
          <p className="text-muted-foreground">Mevcut ilanlarını yönet, değerlendirme rehberini güncelle veya yeni form ekle.</p>
        </div>
        <Button asChild>
          <Link href="/forms/new">Yeni form oluştur</Link>
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Henüz form oluşturmadın. İlk formunu hazırlamak için yukarıdaki butonu kullanabilirsin.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => {
            const statusLabel = form.status === 'ACTIVE' ? 'Aktif' : form.status === 'ARCHIVED' ? 'Arşivli' : 'Taslak';
            const statusVariant: 'default' | 'secondary' | 'outline' =
              form.status === 'ACTIVE' ? 'default' : form.status === 'ARCHIVED' ? 'outline' : 'secondary';
            return (
              <Card key={form.id} className="flex flex-col justify-between">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle>{form.title}</CardTitle>
                      <CardDescription>{form.description ?? 'Bu form için açıklama eklemedin.'}</CardDescription>
                    </div>
                    <Badge variant={statusVariant}>{statusLabel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Başvuru sayısı:</span> {form._count.submissions}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Paylaşım linki:</span> /forms/{form.slug}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Son güncelleme {form.updatedAt.toLocaleDateString('tr-TR')}</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/forms/manage/${form.id}`}>Detay</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/forms/manage/${form.id}/edit`}>Düzenle</Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
