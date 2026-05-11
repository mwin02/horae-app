/**
 * "Download on the App Store" badge.
 *
 * This is a hand-built recreation that matches Apple's spec (135x40 viewBox,
 * 13.5% corner radius, Apple logo + two-line text). For real production use,
 * Apple's brand guidelines require their *exact* artwork — download the
 * official SVG from https://developer.apple.com/app-store/marketing/guidelines/
 * and drop it into `public/app-store-badge.svg`, then swap this component's
 * SVG for an <Image src="/app-store-badge.svg" />.
 *
 * TODO(launch):
 *   1) Replace this inline SVG with Apple's official badge artwork.
 *   2) Replace href="#" with the real App Store URL once Apple approves the app.
 */
type Props = {
  /** Pixel height. Apple requires >= 40pt; we default to 60 on desktop. */
  height?: number;
  className?: string;
};

export function AppStoreBadge({ height = 60, className }: Props) {
  const width = height * (135 / 40); // Apple's badge aspect ratio
  return (
    <a
      href="#"
      aria-label="Download Horae on the App Store"
      className={`inline-flex transition-transform hover:-translate-y-0.5 ${className ?? ''}`}
      style={{ height, width }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 135 40"
        width={width}
        height={height}
        aria-hidden="true"
      >
        <title>Download on the App Store</title>
        <rect width="135" height="40" rx="6.75" fill="#000" />
        <rect
          x="0.5"
          y="0.5"
          width="134"
          height="39"
          rx="6.25"
          fill="none"
          stroke="#a6a6a6"
          strokeWidth="0.2"
        />
        <g fill="#fff">
          {/* Apple logo */}
          <path d="M27.78 20.3c-.03-3.06 2.5-4.55 2.62-4.62-1.43-2.09-3.66-2.38-4.45-2.41-1.89-.2-3.69 1.11-4.65 1.11-.97 0-2.45-1.09-4.03-1.06-2.07.03-3.99 1.21-5.05 3.06-2.16 3.74-.55 9.27 1.55 12.31 1.03 1.49 2.25 3.16 3.85 3.1 1.55-.06 2.13-1 4-1 1.86 0 2.4 1 4.03.97 1.67-.03 2.72-1.51 3.73-3.01 1.18-1.72 1.66-3.39 1.69-3.48-.04-.02-3.23-1.24-3.27-4.93l-.02-.04zM24.7 11.27c.85-1.04 1.43-2.48 1.27-3.92-1.23.05-2.72.82-3.6 1.84-.79.9-1.49 2.36-1.3 3.78 1.38.1 2.79-.7 3.63-1.7z" />
          {/* "Download on the" */}
          <text
            x="42"
            y="16"
            fontFamily="-apple-system, system-ui, sans-serif"
            fontSize="7"
            fontWeight="400"
          >
            Download on the
          </text>
          {/* "App Store" */}
          <text
            x="42"
            y="31"
            fontFamily="-apple-system, system-ui, sans-serif"
            fontSize="17"
            fontWeight="600"
            letterSpacing="-0.3"
          >
            App Store
          </text>
        </g>
      </svg>
    </a>
  );
}
