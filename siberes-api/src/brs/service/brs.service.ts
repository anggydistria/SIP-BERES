import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';


import { CreateBrsDto } from '../dto/create-brs.dto';
import { UpdateBrsDto } from '../dto/update-brs.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FindBrsQueryDto } from '../dto/find-brs-query.dto';

@Injectable()
export class BrsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBrsDto) {
    const jenisBrs = dto.jenisBrs ?? 'PARIWISATA';

    const existingBrs = await this.prisma.brs.findUnique({
      where: {
        jenisBrs_bulan_tahun: {
          jenisBrs,
          bulan: dto.bulan,
          tahun: dto.tahun,
        },
      },
    });

    if (existingBrs) {
      throw new ConflictException(
        `BRS ${jenisBrs} periode ${dto.bulan}/${dto.tahun} sudah tersedia`,
      );
    }

    return this.prisma.brs.create({
      data: {
        jenisBrs,
        bulan: dto.bulan,
        tahun: dto.tahun,
        nomorBrs: dto.nomorBrs,
        tanggalPublikasi: dto.tanggalPublikasi
          ? new Date(dto.tanggalPublikasi)
          : null,
      },
    });
  }

  async findAll(query: FindBrsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where = {
      jenisBrs: 'PARIWISATA',

      ...(query.bulan !== undefined && {
        bulan: query.bulan,
      }),

      ...(query.tahun !== undefined && {
        tahun: query.tahun,
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.brs.findMany({
        where,

        orderBy: [
          {
            tahun: 'desc',
          },
          {
            bulan: 'desc',
          },
        ],

        skip: (page - 1) * limit,
        take: limit,
      }),

      this.prisma.brs.count({
        where,
      }),
    ]);

    return {
      data,

      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findOne(id: number) {
    const brs = await this.prisma.brs.findUnique({
      where: {
        id,
      },

      include: {
        /*
         * Hanya mengambil Excel aktif.
         */
        dataUploads: {
          where: {
            status: 'ACTIVE',
          },

          take: 1,

          select: {
            id: true,
            originalName: true,
            version: true,
            rowCount: true,
            size: true,
            uploadedAt: true,
            processedAt: true,
          },
        },

        /*
         * Calon PDF yang sedang direview.
         */
        finalSubmission: {
          select: {
            id: true,
            originalName: true,
            size: true,
            proposedNomorBrs: true,
            proposedTanggalPublikasi: true,
            version: true,
            submittedAt: true,

            submittedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },

        /*
         * Seluruh riwayat approve dan reject.
         */
        reviewHistories: {
          orderBy: {
            reviewedAt: 'desc',
          },

          select: {
            id: true,
            submissionVersion: true,
            originalName: true,
            proposedNomorBrs: true,
            proposedTanggalPublikasi: true,
            decision: true,
            note: true,
            submittedAt: true,
            reviewedAt: true,

            submittedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },

            reviewedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },

        /*
         * PDF final yang sudah disetujui.
         */
        finalFile: {
          select: {
            id: true,
            originalName: true,
            size: true,
            approvedAt: true,

            approvedBy: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!brs) {
      throw new NotFoundException('BRS tidak ditemukan');
    }

    return brs;
  }

  async update(id: number, dto: UpdateBrsDto) {
    await this.findOne(id);

    return this.prisma.brs.update({
      where: { id },
      data: {
        ...(dto.jenisBrs !== undefined && {
          jenisBrs: dto.jenisBrs,
        }),
        ...(dto.bulan !== undefined && {
          bulan: dto.bulan,
        }),
        ...(dto.tahun !== undefined && {
          tahun: dto.tahun,
        }),
        ...(dto.nomorBrs !== undefined && {
          nomorBrs: dto.nomorBrs,
        }),
        ...(dto.tanggalPublikasi !== undefined && {
          tanggalPublikasi: dto.tanggalPublikasi
            ? new Date(dto.tanggalPublikasi)
            : null,
        }),
      },
    });
  }
}
