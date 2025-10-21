import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GenerationConfig } from '@google/generative-ai';
import { env } from '~/env';
import { extractPdfTextFromUrl } from './pdf-utils';
import type { EvaluationMetadata, EvaluationSettings } from './types';

type ParsedKeywordMatch = {
  keyword: string;
  matched: boolean;
  source: 'answers' | 'resume' | 'both';
};

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 ? [value.trim()] : [];
  }
  return [];
}

function normalizeKeywordMatches(value: unknown): ParsedKeywordMatch[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const normalized: ParsedKeywordMatch[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const keyword = typeof (entry as { keyword?: unknown }).keyword === 'string' ? (entry as { keyword: string }).keyword.trim() : '';
    if (!keyword) continue;
    const rawSource = (entry as { source?: unknown }).source;
    const source = rawSource === 'resume' || rawSource === 'both' ? rawSource : 'answers';
    const matchedValue = (entry as { matched?: unknown }).matched;
    const matched = typeof matchedValue === 'boolean' ? matchedValue : String(matchedValue).toLowerCase() === 'true';
    normalized.push({ keyword, matched, source });
  }
  return normalized.length > 0 ? normalized : undefined;
}

type ExtendedGenerationConfig = GenerationConfig & {
  responseMimeType?: string;
};

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

function extractJsonPayload(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('Empty response returned by Gemini model.');
  }

  if (trimmed.startsWith('```')) {
    const codeFenceMatch = /```(?:json)?([\s\S]*?)```/i.exec(trimmed);
    if (codeFenceMatch?.[1]) {
      return extractJsonPayload(codeFenceMatch[1]);
    }
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
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
    const resumeResult = await extractPdfTextFromUrl(params.resumeUrl);
    metadata.resumeAnalyzed = resumeResult.success;
    resumeText = resumeResult.text;
    console.info('evaluateWithGemini: resume fetch from URL', {
      resumeUrl: params.resumeUrl,
      success: resumeResult.success,
      textLength: resumeResult.text.length,
    });
  }

  let rawGeminiResponse: string | undefined;

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const prompt = buildPrompt({
      formTitle: params.formTitle,
      evaluation: params.evaluation,
      answers: params.answers,
      resumeText,
    });
    console.info('evaluateWithGemini: invoking Gemini', {
      hasResumeText: Boolean(resumeText && resumeText.trim().length > 0),
      resumeTextLength: resumeText?.length ?? 0,
      answersKeys: Object.keys(params.answers ?? {}),
    });

    const generationConfig: ExtendedGenerationConfig = {
      responseMimeType: 'application/json',
    };

    const modelsToTry = env.GEMINI_MODEL
      ? [env.GEMINI_MODEL]
      : ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'];

    metadata.aiModelAttempts = modelsToTry;

    const failureNotes: string[] = [];

    for (const modelName of modelsToTry) {
      rawGeminiResponse = undefined;

      try {
        const model = client.getGenerativeModel({ model: modelName });
        const response = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        });

        rawGeminiResponse = response.response.text();
        const jsonPayload = extractJsonPayload(rawGeminiResponse);
        const parsedJson = JSON.parse(jsonPayload) as Record<string, unknown>;

        const rawScore = parsedJson.score;
        const score = Number(rawScore);
        if (!Number.isFinite(score)) {
          throw new Error('Gemini yanıtında geçerli bir skor bulunamadı.');
        }

        const rawSummary = parsedJson.summary;
        if (typeof rawSummary !== 'string' || rawSummary.trim().length === 0) {
          throw new Error('Gemini yanıtında summary alanı bulunamadı.');
        }

        const strengths = toStringArray(parsedJson.strengths);
        const risks = toStringArray(parsedJson.risks);
        const keywordMatches = normalizeKeywordMatches(parsedJson.keywordMatches);

        metadata.modelUsed = modelName;
        metadata.keywordMatches = keywordMatches;
        metadata.resumeAnalyzed = metadata.resumeAnalyzed ?? Boolean(resumeText);
        metadata.resumeTextPreview = resumeText ? resumeText.slice(0, 500) : undefined;
        metadata.resumeText = resumeText;
        console.info('evaluateWithGemini: model succeeded', {
          modelName,
          score,
          strengthsCount: strengths.length,
          risksCount: risks.length,
          resumeTextIncluded: Boolean(resumeText),
        });
        if (failureNotes.length > 0) {
          metadata.notes = `Önceki denemeler: ${failureNotes.join(' | ')}`;
        } else {
          delete metadata.notes;
        }
        delete metadata.rawResponsePreview;

        return {
          score: Math.round(score),
          summary: rawSummary.trim(),
          strengths,
          risks,
          metadata,
        };
      } catch (modelError) {
        const message = modelError instanceof Error ? modelError.message : 'Bilinmeyen hata';
        console.error('Gemini model attempt failed', modelName, message);
        failureNotes.push(`model=${modelName} -> ${message}`);
        metadata.modelUsed = modelName;
        metadata.notes = `Gemini modeli ${modelName} başarısız: ${message}`;
        if (rawGeminiResponse) {
          metadata.rawResponsePreview = rawGeminiResponse.slice(0, 500);
        }
        rawGeminiResponse = undefined;
        continue;
      }
    }

    const aggregatedMessage = failureNotes.length > 0 ? failureNotes.join(' | ') : 'Gemini modeli başarısız oldu.';
    throw new Error(aggregatedMessage);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    const errorCause = error instanceof Error && error.cause ? error.cause : undefined;
    console.error('Gemini evaluation failed', errorMessage, errorCause);
    metadata.notes = metadata.notes
      ? `${metadata.notes} | Genel hata: ${errorMessage}`
      : `Gemini isteği başarısız: ${errorMessage}`;
    if (rawGeminiResponse) {
      metadata.rawResponsePreview = rawGeminiResponse.slice(0, 500);
    }
    return {
      score: 55,
      summary:
        'AI değerlendirmesi gerçekleştirilemedi. Başvuru, belirlenen anahtar kelimelere göre manuel değerlendirme gerektiriyor.',
      strengths: [],
      risks: ['AI değerlendirmesi başarısız oldu.'],
      metadata: { ...metadata },
    };
  }
}
