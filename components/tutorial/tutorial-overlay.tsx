import React from "react";

import { WelcomeCarousel } from "./welcome-carousel";

/**
 * Renders the first-run welcome carousel. Mount once near the root of the
 * navigation tree. Reads its own state from `useTutorial`, so it can be
 * dropped anywhere inside `TutorialProvider`.
 */
export function TutorialOverlay(): React.ReactElement {
  return <WelcomeCarousel />;
}
