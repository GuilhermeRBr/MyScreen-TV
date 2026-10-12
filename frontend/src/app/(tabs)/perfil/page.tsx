import styles from './page.module.css';
import Link from 'next/link';
import { IconChevronRight, IconBell, IconClock, IconUser } from '@/components/icons';
import { ProfileMenu } from '@/components/ProfileMenu/ProfileMenu';
import { ProfileHeader } from '@/components/ProfileHeader/ProfileHeader';
import { ProfileMoviesPreview } from '@/components/ProfileMoviesPreview/ProfileMoviesPreview';
import { ProfileSeriesPreview } from '@/components/ProfileSeriesPreview/ProfileSeriesPreview';

// Perfil e stats ficam client-side pois dependem de auth
// Aqui e o shell estatico — dados reais viriam via hook/Client Component
export default function PerfilPage() {
  return (
    <div className={styles.container}>
      {/* Header com backdrop */}
      <header className={styles.header}>
        <div className={styles.backdrop}>
          <div className={styles.topBar}>
            <button className={styles.bellButton} aria-label="Notificações">
              <IconBell width={18} height={18} />
            </button>
            <ProfileMenu />
          </div>
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
          <span className={styles.sectionLink}>
            <IconChevronRight width={16} height={16} />
          </span>
        </div>

        <div className={styles.watchTimeGrid}>
          <div className={styles.watchTimeCard}>
            <div className={styles.watchTimeCardTitle}>
              <IconClock width={14} height={14} />
              Tempo vendo TV
            </div>
            <div className={styles.watchTimeNumbers}>
              <span className={styles.watchTimeBig}>0</span>
              <span className={styles.watchTimeUnit}>HORAS</span>
            </div>
          </div>

          <div className={styles.watchTimeCard}>
            <div className={styles.watchTimeCardTitle}>
              <IconUser width={14} height={14} />
              Episódios assistidos
            </div>
            <div className={styles.watchTimeNumbers}>
              <span className={styles.episodesCount}>0</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* Listas */}
      <section className={styles.section} aria-labelledby="lists-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="lists-title">
            Listas
          </h2>
          <span className={styles.sectionLink}>
            <IconChevronRight width={16} height={16} />
          </span>
        </div>
        <div className={styles.listCarousel} role="list">
          <div
            className={styles.listCard}
            style={{ background: 'var(--color-bg-elevated)' }}
            role="listitem"
          >
            <div className={styles.listCardOverlay}>
              <span className={styles.listCardName}>Minha Lista</span>
            </div>
          </div>
        </div>
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
