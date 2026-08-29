import { Module } from '@nestjs/common';

import { DashboardController } from './controller/dashboard.controller';
import { DashboardService } from './service/dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
