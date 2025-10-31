import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';
import { cn } from '~/lib/utils';
import { isJsonObject } from '~/lib/json-guards';
import { PipelineAssignButton } from './pipeline-assign-button';

export const metadata: Metadata = {
  title: 'Başvurular',
};

type SearchParams = {
  form?: string;
  decision?: string;
};

type DecisionFilter = 'ALL' | 'YES' | 'NO' | 'MAYBE';

const decisionFilters: Array<{ value: DecisionFilter; label: string }> = [
  { value: 'ALL', label: 'Hepsi' },
  { value: 'YES', label: 'Qualified' },
  { value: 'MAYBE', label: 'Review' },
  { value: 'NO', label: 'Disqualified' },
];

function getDecisionBadge(decision: string | null | undefined): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (decision) {
    case 'YES':
      return { label: 'Qualified', variant: 'default' };
    case 'NO':
      return { label: 'Disqualified', variant: 'destructive' };
    case 'MAYBE':
      return { label: 'Review', variant: 'secondary' };
    default:
      return { label: 'Bekliyor', variant: 'outline' };
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value);
}

function buildLink(base: string, params: SearchParams): string {
  const search = new URLSearchParams();
  if (params.form) search.set('form', params.form);
  if (params.decision && params.decision !== 'ALL') search.set('decision', params.decision);
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams: SearchParams = searchParams ? await searchParams : {};
  const caller = await createServerCaller();

  const forms = await caller.form.list();
  const selectedFormId = resolvedParams.form;
  const decisionFilter = (resolvedParams.decision?.toUpperCase() as DecisionFilter | undefined) ?? 'ALL';

  const selectedForm = forms.find((form) => form.id === selectedFormId);

  const submissions = selectedForm
    ? await caller.submission.byFormWithStage({ formId: selectedForm.id })
    : [];

  const filteredSubmissions = submissions.filter((submission) => {
    if (decisionFilter === 'ALL') return true;
    return (submission.evaluation?.decision ?? 'MAYBE') === decisionFilter;
  });

  const qualifiedCount = submissions.filter((item) => item.evaluation?.decision === 'YES').length;
  const disqualifiedCount = submissions.filter((item) => item.evaluation?.decision === 'NO').length;
  const reviewCount = submissions.length - qualifiedCount - disqualifiedCount;

  return (
    <main className="flex flex-1 flex-col gap-8 pb-12">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Başvuruları incele</h1>
        <p className="text-muted-foreground">
          İncelemek istediğin formu soldan seç, adayların AI skorlarını filtrele ve qualified / disqualified kararlarını güncelle.
        </p>
      </div>

      {forms.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Henüz form oluşturulmadı</CardTitle>
              <CardDescription>Başvuruları toplayabilmek için önce bir form oluşturman gerekiyor.</CardDescription>
            </div>
            <Button asChild>
              <Link href="/forms/new">Yeni form oluştur</Link>
            </Button>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[300px,1fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Formlar</h2>
              <Badge variant="outline">{forms.length}</Badge>
            </div>
            <div className="grid gap-3">
              {forms.map((form) => {
                const isActive = form.id === selectedForm?.id;
                const link = buildLink('/applications', { form: form.id });
                return (
                  <Link key={form.id} href={link} className="block">
                    <Card
                      className={cn(
                        'border-border/70 transition-shadow hover:shadow-md',
                        isActive ? 'border-primary bg-primary/5 shadow-sm' : 'hover:border-primary/50',
                      )}
                    >
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-semibold">{form.title}</CardTitle>
                          <Badge variant="secondary">{form.status}</Badge>
                        </div>
                        {form.description && (
                          <CardDescription className="line-clamp-2 text-sm">{form.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span>Başvuru</span>
                          <span className="text-sm font-semibold text-foreground">{formatNumber(form._count.submissions)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span>Durum</span>
                          <span className="capitalize text-sm text-foreground">{form.status.toLowerCase()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span>Slug</span>
                          <span className="text-sm font-mono text-foreground">{form.slug ?? '—'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            {!selectedForm ? (
              <Card className="border-dashed">
                <CardContent className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                  <p className="text-lg font-medium text-foreground">Form seçerek başvuruları görüntüle</p>
                  <p className="max-w-sm text-sm">
                    Soldaki listeden bir form seçtiğinde, ilgili adayların AI skorları ve özetleri burada görünecek.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-2xl font-semibold text-foreground">{selectedForm.title}</CardTitle>
                      {selectedForm.slug && (
                        <CardDescription className="font-mono text-xs text-muted-foreground">
                          /forms/{selectedForm.slug}
                        </CardDescription>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/forms/manage/${selectedForm.id}`}>Form ayarları</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Toplam başvuru</p>
                      <p className="text-2xl font-semibold text-foreground">{formatNumber(submissions.length)}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Qualified</p>
                      <p className="text-2xl font-semibold text-foreground">{formatNumber(qualifiedCount)}</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Review / Disqualified</p>
                      <p className="text-2xl font-semibold text-foreground">{formatNumber(reviewCount + disqualifiedCount)}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Aday listesi</h2>
                  <div className="flex flex-wrap gap-2">
                    {decisionFilters.map((filter) => {
                      const isActive = filter.value === decisionFilter;
                      const href = buildLink('/applications', {
                        form: selectedForm.id,
                        decision: filter.value,
                      });
                      return (
                        <Button
                          key={filter.value}
                          asChild
                          size="sm"
                          variant={isActive ? 'default' : 'outline'}
                          className="h-8 rounded-full px-4 text-xs"
                        >
                          <Link href={href}>{filter.label}</Link>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {filteredSubmissions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center text-sm text-muted-foreground">
                      Seçili filtreye uygun başvuru bulunamadı.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                {filteredSubmissions.map((submission) => {
                  const evaluation = submission.evaluation;
                  const decisionMeta = getDecisionBadge(evaluation?.decision ?? null);
                  const submittedAt = submission.createdAt?.toLocaleString('tr-TR') ?? 'Tarih bilinmiyor';
                  const scoreLabel =
                    evaluation?.overallScore != null
                      ? `Skor ${evaluation.overallScore}`
                      : 'Skor bekleniyor';
                  const detailHref = `/forms/manage/${selectedForm.id}#submission-${submission.id}`;

                  type KeywordMatch = {
                    keyword: string;
                    matched: boolean;
                    source: 'answers' | 'resume' | 'both';
                  };

                  const metadataRaw = isJsonObject(evaluation?.metadata)
                    ? evaluation?.metadata
                    : undefined;
                  const keywordMatches = Array.isArray(metadataRaw?.keywordMatches)
                    ? metadataRaw.keywordMatches.filter((value): value is KeywordMatch =>
                        isJsonObject(value) &&
                        typeof value.keyword === 'string' &&
                        typeof value.matched === 'boolean' &&
                        (value.source === 'answers' || value.source === 'resume' || value.source === 'both'),
                      )
                    : [];
                  const metadataNotes =
                    typeof metadataRaw?.notes === 'string' && metadataRaw.notes.trim().length > 0
                      ? metadataRaw.notes.trim()
                      : undefined;
                  const rawResponsePreview =
                    typeof metadataRaw?.rawResponsePreview === 'string' && metadataRaw.rawResponsePreview.trim().length > 0
                      ? metadataRaw.rawResponsePreview.trim()
                      : undefined;
                  const resumePreview =
                    typeof metadataRaw?.resumeTextPreview === 'string' && metadataRaw.resumeTextPreview.trim().length > 0
                      ? metadataRaw.resumeTextPreview.trim()
                      : undefined;
                  const resumeFull =
                    typeof metadataRaw?.resumeText === 'string' && metadataRaw.resumeText.trim().length > 0
                      ? metadataRaw.resumeText.trim()
                      : undefined;
                  const resumeSourceUrl =
                    typeof metadataRaw?.resumeUrl === 'string' && metadataRaw.resumeUrl.trim().length > 0
                      ? metadataRaw.resumeUrl
                      : submission.resumeUrl ?? undefined;
                  const modelUsed =
                    typeof metadataRaw?.modelUsed === 'string' && metadataRaw.modelUsed.trim().length > 0
                      ? metadataRaw.modelUsed
                      : undefined;
                  const aiAttempts = Array.isArray(metadataRaw?.aiModelAttempts)
                    ? metadataRaw.aiModelAttempts
                        .map((attempt) => (typeof attempt === 'string' ? attempt : undefined))
                        .filter((attempt): attempt is string => Boolean(attempt && attempt.trim().length > 0))
                    : [];
                  const strengthsText =
                    evaluation?.strengths && evaluation.strengths.trim().length > 0
                      ? evaluation.strengths
                      : 'Henüz bir özet yok.';
                  const risksText =
                    evaluation?.risks && evaluation.risks.trim().length > 0
                      ? evaluation.risks
                      : 'Belirgin bir risk tespit edilmedi.';

                  const hasResumeData = Boolean(resumePreview ?? resumeFull ?? resumeSourceUrl ?? '');
                  const hasModelDiagnostics = Boolean(modelUsed ?? (aiAttempts.length > 0 ? 'attempts' : undefined));
                  const hasMetadataDetails = Boolean(metadataNotes ?? rawResponsePreview ?? '');
                  const summaryPreview =
                    evaluation?.summary && evaluation.summary.length > 220
                      ? `${evaluation.summary.slice(0, 220).trim()}…`
                      : evaluation?.summary ?? null;
                  const hasExpandedSummary = Boolean(
                    evaluation?.summary && summaryPreview && evaluation.summary !== summaryPreview,
                  );

                  return (
                    <Card key={submission.id} className="border-border/70">
                      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold text-foreground">
                            {submission.applicantName}
                          </CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">
                            {submission.applicantEmail ?? 'E-posta paylaşılmadı'} — Gönderim: {submittedAt}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={decisionMeta.variant}
                          className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                        >
                          {decisionMeta.label}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">{scoreLabel}</p>
                          {summaryPreview ? (
                            <p className="leading-relaxed text-foreground">{summaryPreview}</p>
                          ) : (
                            <p className="text-muted-foreground">AI özeti henüz oluşturulmadı.</p>
                          )}
                          {hasExpandedSummary && (
                            <p className="text-xs text-muted-foreground">
                              Tam özet ve analiz detaylarını aşağıdaki bölümden inceleyebilirsin.
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-muted-foreground">
                            {submission.pipelineStage ? 'Pipeline aşaması' : "Pipeline'a ekle"}
                          </span>
                          <PipelineAssignButton
                            submissionId={submission.id}
                            formId={selectedForm.id}
                            currentStage={submission.pipelineStage ?? null}
                          />
                        </div>

                        <div className="flex items-center gap-3 text-xs">
                          <Button asChild variant="link" className="px-0 text-xs">
                            <Link href={`/forms/manage/${selectedForm.id}`}>Form detayını aç</Link>
                          </Button>
                          <span className="text-muted-foreground">•</span>
                          <Button asChild variant="link" className="px-0 text-xs">
                            <Link href={detailHref}>Başvuruyu incele</Link>
                          </Button>
                        </div>

                        <details className="rounded-md border border-border/60 bg-muted/10 p-4">
                          <summary className="cursor-pointer select-none text-sm font-semibold text-foreground underline-offset-2 hover:underline">
                            Detaylı AI değerlendirmesini göster
                          </summary>
                          <div className="mt-3 space-y-4 text-sm text-muted-foreground">
                            <div className="grid gap-3 md:grid-cols-2">
                              <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Güçlü yönler</p>
                                <p>{strengthsText}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Riskler</p>
                                <p>{risksText}</p>
                              </div>
                            </div>

                            {evaluation?.summary && hasExpandedSummary && (
                              <div className="space-y-2">
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Tam özet</p>
                                <p className="leading-relaxed text-foreground">{evaluation.summary}</p>
                              </div>
                            )}

                            {keywordMatches.length > 0 && (
                              <div className="grid gap-3 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">Anahtar kelime eşleşmeleri</p>
                                <ul className="grid gap-1 rounded-md border border-dashed border-border/70 bg-muted/20 p-3">
                                  {keywordMatches.map((match, index) => (
                                    <li key={`${match.keyword}-${index}`} className="flex items-center justify-between text-xs">
                                      <span className="text-foreground">{match.keyword}</span>
                                      <Badge
                                        variant={match.matched ? 'default' : 'outline'}
                                        className="text-[0.65rem] font-medium"
                                      >
                                        {match.matched ? 'Eşleşti' : 'Eksik'}
                                      </Badge>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {hasResumeData && (
                              <div className="grid gap-2 rounded-md border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="font-medium text-foreground">CV incelemesi</p>
                                  {resumeSourceUrl && (
                                    <Link
                                      href={resumeSourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                                    >
                                      PDF&apos;yi aç
                                    </Link>
                                  )}
                                </div>
                                {resumePreview && (
                                  <p className="whitespace-pre-line text-sm text-muted-foreground">{resumePreview}</p>
                                )}
                                {resumeFull && (
                                  <details>
                                    <summary className="cursor-pointer select-none text-xs font-medium text-foreground underline-offset-2 hover:underline">
                                      Tüm CV metnini göster
                                    </summary>
                                    <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-background/80 p-2 text-[0.65rem] text-muted-foreground">
                                      {resumeFull}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            )}

                            {hasModelDiagnostics && (
                              <div className="grid gap-1 rounded-md border border-dashed border-muted/60 bg-background/40 p-3 text-[0.65rem] text-muted-foreground">
                                {modelUsed && (
                                  <p className="font-medium text-foreground">
                                    Kullanılan AI modeli:{' '}
                                    <span className="font-normal text-muted-foreground">{modelUsed}</span>
                                  </p>
                                )}
                                {aiAttempts.length > 0 && <p>Denenen modeller: {aiAttempts.join(' → ')}</p>}
                              </div>
                            )}

                            {hasMetadataDetails && (
                              <div className="space-y-2 rounded-md border border-dashed border-destructive/60 bg-destructive/5 p-3 text-xs">
                                {metadataNotes && (
                                  <p className="font-medium text-destructive-foreground">
                                    AI değerlendirmesi notu:{' '}
                                    <span className="font-normal text-muted-foreground">{metadataNotes}</span>
                                  </p>
                                )}
                                {rawResponsePreview && (
                                  <details className="text-muted-foreground">
                                    <summary className="cursor-pointer select-none text-destructive-foreground underline-offset-2 hover:underline">
                                      Gemini yanıt önizlemesini göster
                                    </summary>
                                    <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded bg-background/80 p-2 text-[0.65rem]">
                                      {rawResponsePreview}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            )}

                            <details className="rounded-md border border-dashed border-border/70 bg-background/60 p-3 text-xs">
                              <summary className="cursor-pointer select-none font-medium text-foreground underline-offset-2 hover:underline">
                                Başvuru yanıtlarını JSON olarak görüntüle
                              </summary>
                              <pre className="mt-3 overflow-x-auto rounded-md bg-background p-4 text-xs text-muted-foreground">
                                {JSON.stringify(submission.answers, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </details>
                      </CardContent>
                    </Card>
                  );
                })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
