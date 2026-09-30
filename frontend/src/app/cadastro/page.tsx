'use client';

import { useState, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import styles from './page.module.css';

type FieldErrors = Partial<Record<'email' | 'username' | 'displayName' | 'password', string>>;

function validateForm(
  email: string,
  username: string,
  displayName: string,
  password: string,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!email) {
    errors.email = 'Email e obrigatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Email invalido';
  }

  if (!username) {
    errors.username = 'Username e obrigatorio';
  } else if (username.length < 3) {
    errors.username = 'Username deve ter pelo menos 3 caracteres';
  } else if (username.length > 30) {
    errors.username = 'Username deve ter no maximo 30 caracteres';
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.username = 'Username so pode conter letras, numeros e underscore';
  }

  if (!displayName) {
    errors.displayName = 'Nome de exibicao e obrigatorio';
  } else if (displayName.length < 2) {
    errors.displayName = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!password) {
    errors.password = 'Senha e obrigatoria';
  } else if (password.length < 8) {
    errors.password = 'Senha deve ter pelo menos 8 caracteres';
  }

  return errors;
}

// Erros vindos do backend depois de passar na validacao local (ex: duplicados)
function parseApiError(err: ApiError): FieldErrors {
  const mapped: FieldErrors = {};

  // Formato estruturado do ValidationPipe: array de "campo:mensagem"
  if (err.errors && err.errors.length > 0) {
    const FIELD_MAP: Record<string, keyof FieldErrors> = {
      email: 'email',
      username: 'username',
      password: 'password',
      displayName: 'displayName',
    };

    for (const item of err.errors) {
      const colonIndex = item.indexOf(':');
      if (colonIndex !== -1) {
        const key = FIELD_MAP[item.slice(0, colonIndex)];
        if (key) mapped[key] = item.slice(colonIndex + 1);
      }
    }

    if (Object.keys(mapped).length > 0) return mapped;
  }

  // Erros do service como string unica: "Email ja esta em uso", "Username ja esta em uso"
  const lower = err.message.toLowerCase();
  if (lower.includes('username')) {
    mapped.username = err.message;
  } else if (lower.includes('email')) {
    mapped.email = err.message;
  }

  return mapped;
}

function CadastroForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    // Validacao no frontend primeiro
    const localErrors = validateForm(email, username, displayName, password);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await api.post('/auth/register', { email, username, displayName, password });
      router.push('/series');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setGeneralError('Muitas tentativas. Aguarde um momento e tente novamente.');
        } else if (err.status === 400 || err.status === 409) {
          const mapped = parseApiError(err);
          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
          } else {
            setGeneralError(err.message);
          }
        } else {
          setGeneralError('Erro ao criar conta. Tente novamente.');
        }
      } else {
        setGeneralError('Erro ao conectar com o servidor. Tente novamente.');
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
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((prev) => ({ ...prev, email: undefined })); }}
          className={`${styles.input}${fieldErrors.email ? ` ${styles.inputError}` : ''}`}
          placeholder="seu@email.com"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <span id="email-error" role="alert" className={styles.fieldError}>
            {fieldErrors.email}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setFieldErrors((prev) => ({ ...prev, username: undefined })); }}
          className={`${styles.input}${fieldErrors.username ? ` ${styles.inputError}` : ''}`}
          placeholder="meu_usuario"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.username)}
          aria-describedby={fieldErrors.username ? 'username-error' : undefined}
        />
        {fieldErrors.username && (
          <span id="username-error" role="alert" className={styles.fieldError}>
            {fieldErrors.username}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="displayName" className={styles.label}>
          Nome de exibicao
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          value={displayName}
          onChange={(e) => { setDisplayName(e.target.value); setFieldErrors((prev) => ({ ...prev, displayName: undefined })); }}
          className={`${styles.input}${fieldErrors.displayName ? ` ${styles.inputError}` : ''}`}
          placeholder="Seu Nome"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.displayName)}
          aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
        />
        {fieldErrors.displayName && (
          <span id="displayName-error" role="alert" className={styles.fieldError}>
            {fieldErrors.displayName}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((prev) => ({ ...prev, password: undefined })); }}
          className={`${styles.input}${fieldErrors.password ? ` ${styles.inputError}` : ''}`}
          placeholder="Minimo 8 caracteres"
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        {fieldErrors.password && (
          <span id="password-error" role="alert" className={styles.fieldError}>
            {fieldErrors.password}
          </span>
        )}
      </div>

      {generalError && (
        <p role="alert" className={styles.error}>
          {generalError}
        </p>
      )}

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  );
}

export default function CadastroPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>TV Time</h1>
        <p className={styles.subtitle}>Crie sua conta</p>

        <Suspense fallback={<div className={styles.form} />}>
          <CadastroForm />
        </Suspense>

        <p className={styles.footer}>
          Ja tem conta?{' '}
          <Link href="/login" className={styles.link}>
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
