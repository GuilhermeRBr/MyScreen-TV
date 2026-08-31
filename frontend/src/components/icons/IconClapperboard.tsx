import { SVGProps } from 'react';

export function IconClapperboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 11v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8H4z" />
      <path d="M4 11V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v5" />
      <line x1="12" y1="5" x2="12" y2="11" />
      <polyline points="4 8 8 5 12 8 16 5 20 8" />
    </svg>
  );
}
