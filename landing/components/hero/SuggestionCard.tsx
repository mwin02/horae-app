type Props = {
  catLabel: string;
  catColor: string;
  catBg: string;
  title: string;
  subtitle: string;
};

function Dumbbell({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8v8M3 10v4M18 8v8M21 10v4M7 12h10" />
    </svg>
  );
}

export function SuggestionCard({ catLabel, catColor, catBg, title, subtitle }: Props) {
  return (
    <div
      className="flex-1 bg-white rounded-[20px] p-4 min-w-0"
      style={{ boxShadow: '0 4px 12px rgba(40,43,81,0.06)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: catBg, color: catColor }}
        >
          <Dumbbell size={18} color={catColor} />
        </div>
        <div
          className="text-[12px] font-extrabold whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ letterSpacing: 1.2, color: catColor }}
        >
          {catLabel}
        </div>
      </div>
      <div
        className="font-display font-extrabold mt-4 leading-tight overflow-hidden text-ellipsis whitespace-nowrap"
        style={{ fontSize: 22, letterSpacing: '-0.015em' }}
      >
        {title}
      </div>
      <div
        className="text-xs mt-1 font-medium"
        style={{ color: 'var(--color-on-surface-variant)' }}
      >
        {subtitle}
      </div>
      <div
        className="mt-3 rounded-full px-3.5 py-2 inline-flex items-center gap-1.5 font-display font-bold text-[13px]"
        style={{ background: 'var(--color-surface-low)', color: 'var(--color-on-surface)' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <path d="M2 1 L9 5 L2 9 Z" />
        </svg>
        Start
      </div>
    </div>
  );
}
