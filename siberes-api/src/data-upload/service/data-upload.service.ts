import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as XLSX from 'xlsx';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { PrismaService } from '../../prisma/prisma.service';

const TARGET_SHEET = 'KabKot_KeLas64';
const PERIOD_SOURCE_SHEET = 'Penimbang_Raw Data64';

const TARGET_PROVINCE_CODE = '64';
const TARGET_REGENCY_CODE = '72';

const REQUIRED_HEADERS = [
  'kd_prov',
  'kd_kab',
  'jenis_akomodasi',
  'kelas_akomodasi',
  'mktj',
  'mkts',
  'mta',
  'ta',
  'mtnus',
  'tnus',
] as const;

const INDONESIAN_MONTHS: Record<string, number> = {
  JANUARI: 1,
  FEBRUARI: 2,
  MARET: 3,
  APRIL: 4,
  MEI: 5,
  JUNI: 6,
  JULI: 7,
  AGUSTUS: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DESEMBER: 12,
};

type ExcelRow = Record<string, unknown>;

export interface PreviewRow {
  sourceRow: number;
  jenisAkomodasi: number;
  kelasAkomodasi: number;
  mktj: number;
  mkts: number;
  mta: number;
  ta: number;
  mtnus: number;
  tnus: number;
}

export interface RowError {
  sourceRow: number;
  message: string;
}

export interface ExcelPreviewResponse {
  sheetName: string;

  location: {
    provinceCode: string;
    regencyCode: string;
    name: string;
  };

  period: {
    label: string;
    bulan: number;
    tahun: number;
  };

  sourceTotalRows: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;

  data: PreviewRow[];
  errors: RowError[];
}

export interface SaveExcelResponse {
  message: string;

  dataUpload: {
    id: number;
    brsId: number;
    version: number;
    status: 'ACTIVE';
    originalName: string;
    rowCount: number;
  };

  period: {
    label: string;
    bulan: number;
    tahun: number;
  };
}

@Injectable()
export class DataUploadService {
  constructor(private readonly prisma: PrismaService) {}
  previewExcel(buffer: Buffer): ExcelPreviewResponse {
    const workbook = this.readWorkbook(buffer);

    const worksheet = workbook.Sheets[TARGET_SHEET];

    if (!worksheet) {
      throw new BadRequestException(
        `Sheet "${TARGET_SHEET}" tidak ditemukan. Sheet tersedia: ${workbook.SheetNames.join(', ')}`,
      );
    }

    this.validateHeaders(worksheet);

    const allRows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      defval: null,
      raw: true,
    });

    const samarindaRows = allRows
      .map((row, index) => ({
        row,
        sourceRow: index + 2,
      }))
      .filter(({ row }) => {
        const provinceCode = this.normalizeCode(row.kd_prov, 2);

        const regencyCode = this.normalizeCode(row.kd_kab, 2);

        return (
          provinceCode === TARGET_PROVINCE_CODE &&
          regencyCode === TARGET_REGENCY_CODE
        );
      });

    if (samarindaRows.length === 0) {
      throw new BadRequestException(
        'Data Kota Samarinda dengan kd_prov 64 dan kd_kab 72 tidak ditemukan',
      );
    }

    const period = this.getPeriod(workbook);
    const data: PreviewRow[] = [];
    const errors: RowError[] = [];

    samarindaRows.forEach(({ row, sourceRow }) => {
      try {
        data.push({
          sourceRow,
          jenisAkomodasi: this.toNumber(row.jenis_akomodasi, 'jenis_akomodasi'),
          kelasAkomodasi: this.toNumber(row.kelas_akomodasi, 'kelas_akomodasi'),
          mktj: this.toNumber(row.mktj, 'mktj'),
          mkts: this.toNumber(row.mkts, 'mkts'),
          mta: this.toNumber(row.mta, 'mta'),
          ta: this.toNumber(row.ta, 'ta'),
          mtnus: this.toNumber(row.mtnus, 'mtnus'),
          tnus: this.toNumber(row.tnus, 'tnus'),
        });
      } catch (error) {
        errors.push({
          sourceRow,
          message: error instanceof Error ? error.message : 'Data tidak valid',
        });
      }
    });

    return {
      sheetName: TARGET_SHEET,
      location: {
        provinceCode: TARGET_PROVINCE_CODE,
        regencyCode: TARGET_REGENCY_CODE,
        name: 'Kota Samarinda',
      },
      period,
      sourceTotalRows: allRows.length,
      totalRows: samarindaRows.length,
      validRows: data.length,
      invalidRows: errors.length,
      data,
      errors,
    };
  }

  async saveExcel(
    file: Express.Multer.File,
    uploadedById: number,
  ): Promise<SaveExcelResponse> {
    const preview = this.previewExcel(file.buffer);

    if (preview.invalidRows > 0) {
      throw new BadRequestException({
        message: 'File Excel memiliki data yang tidak valid',
        errors: preview.errors,
      });
    }
 

    const brs = await this.prisma.brs.upsert({
      where: {
        jenisBrs_bulan_tahun: {
          jenisBrs: 'PARIWISATA',
          bulan: preview.period.bulan,
          tahun: preview.period.tahun,
        },
      },
      update: {},
      create: {
        jenisBrs: 'PARIWISATA',
        bulan: preview.period.bulan,
        tahun: preview.period.tahun,
        status: 'DRAFT',
      },
    });

    if (brs.status === 'FINAL') {
      throw new ConflictException(
        'Data Excel tidak dapat diganti karena BRS sudah final',
      );
    }

    if (brs.status === 'FINAL_SUBMITTED') {
      throw new ConflictException(
        'Data Excel tidak dapat diganti selama calon BRS final menunggu review',
      );
    }

    const existingUploads = await this.prisma.dataUpload.findMany({
      where: {
        brsId: brs.id,
      },

      orderBy: {
        version: 'desc',
      },

      select: {
        id: true,
        version: true,
        path: true,
      },
    });

    const nextVersion = (existingUploads[0]?.version ?? 0) + 1;

    const fileExtension = extname(file.originalname).toLowerCase();

    const storedName = `${randomUUID()}${fileExtension}`;

    const relativeDirectory = join('uploads', 'data-uploads');

    const relativePath = join(relativeDirectory, storedName).replaceAll(
      '\\',
      '/',
    );

    const absoluteDirectory = join(process.cwd(), relativeDirectory);

    const absolutePath = join(process.cwd(), relativePath);

    await mkdir(absoluteDirectory, {
      recursive: true,
    });

    await writeFile(absolutePath, file.buffer);

    try {
      const dataUpload = await this.prisma.$transaction(async (transaction) => {
        /*
         * File dan raw data baru dibuat dahulu.
         */
        const createdUpload = await transaction.dataUpload.create({
          data: {
            brsId: brs.id,
            uploadedById: uploadedById,
            originalName: file.originalname,

            storedName,
            path: relativePath,
            mimeType: file.mimetype,
            size: file.size,

            sheetName: preview.sheetName,

            rowCount: preview.validRows,

            version: nextVersion,
            status: 'ACTIVE',
            processedAt: new Date(),

            rawData: {
              create: preview.data.map((row) => ({
                sourceRow: row.sourceRow,

                jenisAkomodasi: row.jenisAkomodasi,

                kelasAkomodasi: row.kelasAkomodasi,

                mktj: row.mktj,
                mkts: row.mkts,
                mta: row.mta,
                ta: row.ta,
                mtnus: row.mtnus,
                tnus: row.tnus,
              })),
            },
          },
        });

        /*
         * Setelah data baru berhasil dibuat,
         * hapus seluruh upload sebelumnya.
         *
         * RawData lama ikut terhapus karena
         * relasinya menggunakan onDelete: Cascade.
         */
        if (existingUploads.length > 0) {
          await transaction.dataUpload.deleteMany({
            where: {
              id: {
                in: existingUploads.map((upload) => upload.id),
              },
            },
          });
        }

        /*
         * Perubahan sumber data membuat proses
         * penyusunan harus dimulai dari draft lagi.
         */
        await transaction.brs.update({
          where: {
            id: brs.id,
          },

          data: {
            status: 'DRAFT',
          },
        });

        return createdUpload;
      });

      await Promise.all(
        existingUploads.map((upload) =>
          unlink(join(process.cwd(), upload.path)).catch(() => undefined),
        ),
      );

      return {
        message: 'Data Excel berhasil disimpan',
        dataUpload: {
          id: dataUpload.id,
          brsId: dataUpload.brsId,
          version: dataUpload.version,
          status: 'ACTIVE',
          originalName: dataUpload.originalName,
          rowCount: dataUpload.rowCount,
        },
        period: preview.period,
      };
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined);

      throw error;
    }
  }

  async getActiveFile(id: number) {
    const upload = await this.prisma.dataUpload.findFirst({
      where: {
        id,
        status: 'ACTIVE',
      },
    });

    if (!upload) {
      throw new BadRequestException('File Excel aktif tidak ditemukan');
    }

    let buffer: Buffer;

    try {
      buffer = await readFile(join(process.cwd(), upload.path));
    } catch {
      throw new BadRequestException(
        'File Excel tidak ditemukan di penyimpanan',
      );
    }

    return {
      buffer,
      filename: upload.originalName,

      mimeType:
        upload.mimeType ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
  private readWorkbook(buffer: Buffer): XLSX.WorkBook {
    try {
      return XLSX.read(buffer, {
        type: 'buffer',
        raw: true,
      });
    } catch {
      throw new BadRequestException('File Excel tidak dapat dibaca atau rusak');
    }
  }

  private validateHeaders(worksheet: XLSX.WorkSheet) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      range: 0,
      blankrows: false,
      defval: null,
    });

    const headers = (rows[0] ?? []).map((value) =>
      String(value ?? '')
        .trim()
        .toLowerCase(),
    );

    const missingHeaders = REQUIRED_HEADERS.filter(
      (header) => !headers.includes(header),
    );

    if (missingHeaders.length > 0) {
      throw new BadRequestException(
        `Kolom Excel tidak lengkap: ${missingHeaders.join(', ')}`,
      );
    }
  }

  private getPeriod(workbook: XLSX.WorkBook) {
    const worksheet = workbook.Sheets[PERIOD_SOURCE_SHEET];

    if (!worksheet) {
      throw new BadRequestException(
        `Sheet sumber periode "${PERIOD_SOURCE_SHEET}" tidak ditemukan`,
      );
    }

    const rows = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      defval: null,
      raw: true,
    });

    if (rows.length === 0) {
      throw new BadRequestException('Data periode tidak ditemukan');
    }

    return this.parsePeriod(rows[0].bulan);
  }

  private parsePeriod(value: unknown) {
    if (typeof value !== 'string') {
      throw new BadRequestException('Kolom bulan tidak valid');
    }

    const normalizedValue = value.trim().toUpperCase();

    const match = normalizedValue.match(/^([A-Z]+)\s+(\d{4})$/);

    if (!match) {
      throw new BadRequestException(`Format periode "${value}" tidak valid`);
    }

    const monthName = match[1];
    const year = Number(match[2]);
    const month = INDONESIAN_MONTHS[monthName];

    if (!month) {
      throw new BadRequestException(`Nama bulan "${monthName}" tidak dikenali`);
    }

    return {
      label: normalizedValue,
      bulan: month,
      tahun: year,
    };
  }

  private normalizeCode(value: unknown, length: number): string {
    return String(value ?? '')
      .trim()
      .padStart(length, '0');
  }

  private toNumber(value: unknown, fieldName: string): number {
    if (value === null || value === undefined || value === '') {
      throw new Error(`Kolom ${fieldName} kosong`);
    }

    const numberValue =
      typeof value === 'number' ? value : Number(String(value).trim());

    if (!Number.isFinite(numberValue)) {
      throw new Error(`Nilai ${fieldName} bukan angka yang valid`);
    }

    if (numberValue < 0) {
      throw new Error(`Nilai ${fieldName} tidak boleh negatif`);
    }

    return numberValue;
  }
}
