/* eslint-disable @next/next/no-img-element */
/**
 * "Download on the App Store" badge — Apple's official artwork served
 * from /public. We use a plain <img> rather than next/image because:
 *   - SVGs don't benefit from raster optimisation
 *   - keeps Apple's exact vector intact, no Next/Image cropping concerns
 */
type Props = {
  /** Pixel height. Apple requires >= 40pt; default 60 on desktop. */
  height?: number;
  className?: string;
};

// Apple's official badge artwork is 119.66407 × 40 — preserve that ratio.
const ASPECT = 119.66407 / 40;

const APP_STORE_URL = 'https://apps.apple.com/app/horae/id6771047445';

export function AppStoreBadge({ height = 60, className }: Props) {
  const width = height * ASPECT;
  return (
    <a
      href={APP_STORE_URL}
      aria-label="Download Horae on the App Store"
      className={`inline-flex transition-transform hover:-translate-y-0.5 ${className ?? ''}`}
      style={{ height, width }}
    >
      <img
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        height={height}
        width={width}
        style={{ display: 'block', height, width }}
      />
    </a>
  );
}
