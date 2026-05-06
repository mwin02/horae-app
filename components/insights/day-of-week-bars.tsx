import { CategoryIconSwatch } from "./category-icon-swatch";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  useDayOfWeekBreakdown,
  type DayOfWeekBucket,
} from "@/hooks/useDayOfWeekBreakdown";
import { getCurrentTimezone, getTodayDate } from "@/lib/timezone";
import { useUIStore } from "@/store/uiStore";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface DayOfWeekBarsProps {
  weekDate: string; // YYYY-MM-DD — any day in the target week
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMELINE_HEIGHT = 140;

export function DayOfWeekBars({
  weekDate,
}: DayOfWeekBarsProps): React.ReactElement | null {
  const { days, legend, isLoading } = useDayOfWeekBreakdown(weekDate);
  const router = useRouter();
  const setSelectedDate = useUIStore((s) => s.setSelectedDate);
  const today = getTodayDate(getCurrentTimezone());

  const handleDayPress = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      router.push("/(tabs)/timeline");
    },
    [router, setSelectedDate],
  );

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.sectionLabel}>DAY-OF-WEEK PATTERN</Text>
        </View>
      </View>

      <View style={styles.barsRow}>
        {days.map((day) => {
          const isFuture = day.dateStr > today;
          if (isFuture) {
            return (
              <View key={day.dayIndex} style={styles.dayPressable}>
                <TimelineColumn day={day} dimmed />
              </View>
            );
          }
          return (
            <Pressable
              key={day.dayIndex}
              onPress={() => handleDayPress(day.dateStr)}
              style={({ pressed }) => [
                styles.dayPressable,
                pressed && styles.dayPressed,
              ]}
            >
              <TimelineColumn day={day} />
            </Pressable>
          );
        })}
      </View>

      {legend.length > 0 && (
        <View style={styles.legend}>
          {legend.map((cat) => (
            <View key={cat.id} style={styles.legendItem}>
              <CategoryIconSwatch icon={cat.icon} color={cat.color} />
              <Text style={styles.legendText}>{cat.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────

function TimelineColumn({
  day,
  dimmed = false,
}: {
  day: DayOfWeekBucket;
  dimmed?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.barColumn, dimmed && styles.barColumnDimmed]}>
      <View style={styles.timelineTrack}>
        {day.hours.map((h) => {
          const color = h.dominant?.color ?? "transparent";
          const opacity =
            h.dominant == null
              ? 0
              : Math.max(0.35, Math.min(1, h.coveredFraction));
          return (
            <View
              key={h.hour}
              style={{ flex: 1, backgroundColor: color, opacity }}
            />
          );
        })}
      </View>
      <Text style={styles.dayLabel}>{DAY_LABELS[day.weekdayMonZero]}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING["2xl"],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  titleBlock: {
    flex: 1,
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: SPACING.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barColumnDimmed: {
    opacity: 0.35,
  },
  dayPressable: {
    flex: 1,
  },
  dayPressed: {
    opacity: 0.6,
  },
  timelineTrack: {
    width: "100%",
    height: TIMELINE_HEIGHT,
    flexDirection: "column",
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
  },
  dayLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  legendText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
  },
});
