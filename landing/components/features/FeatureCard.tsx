import type { ReactNode } from 'react';

type Props = {
  index: number;
  label: string;
  title: string;
  body: string;
  children: ReactNode;
};

export function FeatureCard({ index, label, title, body, children }: Props) {
  return (
    <article
      className="bg-white rounded-[28px] p-8 flex flex-col min-h-[480px]"
      style={{
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
          marginBottom: 20,
        }}
      >
        {`0${index + 1}  ·  ${label}`}
      </div>
      {children}
      <h3
        className="font-display font-extrabold"
        style={{
          fontSize: 26,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          margin: '28px 0 12px',
        }}
      >
        {title}
      </h3>
      <p
        className="font-medium"
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: 'var(--color-on-surface-variant)',
          margin: 0,
        }}
      >
        {body}
      </p>
    </article>
  );
}
