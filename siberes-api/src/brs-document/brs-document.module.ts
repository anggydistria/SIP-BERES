import { Module } from '@nestjs/common';

import { BrsAnalyticsModule } from '../brs-analytics/brs-analytics.module';
import { BrsDocumentController } from './controller/brs-document.controller';
import { BrsDocumentService } from './service/brs-document.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule, BrsAnalyticsModule, AuthModule],

  controllers: [BrsDocumentController],

  providers: [BrsDocumentService],

  exports: [BrsDocumentService],
})
export class BrsDocumentModule {}