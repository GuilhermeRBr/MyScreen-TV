'use client';

import { useState, FormEvent, Suspense, ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Logo } from '@/components/Logo/Logo';
import {
  IconTv,
  IconBolt,
  IconHeart,
  IconArrowRight,
  IconCheck,
  IconUser,
  IconLock,
  IconEye,
} from '@/components/icons';
import styles from './page.module.css';

/* Icone de olho riscado para ocultar senha */
function IconEyeOff(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

interface Feature {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: IconTv,    title: 'Catálogo completo',           desc: 'Milhares de filmes e séries'  },
  { icon: IconBolt,  title: 'Atualizações em tempo real',  desc: 'Seus lançamentos favoritos'   },
  { icon: IconHeart, title: 'Sua lista, do seu jeito',     desc: 'Nunca perca o que assistir'   },
];

function LoginForm() {
  const router      = useRouter();
  const searchParams = useSearchParams();
  const redirect    = searchParams.get('redirect') ?? '/series';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [visible,  setVisible]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/login', { email, password });
      router.push(redirect);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Muitas tentativas. Aguarde um momento e tente novamente.');
        } else if (err.status === 401) {
          setError('E-mail ou senha incorretos.');
        } else {
          setError('Erro ao entrar. Tente novamente.');
        }
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>

      {/* Campo e-mail */}
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          E-mail ou usuário
        </label>
        <div className={styles.inputWrapper}>
          <IconUser className={styles.inputIcon} />
          <input
            id="email"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="Digite seu e-mail ou usuário"
            disabled={loading}
          />
        </div>
      </div>

      {/* Campo senha */}
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Senha
        </label>
        <div className={styles.inputWrapper}>
          <IconLock className={styles.inputIcon} />
          <input
            id="password"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${styles.input} ${styles.inputWithToggle}`}
            placeholder="Digite sua senha"
            disabled={loading}
          />
          <button
            type="button"
            className={styles.eyeToggle}
            onClick={() => setVisible((v) => !v)}
            disabled={loading}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {visible ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </div>

      {/* Lembrar / Esqueceu */}
      <div className={styles.optionsRow}>
        <label className={styles.rememberMe}>
          <input
            type="checkbox"
            className={styles.checkboxInput}
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span className={styles.checkboxBox} aria-hidden="true">
            {remember && <IconCheck className={styles.checkmark} />}
          </span>
          <span className={styles.rememberLabel}>Lembrar de mim</span>
        </label>
        <Link href="/forgot-password" className={styles.forgotLink}>
          Esqueceu sua senha?
        </Link>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {/* Botao entrar */}
      <button type="submit" className={styles.button} disabled={loading}>
        <span>{loading ? 'Entrando...' : 'Entrar'}</span>
        {!loading && <IconArrowRight className={styles.buttonArrow} />}
      </button>

    </form>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      {/* Camadas de fundo geométricas */}
      <div className={styles.bgBase}      aria-hidden="true" />
      <div className={styles.bgShapeLeft} aria-hidden="true" />
      <div className={styles.bgShapeTopRight} aria-hidden="true" />

      <div className={styles.content}>

        {/* Coluna esquerda — brand */}
        <section className={styles.brand} aria-label="MyScreen TV">
          <Logo width={220} />
          <p className={styles.tagline}>
            Suas séries e filmes favoritos,<br />em um só lugar.
          </p>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <li key={title} className={styles.featureItem}>
                <span className={styles.featureIcon}><Icon /></span>
                <span className={styles.featureText}>
                  <span className={styles.featureTitle}>{title}</span>
                  <span className={styles.featureDesc}>{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Coluna direita — card de login */}
        <section className={styles.cardWrapper}>
          <div className={styles.card}>
            <header className={styles.cardHeader}>
              <h1 className={styles.welcomeTitle}>
                <span className={styles.welcomeNormal}>Bem-vindo </span>
                <span className={styles.welcomeAccent}>de volta!</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                Entre na sua conta para continuar assistindo.
              </p>
            </header>

            <Suspense fallback={<div className={styles.form} />}>
              <LoginForm />
            </Suspense>

            <p className={styles.footer}>
              Não tem uma conta?{' '}
              <Link href="/cadastro" className={styles.footerLink}>
                Cadastre-se
              </Link>
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
