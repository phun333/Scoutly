import type { Decision } from '@prisma/client';
import { evaluateWithGemini } from './evaluate-gemini';
import type { EvaluationSettings } from './types';

type EvaluateSubmissionInput = {
  applicantName: string;
  answers: Record<string, unknown>;
  resumeUrl?: string | null;
  resumeText?: string | null;
  formTitle: string;
  evaluationSettings?: EvaluationSettings;
};

type EvaluationOutput = {
  summary: string;
  strengths: string;
  risks: string;
  overallScore: number;
  decision: Decision;
  metadata: Record<string, unknown>;
};

const KEYWORD_WEIGHTS: Record<string, number> = {
  react: 10,
  next: 10,
  typescript: 8,
  prisma: 6,
  postgres: 5,
  node: 5,
  graphql: 4,
  tailwind: 3,
  ai: 4,
  leadership: 3,
};

function scoreTechnologies(raw: unknown): { score: number; highlights: string[] } {
  if (!raw) return { score: 0, highlights: [] };

  const text = Array.isArray(raw)
    ? raw.join(', ')
    : typeof raw === 'string'
      ? raw
      : '';

  const technologies = text
    .split(/[\n,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  let techScore = 0;
  const highlights: string[] = [];

  for (const tech of technologies) {
    const weight = KEYWORD_WEIGHTS[tech];
    if (weight) {
      techScore += weight;
      highlights.push(tech);
    } else {
      techScore += 1;
    }
  }

  return { score: Math.min(techScore, 45), highlights };
}

function scoreNarrative(raw: unknown): { score: number; strengths: string[]; risks: string[] } {
  const value = typeof raw === 'string' ? raw : '';

  if (!value) {
    return { score: -10, strengths: [], risks: ['Missing motivation statement'] };
  }

  const length = value.length;
  const sentences = value.split(/[.!?]+/).filter((item) => item.trim().length > 5);
  const strengths: string[] = [];
  const risks: string[] = [];

  let score = 0;

  if (length > 200) {
    score += 12;
    strengths.push('Provides detailed motivation');
  }

  if (sentences.length >= 4) {
    score += 10;
    strengths.push('Communicates in complete thoughts');
  }

  if (value.toLowerCase().includes('team')) {
    strengths.push('Mentions collaborative work');
    score += 4;
  }

  if (value.toLowerCase().includes('learning')) {
    strengths.push('Highlights growth mindset');
    score += 3;
  }

  if (length < 80) {
    score -= 8;
    risks.push('Response is too short');
  }

  return { score, strengths, risks };
}

function scoreExperience(raw: unknown): { score: number; strengths: string[]; risks: string[] } {
  const result = { score: 0, strengths: [] as string[], risks: [] as string[] };

  if (typeof raw === 'number') {
    if (raw >= 5) {
      result.score += 12;
      result.strengths.push('5+ years of hands-on experience');
    } else if (raw >= 2) {
      result.score += 8;
    } else {
      result.risks.push('Limited commercial experience');
      result.score -= 5;
    }
  }

  return result;
}

export async function evaluateSubmission(data: EvaluateSubmissionInput): Promise<EvaluationOutput> {
  try {
    const aiResult = await evaluateWithGemini({
      formTitle: data.formTitle,
      evaluation: data.evaluationSettings,
      answers: data.answers,
      resumeUrl: data.resumeUrl,
      resumeText: data.resumeText,
    });

    const decision: Decision = aiResult.score >= 75 ? 'YES' : aiResult.score >= 55 ? 'MAYBE' : 'NO';

    return {
      overallScore: aiResult.score,
      decision,
      summary: aiResult.summary,
      strengths: aiResult.strengths.join('; '),
      risks: aiResult.risks.join('; '),
      metadata: aiResult.metadata,
    };
  } catch (error) {
    console.error('Gemini evaluation unavailable, using fallback heuristics.', error);
  }

  const techSignals = scoreTechnologies(data.answers.technologies ?? data.answers.techStack);
  const narrativeSignals = scoreNarrative(data.answers.motivation ?? data.answers.about);
  const experienceSignals = scoreExperience(data.answers.yearsExperience);

  let overallScore = 50 + techSignals.score + narrativeSignals.score + experienceSignals.score;
  overallScore = Math.max(0, Math.min(overallScore, 95));

  let decision: Decision = 'MAYBE';
  if (overallScore >= 75) {
    decision = 'YES';
  } else if (overallScore <= 45) {
    decision = 'NO';
  }

  const strengths = [
    ...new Set([...techSignals.highlights.map((item) => `${item} expertise`), ...narrativeSignals.strengths, ...experienceSignals.strengths]),
  ];

  const risks = [...new Set([...narrativeSignals.risks, ...experienceSignals.risks])];

  const summary = `${data.applicantName} is evaluated for ${data.formTitle} with a score of ${overallScore}. ` +
    (decision === 'YES'
      ? 'Strong technical alignment and communication depth make this applicant worth advancing.'
      : decision === 'MAYBE'
        ? 'Signals are promising but require manual review to confirm fit.'
        : 'Key competency gaps were detected; review the risks before moving forward.');

  return {
    overallScore,
    decision,
    summary,
    strengths: strengths.length ? strengths.join('; ') : 'No clear standout strengths detected yet.',
    risks: risks.length ? risks.join('; ') : 'No immediate risks detected.',
    metadata: {
      highlights: techSignals.highlights,
      narrativeSentences: narrativeSignals.strengths.length,
      resumeIncluded: Boolean(data.resumeUrl ?? data.resumeText),
      resumeAnalyzed: Boolean(data.resumeText),
      resumeTextPreview: data.resumeText ? data.resumeText.slice(0, 500) : undefined,
      resumeText: data.resumeText ?? undefined,
      notes: 'Fallback heuristics kullanıldı.',
    },
  };
}
