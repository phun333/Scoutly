'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/react';
import {
  DEFAULT_PIPELINE_STAGE,
  DISQUALIFIED_STAGE,
  PIPELINE_STAGE_LABELS,
  type PipelineStage,
  getNextStage,
  getPreviousStage,
} from '~/lib/pipeline';

function useStageMutation(formId: string) {
  const utils = api.useUtils();

  return api.submission.setPipelineStage.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.submission.byFormWithStage.invalidate({ formId }).catch(() => undefined),
        utils.submission.byForm.invalidate({ formId }).catch(() => undefined),
        utils.submission.recent.invalidate().catch(() => undefined),
      ]);
    },
  });
}

type PipelineStageControlsProps = {
  submissionId: string;
  formId: string;
  stage: PipelineStage;
};

export function PipelineStageControls({ submissionId, formId, stage }: PipelineStageControlsProps) {
  const router = useRouter();
  const mutation = useStageMutation(formId);
  const [isRefreshing, startTransition] = useTransition();

  const handleMutation = (payload: Parameters<typeof mutation.mutate>[0]) => {
    mutation.mutate(payload, {
      onSuccess: () => startTransition(() => router.refresh()),
    });
  };

  const isDisqualified = stage === DISQUALIFIED_STAGE;
  const nextStage = getNextStage(stage);
  const previousStage = getPreviousStage(stage);

  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border/60 pt-3 text-xs">
      <span className="text-muted-foreground">
        Aşama: {PIPELINE_STAGE_LABELS[stage] ?? stage}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {previousStage && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={mutation.isPending || isRefreshing}
            onClick={() => handleMutation({ submissionId, stage: previousStage })}
          >
            ‹
          </Button>
        )}
        {!isDisqualified && nextStage && (
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8"
            disabled={mutation.isPending || isRefreshing}
            onClick={() => handleMutation({ submissionId, stage: nextStage })}
          >
            ›
          </Button>
        )}
        {!isDisqualified ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="h-8"
              disabled={mutation.isPending || isRefreshing}
              onClick={() => handleMutation({ submissionId, stage: DISQUALIFIED_STAGE })}
            >
              Elemeye gönder
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-destructive"
              disabled={mutation.isPending || isRefreshing}
              onClick={() => handleMutation({ submissionId, removeFromPipeline: true })}
            >
              Sil
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8"
              disabled={mutation.isPending || isRefreshing}
              onClick={() => handleMutation({ submissionId, stage: DEFAULT_PIPELINE_STAGE })}
            >
              Pipeline&apos;a geri al
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 text-destructive"
              disabled={mutation.isPending || isRefreshing}
              onClick={() => handleMutation({ submissionId, removeFromPipeline: true })}
            >
              Sil
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
