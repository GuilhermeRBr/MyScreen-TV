import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { Env } from '../env.validation';
import { User } from '@prisma/client';
import { AUTH_MESSAGES } from './messages/auth.messages';
import { EmailQueueService } from '../email/email.queue.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const PASSWORD_RESET_TTL_MS = 15 * 60 * 1000; // 15 minutos

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    // O @Transform do DTO já normalizou, mas garantimos aqui também
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim().toLowerCase();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true, email: true, username: true },
    });

    if (existing) {
      if (existing.email === email) {
        throw new BadRequestException(AUTH_MESSAGES.EMAIL_IN_USE);
      }
      throw new BadRequestException(AUTH_MESSAGES.USERNAME_IN_USE);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: dto.displayName,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    return this.generateTokenPair(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Tempo constante para evitar user enumeration
      await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingprotection');
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokenPair(user.id, user.email, user.role);
  }

  async refresh(
    userId: string,
    jti: string,
    rawRefreshToken: string,
  ): Promise<TokenPair> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, role: true } } },
    });

    if (
      !storedToken ||
      storedToken.userId !== userId ||
      storedToken.revokedAt !== null ||
      storedToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Revogar token usado (rotação de refresh token)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
    );
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // Resposta genérica: não revela se o e-mail existe
    if (!user) {
      return;
    }

    // Token criptograficamente seguro de 32 bytes
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // Enfileira o envio de forma assíncrona — a API retorna imediatamente
    // sem aguardar o envio efetivo pelo provedor.
    // O EmailQueueService resolve FRONTEND_URL internamente via ConfigService.
    await this.emailQueueService.enqueuePasswordReset(email, rawToken);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);

    const user = await this.prisma.user.findFirst({
      where: { passwordResetTokenHash: tokenHash },
      select: {
        id: true,
        passwordResetTokenHash: true,
        passwordResetExpiresAt: true,
      },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw new UnauthorizedException(AUTH_MESSAGES.RESET_TOKEN_INVALID);
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    // Atualiza senha, invalida o token e invalida todos os refresh tokens
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  private async generateTokenPair(
    userId: string,
    email: string,
    role: User['role'],
  ): Promise<TokenPair> {
    const accessPayload: JwtPayload = { sub: userId, email, role };

    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = { sub: userId, jti };

    const refreshExpiration = this.config.get<string>('JWT_REFRESH_EXPIRATION', {
      infer: true,
    })!;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: refreshExpiration,
      }),
    ]);

    // Persiste hash do refresh token para validação e revogação
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = this.parseExpiration(refreshExpiration);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiration(expiration: string): Date {
    const now = new Date();
    const match = /^(\d+)([smhd])$/.exec(expiration);

    if (!match) {
      throw new Error(`Formato de expiração inválido: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() + value * (multipliers[unit] ?? 0));
  }
}
