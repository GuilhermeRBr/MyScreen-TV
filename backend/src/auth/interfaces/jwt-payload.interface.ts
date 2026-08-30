import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // ID único do refresh token para revogação
}
