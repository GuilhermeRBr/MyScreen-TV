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
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Env } from '../env.validation';
import { AUTH_SWAGGER } from './messages/auth.swagger';
import { AUTH_MESSAGES } from './messages/auth.messages';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env>,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation(AUTH_SWAGGER.register.operation)
  @ApiResponse({ status: 201, description: AUTH_SWAGGER.register.responses[201] })
  @ApiResponse({ status: 400, description: AUTH_SWAGGER.register.responses[400] })
  @ApiResponse({ status: 429, description: AUTH_SWAGGER.register.responses[429] })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setTokenCookies(res, accessToken, refreshToken);
    return { message: AUTH_MESSAGES.REGISTER_SUCCESS };
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation(AUTH_SWAGGER.login.operation)
  @ApiResponse({ status: 200, description: AUTH_SWAGGER.login.responses[200] })
  @ApiResponse({ status: 401, description: AUTH_SWAGGER.login.responses[401] })
  @ApiResponse({ status: 429, description: AUTH_SWAGGER.login.responses[429] })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    this.setTokenCookies(res, accessToken, refreshToken);
    return { message: AUTH_MESSAGES.LOGIN_SUCCESS };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation(AUTH_SWAGGER.refresh.operation)
  @ApiResponse({ status: 200, description: AUTH_SWAGGER.refresh.responses[200] })
  @ApiResponse({ status: 401, description: AUTH_SWAGGER.refresh.responses[401] })
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
    return { message: AUTH_MESSAGES.REFRESH_SUCCESS };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth('access_token')
  @ApiOperation(AUTH_SWAGGER.logout.operation)
  @ApiResponse({ status: 200, description: AUTH_SWAGGER.logout.responses[200] })
  @ApiResponse({ status: 401, description: AUTH_SWAGGER.logout.responses[401] })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = (req.cookies as Record<string, string>)?.refresh_token;

    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }

    this.clearTokenCookies(res);
    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
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
