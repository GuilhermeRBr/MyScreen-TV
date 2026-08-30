import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Env } from '../../env.validation';
import { RefreshTokenPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService<Env>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return (request.cookies as Record<string, string>)?.refresh_token ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET', { infer: true })!,
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    payload: RefreshTokenPayload,
  ): Promise<{ userId: string; jti: string }> {
    const refreshToken = (request.cookies as Record<string, string>)?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token ausente');
    }

    return { userId: payload.sub, jti: payload.jti };
  }
}
