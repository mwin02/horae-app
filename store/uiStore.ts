import { create } from 'zustand';
import { getCurrentTimezone, getTodayDate } from '@/lib/timezone';

/**
 * Zustand store for ephemeral UI state.
 *
 * All persistent data lives in PowerSync/SQLite — this store is only
 * for transient UI concerns that don't need to survive app restarts.
 */

/**
 * Deferred actions the home tab subscribes to. Set by `useTimerDeepLinks`
 * when a deep link arrives (e.g. the home-screen widget's "Tap to start"
 * CTA), cleared by the home tab once handled. Kept here rather than in a
 * context provider so non-React code paths (the deep-link handler) can
 * write without prop drilling.
 */
export type PendingHomeAction = "newSession";

interface UIState {
  /** Currently selected date for the timeline view (YYYY-MM-DD) */
  selectedDate: string;
  /** Set the selected date for the timeline */
  setSelectedDate: (date: string) => void;
  /** Reset selected date to today */
  resetToToday: () => void;
  /** A one-shot action the home tab should perform when it next mounts/renders. */
  pendingHomeAction: PendingHomeAction | null;
  /** Queue (or clear) a pending home-tab action. */
  setPendingHomeAction: (action: PendingHomeAction | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: getTodayDate(getCurrentTimezone()),

  setSelectedDate: (date: string) => set({ selectedDate: date }),

  resetToToday: () =>
    set({ selectedDate: getTodayDate(getCurrentTimezone()) }),

  pendingHomeAction: null,

  setPendingHomeAction: (action: PendingHomeAction | null) =>
    set({ pendingHomeAction: action }),
}));
