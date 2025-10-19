export type EvaluationSettings = {
  overview?: string;
  mustHaveKeywords?: string[];
  niceToHaveKeywords?: string[];
  customPrompt?: string;
};

export type EvaluationMetadata = {
  keywordMatches?: Array<{
    keyword: string;
    matched: boolean;
    source: 'answers' | 'resume' | 'both';
  }>;
  resumeAnalyzed?: boolean;
  resumeUrl?: string | null;
  resumeTextPreview?: string;
  resumeText?: string;
  notes?: string;
};
