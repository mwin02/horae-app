import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, RADIUS, SHADOWS } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps): React.ReactElement {
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.outerWrapper, style]}>
        <BlurView intensity={24} tint="light" style={styles.blur}>
          <View style={styles.innerContent}>{children}</View>
        </BlurView>
      </View>
    );
  }

  // Android fallback — solid rgba background (no blur)
  return (
    <View style={[styles.outerWrapper, styles.androidFallback, style]}>
      <View style={styles.innerContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    borderRadius: RADIUS['3xl'],
    overflow: 'hidden',
    ...SHADOWS.ambient,
  },
  blur: {
    backgroundColor: COLORS.glassBackground,
  },
  androidFallback: {
    backgroundColor: COLORS.glassBackground,
  },
  innerContent: {
    padding: 32,
  },
});
