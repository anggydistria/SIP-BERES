import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { BrsFinalController } from './controller/brs-final.controller';
import { BrsFinalService } from './service/brs-final.service';

@Module({
  imports: [PrismaModule],

  controllers: [BrsFinalController],

  providers: [BrsFinalService],
})
export class BrsFinalModule {}
