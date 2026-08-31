export interface TmdbShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  status: string;
  networks: Array<{ name: string }>;
  genres: Array<{ id: number; name: string }>;
  vote_average: number;
  vote_count: number;
  episode_run_time: number[];
  seasons: TmdbSeasonSummary[];
}

export interface TmdbSeasonSummary {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episode_count: number;
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
  episodes: TmdbEpisode[];
}

export interface TmdbEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  vote_average: number;
  vote_count: number;
}

export interface TmdbCredits {
  cast: TmdbCastMember[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  character: string;
  order: number;
}

export interface TmdbSearchResult<T> {
  results: T[];
  total_results: number;
  total_pages: number;
  page: number;
}

export interface TmdbShowSearchItem {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
}

export interface TmdbMovieSearchItem {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
}
