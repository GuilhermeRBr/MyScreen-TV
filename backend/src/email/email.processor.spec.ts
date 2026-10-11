import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { EMAIL_JOB_NAMES, PasswordResetEmailPayload } from './jobs/send-email.job';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildJob(
  name: string,
  data: PasswordResetEmailPayload,
  overrides: Partial<Job> = {},
): Job<PasswordResetEmailPayload> {
  return {
    id: 'test-job-id',
    name,
    data,
    attemptsMade: 0,
    opts: { attempts: 3 },
    ...overrides,
  } as unknown as Job<PasswordResetEmailPayload>;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockEmailService = {
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('EmailProcessor', () => {
  let processor: EmailProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    processor = module.get<EmailProcessor>(EmailProcessor);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // process — send-password-reset
  // ---------------------------------------------------------------------------

  describe(`process — ${EMAIL_JOB_NAMES.SEND_PASSWORD_RESET}`, () => {
    const payload: PasswordResetEmailPayload = {
      toEmail: 'user@test.com',
      rawToken: 'abc123def456',
      frontendUrl: 'http://localhost:3000',
    };

    it('deve chamar sendPasswordResetEmail com o link montado corretamente', async () => {
      const job = buildJob(EMAIL_JOB_NAMES.SEND_PASSWORD_RESET, payload);

      await processor.process(job);

      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@test.com',
        'http://localhost:3000/reset-password?token=abc123def456',
      );
    });

    it('deve propagar erro do EmailService para acionar retentativa do BullMQ', async () => {
      mockEmailService.sendPasswordResetEmail.mockRejectedValueOnce(
        new Error('Falha ao enviar e-mail de recuperação de senha.'),
      );

      const job = buildJob(EMAIL_JOB_NAMES.SEND_PASSWORD_RESET, payload);

      await expect(processor.process(job)).rejects.toThrow(
        'Falha ao enviar e-mail de recuperação de senha.',
      );
    });

    it('deve montar o link correto com frontendUrl customizado', async () => {
      const customPayload: PasswordResetEmailPayload = {
        toEmail: 'outro@test.com',
        rawToken: 'meutoken',
        frontendUrl: 'https://myapp.com',
      };

      const job = buildJob(EMAIL_JOB_NAMES.SEND_PASSWORD_RESET, customPayload);

      await processor.process(job);

      const [, link] = mockEmailService.sendPasswordResetEmail.mock
        .calls[0] as [string, string];
      expect(link).toBe('https://myapp.com/reset-password?token=meutoken');
    });
  });

  // ---------------------------------------------------------------------------
  // process — job desconhecido
  // ---------------------------------------------------------------------------

  describe('process — job desconhecido', () => {
    it('deve lancar erro para job de nome desconhecido', async () => {
      const job = buildJob('tipo-inexistente', {
        toEmail: 'x@test.com',
        rawToken: 'token',
        frontendUrl: 'http://localhost:3000',
      });

      await expect(processor.process(job)).rejects.toThrow('tipo-inexistente');
    });

    it('nao deve chamar EmailService para job desconhecido', async () => {
      const job = buildJob('outro-tipo', {
        toEmail: 'x@test.com',
        rawToken: 'token',
        frontendUrl: 'http://localhost:3000',
      });

      await expect(processor.process(job)).rejects.toThrow();
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onFailed — log de falha
  // ---------------------------------------------------------------------------

  describe('onFailed', () => {
    it('deve executar sem lancar excecao ao registrar falha definitiva', () => {
      const job = buildJob(
        EMAIL_JOB_NAMES.SEND_PASSWORD_RESET,
        { toEmail: 'x@test.com', rawToken: 't', frontendUrl: 'http://localhost:3000' },
        { attemptsMade: 3, opts: { attempts: 3 } },
      );

      expect(() => {
        processor.onFailed(job, new Error('falha definitiva'));
      }).not.toThrow();
    });

    it('deve executar sem lancar excecao ao registrar falha parcial', () => {
      const job = buildJob(
        EMAIL_JOB_NAMES.SEND_PASSWORD_RESET,
        { toEmail: 'x@test.com', rawToken: 't', frontendUrl: 'http://localhost:3000' },
        { attemptsMade: 1, opts: { attempts: 3 } },
      );

      expect(() => {
        processor.onFailed(job, new Error('falha temporaria'));
      }).not.toThrow();
    });
  });
});
