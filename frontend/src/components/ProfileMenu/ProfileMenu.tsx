'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconDots } from '@/components/icons';
import { api } from '@/lib/api';
import styles from './ProfileMenu.module.css';

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fecha o menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Fecha com Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    try {
      await api.post('/auth/logout');
    } catch {
      // Mesmo se o endpoint falhar, limpa a sessão do lado do cliente
    } finally {
      router.push('/login');
    }
  }

  return (
    <div ref={menuRef} className={styles.wrapper}>
      <button
        className={styles.trigger}
        aria-label="Mais opções"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <IconDots width={20} height={20} />
      </button>

      {open && (
        <div
          className={styles.menu}
          role="menu"
          aria-label="Opções do perfil"
        >
          <button
            className={`${styles.menuItem} ${styles.menuItemDanger}`}
            role="menuitem"
            onClick={handleLogout}
            disabled={loading}
          >
            <IconSignOut width={16} height={16} />
            {loading ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      )}
    </div>
  );
}

// Ícone de logout inline — sem emoji, SVG próprio
function IconSignOut(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
