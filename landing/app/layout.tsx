import type { Metadata, Viewport } from 'next';
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

// Set once Apple approves the app and assigns a numeric App Store ID
// (visible in App Store Connect → My Apps → your app → General → App
// Information → "Apple ID"). When set, the layout emits the
// apple-itunes-app meta which triggers Safari's native install banner
// on iPhones — a meaningful conversion boost for mobile landing traffic.
const APP_STORE_ID = '';

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
  // Safari's Smart App Banner. Emitted only when APP_STORE_ID is set so
  // we don't ship a broken `app-id=` attribute before Apple approves.
  ...(APP_STORE_ID
    ? { other: { 'apple-itunes-app': `app-id=${APP_STORE_ID}` } }
    : {}),
};

export const viewport: Viewport = {
  // Warm sand — matches the app splash background (#D9B583). Themes
  // Safari's address bar on iOS and Chrome's toolbar on Android.
  themeColor: '#D9B583',
  width: 'device-width',
  initialScale: 1,
};

// JSON-LD structured data for Google rich-result eligibility. Declares
// Horae as a free iOS SoftwareApplication. Skipping aggregateRating
// intentionally — there are no real reviews yet, and fabricated ratings
// are a manual-action risk.
const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Horae',
  description:
    'A quiet iOS time tracker for people who never quite stick to a schedule. Log what you actually did. See where the day really went.',
  url: SITE,
  applicationCategory: 'ProductivityApplication',
  operatingSystem: 'iOS',
  image: `${SITE}/icon.png`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  ...(APP_STORE_ID
    ? {
        installUrl: `https://apps.apple.com/app/id${APP_STORE_ID}`,
        downloadUrl: `https://apps.apple.com/app/id${APP_STORE_ID}`,
      }
    : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${jakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          // Schema is a static object literal — no user input — so
          // dangerouslySetInnerHTML here is safe and is the standard
          // Next.js pattern for emitting JSON-LD.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
