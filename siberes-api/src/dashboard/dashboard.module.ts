import { Module } from '@nestjs/common';

import { DashboardController } from './controller/dashboard.controller';
import { DashboardService } from './service/dashboard.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
