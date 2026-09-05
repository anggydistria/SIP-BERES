import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from '../prisma/prisma.module';

import { AuthController } from './controller/auth.controller';

import { JwtAuthGuard } from './guard/jwt-auth.guard';

import { RolesGuard } from './guard/roles.guard';

import { AuthService } from './service/auth.service';

import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new Error('JWT_SECRET belum dikonfigurasi');
        }

        const expiresIn =
          configService.get<
            NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
          >('JWT_EXPIRES_IN') ?? '8h';

        return {
          secret,

          signOptions: {
            expiresIn,
          },
        };
      },
    }),
  ],

  controllers: [AuthController],

  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],

  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
