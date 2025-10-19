import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Session } from 'next-auth';
import { auth } from '~/server/auth';
import { prisma } from '~/server/db/client';

export type Context = {
  session: Session | null;
  prisma: typeof prisma;
};

export const createTRPCContext = async (): Promise<Context> => {
  const session = await auth();
  return { session, prisma };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  return next({
    ctx: {
      session: ctx.session,
      prisma: ctx.prisma,
    },
  });
});

const enforceAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.session?.user.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return next();
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const adminProcedure = protectedProcedure.use(enforceAdmin);
