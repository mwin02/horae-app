type Props = { size?: number; className?: string };

export function Logo({ size = 20, className }: Props) {
  return (
    <span
      className={`inline-flex items-center ${className ?? ''}`}
      style={{ gap: size * 0.4 }}
    >
      <svg
        width={size * 1.25}
        height={size * 1.25}
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="horae-logo-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0050d4" />
            <stop offset="100%" stopColor="#7b9cff" />
          </linearGradient>
        </defs>
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke="url(#horae-logo-grad)"
          strokeWidth="2.5"
        />
        <path
          d="M16 8 L16 16 L21 19"
          stroke="url(#horae-logo-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span
        className="font-display font-extrabold tracking-tight text-on-surface"
        style={{ fontSize: size, letterSpacing: '-0.02em' }}
      >
        horae
      </span>
    </span>
  );
}
