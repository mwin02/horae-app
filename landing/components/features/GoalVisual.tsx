type Row = {
  icon: 'moon' | 'game' | 'fork';
  iconBg: string;
  iconColor: string;
  label: string;
  delta: string;
  good: boolean;
  fill: number;
  barColor: string;
  kind: 'GOAL' | 'LIMIT';
};

const ROWS: Row[] = [
  {
    icon: 'moon',
    iconBg: 'var(--color-surface-high)',
    iconColor: 'var(--color-on-surface)',
    label: '7h 51m / 8h 0m',
    delta: '−9m',
    good: false,
    fill: 0.65,
    barColor: '#34495e',
    kind: 'GOAL',
  },
  {
    icon: 'game',
    iconBg: '#fde6ee',
    iconColor: '#E91E63',
    label: '4h 15m / 5h 0m',
    delta: '−45m',
    good: true,
    fill: 0.6,
    barColor: '#E91E63',
    kind: 'LIMIT',
  },
  {
    icon: 'fork',
    iconBg: '#fdecd2',
    iconColor: '#F39C12',
    label: '14m / 1h 30m',
    delta: '−1h 16m',
    good: false,
    fill: 0.16,
    barColor: '#F39C12',
    kind: 'GOAL',
  },
];

function Icon({ kind, color }: { kind: Row['icon']; color: string }) {
  if (kind === 'moon')
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  if (kind === 'game')
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill={color}>
        <path d="M7 8a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 3.5-1.5h3A5 5 0 0 0 17 18a5 5 0 0 0 5-5 5 5 0 0 0-5-5H7zm0 2.5a1.5 1.5 0 0 1 1.5 1.5A1.5 1.5 0 0 1 7 13.5 1.5 1.5 0 0 1 5.5 12 1.5 1.5 0 0 1 7 10.5zm10 0a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5z" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
      <path d="M8 3v8a2 2 0 0 0 2 2v8M6 3v6M10 3v6M16 3c-1 0-2 1-2 4v4h3v8" />
    </svg>
  );
}

export function GoalVisual() {
  return (
    <div
      className="rounded-[20px] p-4 flex flex-col gap-1 justify-center"
      style={{ background: 'var(--color-surface-low)', height: 240 }}
    >
      <div
        className="font-extrabold"
        style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--color-on-surface-variant)', marginBottom: 4 }}
      >
        ACTUAL VS IDEAL
      </div>
      {ROWS.map((g, i) => (
        <div
          key={i}
          style={{
            paddingTop: i === 0 ? 0 : 4,
            borderTop: i === 0 ? 'none' : '1px solid var(--color-surface-high)',
            paddingBottom: 4,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center flex-shrink-0"
              style={{ background: g.iconBg }}
            >
              <Icon kind={g.icon} color={g.iconColor} />
            </div>
            <div className="font-display font-extrabold text-[13px] flex-1">{g.label}</div>
            <div
              className="font-extrabold rounded-md"
              style={{
                fontSize: 10,
                padding: '2px 8px',
                background: g.good ? '#d4f5dd' : '#ffd7d4',
                color: g.good ? '#136a2a' : '#9f0519',
              }}
            >
              {g.delta}
            </div>
          </div>
          <div className="relative">
            <div
              className="h-[6px] rounded-[3px] overflow-hidden"
              style={{ background: 'var(--color-surface-highest)' }}
            >
              <div
                className="h-full rounded-[3px]"
                style={{ width: `${g.fill * 100}%`, background: g.barColor }}
              />
            </div>
            <div
              className="absolute h-3 w-0.5 rounded-sm"
              style={{ left: '60%', top: -3, background: 'var(--color-on-surface)' }}
            />
            <div
              className="absolute font-extrabold"
              style={{
                left: 'calc(60% + 5px)',
                top: -14,
                fontSize: 8,
                letterSpacing: 0.5,
                color: 'var(--color-on-surface)',
              }}
            >
              {g.kind}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
