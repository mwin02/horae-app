import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@/constants/theme';
import { formatDuration } from '@/lib/timezone';

interface GapBlockProps {
  durationSeconds: number;
  height: number;
  onPress: (locationY: number) => void;
}

export function GapBlock({
  durationSeconds,
  height,
  onPress,
}: GapBlockProps): React.ReactElement {
  const isTiny = durationSeconds < 30 * 60;
  const isCompact = !isTiny && height < 48;

  return (
    <Pressable
      onPress={(e) => onPress(e.nativeEvent.locationY)}
      style={({ pressed }) => [
        styles.container,
        { height },
        pressed && styles.pressed,
      ]}
    >
      {isTiny ? null : isCompact ? (
        <View style={styles.compactRow}>
          <Feather name="plus" size={12} color={COLORS.onSurfaceVariant + '4D'} />
          <Text style={styles.compactLabel}>{formatDuration(durationSeconds)}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>Untracked</Text>
          <View style={styles.addRow}>
            <Feather name="plus-circle" size={14} color={COLORS.onSurfaceVariant + '4D'} />
            <Text style={styles.duration}>{formatDuration(durationSeconds)}</Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow + '66', // 40% opacity
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant + '26', // 15% opacity
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: COLORS.surfaceContainer + '66',
  },
  label: {
    ...TYPOGRAPHY.labelUppercase,
    color: COLORS.onSurfaceVariant + '4D', // 30% opacity
    marginBottom: SPACING.xs,
    letterSpacing: 2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  duration: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant + '4D',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  compactLabel: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant + '4D',
  },
});
