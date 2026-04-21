import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActiveDot } from '@/components/common/active-dot';
import { CategoryIcon } from '@/components/common/category-icon';
import { COLORS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { formatDuration } from '@/lib/timezone';

/** Fixed rendered height of the chip — used by callers for pixel-precise
 *  placement relative to the current-time indicator. */
export const ACTIVE_CHIP_HEIGHT = 48;

interface ActiveSessionChipProps {
  activityName: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  startedAt: Date;
  liveNow: Date;
  onPress: () => void;
}

/**
 * A horizontal pill-shaped card that surfaces the currently running activity
 * at the timeline's "now" indicator line. Replaces the running entry's
 * regular block so that brand-new sessions are always readable, without
 * overshooting the current-time line.
 */
export function ActiveSessionChip({
  activityName,
  categoryName,
  categoryColor,
  categoryIcon,
  startedAt,
  liveNow,
  onPress,
}: ActiveSessionChipProps): React.ReactElement {
  const elapsedSeconds = Math.max(
    0,
    Math.round((liveNow.getTime() - startedAt.getTime()) / 1000),
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: categoryColor + '1A', // 10% opacity tint
          borderColor: categoryColor + '33', // 20% opacity border
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.left}>
        <CategoryIcon icon={categoryIcon} size={16} color={categoryColor} />
        <Text style={styles.activityName} numberOfLines={1}>
          {activityName}
        </Text>
        <Text
          style={[styles.categoryBadge, { color: categoryColor }]}
          numberOfLines={1}
        >
          {categoryName}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.duration}>{formatDuration(elapsedSeconds)}</Text>
        <ActiveDot />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ACTIVE_CHIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.ambient,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
    minWidth: 0,
  },
  activityName: {
    ...TYPOGRAPHY.titleMd,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  categoryBadge: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  duration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    fontVariant: ['tabular-nums'],
  },
});
