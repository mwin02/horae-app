import { useQuery } from "@powersync/react";
import { Stack } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PermissionBanner } from "@/components/settings/permission-banner";
import { QuietHoursSection } from "@/components/settings/quiet-hours-section";
import { SettingRow } from "@/components/settings/setting-row";
import { ThresholdPicker } from "@/components/settings/threshold-picker";
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import {
  NOTIFICATION_PREFERENCES_QUERY,
  updateNotificationPreferences,
} from "@/db/queries";
import type { NotificationPreferencesRecord } from "@/db/schema";
import { useNotificationPermissionStatus } from "@/hooks/useNotificationPermissionStatus";
import { openSystemNotificationSettings } from "@/lib/notifications";

export default function NotificationsSettingsScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { data: prefsData } = useQuery<NotificationPreferencesRecord>(
    NOTIFICATION_PREFERENCES_QUERY,
  );
  const prefs = prefsData.length > 0 ? prefsData[0] : null;
  const { granted } = useNotificationPermissionStatus();

  const idleEnabled = prefs?.idle_reminder_enabled === 1;
  const longRunningEnabled = prefs?.long_running_enabled === 1;
  const goalAlertsEnabled = prefs?.goal_alerts_enabled === 1;
  const thresholdOverride = prefs?.threshold_override_seconds ?? null;
  const permissionDenied = granted === false;

  const handleToggleIdle = useCallback((value: boolean) => {
    void updateNotificationPreferences({
      idle_reminder_enabled: value ? 1 : 0,
    });
  }, []);

  const handleToggleLongRunning = useCallback((value: boolean) => {
    void updateNotificationPreferences({
      long_running_enabled: value ? 1 : 0,
    });
  }, []);

  const handleToggleGoalAlerts = useCallback((value: boolean) => {
    void updateNotificationPreferences({
      goal_alerts_enabled: value ? 1 : 0,
    });
  }, []);

  const handleThresholdChange = useCallback((next: number | null) => {
    void updateNotificationPreferences({
      threshold_override_seconds: next,
    });
  }, []);

  const handleOpenSettings = useCallback(() => {
    void openSystemNotificationSettings();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("settings.notifications") }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t("settings.notifications")}</Text>
          <Text style={styles.subtitle}>
            {t("notificationsSettings.subtitle")}
          </Text>
        </View>

        {permissionDenied ? (
          <View style={styles.bannerWrap}>
            <PermissionBanner onOpenSettings={handleOpenSettings} />
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>
          {t("notificationsSettings.sectionReminders")}
        </Text>
        <View style={styles.group}>
          <SettingRow
            title={t("notificationsSettings.idleTitle")}
            description={t("notificationsSettings.idleDescription")}
            disabled={permissionDenied}
            trailing={
              <Switch
                value={idleEnabled}
                onValueChange={handleToggleIdle}
                disabled={permissionDenied}
                trackColor={{ true: colors.primary, false: colors.outlineVariant }}
                thumbColor={colors.surfaceContainerLowest}
              />
            }
          />
          <SettingRow
            title={t("notificationsSettings.longRunningTitle")}
            description={t("notificationsSettings.longRunningDescription")}
            disabled={permissionDenied}
            trailing={
              <Switch
                value={longRunningEnabled}
                onValueChange={handleToggleLongRunning}
                disabled={permissionDenied}
                trackColor={{ true: colors.primary, false: colors.outlineVariant }}
                thumbColor={colors.surfaceContainerLowest}
              />
            }
          />
          <SettingRow
            title={t("notificationsSettings.goalAlertsTitle")}
            description={t("notificationsSettings.goalAlertsDescription")}
            disabled={permissionDenied}
            trailing={
              <Switch
                value={goalAlertsEnabled}
                onValueChange={handleToggleGoalAlerts}
                disabled={permissionDenied}
                trackColor={{ true: colors.primary, false: colors.outlineVariant }}
                thumbColor={colors.surfaceContainerLowest}
              />
            }
          />
        </View>

        <Text style={styles.sectionLabel}>
          {t("notificationsSettings.sectionThreshold")}
        </Text>
        <View style={styles.thresholdCard}>
          <ThresholdPicker
            value={thresholdOverride}
            onChange={handleThresholdChange}
            disabled={permissionDenied || !longRunningEnabled}
          />
          <Text style={styles.thresholdHelper}>
            {thresholdOverride === null
              ? t("notificationsSettings.thresholdAutoHelper")
              : t("notificationsSettings.thresholdFixedHelper")}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          {t("notificationsSettings.sectionQuietHours")}
        </Text>
        <QuietHoursSection prefs={prefs} permissionDenied={permissionDenied} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
    },
    scrollContent: {
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING["4xl"],
      gap: SPACING.md,
    },
    header: {
      paddingHorizontal: SPACING.xs,
      paddingTop: SPACING.md,
      gap: SPACING.xs,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
    bannerWrap: {
      marginTop: SPACING.sm,
    },
    sectionLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      marginTop: SPACING.lg,
      marginBottom: SPACING.xs,
      paddingHorizontal: SPACING.xs,
    },
    group: {
      gap: SPACING.sm,
    },
    thresholdCard: {
      padding: SPACING.lg,
      borderRadius: 16,
      backgroundColor: c.surfaceContainerLow,
      gap: SPACING.md,
    },
    thresholdHelper: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
    },
  });
}
