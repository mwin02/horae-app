import { Feather } from "@expo/vector-icons";
import { useQuery } from "@powersync/react";
import { useRouter } from "expo-router";
import type { TFunction } from "i18next";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SignOutPromptModal } from "@/components/common/sign-out-prompt-modal";
import { SettingRow } from "@/components/settings/setting-row";
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { NOTIFICATION_PREFERENCES_QUERY } from "@/db/queries";
import type { NotificationPreferencesRecord } from "@/db/schema";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { seedDemoDay } from "@/lib/dev-seed";
import { sendFeedback } from "@/lib/feedback";
import {
  openAppStoreReviewPage,
  resetReviewPromptState,
} from "@/lib/review-prompt";
import { formatWeekday } from "@/lib/i18n/format";

function formatThresholdSummary(seconds: number | null, t: TFunction): string {
  if (seconds === null) return t("settings.notificationSummary.auto");
  const minutes = Math.round(seconds / 60);
  if (minutes % 60 === 0) return t("duration.hours", { hours: minutes / 60 });
  return t("duration.minutes", { minutes });
}

function buildNotificationSummary(
  prefs: NotificationPreferencesRecord | null,
  t: TFunction,
): string {
  if (!prefs) return t("settings.notificationSummary.loading");
  const idle = prefs.idle_reminder_enabled === 1;
  const longRunning = prefs.long_running_enabled === 1;
  const goalAlerts = prefs.goal_alerts_enabled === 1;
  if (!idle && !longRunning && !goalAlerts) {
    return t("settings.notificationSummary.allOff");
  }
  const parts: string[] = [];
  if (idle) parts.push(t("settings.notificationSummary.idle"));
  if (longRunning) {
    const threshold = formatThresholdSummary(
      prefs.threshold_override_seconds ?? null,
      t,
    );
    parts.push(t("settings.notificationSummary.longRunning", { threshold }));
  }
  if (goalAlerts) parts.push(t("settings.notificationSummary.goalAlerts"));
  return parts.join(" · ");
}

export default function SettingsScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: prefsData } = useQuery<NotificationPreferencesRecord>(
    NOTIFICATION_PREFERENCES_QUERY,
  );
  const prefs = prefsData.length > 0 ? prefsData[0] : null;
  const { preferences } = useUserPreferences();
  const { user, signOut } = useAuth();
  const [signOutPromptVisible, setSignOutPromptVisible] = useState(false);

  const handleSignIn = useCallback(() => {
    router.push("/(auth)/sign-in");
  }, [router]);

  const openSignOutPrompt = useCallback(() => {
    setSignOutPromptVisible(true);
  }, []);

  const closeSignOutPrompt = useCallback(() => {
    setSignOutPromptVisible(false);
  }, []);

  const handleSignOut = useCallback(
    async (_wipeLocal: boolean) => {
      // Block 6 wires the wipeLocal path; for now both options just sign out.
      await signOut();
      setSignOutPromptVisible(false);
    },
    [signOut],
  );

  const goToGeneralPreferences = useCallback(() => {
    router.push("/general-preferences");
  }, [router]);

  const goToIdealAllocations = useCallback(() => {
    router.push("/ideal-allocations");
  }, [router]);

  const goToNotifications = useCallback(() => {
    router.push("/notifications-settings");
  }, [router]);

  const goToManageCategories = useCallback(() => {
    router.push("/manage-categories");
  }, [router]);

  const goToManageActivities = useCallback(() => {
    router.push("/manage-activities");
  }, [router]);

  const goToManageTags = useCallback(() => {
    router.push("/manage-tags");
  }, [router]);

  const goToManageData = useCallback(() => {
    router.push("/manage-data");
  }, [router]);

  const handleReportBug = useCallback(() => {
    void sendFeedback("bug");
  }, []);

  const handleRequestFeature = useCallback(() => {
    void sendFeedback("feature");
  }, []);

  const handleRateApp = useCallback(() => {
    void openAppStoreReviewPage();
  }, []);

  const handleSentryTest = useCallback(() => {
    throw new Error(`Horae Sentry test crash @ ${new Date().toISOString()}`);
  }, []);

  const handleSeedDemoDay = useCallback(async () => {
    try {
      const result = await seedDemoDay();
      const parts = [
        `${result.insertedEntries} entries across ${result.daysSeeded} days (${result.scheduleStartDate} → ${result.scheduleEndDate})`,
        `${result.goalsSet} goals`,
        result.running ? "running timer on today" : "no running timer",
      ];
      if (result.missingCategoryNames.length > 0) {
        parts.push(
          `missing: ${result.missingCategoryNames.slice(0, 3).join(", ")}${
            result.missingCategoryNames.length > 3 ? "…" : ""
          }`,
        );
      }
      // i18n-ignore-next-line: debug-only tool
      Alert.alert("Demo day seeded", parts.join(" · "));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[dev-seed] failed:", error);
      // i18n-ignore-next-line: debug-only tool
      Alert.alert("Seed failed", message);
    }
  }, []);

  const handleResetReviewPrompt = useCallback(async () => {
    await resetReviewPromptState();
    // i18n-ignore-next-line: debug-only tool
    Alert.alert("Review prompt reset", "Stop a timer to see it again (needs 10+ entries across 3+ days).");
  }, []);

  const notificationSummary = useMemo(
    () => buildNotificationSummary(prefs, t),
    [prefs, t],
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("settings.title")}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account section hidden until cloud sync ships. Keep auth code in place for the future update.
        <Text style={styles.sectionLabel}>Account</Text>
        {user ? (
          <SettingRow
            title={user.email ?? "Signed in"}
            description="Tap to sign out"
            onPress={openSignOutPrompt}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="user" size={20} color={colors.primary} />
            }
          />
        ) : (
          <SettingRow
            title="Sign in"
            description="Back up and sync across devices"
            onPress={handleSignIn}
            iconBackground={colors.surfaceContainer}
            iconChildren={
              <Feather name="log-in" size={20} color={colors.primary} />
            }
          />
        )}
        */}

        <Text style={styles.sectionLabel}>
          {t("settings.sectionPreferences")}
        </Text>
        <SettingRow
          title={t("settings.notifications")}
          description={notificationSummary}
          onPress={goToNotifications}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="bell" size={20} color={colors.primary} />
          }
        />
        <SettingRow
          title={t("settings.general")}
          description={t("settings.generalSummary", {
            day: formatWeekday(preferences.weekStartDay),
            period: t(`common.period.${preferences.defaultInsightsPeriod}`),
          })}
          onPress={goToGeneralPreferences}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="sliders" size={20} color={colors.primary} />
          }
        />
        <SettingRow
          title={t("settings.goals")}
          onPress={goToIdealAllocations}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="target" size={20} color={colors.primary} />
          }
        />

        <SettingRow
          title={t("settings.manageActivities")}
          onPress={goToManageActivities}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="list" size={20} color={colors.primary} />
          }
        />
        <SettingRow
          title={t("settings.manageCategories")}
          onPress={goToManageCategories}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="grid" size={20} color={colors.primary} />
          }
        />

        <SettingRow
          title={t("settings.manageTags")}
          onPress={goToManageTags}
          iconBackground={colors.surfaceContainer}
          iconChildren={<Feather name="tag" size={20} color={colors.primary} />}
        />
        <SettingRow
          title={t("settings.manageData")}
          onPress={goToManageData}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="database" size={20} color={colors.primary} />
          }
        />

        <Text style={styles.sectionLabel}>{t("settings.sectionHelp")}</Text>
        <SettingRow
          title={t("settings.rateApp")}
          description={t("settings.rateAppSummary")}
          onPress={handleRateApp}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="star" size={20} color={colors.primary} />
          }
        />
        <SettingRow
          title={t("settings.reportBug")}
          onPress={handleReportBug}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="alert-circle" size={20} color={colors.primary} />
          }
        />
        <SettingRow
          title={t("settings.requestFeature")}
          onPress={handleRequestFeature}
          iconBackground={colors.surfaceContainer}
          iconChildren={
            <Feather name="message-square" size={20} color={colors.primary} />
          }
        />

        {/* i18n-ignore-start: debug-only tools, never shown in release builds */}
        {process.env.EXPO_PUBLIC_ENABLE_DEBUG === "1" ? (
          <>
            <Text style={styles.sectionLabel}>Debug</Text>
            <SettingRow
              title="Trigger Sentry test crash"
              onPress={handleSentryTest}
              iconBackground={colors.surfaceContainer}
              iconChildren={
                <Feather name="zap" size={20} color={colors.error} />
              }
            />
            <SettingRow
              title="Seed demo day"
              onPress={handleSeedDemoDay}
              iconBackground={colors.surfaceContainer}
              iconChildren={
                <Feather name="play" size={20} color={colors.primary} />
              }
            />
            <SettingRow
              title="Reset review prompt"
              onPress={handleResetReviewPrompt}
              iconBackground={colors.surfaceContainer}
              iconChildren={
                <Feather name="star" size={20} color={colors.primary} />
              }
            />
          </>
        ) : null}
        {/* i18n-ignore-end */}
      </ScrollView>

      <SignOutPromptModal
        visible={signOutPromptVisible}
        onDismiss={closeSignOutPrompt}
        onSignOut={handleSignOut}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
    },
    header: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.lg,
      gap: SPACING.xs,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    listContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING["4xl"],
      gap: SPACING.sm,
    },
    sectionLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      paddingHorizontal: SPACING.sm,
      paddingTop: SPACING.sm,
    },
  });
}
