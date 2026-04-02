import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '@/components/common/category-icon';
import type { CategoryInsight } from '@/db/models';
import { formatDuration } from '@/lib/timezone';
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from '@/constants/theme';

interface CategoryBreakdownProps {
  categoryInsights: CategoryInsight[];
  totalTrackedMinutes: number;
}

export function CategoryBreakdown({
  categoryInsights,
  totalTrackedMinutes,
}: CategoryBreakdownProps): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>TIME DISTRIBUTION</Text>
      <Text style={styles.totalTime}>
        {formatDuration(totalTrackedMinutes * 60)} tracked
      </Text>

      <View style={styles.barsContainer}>
        {categoryInsights.map((insight) => (
          <CategoryBar
            key={insight.categoryId}
            insight={insight}
            totalMinutes={totalTrackedMinutes}
          />
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

interface CategoryBarProps {
  insight: CategoryInsight;
  totalMinutes: number;
}

function CategoryBar({ insight, totalMinutes }: CategoryBarProps): React.ReactElement {
  const percentage = totalMinutes > 0
    ? Math.round((insight.actualMinutes / totalMinutes) * 100)
    : 0;

  // Minimum visual width so tiny slices are still visible
  const barWidthPercent = totalMinutes > 0
    ? Math.max(3, (insight.actualMinutes / totalMinutes) * 100)
    : 0;

  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: barWidthPercent,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [barWidthPercent, animatedWidth]);

  return (
    <View style={styles.barRow}>
      <View style={styles.barLabelRow}>
        <View style={styles.barLabelLeft}>
          <View style={[styles.colorDot, { backgroundColor: insight.categoryColor }]} />
          <Text style={styles.categoryName} numberOfLines={1}>
            {insight.categoryName}
          </Text>
        </View>
        <View style={styles.barLabelRight}>
          <Text style={styles.duration}>
            {formatDuration(insight.actualMinutes * 60)}
          </Text>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
      </View>

      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: insight.categoryColor,
              width: animatedWidth.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

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
  totalTime: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
    marginBottom: SPACING.xl,
  },
  barsContainer: {
    gap: SPACING.lg,
  },
  // Individual bar row
  barRow: {
    gap: SPACING.sm,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  barLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurface,
    flex: 1,
  },
  barLabelRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  duration: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurfaceVariant,
  },
  percentage: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurface,
    minWidth: 32,
    textAlign: 'right',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.surfaceContainer,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});
