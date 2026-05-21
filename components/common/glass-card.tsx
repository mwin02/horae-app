import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { RADIUS, SHADOWS, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassCard({ children, style }: GlassCardProps): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
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

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    outerWrapper: {
      borderRadius: RADIUS['3xl'],
      overflow: 'hidden',
      ...SHADOWS.ambient,
    },
    blur: {
      backgroundColor: c.glassBackground,
    },
    androidFallback: {
      backgroundColor: c.glassBackground,
    },
    innerContent: {
      padding: 32,
    },
  });
}
