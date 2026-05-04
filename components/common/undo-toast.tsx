import { COLORS, FONTS, RADIUS, SHADOWS, SPACING, TYPOGRAPHY } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

interface UndoToastProps {
  /** Message body. Toast is hidden when null. */
  message: string | null;
  /** Action label (e.g. "Resume"). */
  actionLabel: string;
  /** Optional Feather icon rendered alongside the action label. */
  actionIcon?: FeatherIconName;
  /** Called when the user taps the action. */
  onAction: () => void;
  /** Called when the auto-dismiss timer fires or after the action runs. */
  onDismiss: () => void;
  /** Auto-dismiss delay in ms. Default 5000. */
  durationMs?: number;
}

/**
 * Bottom-anchored toast with a single action button. Visibility is driven
 * by `message`: pass a string to show it, pass null to hide. Auto-dismisses
 * after `durationMs`.
 */
export function UndoToast({
  message,
  actionLabel,
  actionIcon,
  onAction,
  onDismiss,
  durationMs = 5000,
}: UndoToastProps): React.ReactElement | null {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message === null) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const handle = setTimeout(() => onDismiss(), durationMs);
    return () => clearTimeout(handle);
  }, [message, durationMs, onDismiss, opacity, translateY]);

  useEffect(() => {
    if (message !== null) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [message, opacity, translateY]);

  if (message === null) return null;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.toast,
          { opacity, transform: [{ translateY }] },
        ]}
      >
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          onPress={() => {
            onAction();
            onDismiss();
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.action,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {actionIcon && (
            <Feather
              name={actionIcon}
              size={14}
              color={COLORS.primaryFixed}
              style={styles.actionIcon}
            />
          )}
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING['3xl'],
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inverseSurface,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.sm,
    minWidth: 240,
    maxWidth: 480,
    ...SHADOWS.ambient,
  },
  message: {
    ...TYPOGRAPHY.body,
    color: COLORS.inverseOnSurface,
    flexShrink: 1,
    marginRight: SPACING.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  actionIcon: {
    marginTop: -1,
  },
  actionLabel: {
    fontFamily: FONTS.jakartaBold,
    color: COLORS.primaryFixed,
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
