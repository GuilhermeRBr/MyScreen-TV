import { SVGProps } from 'react';

export function IconPlay(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.5)" />
      <polygon points="10 8 16 12 10 16 10 8" fill="white" />
    </svg>
  );
}
