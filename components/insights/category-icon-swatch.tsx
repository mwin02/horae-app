import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CategoryIcon } from '@/components/common/category-icon';

interface CategoryIconSwatchProps {
  icon: string | null;
  color: string;
  /**
   * Color used for the tinted background. Defaults to `color`. Pass a separate
   * value when `color` is a tonal/blended shade that would render too pale at
   * 15% alpha (e.g. activity-breakdown's per-slice tonal colors).
   */
  tintColor?: string;
  /** Outer swatch size in pixels. Defaults to 24. */
  size?: number;
  /** Inner icon size. Defaults to 14. */
  iconSize?: number;
}

/**
 * Tinted rounded-square wrapper around a CategoryIcon — matches the swatch
 * style introduced in actual-vs-ideal so all insight legends/rows share one
 * visual treatment for category/activity logos.
 */
export function CategoryIconSwatch({
  icon,
  color,
  tintColor,
  size = 24,
  iconSize = 14,
}: CategoryIconSwatchProps): React.ReactElement {
  const bg = (tintColor ?? color) + '26';
  return (
    <View
      style={[
        styles.swatch,
        { width: size, height: size, backgroundColor: bg },
      ]}
    >
      <CategoryIcon icon={icon} size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  swatch: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
