import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';

import { BrsDocumentService } from '../service/brs-document.service';

@Controller('brs-documents')
export class BrsDocumentController {
  constructor(private readonly documentService: BrsDocumentService) {}

  @Get('generate')
  async generate(
    @Query('bulan', ParseIntPipe)
    bulan: number,

    @Query('tahun', ParseIntPipe)
    tahun: number,

    @Res({
      passthrough: true,
    })
    response: Response,
  ): Promise<StreamableFile> {
    const result = await this.documentService.generate(bulan, tahun);

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );

    return new StreamableFile(result.buffer);
  }
}
