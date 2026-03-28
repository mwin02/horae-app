import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '@/constants/theme';

const DOT_COUNT = 3;
const ANIMATION_DURATION = 800;
const DELAY_BETWEEN = 200;

function Dot({ index }: { index: number }): React.ReactElement {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      index * DELAY_BETWEEN,
      withRepeat(
        withSequence(
          withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: ANIMATION_DURATION, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function PulsingDots(): React.ReactElement {
  return (
    <View style={styles.container}>
      {Array.from({ length: DOT_COUNT }, (_, i) => (
        <Dot key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
});
