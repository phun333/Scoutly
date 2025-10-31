import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { createServerCaller } from '~/trpc/server';
import { cn } from '~/lib/utils';
import {
  CalendarClock,
  ClipboardList,
  FileText,
  MessageSquare,
  Users,
  UserPlus,
  PhoneCall,
  Mic,
  ClipboardCheck,
  Trophy,
  Ban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  DEFAULT_PIPELINE_STAGE,
  DISQUALIFIED_STAGE,
  PIPELINE_STAGE_LABELS,
  PIPELINE_STAGES,
  type PipelineStage,
} from '~/lib/pipeline';
import { PipelineStageControls } from '../pipeline-stage-controls';

export default async function PipelinePage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const caller = await createServerCaller();

  const form = await caller.form.detail({ id: formId }).catch(() => null);
  if (!form) {
    notFound();
  }

  const submissions = await caller.submission.byFormWithStage({ formId });

  const stageMeta: Record<PipelineStage, { icon: LucideIcon; articleClass: string; badgeClass: string; cardAccent: string }> = {
    Applied: {
      icon: UserPlus,
      articleClass: 'bg-gradient-to-br from-sky-500/10 via-transparent to-transparent',
      badgeClass: 'border-sky-200 text-sky-700 bg-sky-50',
      cardAccent: 'border-l-4 border-sky-400',
    },
    PhoneScreen: {
      icon: PhoneCall,
      articleClass: 'bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent',
      badgeClass: 'border-indigo-200 text-indigo-700 bg-indigo-50',
      cardAccent: 'border-l-4 border-indigo-400',
    },
    Interview: {
      icon: Mic,
      articleClass: 'bg-gradient-to-br from-fuchsia-500/10 via-transparent to-transparent',
      badgeClass: 'border-fuchsia-200 text-fuchsia-700 bg-fuchsia-50',
      cardAccent: 'border-l-4 border-fuchsia-400',
    },
    Offer: {
      icon: ClipboardCheck,
      articleClass: 'bg-gradient-to-br from-amber-400/15 via-transparent to-transparent',
      badgeClass: 'border-amber-200 text-amber-700 bg-amber-50',
      cardAccent: 'border-l-4 border-amber-400',
    },
    Hired: {
      icon: Trophy,
      articleClass: 'bg-gradient-to-br from-emerald-400/15 via-transparent to-transparent',
      badgeClass: 'border-emerald-200 text-emerald-700 bg-emerald-50',
      cardAccent: 'border-l-4 border-emerald-400',
    },
    Disqualified: {
      icon: Ban,
      articleClass: 'bg-gradient-to-br from-rose-500/10 via-transparent to-transparent',
      badgeClass: 'border-rose-200 text-rose-700 bg-rose-50',
      cardAccent: 'border-l-4 border-rose-400',
    },
  } satisfies Record<PipelineStage, { icon: LucideIcon; articleClass: string; badgeClass: string; cardAccent: string }>;

  const columns = PIPELINE_STAGES.map((stage) => {
    const stageSubmissions = submissions.filter((submission) => {
      const normalized = submission.pipelineStage ?? DEFAULT_PIPELINE_STAGE;
      return normalized === stage;
    });

    return { stage, submissions: stageSubmissions };
  });

  return (
    <main className="flex flex-1 flex-col gap-10 pb-12">
      <header className="flex flex-col gap-4 rounded-xl border bg-card/60 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Pipeline</p>
          <h1 className="text-3xl font-semibold tracking-tight">{form.title}</h1>
          <p className="text-sm text-muted-foreground">
            {submissions.length} aday bu pipeline üzerinde takipte. Sürükle-bırak ilerletme ve otomatik bildirimler yakında.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <Link href={`/forms/manage/${form.id}`}>
              <FileText className="h-4 w-4" aria-hidden />
              Form detayları
            </Link>
          </Button>
          <Button asChild variant="secondary" className="gap-2">
            <Link href={`/applications?form=${form.id}`}>
              <ClipboardList className="h-4 w-4" aria-hidden />
              Başvurular listesi
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/schedule?form=${form.id}`}>
              <CalendarClock className="h-4 w-4" aria-hidden />
              Görüşme planla
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex w-full gap-4 overflow-x-auto pb-2">
        {columns.map(({ stage, submissions: stageSubmissions }) => {
          const meta = stageMeta[stage];
          const Icon = meta.icon;
          return (
          <article
            key={stage}
            className={cn(
              'min-w-[260px] flex-1 rounded-xl border border-border/60 bg-muted/20 p-4 shadow-sm backdrop-blur-sm transition',
              meta.articleClass,
            )}
          >
            <header className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-primary shadow">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {PIPELINE_STAGE_LABELS[stage] ?? stage}
                </CardTitle>
              </div>
              <Badge
                variant={stage === DISQUALIFIED_STAGE ? 'destructive' : 'secondary'}
                className={cn('text-xs uppercase tracking-wide', meta.badgeClass)}
              >
                {stageSubmissions.length}
              </Badge>
            </header>
            <div className="grid gap-3">
              {stageSubmissions.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-muted/30 p-6 text-center text-xs text-muted-foreground">
                  Henüz aday yok.
                </Card>
              ) : (
                stageSubmissions.map((submission) => {
                  const currentStage = submission.pipelineStage ?? DEFAULT_PIPELINE_STAGE;
                  return (
                  <Card
                    key={submission.id}
                    className={cn(
                      'border-border/60 bg-background/85 transition hover:-translate-y-1 hover:shadow-xl',
                      meta.cardAccent,
                      submission.evaluation?.decision === 'YES'
                        ? 'border-primary/70'
                        : submission.evaluation?.decision === 'NO'
                          ? 'border-destructive/60'
                          : '',
                    )}
                  >
                    <CardHeader className="space-y-1 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-foreground">
                          {submission.applicantName}
                        </CardTitle>
                        {submission.evaluation?.overallScore != null && (
                          <Badge variant="outline" className="text-xs">
                            Skor {submission.evaluation.overallScore}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">
                        {submission.applicantEmail ?? 'E-posta paylaşılmadı'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                        <span>
                          {submission.evaluation?.summary
                            ? submission.evaluation.summary.slice(0, 90).trim() +
                              (submission.evaluation.summary.length > 90 ? '…' : '')
                            : 'AI özeti bekleniyor.'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[0.7rem] uppercase tracking-wide">
                        <span>
                          {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString('tr-TR') : 'Tarih yok'}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" aria-hidden />
                          {submission.evaluation?.decision ?? 'MAYBE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <Button asChild variant="link" className="px-0 text-xs">
                          <Link href={`/forms/manage/${form.id}#submission-${submission.id}`}>Detayları aç</Link>
                        </Button>
                        <span className="text-muted-foreground">•</span>
                        <Button asChild variant="link" className="px-0 text-xs">
                          <Link href={`/schedule?form=${form.id}&candidate=${submission.id}`}>Görüşme planla</Link>
                        </Button>
                      </div>
                      <PipelineStageControls
                        submissionId={submission.id}
                        formId={form.id}
                        stage={currentStage}
                      />
                    </CardContent>
                  </Card>
                  );
                })
              )}
            </div>
          </article>
          );
        })}
      </section>
    </main>
  );
}
