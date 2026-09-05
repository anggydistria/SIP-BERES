import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { BrsService } from '../service/brs.service';
import { CreateBrsDto } from '../dto/create-brs.dto';
import { UpdateBrsDto } from '../dto/update-brs.dto';
import { FindBrsQueryDto } from '../dto/find-brs-query.dto';
import { Roles } from '../../auth/decorator/roles.decorator';

import { JwtAuthGuard } from '../../auth/guard/jwt-auth.guard';

import { RolesGuard } from '../../auth/guard/roles.guard';

@Controller('brs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrsController {
  constructor(private readonly brsService: BrsService) {}

  @Post()
  @Roles('KETUA_BRS')
  create(@Body() dto: CreateBrsDto) {
    return this.brsService.create(dto);
  }

  @Get()
  @Roles('KETUA_BRS', 'PENGELOLA', 'ADMIN')
  findAll(@Query() query: FindBrsQueryDto) {
    return this.brsService.findAll(query);
  }
  @Get(':id')
  @Roles('KETUA_BRS', 'PENGELOLA', 'ADMIN')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.brsService.findOne(id);
  }

  @Patch(':id')
  @Roles('KETUA_BRS')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateBrsDto,
  ) {
    return this.brsService.update(id, dto);
  }
}
