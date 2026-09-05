import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from '../../prisma/prisma.service';
import { SubmitFinalBrsDto } from '../dto/submit-final-brs.dto';
import { RejectFinalBrsDto } from '../dto/reject-final-brs.dto';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';

@Injectable()
export class BrsFinalService {
  constructor(private readonly prisma: PrismaService) {}

  async markDraftReady(brsId: number) {
    const brs = await this.prisma.brs.findUnique({
      where: {
        id: brsId,
      },

      include: {
        dataUploads: {
          where: {
            status: 'ACTIVE',
          },

          take: 1,
        },
      },
    });

    if (!brs) {
      throw new NotFoundException('BRS tidak ditemukan');
    }

    if (brs.dataUploads.length === 0) {
      throw new BadRequestException('Data Excel aktif belum tersedia');
    }

    if (brs.status === 'FINAL') {
      throw new ConflictException('BRS sudah berstatus final');
    }

    if (brs.status === 'FINAL_SUBMITTED') {
      throw new ConflictException('Calon BRS final sedang menunggu review');
    }

    return this.prisma.brs.update({
      where: {
        id: brsId,
      },

      data: {
        status: 'DRAFT_READY',
      },
    });
  }

  async submit(
    brsId: number,
    file: Express.Multer.File,
    dto: SubmitFinalBrsDto,
    user: AuthenticatedUser,
  ) {
    this.validatePdf(file);

    const brs = await this.prisma.brs.findUnique({
      where: {
        id: brsId,
      },

      include: {
        finalSubmission: true,
      },
    });

    if (!brs) {
      throw new NotFoundException('BRS tidak ditemukan');
    }

    if (!['DRAFT_READY', 'FINAL_REJECTED'].includes(brs.status)) {
      throw new ConflictException(
        'PDF final hanya dapat diunggah setelah draft dinyatakan siap atau setelah pengajuan ditolak',
      );
    }

    if (brs.finalSubmission) {
      throw new ConflictException(
        'Masih ada calon BRS final yang menunggu review',
      );
    }

    const latestHistory = await this.prisma.brsReviewHistory.findFirst({
      where: {
        brsId,
      },

      orderBy: {
        submissionVersion: 'desc',
      },

      select: {
        submissionVersion: true,
      },
    });

    const version = (latestHistory?.submissionVersion ?? 0) + 1;

    const temporaryName = `${randomUUID()}.pdf`;

    const relativeDirectory = join('uploads', 'brs-review-temp');

    const temporaryPath = join(relativeDirectory, temporaryName).replaceAll(
      '\\',
      '/',
    );

    const absoluteDirectory = join(process.cwd(), relativeDirectory);

    const absolutePath = join(process.cwd(), temporaryPath);

    await mkdir(absoluteDirectory, {
      recursive: true,
    });

    await writeFile(absolutePath, file.buffer);

    try {
      const submission = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.brsFinalSubmission.create({
          data: {
            brsId,

            submittedById: user.id,

            originalName: file.originalname,

            temporaryName,
            temporaryPath,

            mimeType: 'application/pdf',

            size: file.size,

            proposedNomorBrs: dto.nomorBrs.trim(),

            proposedTanggalPublikasi: dto.tanggalPublikasi
              ? new Date(dto.tanggalPublikasi)
              : null,

            version,
          },
        });

        await transaction.brs.update({
          where: {
            id: brsId,
          },

          data: {
            status: 'FINAL_SUBMITTED',
          },
        });

        return created;
      });

      return {
        message: 'Calon BRS final berhasil dikirim untuk direview',

        submission,
      };
    } catch (error) {
      await unlink(absolutePath).catch(() => undefined);

      throw error;
    }
  }

  async reject(brsId: number, dto: RejectFinalBrsDto, user: AuthenticatedUser) {
    const note = dto.note.trim();

    if (!note) {
      throw new BadRequestException('Catatan penolakan wajib diisi');
    }

    const submission = await this.pendingSubmission(brsId);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.brsReviewHistory.create({
        data: {
          brsId,

          submittedById: submission.submittedById,

          reviewedById: user.id,

          submissionVersion: submission.version,

          originalName: submission.originalName,

          proposedNomorBrs: submission.proposedNomorBrs,

          proposedTanggalPublikasi: submission.proposedTanggalPublikasi,

          decision: 'REJECTED',

          note,

          submittedAt: submission.submittedAt,
        },
      });

      await transaction.brsFinalSubmission.delete({
        where: {
          id: submission.id,
        },
      });

      await transaction.brs.update({
        where: {
          id: brsId,
        },

        data: {
          status: 'FINAL_REJECTED',
        },
      });
    });

    await unlink(join(process.cwd(), submission.temporaryPath)).catch(
      () => undefined,
    );

    return {
      message: 'Calon BRS final ditolak',
      note,
    };
  }

  async approve(brsId: number, user: AuthenticatedUser) {
    const submission = await this.pendingSubmission(brsId);

    const storedName = `${randomUUID()}.pdf`;

    const finalDirectory = join('uploads', 'brs-final');

    const finalPath = join(finalDirectory, storedName).replaceAll('\\', '/');

    const temporaryAbsolutePath = join(process.cwd(), submission.temporaryPath);

    const finalAbsoluteDirectory = join(process.cwd(), finalDirectory);

    const finalAbsolutePath = join(process.cwd(), finalPath);

    await mkdir(finalAbsoluteDirectory, {
      recursive: true,
    });

    /*
     * Pindahkan PDF dari folder sementara
     * ke folder final.
     */
    await rename(temporaryAbsolutePath, finalAbsolutePath);

    try {
      await this.prisma.$transaction(async (transaction) => {
        /*
         * Simpan riwayat persetujuan.
         */
        await transaction.brsReviewHistory.create({
          data: {
            brsId,

            submittedById: submission.submittedById,

            reviewedById: user.id,

            submissionVersion: submission.version,

            originalName: submission.originalName,

            proposedNomorBrs: submission.proposedNomorBrs,

            proposedTanggalPublikasi: submission.proposedTanggalPublikasi,

            decision: 'APPROVED',

            note: null,

            submittedAt: submission.submittedAt,
          },
        });

        /*
         * Simpan informasi PDF final permanen.
         */
        await transaction.brsFinalFile.create({
          data: {
            brsId,

            approvedById: user.id,

            originalName: submission.originalName,

            storedName,
            path: finalPath,

            mimeType: 'application/pdf',

            size: submission.size,
          },
        });

        /*
         * Hapus record file sementara.
         */
        await transaction.brsFinalSubmission.delete({
          where: {
            id: submission.id,
          },
        });

        /*
         * Nomor BRS dan tanggal publikasi
         * baru menjadi resmi setelah disetujui.
         */
        await transaction.brs.update({
          where: {
            id: brsId,
          },

          data: {
            nomorBrs: submission.proposedNomorBrs,

            tanggalPublikasi: submission.proposedTanggalPublikasi,

            status: 'FINAL',
          },
        });
      });
    } catch (error) {
      /*
       * Jika transaksi database gagal,
       * PDF dikembalikan ke folder sementara.
       */
      await rename(finalAbsolutePath, temporaryAbsolutePath).catch(
        () => undefined,
      );

      throw error;
    }

    return {
      message: 'BRS final berhasil disetujui',
    };
  }

  async getPendingFile(brsId: number) {
    const submission = await this.pendingSubmission(brsId);

    const absolutePath = join(process.cwd(), submission.temporaryPath);

    let buffer: Buffer;

    try {
      buffer = await readFile(absolutePath);
    } catch {
      throw new NotFoundException('File calon BRS final tidak ditemukan');
    }

    return {
      buffer,
      filename: submission.originalName,
    };
  }

  async getFinalFile(brsId: number) {
    const finalFile = await this.prisma.brsFinalFile.findUnique({
      where: {
        brsId,
      },
    });

    if (!finalFile) {
      throw new NotFoundException('PDF BRS final belum tersedia');
    }

    const absolutePath = join(process.cwd(), finalFile.path);

    let buffer: Buffer;

    try {
      buffer = await readFile(absolutePath);
    } catch {
      throw new NotFoundException('File PDF BRS final tidak ditemukan');
    }

    return {
      buffer,
      filename: finalFile.originalName,
    };
  }
  private async pendingSubmission(brsId: number) {
    const submission = await this.prisma.brsFinalSubmission.findUnique({
      where: {
        brsId,
      },
    });

    if (!submission) {
      throw new NotFoundException('Calon BRS final belum tersedia');
    }

    return submission;
  }
  private validatePdf(file: Express.Multer.File) {
    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('File BRS final harus berformat PDF');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('MIME type file harus application/pdf');
    }

    const signature = file.buffer.subarray(0, 5).toString('ascii');

    if (signature !== '%PDF-') {
      throw new BadRequestException('Isi file bukan PDF yang valid');
    }
  }
  private developmentUser(username: string, name: string) {}
}
