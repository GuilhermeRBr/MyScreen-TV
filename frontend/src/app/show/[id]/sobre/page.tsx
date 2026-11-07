import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconStar, IconClock, IconUser, IconLayers, IconFilmStrip } from '@/components/icons';

interface ShowDetail {
  id: string;
  tmdbId: number;
  name: string;
  overview: string | null;
  firstAirDate: string | null;
  lastAirDate: string | null;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  episodeRuntime: number | null;
  numberOfSeasons: number;
  numberOfEpisodes: number;
  cast: Array<{
    id: string;
    name: string;
    profilePath: string | null;
    character: string | null;
  }>;
}

async function getShowDetail(id: string): Promise<ShowDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/shows/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json() as Promise<ShowDetail>;
  } catch {
    return null;
  }
}

function formatYear(date: string | null): string {
  if (!date) return '?';
  return new Date(date).getFullYear().toString();
}

function renderStars(average: number) {
  const rating = Math.round((average / 2) * 2) / 2;
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <IconStar
        key={i}
        width={14}
        height={14}
        style={{ opacity: i <= rating ? 1 : 0.25 }}
      />,
    );
  }

  return stars;
}

export default async function SobrePage({
  params,
}: {
  params: { id: string };
}) {
  const show = await getShowDetail(params.id);

  if (!show) {
    notFound();
  }

  const firstYear = formatYear(show.firstAirDate);
  const lastYear = formatYear(show.lastAirDate);
  const ratingDisplay = `${(show.voteAverage / 2).toFixed(1)}/5`;

  return (
    <div className={styles.container}>
      {/* Informações principais */}
      <section className={styles.infoBlock} aria-labelledby="info-title">
        <h2 className={styles.infoTitle} id="info-title">
          Informações da série
        </h2>

        <p className={styles.infoDates}>
          {firstYear} - {lastYear}
          {show.genres.length > 0 && ` • ${show.genres.slice(0, 3).join(', ')}`}
        </p>

        <div className={styles.ratingRow}>
          <span className={styles.ratingIcon} aria-hidden="true">
            T
          </span>
          <div className={styles.stars} aria-hidden="true">
            {renderStars(show.voteAverage)}
          </div>
          <span className={styles.ratingValue} aria-label={`Avaliação: ${ratingDisplay}`}>
            {ratingDisplay}
          </span>
        </div>

        {show.overview && (
          <p className={styles.overview}>{show.overview}</p>
        )}

        <div className={styles.metaRow}>
          {show.episodeRuntime && (
            <div className={styles.metaItem}>
              <IconClock width={16} height={16} />
              <span>{show.episodeRuntime} min / ep.</span>
            </div>
          )}
          {show.numberOfSeasons > 0 && (
            <div className={styles.metaItem}>
              <IconLayers width={16} height={16} />
              <span>
                {show.numberOfSeasons}{' '}
                {show.numberOfSeasons === 1 ? 'temporada' : 'temporadas'}
              </span>
            </div>
          )}
          {show.numberOfEpisodes > 0 && (
            <div className={styles.metaItem}>
              <IconFilmStrip width={16} height={16} />
              <span>
                {show.numberOfEpisodes}{' '}
                {show.numberOfEpisodes === 1 ? 'episódio' : 'episódios'}
              </span>
            </div>
          )}
        </div>

      </section>

      {/* Elenco */}
      {show.cast.length > 0 && (
        <section aria-labelledby="cast-title">
          <h2 className={styles.sectionTitle} id="cast-title">
            Elenco
          </h2>
          <ul className={styles.castList} role="list">
            {show.cast.map((member) => {
              const profileUrl = tmdbImage(member.profilePath, 'w92');

              return (
                <li key={member.id} className={styles.castItem}>
                  <div className={styles.castAvatar}>
                    {profileUrl ? (
                      <Image
                        src={profileUrl}
                        alt={member.name}
                        width={44}
                        height={44}
                        className={styles.castAvatarImage}
                      />
                    ) : (
                      <IconUser
                        width={24}
                        height={24}
                        style={{
                          margin: '10px',
                          color: 'var(--color-text-muted)',
                        }}
                      />
                    )}
                  </div>
                  <div className={styles.castInfo}>
                    <span className={styles.castName}>{member.name}</span>
                    {member.character && (
                      <span className={styles.castCharacter}>
                        {member.character}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

    </div>
  );
}
