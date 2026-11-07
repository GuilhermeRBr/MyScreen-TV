import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './layout.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconDots } from '@/components/icons';
import { BackButton } from '@/components/BackButton/BackButton';
import { ShowTabs } from '@/components/ShowTabs/ShowTabs';
import { AddToSubscriptionButton } from '@/components/AddToSubscriptionButton/AddToSubscriptionButton';
import { serverFetch } from '@/lib/server-fetch';

interface Show {
  id: string;
  name: string;
  backdropPath: string | null;
  number_of_seasons?: number;
  numberOfSeasons?: number;
  status?: string;
  networks?: Array<{ name: string }>;
  network?: string | null;
  voteAverage?: number;
}

type ShowStatus =
  | 'WATCHING'
  | 'REWATCHING'
  | 'PAUSED'
  | 'STOPPED'
  | 'PLAN_TO_WATCH'
  | 'NOT_WATCHING_FOR_A_WHILE'
  | null;

async function getShow(id: string): Promise<Show | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/shows/${id}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json() as Promise<Show>;
  } catch {
    return null;
  }
}

async function getSubscriptionStatus(showId: string): Promise<ShowStatus> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await serverFetch(
      `${apiUrl}/watch/shows/${showId}/subscription`,
      { cache: 'no-store' },
    );

    if (!res.ok) return null;
    const data = (await res.json()) as { status: ShowStatus };
    return data.status;
  } catch {
    return null;
  }
}

export default async function ShowLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const show = await getShow(params.id);

  if (!show) {
    notFound();
  }

  const subscriptionStatus = await getSubscriptionStatus(show.id);

  const backdropUrl = tmdbImage(show.backdropPath, 'w780');
  const rating = show.voteAverage
    ? Math.round(show.voteAverage * 10) / 10
    : null;

  return (
    <div className="page-container">
      {/* Backdrop */}
      <div className={styles.backdrop}>
        {backdropUrl && (
          <Image
            src={backdropUrl}
            alt={show.name}
            fill
            className={styles.backdropImage}
            sizes="(max-width: 480px) 100vw, (max-width: 1024px) 100vw, 960px"
            priority
          />
        )}
        <div className={styles.backdropOverlay} />

        {/* Barra topo */}
        <div className={styles.topBar}>
          <BackButton fallbackHref="/series" label="Voltar" />
          <span className={styles.showTitle}>{show.name}</span>
          <button className={styles.backButton} aria-label="Mais opções">
            <IconDots width={20} height={20} />
          </button>
        </div>

        {/* Linha de progresso no fundo do backdrop */}
        <div
          className={styles.progressLine}
          style={{ width: '100%' }}
          aria-hidden="true"
        />

        {/* Botão de lista — sobreposto à linha, canto direito */}
        <div className={styles.subscribeButtonWrapper}>
          <AddToSubscriptionButton
            showId={show.id}
            initialStatus={subscriptionStatus}
          />
        </div>
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        <div className={styles.metaInfo}>
          {show.status && (
            <>
              <span>{show.status === 'Ended' ? 'Encerrada' : show.status}</span>
              <span className={styles.metaSeparator}>•</span>
            </>
          )}
          {show.network && (
            <span>{show.network}</span>
          )}
          {rating && (
            <span
              className={styles.ratingBadge}
              aria-label={`Avaliação: ${rating}`}
            >
              T {rating}%
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <ShowTabs showId={String(params.id)} />

      {children}
    </div>
  );
}
