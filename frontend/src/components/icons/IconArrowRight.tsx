import { SVGProps } from 'react';

/**
 * Seta para a direita — usado no botao "Entrar" da tela de login.
 */
export function IconArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="16"
      viewBox="0 0 18.3 16.3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M1.15 8.15H16.15M10.15 1.15L17.15 8.15L10.15 15.15" />
    </svg>
  );
}
