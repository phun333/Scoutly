import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { evaluateSubmission } from '~/server/ai/evaluate';
import type { EvaluationSettings } from '~/server/ai/types';
import { ensureStringArray, isJsonObject } from '~/lib/json-guards';
import { adminProcedure, createTRPCRouter, publicProcedure } from '~/server/api/trpc';

const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

function parseEvaluationConfig(config: Prisma.JsonValue | null | undefined): EvaluationSettings | undefined {
  if (!isJsonObject(config)) return undefined;
  const evaluationObject = isJsonObject(config.evaluation) ? config.evaluation : undefined;
  if (!evaluationObject) return undefined;
  return {
    overview: typeof evaluationObject.overview === 'string' ? evaluationObject.overview : undefined,
    mustHaveKeywords: ensureStringArray(evaluationObject.mustHaveKeywords),
    niceToHaveKeywords: ensureStringArray(evaluationObject.niceToHaveKeywords),
    customPrompt: typeof evaluationObject.customPrompt === 'string' ? evaluationObject.customPrompt : undefined,
  } satisfies EvaluationSettings;
}

export const submissionRouter = createTRPCRouter({
  recent: adminProcedure
    .input(z.object({ take: z.number().int().min(1).max(50) }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.prisma.submission.findMany({
        where: { form: { ownerId: ctx.session.user.id } },
        orderBy: { createdAt: 'desc' },
        take: input?.take ?? 12,
        include: {
          form: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          evaluation: true,
        },
      });
    }),
  byForm: adminProcedure
    .input(z.object({ formId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.submission.findMany({
        where: { formId: input.formId },
        orderBy: { createdAt: 'desc' },
        include: {
          evaluation: true,
        },
      });
    }),
  reevaluateAll: adminProcedure
    .input(z.object({ formId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.prisma.form.findFirst({
        where: { id: input.formId, ownerId: ctx.session.user.id },
        include: { submissions: { include: { evaluation: true } } },
      });

      if (!form) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Form bulunamadı.' });
      }

      const evaluationConfig = parseEvaluationConfig(form.config);

      let updatedCount = 0;
      for (const submission of form.submissions) {
        const metadataRecord = isJsonObject(submission.evaluation?.metadata)
          ? submission.evaluation?.metadata
          : undefined;
        const resumeText =
          metadataRecord && typeof metadataRecord.resumeText === 'string' ? metadataRecord.resumeText : undefined;
        const answers = isJsonObject(submission.answers) ? submission.answers : {};
        const evaluation = await evaluateSubmission({
          applicantName: submission.applicantName,
          answers,
          resumeUrl: submission.resumeUrl,
          resumeText,
          formTitle: form.title,
          evaluationSettings: evaluationConfig,
        });
        const metadata = evaluation.metadata as Prisma.InputJsonValue;

        await ctx.prisma.evaluation.upsert({
          where: { submissionId: submission.id },
          create: {
            submissionId: submission.id,
            overallScore: evaluation.overallScore,
            decision: evaluation.decision,
            summary: evaluation.summary,
            strengths: evaluation.strengths,
            risks: evaluation.risks,
            aiModelVersion: 'gemini-v1',
            metadata,
          },
          update: {
            overallScore: evaluation.overallScore,
            decision: evaluation.decision,
            summary: evaluation.summary,
            strengths: evaluation.strengths,
            risks: evaluation.risks,
            aiModelVersion: 'gemini-v1',
            metadata,
          },
        });
        updatedCount += 1;
      }

      return { updatedCount };
    }),
  publicSubmit: publicProcedure
    .input(
      z.object({
        formSlug: z.string().min(2),
        applicantName: z.string().min(2),
        applicantEmail: z.string().email().optional(),
        resumeUrl: z.string().url().optional(),
        resumeFile: z
          .object({
            name: z.string(),
            type: z.string(),
            base64: z.string(),
          })
          .optional(),
        answers: z.record(z.string(), answerValueSchema).default({}),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const form = await ctx.prisma.form.findUnique({
        where: { slug: input.formSlug, status: 'ACTIVE' },
      });

      if (!form) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Form is unavailable.' });
      }

      let resumeText: string | undefined;
      if (input.resumeFile) {
        try {
          const buffer = Buffer.from(input.resumeFile.base64, 'base64');
          const pdfParse = (await import('pdf-parse')).default;
          const parsed = await pdfParse(buffer);
          resumeText = parsed.text;
        } catch (error) {
          console.error('PDF parsing failed', error);
        }
      }

      const submission = await ctx.prisma.submission.create({
        data: {
          formId: form.id,
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          resumeUrl: input.resumeUrl,
          answers: input.answers,
        },
      });

      const evaluationConfig = parseEvaluationConfig(form.config);

      const evaluation = await evaluateSubmission({
        applicantName: input.applicantName,
        answers: input.answers,
        resumeUrl: input.resumeUrl,
        resumeText,
        formTitle: form.title,
        evaluationSettings: evaluationConfig,
      });
      const metadata = evaluation.metadata as Prisma.InputJsonValue;

      await ctx.prisma.evaluation.create({
        data: {
          submissionId: submission.id,
          overallScore: evaluation.overallScore,
          decision: evaluation.decision,
          summary: evaluation.summary,
          strengths: evaluation.strengths,
          risks: evaluation.risks,
          aiModelVersion: 'heuristic-v1',
          metadata,
        },
      });

      return {
        submissionId: submission.id,
        message: 'Başvurun başarıyla alındı.',
      };
    }),
});
