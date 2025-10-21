import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { DeleteFormButton } from './delete-form-button';
import { ReevaluateButton } from './reevaluate-button';
import { StatusToggle } from './status-toggle';
import { ensureStringArray, isJsonObject } from '~/lib/json-guards';
import { createServerCaller } from '~/trpc/server';

export default async function ManageFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = await createServerCaller();

  try {
    const form = await caller.form.detail({ id });
    const evaluationSettings = (() => {
      if (!isJsonObject(form.config)) return null;
      const evaluation = isJsonObject(form.config.evaluation) ? form.config.evaluation : undefined;
      if (!evaluation) return null;
      return {
        overview: typeof evaluation.overview === 'string' ? evaluation.overview : undefined,
        mustHaveKeywords: ensureStringArray(evaluation.mustHaveKeywords),
        niceToHaveKeywords: ensureStringArray(evaluation.niceToHaveKeywords),
        customPrompt: typeof evaluation.customPrompt === 'string' ? evaluation.customPrompt : undefined,
      };
    })();

    return (
      <main className="flex flex-1 flex-col gap-10 pb-12">
        <header className="flex flex-col gap-6 rounded-xl border bg-card/60 p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Paylaşım linki:</span>
                <Link href={`/forms/${form.slug}`} className="font-mono text-primary underline-offset-4 hover:underline">
                  /forms/{form.slug}
                </Link>
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">{form.title}</h1>
              <p className="max-w-2xl text-muted-foreground">
                {form.description ?? 'Formun hedefini açıklayarak ekip arkadaşlarına bağlam sağlayabilirsin.'}
              </p>
            </div>
            <div className="flex w-full flex-col gap-4 sm:w-72">
              <Button asChild variant="outline">
                <Link href={`/forms/manage/${form.id}/edit`}>Formu düzenle</Link>
              </Button>
              <StatusToggle formId={form.id} status={form.status} />
              <ReevaluateButton formId={form.id} />
              <DeleteFormButton formId={form.id} formTitle={form.title} redirectTo="/dashboard" />
            </div>
        </header>

        {evaluationSettings && (
          <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Değerlendirme kriterleri</h2>
                <Badge variant="outline">AI rehberi</Badge>
              </div>
              <Card>
                <CardHeader className="space-y-2">
                  <CardTitle>Özet beklenti</CardTitle>
                  <CardDescription>
                    {evaluationSettings.overview ?? 'Form sahibi için genel bir beklenti girilmemiş.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Zorunlu anahtar kelimeler</p>
                    <p className="text-sm text-muted-foreground">
                      {evaluationSettings.mustHaveKeywords?.length
                        ? evaluationSettings.mustHaveKeywords.join(', ')
                        : 'Belirtilmedi'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Olması güzel kelimeler</p>
                    <p className="text-sm text-muted-foreground">
                      {evaluationSettings.niceToHaveKeywords?.length
                        ? evaluationSettings.niceToHaveKeywords.join(', ')
                        : 'Belirtilmedi'}
                    </p>
                  </div>
                  {evaluationSettings.customPrompt && (
                    <div className="sm:col-span-2 space-y-2">
                      <p className="text-sm font-medium text-foreground">Ek talimatlar</p>
                      <p className="text-sm text-muted-foreground">{evaluationSettings.customPrompt}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
          </section>
        )}

        <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Form alanları</h2>
              <Badge variant="secondary">{form.fields.length} alan</Badge>
            </div>
            <div className="grid gap-3">
              {form.fields.map((field) => {
                const supportingText = field.helpText ?? field.placeholder;
                return (
                  <Card key={field.id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{field.label}</CardTitle>
                        <Badge variant={field.required ? 'default' : 'outline'}>
                          {field.required ? 'Zorunlu' : 'Opsiyonel'}
                        </Badge>
                      </div>
                      <CardDescription className="capitalize">Alan tipi: {field.type}</CardDescription>
                    </CardHeader>
                    {supportingText ? (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{supportingText}</p>
                      </CardContent>
                    ) : null}
                  </Card>
                );
              })}
            </div>
        </section>

        <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Başvurular</h2>
              <Badge variant="secondary">{form.submissions.length} kayıt</Badge>
            </div>
            {form.submissions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Henüz başvuru yok. Linki paylaşarak ilk adayları toplayabilirsin.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {form.submissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{submission.applicantName}</CardTitle>
                          <CardDescription>
                            {submission.applicantEmail ?? 'E-posta paylaşılmadı'}
                          </CardDescription>
                        </div>
                        {submission.evaluation ? (
                          <Badge
                            variant={
                              submission.evaluation.decision === 'YES'
                                ? 'default'
                                : submission.evaluation.decision === 'MAYBE'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-sm"
                          >
                            Skor {submission.evaluation.overallScore ?? '—'} — {submission.evaluation.decision ?? 'Bilinmiyor'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">AI değerlendirmesi bekleniyor</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Gönderim tarihi: {submission.createdAt.toLocaleString('tr-TR')}
                      </p>
                    </CardHeader>
                    {(() => {
                      if (!submission.evaluation) return null;

                      type KeywordMatch = {
                        keyword: string;
                        matched: boolean;
                        source: 'answers' | 'resume' | 'both';
                      };

                      const isKeywordMatch = (value: unknown): value is KeywordMatch =>
                        isJsonObject(value) &&
                        typeof value.keyword === 'string' &&
                        typeof value.matched === 'boolean' &&
                        (value.source === 'answers' || value.source === 'resume' || value.source === 'both');

                      const metadataRaw = isJsonObject(submission.evaluation.metadata)
                        ? submission.evaluation.metadata
                        : undefined;
                      const keywordMatches = Array.isArray(metadataRaw?.keywordMatches)
                        ? metadataRaw.keywordMatches.filter(isKeywordMatch)
                        : [];
                      const metadataNotes =
                        typeof metadataRaw?.notes === 'string' && metadataRaw.notes.trim().length > 0
                          ? metadataRaw.notes.trim()
                          : undefined;
                      const rawResponsePreview =
                        typeof metadataRaw?.rawResponsePreview === 'string' &&
                        metadataRaw.rawResponsePreview.trim().length > 0
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
                      const hasResumeData = Boolean(resumePreview ?? resumeSourceUrl ?? '');
                      const hasModelDiagnostics = Boolean(modelUsed ?? (aiAttempts.length > 0 ? 'attempts' : undefined));
                      const hasMetadataDetails = Boolean(metadataNotes ?? rawResponsePreview ?? '');

                      return (
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                            <p className="text-foreground">{submission.evaluation.summary}</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Güçlü yönler</p>
                                <p className="text-sm">
                                  {submission.evaluation.strengths?.length
                                    ? submission.evaluation.strengths
                                    : 'Henüz bir özet yok.'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Riskler</p>
                                <p className="text-sm">
                                  {submission.evaluation.risks?.length
                                    ? submission.evaluation.risks
                                    : 'Belirgin bir risk tespit edilmedi.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {keywordMatches.length > 0 && (
                            <div className="grid gap-3 text-xs text-muted-foreground">
                              <p className="font-medium text-foreground">Anahtar kelime eşleşmeleri</p>
                              <ul className="grid gap-1 rounded-md border border-dashed border-border/70 bg-muted/20 p-3">
                                {keywordMatches.map((match, index) => (
                                  <li key={`${match.keyword}-${index}`} className="flex items-center justify-between text-xs">
                                    <span className="text-foreground">{match.keyword}</span>
                                    <Badge variant={match.matched ? 'default' : 'outline'} className="text-[0.65rem] font-medium">
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
                                <p className="whitespace-pre-line text-sm text-muted-foreground">
                                  {resumePreview}
                                </p>
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
                                <p className="font-medium text-foreground">Kullanılan AI modeli: <span className="font-normal text-muted-foreground">{modelUsed}</span></p>
                              )}
                              {aiAttempts.length > 0 && (
                                <p>
                                  Denenen modeller: {aiAttempts.join(' → ')}
                                </p>
                              )}
                            </div>
                          )}
                          {hasMetadataDetails && (
                            <div className="space-y-2 rounded-md border border-dashed border-destructive/60 bg-destructive/5 p-3 text-xs">
                              {metadataNotes && (
                                <p className="font-medium text-destructive-foreground">
                                  AI değerlendirmesi hata notu: <span className="font-normal text-muted-foreground">{metadataNotes}</span>
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
                        </CardContent>
                      );
                    })()}
                    <CardContent className="border-t bg-muted/40">
                      <details className="text-sm text-muted-foreground">
                        <summary className="cursor-pointer select-none font-medium text-foreground">
                          Yanıtları görüntüle
                        </summary>
                        <pre className="mt-3 overflow-x-auto rounded-md bg-background p-4 text-xs text-muted-foreground">
                          {JSON.stringify(submission.answers, null, 2)}
                        </pre>
                      </details>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </section>
      </main>
    );
  } catch (error) {
    console.error(error);
    notFound();
  }
}
