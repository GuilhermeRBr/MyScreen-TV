'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { PasswordInput } from '@/components/PasswordInput/PasswordInput';
import styles from './page.module.css';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/series';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          setError('Email ou senha incorretos.');
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
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          placeholder="seu@email.com"
          disabled={loading}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label htmlFor="password" className={styles.label}>
            Senha
          </label>
          <Link href="/forgot-password" className={styles.forgotLink}>
            Esqueci minha senha
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(v) => setPassword(v)}
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className={styles.button}
        disabled={loading}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>MyScreen TV</h1>
        <p className={styles.subtitle}>Acompanhe suas séries e filmes</p>

        <Suspense fallback={<div className={styles.form} />}>
          <LoginForm />
        </Suspense>

        <p className={styles.footer}>
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className={styles.link}>
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
