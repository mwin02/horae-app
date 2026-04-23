import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import {
  useMonthlyCoverage,
  type DayCoverageCell,
} from '@/hooks/useMonthlyCoverage';
import { formatDuration } from '@/lib/timezone';
import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';

interface CalendarHeatmapProps {
  monthDate: string; // YYYY-MM-DD — any day in the target month
  onDayPress: (date: string) => void;
}

const DOW_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarHeatmap({
  monthDate,
  onDayPress,
}: CalendarHeatmapProps): React.ReactElement | null {
  const { days, leadingBlankCount, isLoading } = useMonthlyCoverage(monthDate);

  if (isLoading) return null;

  const totalTrackedSeconds = days.reduce(
    (sum, d) => sum + d.trackedSeconds,
    0,
  );
  const daysTracked = days.filter((d) => d.trackedSeconds > 0).length;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>COVERAGE HEATMAP</Text>
      <Text style={styles.subtitle}>
        {daysTracked > 0
          ? `${formatDuration(totalTrackedSeconds)} across ${daysTracked} day${daysTracked === 1 ? '' : 's'}`
          : 'No tracked time this month'}
      </Text>

      <View style={styles.dowRow}>
        {DOW_LABELS.map((label, i) => (
          <Text key={i} style={styles.dowLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: leadingBlankCount }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {days.map((day) => (
          <HeatmapCell key={day.date} day={day} onPress={onDayPress} />
        ))}
      </View>

      <IntensityLegend />
    </View>
  );
}

// ──────────────────────────────────────────────

function HeatmapCell({
  day,
  onPress,
}: {
  day: DayCoverageCell;
  onPress: (date: string) => void;
}): React.ReactElement {
  const intensity = getIntensityBucket(day.coverage);
  const bg =
    day.trackedSeconds === 0
      ? COLORS.surfaceContainer
      : INTENSITY_COLORS[intensity];
  const textColor = intensity >= 3 ? COLORS.onPrimary : COLORS.onSurface;

  return (
    <Pressable
      onPress={() => !day.isFuture && onPress(day.date)}
      disabled={day.isFuture}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: bg,
          opacity: day.isFuture ? 0.3 : pressed ? 0.7 : 1,
        },
        day.isToday && styles.cellToday,
      ]}
    >
      <Text style={[styles.cellText, { color: textColor }]}>
        {day.dayNumber}
      </Text>
    </Pressable>
  );
}

// ──────────────────────────────────────────────

function IntensityLegend(): React.ReactElement {
  return (
    <View style={styles.legend}>
      <Text style={styles.legendLabel}>Less</Text>
      <View style={styles.legendCells}>
        <View
          style={[
            styles.legendCell,
            { backgroundColor: COLORS.surfaceContainer },
          ]}
        />
        {INTENSITY_COLORS.slice(1).map((color, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: color }]}
          />
        ))}
      </View>
      <Text style={styles.legendLabel}>More</Text>
    </View>
  );
}

// ──────────────────────────────────────────────

/**
 * 5-step intensity ramp built on the primary color family.
 * 0 = untracked (caller substitutes surfaceContainer).
 */
const INTENSITY_COLORS = [
  COLORS.surfaceContainer,
  COLORS.primaryContainer,
  COLORS.primaryFixedDim,
  COLORS.primary,
  COLORS.primaryDim,
];

/** Map coverage [0..1] to bucket index [0..4]. */
function getIntensityBucket(coverage: number): number {
  if (coverage <= 0) return 0;
  if (coverage < 0.25) return 1;
  if (coverage < 0.5) return 2;
  if (coverage < 0.75) return 3;
  return 4;
}

// ──────────────────────────────────────────────

const CELL_GAP = 4;
const SCREEN_PADDING = SPACING.xl * 2 + SPACING['2xl'] * 2; // scroll + card padding
const CELL_SIZE = Math.floor(
  (Dimensions.get('window').width - SCREEN_PADDING - CELL_GAP * 6) / 7,
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING['2xl'],
  },
  sectionLabel: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.lg,
  },
  dowRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  cellText: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 11,
    lineHeight: 14,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  legendLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.onSurfaceVariant,
  },
  legendCells: {
    flexDirection: 'row',
    gap: 2,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
