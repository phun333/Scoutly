import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function resolveAdminEmail() {
  if (process.env.SEED_ADMIN_EMAIL) {
    return process.env.SEED_ADMIN_EMAIL.trim();
  }

  const adminEmails = process.env.ADMIN_EMAILS
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (adminEmails && adminEmails.length > 0) {
    return adminEmails[0];
  }

  throw new Error('No admin email configured. Set SEED_ADMIN_EMAIL or include at least one address in ADMIN_EMAILS.');
}

async function main() {
  const email = resolveAdminEmail();
  const accessCode = process.env.ADMIN_ACCESS_CODE;

  if (!accessCode) {
    throw new Error('ADMIN_ACCESS_CODE must be set in the environment before seeding an admin user.');
  }

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      emailVerified: new Date(),
    },
    create: {
      email,
      name: 'Scoutly Admin',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin ensured:', admin.email);
  console.log('ℹ️  Ensure this email is listed in ADMIN_EMAILS so Auth.js allows sign-in. Access code is sourced from ADMIN_ACCESS_CODE.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
