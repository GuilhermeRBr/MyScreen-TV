import { SVGProps } from 'react';

/**
 * Logo da Microsoft (quatro quadrados coloridos) — botao de login social.
 */
export function IconMicrosoft(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 17 17"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path d="M14.34 9.03H9.03V14.34H14.34V9.03Z" fill="#FEBA08" />
      <path d="M7.97 9.03H2.66V14.34H7.97V9.03Z" fill="#05A6F0" />
      <path d="M14.34 2.66H9.03V7.97H14.34V2.66Z" fill="#80BC06" />
      <path d="M7.97 2.66H2.66V7.97H7.97V2.66Z" fill="#F25325" />
    </svg>
  );
}
