'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { api, ApiError } from '@/lib/api';
import { tmdbImage } from '@/lib/tmdb-image';
import styles from './ProfileBanner.module.css';

interface BannerImage {
  backdropPath: string;
}

// Tempo (ms) que cada imagem fica visível antes de trocar
const SLIDE_INTERVAL_MS = 4000;

// Embaralha o array sem modificar o original
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function ProfileBanner() {
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .get<BannerImage[]>('/users/me/banner-images')
      .then((data) => {
        if (cancelled) return;

        const urls = shuffle(data)
          .map((item) => tmdbImage(item.backdropPath, 'w780'))
          .filter((url): url is string => url !== null);

        setImages(urls);
      })
      .catch((err: unknown) => {
        // 401 é esperado quando o usuário ainda não autenticou — silencia
        if (!(err instanceof ApiError && err.status === 401)) {
          setImages([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [images]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className={styles.banner} aria-hidden="true">
      {images.map((url, index) => (
        <div
          key={url}
          className={`${styles.slide} ${index === activeIndex ? styles.slideActive : ''}`}
        >
          <Image
            src={url}
            alt=""
            fill
            sizes="100vw"
            className={styles.image}
            priority={index === 0}
          />
        </div>
      ))}
      <div className={styles.overlay} />
    </div>
  );
}
