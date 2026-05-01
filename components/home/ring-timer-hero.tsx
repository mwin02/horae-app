import { GradientButton } from "@/components/common/gradient-button";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import type { RunningTimer } from "@/db/models";
import { useElapsedTime } from "@/hooks/useElapsedTime";
import type { ClockArc } from "@/hooks/useTodayClockArcs";
import { formatTimerDisplay } from "@/lib/timezone";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const SIZE = 280;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const DAY_MINUTES = 24 * 60;

interface RingTimerHeroProps {
  arcs: ClockArc[];
  /** Current local minutes since midnight (0–1440). Drives the time pin. */
  nowMinutes: number;
  runningEntry: RunningTimer | null;
  onStartPress: () => void;
  onStop: () => void;
}

/**
 * Hero card with a 24-hour clock ring (12am at top, clockwise) showing
 * today's entries as colored arcs. The center swaps between a Start
 * gradient button (idle) and the live timer + stop button (active).
 */
export function RingTimerHero({
  arcs,
  nowMinutes,
  runningEntry,
  onStartPress,
  onStop,
}: RingTimerHeroProps): React.ReactElement {
  const isActive = runningEntry !== null;
  const elapsed = useElapsedTime(
    runningEntry ? runningEntry.startedAt.toISOString() : null,
  );

  // Pin coordinates pre-rotation: the SVG itself is rotated -90deg (so
  // angle 0 sits at 12 o'clock). x/y here are computed in math coords
  // and the wrapper rotation maps them onto the clock face.
  const pinAngle = (Math.min(nowMinutes, DAY_MINUTES) / DAY_MINUTES) * 2 * Math.PI;
  const pinX = SIZE / 2 + R * Math.cos(pinAngle);
  const pinY = SIZE / 2 + R * Math.sin(pinAngle);

  const arcCircles = useMemo(
    () =>
      arcs.map((arc) => {
        const span = arc.endMinute - arc.startMinute;
        if (span <= 0) return null;
        const length = (span / DAY_MINUTES) * C;
        const offset = (arc.startMinute / DAY_MINUTES) * C;
        return (
          <Circle
            key={arc.entryId}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={arc.color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${length} ${C - length}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
      }),
    [arcs],
  );

  return (
    <View style={styles.card}>
      <View style={styles.ringWrap}>
        <Svg
          width={SIZE}
          height={SIZE}
          // Rotate so dasharray offset 0 sits at 12 o'clock (top), going CW.
          style={styles.ringSvg}
        >
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={COLORS.surfaceContainerHigh}
            strokeWidth={STROKE}
            fill="none"
          />
          {arcCircles}

          {/* Current-time pin: white halo + ink dot at "now" on the ring. */}
          <Circle
            cx={pinX}
            cy={pinY}
            r={STROKE / 2 + 2}
            fill={COLORS.surfaceContainerLowest}
          />
          <Circle cx={pinX} cy={pinY} r={5} fill={COLORS.onSurface} />
        </Svg>

        <View style={styles.center} pointerEvents="box-none">
          {isActive ? (
            <ActiveCenter
              runningEntry={runningEntry}
              elapsedSeconds={elapsed}
              onStop={onStop}
            />
          ) : (
            <GradientButton
              shape="circle"
              size={148}
              onPress={onStartPress}
              style={styles.startBtn}
            >
              <Feather
                name="play"
                size={38}
                color={COLORS.onPrimary}
                style={styles.playIcon}
              />
              <Text style={styles.startLabel}>Start</Text>
            </GradientButton>
          )}
        </View>
      </View>
    </View>
  );
}

interface ActiveCenterProps {
  runningEntry: RunningTimer;
  elapsedSeconds: number;
  onStop: () => void;
}

function ActiveCenter({
  runningEntry,
  elapsedSeconds,
  onStop,
}: ActiveCenterProps): React.ReactElement {
  return (
    <View style={styles.activeCenter}>
      <View style={styles.trackingRow}>
        <View
          style={[
            styles.trackingDot,
            { backgroundColor: runningEntry.categoryColor },
          ]}
        />
        <Text
          style={[styles.trackingLabel, { color: runningEntry.categoryColor }]}
        >
          Tracking
        </Text>
      </View>
      <Text style={styles.activeName} numberOfLines={1}>
        {runningEntry.activityName}
      </Text>
      <Text style={styles.activeTimer}>{formatTimerDisplay(elapsedSeconds)}</Text>
      <Pressable
        style={({ pressed }) => [
          styles.stopBtn,
          { transform: [{ scale: pressed ? 0.95 : 1 }] },
        ]}
        onPress={onStop}
      >
        <View style={styles.stopIcon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xxl,
    paddingVertical: SPACING["3xl"],
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    position: "relative",
  },
  ringSvg: {
    transform: [{ rotate: "-90deg" }],
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    // GradientButton applies its own shadow.
  },
  playIcon: {
    marginLeft: 4,
  },
  startLabel: {
    ...TYPOGRAPHY.button,
    color: COLORS.onPrimary,
    fontSize: 15,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  activeCenter: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  trackingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.sm,
  },
  trackingDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  trackingLabel: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 10,
  },
  activeName: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
    marginBottom: 2,
    maxWidth: SIZE - SPACING["4xl"] * 2,
    textAlign: "center",
  },
  activeTimer: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
    marginBottom: SPACING.md,
  },
  stopBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: COLORS.onSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
});
