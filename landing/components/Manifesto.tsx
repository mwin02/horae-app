export function Manifesto() {
  return (
    <section
      className="px-6 py-20 md:px-20 md:py-36 relative"
      style={{ background: 'var(--color-surface-low)' }}
    >
      <div className="max-w-[920px] mx-auto">
        <div
          className="uppercase font-bold"
          style={{
            fontSize: 12,
            letterSpacing: '0.18em',
            color: 'var(--color-on-surface-variant)',
            marginBottom: 28,
          }}
        >
          A note from the maker
        </div>
        <p
          className="font-display font-bold m-0"
          style={{
            fontSize: 'clamp(32px, 5vw, 56px)',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            textWrap: 'pretty',
          }}
        >
          You are not bad at scheduling.
          <br />
          <span style={{ color: 'var(--color-on-surface-variant)' }}>
            Schedules are bad at you.
          </span>
        </p>
        <div
          className="grid md:grid-cols-2 gap-8 md:gap-12 font-medium max-w-[880px]"
          style={{
            marginTop: 56,
            fontSize: 'clamp(15px, 1.4vw, 18px)',
            lineHeight: 1.6,
            color: 'var(--color-on-surface-variant)',
          }}
        >
          <p className="m-0">
            Most productivity apps assume you can decide today what tomorrow will look like, and then follow that plan to the minute. If that has never quite worked for you — if you bounce off rigid calendars, time-block templates, the whole guilt-shaped industry — you are not the broken part of the equation.
          </p>
          <p className="m-0">
            Horae works the other way around. Open it, tap what you&apos;re doing, and it starts a timer. At the end of the day, the day is just there: a soft ring of how the hours actually went. Set goals if you want them. Watch the patterns emerge. Adjust as you go. No plans. No guilt.
          </p>
        </div>
        <div
          className="italic font-medium"
          style={{ marginTop: 48, fontSize: 15, color: 'var(--color-on-surface-variant)' }}
        >
          — built by someone who also can&apos;t stick to a schedule
        </div>
      </div>
    </section>
  );
}
