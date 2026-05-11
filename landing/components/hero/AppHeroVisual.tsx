import { AppArcRing } from './AppArcRing';
import { SuggestionCard } from './SuggestionCard';

/**
 * Tilted dark phone frame with a recreation of the Horae Focus tab inside.
 *
 * TODO(launch): swap this SVG/HTML mock for a real iPhone screenshot once
 * `landing/public/hero-screenshot.png` exists. When that happens, replace the
 * inner <div className="phone-screen"> children with:
 *
 *   <Image
 *     src="/hero-screenshot.png"
 *     alt="Horae Focus tab with a running timer"
 *     fill
 *     priority
 *     className="object-cover"
 *   />
 *
 * The <LiveTimer> overlay inside <AppArcRing /> stays — that's the
 * "+ animated overlay" part of the hero. You'll need to reposition it
 * absolutely over the screenshot's timer area instead of being centered
 * inside the recreated ring.
 */

type Props = {
  /** Multiplier on a base ~380px-wide phone. 1.05 on desktop, 0.82 on mobile. */
  scale?: number;
};

function TabIcon({ kind, size }: { kind: 'clock' | 'cal' | 'bars' | 'gear'; size: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  if (kind === 'clock')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  if (kind === 'cal')
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    );
  if (kind === 'bars')
    return (
      <svg {...common}>
        <path d="M5 20V10M12 20V4M19 20v-7" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.7.7V17a2 2 0 1 1-4 0v-.1a1 1 0 0 0-1.7-.7l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1 1 0 0 0 5 12a1 1 0 0 0-.7-.3H4a2 2 0 1 1 0-4h.1A1 1 0 0 0 5 7a1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1 1 0 0 0 9 3.7V4a2 2 0 1 1 4 0v-.1a1 1 0 0 0 1.7-.7l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1 1 0 0 0 19 7" />
    </svg>
  );
}

export function AppHeroVisual({ scale = 1 }: Props) {
  const w = 380 * scale;
  return (
    <div
      className="rounded-[44px]"
      style={{
        width: w,
        background: '#0a0d28',
        padding: 8 * scale,
        boxShadow:
          '0 60px 120px -30px rgba(0,30,90,0.5), 0 30px 60px -20px rgba(0,30,90,0.3)',
        transform: 'rotate(-3deg)',
        transformOrigin: 'center',
        borderRadius: 44 * scale,
      }}
    >
      <div
        className="relative overflow-hidden font-sans"
        style={{
          background: 'var(--color-surface)',
          borderRadius: 38 * scale,
          padding: `${52 * scale}px ${22 * scale}px ${20 * scale}px`,
        }}
      >
        {/* notch */}
        <div
          className="absolute rounded-full"
          style={{
            top: 14 * scale,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 110 * scale,
            height: 32 * scale,
            background: '#0a0d28',
          }}
        />
        {/* status time */}
        <div
          className="absolute font-bold"
          style={{
            top: 18 * scale,
            left: 28 * scale,
            fontSize: 16 * scale,
            color: 'var(--color-on-surface)',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
          }}
        >
          4:34
        </div>
        {/* date */}
        <div
          className="font-display font-bold"
          style={{ fontSize: 16 * scale, letterSpacing: '-0.01em', marginTop: 4 * scale }}
        >
          Sunday, May 10
        </div>
        {/* title row */}
        <div className="flex justify-between items-center" style={{ marginTop: 2 * scale }}>
          <div
            className="font-display font-extrabold"
            style={{ fontSize: 38 * scale, letterSpacing: '-0.02em' }}
          >
            Horae
          </div>
          <div
            className="font-display font-extrabold rounded-full"
            style={{
              border: '1px solid var(--color-surface-high)',
              padding: `${10 * scale}px ${16 * scale}px`,
              fontSize: 13 * scale,
            }}
          >
            15h 25m today
          </div>
        </div>

        {/* arc ring panel */}
        <div
          className="flex items-center justify-center"
          style={{
            marginTop: 16 * scale,
            background: 'var(--color-surface-low)',
            borderRadius: 28 * scale,
            padding: 20 * scale,
          }}
        >
          <AppArcRing size={300 * scale} />
        </div>

        {/* Suggested for you */}
        <div
          className="font-display font-extrabold"
          style={{ marginTop: 22 * scale, fontSize: 26 * scale, letterSpacing: '-0.02em' }}
        >
          Suggested for you
        </div>
        <div style={{ marginTop: 14 * scale, display: 'flex', gap: 12 * scale }}>
          <SuggestionCard
            catLabel="HEALTH & FITNESS"
            catColor="#2ECC71"
            catBg="#d6f5e1"
            title="Gym"
            subtitle="You usually start around now"
          />
        </div>

        {/* tab bar */}
        <div
          className="flex justify-around"
          style={{
            marginTop: 18 * scale,
            paddingTop: 12 * scale,
            borderTop: '1px solid var(--color-surface-high)',
          }}
        >
          {(
            [
              { l: 'Focus', a: true, icon: 'clock' },
              { l: 'Timeline', a: false, icon: 'cal' },
              { l: 'Insights', a: false, icon: 'bars' },
              { l: 'Settings', a: false, icon: 'gear' },
            ] as const
          ).map((tab) => (
            <div
              key={tab.l}
              className="flex flex-col items-center"
              style={{
                gap: 4 * scale,
                color: tab.a
                  ? 'var(--color-primary)'
                  : 'var(--color-on-surface-variant)',
              }}
            >
              <TabIcon kind={tab.icon} size={20 * scale} />
              <div className="font-bold" style={{ fontSize: 11 * scale }}>
                {tab.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
