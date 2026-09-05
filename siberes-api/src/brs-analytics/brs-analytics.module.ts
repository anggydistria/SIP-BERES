import { Module } from '@nestjs/common';

import { BrsAnalyticsController } from './controller/brs-analytics.controller';
import { BrsAnalyticsService } from './service/brs-analytics.service';
import { BrsNarrativeService } from './service/brs-narrative.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BrsAnalyticsController],
  providers: [BrsAnalyticsService, BrsNarrativeService],
  exports: [BrsAnalyticsService, BrsNarrativeService],
})
export class BrsAnalyticsModule {}
