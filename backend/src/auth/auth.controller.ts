import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Env } from '../env.validation';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env>,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setTokenCookies(res, accessToken, refreshToken);
    return { message: 'Login realizado com sucesso' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() req: Request & { user: { userId: string; jti: string } },
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = (req.cookies as Record<string, string>).refresh_token;
    const { accessToken, refreshToken } = await this.authService.refresh(
      req.user.userId,
      req.user.jti,
      rawRefreshToken,
    );
    this.setTokenCookies(res, accessToken, refreshToken);
    return { message: 'Token renovado com sucesso' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = (req.cookies as Record<string, string>)?.refresh_token;

    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    this.clearTokenCookies(res);
    return { message: 'Logout realizado com sucesso' };
  }

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction =
      this.config.get<string>('NODE_ENV', { infer: true }) === 'production';

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.cookie('access_token', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutos
    });

    res.cookie('refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      path: '/auth/refresh',
    });
  }

  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
  }
}
