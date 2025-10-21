import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';
import { DeleteFormButton } from '~/app/(admin)/forms/manage/[id]/delete-form-button';

const statusStyles: Record<'ACTIVE' | 'DRAFT' | 'ARCHIVED', { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  ACTIVE: { label: 'Aktif', variant: 'default' },
  DRAFT: { label: 'Taslak', variant: 'secondary' },
  ARCHIVED: { label: 'Arşivlendi', variant: 'outline' },
};

export default async function DashboardPage() {
  const caller = await createServerCaller();
  const forms = await caller.form.list();

  const totalSubmissions = forms.reduce((sum, form) => sum + form._count.submissions, 0);
  const activeForms = forms.filter((form) => form.status === 'ACTIVE').length;
  const archivedForms = forms.filter((form) => form.status === 'ARCHIVED').length;

  return (
    <main className="flex flex-1 flex-col gap-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">İşe Alım Özeti</h1>
            <p className="text-sm text-muted-foreground">
              {totalSubmissions} başvuru, {forms.length} form üzerinden toplandı.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/forms/new">Yeni form oluştur</Link>
          </Button>
      </header>

      <div className="grid gap-4 text-center md:grid-cols-3">
          <Card>
            <CardHeader className="pb-10">
              <CardDescription>Toplam başvurular</CardDescription>
              <CardTitle className="text-3xl font-semibold">{totalSubmissions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Aktif formlar</CardDescription>
              <CardTitle className="text-3xl font-semibold">{activeForms}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Arşivlenen formlar</CardDescription>
              <CardTitle className="text-3xl font-semibold">{archivedForms}</CardTitle>
            </CardHeader>
          </Card>
        </div>

      <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Formlar</h2>
            <Badge variant="secondary">{forms.length} form</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
          {forms.map((form) => {
            const status =
              statusStyles[form.status as keyof typeof statusStyles] ?? statusStyles.DRAFT;
            return (
              <Card key={form.id} className="flex flex-col justify-between">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle>{form.title}</CardTitle>
                        <CardDescription>{form.description ?? 'Bu form henüz açıklama içermiyor.'}</CardDescription>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Toplanan başvurular</dt>
                        <dd className="text-2xl font-semibold text-foreground">{form._count.submissions}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Paylaşım linki</dt>
                        <dd>
                          <code className="rounded bg-secondary px-2 py-1 text-sm">/forms/{form.slug}</code>
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                    <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Son güncelleme: {form.updatedAt.toLocaleDateString('tr-TR')}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" asChild>
                        <Link href={`/forms/manage/${form.id}`}>Formu yönet</Link>
                      </Button>
                      <DeleteFormButton formId={form.id} formTitle={form.title} layout="inline" size="sm" />
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
      </section>
    </main>
  );
}
