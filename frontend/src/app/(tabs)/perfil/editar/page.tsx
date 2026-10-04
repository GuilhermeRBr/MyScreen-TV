'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconChevronLeft, IconUser } from '@/components/icons';
import { api, ApiError } from '@/lib/api';
import styles from './page.module.css';

interface UserProfile {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

interface FormState {
  displayName: string;
  bio: string;
  avatarUrl: string;
}

const DISPLAY_NAME_MAX = 60;
const BIO_MAX = 300;

export default function EditarPerfilPage() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    displayName: '',
    bio: '',
    avatarUrl: '',
  });
  const [username, setUsername] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .get<UserProfile>('/users/me')
      .then((data) => {
        if (cancelled) return;
        setUsername(data.username);
        setForm({
          displayName: data.displayName ?? '',
          bio: data.bio ?? '',
          avatarUrl: data.avatarUrl ?? '',
        });
      })
      .catch(() => {
        if (!cancelled) setError('Nao foi possivel carregar o perfil.');
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function validate(): boolean {
    const errors: Partial<Record<keyof FormState, string>> = {};

    if (form.displayName.length > DISPLAY_NAME_MAX) {
      errors.displayName = `Maximo de ${DISPLAY_NAME_MAX} caracteres.`;
    }

    if (form.bio.length > BIO_MAX) {
      errors.bio = `Maximo de ${BIO_MAX} caracteres.`;
    }

    if (form.avatarUrl && !/^https?:\/\/.+/.test(form.avatarUrl)) {
      errors.avatarUrl = 'Informe uma URL valida (comecando com http:// ou https://).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validate()) return;

    setSaving(true);

    const payload: Record<string, string> = {};
    if (form.displayName.trim()) payload.displayName = form.displayName.trim();
    if (form.bio.trim()) payload.bio = form.bio.trim();
    if (form.avatarUrl.trim()) payload.avatarUrl = form.avatarUrl.trim();

    try {
      await api.patch('/users/me', payload);
      setSuccess(true);
      // Volta para o perfil apos salvar
      setTimeout(() => router.push('/perfil'), 1200);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError('Dados invalidos. Verifique os campos e tente novamente.');
        } else if (err.status === 401) {
          router.push('/login');
        } else {
          setError('Erro ao salvar. Tente novamente.');
        }
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (success) setSuccess(false);
  }

  return (
    <div className={styles.container}>
      {/* Topbar */}
      <header className={styles.topBar}>
        <Link href="/perfil" className={styles.backButton} aria-label="Voltar para o perfil">
          <IconChevronLeft width={20} height={20} />
        </Link>
        <h1 className={styles.pageTitle}>Editar perfil</h1>
        {/* Espacador para centralizar o titulo */}
        <div className={styles.topBarSpacer} aria-hidden="true" />
      </header>

      {loadingProfile ? (
        <div className={styles.skeletonWrapper} aria-label="Carregando perfil...">
          <div className={styles.avatarPreviewSkeleton} />
          <div className={styles.fieldSkeleton} />
          <div className={styles.fieldSkeleton} style={{ height: 80 }} />
          <div className={styles.fieldSkeleton} />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {/* Preview do avatar */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarPreview} aria-label="Preview do avatar">
              {form.avatarUrl && /^https?:\/\/.+/.test(form.avatarUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatarUrl}
                  alt="Preview do avatar"
                  className={styles.avatarImage}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <IconUser
                  width={36}
                  height={36}
                  style={{ color: 'var(--color-text-muted)' }}
                />
              )}
            </div>
            <div className={styles.avatarInfo}>
              <span className={styles.avatarName}>
                {form.displayName || username}
              </span>
              <span className={styles.avatarUsername}>@{username}</span>
            </div>
          </div>

          {/* Nome de exibicao */}
          <div className={styles.field}>
            <label htmlFor="displayName" className={styles.label}>
              Nome de exibicao
            </label>
            <input
              id="displayName"
              type="text"
              value={form.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className={`${styles.input} ${fieldErrors.displayName ? styles.inputError : ''}`}
              placeholder="Como voce quer ser chamado?"
              maxLength={DISPLAY_NAME_MAX}
              disabled={saving}
              aria-describedby={fieldErrors.displayName ? 'displayName-error' : 'displayName-hint'}
            />
            {fieldErrors.displayName ? (
              <p id="displayName-error" role="alert" className={styles.fieldError}>
                {fieldErrors.displayName}
              </p>
            ) : (
              <p id="displayName-hint" className={styles.hint}>
                {form.displayName.length}/{DISPLAY_NAME_MAX}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className={styles.field}>
            <label htmlFor="bio" className={styles.label}>
              Bio
            </label>
            <textarea
              id="bio"
              value={form.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className={`${styles.textarea} ${fieldErrors.bio ? styles.inputError : ''}`}
              placeholder="Conte um pouco sobre voce..."
              maxLength={BIO_MAX}
              rows={4}
              disabled={saving}
              aria-describedby={fieldErrors.bio ? 'bio-error' : 'bio-hint'}
            />
            {fieldErrors.bio ? (
              <p id="bio-error" role="alert" className={styles.fieldError}>
                {fieldErrors.bio}
              </p>
            ) : (
              <p id="bio-hint" className={styles.hint}>
                {form.bio.length}/{BIO_MAX}
              </p>
            )}
          </div>

          {/* URL do avatar */}
          <div className={styles.field}>
            <label htmlFor="avatarUrl" className={styles.label}>
              URL do avatar
            </label>
            <input
              id="avatarUrl"
              type="url"
              value={form.avatarUrl}
              onChange={(e) => handleChange('avatarUrl', e.target.value)}
              className={`${styles.input} ${fieldErrors.avatarUrl ? styles.inputError : ''}`}
              placeholder="https://exemplo.com/avatar.jpg"
              disabled={saving}
              aria-describedby={fieldErrors.avatarUrl ? 'avatarUrl-error' : undefined}
            />
            {fieldErrors.avatarUrl && (
              <p id="avatarUrl-error" role="alert" className={styles.fieldError}>
                {fieldErrors.avatarUrl}
              </p>
            )}
          </div>

          {/* Feedback global */}
          {error && (
            <p role="alert" className={styles.errorBanner}>
              {error}
            </p>
          )}
          {success && (
            <p role="status" className={styles.successBanner}>
              Perfil atualizado com sucesso.
            </p>
          )}

          {/* Acoes */}
          <div className={styles.actions}>
            <Link href="/perfil" className={styles.cancelButton}>
              Cancelar
            </Link>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
