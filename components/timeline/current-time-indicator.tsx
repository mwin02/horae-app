import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS, RADIUS } from '@/constants/theme';

interface CurrentTimeIndicatorProps {
  timezone: string;
}

/** Format the current time as "HH:MM" (24h) for the indicator pill */
function formatNowTime(timezone: string): string {
  return new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
}

export function CurrentTimeIndicator({ timezone }: CurrentTimeIndicatorProps): React.ReactElement {
  const [timeLabel, setTimeLabel] = useState(() => formatNowTime(timezone));

  // Update the time label every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLabel(formatNowTime(timezone));
    }, 30_000);
    return () => clearInterval(interval);
  }, [timezone]);

  // Pulsing dot animation
  const dotScale = useSharedValue(1);
  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [dotScale]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.timePill}>
        <Text style={styles.timeText}>{timeLabel}</Text>
      </View>
      <View style={styles.line} />
      <Animated.View style={[styles.dot, dotAnimatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  timePill: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  timeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#ffffff',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.primary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
});
