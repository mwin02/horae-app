import React from 'react';
import { Pressable, Text, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TYPOGRAPHY, RADIUS, SHADOWS, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/hooks/useTheme';

interface GradientButtonProps {
  onPress: () => void;
  label?: string;
  children?: React.ReactNode;
  shape?: 'pill' | 'circle';
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GradientButton({
  onPress,
  label,
  children,
  shape = 'pill',
  size = 80,
  disabled = false,
  style,
}: GradientButtonProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const isCircle = shape === 'circle';
  const circleStyle: ViewStyle = isCircle
    ? { width: size, height: size, borderRadius: size / 2 }
    : {};

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        { opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          isCircle ? styles.circle : styles.pill,
          circleStyle,
          SHADOWS.gradientButton,
        ]}
      >
        {children}
        {label && (
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: RADIUS.full,
    },
    circle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...TYPOGRAPHY.button,
      color: c.onPrimary,
      flexShrink: 1,
    },
  });
}
