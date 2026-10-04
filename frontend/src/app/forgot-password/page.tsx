'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setError('Muitas tentativas. Aguarde um momento e tente novamente.');
        } else if (err.status === 400) {
          setError('Informe um e-mail válido.');
        } else {
          setError('Ocorreu um erro. Tente novamente.');
        }
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>MyScreen TV</h1>
        <p className={styles.subtitle}>Recuperação de senha</p>

        {submitted ? (
          <p role="status" className={styles.success}>
            Se o e-mail estiver cadastrado, você receberá as instruções em breve. Verifique também sua caixa de spam.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <label htmlFor="email" className={styles.label}>
                E-mail da conta
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

            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}

            <button type="submit" className={styles.button} disabled={loading || !email.trim()}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          Lembrou a senha?{' '}
          <Link href="/login" className={styles.link}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
