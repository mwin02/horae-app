import Link from 'next/link';
import { Logo } from './Logo';

const SUPPORT_EMAIL = 'support@usehorae.com';

export function Footer() {
  return (
    <footer
      className="px-6 md:px-20 py-10 md:py-12 flex flex-wrap items-center justify-between gap-6 text-xs md:text-sm"
      style={{
        borderTop: '1px solid var(--color-surface-high)',
        color: 'var(--color-on-surface-variant)',
      }}
    >
      <Logo size={16} />
      <div className="flex flex-wrap gap-5 md:gap-7">
        <Link href="/privacy" className="font-semibold hover:opacity-80">
          Privacy
        </Link>
        <Link href="/support" className="font-semibold hover:opacity-80">
          Support
        </Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-semibold hover:opacity-80"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>
      <div className="font-medium">© 2026 Horae</div>
    </footer>
  );
}

export { SUPPORT_EMAIL };
