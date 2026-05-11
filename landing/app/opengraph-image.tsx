import { ImageResponse } from 'next/og';

export const alt = 'Horae — Track your day, not your plan.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #f8f5ff 0%, #e7e6ff 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'system-ui',
          color: '#282b51',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: 40,
            color: '#282b51',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0050d4" />
                <stop offset="100%" stopColor="#7b9cff" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="14" fill="none" stroke="url(#g)" strokeWidth="2.5" />
            <path
              d="M16 8 L16 16 L21 19"
              stroke="url(#g)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          horae
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 92,
            fontWeight: 800,
            lineHeight: 0.98,
            letterSpacing: '-0.04em',
            maxWidth: 1000,
          }}
        >
          <span>Track your day,</span>
          <span style={{ color: '#555881' }}>not your plan.</span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#555881',
            fontWeight: 500,
            marginTop: 32,
            maxWidth: 900,
          }}
        >
          A quiet iOS time tracker for people who never quite stick to a schedule.
        </div>
      </div>
    ),
    size,
  );
}
