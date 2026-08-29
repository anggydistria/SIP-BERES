import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface DashboardSummaryResponse {
  brs: {
    id: number;
    jenisBrs: string;
    bulan: number;
    tahun: number;
  };

  dataUpload: {
    id: number;
    version: number;
    originalName: string;
    rowCount: number;
  };

  indicators: {
    malamKamarTersedia: number;
    malamKamarTerjual: number;
    tamuAsing: number;
    tamuNusantara: number;
    tingkatPenghunianKamar: number;
    rataLamaMenginap: number;
    rataLamaMenginapAsing: number | null;
    rataLamaMenginapNusantara: number | null;
  };
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    bulan: number,
    tahun: number,
  ): Promise<DashboardSummaryResponse> {
    const activeUpload = await this.prisma.dataUpload.findFirst({
      where: {
        status: 'ACTIVE',
        brs: {
          jenisBrs: 'PARIWISATA',
          bulan,
          tahun,
        },
      },
      orderBy: {
        version: 'desc',
      },
      include: {
        brs: true,
      },
    });

    if (!activeUpload) {
      throw new NotFoundException(
        `Data BRS periode ${bulan}/${tahun} belum tersedia`,
      );
    }

    const aggregate = await this.prisma.rawData.aggregate({
      where: {
        dataUploadId: activeUpload.id,
      },
      _sum: {
        mktj: true,
        mkts: true,
        mta: true,
        ta: true,
        mtnus: true,
        tnus: true,
      },
    });

    const mktj = Number(aggregate._sum.mktj ?? 0);
    const mkts = Number(aggregate._sum.mkts ?? 0);
    const mta = Number(aggregate._sum.mta ?? 0);
    const ta = Number(aggregate._sum.ta ?? 0);
    const mtnus = Number(aggregate._sum.mtnus ?? 0);
    const tnus = Number(aggregate._sum.tnus ?? 0);

    const totalMalamTamu = mta + mtnus;
    const totalTamu = ta + tnus;

    return {
      brs: {
        id: activeUpload.brs.id,
        jenisBrs: activeUpload.brs.jenisBrs,
        bulan: activeUpload.brs.bulan,
        tahun: activeUpload.brs.tahun,
      },

      dataUpload: {
        id: activeUpload.id,
        version: activeUpload.version,
        originalName: activeUpload.originalName,
        rowCount: activeUpload.rowCount,
      },

      indicators: {
        malamKamarTersedia: mkts,
        malamKamarTerjual: mktj,
        tamuAsing: ta,
        tamuNusantara: tnus,

        tingkatPenghunianKamar: mkts > 0 ? this.round((mktj / mkts) * 100) : 0,

        rataLamaMenginap:
          totalTamu > 0 ? this.round(totalMalamTamu / totalTamu) : 0,

        rataLamaMenginapAsing: ta > 0 ? this.round(mta / ta) : null,

        rataLamaMenginapNusantara: tnus > 0 ? this.round(mtnus / tnus) : null,
      },
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
