import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, RefreshTokenPayload } from './interfaces/jwt-payload.interface';
import { Env } from '../env.validation';
import { User } from '@prisma/client';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Env>,
  ) {}

  async register(dto: RegisterDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
      select: { id: true, email: true, username: true },
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new BadRequestException('Email já está em uso');
      }
      throw new BadRequestException('Username já está em uso');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        passwordHash,
        displayName: dto.displayName,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Tempo constante para evitar user enumeration
      await bcrypt.compare(dto.password, '$2b$12$invalidhashfortimingprotection');
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

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
      throw new UnauthorizedException('Refresh token inválido ou expirado');
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
