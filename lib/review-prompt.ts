import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { Linking } from "react-native";

import { getReviewEligibilityStats } from "@/db/queries";

/**
 * "Enjoying Horae?" review prompt bookkeeping. State lives in AsyncStorage
 * (device-local UI state, not user data — it never needs to sync).
 *
 * The prompt only asks once the user has real usage behind them, and backs
 * off after every answer. iOS additionally caps the native review sheet to
 * 3 displays per 365 days, so `requestReview()` may silently no-op.
 */

const KEY = "horae.reviewPrompt.v1";

/** Opens Horae's App Store page straight on the "Write a Review" form. */
const APP_STORE_WRITE_REVIEW_URL =
  "https://apps.apple.com/app/id6771047445?action=write-review";

/** Completed entries required before the first ask. */
const MIN_COMPLETED_ENTRIES = 10;
/** Distinct days with at least one entry — filters out a single binge session. */
const MIN_ACTIVE_DAYS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Wait after a dismiss ("not now"). */
const DISMISS_COOLDOWN_MS = 30 * DAY_MS;
/** Wait after "could be better" — give fixes time to land. */
const DECLINE_COOLDOWN_MS = 120 * DAY_MS;

export type ReviewPromptOutcome = "rated" | "declined" | "dismissed";

interface ReviewPromptState {
  lastPromptedAt: string | null;
  lastOutcome: ReviewPromptOutcome | null;
}

const EMPTY_STATE: ReviewPromptState = {
  lastPromptedAt: null,
  lastOutcome: null,
};

async function readState(): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<ReviewPromptState>;
    return {
      lastPromptedAt: parsed.lastPromptedAt ?? null,
      lastOutcome: parsed.lastOutcome ?? null,
    };
  } catch {
    return EMPTY_STATE;
  }
}

async function writeState(state: ReviewPromptState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // best effort
  }
}

function isCoolingDown(state: ReviewPromptState, now: number): boolean {
  if (state.lastOutcome === "rated") return true;
  if (!state.lastPromptedAt || !state.lastOutcome) return false;
  const cooldown =
    state.lastOutcome === "declined" ? DECLINE_COOLDOWN_MS : DISMISS_COOLDOWN_MS;
  return now - new Date(state.lastPromptedAt).getTime() < cooldown;
}

/** True when the "Enjoying Horae?" sheet should be shown now. */
export async function shouldShowReviewPrompt(): Promise<boolean> {
  const state = await readState();
  if (isCoolingDown(state, Date.now())) return false;

  try {
    if (!(await StoreReview.hasAction())) return false;
    const stats = await getReviewEligibilityStats();
    return (
      stats.completedEntries >= MIN_COMPLETED_ENTRIES &&
      stats.activeDays >= MIN_ACTIVE_DAYS
    );
  } catch {
    return false;
  }
}

/** Persist the user's answer so the cooldown starts. */
export async function recordReviewPromptOutcome(
  outcome: ReviewPromptOutcome,
): Promise<void> {
  await writeState({
    lastPromptedAt: new Date().toISOString(),
    lastOutcome: outcome,
  });
}

/** Open the native store review sheet. */
export async function requestStoreReview(): Promise<void> {
  try {
    await StoreReview.requestReview();
  } catch {
    // Native sheet unavailable — nothing useful to show instead.
  }
}

/**
 * Always-available path to a written review (Settings row). Unlike
 * `requestStoreReview`, iOS never throttles this — it leaves the app.
 */
export async function openAppStoreReviewPage(): Promise<void> {
  try {
    await Linking.openURL(APP_STORE_WRITE_REVIEW_URL);
  } catch {
    // No App Store (e.g. some simulators) — nothing to fall back to.
  }
}

/** Debug-only: forget past answers so the prompt can be tested again. */
export async function resetReviewPromptState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best effort
  }
}
