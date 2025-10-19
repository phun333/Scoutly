import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import { prisma } from '~/server/db/client';
import { env } from '~/env';

const adminEmails = env.ADMIN_EMAILS ?? [];

const credentials = Credentials({
  name: 'Admin Access',
  credentials: {
    email: { label: 'Email', type: 'email', placeholder: 'talent-lead@company.com' },
    accessCode: { label: 'Access Code', type: 'password' },
  },
  async authorize(credentials) {
    const emailValue = credentials?.email;
    const accessCodeValue = credentials?.accessCode;
    const email = typeof emailValue === 'string' ? emailValue.toLowerCase() : undefined;
    const accessCode = typeof accessCodeValue === 'string' ? accessCodeValue : undefined;

    if (!email || !accessCode) {
      return null;
    }

    if (adminEmails.length > 0 && !adminEmails.includes(email)) {
      return null;
    }

    if (env.ADMIN_ACCESS_CODE && env.ADMIN_ACCESS_CODE !== accessCode) {
      return null;
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        emailVerified: new Date(),
        role: 'ADMIN',
      },
      create: {
        email,
        emailVerified: new Date(),
        role: 'ADMIN',
      },
    });

    return user;
  },
});

const providers: NextAuthConfig['providers'] = [credentials];

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        const email = profile.email?.toLowerCase();
        const isAllowed = !adminEmails.length || (email ? adminEmails.includes(email) : false);

        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: email ?? profile.login,
          image: profile.avatar_url,
          role: isAllowed ? 'ADMIN' : 'REVIEWER',
        };
      },
    }),
  );
}

const prismaAdapter = PrismaAdapter(prisma) as unknown as NextAuthConfig['adapter'];

const authConfig = {
  adapter: prismaAdapter,
  session: {
    strategy: 'jwt',
  },
  providers,
  secret: env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        if (typeof token.role === 'string') {
          session.user.role = token.role as typeof session.user.role;
        }
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      if (adminEmails.length === 0) {
        return true;
      }

      const email = user.email.toLowerCase();

      return adminEmails.includes(email);
    },
  },
} satisfies NextAuthConfig;

const authResponse = NextAuth(authConfig);

export const { signIn, signOut, auth } = authResponse;
export const handlers = authResponse.handlers;
export const GET = handlers.GET;
export const POST = handlers.POST;
