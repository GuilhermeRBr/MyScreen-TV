import Image from 'next/image';
import Link from 'next/link';
import styles from './PosterCard.module.css';
import { tmdbImage } from '@/lib/tmdb-image';

interface PosterCardProps {
  title: string;
  posterPath: string | null;
  href: string;
  progressPercent?: number;
}

export function PosterCard({
  title,
  posterPath,
  href,
  progressPercent,
}: PosterCardProps) {
  const imageUrl = tmdbImage(posterPath, 'w342');

  return (
    <Link href={href} className={styles.card} aria-label={title}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 480px) 33vw, (max-width: 768px) 20vw, (max-width: 1024px) 17vw, 160px"
          className={styles.image}
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true">
          {title}
        </div>
      )}

      {progressPercent !== undefined && (
        <div className={styles.progressBar} aria-hidden="true">
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      )}
    </Link>
  );
}
