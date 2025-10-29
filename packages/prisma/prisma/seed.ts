import { PrismaClient } from '@prestaya/prisma';

const prisma = new PrismaClient();

async function main() {
  const organisationId = process.env.SEED_ORG_ID ?? 'org-123';
  const organisationName = process.env.SEED_ORG_NAME ?? 'PrestaYa Demo';

  const ownerUserId = process.env.SEED_USER_ID ?? 'mock-user';
  const ownerEmail = process.env.SEED_USER_EMAIL ?? 'owner@prestaya.io';

  await prisma.organisation.upsert({
    where: { id: organisationId },
    update: {
      name: organisationName,
    },
    create: {
      id: organisationId,
      name: organisationName,
      timezone: 'America/Buenos_Aires',
    },
  });

  await prisma.user.upsert({
    where: { id: ownerUserId },
    update: {
      email: ownerEmail,
    },
    create: {
      id: ownerUserId,
      email: ownerEmail,
    },
  });

  await prisma.userOrganisation.upsert({
    where: {
      userId_organisationId: {
        userId: ownerUserId,
        organisationId,
      },
    },
    update: {
      role: 'owner',
    },
    create: {
      userId: ownerUserId,
      organisationId,
      role: 'owner',
    },
  });
}

main()
  .then(() => {
    console.log('Seed data applied');
  })
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
