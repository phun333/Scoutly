import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerationConfig } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '~/env';
import type { EvaluationMetadata, EvaluationSettings } from './types';

const ResponseSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  keywordMatches: z
    .array(
      z.object({
        keyword: z.string(),
        matched: z.boolean(),
        source: z.enum(['answers', 'resume', 'both']).default('answers'),
      }),
    )
    .optional(),
});

type ExtendedGenerationConfig = GenerationConfig & {
  responseMimeType?: string;
};

async function extractPdfText(url: string): Promise<{ text: string; success: boolean }> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { text: '', success: false };
    }
    const arrayBuffer = await response.arrayBuffer();
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(Buffer.from(arrayBuffer));
    return { text: result.text, success: true };
  } catch (error) {
    console.error('Failed to extract PDF text', error);
    return { text: '', success: false };
  }
}

function buildPrompt(opts: {
  formTitle: string;
  evaluation: EvaluationSettings | undefined;
  answers: Record<string, unknown>;
  resumeText?: string;
}): string {
  const { formTitle, evaluation, answers, resumeText } = opts;
  const mustHave = evaluation?.mustHaveKeywords?.join(', ') ?? 'Belirtilmedi';
  const niceToHave = evaluation?.niceToHaveKeywords?.join(', ') ?? 'Belirtilmedi';
  const overview = evaluation?.overview ?? 'Açıklama girilmemiş.';
  const customPrompt = evaluation?.customPrompt
    ? `Form sahibi ayrıca şu talimatı verdi: ${evaluation.customPrompt}`
    : '';

  const answersText = JSON.stringify(answers, null, 2);
  const resumeSection = resumeText
    ? `Adayın özgeçmişinden alınan metin:
${resumeText.slice(0, 6000)}
(Özgeçmiş daha uzunsa özetle)`
    : 'Aday özgeçmiş yüklemedi veya içerik okunamadı.';

  return `Sen bir teknik değerlendirme uzmanısın. Aşağıdaki bilgileri incele ve yalnızca JSON formatında yanıt ver.

Pozisyon: ${formTitle}
Genel beklenti: ${overview}
Zorunlu anahtar kelimeler: ${mustHave}
Olması tercih edilen anahtar kelimeler: ${niceToHave}
${customPrompt}

Adayın form yanıtları:
${answersText}

${resumeSection}

Yanıt formatı:
{
  "score": number (0-100),
  "summary": string,
  "strengths": string[],
  "risks": string[],
  "keywordMatches": [{ "keyword": string, "matched": boolean, "source": "answers"|"resume"|"both" }]
}

score alanı zorunlu, 0 ile 100 arasında olmalı. summary kısa ve net olmalı.`;
}

export async function evaluateWithGemini(params: {
  formTitle: string;
  evaluation: EvaluationSettings | undefined;
  answers: Record<string, unknown>;
  resumeUrl?: string | null;
  resumeText?: string | null;
}): Promise<{
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  metadata: EvaluationMetadata;
}> {
  const apiKey = env.GEMINI_API_KEY;
  const metadata: EvaluationMetadata = {
    resumeUrl: params.resumeUrl ?? null,
  };

  if (!apiKey) {
    return {
      score: 60,
      summary: 'Gemini API anahtarı tanımlı değil; varsayılan değerlendirme uygulandı.',
      strengths: [],
      risks: ['AI değerlendirmesi yapılamadı.'],
      metadata: { ...metadata, notes: 'Gemini API anahtarı eksik.' },
    };
  }

  let resumeText = params.resumeText ?? undefined;
  if (!resumeText && params.resumeUrl) {
    const resumeResult = await extractPdfText(params.resumeUrl);
    metadata.resumeAnalyzed = resumeResult.success;
    resumeText = resumeResult.text;
  }

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const prompt = buildPrompt({
      formTitle: params.formTitle,
      evaluation: params.evaluation,
      answers: params.answers,
      resumeText,
    });

    const generationConfig: ExtendedGenerationConfig = {
      responseMimeType: 'application/json',
    };

    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const text = response.response.text();
    const parsed = ResponseSchema.parse(JSON.parse(text));
    metadata.keywordMatches = parsed.keywordMatches;
    metadata.resumeAnalyzed = metadata.resumeAnalyzed ?? Boolean(resumeText);
    metadata.resumeTextPreview = resumeText ? resumeText.slice(0, 500) : undefined;
    metadata.resumeText = resumeText;

    const score = Math.round(parsed.score);
    return {
      score,
      summary: parsed.summary,
      strengths: parsed.strengths ?? [],
      risks: parsed.risks ?? [],
      metadata,
    };
  } catch (error) {
    console.error('Gemini evaluation failed', error);
    return {
      score: 55,
      summary:
        'AI değerlendirmesi gerçekleştirilemedi. Başvuru, belirlenen anahtar kelimelere göre manuel değerlendirme gerektiriyor.',
      strengths: [],
      risks: ['AI değerlendirmesi başarısız oldu.'],
      metadata: { ...metadata, notes: 'Gemini isteği başarısız.' },
    };
  }
}
