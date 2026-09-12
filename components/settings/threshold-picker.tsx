import type { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useThemedStyles } from "@/hooks/useTheme";

/** Threshold choices in seconds; `null` = Auto (median-based). */
export const THRESHOLD_PRESETS: readonly (number | null)[] = [
  null,
  45 * 60,
  60 * 60,
  120 * 60,
  240 * 60,
] as const;

function thresholdLabel(value: number | null, t: TFunction): string {
  if (value === null) return t("settings.notificationSummary.auto");
  const minutes = value / 60;
  return minutes % 60 === 0
    ? t("duration.hours", { hours: minutes / 60 })
    : t("duration.minutes", { minutes });
}

export interface ThresholdPickerProps {
  value: number | null;
  onChange: (next: number | null) => void;
  disabled?: boolean;
}

export function ThresholdPicker({
  value,
  onChange,
  disabled,
}: ThresholdPickerProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const matchedValue = THRESHOLD_PRESETS.some((p) => p === value)
    ? value
    : null;

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      {THRESHOLD_PRESETS.map((preset) => {
        const selected = preset === matchedValue;
        return (
          <Pressable
            key={preset ?? "auto"}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && !selected && styles.chipPressed,
            ]}
            onPress={() => onChange(preset)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: !!disabled }}
          >
            <Text
              style={[
                styles.chipLabel,
                selected && styles.chipLabelSelected,
              ]}
            >
              {thresholdLabel(preset, t)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: SPACING.sm,
    flexWrap: "wrap",
  },
  rowDisabled: {
    opacity: 0.55,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: c.surfaceContainerLow,
  },
  chipPressed: {
    backgroundColor: c.surfaceContainer,
  },
  chipSelected: {
    backgroundColor: c.primary,
  },
  chipLabel: {
    ...TYPOGRAPHY.body,
    color: c.onSurface,
  },
  chipLabelSelected: {
    color: c.onPrimary,
  },
  });
}
