import type { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
  }
}
