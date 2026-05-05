import { COLORS } from "@/constants/theme";
import type { GoalDirection } from "@/db/models";

export type DeltaPolarity = "good" | "bad" | "neutral";

/**
 * Map a directional delta + the category's goal polarity to a qualitative
 * good/bad/neutral verdict. `around` and missing goals are always neutral —
 * we don't know which direction the user wants, so we don't editorialize.
 */
export function deltaPolarity(
  direction: GoalDirection | null,
  up: boolean,
): DeltaPolarity {
  if (direction == null || direction === "around") return "neutral";
  if (direction === "at_most") return up ? "bad" : "good";
  return up ? "good" : "bad"; // at_least
}

export interface DeltaPalette {
  fg: string;
  bg: string;
}

export function deltaPalette(polarity: DeltaPolarity): DeltaPalette {
  if (polarity === "good") {
    return { fg: COLORS.secondary, bg: COLORS.secondaryContainer };
  }
  if (polarity === "bad") {
    return { fg: COLORS.error, bg: COLORS.errorContainer };
  }
  return { fg: COLORS.outline, bg: COLORS.surfaceContainer };
}
