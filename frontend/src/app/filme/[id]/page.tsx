import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { IconStar, IconClock, IconUser } from '@/components/icons';
import { tmdbImage } from '@/lib/tmdb-image';

interface CastMember {
  id: string;
  name: string;
  profilePath: string | null;
  character: string | null;
}

interface MovieDetail {
  id: string;
  tmdbId: number;
  title: string;
  overview: string | null;
  releaseDate: string | null;
  runtime: number | null;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  cast: CastMember[];
}

async function getMovieDetail(id: string): Promise<MovieDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/movies/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json() as Promise<MovieDetail>;
  } catch {
    return null;
  }
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

export default async function FilmePage({
  params,
}: {
  params: { id: string };
}) {
  const movie = await getMovieDetail(params.id);

  if (!movie) {
    notFound();
  }

  const releaseYear = movie.releaseDate
    ? new Date(movie.releaseDate).getFullYear()
    : null;

  const ratingDisplay = `${(movie.voteAverage / 2).toFixed(1)}/5`;

  return (
    <div className={styles.container}>
      <section className={styles.infoBlock} aria-labelledby="info-title">
        <h2 className={styles.infoTitle} id="info-title">
          Informações do filme
        </h2>

        <p className={styles.infoDates}>
          {releaseYear ?? '?'}
          {movie.genres.length > 0 &&
            ` • ${movie.genres.slice(0, 3).join(', ')}`}
        </p>

        <div className={styles.ratingRow}>
          <span className={styles.ratingIcon} aria-hidden="true">
            T
          </span>
          <div className={styles.stars} aria-hidden="true">
            {renderStars(movie.voteAverage)}
          </div>
          <span
            className={styles.ratingValue}
            aria-label={`Avaliação: ${ratingDisplay}`}
          >
            {ratingDisplay}
          </span>
        </div>

        {movie.overview && (
          <p className={styles.overview}>{movie.overview}</p>
        )}

        {movie.runtime && (
          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <IconClock width={16} height={16} />
              <span>{movie.runtime} min</span>
            </div>
          </div>
        )}
      </section>

      {/* Elenco */}
      {movie.cast.length > 0 && (
        <section aria-labelledby="cast-title">
          <h2 className={styles.sectionTitle} id="cast-title">
            Elenco
          </h2>
          <ul className={styles.castList} role="list">
            {movie.cast.map((member) => {
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
