export const PIPELINE_STAGES = ['Applied', 'PhoneScreen', 'Interview', 'Offer', 'Hired', 'Disqualified'] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const DEFAULT_PIPELINE_STAGE: PipelineStage = PIPELINE_STAGES[0];
export const DISQUALIFIED_STAGE: PipelineStage = PIPELINE_STAGES[PIPELINE_STAGES.length - 1]!;

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  Applied: 'Başvuru',
  PhoneScreen: 'Telefon Görüşmesi',
  Interview: 'Mülakat',
  Offer: 'Teklif',
  Hired: 'Kabul edildi',
  Disqualified: 'Elenenler',
};

export function isValidPipelineStage(value: string): value is PipelineStage {
  return PIPELINE_STAGES.includes(value as PipelineStage);
}

export function normalizePipelineStage(value: unknown): PipelineStage {
  if (typeof value !== 'string') {
    return DEFAULT_PIPELINE_STAGE;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return DEFAULT_PIPELINE_STAGE;
  }

  const exactMatch = PIPELINE_STAGES.find((stage) => stage.toLowerCase() === trimmed.toLowerCase());
  return exactMatch ?? DEFAULT_PIPELINE_STAGE;
}

export function getStageLabel(stage: PipelineStage): string {
  return PIPELINE_STAGE_LABELS[stage] ?? stage;
}

export function getNextStage(stage: PipelineStage): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(stage);
  if (index === -1) {
    return DEFAULT_PIPELINE_STAGE;
  }

  const nextStage = PIPELINE_STAGES[index + 1] ?? null;
  if (!nextStage || nextStage === DISQUALIFIED_STAGE) {
    return null;
  }
  return nextStage;
}

export function getPreviousStage(stage: PipelineStage): PipelineStage | null {
  const index = PIPELINE_STAGES.indexOf(stage);
  if (index <= 0) {
    return null;
  }

  const previousStage = PIPELINE_STAGES[index - 1] ?? null;
  if (!previousStage || previousStage === DISQUALIFIED_STAGE) {
    return null;
  }
  return previousStage;
}
