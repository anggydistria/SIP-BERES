import { Module } from '@nestjs/common';

import { BrsAnalyticsModule } from '../brs-analytics/brs-analytics.module';
import { BrsDocumentController } from './controller/brs-document.controller';
import { BrsDocumentService } from './service/brs-document.service';

@Module({
  imports: [BrsAnalyticsModule],

  controllers: [
    BrsDocumentController,
  ],

  providers: [
    BrsDocumentService,
  ],

  exports: [
    BrsDocumentService,
  ],
})
export class BrsDocumentModule {}