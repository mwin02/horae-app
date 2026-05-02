import { useEffect, useRef } from "react";
import { Linking } from "react-native";

import { stopEntry } from "@/db/queries";
import { db } from "@/lib/powersync";

/**
 * Listens for `horae://timer/...` deep links and dispatches them to the
 * existing PowerSync mutations. Mounted once at the root inside the
 * PowerSync provider (alongside `useNotificationScheduler` and
 * `useLiveActivity`).
 *
 * Currently handles:
 *   - `horae://timer/stop`  → stops the running entry, if any.
 *
 * Fired by the Stop buttons on the Live Activity (Block 4). The Live
 * Activity itself dismisses reactively via `useLiveActivity` once
 * `time_entries.ended_at` flips — no need to call `endLiveActivity`
 * here.
 *
 * Resolves the running entry via a fresh `db.getOptional` rather than
 * trusting the running-entry React query: the URL can land at cold
 * start before any React subscription has fired, and the React query
 * may still be stale on resume. A direct read avoids the race.
 */

const STOP_PATH = "/timer/stop";
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
      const url = parseHoraeUrl(rawUrl);
      if (!url) return;

      if (url.path === STOP_PATH) {
        void runStopAction(inFlightRef);
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

interface ParsedHoraeUrl {
  path: string;
}

function parseHoraeUrl(rawUrl: string): ParsedHoraeUrl | null {
  // Avoid `new URL()` — React Native's URL polyfill is incomplete for
  // custom schemes. Parse manually.
  if (!rawUrl.startsWith(HORAE_SCHEME)) return null;
  const withoutScheme = rawUrl.slice(HORAE_SCHEME.length).replace(/^\/\//, "");
  // `withoutScheme` is now e.g. "timer/stop" or "timer/stop?foo=bar".
  const [pathWithLeading] = withoutScheme.split("?");
  const path = pathWithLeading.startsWith("/")
    ? pathWithLeading
    : `/${pathWithLeading}`;
  return { path };
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
