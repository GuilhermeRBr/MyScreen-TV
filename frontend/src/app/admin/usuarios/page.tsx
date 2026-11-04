'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from './page.module.css';
import { api, ApiError } from '@/lib/api';
import { IconUser, IconChevronLeft, IconChevronRight } from '@/components/icons';

const PAGE_SIZE = 50;

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

interface PaginatedResponse {
  data: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
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
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get<PaginatedResponse>(
        `/users/admin/list?page=${page}&limit=${PAGE_SIZE}`,
      );
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setCurrentPage(res.page);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os usuários.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  // Busca é client-side dentro da página atual
  const filtered = search.trim()
    ? users.filter((u) => {
        const term = search.toLowerCase();
        return (
          u.username.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.displayName ?? '').toLowerCase().includes(term)
        );
      })
    : users;

  function goToPage(page: number) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <h1 className={styles.heading}>Usuários</h1>
        <span className={styles.count}>
          {loading ? '—' : `${total} no total`}
        </span>
      </div>

      <div className={styles.searchWrapper}>
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Filtrar por nome, usuário ou e-mail nesta página"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Filtrar usuários"
        />
      </div>

      {loading && (
        <ul className={styles.list} aria-label="Carregando usuários">
          {Array.from({ length: 8 }).map((_, i) => (
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
        <>
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

          {/* Paginação — só mostra se não está filtrando */}
          {!search.trim() && totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Paginação de usuários">
              <span className={styles.paginationInfo}>
                {startIndex}–{endIndex} de {total}
              </span>

              <div className={styles.paginationControls}>
                <button
                  className={styles.pageButton}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <IconChevronLeft width={16} height={16} />
                </button>

                <span className={styles.pageIndicator}>
                  {currentPage} / {totalPages}
                </span>

                <button
                  className={styles.pageButton}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                >
                  <IconChevronRight width={16} height={16} />
                </button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
