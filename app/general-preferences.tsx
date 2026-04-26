import { Stack } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  updateUserPreferences,
  type InsightsPeriod,
} from "@/db/queries/user-preferences";
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

export default function GeneralPreferencesScreen(): React.ReactElement {
  const { preferences } = useUserPreferences();

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

        <Text style={styles.sectionLabel}>Week starts on</Text>
        <View style={styles.group}>
          {WEEK_DAY_OPTIONS.map((opt) => (
            <ChoiceRow
              key={opt.value}
              label={opt.label}
              selected={preferences.weekStartDay === opt.value}
              onPress={() => handleWeekStartChange(opt.value)}
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
}

function ChoiceRow({ label, selected, onPress }: ChoiceRowProps): React.ReactElement {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
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
    color: COLORS.onSurface,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  group: {
    gap: SPACING.sm,
  },
  helper: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    paddingHorizontal: SPACING.xs,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  choiceRowSelected: {
    backgroundColor: COLORS.surfaceContainer,
  },
  choiceRowPressed: {
    opacity: 0.7,
  },
  choiceLabel: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
  },
  choiceLabelSelected: {
    color: COLORS.primary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
