import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer, SUPPORT_EMAIL } from '@/components/Footer';
import { ArticleShell } from '@/components/article/ArticleShell';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'Get help with Horae. Email support, common questions, and how to wipe or export your data.',
};

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Why no account?',
    a: "Horae stores your data locally so there's no server to break in to and no one to hold your data. The trade-off is that we can't restore it if you lose your phone outside of iCloud Backup.",
  },
  {
    q: 'Will my data sync between devices?',
    a: "Not today. Your time entries live on the device you tracked them on. If you have iCloud Backup turned on, your data restores onto a new iPhone alongside the app.",
  },
  {
    q: 'Can I export my data?',
    a: 'Yes — Settings → Manage data lets you export everything as JSON or CSV. The export is a single file you can email yourself, drop into a notes app, or import into a spreadsheet.',
  },
  {
    q: 'Is there an Android version?',
    a: 'Not at the moment. Horae is iPhone-only while we figure out whether the design holds up on a different platform.',
  },
  {
    q: 'How do I delete my data?',
    a: 'Settings → Manage data → Wipe all data clears everything from the local database. Deleting the app from iOS removes the sandbox entirely.',
  },
];

export default function SupportPage() {
  return (
    <>
      <Header active="support" />
      <ArticleShell
        eyebrow="Help & contact"
        title="Support"
        lead="Hit a snag, have a feature request, or just curious how something works? Send a note — a real human reads it."
      >
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="block bg-white rounded-[24px] no-underline transition-transform hover:-translate-y-0.5"
          style={{
            padding: 24,
            marginBottom: 48,
            boxShadow:
              '0 20px 60px -20px rgba(40,43,81,0.12), 0 4px 12px -4px rgba(40,43,81,0.06)',
          }}
        >
          <div
            className="font-bold uppercase"
            style={{
              fontSize: 11,
              letterSpacing: '0.18em',
              color: 'var(--color-primary)',
              marginBottom: 8,
            }}
          >
            Email
          </div>
          <div
            className="font-display font-extrabold"
            style={{ fontSize: 26, color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}
          >
            {SUPPORT_EMAIL}
          </div>
          <div
            className="font-medium"
            style={{ fontSize: 14, color: 'var(--color-on-surface-variant)', marginTop: 4 }}
          >
            Reply usually within a day or two.
          </div>
        </a>

        <h2>Common questions</h2>
        {FAQS.map((f) => (
          <section key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </section>
        ))}
      </ArticleShell>
      <Footer />
    </>
  );
}
