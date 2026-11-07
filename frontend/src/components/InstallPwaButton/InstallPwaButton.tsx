'use client';

import { useState } from 'react';
import { usePwaInstall } from '@/lib/usePwaInstall';
import styles from './InstallPwaButton.module.css';

/**
 * Botão de instalação do PWA.
 *
 * Comportamento por plataforma:
 * - Android/Desktop: abre o prompt nativo do navegador via beforeinstallprompt.
 * - iOS: exibe instruções passo a passo para adicionar via Safari.
 * - Já instalado ou não suportado: não renderiza nada.
 */
export function InstallPwaButton() {
  const { installState, promptInstall, dismiss } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Não exibe em nenhuma dessas situações
  if (
    installState === 'unsupported' ||
    installState === 'installed' ||
    installState === 'dismissed'
  ) {
    return null;
  }

  if (installState === 'ios') {
    return (
      <>
        <button
          className={styles.installButton}
          onClick={() => setShowIosGuide(true)}
          type="button"
        >
          <IconDownload width={16} height={16} />
          Instalar MyScreen TV
        </button>

        {showIosGuide && (
          <div
            className={styles.iosOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-guide-title"
          >
            <div className={styles.iosSheet}>
              <div className={styles.iosSheetHeader}>
                <h2 className={styles.iosSheetTitle} id="ios-guide-title">
                  Instalar no iPhone ou iPad
                </h2>
                <button
                  className={styles.iosSheetClose}
                  onClick={() => setShowIosGuide(false)}
                  aria-label="Fechar instruções"
                  type="button"
                >
                  <IconClose width={18} height={18} />
                </button>
              </div>

              <p className={styles.iosSheetDescription}>
                Siga os passos abaixo no Safari para adicionar o MyScreen TV à
                sua tela de início:
              </p>

              <ol className={styles.iosSteps}>
                <li className={styles.iosStep}>
                  <span className={styles.iosStepNumber}>1</span>
                  <span className={styles.iosStepText}>
                    Toque no botão{' '}
                    <strong>Compartilhar</strong>{' '}
                    <IconShare width={14} height={14} className={styles.iosInlineIcon} />{' '}
                    na barra inferior do Safari.
                  </span>
                </li>
                <li className={styles.iosStep}>
                  <span className={styles.iosStepNumber}>2</span>
                  <span className={styles.iosStepText}>
                    Role a lista de opções e toque em{' '}
                    <strong>Adicionar à Tela de Início</strong>.
                  </span>
                </li>
                <li className={styles.iosStep}>
                  <span className={styles.iosStepNumber}>3</span>
                  <span className={styles.iosStepText}>
                    Confirme tocando em <strong>Adicionar</strong> no canto
                    superior direito.
                  </span>
                </li>
              </ol>

              <p className={styles.iosSheetHint}>
                O MyScreen TV aparecerá como um aplicativo na sua tela de início.
              </p>

              <button
                className={styles.iosSheetDismiss}
                onClick={() => {
                  setShowIosGuide(false);
                  dismiss();
                }}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Estado 'ready': prompt nativo disponível (Android / Desktop)
  return (
    <button
      className={styles.installButton}
      onClick={promptInstall}
      type="button"
    >
      <IconDownload width={16} height={16} />
      Instalar MyScreen TV
    </button>
  );
}

// ---------------------------------------------------------------------------
// Ícones inline — sem emoji, SVG próprio
// ---------------------------------------------------------------------------

function IconDownload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function IconShare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
