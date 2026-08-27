import { Module } from '@nestjs/common';

import { BrsController } from './controller/brs.controller';
import { BrsService } from './service/brs.service';

@Module({
  controllers: [BrsController],
  providers: [BrsService],
})
export class BrsModule {}
