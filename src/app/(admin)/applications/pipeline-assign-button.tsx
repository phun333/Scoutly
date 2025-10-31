'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { api } from '~/trpc/react';
import { DEFAULT_PIPELINE_STAGE, PIPELINE_STAGE_LABELS, type PipelineStage } from '~/lib/pipeline';

type PipelineAssignButtonProps = {
  submissionId: string;
  formId: string;
  currentStage: PipelineStage | null;
};

export function PipelineAssignButton({ submissionId, formId, currentStage }: PipelineAssignButtonProps) {
  const [stage, setStage] = useState<PipelineStage | null>(currentStage);
  const utils = api.useUtils();

  const mutation = api.submission.setPipelineStage.useMutation({
    onSuccess: async ({ pipelineStage }) => {
      const nextStage: PipelineStage | null = pipelineStage ?? null;
      setStage(nextStage);
      await Promise.all([
        utils.submission.byFormWithStage.invalidate({ formId }).catch(() => undefined),
        utils.submission.byForm.invalidate({ formId }).catch(() => undefined),
        utils.submission.recent.invalidate().catch(() => undefined),
      ]);
    },
  });

  if (stage) {
    return (
      <Badge variant="outline" className="text-xs uppercase tracking-wide text-primary">
        Pipeline: {PIPELINE_STAGE_LABELS[stage] ?? stage}
      </Badge>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 rounded-full"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate({ submissionId, stage: DEFAULT_PIPELINE_STAGE })}
    >
      {mutation.isPending ? 'Ekleniyor…' : "Pipeline'a ekle"}
    </Button>
  );
}
