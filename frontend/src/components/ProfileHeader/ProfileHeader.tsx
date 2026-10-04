'use client';

import { useEffect, useState } from 'react';
import { IconUser } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import styles from './ProfileHeader.module.css';

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  _count: {
    following: number;
    followers: number;
  };
}

interface ProfileHeaderProps {
  onDataLoaded?: (profile: UserProfile) => void;
}

export function ProfileHeader({ onDataLoaded }: ProfileHeaderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<UserProfile>('/users/me')
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        onDataLoaded?.(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (!(err instanceof ApiError && err.status === 401)) {
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onDataLoaded]);

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.avatarSkeleton} aria-hidden="true" />
        <div className={styles.infoSkeleton}>
          <div className={styles.nameSkeleton} />
          <div className={styles.usernameSkeleton} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.avatar} aria-label="Avatar">
          <IconUser
            width={36}
            height={36}
            style={{ margin: '14px', color: 'var(--color-text-muted)' }}
          />
        </div>
        <div className={styles.info}>
          <span className={styles.displayName}>Meu perfil</span>
        </div>
      </div>
    );
  }

  const name = profile.displayName ?? profile.username;

  return (
    <div className={styles.wrapper}>
      <div className={styles.avatar} aria-label={`Avatar de ${name}`}>
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatarUrl}
            alt={`Avatar de ${name}`}
            className={styles.avatarImage}
          />
        ) : (
          <IconUser
            width={36}
            height={36}
            style={{ margin: '14px', color: 'var(--color-text-muted)' }}
          />
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          <span className={styles.displayName}>{name}</span>
          <span className={styles.editBadge}>EDITAR</span>
        </div>
        {profile.displayName && (
          <span className={styles.username}>@{profile.username}</span>
        )}
      </div>
    </div>
  );
}
