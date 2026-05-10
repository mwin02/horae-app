import * as Sentry from "@sentry/react-native";

/**
 * Sentry crash reporting for Horae.
 *
 * The app stores user-authored text in `time_entries.note` and other
 * places that could leak into Sentry events via stack frame variables,
 * breadcrumbs, or contexts. We aggressively scrub anything that smells
 * like user content before sending.
 *
 * DSN is read from EXPO_PUBLIC_SENTRY_DSN. If unset (e.g., in a fresh
 * dev clone), Sentry is a no-op.
 */

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

const REDACTED = "[redacted]";
const SENSITIVE_KEYS = new Set([
  "note",
  "notes",
  "name",
  "email",
  "title",
  "description",
  "body",
  "content",
  "text",
  "message_body",
]);

function scrub<T>(value: T, depth = 0): T {
  if (depth > 6 || value == null) return value;
  if (Array.isArray(value)) {
    return value.map((v) => scrub(v, depth + 1)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = typeof v === "string" ? REDACTED : v;
      } else {
        out[k] = scrub(v, depth + 1);
      }
    }
    return out as T;
  }
  return value;
}

export function initSentry(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    sendDefaultPii: false,
    enableAutoSessionTracking: true,
    // Console breadcrumbs can include arbitrary console.log payloads
    // (e.g. row dumps containing notes). Drop them entirely; we still
    // get UI-action breadcrumbs and the error itself.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console") return null;
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.contexts) event.contexts = scrub(event.contexts);
      if (event.extra) event.extra = scrub(event.extra);
      if (event.tags) event.tags = scrub(event.tags);
      if (event.user) {
        // Local-only launch — never send user identifiers, even ones the SDK
        // attached automatically (device id, etc.).
        event.user = undefined;
      }
      return event;
    },
  });
}

export const captureException = Sentry.captureException;
export const wrap = Sentry.wrap;
