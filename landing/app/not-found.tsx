import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="px-6 md:px-20 py-24 md:py-40 text-center">
        <h1
          className="font-display font-extrabold m-0"
          style={{ fontSize: 'clamp(48px, 8vw, 96px)', lineHeight: 1, letterSpacing: '-0.04em' }}
        >
          404
        </h1>
        <p
          className="font-medium"
          style={{
            fontSize: 19,
            color: 'var(--color-on-surface-variant)',
            margin: '24px 0 32px',
          }}
        >
          That page isn&apos;t here.
        </p>
        <Link
          href="/"
          className="inline-block font-bold"
          style={{
            color: 'var(--color-primary)',
            fontSize: 16,
          }}
        >
          ← Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
