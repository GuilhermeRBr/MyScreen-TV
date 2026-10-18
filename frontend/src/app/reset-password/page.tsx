'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { PasswordInput } from '@/components/PasswordInput/PasswordInput';
import { Logo } from '@/components/Logo/Logo';
import styles from './page.module.css';

type FieldErrors = Partial<Record<'password' | 'confirmPassword', string>>;

function validatePasswords(password: string, confirmPassword: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!password) {
    errors.password = 'Senha é obrigatória';
  } else if (password.length < 8) {
    errors.password = 'Senha deve ter pelo menos 8 caracteres';
  } else if (password.length > 20) {
    errors.password = 'Senha deve ter no máximo 20 caracteres';
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Senha deve conter pelo menos uma letra maiúscula';
  } else if (!/[a-z]/.test(password)) {
    errors.password = 'Senha deve conter pelo menos uma letra minúscula';
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'Senha deve conter pelo menos um número';
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = 'Senha deve conter pelo menos um caractere especial';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirmação de senha é obrigatória';
  } else if (confirmPassword !== password) {
    errors.confirmPassword = 'As senhas não coincidem';
  }

  return errors;
}

function ResetSuccessRedirect() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(3);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className={styles.successRedirect}>
      <p role="status" className={styles.success}>
        Senha redefinida com sucesso.
      </p>
      <p className={styles.redirectInfo}>
        Redirecionando para o login em {seconds}...
      </p>
    </div>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className={styles.tokenInvalid}>
        <p className={styles.tokenInvalidMessage}>
          Link inválido ou expirado. Solicite um novo link de recuperação.
        </p>
        <Link href="/forgot-password" className={styles.link}>
          Solicitar novo link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    const localErrors = validatePasswords(password, confirmPassword);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGeneralError('Link inválido ou expirado. Solicite um novo link de recuperação.');
        } else if (err.status === 400) {
          setGeneralError('Dados inválidos. Verifique a senha e tente novamente.');
        } else {
          setGeneralError('Ocorreu um erro. Tente novamente.');
        }
      } else {
        setGeneralError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <ResetSuccessRedirect />;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Nova senha
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="8-20 caracteres, maiúscula, número e símbolo"
          disabled={loading}
          hasError={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        {fieldErrors.password && (
          <span id="password-error" role="alert" className={styles.fieldError}>
            {fieldErrors.password}
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="confirmPassword" className={styles.label}>
          Confirmar nova senha
        </label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(v) => {
            setConfirmPassword(v);
            setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          placeholder="Repita a nova senha"
          disabled={loading}
          hasError={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
        />
        {fieldErrors.confirmPassword && (
          <span id="confirmPassword-error" role="alert" className={styles.fieldError}>
            {fieldErrors.confirmPassword}
          </span>
        )}
      </div>

      {generalError && (
        <p role="alert" className={styles.error}>
          {generalError}
        </p>
      )}

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1>
          <Logo width={180} />
        </h1>
        <p className={styles.subtitle}>Criar nova senha</p>

        <Suspense fallback={<div className={styles.form} />}>
          <ResetPasswordForm />
        </Suspense>

        <p className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  );
}
