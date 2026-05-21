import { Stack } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import {
  updateUserPreferences,
  type InsightsPeriod,
} from "@/db/queries/user-preferences";
import { useTheme, useThemedStyles, type ThemeMode } from "@/hooks/useTheme";
import { useUserPreferences } from "@/hooks/useUserPreferences";

const WEEK_DAY_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Monday" },
  { value: 6, label: "Sunday" },
  { value: 5, label: "Saturday" },
];

const PERIOD_OPTIONS: { value: InsightsPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Match device" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function GeneralPreferencesScreen(): React.ReactElement {
  const { preferences } = useUserPreferences();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const handleWeekStartChange = useCallback((value: number) => {
    void updateUserPreferences({ week_start_day: value });
  }, []);

  const handlePeriodChange = useCallback((value: InsightsPeriod) => {
    void updateUserPreferences({ default_insights_period: value });
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen options={{ title: "General" }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>General</Text>
          <Text style={styles.subtitle}>
            Tweak how weeks line up and where insights land first.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
          {THEME_OPTIONS.map((opt) => (
            <ChoiceRow
              key={opt.value}
              label={opt.label}
              selected={themeMode === opt.value}
              onPress={() => setThemeMode(opt.value)}
              styles={styles}
            />
          ))}
        </View>
        <Text style={styles.helper}>
          &ldquo;Match device&rdquo; follows your system Light/Dark setting.
        </Text>

        <Text style={styles.sectionLabel}>Week starts on</Text>
        <View style={styles.group}>
          {WEEK_DAY_OPTIONS.map((opt) => (
            <ChoiceRow
              key={opt.value}
              label={opt.label}
              selected={preferences.weekStartDay === opt.value}
              onPress={() => handleWeekStartChange(opt.value)}
              styles={styles}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Default insights period</Text>
        <View style={styles.group}>
          {PERIOD_OPTIONS.map((opt) => (
            <ChoiceRow
              key={opt.value}
              label={opt.label}
              selected={preferences.defaultInsightsPeriod === opt.value}
              onPress={() => handlePeriodChange(opt.value)}
              styles={styles}
            />
          ))}
        </View>
        <Text style={styles.helper}>
          Applied the next time you open the Insights tab.
        </Text>
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
