import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';

import { hash } from 'bcryptjs';

import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL belum tersedia di file .env');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const DEVELOPMENT_PASSWORD = 'Siberes123!';

const USERS = [
  {
    name: 'Administrator SIBERES',
    username: 'admin',
    role: 'ADMIN',
  },

  {
    name: 'Ketua BRS Pariwisata',
    username: 'ketua.brs',
    role: 'KETUA_BRS',
  },

  {
    name: 'Petugas Pengelola',
    username: 'pengelola',
    role: 'PENGELOLA',
  },
];

async function main() {
  console.log('Memulai pembuatan akun SIBERES...');

  const passwordHash = await hash(DEVELOPMENT_PASSWORD, 12);

  for (const account of USERS) {
    const role = await prisma.role.upsert({
      where: {
        name: account.role,
      },

      update: {},

      create: {
        name: account.role,
      },
    });

    const user = await prisma.user.upsert({
      where: {
        username: account.username,
      },

      update: {
        name: account.name,
        passwordHash,
        isActive: true,
      },

      create: {
        name: account.name,
        username: account.username,
        passwordHash,
        isActive: true,
      },
    });

    const activeUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: role.id,
        endedAt: null,
      },
    });

    if (!activeUserRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }

    console.log(
      `Akun ${account.username} dengan role ${account.role} siap digunakan.`,
    );
  }

  console.log('');
  console.log('Akun development:');

  console.log(`admin / ${DEVELOPMENT_PASSWORD}`);

  console.log(`ketua.brs / ${DEVELOPMENT_PASSWORD}`);

  console.log(`pengelola / ${DEVELOPMENT_PASSWORD}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed akun gagal:', error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
