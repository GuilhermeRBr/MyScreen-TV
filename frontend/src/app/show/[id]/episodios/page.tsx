import { notFound } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconCheck, IconChevronDown } from '@/components/icons';

interface Season {
  id: string;
  seasonNumber: number;
  name: string;
  episodeCount: number;
  episodes: Episode[];
  watchedCount?: number;
}

interface Episode {
  id: string;
  episodeNumber: number;
  name: string;
  stillPath: string | null;
  watched?: boolean;
}

async function getSeasons(showId: string): Promise<Season[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/shows/${showId}/seasons`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const seasons = await res.json() as Season[];

    // Busca episodios da primeira temporada para o "continuar acompanhando"
    const withEpisodes = await Promise.all(
      seasons.slice(0, 1).map(async (season) => {
        const epRes = await fetch(
          `${apiUrl}/shows/${showId}/seasons/${season.seasonNumber}/episodes`,
          { next: { revalidate: 3600 } },
        );

        if (!epRes.ok) return { ...season, episodes: [] };

        const data = await epRes.json() as { episodes: Episode[] };
        return { ...season, episodes: data.episodes ?? [] };
      }),
    );

    return seasons.map((s, i) => withEpisodes[i] ?? { ...s, episodes: [] });
  } catch {
    return [];
  }
}

export default async function EpisodiosPage({
  params,
}: {
  params: { id: string };
}) {
  const seasons = await getSeasons(params.id);

  if (seasons.length === 0) {
    notFound();
  }

  // Primeiro episodio nao assistido para "continuar acompanhando"
  const continueEpisode = seasons[0]?.episodes?.[0];

  return (
    <div className={styles.container}>
      {/* Continuar acompanhando */}
      {continueEpisode && (
        <section className={styles.continueSection}>
          <h2 className={styles.continueSectionTitle}>
            Continuar acompanhando
          </h2>
          <div className={styles.continueScroll}>
            <div className={styles.continueCard}>
              <div className={styles.continueStill}>
                {continueEpisode.stillPath ? (
                  <Image
                    src={tmdbImage(continueEpisode.stillPath, 'w185') ?? ''}
                    alt={continueEpisode.name}
                    fill
                    className={styles.continueStillImage}
                  />
                ) : null}
              </div>
              <div className={styles.continueInfo}>
                <p className={styles.continueCode}>
                  T01 | E{String(continueEpisode.episodeNumber).padStart(2, '0')}
                </p>
                <p className={styles.continueName}>{continueEpisode.name}</p>
              </div>
              <div
                className={`${styles.checkCircle} ${continueEpisode.watched ? styles.checkCircleWatched : ''}`}
                aria-label={
                  continueEpisode.watched ? 'Assistido' : 'Marcar como assistido'
                }
              >
                <IconCheck width={14} height={14} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Todos os episodios */}
      <section className={styles.allEpisodesSection}>
        <div className={styles.allEpisodesHeader}>
          <h2 className={styles.allEpisodesTitle}>Todos os episodios</h2>
          <div
            className={styles.checkCircle}
            aria-label="Marcar todos como assistidos"
            role="button"
            tabIndex={0}
          >
            <IconCheck width={14} height={14} />
          </div>
        </div>

        <div className={styles.seasonAccordion} role="list">
          {seasons.map((season) => {
            const watched = season.watchedCount ?? 0;
            const total = season.episodeCount;
            const percent = total > 0 ? (watched / total) * 100 : 0;
            const isComplete = total > 0 && watched === total;

            return (
              <div key={season.id} role="listitem">
                <button
                  className={styles.seasonRow}
                  aria-expanded="false"
                  aria-label={`${season.name}, ${watched} de ${total} episodios assistidos`}
                >
                  <span className={styles.seasonName}>{season.name}</span>
                  <span className={styles.seasonCount}>
                    {watched}/{total}
                  </span>
                  {isComplete ? (
                    <div className={styles.seasonCheckCircle} aria-hidden="true">
                      <IconCheck width={14} height={14} />
                    </div>
                  ) : (
                    <IconChevronDown
                      width={20}
                      height={20}
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                  )}
                </button>
                {/* Barra de progresso por temporada */}
                <div className={styles.progressBarSeason} aria-hidden="true">
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
