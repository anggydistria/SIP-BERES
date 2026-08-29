import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'node:path';
import { memoryStorage } from 'multer';

import {
  DataUploadService,
  type ExcelPreviewResponse,
  type SaveExcelResponse,
} from '../service/data-upload.service';

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
export class DataUploadController {
  constructor(private readonly dataUploadService: DataUploadService) {}

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', {
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
    }),
  )
  previewExcel(
    @UploadedFile() file?: Express.Multer.File,
  ): ExcelPreviewResponse {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah');
    }

    return this.dataUploadService.previewExcel(file.buffer);
  }
  @Post()
  @UseInterceptors(excelFileInterceptor)
  async saveExcel(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SaveExcelResponse> {
    if (!file) {
      throw new BadRequestException('File Excel wajib diunggah');
    }

    return this.dataUploadService.saveExcel(file);
  }
}
