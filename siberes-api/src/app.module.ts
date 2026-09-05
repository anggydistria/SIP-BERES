import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BrsModule } from './brs/brs.module';
import { PrismaModule } from './prisma/prisma.module';
import { DataUploadModule } from './data-upload/data-upload.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BrsAnalyticsModule } from './brs-analytics/brs-analytics.module';
import { BrsDocumentModule } from './brs-document/brs-document.module';
import { BrsFinalModule } from './brs-final/brs-final.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BrsModule,
    DataUploadModule,
    DashboardModule,
    BrsAnalyticsModule,
    BrsDocumentModule,
    BrsFinalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
