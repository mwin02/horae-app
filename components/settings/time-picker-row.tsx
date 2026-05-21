import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import {
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type ThemeColors,
} from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";

export interface TimePickerRowProps {
  label: string;
  /** "HH:MM" 24-hour string. */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

function parseHHMM(value: string): { hours: number; minutes: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { hours: 0, minutes: 0 };
  return { hours: Number(match[1]), minutes: Number(match[2]) };
}

function formatHHMM(date: Date): string {
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDisplay(value: string): string {
  const { hours, minutes } = parseHHMM(value);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function TimePickerRow({
  label,
  value,
  onChange,
  disabled,
}: TimePickerRowProps): React.ReactElement {
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);

  const pickerValue = useMemo(() => {
    const { hours, minutes } = parseHHMM(value);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, [value]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled]);

  const handleChange = useCallback(
    (event: DateTimePickerEvent, next?: Date) => {
      if (Platform.OS !== "ios") {
        setOpen(false);
        if (event.type !== "set" || !next) return;
        onChange(formatHHMM(next));
        return;
      }
      if (next) onChange(formatHHMM(next));
    },
    [onChange],
  );

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && !disabled && styles.rowPressed,
        ]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueGroup}>
          <Text style={styles.value}>{formatDisplay(value)}</Text>
          <Feather
            name={open ? "chevron-down" : "chevron-right"}
            size={20}
            color={colors.onSurfaceVariant}
          />
        </View>
      </Pressable>
      {open ? (
        <View style={styles.pickerHost}>
          <DateTimePicker
            value={pickerValue}
            mode="time"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleChange}
            themeVariant={isDark ? "dark" : "light"}
          />
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      borderRadius: RADIUS.lg,
      backgroundColor: c.surfaceContainerLow,
      overflow: "hidden",
    },
    wrapperDisabled: {
      opacity: 0.55,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    rowPressed: {
      backgroundColor: c.surfaceContainer,
    },
    label: {
      ...TYPOGRAPHY.titleMd,
      color: c.onSurface,
    },
    valueGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
    },
    value: {
      ...TYPOGRAPHY.body,
      color: c.onSurface,
    },
    pickerHost: {
      paddingHorizontal: SPACING.sm,
      paddingBottom: SPACING.sm,
    },
  });
}
