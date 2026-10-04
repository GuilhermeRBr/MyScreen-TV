import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  $transaction: jest.fn(),
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
      FRONTEND_URL: 'http://localhost:3000',
    };
    return values[key];
  }),
};

const mockEmailService = {
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Suite principal
// ---------------------------------------------------------------------------

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
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
      mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-1' });

      const result = await service.register({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password123',
        confirmPassword: 'password123',
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
          confirmPassword: 'password123',
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
          confirmPassword: 'password123',
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
      mockPrisma.user.update.mockResolvedValue({});
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

  // ---------------------------------------------------------------------------
  // forgotPassword
  // ---------------------------------------------------------------------------

  describe('forgotPassword', () => {
    it('deve enviar e-mail quando o usuario existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1' });
      mockPrisma.user.update.mockResolvedValue({});

      await service.forgotPassword({ email: 'user@test.com' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'uuid-1' },
          data: expect.objectContaining({
            passwordResetTokenHash: expect.any(String),
            passwordResetExpiresAt: expect.any(Date),
          }),
        }),
      );
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      const [emailArg, linkArg] =
        mockEmailService.sendPasswordResetEmail.mock.calls[0] as [string, string];
      expect(emailArg).toBe('user@test.com');
      expect(linkArg).toContain('/reset-password?token=');
    });

    it('deve retornar sem enviar e-mail quando o usuario nao existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await service.forgotPassword({ email: 'ghost@test.com' });

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('nao deve armazenar o token puro — apenas o hash SHA-256', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1' });
      mockPrisma.user.update.mockResolvedValue({});

      await service.forgotPassword({ email: 'user@test.com' });

      const [, linkArg] =
        mockEmailService.sendPasswordResetEmail.mock.calls[0] as [string, string];

      // Extrai o token do link
      const url = new URL(linkArg);
      const rawToken = url.searchParams.get('token')!;

      const { createHash } = await import('crypto');
      const expectedHash = createHash('sha256').update(rawToken).digest('hex');

      const updateCall = mockPrisma.user.update.mock.calls[0] as [
        { data: { passwordResetTokenHash: string } },
      ];
      const storedHash = updateCall[0].data.passwordResetTokenHash;

      expect(storedHash).toBe(expectedHash);
      expect(storedHash).not.toBe(rawToken);
    });

    it('deve definir expiracao em aproximadamente 15 minutos', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1' });
      mockPrisma.user.update.mockResolvedValue({});

      const before = Date.now();
      await service.forgotPassword({ email: 'user@test.com' });
      const after = Date.now();

      const updateCall = mockPrisma.user.update.mock.calls[0] as [
        { data: { passwordResetExpiresAt: Date } },
      ];
      const expiresAt = updateCall[0].data.passwordResetExpiresAt.getTime();

      const expectedMin = before + 15 * 60 * 1000;
      const expectedMax = after + 15 * 60 * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });

    it('deve gerar tokens unicos em chamadas sucessivas', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1' });
      mockPrisma.user.update.mockResolvedValue({});

      await service.forgotPassword({ email: 'user@test.com' });
      await service.forgotPassword({ email: 'user@test.com' });

      const calls = mockEmailService.sendPasswordResetEmail.mock
        .calls as [string, string][];
      const token1 = new URL(calls[0][1]).searchParams.get('token');
      const token2 = new URL(calls[1][1]).searchParams.get('token');

      expect(token1).not.toBe(token2);
    });
  });

  // ---------------------------------------------------------------------------
  // resetPassword
  // ---------------------------------------------------------------------------

  describe('resetPassword', () => {
    const rawToken = 'a'.repeat(64); // 64 hex chars = 32 bytes

    const buildUserWithValidToken = () => {
      const { createHash } = require('crypto') as typeof import('crypto');
      const hash = createHash('sha256').update(rawToken).digest('hex');
      return {
        id: 'uuid-1',
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      };
    };

    it('deve redefinir a senha com sucesso', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(buildUserWithValidToken());
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      await expect(
        service.resetPassword({ token: rawToken, password: 'NovaSenha1!' }),
      ).resolves.not.toThrow();

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('deve armazenar nova senha como hash bcrypt', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(buildUserWithValidToken());

      let capturedPasswordHash = '';
      mockPrisma.$transaction.mockImplementation(
        async (ops: Array<Promise<unknown>>) => {
          const results = await Promise.all(ops);
          return results;
        },
      );
      mockPrisma.user.update.mockImplementation(
        ({ data }: { data: { passwordHash: string } }) => {
          capturedPasswordHash = data.passwordHash;
          return Promise.resolve({});
        },
      );
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

      await service.resetPassword({ token: rawToken, password: 'NovaSenha1!' });

      expect(capturedPasswordHash).toBeTruthy();
      const isHash = await bcrypt.compare('NovaSenha1!', capturedPasswordHash);
      expect(isHash).toBe(true);
    });

    it('deve invalidar o token apos uso (definir como null)', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(buildUserWithValidToken());

      let capturedData: Record<string, unknown> = {};
      mockPrisma.$transaction.mockImplementation(
        async (ops: Array<Promise<unknown>>) => Promise.all(ops),
      );
      mockPrisma.user.update.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => {
          capturedData = data;
          return Promise.resolve({});
        },
      );
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      await service.resetPassword({ token: rawToken, password: 'NovaSenha1!' });

      expect(capturedData['passwordResetTokenHash']).toBeNull();
      expect(capturedData['passwordResetExpiresAt']).toBeNull();
    });

    it('deve invalidar todos os refresh tokens do usuario', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(buildUserWithValidToken());

      let capturedRefreshUpdate: Record<string, unknown> = {};
      mockPrisma.$transaction.mockImplementation(
        async (ops: Array<Promise<unknown>>) => Promise.all(ops),
      );
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.refreshToken.updateMany.mockImplementation(
        (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          capturedRefreshUpdate = args;
          return Promise.resolve({ count: 2 });
        },
      );

      await service.resetPassword({ token: rawToken, password: 'NovaSenha1!' });

      expect(capturedRefreshUpdate['where']).toMatchObject({
        userId: 'uuid-1',
        revokedAt: null,
      });
      expect(
        (capturedRefreshUpdate['data'] as Record<string, unknown>)['revokedAt'],
      ).toBeInstanceOf(Date);
    });

    it('deve rejeitar token inexistente', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'token-invalido', password: 'NovaSenha1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve rejeitar token expirado', async () => {
      const { createHash } = require('crypto') as typeof import('crypto');
      const hash = createHash('sha256').update(rawToken).digest('hex');

      mockPrisma.user.findFirst.mockResolvedValue({
        id: 'uuid-1',
        passwordResetTokenHash: hash,
        passwordResetExpiresAt: new Date(Date.now() - 1000), // expirado
      });

      await expect(
        service.resetPassword({ token: rawToken, password: 'NovaSenha1!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('nao deve permitir reutilizacao do token', async () => {
      mockPrisma.user.findFirst
        .mockResolvedValueOnce(buildUserWithValidToken()) // primeira chamada: token valido
        .mockResolvedValueOnce(null); // segunda chamada: token ja invalido

      mockPrisma.$transaction.mockResolvedValue([{}, {}]);

      // Primeira redefinicao: sucesso
      await expect(
        service.resetPassword({ token: rawToken, password: 'NovaSenha1!' }),
      ).resolves.not.toThrow();

      // Segunda tentativa com o mesmo token: falha
      await expect(
        service.resetPassword({ token: rawToken, password: 'OutraSenha2!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ---------------------------------------------------------------------------
  // EmailService — tratamento de erros do Resend
  // ---------------------------------------------------------------------------

  describe('forgotPassword — erros do EmailService', () => {
    it('deve propagar erro quando o envio de e-mail falha', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'uuid-1' });
      mockPrisma.user.update.mockResolvedValue({});
      mockEmailService.sendPasswordResetEmail.mockRejectedValueOnce(
        new Error('Falha ao enviar e-mail de recuperação de senha.'),
      );

      await expect(
        service.forgotPassword({ email: 'user@test.com' }),
      ).rejects.toThrow('Falha ao enviar e-mail de recuperação de senha.');
    });
  });
});
