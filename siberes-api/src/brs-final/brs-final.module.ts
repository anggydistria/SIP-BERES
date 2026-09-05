import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { BrsFinalController } from './controller/brs-final.controller';
import { BrsFinalService } from './service/brs-final.service';

@Module({
  imports: [PrismaModule, AuthModule],

  controllers: [BrsFinalController],

  providers: [BrsFinalService],
})
export class BrsFinalModule {}
