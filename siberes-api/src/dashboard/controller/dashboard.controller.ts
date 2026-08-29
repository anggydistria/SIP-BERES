import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';

import {
  DashboardService,
  type DashboardSummaryResponse,
} from '../service/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getSummary(
    @Query('bulan', ParseIntPipe) bulan: number,
    @Query('tahun', ParseIntPipe) tahun: number,
  ): Promise<DashboardSummaryResponse> {
    return this.dashboardService.getSummary(bulan, tahun);
  }
}
