import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const username = dto.username.trim();

    const user = await this.prisma.user.findUnique({
      where: {
        username,
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

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const passwordValid = await compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const roles = user.roles.map((userRole) => userRole.role.name);

    if (roles.length === 0) {
      throw new UnauthorizedException('Pengguna belum memiliki role aktif');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      roles,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,

      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        roles,
      },
    };
  }
}
