import { Module } from '@nestjs/common';

import { DataUploadController } from './controller/data-upload.controller';
import { DataUploadService } from './service/data-upload.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DataUploadController],
  providers: [DataUploadService],
  exports: [DataUploadService],
})
export class DataUploadModule {}
