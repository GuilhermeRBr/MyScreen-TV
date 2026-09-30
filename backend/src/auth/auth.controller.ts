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

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<Env>,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 tentativas por IP por minuto
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova conta', description: 'Registra um novo usuário e já retorna os cookies de autenticação.' })
  @ApiResponse({ status: 201, description: 'Conta criada. Cookies access_token e refresh_token definidos.' })
  @ApiResponse({ status: 400, description: 'Email ou username já em uso, ou dados inválidos.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    this.setTokenCookies(res, accessToken, refreshToken);
    return { message: 'Conta criada com sucesso' };
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 tentativas por IP por minuto
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login', description: 'Autentica o usuário e define os cookies HttpOnly de acesso e refresh.' })
  @ApiResponse({ status: 200, description: 'Login realizado. Cookies access_token e refresh_token definidos.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @ApiResponse({ status: 429, description: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
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
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Renovar tokens', description: 'Troca o refresh_token por um novo par de tokens (rotação). O cookie refresh_token deve estar presente.' })
  @ApiResponse({ status: 200, description: 'Tokens renovados.' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado.' })
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
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Fazer logout', description: 'Revoga o refresh token e limpa os cookies de autenticação.' })
  @ApiResponse({ status: 200, description: 'Logout realizado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
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
