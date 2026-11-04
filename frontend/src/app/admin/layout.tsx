import styles from './layout.module.css';
import Link from 'next/link';
import { IconChevronLeft, IconUser } from '@/components/icons';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/perfil" className={styles.backLink} aria-label="Voltar ao perfil">
          <IconChevronLeft width={20} height={20} />
        </Link>
        <span className={styles.title}>Painel administrativo</span>
      </header>

      <nav className={styles.nav} aria-label="Navegação administrativa">
        <Link href="/admin/usuarios" className={styles.navItem}>
          <IconUser width={18} height={18} />
          Usuários
        </Link>
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
