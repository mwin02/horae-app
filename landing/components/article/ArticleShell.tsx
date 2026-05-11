import type { ReactNode } from 'react';

type Props = {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
};

export function ArticleShell({ eyebrow, title, lead, children }: Props) {
  return (
    <main className="px-6 md:px-20 py-16 md:py-24">
      <div className="max-w-[65ch] mx-auto">
        {eyebrow && (
          <div
            className="font-bold uppercase"
            style={{
              fontSize: 12,
              letterSpacing: '0.18em',
              color: 'var(--color-on-surface-variant)',
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
        )}
        <h1
          className="font-display font-extrabold m-0"
          style={{
            fontSize: 'clamp(40px, 7vw, 64px)',
            lineHeight: 1,
            letterSpacing: '-0.035em',
          }}
        >
          {title}
        </h1>
        {lead && (
          <p
            className="font-medium"
            style={{
              fontSize: 'clamp(17px, 1.6vw, 21px)',
              lineHeight: 1.5,
              color: 'var(--color-on-surface-variant)',
              margin: '24px 0 56px',
            }}
          >
            {lead}
          </p>
        )}
        <div className="article-body">{children}</div>
      </div>
    </main>
  );
}
