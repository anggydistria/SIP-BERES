import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BrsController } from './controller/brs.controller';
import { BrsService } from './service/brs.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [BrsController],

  providers: [BrsService],
})
export class BrsModule {}
 
