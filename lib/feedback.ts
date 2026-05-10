import * as Application from "expo-application";
import * as MailComposer from "expo-mail-composer";
import { Alert, Linking, Platform } from "react-native";

/**
 * Opens the system mail composer prefilled with app + device context so
 * a user can report a bug or request a feature without us collecting any
 * data ourselves. If no mail account is configured, falls back to a
 * mailto: URL.
 *
 * The recipient address is read from EXPO_PUBLIC_SUPPORT_EMAIL with a
 * temporary fallback. Update once the support domain is set up.
 */

const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? "david.hong199@gmail.com";

type FeedbackKind = "bug" | "feature";

function buildBody(kind: FeedbackKind): string {
  const heading =
    kind === "bug"
      ? "Describe what happened and what you expected:"
      : "Describe the feature or improvement you'd like to see:";
  const stepsBlock =
    kind === "bug"
      ? `\n\nSteps to reproduce:\n1.\n2.\n3.\n`
      : "";
  return [
    `${heading}\n\n\n`,
    stepsBlock,
    "\n— App info —",
    `App version: ${Application.nativeApplicationVersion ?? "unknown"} (build ${Application.nativeBuildVersion ?? "?"})`,
    `Platform: ${Platform.OS} ${Platform.Version}`,
  ].join("\n");
}

export async function sendFeedback(kind: FeedbackKind): Promise<void> {
  const subject =
    kind === "bug" ? "Horae bug report" : "Horae feature request";
  const body = buildBody(kind);

  const isAvailable = await MailComposer.isAvailableAsync();
  if (isAvailable) {
    await MailComposer.composeAsync({
      recipients: [SUPPORT_EMAIL],
      subject,
      body,
    });
    return;
  }

  // Fallback: mailto URL. Hits when MailComposer is unavailable, e.g. an
  // iOS simulator with no Mail account. Skip canOpenURL — iOS lies about
  // mailto availability when there's no configured account, and the real
  // failure mode (no email app at all) is rare enough on actual devices
  // that surfacing the address in an Alert is the right escape hatch.
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("No mail app", `Email us directly at ${SUPPORT_EMAIL}.`);
  }
}
