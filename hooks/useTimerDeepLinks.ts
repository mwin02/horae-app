import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Linking } from "react-native";

import { stopEntry } from "@/db/queries";
import { db } from "@/lib/powersync";
import { useUIStore } from "@/store/uiStore";

/**
 * Listens for `horae://` deep links carrying an `action` query param
 * and dispatches them to the existing PowerSync mutations. Mounted
 * once at the root inside the PowerSync provider, alongside
 * `useNotificationScheduler` and `useLiveActivity`.
 *
 * Currently handles:
 *   - `?action=stop`       → stops the running entry, if any.
 *   - `?action=newSession` → opens the home tab's NewSessionModal.
 *
 * The action lives in a query param rather than the URL path because
 * Expo Router treats every URL path as a file-based route — anything
 * unknown shows the "Oops! / This screen doesn't exist" 404 page.
 * Putting the action on the root path (`horae:///?action=stop`) lands
 * on the home tab (a sensible place to be after stopping a timer) and
 * sidesteps that 404.
 *
 * The Live Activity itself dismisses reactively via `useLiveActivity`
 * once `time_entries.ended_at` flips — no need to call
 * `endLiveActivity` here.
 *
 * Resolves the running entry via a fresh `db.getOptional` rather than
 * trusting the running-entry React query: the URL can land at cold
 * start before any React subscription has fired, and the React query
 * may still be stale on resume. A direct read avoids the race.
 */

const HORAE_SCHEME = "horae:";

interface RunningRow {
  entry_id: string;
}

const RUNNING_ENTRY_ID_QUERY = `
  SELECT id AS entry_id
  FROM time_entries
  WHERE ended_at IS NULL
    AND deleted_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1
`;

export function useTimerDeepLinks(): void {
  // Prevent reentrancy if the same URL is delivered twice in quick
  // succession (e.g. cold-start initial URL + 'url' event).
  const inFlightRef = useRef(false);

  useEffect(() => {
    const handle = (rawUrl: string | null): void => {
      if (!rawUrl) return;
      const action = parseHoraeAction(rawUrl);
      if (action === "stop") {
        void runStopAction(inFlightRef);
      } else if (action === "newSession") {
        runNewSessionAction();
      }
    };

    // Handle a URL that opened the app (cold start).
    void Linking.getInitialURL().then(handle);

    // Handle subsequent URLs while the app is running.
    const subscription = Linking.addEventListener("url", (event) => {
      handle(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}

function parseHoraeAction(rawUrl: string): string | null {
  // Avoid `new URL()` — React Native's URL polyfill is incomplete for
  // custom schemes. Parse the query string manually.
  if (!rawUrl.startsWith(HORAE_SCHEME)) return null;
  const queryStart = rawUrl.indexOf("?");
  if (queryStart === -1) return null;
  const query = rawUrl.slice(queryStart + 1);
  for (const pair of query.split("&")) {
    const [rawKey, rawValue] = pair.split("=");
    if (decodeURIComponent(rawKey ?? "") === "action") {
      return decodeURIComponent(rawValue ?? "");
    }
  }
  return null;
}

function runNewSessionAction(): void {
  // Make sure the home tab is focused before flipping the flag — the
  // user may be on Timeline / Insights / Settings when they tap the
  // widget. Expo Router's `navigate` is a no-op if we're already there.
  router.navigate("/(tabs)");
  useUIStore.getState().setPendingHomeAction("newSession");
}

async function runStopAction(
  inFlightRef: React.MutableRefObject<boolean>,
): Promise<void> {
  if (inFlightRef.current) return;
  inFlightRef.current = true;
  try {
    const row = await db.getOptional<RunningRow>(RUNNING_ENTRY_ID_QUERY);
    if (!row) return; // No running timer — nothing to stop.
    await stopEntry(row.entry_id);
  } finally {
    inFlightRef.current = false;
  }
}
