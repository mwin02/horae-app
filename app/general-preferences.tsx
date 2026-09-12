import { Stack } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import {
  updateUserPreferences,
  type InsightsPeriod,
} from "@/db/queries/user-preferences";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme, useThemedStyles, type ThemeMode } from "@/hooks/useTheme";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { APP_LANGUAGES, LANGUAGE_NATIVE_NAMES } from "@/lib/i18n";
import { formatWeekday } from "@/lib/i18n/format";

const WEEK_DAY_OPTIONS: number[] = [0, 6, 5];

const PERIOD_OPTIONS: InsightsPeriod[] = ["daily", "weekly", "monthly"];

const THEME_OPTIONS = [
  { value: "system", labelKey: "generalPreferences.themeSystem" },
  { value: "light", labelKey: "generalPreferences.themeLight" },
  { value: "dark", labelKey: "generalPreferences.themeDark" },
] as const satisfies readonly { value: ThemeMode; labelKey: string }[];

export default function GeneralPreferencesScreen(): React.ReactElement {
  const { t } = useTranslation();
  const { preferences } = useUserPreferences();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const {
    preference: languagePreference,
    systemLanguage,
    setPreference: setLanguagePreference,
  } = useLanguage();
  const styles = useThemedStyles(makeStyles);

  const handleWeekStartChange = useCallback((value: number) => {
    void updateUserPreferences({ week_start_day: value });
  }, []);

  const handlePeriodChange = useCallback((value: InsightsPeriod) => {
    void updateUserPreferences({ default_insights_period: value });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: t("settings.general") }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t("settings.general")}</Text>
          <Text style={styles.subtitle}>{t("generalPreferences.subtitle")}</Text>
        </View>

        {/* Hidden until a second language ships — a one-option picker is noise. */}
        {APP_LANGUAGES.length > 1 ? (
          <>
            <Text style={styles.sectionLabel}>
              {t("generalPreferences.sectionLanguage")}
            </Text>
            <View style={styles.group}>
              <ChoiceRow
                label={t("generalPreferences.languageSystem", {
                  language: LANGUAGE_NATIVE_NAMES[systemLanguage],
                })}
                selected={languagePreference === "system"}
                onPress={() => setLanguagePreference("system")}
                styles={styles}
              />
              {APP_LANGUAGES.map((lang) => (
                <ChoiceRow
                  key={lang}
                  label={LANGUAGE_NATIVE_NAMES[lang]}
                  selected={languagePreference === lang}
                  onPress={() => setLanguagePreference(lang)}
                  styles={styles}
                />
              ))}
            </View>
            <Text style={styles.helper}>
              {t("generalPreferences.languageHelper")}
            </Text>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>
          {t("generalPreferences.sectionAppearance")}
        </Text>
        <View style={styles.group}>
          {THEME_OPTIONS.map((opt) => (
            <ChoiceRow
              key={opt.value}
              label={t(opt.labelKey)}
              selected={themeMode === opt.value}
              onPress={() => setThemeMode(opt.value)}
              styles={styles}
            />
          ))}
        </View>
        <Text style={styles.helper}>{t("generalPreferences.themeHelper")}</Text>

        <Text style={styles.sectionLabel}>
          {t("generalPreferences.sectionWeekStart")}
        </Text>
        <View style={styles.group}>
          {WEEK_DAY_OPTIONS.map((day) => (
            <ChoiceRow
              key={day}
              label={formatWeekday(day, "long")}
              selected={preferences.weekStartDay === day}
              onPress={() => handleWeekStartChange(day)}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>
          {t("generalPreferences.sectionDefaultPeriod")}
        </Text>
        <View style={styles.group}>
          {PERIOD_OPTIONS.map((period) => (
            <ChoiceRow
              key={period}
              label={t(`common.period.${period}`)}
              selected={preferences.defaultInsightsPeriod === period}
              onPress={() => handlePeriodChange(period)}
              styles={styles}
            />
          ))}
        </View>
        <Text style={styles.helper}>{t("generalPreferences.periodHelper")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

interface ChoiceRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function ChoiceRow({
  label,
  selected,
  onPress,
  styles,
}: ChoiceRowProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choiceRow,
        selected && styles.choiceRowSelected,
        pressed && styles.choiceRowPressed,
      ]}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>
        {label}
      </Text>
      {selected ? <View style={styles.dot} /> : null}
    </Pressable>
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
    helper: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
      paddingHorizontal: SPACING.xs,
    },
    choiceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceContainerLow,
    },
    choiceRowSelected: {
      backgroundColor: c.surfaceContainer,
    },
    choiceRowPressed: {
      opacity: 0.7,
    },
    choiceLabel: {
      ...TYPOGRAPHY.titleMd,
      color: c.onSurface,
    },
    choiceLabelSelected: {
      color: c.primary,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.primary,
    },
  });
}
