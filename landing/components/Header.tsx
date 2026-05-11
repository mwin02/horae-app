import Link from 'next/link';
import { Logo } from './Logo';
import { AppStoreBadge } from './AppStoreBadge';

type Props = {
  /** Used to bold the matching nav link on /privacy and /support. */
  active?: 'features' | 'privacy' | 'support';
};

export function Header({ active }: Props) {
  const links: { label: string; href: string; key: NonNullable<Props['active']> }[] = [
    { label: 'Features', href: '/#features', key: 'features' },
    { label: 'Privacy', href: '/privacy', key: 'privacy' },
    { label: 'Support', href: '/support', key: 'support' },
  ];
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-20 md:py-8 relative z-10">
      <Link href="/" aria-label="Horae home">
        <Logo size={20} />
      </Link>
      <nav className="flex items-center gap-5 md:gap-9">
        <ul className="hidden sm:flex items-center gap-9">
          {links.map((l) => {
            const isActive = active === l.key;
            return (
              <li key={l.key}>
                <Link
                  href={l.href}
                  className={
                    'text-sm transition-colors hover:text-[color:var(--color-on-surface)] ' +
                    (isActive
                      ? 'font-bold text-[color:var(--color-on-surface)]'
                      : 'font-semibold text-[color:var(--color-on-surface-variant)]')
                  }
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <AppStoreBadge height={36} />
      </nav>
    </header>
  );
}
