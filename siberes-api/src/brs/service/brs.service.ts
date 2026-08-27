import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';


import { CreateBrsDto } from '../dto/create-brs.dto';
import { UpdateBrsDto } from '../dto/update-brs.dto';
import { PrismaService } from '../../prisma/prisma.service';

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

  async findAll() {
    return this.prisma.brs.findMany({
      orderBy: [
        {
          tahun: 'desc',
        },
        {
          bulan: 'desc',
        },
      ],
    });
  }

  async findOne(id: number) {
    const brs = await this.prisma.brs.findUnique({
      where: { id },
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
