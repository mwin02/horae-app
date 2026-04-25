/**
 * Activity-level visual resolution.
 *
 * Activities may carry per-row `color` / `icon` overrides. When NULL, they
 * inherit from the parent category. Use this resolver wherever you display
 * activity-scoped color/icon (TimerCard, QuickSwitch, Timeline blocks,
 * EntryDetailModal, manage rows).
 *
 * SQL callers can express the same fallback inline as
 * `COALESCE(a.color, c.color)` and `COALESCE(a.icon, c.icon)`.
 */

interface ActivityVisualsInput {
  color: string | null;
  icon: string | null;
}

interface CategoryVisualsInput {
  color: string;
  icon: string | null;
}

export interface ActivityVisuals {
  color: string;
  icon: string | null;
}

export function resolveActivityVisuals(
  activity: ActivityVisualsInput,
  category: CategoryVisualsInput,
): ActivityVisuals {
  return {
    color: activity.color ?? category.color,
    icon: activity.icon ?? category.icon,
  };
}
