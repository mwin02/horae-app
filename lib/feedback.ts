import * as Application from "expo-application";
import * as MailComposer from "expo-mail-composer";
import { Alert, Linking, Platform } from "react-native";

import i18n from "@/lib/i18n";

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

// The prompts the user fills in are localized; the subject line and the
// "App info" block stay English so reports are easy to triage.
function buildBody(kind: FeedbackKind): string {
  const heading =
    kind === "bug"
      ? i18n.t("feedback.bugPrompt")
      : i18n.t("feedback.featurePrompt");
  const stepsBlock =
    kind === "bug"
      ? `\n\n${i18n.t("feedback.stepsToReproduce")}\n1.\n2.\n3.\n`
      : "";
  return [
    `${heading}\n\n\n`,
    stepsBlock,
    // i18n-ignore-next-line: developer-facing diagnostics
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
    Alert.alert(
      i18n.t("feedback.noMailTitle"),
      i18n.t("feedback.noMailBody", { email: SUPPORT_EMAIL }),
    );
  }
}
