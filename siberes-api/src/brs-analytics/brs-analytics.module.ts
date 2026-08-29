import { Module } from '@nestjs/common';

import { BrsAnalyticsController } from './controller/brs-analytics.controller';
import { BrsAnalyticsService } from './service/brs-analytics.service';
import { BrsNarrativeService } from './service/brs-narrative.service';

@Module({
  controllers: [BrsAnalyticsController],
  providers: [BrsAnalyticsService, BrsNarrativeService],
  exports: [BrsAnalyticsService, BrsNarrativeService],
})
export class BrsAnalyticsModule {}
