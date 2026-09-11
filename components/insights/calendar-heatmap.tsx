import { FONTS, RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import {
  useMonthlyCoverage,
  type DayCoverageCell,
} from '@/hooks/useMonthlyCoverage';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { formatDuration } from '@/lib/timezone';
import React, { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { weekdayNames } from '@/lib/i18n/format';

interface CalendarHeatmapProps {
  monthDate: string; // YYYY-MM-DD — any day in the target month
  onDayPress: (date: string) => void;
}

export function CalendarHeatmap({
  monthDate,
  onDayPress,
}: CalendarHeatmapProps): React.ReactElement | null {
  const styles = useThemedStyles(makeStyles);
  const { days, leadingBlankCount, isLoading } = useMonthlyCoverage(monthDate);
  const { preferences } = useUserPreferences();
  const { t, i18n } = useTranslation();
  const dowLabels = useMemo(
    () => {
      // Mon=0 … Sun=6, localized narrow names (M, T, W… / 一, 二, 三…).
      const names = weekdayNames('narrow');
      return Array.from(
        { length: 7 },
        (_, i) => names[(preferences.weekStartDay + i) % 7],
      );
    },
    [preferences.weekStartDay, i18n.language],
  );

  if (isLoading) return null;

  const totalTrackedSeconds = days.reduce(
    (sum, d) => sum + d.trackedSeconds,
    0,
  );
  const daysTracked = days.filter((d) => d.trackedSeconds > 0).length;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('calendarHeatmap.title')}</Text>
      <Text style={styles.subtitle}>
        {daysTracked > 0
          ? t('calendarHeatmap.summary', {
              duration: formatDuration(totalTrackedSeconds),
              count: daysTracked,
            })
          : t('insightsCommon.noTrackedMonth')}
      </Text>

      <View style={styles.dowRow}>
        {dowLabels.map((label, i) => (
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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const intensityColors = getIntensityColors(colors);
  const intensity = getIntensityBucket(day.coverage);
  const bg =
    day.trackedSeconds === 0
      ? colors.surfaceContainer
      : intensityColors[intensity];
  const textColor = intensity >= 3 ? colors.onPrimary : colors.onSurface;

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
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const intensityColors = getIntensityColors(colors);
  const { t } = useTranslation();
  return (
    <View style={styles.legend}>
      <Text style={styles.legendLabel}>{t('calendarHeatmap.less')}</Text>
      <View style={styles.legendCells}>
        <View
          style={[
            styles.legendCell,
            { backgroundColor: colors.surfaceContainer },
          ]}
        />
        {intensityColors.slice(1).map((color, i) => (
          <View
            key={i}
            style={[styles.legendCell, { backgroundColor: color }]}
          />
        ))}
      </View>
      <Text style={styles.legendLabel}>{t('calendarHeatmap.more')}</Text>
    </View>
  );
}

// ──────────────────────────────────────────────

/**
 * 5-step intensity ramp built on the primary color family.
 * 0 = untracked (caller substitutes surfaceContainer).
 */
function getIntensityColors(c: ThemeColors): string[] {
  return [
    c.surfaceContainer,
    c.primaryContainer,
    c.primaryFixedDim,
    c.primary,
    c.primaryDim,
  ];
}

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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surfaceContainerLow,
      borderRadius: RADIUS.xl,
      padding: SPACING['2xl'],
    },
    sectionLabel: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
      marginBottom: SPACING.xs,
    },
    subtitle: {
      ...TYPOGRAPHY.bodySmall,
      color: c.onSurfaceVariant,
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
      color: c.onSurfaceVariant,
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
      borderColor: c.primary,
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
      color: c.onSurfaceVariant,
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
}
