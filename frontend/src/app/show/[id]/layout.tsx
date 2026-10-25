import Image from 'next/image';
import { notFound } from 'next/navigation';
import styles from './layout.module.css';
import { tmdbImage } from '@/lib/tmdb-image';
import { IconDots } from '@/components/icons';
import { BackButton } from '@/components/BackButton/BackButton';
import { ShowTabs } from '@/components/ShowTabs/ShowTabs';

interface Show {
  id: number;
  name: string;
  backdrop_path: string | null;
  number_of_seasons?: number;
  status?: string;
  networks?: Array<{ name: string }>;
  vote_average?: number;
}

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

export default async function ShowLayout({
  children,
  params,
  searchParams,
}: {
  children: React.ReactNode;
  params: { id: string };
  searchParams?: { from?: string };
}) {
  const show = await getShow(params.id);

  if (!show) {
    notFound();
  }

  const backdropUrl = tmdbImage(show.backdrop_path, 'w780');
  const rating = show.vote_average
    ? Math.round(show.vote_average * 10) / 10
    : null;

  const from = searchParams?.from ?? null;

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
          <BackButton fallbackHref="/series" from={from} label="Voltar" />
          <span className={styles.showTitle}>{show.name}</span>
          <button className={styles.backButton} aria-label="Mais opções">
            <IconDots width={20} height={20} />
          </button>
        </div>

        {/* Linha de progresso amarela no topo */}
        <div
          className={styles.progressLine}
          style={{ width: '100%' }}
          aria-hidden="true"
        />
      </div>

      {/* Meta */}
      <div className={styles.meta}>
        {show.number_of_seasons !== undefined && (
          <>
            <span>{show.number_of_seasons} temporadas</span>
            <span className={styles.metaSeparator}>•</span>
          </>
        )}
        {show.status && (
          <>
            <span>{show.status === 'Ended' ? 'Encerrada' : show.status}</span>
            <span className={styles.metaSeparator}>•</span>
          </>
        )}
        {show.networks?.[0]?.name && (
          <>
            <span>{show.networks[0].name}</span>
          </>
        )}
        {rating && (
          <span
            className={styles.ratingBadge}
            aria-label={`Avaliacao: ${rating}`}
          >
            T {rating}%
          </span>
        )}
      </div>

      {/* Tabs */}
      <ShowTabs showId={String(params.id)} from={from} />

      {children}
    </div>
  );
}
