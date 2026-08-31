'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';
import { IconTv, IconFilm, IconSearch, IconUser } from '@/components/icons';

const NAV_ITEMS = [
  { href: '/series', label: 'Séries', Icon: IconTv },
  { href: '/filmes', label: 'Filmes', Icon: IconFilm },
  { href: '/explorar', label: 'Explorar', Icon: IconSearch },
  { href: '/perfil', label: 'Perfil', Icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const isActive =
          pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon width={24} height={24} />
            <span className={styles.label}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
