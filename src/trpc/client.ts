import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '~/server/api/root';

export function getClient(baseUrl: string) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
}
