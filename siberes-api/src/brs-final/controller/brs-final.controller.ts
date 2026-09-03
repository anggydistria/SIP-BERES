import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { RejectFinalBrsDto } from '../dto/reject-final-brs.dto';
import { SubmitFinalBrsDto } from '../dto/submit-final-brs.dto';
import { BrsFinalService } from '../service/brs-final.service';

const pdfInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),

  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

@Controller('brs')
export class BrsFinalController {
  constructor(private readonly service: BrsFinalService) {}

  /*
   * Ketua menyatakan draft otomatis
   * sudah selesai diperiksa.
   */
  @Patch(':brsId/draft-ready')
  markDraftReady(
    @Param('brsId', ParseIntPipe)
    brsId: number,
  ) {
    return this.service.markDraftReady(brsId);
  }

  /*
   * Pengelola mengunggah calon PDF final.
   */
  @Post(':brsId/final-submission')
  @UseInterceptors(pdfInterceptor)
  submit(
    @Param('brsId', ParseIntPipe)
    brsId: number,

    @Body()
    dto: SubmitFinalBrsDto,

    @UploadedFile()
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File PDF wajib diunggah');
    }

    return this.service.submit(brsId, file, dto);
  }

  /*
   * Ketua menyetujui calon PDF.
   */
  @Post(':brsId/final-submission/approve')
  approve(
    @Param('brsId', ParseIntPipe)
    brsId: number,
  ) {
    return this.service.approve(brsId);
  }

  /*
   * Ketua menolak calon PDF.
   */
  @Post(':brsId/final-submission/reject')
  reject(
    @Param('brsId', ParseIntPipe)
    brsId: number,

    @Body()
    dto: RejectFinalBrsDto,
  ) {
    return this.service.reject(brsId, dto);
  }

  /*
   * Mengunduh calon PDF yang sedang
   * menunggu review.
   */
  @Get(':brsId/final-submission/file')
  async pendingFile(
    @Param('brsId', ParseIntPipe)
    brsId: number,
  ) {
    const result = await this.service.getPendingFile(brsId);

    return this.pdfResponse(result.buffer, result.filename);
  }

  @Get(':brsId/final-submission/preview')
  async previewPendingFile(
    @Param('brsId', ParseIntPipe)
    brsId: number,
  ) {
    const result = await this.service.getPendingFile(brsId);

    return this.pdfResponse(result.buffer, result.filename, 'inline');
  }

  @Get(':brsId/final-file/preview')
  async previewFinalFile(
    @Param('brsId', ParseIntPipe)
    brsId: number,
  ) {
    const result = await this.service.getFinalFile(brsId);

    return this.pdfResponse(result.buffer, result.filename, 'inline');
  }
  /*
   * Mengunduh PDF BRS yang
   * sudah disetujui.
   */
  @Get(':brsId/final-file')
  async finalFile(
    @Param('brsId', ParseIntPipe)
    brsId: number,
  ) {
    const result = await this.service.getFinalFile(brsId);

    return this.pdfResponse(result.buffer, result.filename);
  }

  private pdfResponse(
    buffer: Buffer,
    filename: string,
    mode: 'attachment' | 'inline' = 'attachment',
  ) {
    return new StreamableFile(buffer, {
      type: 'application/pdf',

      disposition: `${mode}; filename*=UTF-8''${encodeURIComponent(filename)}`,
    });
  }
}
