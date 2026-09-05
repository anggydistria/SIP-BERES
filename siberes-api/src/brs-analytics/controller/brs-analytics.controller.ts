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
  BrsAnalyticsService,
  type BrsAnalyticsResponse,
} from '../service/brs-analytics.service';

import {
  BrsNarrativeService,
  type BrsNarrativeResponse,
} from '../service/brs-narrative.service';

@Controller('brs-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('KETUA_BRS', 'PENGELOLA', 'ADMIN')
export class BrsAnalyticsController {
  constructor(
    private readonly analyticsService: BrsAnalyticsService,

    private readonly narrativeService: BrsNarrativeService,
  ) {}

  @Get()
  calculate(
    @Query('bulan', ParseIntPipe)
    bulan: number,

    @Query('tahun', ParseIntPipe)
    tahun: number,
  ): Promise<BrsAnalyticsResponse> {
    return this.analyticsService.calculate(bulan, tahun);
  }

  @Get('narrative')
  buildNarrative(
    @Query('bulan', ParseIntPipe)
    bulan: number,

    @Query('tahun', ParseIntPipe)
    tahun: number,
  ): Promise<BrsNarrativeResponse> {
    return this.narrativeService.build(bulan, tahun);
  }
}
