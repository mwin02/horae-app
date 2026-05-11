import { AppStoreBadge } from './AppStoreBadge';

export function FinalCTA() {
  return (
    <section
      className="px-6 py-24 md:px-20 md:py-40 text-center"
      style={{ background: 'var(--color-surface-low)' }}
    >
      <div className="max-w-[820px] mx-auto">
        <h2
          className="font-display font-extrabold m-0"
          style={{
            fontSize: 'clamp(40px, 7vw, 80px)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
            textWrap: 'balance',
          }}
        >
          See where the day really went.
        </h2>
        <p
          className="font-medium"
          style={{
            fontSize: 'clamp(15px, 1.5vw, 19px)',
            color: 'var(--color-on-surface-variant)',
            margin: '28px 0 44px',
            lineHeight: 1.5,
          }}
        >
          Free on iPhone. No accounts, no setup. Coming to the App Store soon.
        </p>
        <div className="inline-flex flex-col items-center gap-3.5">
          <AppStoreBadge height={60} />
          <div
            className="font-semibold"
            style={{ fontSize: 12, letterSpacing: 0.5, color: 'var(--color-on-surface-variant)' }}
          >
            Requires iOS 17 or later
          </div>
        </div>
      </div>
    </section>
  );
}
