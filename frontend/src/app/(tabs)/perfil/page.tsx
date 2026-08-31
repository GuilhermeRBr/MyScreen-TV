import styles from './page.module.css';
import { IconChevronRight, IconBell, IconDots, IconClock, IconUser } from '@/components/icons';

// Perfil e stats ficam client-side pois dependem de auth
// Aqui e o shell estatico — dados reais viriam via hook/Client Component
export default function PerfilPage() {
  return (
    <div className={styles.container}>
      {/* Header com backdrop */}
      <header className={styles.header}>
        <div className={styles.backdrop}>
          <div className={styles.topBar}>
            <button className={styles.bellButton} aria-label="Notificacoes">
              <IconBell width={18} height={18} />
            </button>
            <button aria-label="Mais opcoes" style={{ color: 'white' }}>
              <IconDots width={20} height={20} />
            </button>
          </div>
        </div>

        {/* Avatar + nome */}
        <div className={styles.profileSection}>
          <div className={styles.avatar}>
            <IconUser
              width={36}
              height={36}
              style={{
                margin: '14px',
                color: 'var(--color-text-muted)',
              }}
            />
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.username}>
              <span>Meu perfil</span>
              <span className={styles.editBadge}>EDITAR</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contadores */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>seguindo</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>seguidores</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>comentarios</span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Estatisticas */}
      <section className={styles.section} aria-labelledby="stats-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="stats-title">
            Estatisticas
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
              Episodios assistidos
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

      {/* Series */}
      <section className={styles.section} aria-labelledby="shows-title">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle} id="shows-title">
            Series
          </h2>
          <span className={styles.sectionLink}>
            <IconChevronRight width={16} height={16} />
          </span>
        </div>
        <div className={styles.showsGrid}>
          {/* Populado via Client Component com dados reais */}
        </div>
      </section>

      {/* Atribuicao TMDB */}
      <div className={styles.tmdbAttribution} role="contentinfo">
        <span className={styles.tmdbLogo}>TMDB</span>
        <span>
          Este produto usa a API do TMDB mas nao e endossado ou certificado pelo
          TMDB.
        </span>
      </div>
    </div>
  );
}
