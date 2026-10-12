import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconStar, IconClock, IconUser } from '@/components/icons';
import { AddToSubscriptionButton } from '@/components/AddToSubscriptionButton/AddToSubscriptionButton';
import { serverFetch } from '@/lib/server-fetch';

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
  cast: Array<{
    id: string;
    name: string;
    profilePath: string | null;
    character: string | null;
  }>;
}

type ShowStatus =
  | 'WATCHING'
  | 'REWATCHING'
  | 'PAUSED'
  | 'STOPPED'
  | 'PLAN_TO_WATCH'
  | 'NOT_WATCHING_FOR_A_WHILE'
  | null;

async function getShowDetail(id: string): Promise<ShowDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/shows/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json() as Promise<ShowDetail>;
  } catch {
    return null;
  }
}

async function getShowSubscriptionStatus(showInternalId: string): Promise<ShowStatus> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await serverFetch(
      `${apiUrl}/watch/shows/${showInternalId}/subscription`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;
    const data = (await res.json()) as { status: ShowStatus };
    return data.status;
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
        style={{
          opacity: i <= rating ? 1 : 0.25,
        }}
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

  const subscriptionStatus = await getShowSubscriptionStatus(show.id);

  const firstYear = formatYear(show.firstAirDate);
  const lastYear = formatYear(show.lastAirDate);
  const ratingDisplay = `${(show.voteAverage / 2).toFixed(1)}/5`;

  return (
    <div className={styles.container}>
      <div className={styles.actions}>
        <AddToSubscriptionButton
          showId={show.id}
          initialStatus={subscriptionStatus}
        />
      </div>

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
              <span>{show.episodeRuntime} min</span>
            </div>
          )}
        </div>

        <div className={styles.usersCount}>
          <IconUser width={14} height={14} />
          <span>Dados fornecidos pelo TMDB</span>
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

      {/* Atribuição TMDB obrigatória */}
      <div className={styles.tmdbAttribution} role="contentinfo">
        <span className={styles.tmdbLogo}>TMDB</span>
        <span>
          Este produto usa a API do TMDB mas não é endossado ou certificado pelo
          TMDB.
        </span>
      </div>
    </div>
  );
}
