import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'node:path';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../auth/decorator/current-user.decorator';

import { Roles } from '../../auth/decorator/roles.decorator';

import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

import { RolesGuard } from '../../auth/guard/roles.guard';

import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import {
  DataUploadService,
  type ExcelPreviewResponse,
  type SaveExcelResponse,
} from '../service/data-upload.service';
import { UploadExcelPeriodDto } from '../dto/upload-excel-period.dto';

const excelFileInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
  fileFilter: (_request, file, callback) => {
    const extension = extname(file.originalname).toLowerCase();

    const allowedExtensions = ['.xlsx', '.xls'];

    if (!allowedExtensions.includes(extension)) {
      callback(
        new BadRequestException('File harus berformat .xlsx atau .xls'),
        false,
      );

      return;
    }

    callback(null, true);
  },
});

@Controller('data-uploads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataUploadController {
  constructor(private readonly dataUploadService: DataUploadService) {}

  @Get(':id/file')
  @Roles('KETUA_BRS', 'PENGELOLA')
  async getActiveFile(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    const result = await this.dataUploadService.getActiveFile(id);

    return new StreamableFile(result.buffer, {
      type: result.mimeType,

      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(
        result.filename,
      )}`,
    });
  }
  // @Post('preview')
  // @Roles('KETUA_BRS')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: memoryStorage(),
  //     limits: {
  //       fileSize: 20 * 1024 * 1024,
  //     },
  //     fileFilter: (_request, file, callback) => {
  //       const extension = extname(file.originalname).toLowerCase();

  //       const allowedExtensions = ['.xlsx', '.xls'];

  //       if (!allowedExtensions.includes(extension)) {
  //         callback(
  //           new BadRequestException('File harus berformat .xlsx atau .xls'),
  //           false,
  //         );
  //         return;
  //       }

  //       callback(null, true);
  //     },
  //   }),
  // )
  @Post('preview')
  @Roles('KETUA_BRS')
  @UseInterceptors(excelFileInterceptor)
  previewExcel(
    @UploadedFile()
    file: Express.Multer.File | undefined,

    @Body()
    periodDto: UploadExcelPeriodDto,
  ): ExcelPreviewResponse {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah');
    }

    return this.dataUploadService.previewExcel(file.buffer, periodDto);
  }

  @Post()
  @Roles('KETUA_BRS')
  @UseInterceptors(excelFileInterceptor)
  async saveExcel(
    @UploadedFile()
    file: Express.Multer.File | undefined,

    @Body()
    periodDto: UploadExcelPeriodDto,

    @CurrentUser()
    user: AuthenticatedUser,
  ): Promise<SaveExcelResponse> {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah');
    }

    return this.dataUploadService.saveExcel(file, user.id, periodDto);
  }
}
