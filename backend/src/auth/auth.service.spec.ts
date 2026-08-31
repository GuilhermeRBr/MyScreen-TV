import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

// Mocks
const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      JWT_SECRET: 'test-secret-long-enough-for-validation-32chars',
      JWT_EXPIRATION: '15m',
      JWT_REFRESH_SECRET: 'test-refresh-secret-long-enough-32chars',
      JWT_REFRESH_EXPIRATION: '7d',
    };
    return values[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // register
  // ---------------------------------------------------------------------------

  describe('register', () => {
    it('deve criar usuario com sucesso quando email e username sao unicos', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        username: 'testuser',
        displayName: 'Test User',
        passwordHash: 'hashed',
        avatarUrl: null,
        bio: null,
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.register({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      });

      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('deve lancar BadRequestException se email ja existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        username: 'outro',
      });

      await expect(
        service.register({
          email: 'test@test.com',
          username: 'newuser',
          password: 'password123',
          displayName: 'New User',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lancar BadRequestException se username ja existe', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        email: 'outro@test.com',
        username: 'testuser',
      });

      await expect(
        service.register({
          email: 'new@test.com',
          username: 'testuser',
          password: 'password123',
          displayName: 'New User',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------

  describe('login', () => {
    it('deve retornar tokens quando credenciais sao validas', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        role: 'USER',
      });

      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-1' });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('deve lancar UnauthorizedException quando usuario nao existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'notexist@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lancar UnauthorizedException quando senha e incorreta', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@test.com',
        passwordHash: hashedPassword,
        role: 'USER',
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ---------------------------------------------------------------------------
  // logout
  // ---------------------------------------------------------------------------

  describe('logout', () => {
    it('deve revogar o refresh token', async () => {
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.logout('some-raw-refresh-token');

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
