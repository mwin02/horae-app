const SEGS: { start: number; len: number; color: string }[] = [
  { start: 0.4, len: 0.4, color: '#E91E63' },
  { start: 0.85, len: 1.2, color: '#9B59B6' },
  { start: 3.3, len: 4.0, color: '#34495E' },
  { start: 8.1, len: 0.6, color: '#9B59B6' },
  { start: 8.8, len: 0.4, color: '#34495E' },
  { start: 9.3, len: 1.3, color: '#E91E63' },
  { start: 10.7, len: 0.3, color: '#F39C12' },
  { start: 11.1, len: 0.4, color: '#34495E' },
  { start: 11.6, len: 1.3, color: '#E91E63' },
];

export function TimerVisual() {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const stroke = size * 0.07;
  const circumference = 2 * Math.PI * r;
  const nowHour = 11.6;
  const angle = (nowHour / 16) * 2 * Math.PI - Math.PI / 2;
  const nx = cx + r * Math.cos(angle);
  const ny = cy + r * Math.sin(angle);

  return (
    <div
      className="rounded-[20px] flex items-center justify-center"
      style={{
        background: 'var(--color-surface-low)',
        padding: 20,
        height: 240,
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={200} height={200}>
        <defs>
          <linearGradient id="feat-start-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0050d4" />
            <stop offset="100%" stopColor="#7b9cff" />
          </linearGradient>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-surface-high)"
          strokeWidth={stroke}
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {SEGS.map((s, i) => {
            const dashLen = (s.len / 16) * circumference;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                strokeDashoffset={-((s.start / 16) * circumference)}
              />
            );
          })}
        </g>
        <circle cx={nx} cy={ny} r={stroke * 0.95} fill="#fff" />
        <circle cx={nx} cy={ny} r={stroke * 0.4} fill="var(--color-on-surface)" />
        <circle cx={cx} cy={cy} r={size * 0.27} fill="url(#feat-start-grad)" />
        <path
          d={`M ${cx - size * 0.04} ${cy - size * 0.05} L ${cx + size * 0.05} ${cy} L ${cx - size * 0.04} ${cy + size * 0.05} Z`}
          fill="#fff"
        />
        <text
          x={cx}
          y={cy + size * 0.13}
          textAnchor="middle"
          fontFamily="var(--font-manrope), sans-serif"
          fontWeight="800"
          fontSize={size * 0.085}
          fill="#fff"
          letterSpacing="-0.3"
        >
          Start
        </text>
      </svg>
    </div>
  );
}
