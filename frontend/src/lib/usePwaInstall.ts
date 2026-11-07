'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Estados possíveis da instalação do PWA.
 *
 * - 'unsupported': navegador não suporta instalação (ou já está instalado).
 * - 'ready': evento beforeinstallprompt disponível, pode instalar.
 * - 'ios': iOS Safari — não tem beforeinstallprompt, exibe instruções manuais.
 * - 'installed': aplicativo já está rodando como PWA (standalone).
 * - 'dismissed': usuário dispensou o prompt nesta sessão.
 */
export type PwaInstallState =
  | 'unsupported'
  | 'ready'
  | 'ios'
  | 'installed'
  | 'dismissed';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

interface UsePwaInstallReturn {
  installState: PwaInstallState;
  /** Abre o prompt nativo de instalação (apenas quando installState === 'ready'). */
  promptInstall: () => Promise<void>;
  /** Descarta o prompt para esta sessão. */
  dismiss: () => void;
}

/**
 * Detecta se o dispositivo é iOS (iPhone/iPad).
 * O iPad com iOS 13+ reporta-se como MacIntel, então usa-se maxTouchPoints
 * como discriminador adicional.
 */
function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detecta se o aplicativo já está rodando em modo standalone (instalado).
 */
function isRunningAsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [installState, setInstallState] =
    useState<PwaInstallState>('unsupported');
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Se já está rodando como app instalado, não exibe nada
    if (isRunningAsStandalone()) {
      setInstallState('installed');
      return;
    }

    // iOS: não suporta beforeinstallprompt, mas pode ser instalado via
    // "Adicionar à Tela de Início" no Safari
    if (isIos()) {
      setInstallState('ios');
      return;
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallState('ready');
    }

    function handleAppInstalled() {
      setInstallState('installed');
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallState('installed');
    } else {
      setInstallState('dismissed');
    }

    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setInstallState('dismissed');
    setDeferredPrompt(null);
  }, []);

  return { installState, promptInstall, dismiss };
}
