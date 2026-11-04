import styles from './page.module.css';
import Link from 'next/link';
import { IconChevronRight, IconBell } from '@/components/icons';
import { ProfileMenu } from '@/components/ProfileMenu/ProfileMenu';
import { ProfileHeader } from '@/components/ProfileHeader/ProfileHeader';
import { ProfileBanner } from '@/components/ProfileBanner/ProfileBanner';
import { ProfileStats } from '@/components/ProfileStats/ProfileStats';
import { ProfileMoviesPreview } from '@/components/ProfileMoviesPreview/ProfileMoviesPreview';
import { ProfileSeriesPreview } from '@/components/ProfileSeriesPreview/ProfileSeriesPreview';
import { ProfileRecentlyWatched } from '@/components/ProfileRecentlyWatched/ProfileRecentlyWatched';

export const dynamic = 'force-dynamic';

// Perfil e stats ficam client-side pois dependem de auth
// Aqui e o shell estatico — dados reais viriam via hook/Client Component
export default function PerfilPage() {
  return (
    <div className={styles.container}>
      {/* Header com backdrop */}
      <header className={styles.header}>
        <div className={styles.backdrop}>
          <ProfileBanner />
        </div>

        {/* topBar fica fora do backdrop para o dropdown do menu não ser cortado */}
        <div className={styles.topBar}>
          <button className={styles.bellButton} aria-label="Notificações">
            <IconBell width={18} height={18} />
          </button>
          <ProfileMenu />
        </div>

        {/* Avatar + nome + username */}
        <div className={styles.profileSection}>
          <ProfileHeader />
        </div>
      </header>



      {/* Estatísticas */}
      <section className={styles.section} aria-labelledby="stats-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="stats-title">
            Estatísticas
          </h2>
          <Link href="/perfil/estatisticas" className={styles.sectionLink} aria-label="Ver todas as estatísticas">
            <IconChevronRight width={16} height={16} />
          </Link>
        </div>

        <ProfileStats />
      </section>

      <div className={styles.divider} />

      {/* Visto por último */}
      <section className={styles.section} aria-labelledby="recently-watched-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="recently-watched-title">
            Visto por último
          </h2>
        </div>
        <ProfileRecentlyWatched />
      </section>

      <div className={styles.divider} />

      {/* Séries */}
      <section className={styles.section} aria-labelledby="shows-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="shows-title">
            Séries
          </h2>
          <Link href="/perfil/series" className={styles.sectionLink} aria-label="Ver todas as séries">
            <IconChevronRight width={16} height={16} />
          </Link>
        </div>
        <ProfileSeriesPreview />
      </section>

      <div className={styles.divider} />

      {/* Filmes */}
      <section className={styles.section} aria-labelledby="movies-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="movies-title">
            Filmes
          </h2>
          <Link href="/perfil/filmes" className={styles.sectionLink} aria-label="Ver todos os filmes">
            <IconChevronRight width={16} height={16} />
          </Link>
        </div>
        <ProfileMoviesPreview />
      </section>

      {/* Atribuição TMDB */}
      <div className={styles.tmdbAttribution} role="contentinfo">
        <span className={styles.tmdbLogo}>TMDB</span>
        <span>
          Este produto usa a API do TMDB, mas não é endossado ou certificado pelo
          TMDB.
        </span>
      </div>
    </div>
  );
}
