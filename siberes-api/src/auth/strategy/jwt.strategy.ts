import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../prisma/prisma.service';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import type { Request } from 'express';


import { AUTH_COOKIE_NAME } from '../auth.constants';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET belum dikonfigurasi');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request): string | null => {
          const cookies = request.cookies as Record<string, string> | undefined;

          return cookies?.[AUTH_COOKIE_NAME] ?? null;
        },

        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),

      ignoreExpiration: false,

      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },

      include: {
        roles: {
          where: {
            endedAt: null,
          },

          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive || user.username !== payload.username) {
      throw new UnauthorizedException('Token pengguna tidak valid');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    if (roles.length === 0) {
      throw new UnauthorizedException('Pengguna tidak memiliki role aktif');
    }

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      roles,
    };
  }
}
