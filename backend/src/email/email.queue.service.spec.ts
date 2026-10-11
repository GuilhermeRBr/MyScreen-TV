import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { EmailQueueService } from './email.queue.service';
import { QUEUE_NAMES } from '../queue/queue.constants';
import { EMAIL_JOB_NAMES } from './jobs/send-email.job';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockQueue = {
  add: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      FRONTEND_URL: 'http://localhost:3000',
    };
    return values[key];
  }),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('EmailQueueService', () => {
  let service: EmailQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailQueueService,
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: getQueueToken(QUEUE_NAMES.EMAIL),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<EmailQueueService>(EmailQueueService);
    jest.clearAllMocks();
  });

  describe('enqueuePasswordReset', () => {
    it('deve adicionar job com o nome correto', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job-1' });

      await service.enqueuePasswordReset('user@test.com', 'rawtoken123');

      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledWith(
        EMAIL_JOB_NAMES.SEND_PASSWORD_RESET,
        expect.objectContaining({
          toEmail: 'user@test.com',
          rawToken: 'rawtoken123',
          frontendUrl: 'http://localhost:3000',
        }),
        expect.objectContaining({ jobId: expect.any(String) }),
      );
    });

    it('deve incluir frontendUrl no payload para o worker montar o link', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job-2' });

      await service.enqueuePasswordReset('outro@test.com', 'abc');

      const callArgs = mockQueue.add.mock.calls[0] as [
        string,
        { frontendUrl: string },
        unknown,
      ];
      expect(callArgs[1].frontendUrl).toBe('http://localhost:3000');
    });

    it('deve gerar jobIds distintos para chamadas com e-mails diferentes', async () => {
      mockQueue.add.mockResolvedValue({ id: 'job-x' });

      await service.enqueuePasswordReset('a@test.com', 'token1');
      await service.enqueuePasswordReset('b@test.com', 'token2');

      const calls = mockQueue.add.mock.calls as [string, unknown, { jobId: string }][];
      expect(calls[0][2].jobId).not.toBe(calls[1][2].jobId);
    });

    it('deve propagar erro quando a fila falhar', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Redis indisponivel'));

      await expect(
        service.enqueuePasswordReset('user@test.com', 'token'),
      ).rejects.toThrow('Redis indisponivel');
    });
  });
});
