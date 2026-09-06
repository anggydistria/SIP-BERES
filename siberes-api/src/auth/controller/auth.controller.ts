import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import type {
  CookieOptions,
  Response,
} from 'express';

import { AUTH_COOKIE_NAME } from '../auth.constants';

import { CurrentUser } from '../decorator/current-user.decorator';

import { LoginDto } from '../dto/login.dto';

import { JwtAuthGuard } from '../guard/jwt-auth.guard';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

import { AuthService } from '../service/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions(): CookieOptions {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true })
    response: Response,
  ) {
    const result = await this.authService.login(dto);

    response.cookie(AUTH_COOKIE_NAME, result.accessToken, {
      ...this.getCookieOptions(),
      maxAge: 8 * 60 * 60 * 1000,
    });

    return {
      user: result.user,
    };
  }

  @Post('logout')
  logout(
    @Res({ passthrough: true })
    response: Response,
  ) {
    response.clearCookie(AUTH_COOKIE_NAME, this.getCookieOptions());

    return {
      message: 'Logout berhasil',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      user,
    };
  }
}
