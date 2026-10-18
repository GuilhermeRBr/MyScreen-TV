import { SVGProps } from 'react';

/**
 * Raio/lampada — usado na tela de login para "Atualizacoes em tempo real".
 */
export function IconBolt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="28"
      viewBox="0 0 26 35"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M13.5 1.5L1.5 19.5H11.5L6.5 33.5L24.5 13.5H13.5V1.5Z" />
    </svg>
  );
}
