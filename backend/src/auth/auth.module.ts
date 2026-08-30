import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RolesGuard } from './guards/roles.guard';
import { Env } from '../env.validation';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService<Env>) => ({
        secret: config.get<string>('JWT_SECRET', { infer: true }),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', { infer: true }) ?? '15m',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, RolesGuard],
  exports: [AuthService, JwtModule, RolesGuard],
})
export class AuthModule {}
