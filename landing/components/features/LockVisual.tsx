export function LockVisual() {
  const items = ['No account', 'No analytics', 'No iCloud sync', 'No ads, ever'];
  return (
    <div
      className="rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, var(--color-surface-low), var(--color-surface-high))',
        height: 200,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center"
          style={{ boxShadow: '0 4px 12px rgba(40,43,81,0.1)' }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </div>
        <div>
          <div
            className="font-bold"
            style={{ fontSize: 11, letterSpacing: 1.2, color: 'var(--color-on-surface-variant)' }}
          >
            ON DEVICE
          </div>
          <div className="font-display font-extrabold text-base">This iPhone</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((l) => (
          <div key={l} className="flex items-center gap-2 text-[13px] font-semibold">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
