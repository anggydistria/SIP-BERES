import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error('DIRECT_URL atau DATABASE_URL belum tersedia di file .env');
}

if (!connectionString) {
  throw new Error('DATABASE_URL belum tersedia di file .env');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * Faktor sengaja dibuat berbeda setiap bulan
 * supaya TPK, RLMT, MtM, dan YoY memiliki variasi.
 */
const PERIOD_FACTORS = [
  { sold: 0.88, available: 1.02, guestNight: 0.91, guest: 0.98 },
  { sold: 0.94, available: 1.01, guestNight: 0.96, guest: 0.99 },
  { sold: 1.04, available: 1.03, guestNight: 1.05, guest: 1.01 },
  { sold: 0.91, available: 0.98, guestNight: 0.94, guest: 0.97 },
  { sold: 1.08, available: 1.04, guestNight: 1.07, guest: 1.02 },
  { sold: 1.12, available: 1.05, guestNight: 1.11, guest: 1.04 },
  { sold: 0.97, available: 1.01, guestNight: 0.98, guest: 1.0 },
  { sold: 1.15, available: 1.06, guestNight: 1.13, guest: 1.05 },
  { sold: 1.09, available: 1.03, guestNight: 1.08, guest: 1.02 },
  { sold: 0.95, available: 1.0, guestNight: 0.97, guest: 0.99 },
  { sold: 1.06, available: 1.02, guestNight: 1.04, guest: 1.01 },
  { sold: 0.92, available: 0.99, guestNight: 0.95, guest: 0.98 },
];

function shiftPeriod(bulan: number, tahun: number, offset: number) {
  const date = new Date(Date.UTC(tahun, bulan - 1 + offset, 1));

  return {
    bulan: date.getUTCMonth() + 1,
    tahun: date.getUTCFullYear(),
  };
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function scale(value: unknown, factor: number): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  /*
   * Nilai nol tetap nol. Ini penting supaya data tamu
   * asing yang memang tidak tersedia tidak dibuat-buat.
   */
  if (numericValue === 0) {
    return 0;
  }

  return round(numericValue * factor);
}

async function main() {
  console.log('Memulai pembuatan data dummy riwayat BRS...');

  /*
   * Februari 2026 adalah data asli yang sudah diunggah.
   * Data tersebut dipakai sebagai dasar pembuatan dummy.
   */
  const sourceBrs = await prisma.brs.findUnique({
    where: {
      jenisBrs_bulan_tahun: {
        jenisBrs: 'PARIWISATA',
        bulan: 2,
        tahun: 2026,
      },
    },

    include: {
      dataUploads: {
        where: {
          status: 'ACTIVE',
        },

        orderBy: {
          version: 'desc',
        },

        take: 1,

        include: {
          rawData: true,
        },
      },
    },
  });

  const sourceUpload = sourceBrs?.dataUploads[0];

  if (!sourceBrs || !sourceUpload) {
    throw new Error(
      'Data aktif Februari 2026 belum ditemukan. Upload Excel Februari 2026 terlebih dahulu.',
    );
  }

  if (sourceUpload.rawData.length === 0) {
    throw new Error('Raw data Februari 2026 masih kosong.');
  }

  const developmentUser = await prisma.user.upsert({
    where: {
      username: 'system-development',
    },

    update: {
      isActive: true,
    },

    create: {
      name: 'System Development',
      username: 'system-development',
      passwordHash: null,
      isActive: true,
    },
  });

  /*
   * Offset -12 sampai -1 menghasilkan:
   * Februari 2025 sampai Januari 2026.
   */
  const periods = Array.from(
    {
      length: 12,
    },

    (_, index) => {
      const offset = index - 12;

      return {
        ...shiftPeriod(2, 2026, offset),
        factor: PERIOD_FACTORS[index],
      };
    },
  );

  let created = 0;
  let skipped = 0;

  for (const period of periods) {
    const periodLabel = `${period.tahun}-${String(period.bulan).padStart(2, '0')}`;

    const brs = await prisma.brs.upsert({
      where: {
        jenisBrs_bulan_tahun: {
          jenisBrs: 'PARIWISATA',
          bulan: period.bulan,
          tahun: period.tahun,
        },
      },

      update: {},

      create: {
        jenisBrs: 'PARIWISATA',
        bulan: period.bulan,
        tahun: period.tahun,
        status: 'DRAFT',
      },
    });

    /*
     * Jangan menimpa periode yang sudah mempunyai
     * upload aktif, baik data asli maupun dummy.
     */
    const activeUpload = await prisma.dataUpload.findFirst({
      where: {
        brsId: brs.id,
        status: 'ACTIVE',
      },
    });

    if (activeUpload) {
      console.log(`Lewati ${periodLabel}: sudah mempunyai upload aktif.`);

      skipped += 1;
      continue;
    }

    const latestUpload = await prisma.dataUpload.findFirst({
      where: {
        brsId: brs.id,
      },

      orderBy: {
        version: 'desc',
      },
    });

    const version = (latestUpload?.version ?? 0) + 1;

    await prisma.dataUpload.create({
      data: {
        brsId: brs.id,
        uploadedById: developmentUser.id,

        originalName: `TEST-DUMMY-${periodLabel}.xlsx`,
        storedName: `TEST-DUMMY-${periodLabel}.xlsx`,
        path: `test-dummy/TEST-DUMMY-${periodLabel}.xlsx`,

        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

        size: 0,
        sheetName: 'KabKot_KeLas64',
        rowCount: sourceUpload.rawData.length,

        version,
        status: 'ACTIVE',
        errorMessage: null,
        processedAt: new Date(),

        rawData: {
          create: sourceUpload.rawData.map((row) => ({
            sourceRow: row.sourceRow,

            jenisAkomodasi: row.jenisAkomodasi,

            kelasAkomodasi: row.kelasAkomodasi,

            mktj: scale(row.mktj, period.factor.sold),

            mkts: scale(row.mkts, period.factor.available),

            mta: scale(row.mta, period.factor.guestNight),

            ta: scale(row.ta, period.factor.guest),

            mtnus: scale(row.mtnus, period.factor.guestNight),

            tnus: scale(row.tnus, period.factor.guest),
          })),
        },
      },
    });

    console.log(`Berhasil membuat ${periodLabel}`);

    created += 1;
  }

  console.log('');
  console.log('Seed riwayat BRS selesai.');
  console.log(`Periode dibuat : ${created}`);
  console.log(`Periode dilewati: ${skipped}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed gagal:', error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
