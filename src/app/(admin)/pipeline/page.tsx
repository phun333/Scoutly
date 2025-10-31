import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';
import { ClipboardList } from 'lucide-react';

export default async function PipelineIndexPage() {
  const caller = await createServerCaller();
  const forms = await caller.form.list();

  const pipelineForms = forms.filter((form) => form._count.submissions > 0);

  return (
    <main className="flex flex-1 flex-col gap-10 pb-12">
      <header className="flex flex-col gap-3 rounded-xl border bg-card/60 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Pipeline</p>
          <h1 className="text-3xl font-semibold tracking-tight">Aday Pipeline&apos;ları</h1>
          <p className="text-sm text-muted-foreground">
            Form başına kanban görünümü oluştur. Hangi adayın hangi aşamada olduğunu tek bakışta gör.
          </p>
        </div>
        <Button asChild>
          <Link href="/forms/new">Yeni form oluştur</Link>
        </Button>
      </header>

      {pipelineForms.length === 0 ? (
        <Card className="border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          Henüz pipeline verisi yok. Başvurular geldikçe formlar burada listelenecek.
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {pipelineForms.map((form) => (
            <Card key={form.id} className="flex flex-col justify-between border-border/70">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xl font-semibold text-foreground">{form.title}</CardTitle>
                  <Badge variant={form.status === 'ACTIVE' ? 'default' : 'secondary'}>{form.status}</Badge>
                </div>
                <CardDescription>
                  {form.description ?? 'Bu form için henüz açıklama girilmemiş.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{form._count.submissions} başvuru</span>
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href={`/pipeline/${form.id}`}>
                    <ClipboardList className="h-4 w-4" aria-hidden />
                    Pipeline&apos;ı aç
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
