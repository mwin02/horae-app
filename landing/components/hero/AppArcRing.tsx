import { LiveTimer } from '../LiveTimer';

type Props = { size?: number };

// Segment palette pulled from CATEGORY_PALETTE in the RN app.
const SEGMENTS: { start: number; len: number; color: string }[] = [
  { start: 0.4, len: 0.5, color: '#E91E63' },
  { start: 0.9, len: 1.3, color: '#9B59B6' },
  { start: 3.0, len: 0.2, color: '#9B59B6' },
  { start: 3.4, len: 4.2, color: '#34495E' },
  { start: 8.0, len: 0.6, color: '#9B59B6' },
  { start: 8.7, len: 0.4, color: '#34495E' },
  { start: 9.3, len: 1.4, color: '#E91E63' },
  { start: 10.8, len: 0.3, color: '#F39C12' },
  { start: 11.2, len: 0.4, color: '#34495E' },
  { start: 11.7, len: 1.4, color: '#E91E63' },
];

export function AppArcRing({ size = 300 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const stroke = size * 0.06;
  const circumference = 2 * Math.PI * r;

  // "Now" indicator sits at the end of the last segment.
  const nowHour = 11.7;
  const angle = (nowHour / 16) * 2 * Math.PI - Math.PI / 2;
  const nowX = cx + r * Math.cos(angle);
  const nowY = cy + r * Math.sin(angle);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="block">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--color-surface-high)"
          strokeWidth={stroke}
        />
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {SEGMENTS.map((s, i) => {
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
        <circle cx={nowX} cy={nowY} r={stroke * 0.95} fill="#fff" />
        <circle cx={nowX} cy={nowY} r={stroke * 0.4} fill="var(--color-on-surface)" />
        <text
          x={cx}
          y={cy - size * 0.13}
          textAnchor="middle"
          fontFamily="var(--font-jakarta), sans-serif"
          fontWeight="700"
          fontSize={size * 0.045}
          fill="var(--color-primary)"
          letterSpacing="2"
        >
          ● TRACKING
        </text>
        <text
          x={cx}
          y={cy - size * 0.05}
          textAnchor="middle"
          fontFamily="var(--font-manrope), sans-serif"
          fontWeight="800"
          fontSize={size * 0.085}
          fill="var(--color-on-surface)"
          letterSpacing="-1"
        >
          Productivity
        </text>
        {/* Stop button anchored inside the ring */}
        <circle cx={cx} cy={cy + size * 0.2} r={size * 0.07} fill="var(--color-on-surface)" />
        <rect
          x={cx - size * 0.025}
          y={cy + size * 0.2 - size * 0.025}
          width={size * 0.05}
          height={size * 0.05}
          fill="#fff"
          rx={2}
        />
      </svg>
      {/* Live-ticking mm:ss overlaid in the center. Positioned via percentage so
         it scales with the SVG. */}
      <div
        className="absolute font-display font-extrabold tabular-nums text-on-surface"
        style={{
          left: '50%',
          top: '57%',
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.14,
          letterSpacing: '-3px',
          color: 'var(--color-on-surface)',
          fontFamily: 'var(--font-manrope), sans-serif',
        }}
      >
        <LiveTimer startSeconds={6 * 60 + 56} />
      </div>
    </div>
  );
}
