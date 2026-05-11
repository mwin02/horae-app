import type { Metadata } from 'next';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const SITE = 'https://usehorae.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Horae — Track your day, not your plan.',
    template: '%s · Horae',
  },
  description:
    'A quiet iOS time tracker for people who never quite stick to a schedule. Log what you actually did. See where the day really went.',
  applicationName: 'Horae',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'Horae — Track your day, not your plan.',
    description:
      'A quiet iOS time tracker for people who never quite stick to a schedule.',
    url: SITE,
    siteName: 'Horae',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Horae — Track your day, not your plan.',
    description:
      'A quiet iOS time tracker for people who never quite stick to a schedule.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
