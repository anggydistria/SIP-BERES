import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrsModule } from './brs/brs.module';
import { PrismaModule } from './prisma/prisma.module';
import { DataUploadModule } from './data-upload/data-upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    BrsModule,
    DataUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
