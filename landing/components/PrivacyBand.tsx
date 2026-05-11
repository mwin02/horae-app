export function PrivacyBand() {
  const items = ['No accounts', 'No sync server', 'No analytics', 'No ads'];
  return (
    <section className="px-6 md:px-20 py-8 md:py-10">
      <div
        className="relative overflow-hidden max-w-[1280px] mx-auto grid md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-center text-white"
        style={{
          background: 'linear-gradient(135deg, var(--color-on-surface) 0%, #1a1d40 100%)',
          borderRadius: 36,
          padding: 'clamp(32px, 6vw, 64px) clamp(24px, 6vw, 80px)',
        }}
      >
        <div
          aria-hidden
          className="absolute"
          style={{
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(123,156,255,0.25), transparent 70%)',
          }}
        />
        <div className="relative">
          <div
            className="font-bold uppercase"
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              color: 'var(--color-primary-container)',
              marginBottom: 20,
            }}
          >
            Privacy · Local-only
          </div>
          <h2
            className="font-display font-extrabold m-0 max-w-[700px]"
            style={{
              fontSize: 'clamp(28px, 4.2vw, 44px)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              textWrap: 'balance',
            }}
          >
            Your hours are yours. They never leave the phone.
          </h2>
          <p
            className="font-medium max-w-[620px]"
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.72)',
              margin: '20px 0 0',
            }}
          >
            No accounts. No sync. No analytics, telemetry, advertising IDs, or background phone-home. The app is a single sandboxed file on your device, and it stays that way.
          </p>
        </div>
        <div className="flex flex-col gap-3.5 relative">
          {items.map((l) => (
            <div
              key={l}
              className="flex items-center gap-3.5 min-w-[240px]"
              style={{
                padding: '14px 22px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary-container)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="font-bold text-[15px]">{l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
