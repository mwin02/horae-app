import { CategoryIcon } from "@/components/common/category-icon";
import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import {
  STREAK_WEEKS,
  useWeeklyStreaks,
  type WeeklyStreakCategory,
} from "@/hooks/useWeeklyStreaks";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const SWIPE_THRESHOLD = 40;
const RING_RADIUS = 26;
const RING_STROKE = 5;
const RING_SIZE = 64;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const HISTORY_BAR_MAX = 22;
const HISTORY_BAR_NULL = 8;
const HISTORY_BAR_MISS = 10;

interface WeeklyStreakProps {
  weekDate: string;
}

export function WeeklyStreak({
  weekDate,
}: WeeklyStreakProps): React.ReactElement | null {
  const { categories, isLoading } = useWeeklyStreaks(weekDate);
  const [idx, setIdx] = useState(0);

  if (isLoading) return null;
  if (categories.length === 0) return <EmptyState />;

  const safeIdx = Math.min(idx, categories.length - 1);
  const cat = categories[safeIdx];

  const goTo = (next: number): void => {
    const total = categories.length;
    if (total === 0) return;
    setIdx(((next % total) + total) % total);
  };
  const advance = (delta: number): void => goTo(safeIdx + delta);

  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onEnd((e) => {
      "worklet";
      if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(advance)(1);
      } else if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(advance)(-1);
      }
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.container}>
        <Header
          color={cat.categoryColor}
          total={categories.length}
          activeIdx={safeIdx}
          onSelect={goTo}
        />

        <CategoryRow
          cat={cat}
          onPrev={() => advance(-1)}
          onNext={() => advance(1)}
        />

        <HeroRow cat={cat} />

        <HistorySection cat={cat} />

        <FooterRow cat={cat} />
      </View>
    </GestureDetector>
  );
}

// ──────────────────────────────────────────────

interface HeaderProps {
  color: string;
  total: number;
  activeIdx: number;
  onSelect: (idx: number) => void;
}

function Header({
  color,
  total,
  activeIdx,
  onSelect,
}: HeaderProps): React.ReactElement {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrowTitle}>WEEKLY STREAK</Text>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <Pressable key={i} onPress={() => onSelect(i)} hitSlop={6}>
            <View
              style={[
                styles.pagerDot,
                i === activeIdx && {
                  width: 16,
                  backgroundColor: color,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

interface NavProps {
  cat: WeeklyStreakCategory;
  onPrev: () => void;
  onNext: () => void;
}

function CategoryRow({ cat, onPrev, onNext }: NavProps): React.ReactElement {
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryRowLeft}>
        <Pressable
          onPress={onPrev}
          hitSlop={8}
          style={({ pressed }) => [styles.chevron, pressed && styles.chevronPressed]}
          accessibilityLabel="Previous category"
        >
          <Feather name="chevron-left" size={14} color={COLORS.onSurfaceVariant} />
        </Pressable>
        <View style={[styles.dot, { backgroundColor: cat.categoryColor }]} />
        <CategoryIcon
          icon={cat.categoryIcon}
          size={14}
          color={cat.categoryColor}
        />
        <Text style={styles.categoryName} numberOfLines={1}>
          {cat.categoryName}
        </Text>
        <Pressable
          onPress={onNext}
          hitSlop={8}
          style={({ pressed }) => [styles.chevron, pressed && styles.chevronPressed]}
          accessibilityLabel="Next category"
        >
          <Feather name="chevron-right" size={14} color={COLORS.onSurfaceVariant} />
        </Pressable>
      </View>
      <Text style={styles.goalLabel} numberOfLines={1}>
        {goalLabel(cat)}
      </Text>
    </View>
  );
}

// ──────────────────────────────────────────────

function HeroRow({
  cat,
}: {
  cat: WeeklyStreakCategory;
}): React.ReactElement {
  const { streak, best } = cat;
  const flameColor = streak > 0 ? cat.categoryColor : COLORS.outline;
  const ringColor = cat.thisWeek.onTrack
    ? cat.categoryColor
    : COLORS.tertiaryContainer;

  return (
    <View style={styles.heroRow}>
      <View style={styles.heroLeft}>
        <Feather name="zap" size={32} color={flameColor} />
        <View style={styles.heroNumbers}>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakSub} numberOfLines={1}>
            {streak === 1 ? "week streak" : "weeks in a row"}
            {best > streak ? (
              <Text style={styles.streakSubMuted}> · best {best}</Text>
            ) : streak > 0 && best === streak ? (
              <Text style={styles.personalBest}> · personal best!</Text>
            ) : null}
          </Text>
        </View>
      </View>

      <ProgressRing pct={cat.thisWeek.progressPct} color={ringColor} />
    </View>
  );
}

function ProgressRing({
  pct,
  color,
}: {
  pct: number;
  color: string;
}): React.ReactElement {
  const dash = RING_CIRC * Math.max(0, Math.min(1, pct));
  const center = RING_SIZE / 2;
  return (
    <View style={styles.ringWrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke={COLORS.outlineVariant}
          strokeWidth={RING_STROKE}
        />
        <Circle
          cx={center}
          cy={center}
          r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${RING_CIRC}`}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringLabelWrap} pointerEvents="none">
        <Text style={styles.ringPct}>{Math.round(pct * 100)}%</Text>
        <Text style={styles.ringSub}>THIS WK</Text>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

function HistorySection({
  cat,
}: {
  cat: WeeklyStreakCategory;
}): React.ReactElement {
  const { history } = cat;
  const tracked = history.filter((h) => h !== null).length;
  const hits = history.filter((h) => h === 1).length;
  const currentColor = cat.thisWeek.onTrack
    ? cat.categoryColor
    : COLORS.tertiaryContainer;

  return (
    <View style={styles.historyBox}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>LAST 12 WEEKS</Text>
        <Text style={styles.historyMeta}>
          {hits}/{tracked} hit
        </Text>
      </View>
      <View style={styles.barsRow}>
        {history.map((h, i) => {
          const isCurrent = i === STREAK_WEEKS - 1;
          let height = HISTORY_BAR_MISS;
          let color: string = COLORS.outlineVariant;
          let opacity = 1;
          if (h === null) {
            height = HISTORY_BAR_NULL;
            opacity = 0.45;
          } else if (h === 1) {
            height = HISTORY_BAR_MAX;
            color = cat.categoryColor;
          }
          if (isCurrent) {
            color = currentColor;
            height = HISTORY_BAR_NULL + 14 * cat.thisWeek.progressPct;
            opacity = 1;
          }
          return (
            <View key={i} style={styles.barCol}>
              <View style={styles.barSlot}>
                <View
                  style={{
                    width: "100%",
                    height,
                    backgroundColor: color,
                    opacity,
                    borderRadius: 3,
                  }}
                />
              </View>
              <Text
                style={[
                  styles.barLabel,
                  isCurrent && styles.barLabelCurrent,
                ]}
                numberOfLines={1}
              >
                {isCurrent ? "now" : `−${STREAK_WEEKS - 1 - i}`}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

function FooterRow({
  cat,
}: {
  cat: WeeklyStreakCategory;
}): React.ReactElement {
  const { actualSeconds, goalSeconds, daysLeft, isLimit, onTrack } = cat.thisWeek;
  const chipFg = onTrack ? COLORS.secondary : COLORS.tertiary;
  const chipBg = onTrack ? COLORS.secondaryContainer : COLORS.tertiaryContainer;

  let chipText: string;
  if (isLimit) {
    chipText = onTrack
      ? `${formatHm(goalSeconds - actualSeconds)} buffer`
      : `over by ${formatHm(actualSeconds - goalSeconds)}`;
  } else {
    const remaining = Math.max(0, goalSeconds - actualSeconds);
    chipText = remaining <= 0
      ? "complete"
      : daysLeft > 0
        ? `${daysLeft}d to finish`
        : `need ${formatHm(remaining)}`;
  }

  return (
    <View style={styles.footerRow}>
      <Text style={styles.footerText} numberOfLines={1}>
        <Text style={styles.footerStrong}>{formatHm(actualSeconds)}</Text>
        <Text style={styles.footerMuted}> / {formatHm(goalSeconds)} this week</Text>
      </Text>
      <View style={[styles.chip, { backgroundColor: chipBg }]}>
        <Text style={[styles.chipText, { color: chipFg }]} numberOfLines={1}>
          {chipText}
        </Text>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrowTitle}>WEEKLY STREAK</Text>
      </View>
      <View style={styles.emptyBody}>
        <Feather name="target" size={20} color={COLORS.onSurfaceVariant} />
        <Text style={styles.emptyTitle}>No weekly goals yet</Text>
        <Text style={styles.emptyBodyText}>
          Set a weekly goal on a category to track streaks here.
        </Text>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────

function goalLabel(cat: WeeklyStreakCategory): string {
  const hours = cat.goalSeconds / 3600;
  const rounded = Number.isInteger(hours) ? hours.toString() : hours.toFixed(1);
  if (cat.goalDirection === "at_most") return `under ${rounded}h / week`;
  if (cat.goalDirection === "around") return `~${rounded}h / week`;
  return `${rounded}h / week`;
}

function formatHm(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const totalMinutes = Math.round(safe / 60);
  if (totalMinutes >= 600) return `${Math.round(totalMinutes / 60)}h`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  eyebrowTitle: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: COLORS.onSurfaceVariant,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pagerDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.outlineVariant,
  },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  categoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronPressed: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  categoryName: {
    ...TYPOGRAPHY.titleMd,
    fontSize: 15,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  goalLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.outline,
    flexShrink: 1,
    textAlign: "right",
  },

  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  heroLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  heroNumbers: {
    flexShrink: 1,
    minWidth: 0,
  },
  streakNumber: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -2,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
  },
  streakSub: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  streakSubMuted: {
    color: COLORS.outline,
  },
  personalBest: {
    fontFamily: FONTS.jakartaBold,
    color: COLORS.secondary,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringLabelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  ringPct: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 14,
    lineHeight: 14,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
  },
  ringSub: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.6,
    color: COLORS.outline,
    marginTop: 2,
  },

  historyBox: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  historyTitle: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: COLORS.outline,
  },
  historyMeta: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.onSurfaceVariant,
    fontVariant: ["tabular-nums"],
  },
  barsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  barSlot: {
    width: "100%",
    height: HISTORY_BAR_MAX,
    justifyContent: "flex-end",
  },
  barLabel: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 8,
    lineHeight: 10,
    color: COLORS.outline,
  },
  barLabelCurrent: {
    fontFamily: FONTS.jakartaBold,
    color: COLORS.onSurface,
  },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  footerText: {
    flexShrink: 1,
  },
  footerStrong: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
  },
  footerMuted: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.outline,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    lineHeight: 12,
    fontVariant: ["tabular-nums"],
  },

  emptyBody: {
    alignItems: "center",
    paddingVertical: SPACING.lg,
    gap: 6,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleMd,
    fontSize: 14,
    color: COLORS.onSurface,
  },
  emptyBodyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
  },
});
