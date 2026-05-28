import React from "react";

import { TourBanner } from "./tour-banner";
import { WelcomeCarousel } from "./welcome-carousel";

/**
 * Renders the first-run tutorial UI. Mount once near the root of the
 * navigation tree. Reads its own state from `useTutorial`, so it can be
 * dropped anywhere inside `TutorialProvider`.
 */
export function TutorialOverlay(): React.ReactElement {
  return (
    <>
      <WelcomeCarousel />
      <TourBanner />
    </>
  );
}
