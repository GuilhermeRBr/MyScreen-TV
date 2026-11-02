import styles from './loading.module.css';
import { IconSearch } from '@/components/icons';

// Exibido instantaneamente pelo Next.js enquanto o Server Component carrega.
// Imita a estrutura visual da página para eliminar a piscada preta na navegação.
export default function ExplorarLoading() {
  return (
    <div className={styles.container}>
      {/* Barra de busca esqueleto */}
      <div className={styles.searchBar}>
        <IconSearch className={styles.searchIcon} width={20} height={20} />
        <div className={styles.searchInputSkeleton} />
      </div>

      {/* Grid de posters esqueleto */}
      <div className={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.poster} />
            <div className={styles.titleLine} />
            <div className={styles.subtitleLine} />
          </div>
        ))}
      </div>
    </div>
  );
}
