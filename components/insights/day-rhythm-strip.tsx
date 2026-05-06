import { CategoryIconSwatch } from './category-icon-swatch';
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { useDayRhythm } from '@/hooks/useDayRhythm';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface DayRhythmStripProps {
  date: string; // YYYY-MM-DD
}

const HOUR_LABELS: { hour: number; label: string }[] = [
  { hour: 0, label: '12a' },
  { hour: 6, label: '6a' },
  { hour: 12, label: '12p' },
  { hour: 18, label: '6p' },
];

export function DayRhythmStrip({
  date,
}: DayRhythmStripProps): React.ReactElement | null {
  const { hours, legend, isLoading } = useDayRhythm(date);

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>DAY RHYTHM</Text>
      <Text style={styles.subtitle}>
        When each category happened across the day
      </Text>

      <View style={styles.strip}>
        {hours.map((h) => {
          const color = h.dominant?.color ?? COLORS.surfaceContainer;
          // Fade uncovered-ish hours slightly so the rhythm reads cleanly
          const opacity =
            h.dominant == null
              ? 1
              : Math.max(0.35, Math.min(1, h.coveredFraction));
          return (
            <View
              key={h.hour}
              style={[
                styles.cell,
                { backgroundColor: color, opacity },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.axisRow}>
        {HOUR_LABELS.map(({ hour, label }) => (
          <Text
            key={hour}
            style={[
              styles.axisLabel,
              { left: `${(hour / 24) * 100}%` },
            ]}
          >
            {label}
          </Text>
        ))}
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
  strip: {
    flexDirection: 'row',
    height: 28,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceContainer,
    gap: 1,
  },
  cell: {
    flex: 1,
  },
  axisRow: {
    height: 16,
    marginTop: SPACING.xs,
    position: 'relative',
  },
  axisLabel: {
    position: 'absolute',
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.onSurfaceVariant,
    transform: [{ translateX: -8 }],
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurface,
  },
});
