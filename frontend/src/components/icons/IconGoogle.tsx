import { SVGProps } from 'react';

/**
 * Logo do Google (cores oficiais da marca) — botao de login social.
 */
export function IconGoogle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 15 15.31"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M15 7.82C15 7.19 14.95 6.73 14.84 6.26H7.65V9.1H11.87C11.79 9.8 11.33 10.87 10.31 11.58L10.29 11.68L12.56 13.44L12.72 13.45C14.17 12.12 15 10.15 15 7.82Z"
        fill="#4285F4"
      />
      <path
        d="M7.65 15.31C9.72 15.31 11.45 14.63 12.72 13.45L10.31 11.58C9.66 12.03 8.79 12.35 7.65 12.35C5.63 12.35 3.91 11.01 3.3 9.17L3.21 9.17L0.85 11L0.82 11.09C2.07 13.59 4.66 15.31 7.65 15.31Z"
        fill="#34A853"
      />
      <path
        d="M3.3 9.17C3.14 8.69 3.04 8.18 3.04 7.65C3.04 7.13 3.14 6.62 3.29 6.14L3.29 6.04L0.89 4.18L0.82 4.22C0.3 5.26 0 6.42 0 7.65C0 8.89 0.3 10.05 0.82 11.09L3.3 9.17Z"
        fill="#FBBC05"
      />
      <path
        d="M7.65 2.96C9.09 2.96 10.06 3.58 10.61 4.1L12.77 1.99C11.45 0.76 9.72 0 7.65 0C4.66 0 2.07 1.72 0.82 4.22L3.29 6.14C3.91 4.29 5.63 2.96 7.65 2.96Z"
        fill="#EB4335"
      />
    </svg>
  );
}
