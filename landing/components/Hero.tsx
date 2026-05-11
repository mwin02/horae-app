import { AppStoreBadge } from './AppStoreBadge';
import { AppHeroVisual } from './hero/AppHeroVisual';

export function Hero() {
  return (
    <section className="relative px-6 pt-6 pb-16 md:px-20 md:pt-20 md:pb-36 overflow-hidden">
      {/* ambient gradient blobs */}
      <div
        aria-hidden
        className="absolute -top-32 -right-20 w-[720px] h-[720px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, var(--color-surface-highest) 0%, transparent 70%)',
          opacity: 0.7,
          filter: 'blur(20px)',
        }}
      />
      <div
        aria-hidden
        className="absolute top-48 -left-52 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, var(--color-surface-high) 0%, transparent 65%)',
          opacity: 0.6,
          filter: 'blur(20px)',
        }}
      />

      <div className="relative z-[2] grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-16 items-center">
        <div>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white"
            style={{
              boxShadow: '0 4px 16px -4px rgba(40,43,81,0.1)',
              fontSize: 12,
              letterSpacing: '0.04em',
              color: 'var(--color-on-surface-variant)',
              fontWeight: 600,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--color-primary)' }}
            />
            NEW · COMING TO THE APP STORE
          </div>
          <h1
            className="font-display font-extrabold mt-7"
            style={{
              fontSize: 'clamp(48px, 7vw, 88px)',
              lineHeight: 0.96,
              letterSpacing: '-0.04em',
            }}
          >
            Track your day,
            <br />
            <span style={{ color: 'var(--color-on-surface-variant)' }}>
              not your plan.
            </span>
          </h1>
          <p
            className="font-medium mt-8 max-w-[520px]"
            style={{
              fontSize: 'clamp(16px, 1.6vw, 20px)',
              lineHeight: 1.5,
              color: 'var(--color-on-surface-variant)',
            }}
          >
            A quiet iOS time tracker for people who never quite stick to a schedule.
            Log what you actually did. See where the day really went.
          </p>
          <div className="flex flex-wrap items-center gap-5 mt-10">
            <AppStoreBadge height={60} />
            <div className="text-[13px]" style={{ color: 'var(--color-on-surface-variant)' }}>
              <div className="font-bold" style={{ color: 'var(--color-on-surface)' }}>
                Free · iPhone
              </div>
              <div>Local-only. No accounts.</div>
            </div>
          </div>
        </div>

        <div className="relative z-[2] flex justify-center">
          <div className="relative">
            <div
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                inset: '-5%',
                background:
                  'radial-gradient(ellipse at 50% 40%, rgba(123,156,255,0.35) 0%, transparent 60%)',
                filter: 'blur(20px)',
              }}
            />
            {/* Desktop: scale 1.05 ; mobile: scale 0.82 */}
            <div className="hidden md:block">
              <AppHeroVisual scale={1.05} />
            </div>
            <div className="md:hidden">
              <AppHeroVisual scale={0.82} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
