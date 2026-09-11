import { CategoryIconSwatch } from './category-icon-swatch';
import { FONTS, RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';
import { useDayRhythm } from '@/hooks/useDayRhythm';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatHourLabel } from '@/lib/timezone';

interface DayRhythmStripProps {
  date: string; // YYYY-MM-DD
}

/** Axis ticks: midnight, 6 AM, noon, 6 PM. */
const AXIS_HOURS = [0, 6, 12, 18] as const;

export function DayRhythmStrip({
  date,
}: DayRhythmStripProps): React.ReactElement | null {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { hours, legend, isLoading } = useDayRhythm(date);

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>{t('dayRhythm.title')}</Text>
      <Text style={styles.subtitle}>{t('dayRhythm.subtitle')}</Text>

      <View style={styles.strip}>
        {hours.map((h) => {
          const color = h.dominant?.color ?? colors.surfaceContainer;
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
        {AXIS_HOURS.map((hour) => (
          <Text
            key={hour}
            style={[
              styles.axisLabel,
              { left: `${(hour / 24) * 100}%` },
            ]}
          >
            {formatHourLabel(hour)}
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
    strip: {
      flexDirection: 'row',
      height: 28,
      borderRadius: RADIUS.sm,
      overflow: 'hidden',
      backgroundColor: c.surfaceContainer,
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
      color: c.onSurfaceVariant,
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
      color: c.onSurface,
    },
  });
}
