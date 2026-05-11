import { FeatureCard } from './features/FeatureCard';
import { TimerVisual } from './features/TimerVisual';
import { GoalVisual } from './features/GoalVisual';
import { LockVisual } from './features/LockVisual';

const FEATURES = [
  {
    label: 'TRACK',
    title: "Start a timer. That's it.",
    body:
      'Tap a category, the day starts filling in. No setup, no taxonomy debates, no Sunday-night planning ritual. The timeline writes itself while you live.',
    Visual: TimerVisual,
  },
  {
    label: 'GOALS',
    title: 'Goals that describe, not demand.',
    body:
      'Set a daily or weekly target — say, eight hours of sleep, or under six hours of screens. Horae shows you where you are, not where you should be.',
    Visual: GoalVisual,
  },
  {
    label: 'PRIVATE',
    title: 'Your day stays on your phone.',
    body:
      'Everything is stored locally. No accounts, no sync server, no analytics SDK quietly phoning home. Lose the phone, lose the data — that is the deal.',
    Visual: LockVisual,
  },
];

export function SectionFeatures() {
  return (
    <section id="features" className="px-6 py-20 md:px-20 md:py-36">
      <div className="max-w-[1280px] mx-auto">
        <div className="grid md:grid-cols-[1fr_auto] items-end gap-4 mb-12 md:mb-16">
          <h2
            className="font-display font-extrabold m-0 max-w-[720px]"
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
            }}
          >
            Three small ideas, doing most of the work.
          </h2>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
            01 — 03 / Features
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <FeatureCard
              key={f.label}
              index={i}
              label={f.label}
              title={f.title}
              body={f.body}
            >
              <f.Visual />
            </FeatureCard>
          ))}
        </div>
      </div>
    </section>
  );
}
