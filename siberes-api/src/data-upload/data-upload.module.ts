import { Module } from '@nestjs/common';

import { DataUploadController } from './controller/data-upload.controller';
import { DataUploadService } from './service/data-upload.service';

@Module({
  controllers: [DataUploadController],
  providers: [DataUploadService],
  exports: [DataUploadService],
})
export class DataUploadModule {}
