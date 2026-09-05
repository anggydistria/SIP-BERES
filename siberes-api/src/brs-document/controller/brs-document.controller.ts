import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { BrsDocumentService } from '../service/brs-document.service';
import { Roles } from '../../auth/decorator/roles.decorator';

import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

import { RolesGuard } from '../../auth/guard/roles.guard';

@Controller('brs-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('KETUA_BRS', 'PENGELOLA')
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
