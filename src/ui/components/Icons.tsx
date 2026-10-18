import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = { width: 24, height: 24, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;

export function HeartIcon({ filled, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 20.6s-7.6-4.5-9.4-9.3C1.4 8 3.3 4.6 6.7 4.2c2-.2 3.6.8 5.3 2.7 1.7-1.9 3.3-2.9 5.3-2.7 3.4.4 5.3 3.8 4.1 7.1-1.8 4.8-9.4 9.3-9.4 9.3Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SkipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6.5v11l8-5.5-8-5.5Z M13 6.5v11l8-5.5-8-5.5Z" fill="currentColor" />
    </svg>
  );
}

export function OptionsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="4" rx="2" fill="currentColor" opacity=".55" />
      <rect x="3" y="10" width="18" height="4" rx="2" fill="currentColor" />
      <rect x="3" y="16" width="18" height="4" rx="2" fill="currentColor" opacity=".55" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1.4" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1.4" fill="currentColor" />
    </svg>
  );
}

export function ImageSlotIcon(props: IconProps) {
  return (
    <svg {...base} viewBox="0 0 48 48" {...props}>
      <rect x="6" y="9" width="36" height="30" rx="6" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="17" cy="20" r="4" fill="currentColor" />
      <path d="M8 35l10-10 7 7 5-5 10 10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2L12 2.5Z" fill="currentColor" />
    </svg>
  );
}
