import { formRouter } from '~/server/api/routers/form';
import { submissionRouter } from '~/server/api/routers/submission';
import { createTRPCRouter } from '~/server/api/trpc';

export const appRouter = createTRPCRouter({
  form: formRouter,
  submission: submissionRouter,
});

export type AppRouter = typeof appRouter;
