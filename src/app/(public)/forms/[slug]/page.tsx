import { notFound } from 'next/navigation';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';
import { ApplicantForm } from './submit-form';

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caller = await createServerCaller();
  const form = await caller.form.publicBySlug({ slug });

  if (!form) {
    notFound();
  }

  return (
    <main className="flex-1">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
        <Card>
          <CardHeader className="space-y-3">
            <Badge variant="secondary" className="w-fit uppercase tracking-[0.35em] text-xs">
              Scoutly Başvuru Formu
            </Badge>
            <CardTitle className="text-3xl font-semibold tracking-tight">{form.title}</CardTitle>
            {form.welcomeMessage && (
              <p className="text-base leading-relaxed text-muted-foreground">{form.welcomeMessage}</p>
            )}
          </CardHeader>
          <CardContent>
            <ApplicantForm form={form} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
