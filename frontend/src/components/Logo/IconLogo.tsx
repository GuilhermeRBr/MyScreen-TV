import { SVGProps } from 'react';

interface IconLogoProps extends SVGProps<SVGSVGElement> {
  /** Tamanho (largura) do ícone em pixels. A altura segue a proporção 85x88. */
  size?: number;
}

/**
 * Marca do ícone do MyScreen TV (apenas o símbolo, sem a palavra-marca).
 * Útil em espaços pequenos como headers e barras de navegação.
 */
export function IconLogo({ size = 40, ...props }: IconLogoProps) {
  const height = Math.round((size * 88) / 85);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={height}
      viewBox="0 0 85 88"
      fill="none"
      role="img"
      aria-label="MyScreen TV"
      {...props}
    >
      <g clipPath="url(#icon-logo-clip)">
        <path d="M20 20V68L65 44L20 20Z" fill="url(#icon-logo-grad-icon)" />
        <path
          d="M9.70996 2.85057C15.7341 -0.763892 23.2134 -0.953477 29.4121 2.35253L74.4121 26.3525C80.9293 29.8284 85 36.6138 85 44C85 51.3862 80.9293 58.1716 74.4121 61.6474L29.4121 85.6474C23.2134 88.9535 15.7341 88.7639 9.70996 85.1494C3.68602 81.5349 0 75.0251 0 68V20C0 12.9748 3.68602 6.46507 9.70996 2.85057Z"
          fill="url(#icon-logo-grad-outer)"
        />
        <path
          d="M24 25V62L59 43.5L24 25Z"
          fill="#111426"
          stroke="#111426"
          strokeWidth="8"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <linearGradient
          id="icon-logo-grad-icon"
          x1="-1.3767e-06"
          y1="3.17369e-06"
          x2="87.9471"
          y2="84.9489"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EB5757" />
          <stop offset="1" stopColor="#C0392B" />
        </linearGradient>
        <linearGradient
          id="icon-logo-grad-outer"
          x1="-3.50919e-07"
          y1="-1.0591e-05"
          x2="87.9471"
          y2="84.9489"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EB5757" />
          <stop offset="1" stopColor="#C0392B" />
        </linearGradient>
        <clipPath id="icon-logo-clip">
          <rect width="85" height="88" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
