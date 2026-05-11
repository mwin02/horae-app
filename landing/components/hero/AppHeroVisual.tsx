import Image from "next/image";
import { LiveDate } from "../LiveDate";
import { LiveTimer } from "../LiveTimer";

/**
 * Tilted iPhone showing a real Focus-tab screenshot. Three things are
 * overlaid on top of the otherwise-static image so the hero reads as
 * live rather than frozen:
 *
 *   1. Today's date, masking the static "Sunday, May 10"
 *   2. The running-activity title "Exploring Horae", masking "App Develop..."
 *   3. A live-ticking 0:00 timer, masking the static "6:56"
 *
 * Each mask is a solid block in the underlying panel colour (#f8f4ff for
 * the screen surface, #f1eeff for the ring panel) — match the screenshot's
 * own background so the seam disappears.
 *
 * Coordinates and mask sizes are tuned to the 1179×2556 source screenshot;
 * if you replace `public/hero-screenshot.png` with a different layout,
 * resample the dark text bands and re-tune.
 */

type Props = {
  /** Multiplier on a base ~380px-wide phone. 1.05 on desktop, 0.82 on mobile. */
  scale?: number;
};

// Native iPhone-screenshot aspect ratio. These MUST match
// public/hero-screenshot.png's dimensions exactly — when the container's
// ratio matches the image's, object-fit:cover does nothing and the overlay
// percentages map 1:1 onto the source pixels.
const SCREEN_W = 1179;
const SCREEN_H = 2556;

const RUNNING_ACTIVITY = "Exploring Horae";

export function AppHeroVisual({ scale = 1 }: Props) {
  const w = 380 * scale;
  const bezel = 10 * scale;
  const radius = 44 * scale;
  // Compute the outer height so that the inner (post-padding) box has the
  // exact aspect ratio of the source screenshot. This makes object-fit:cover
  // a no-op and lets overlay top% map 1:1 onto natural-image yPct.
  const innerW = w - 2 * bezel;
  const innerH = innerW * (SCREEN_H / SCREEN_W);
  const h = innerH + 2 * bezel;

  return (
    <div
      style={{
        width: w,
        height: h,
        background: "#0a0d28",
        padding: bezel,
        borderRadius: radius,
        boxShadow:
          "0 60px 120px -30px rgba(0,30,90,0.5), 0 30px 60px -20px rgba(0,30,90,0.3)",
        transform: "rotate(-3deg)",
        transformOrigin: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: radius - bezel,
          overflow: "hidden",
        }}
      >
        <Image
          src="/hero-screenshot.png"
          alt="Horae Focus tab with a running timer"
          fill
          priority
          sizes={`${Math.round(w)}px`}
          style={{ objectFit: "cover" }}
        />

        {/* Date overlay — left-aligned, on the outer screen surface. */}
        <div
          className="absolute font-display font-bold flex items-center"
          style={{
            left: "1%",
            top: "10.3%",
            transform: "translateY(-50%)",
            height: w * 0.065,
            paddingLeft: w * 0.04,
            paddingRight: w * 0.02,
            background: "#f8f4ff",
            fontSize: w * 0.043,
            letterSpacing: "-0.01em",
            color: "#282b51",
            fontFamily: "var(--font-manrope), sans-serif",
            lineHeight: 1,
          }}
        >
          <LiveDate />
        </div>

        {/* Activity title overlay — centered above the timer, on the ring panel. */}
        <div
          className="absolute font-display font-extrabold flex items-center justify-center"
          style={{
            left: "50%",
            top: "34.3%",
            transform: "translate(-50%, -50%)",
            width: w * 0.5,
            height: w * 0.085,
            background: "#f1eeff",
            fontSize: w * 0.058,
            letterSpacing: "-0.02em",
            color: "#282b51",
            fontFamily: "var(--font-manrope), sans-serif",
            lineHeight: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {RUNNING_ACTIVITY}
        </div>

        {/* Live-ticking timer overlay — covers the static "6:56". */}
        <div
          className="absolute font-display font-extrabold tabular-nums flex items-center justify-center"
          style={{
            left: "50%",
            top: "39.6%",
            transform: "translate(-50%, -50%)",
            width: w * 0.32,
            height: w * 0.14,
            background: "#f1eeff",
            fontSize: w * 0.13,
            letterSpacing: "-0.04em",
            color: "#282b51",
            fontFamily: "var(--font-manrope), sans-serif",
            lineHeight: 1,
          }}
        >
          <LiveTimer startSeconds={0} />
        </div>
      </div>
    </div>
  );
}
