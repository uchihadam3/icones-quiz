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
      {filled && <path d="M7.2 7.2c-1.2.3-2 1.3-2.1 2.6" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

export function SkipIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 6.2v11.6l8.2-5.8-8.2-5.8Z M12.5 6.2v11.6l8.2-5.8-8.2-5.8Z" fill="currentColor" />
    </svg>
  );
}

export function OptionsIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3.5" width="18" height="4.5" rx="2.2" fill="currentColor" opacity=".5" />
      <rect x="3" y="9.75" width="18" height="4.5" rx="2.2" fill="currentColor" />
      <rect x="3" y="16" width="18" height="4.5" rx="2.2" fill="currentColor" opacity=".5" />
    </svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="6" y="5" width="4.2" height="14" rx="1.6" fill="currentColor" />
      <rect x="13.8" y="5" width="4.2" height="14" rx="1.6" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8 5.2v13.6c0 .8.9 1.3 1.6.8l10-6.8a1 1 0 0 0 0-1.6l-10-6.8C8.9 3.9 8 4.4 8 5.2Z" fill="currentColor" />
    </svg>
  );
}

export function RetryIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M19.5 3.5v5h-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 11.2 12 4l8 7.2V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1v-7.8Z" fill="currentColor" />
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

export function FlameIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12.6 2.2c.4 3.1 3.1 4.6 4.6 7.2 1.9 3.3.6 8.5-4.6 10.3-.2.1.9-1.8-.2-3.6-.8-1.3-2.3-1.9-2.3-3.7-1.4 1.1-2.4 2.9-1.8 5.1-3.1-1.4-4.4-4.9-3-8.2.8-1.8 2.2-2.6 2.6-4.4 1.6 1.2 2 2.4 2 2.4s1.6-2.1.7-5.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M13.5 2 4.8 13.2h6l-1.3 8.8 8.7-11.3h-6L13.5 2Z" fill="currentColor" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h10v5.2a5 5 0 0 1-10 0V3.5Z" fill="currentColor" />
      <path d="M7 5.5H4.2c0 3 1.2 4.6 3.3 5M17 5.5h2.8c0 3-1.2 4.6-3.3 5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10.6 13.4h2.8l.6 3.6h-4l.6-3.6ZM7.8 17.4h8.4a1 1 0 0 1 1 1V20H6.8v-1.6a1 1 0 0 1 1-1Z" fill="currentColor" />
    </svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 8.2 8 11.5l4-6.3 4 6.3 4.5-3.3-1.8 9.3H5.3L3.5 8.2Z" fill="currentColor" />
      <rect x="5.3" y="18.4" width="13.4" height="2.2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.6" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="12" cy="15.6" r="1.6" fill="#0b0d1a" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 9v4.4l2.8 1.8M9.5 2.8h5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7.5h3.2L8.7 5h6.6l1.5 2.5H20a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" fill="currentColor" />
      <circle cx="12" cy="13.2" r="3.6" fill="#141730" />
      <circle cx="12" cy="13.2" r="2" fill="currentColor" />
    </svg>
  );
}

export function MaskIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 6.5c3 1.4 6 1.4 9 0 3 1.4 6 1.4 9 0 .3 6.4-2.3 11-9 11.5C5.3 17.5 2.7 12.9 3 6.5Z" fill="currentColor" />
      <ellipse cx="8.4" cy="11" rx="2" ry="1.3" fill="#141730" />
      <ellipse cx="15.6" cy="11" rx="2" ry="1.3" fill="#141730" />
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

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11m0 0-4.5-4.5M12 14.5l4.5-4.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 16v2.5A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2V16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function KeyboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="2.4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M6 10h.01M9.3 10h.01M12.6 10h.01M15.9 10h.01M7.5 14h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </svg>
  );
}

/** Emblema da marca: estrela de 4 pontas com faixas, igual ao ícone do app. */
export function BrandStar(props: IconProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" {...props}>
      <defs>
        <linearGradient id="brand-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset=".35" stopColor="#ffd166" />
          <stop offset=".7" stopColor="#ffab5e" />
          <stop offset="1" stopColor="#ff7a59" />
        </linearGradient>
      </defs>
      <path d="M50 4 59 41 96 50 59 59 50 96 41 59 4 50 41 41Z" fill="url(#brand-star)" />
      <path d="M50 4 59 41 50 50Z M96 50 59 59 50 50Z" fill="#fff" opacity=".28" />
    </svg>
  );
}

export function ShieldHeart(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.5 4 5.6v5.8c0 5 3.4 8.9 8 10.1 4.6-1.2 8-5.1 8-10.1V5.6L12 2.5Z" fill="currentColor" opacity=".9" />
      <path d="M12 16.2s-3.6-2.1-4.4-4.4c-.6-1.6.3-3.2 1.9-3.4 1-.1 1.7.4 2.5 1.3.8-.9 1.5-1.4 2.5-1.3 1.6.2 2.5 1.8 1.9 3.4-.8 2.3-4.4 4.4-4.4 4.4Z" fill="#0b0d1a" opacity=".55" />
    </svg>
  );
}
