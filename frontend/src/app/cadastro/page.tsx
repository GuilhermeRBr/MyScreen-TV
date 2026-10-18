'use client';

import { useState, FormEvent, Suspense, ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { Logo } from '@/components/Logo/Logo';
import {
  IconTv,
  IconBolt,
  IconHeart,
  IconArrowRight,
  IconUser,
  IconLock,
  IconEye,
} from '@/components/icons';
import styles from './page.module.css';

/* ---- Ícones inline ---- */

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

/* Ícone de pessoa com tag — nome de exibição */
function IconDisplayName(props: SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      <path d="M15 4h4M15 7h4" />
    </svg>
  );
}

/* Ícone de envelope — email */
function IconMail(props: SVGProps<SVGSVGElement>) {
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
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
}

/* ---- Features (igual ao login) ---- */
interface Feature {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  desc: string;
}

const FEATURES: Feature[] = [
  { icon: IconTv,    title: 'Catálogo completo',          desc: 'Milhares de filmes e séries' },
  { icon: IconBolt,  title: 'Atualizações em tempo real', desc: 'Seus lançamentos favoritos'  },
  { icon: IconHeart, title: 'Sua lista, do seu jeito',    desc: 'Nunca perca o que assistir'  },
];

/* ---- Tipos de erro ---- */
type FieldErrors = Partial<Record<'email' | 'username' | 'displayName' | 'password' | 'confirmPassword', string>>;

function validateForm(
  email: string,
  username: string,
  displayName: string,
  password: string,
  confirmPassword: string,
): FieldErrors {
  const errors: FieldErrors = {};

  const emailTrimmed = email.trim();
  if (!emailTrimmed) {
    errors.email = 'E-mail é obrigatório';
  } else if (emailTrimmed.length < 5) {
    errors.email = 'E-mail deve ter pelo menos 5 caracteres';
  } else if (emailTrimmed.length > 50) {
    errors.email = 'E-mail deve ter no máximo 50 caracteres';
  } else if (/\s/.test(emailTrimmed)) {
    errors.email = 'E-mail não pode conter espaços';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    errors.email = 'E-mail inválido';
  }

  const usernameTrimmed = username.trim();
  if (!usernameTrimmed) {
    errors.username = 'Username é obrigatório';
  } else if (usernameTrimmed.length < 3) {
    errors.username = 'Username deve ter pelo menos 3 caracteres';
  } else if (usernameTrimmed.length > 30) {
    errors.username = 'Username deve ter no máximo 30 caracteres';
  } else if (/\s/.test(usernameTrimmed)) {
    errors.username = 'Username não pode conter espaços';
  } else if (!/^[a-zA-Z0-9_.]+$/.test(usernameTrimmed)) {
    errors.username = 'Username só pode conter letras, números, underscore e ponto';
  } else if (/^[._]|[._]$/.test(usernameTrimmed)) {
    errors.username = 'Username não pode começar ou terminar com ponto ou underscore';
  }

  const displayNameTrimmed = displayName.trim();
  if (!displayNameTrimmed) {
    errors.displayName = 'Nome de exibição é obrigatório';
  } else if (displayNameTrimmed.length < 2) {
    errors.displayName = 'Nome deve ter pelo menos 2 caracteres';
  } else if (displayNameTrimmed.length > 100) {
    errors.displayName = 'Nome deve ter no máximo 100 caracteres';
  }

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

function parseApiError(err: ApiError): FieldErrors {
  const mapped: FieldErrors = {};

  if (err.errors && err.errors.length > 0) {
    const FIELD_MAP: Record<string, keyof FieldErrors> = {
      email: 'email',
      username: 'username',
      password: 'password',
      confirmPassword: 'confirmPassword',
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

  const lower = err.message.toLowerCase();
  if (lower.includes('username')) {
    mapped.username = err.message;
  } else if (lower.includes('email')) {
    mapped.email = err.message;
  }

  return mapped;
}

/* ---- Campo de senha inline (com ícone à esquerda) ---- */
function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  error,
  errorId,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete: string;
  disabled: boolean;
  error?: string;
  errorId: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <IconLock className={styles.inputIcon} />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${styles.input} ${styles.inputWithToggle}${error ? ` ${styles.inputError}` : ''}`}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          className={styles.eyeToggle}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          tabIndex={-1}
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      {error && (
        <span id={errorId} role="alert" className={styles.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ---- Formulário ---- */
function CadastroForm() {
  const router = useRouter();

  const [email,           setEmail]           = useState('');
  const [username,        setUsername]        = useState('');
  const [displayName,     setDisplayName]     = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors,     setFieldErrors]     = useState<FieldErrors>({});
  const [generalError,    setGeneralError]    = useState<string | null>(null);
  const [loading,         setLoading]         = useState(false);

  function clearField(key: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    const localErrors = validateForm(email, username, displayName, password, confirmPassword);
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      await api.post('/auth/register', { email, username, displayName, password, confirmPassword });
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

      {/* E-mail */}
      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>E-mail</label>
        <div className={styles.inputWrapper}>
          <IconMail className={styles.inputIcon} />
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearField('email'); }}
            className={`${styles.input}${fieldErrors.email ? ` ${styles.inputError}` : ''}`}
            placeholder="Digite seu e-mail"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
        </div>
        {fieldErrors.email && (
          <span id="email-error" role="alert" className={styles.fieldError}>
            {fieldErrors.email}
          </span>
        )}
      </div>

      {/* Username */}
      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>Username</label>
        <div className={styles.inputWrapper}>
          <IconUser className={styles.inputIcon} />
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => { setUsername(e.target.value); clearField('username'); }}
            className={`${styles.input}${fieldErrors.username ? ` ${styles.inputError}` : ''}`}
            placeholder="Escolha um nome de usuário"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.username)}
            aria-describedby={fieldErrors.username ? 'username-error' : undefined}
          />
        </div>
        {fieldErrors.username && (
          <span id="username-error" role="alert" className={styles.fieldError}>
            {fieldErrors.username}
          </span>
        )}
      </div>

      {/* Nome de exibição */}
      <div className={styles.field}>
        <label htmlFor="displayName" className={styles.label}>Nome de exibição</label>
        <div className={styles.inputWrapper}>
          <IconDisplayName className={styles.inputIcon} />
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); clearField('displayName'); }}
            className={`${styles.input}${fieldErrors.displayName ? ` ${styles.inputError}` : ''}`}
            placeholder="Como devemos chamar você?"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.displayName)}
            aria-describedby={fieldErrors.displayName ? 'displayName-error' : undefined}
          />
        </div>
        {fieldErrors.displayName && (
          <span id="displayName-error" role="alert" className={styles.fieldError}>
            {fieldErrors.displayName}
          </span>
        )}
      </div>

      {/* Senha */}
      <PasswordField
        id="password"
        label="Senha"
        value={password}
        onChange={(v) => { setPassword(v); clearField('password'); }}
        placeholder="Crie uma senha segura"
        autoComplete="new-password"
        disabled={loading}
        error={fieldErrors.password}
        errorId="password-error"
      />

      {/* Confirmar senha */}
      <PasswordField
        id="confirmPassword"
        label="Confirmar senha"
        value={confirmPassword}
        onChange={(v) => { setConfirmPassword(v); clearField('confirmPassword'); }}
        placeholder="Digite a senha novamente"
        autoComplete="new-password"
        disabled={loading}
        error={fieldErrors.confirmPassword}
        errorId="confirmPassword-error"
      />

      {generalError && (
        <p role="alert" className={styles.error}>
          {generalError}
        </p>
      )}

      <button type="submit" className={styles.button} disabled={loading}>
        <span>{loading ? 'Criando conta...' : 'Criar conta'}</span>
        {!loading && <IconArrowRight className={styles.buttonArrow} />}
      </button>

    </form>
  );
}

/* ---- Página ---- */
export default function CadastroPage() {
  return (
    <main className={styles.page}>
      <div className={styles.bgBase}         aria-hidden="true" />
      <div className={styles.bgShapeLeft}    aria-hidden="true" />
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

        {/* Coluna direita — card de cadastro */}
        <section className={styles.cardWrapper}>
          <div className={styles.card}>
            <header className={styles.cardHeader}>
              <h1 className={styles.welcomeTitle}>
                <span className={styles.welcomeNormal}>Crie </span>
                <span className={styles.welcomeAccent}>sua conta</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                Cadastre-se para começar a organizar o que assistir.
              </p>
            </header>

            <Suspense fallback={<div className={styles.form} />}>
              <CadastroForm />
            </Suspense>

            <p className={styles.footer}>
              Já tem uma conta?{' '}
              <Link href="/login" className={styles.footerLink}>
                Entrar
              </Link>
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
