import Image from 'next/image';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconSearch, IconPlay, IconClapperboard, IconPlus } from '@/components/icons';

interface TmdbMovieItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  runtime?: number;
  genres?: Array<{ name: string }>;
}

async function getTrending() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/trending`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json() as { results: TmdbMovieItem[] };
    return data.results?.slice(0, 10) ?? [];
  } catch {
    return [];
  }
}

const TAB_LABELS = ['FEED', 'DESCOBRIR', 'GRUPOS', 'ATIVIDADE'];

export default async function ExplorarPage() {
  const trending = await getTrending();

  return (
    <div className={styles.container}>
      {/* Barra de busca */}
      <div className={styles.searchBar} role="search">
        <IconSearch className={styles.searchIcon} width={20} height={20} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Pesquisa"
          aria-label="Pesquisar series e filmes"
        />
      </div>

      {/* Abas */}
      <nav className={styles.tabsRow} aria-label="Categorias do explorar">
        {TAB_LABELS.map((label, i) => (
          <button
            key={label}
            className={`${styles.tabPill} ${i === 0 ? styles.tabPillActive : ''}`}
            type="button"
            aria-pressed={i === 0}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Feed de conteudo */}
      <section className={styles.feed} aria-label="Filmes em destaque">
        {trending.map((movie) => {
          const backdropUrl = tmdbImage(movie.backdrop_path ?? movie.poster_path, 'w780');

          return (
            <article key={movie.id} className={styles.feedCard}>
              {/* Imagem */}
              <div className={styles.feedBackdrop}>
                {backdropUrl && (
                  <Image
                    src={backdropUrl}
                    alt={movie.title}
                    fill
                    className={styles.feedBackdropImage}
                    sizes="(max-width: 480px) 100vw, 480px"
                  />
                )}
                <div className={styles.playButton} aria-hidden="true">
                  <IconPlay width={48} height={48} />
                </div>
                <button
                  className={styles.addButton}
                  type="button"
                  aria-label={`Adicionar ${movie.title} a minha lista`}
                >
                  <IconPlus width={16} height={16} />
                </button>
              </div>

              {/* Info */}
              <div className={styles.feedInfo}>
                <div className={styles.feedMeta}>
                  <IconClapperboard
                    className={styles.feedTypeIcon}
                    width={14}
                    height={14}
                  />
                  <h2 className={styles.feedTitle}>{movie.title}</h2>
                </div>
                {movie.runtime && (
                  <p className={styles.feedSubtitle}>
                    {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}min
                    {movie.genres && movie.genres.length > 0 && (
                      <> • {movie.genres.map((g) => g.name).join(', ')}</>
                    )}
                  </p>
                )}
                {movie.overview && (
                  <p className={styles.feedOverview}>{movie.overview}</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
