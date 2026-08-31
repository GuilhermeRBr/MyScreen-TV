import { Test, TestingModule } from '@nestjs/testing';
import { TmdbService } from './tmdb.service';
import { TmdbClient } from './tmdb.client';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  show: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  season: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
  episode: {
    upsert: jest.fn(),
  },
  cast: {
    upsert: jest.fn(),
  },
  showCast: {
    upsert: jest.fn(),
  },
  movie: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
};

const mockTmdbShow = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  overview: 'Um professor de quimica...',
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
  first_air_date: '2008-01-20',
  last_air_date: '2013-09-29',
  status: 'Ended',
  networks: [{ name: 'AMC' }],
  genres: [{ id: 18, name: 'Drama' }],
  vote_average: 8.9,
  vote_count: 12000,
  episode_run_time: [47],
  seasons: [
    {
      id: 3572,
      season_number: 1,
      name: 'Temporada 1',
      overview: '',
      poster_path: null,
      air_date: '2008-01-20',
      episode_count: 7,
    },
  ],
};

const mockCredits = { cast: [] };

const mockTmdbClient = {
  getShow: jest.fn().mockResolvedValue(mockTmdbShow),
  getShowCredits: jest.fn().mockResolvedValue(mockCredits),
  getSeason: jest.fn().mockResolvedValue({
    id: 3572,
    season_number: 1,
    name: 'Temporada 1',
    overview: '',
    poster_path: null,
    air_date: '2008-01-20',
    episodes: [],
  }),
  getMovie: jest.fn(),
};

describe('TmdbService', () => {
  let service: TmdbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TmdbService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TmdbClient, useValue: mockTmdbClient },
      ],
    }).compile();

    service = module.get<TmdbService>(TmdbService);
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // upsertShow
  // ---------------------------------------------------------------------------

  describe('upsertShow', () => {
    it('deve buscar da TMDB quando show nao existe no banco', async () => {
      mockPrisma.show.findUnique.mockResolvedValue(null);
      mockPrisma.show.upsert.mockResolvedValue({ id: 'show-uuid', tmdbId: 1396, name: 'Breaking Bad' });
      mockPrisma.season.findFirst.mockResolvedValue(null);
      mockPrisma.season.upsert.mockResolvedValue({ id: 'season-uuid' });

      await service.upsertShow(1396);

      expect(mockTmdbClient.getShow).toHaveBeenCalledWith(1396);
      expect(mockPrisma.show.upsert).toHaveBeenCalledTimes(1);
    });

    it('deve usar cache e nao chamar a TMDB se lastSyncedAt for recente', async () => {
      const recentDate = new Date(); // agora = cache fresco
      mockPrisma.show.findUnique.mockResolvedValue({
        id: 'show-uuid',
        tmdbId: 1396,
        name: 'Breaking Bad',
        lastSyncedAt: recentDate,
      });

      await service.upsertShow(1396);

      expect(mockTmdbClient.getShow).not.toHaveBeenCalled();
    });

    it('deve sincronizar novamente se cache estiver expirado', async () => {
      // Data mais antiga que 6 meses
      const oldDate = new Date('2020-01-01');
      mockPrisma.show.findUnique.mockResolvedValue({
        id: 'show-uuid',
        tmdbId: 1396,
        name: 'Breaking Bad',
        lastSyncedAt: oldDate,
      });

      mockPrisma.show.upsert.mockResolvedValue({
        id: 'show-uuid',
        tmdbId: 1396,
        name: 'Breaking Bad',
      });
      mockPrisma.season.findFirst.mockResolvedValue(null);
      mockPrisma.season.upsert.mockResolvedValue({ id: 'season-uuid' });

      await service.upsertShow(1396);

      expect(mockTmdbClient.getShow).toHaveBeenCalledWith(1396);
    });
  });

  // ---------------------------------------------------------------------------
  // upsertMovie
  // ---------------------------------------------------------------------------

  describe('upsertMovie', () => {
    const mockTmdbMovie = {
      id: 550,
      title: 'Fight Club',
      original_title: 'Fight Club',
      overview: 'Um trabalhador insatisfeito...',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdrop_path: null,
      release_date: '1999-10-15',
      runtime: 139,
      genres: [{ id: 18, name: 'Drama' }],
      vote_average: 8.4,
      vote_count: 26000,
    };

    it('deve buscar da TMDB quando filme nao existe no banco', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue(null);
      mockPrisma.movie.upsert.mockResolvedValue({ id: 'movie-uuid', tmdbId: 550 });
      mockTmdbClient.getMovie.mockResolvedValue(mockTmdbMovie);

      await service.upsertMovie(550);

      expect(mockTmdbClient.getMovie).toHaveBeenCalledWith(550);
      expect(mockPrisma.movie.upsert).toHaveBeenCalledTimes(1);
    });

    it('deve retornar do cache quando lastSyncedAt for recente', async () => {
      mockPrisma.movie.findUnique.mockResolvedValue({
        id: 'movie-uuid',
        tmdbId: 550,
        title: 'Fight Club',
        lastSyncedAt: new Date(),
      });

      await service.upsertMovie(550);

      expect(mockTmdbClient.getMovie).not.toHaveBeenCalled();
    });
  });
});
