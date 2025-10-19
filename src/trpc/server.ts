import { appRouter } from '~/server/api/root';
import { createTRPCContext } from '~/server/api/trpc';

export const createServerCaller = async () => {
  const ctx = await createTRPCContext();
  return appRouter.createCaller(ctx);
};
