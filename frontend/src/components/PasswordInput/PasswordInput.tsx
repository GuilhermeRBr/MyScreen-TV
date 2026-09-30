'use client';

import { useState } from 'react';
import styles from './PasswordInput.module.css';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  hasError?: boolean;
  'aria-describedby'?: string;
}

function IconEye() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  disabled = false,
  hasError = false,
  'aria-describedby': ariaDescribedBy,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={styles.wrapper}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={ariaDescribedBy}
        className={`${styles.input}${hasError ? ` ${styles.inputError}` : ''}`}
      />
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        tabIndex={-1}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  );
}
