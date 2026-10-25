import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WatchService } from './watch.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  episode: {
    findUnique: jest.fn(),
  },
  watchProgress: {
    findUnique: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  season: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  movie: {
    findUnique: jest.fn(),
  },
  movieWatch: {
    findUnique: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  userShowSubscription: {
    findMany: jest.fn(),
  },
};

describe('WatchService', () => {
  let service: WatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WatchService>(WatchService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // toggleEpisodeWatched
  // ---------------------------------------------------------------------------

  describe('toggleEpisodeWatched', () => {
    const userId = 'user-1';
    const episodeId = 'ep-1';

    it('deve marcar episodio como assistido quando ainda nao assistido', async () => {
      mockPrisma.episode.findUnique.mockResolvedValue({ id: episodeId });
      mockPrisma.watchProgress.findUnique.mockResolvedValue(null);
      mockPrisma.watchProgress.create.mockResolvedValue({ id: 'progress-1' });

      const result = await service.toggleEpisodeWatched(userId, episodeId);

      expect(result).toEqual({ watched: true });
      expect(mockPrisma.watchProgress.create).toHaveBeenCalledWith({
        data: { userId, episodeId },
      });
    });

    it('deve desmarcar episodio quando ja assistido', async () => {
      mockPrisma.episode.findUnique.mockResolvedValue({ id: episodeId });
      mockPrisma.watchProgress.findUnique.mockResolvedValue({ id: 'progress-1' });
      mockPrisma.watchProgress.delete.mockResolvedValue({ id: 'progress-1' });

      const result = await service.toggleEpisodeWatched(userId, episodeId);

      expect(result).toEqual({ watched: false });
      expect(mockPrisma.watchProgress.delete).toHaveBeenCalledWith({
        where: { id: 'progress-1' },
      });
    });

    it('deve lancar NotFoundException se episodio nao existe', async () => {
      mockPrisma.episode.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleEpisodeWatched(userId, 'nonexistent-ep'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserStats
  // ---------------------------------------------------------------------------

  describe('getUserStats', () => {
    it('deve retornar stats calculadas corretamente, incluindo runtime de filmes assistidos', async () => {
      const userId = 'user-1';

      mockPrisma.watchProgress.count.mockResolvedValue(150);
      mockPrisma.movieWatch.count.mockResolvedValue(20);
      mockPrisma.watchProgress.findMany.mockResolvedValue([
        { episode: { runtime: 25 } },
        { episode: { runtime: 30 } },
        { episode: { runtime: null } }, // usa fallback de 25min
      ]);
      mockPrisma.movieWatch.findMany
        .mockResolvedValueOnce([
          { movie: { runtime: 120 } },
          { movie: { runtime: 95 } },
          { movie: { runtime: null } }, // usa fallback de 120min
        ]);

      const result = await service.getUserStats(userId);

      expect(result.totalEpisodesWatched).toBe(150);
      expect(result.totalMoviesWatched).toBe(20);
      // 25 + 30 + 25 (episódios) + 120 + 95 + 120 (filmes) = 415
      expect(result.totalMinutesWatched).toBe(415);
    });
  });

  // ---------------------------------------------------------------------------
  // markSeasonWatched
  // ---------------------------------------------------------------------------

  describe('markSeasonWatched', () => {
    it('deve criar progresso apenas para episodios nao assistidos', async () => {
      const userId = 'user-1';
      const seasonId = 'season-1';

      mockPrisma.season.findUnique.mockResolvedValue({
        id: seasonId,
        episodes: [
          { id: 'ep-1' },
          { id: 'ep-2' },
          { id: 'ep-3' },
        ],
      });

      // ep-1 ja assistido
      mockPrisma.watchProgress.findMany.mockResolvedValue([
        { episodeId: 'ep-1' },
      ]);

      mockPrisma.watchProgress.createMany.mockResolvedValue({ count: 2 });

      const result = await service.markSeasonWatched(userId, seasonId);

      expect(result.markedCount).toBe(2);
      expect(mockPrisma.watchProgress.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { userId, episodeId: 'ep-2' },
          { userId, episodeId: 'ep-3' },
        ]),
      });
    });

    it('deve lancar NotFoundException se temporada nao existe', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(null);

      await expect(
        service.markSeasonWatched('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
