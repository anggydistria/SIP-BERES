import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Roles } from '../../auth/decorator/roles.decorator';

import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

import { RolesGuard } from '../../auth/guard/roles.guard';
import {
  DashboardService,
  type DashboardSummaryResponse,
} from '../service/dashboard.service';

@Controller('dashboard')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  'KETUA_BRS',
  'PENGELOLA',
  'ADMIN',
)
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
