import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { Prisma, type PrismaClient } from '@prisma/client';
import { adminProcedure, createTRPCRouter, publicProcedure } from '~/server/api/trpc';
import { fieldKey, slugify } from '~/lib/slug';

const fieldInputSchema = z.object({
  label: z.string().min(2),
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]*$/).optional(),
  type: z.enum(['text', 'textarea', 'select', 'multiselect', 'url', 'email', 'number', 'markdown']),
  required: z.boolean().default(false),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string().min(1)).optional(),
});

const evaluationSettingsSchema = z.object({
  overview: z.string().max(1500).optional(),
  mustHaveKeywords: z.array(z.string().min(1)).max(30).optional(),
  niceToHaveKeywords: z.array(z.string().min(1)).max(30).optional(),
  customPrompt: z.string().max(2000).optional(),
});

const formInputSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  welcomeMessage: z.string().optional(),
  publish: z.boolean().default(false),
  fields: z.array(fieldInputSchema).min(1),
  evaluation: evaluationSettingsSchema.optional(),
});

const formCreateInputSchema = z.union([formInputSchema, z.object({ json: formInputSchema })]);
const formUpdateInputSchema = z.union([
  formInputSchema.extend({ id: z.string().cuid() }),
  z.object({ json: formInputSchema.extend({ id: z.string().cuid() }) }),
]);

async function generateUniqueSlug(prisma: PrismaClient, base: string) {
  let slug = base;
  let attempt = 1;

  while (true) {
    const existing = await prisma.form.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }

    slug = `${base}-${attempt}`;
    attempt += 1;
  }
}

export const formRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.form.findMany({
      where: { ownerId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });
  }),
  detail: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.form.findFirstOrThrow({
        where: { id: input.id, ownerId: ctx.session.user.id },
        include: {
          fields: {
            orderBy: { orderIndex: 'asc' },
          },
          submissions: {
            orderBy: { createdAt: 'desc' },
            include: {
              evaluation: true,
            },
          },
        },
      });
    }),
  publicBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(2) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.form.findUnique({
        where: { slug: input.slug, status: 'ACTIVE' },
        include: {
          fields: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      });
    }),
  create: adminProcedure
    .input(formCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const payload = 'json' in input ? input.json : input;
      const baseSlug = slugify(payload.title);
      const slug = await generateUniqueSlug(ctx.prisma, baseSlug);

      return ctx.prisma.$transaction(async (trx) => {
        try {
          const form = await trx.form.create({
            data: {
              title: payload.title,
              description: payload.description,
              welcomeMessage: payload.welcomeMessage,
              status: payload.publish ? 'ACTIVE' : 'DRAFT',
              ownerId: ctx.session.user.id,
              slug,
              config: payload.evaluation ? { evaluation: payload.evaluation } : Prisma.JsonNull,
              fields: {
                create: payload.fields.map((field, index) => ({
                  label: field.label,
                  key: field.key ?? fieldKey(field.label),
                  type: field.type,
                  required: field.required,
                  helpText: field.helpText,
                  placeholder: field.placeholder,
                  config: field.options ? { options: field.options } : undefined,
                  orderIndex: index,
                })),
              },
            },
            select: {
              id: true,
              slug: true,
              status: true,
            },
          });

          console.info('form.create succeeded', { formId: form.id, slug: form.slug });
          return form;
        } catch (error) {
          const err = error as Error;
          console.error('form.create prisma error', {
            errorMessage: err.message,
            errorName: err.name,
            errorStack: err.stack,
            input: payload,
          });

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `FORM_CREATE_FAILED: ${err.message}`,
          });
        }
      });
    }),
  update: adminProcedure
    .input(formUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const payload = 'json' in input ? input.json : input;
      return ctx.prisma.$transaction(async (trx) => {
        const { id, fields, evaluation, ...rest } = payload;

        const existing = await trx.form.findFirst({
          where: { id, ownerId: ctx.session.user.id },
        });

        if (!existing) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Form bulunamadı.' });
        }

        const form = await trx.form.update({
          where: { id },
          data: {
            title: rest.title,
            description: rest.description,
            welcomeMessage: rest.welcomeMessage,
            status: rest.publish ? 'ACTIVE' : existing.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
            config: evaluation ? { evaluation } : Prisma.JsonNull,
            fields: {
              deleteMany: {},
              create: fields.map((field, index) => ({
                label: field.label,
                key: field.key ?? fieldKey(field.label),
                type: field.type,
                required: field.required,
                helpText: field.helpText,
                placeholder: field.placeholder,
                config: field.options ? { options: field.options } : undefined,
                orderIndex: index,
              })),
            },
          },
          select: {
            id: true,
            slug: true,
            status: true,
          },
        });

        await trx.submission.updateMany({
          where: { formId: id },
          data: { updatedAt: new Date() },
        });

        return form;
      });
    }),
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.form.update({
        where: { id: input.id, ownerId: ctx.session.user.id },
        data: { status: input.status },
      });
    }),
  delete: adminProcedure
    .input(
      z.union([
        z.object({ id: z.string().cuid() }),
        z.object({ json: z.object({ id: z.string().cuid() }) }),
      ]),
    )
    .mutation(async ({ ctx, input }) => {
      const formId = 'json' in input ? input.json.id : input.id;

      const form = await ctx.prisma.form.findFirst({
        where: { id: formId, ownerId: ctx.session.user.id },
      });

      if (!form) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Form bulunamadı.' });
      }

      await ctx.prisma.form.delete({ where: { id: form.id } });

      return { success: true };
    }),
});
