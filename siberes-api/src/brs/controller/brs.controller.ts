import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { BrsService } from '../service/brs.service';
import { CreateBrsDto } from '../dto/create-brs.dto';
import { UpdateBrsDto } from '../dto/update-brs.dto';
import { FindBrsQueryDto } from '../dto/find-brs-query.dto';

@Controller('brs')
export class BrsController {
  constructor(private readonly brsService: BrsService) {}

  @Post()
  create(@Body() dto: CreateBrsDto) {
    return this.brsService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindBrsQueryDto) {
    return this.brsService.findAll(query);
  } 

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBrsDto) {
    return this.brsService.update(id, dto);
  }
}
