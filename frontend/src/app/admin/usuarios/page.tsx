'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { api, ApiError } from '@/lib/api';
import { IconUser } from '@/components/icons';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  lastLoginAt: string | null;
  createdAt: string;
}

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  USER: 'Usuário',
  MODERATOR: 'Moderador',
  ADMIN: 'Admin',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<AdminUser[]>('/users/admin/list');
        setUsers(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Não foi possível carregar os usuários.');
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      u.username.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.displayName ?? '').toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <h1 className={styles.heading}>Usuários</h1>
        <span className={styles.count}>
          {loading ? '—' : `${filtered.length} de ${users.length}`}
        </span>
      </div>

      <div className={styles.searchWrapper}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar por nome, usuário ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar usuários"
        />
      </div>

      {loading && (
        <ul className={styles.list} aria-label="Carregando usuários">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className={styles.skeletonRow} aria-hidden="true" />
          ))}
        </ul>
      )}

      {!loading && error && (
        <p className={styles.errorMessage} role="alert">{error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className={styles.emptyMessage}>Nenhum usuário encontrado.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className={styles.list} aria-label="Lista de usuários">
          {filtered.map((user) => (
            <li key={user.id} className={styles.row}>
              <div className={styles.avatar} aria-hidden="true">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className={styles.avatarImage}
                  />
                ) : (
                  <IconUser width={20} height={20} />
                )}
              </div>

              <div className={styles.info}>
                <span className={styles.displayName}>
                  {user.displayName ?? user.username}
                </span>
                <span className={styles.username}>@{user.username}</span>
                <span className={styles.email}>{user.email}</span>
              </div>

              <div className={styles.meta}>
                <span
                  className={`${styles.roleBadge} ${styles[`role${user.role}`]}`}
                >
                  {ROLE_LABEL[user.role]}
                </span>
                <span className={styles.date}>
                  Cadastro: {formatDate(user.createdAt)}
                </span>
                <span className={styles.date}>
                  Último acesso: {formatDate(user.lastLoginAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
