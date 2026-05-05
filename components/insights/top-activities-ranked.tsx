import { COLORS, FONTS, RADIUS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import { useTopActivities, type TopActivity } from "@/hooks/useTopActivities";
import { formatDuration } from "@/lib/timezone";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface TopActivitiesRankedProps {
  monthDate: string;
}

const TOTAL_LIMIT = 8;
const PODIUM_LIMIT = 3;

// Bar heights map by rank — height itself encodes ranking, not fill ratio.
const PODIUM_BAR_HEIGHT: Record<number, number> = {
  1: 84,
  2: 62,
  3: 50,
};

// Visual ordering for podium columns: 2nd, 1st, 3rd.
const PODIUM_ORDER: number[] = [2, 1, 3];

export function TopActivitiesRanked({
  monthDate,
}: TopActivitiesRankedProps): React.ReactElement | null {
  const { activities, topSeconds, isLoading } = useTopActivities(
    monthDate,
    TOTAL_LIMIT,
  );

  if (isLoading) return null;

  const podium = activities.slice(0, PODIUM_LIMIT);
  const rest = activities.slice(PODIUM_LIMIT);

  return (
    <View style={styles.container}>
      <View style={styles.eyebrow}>
        <Text style={styles.eyebrowTitle}>TOP ACTIVITIES</Text>
        {activities.length > 0 ? (
          <Text style={styles.eyebrowMeta}>
            this month · top {activities.length}
          </Text>
        ) : null}
      </View>

      {activities.length === 0 ? (
        <Text style={styles.emptyText}>No tracked time this month</Text>
      ) : (
        <>
          <View style={styles.podiumRow}>
            {PODIUM_ORDER.map((rank) => (
              <PodiumColumn
                key={rank}
                rank={rank}
                activity={podium[rank - 1]}
              />
            ))}
          </View>

          {rest.length > 0 ? (
            <View style={styles.denseList}>
              {rest.map((activity, index) => (
                <DenseRow
                  key={activity.activityId}
                  activity={activity}
                  rank={PODIUM_LIMIT + index + 1}
                  topSeconds={topSeconds}
                  isLast={index === rest.length - 1}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────

interface PodiumColumnProps {
  rank: number;
  activity: TopActivity | undefined;
}

function PodiumColumn({
  rank,
  activity,
}: PodiumColumnProps): React.ReactElement {
  const barHeight = PODIUM_BAR_HEIGHT[rank] ?? PODIUM_BAR_HEIGHT[3];

  return (
    <View style={styles.podiumCol}>
      <Text style={styles.podiumRank}>#{rank}</Text>
      <Text style={styles.podiumName} numberOfLines={1}>
        {activity?.activityName ?? "—"}
      </Text>
      <Text style={styles.podiumDuration}>
        {activity ? formatDuration(activity.totalSeconds) : ""}
      </Text>
      <View
        style={[
          styles.podiumBar,
          {
            height: barHeight,
            backgroundColor: activity
              ? activity.categoryColor
              : COLORS.surfaceContainer,
            opacity: activity ? (rank === 1 ? 1 : 0.85) : 0.5,
          },
        ]}
      />
    </View>
  );
}

// ──────────────────────────────────────────────

interface DenseRowProps {
  activity: TopActivity;
  rank: number;
  topSeconds: number;
  isLast: boolean;
}

function DenseRow({
  activity,
  rank,
  topSeconds,
  isLast,
}: DenseRowProps): React.ReactElement {
  const fillFraction =
    topSeconds > 0 ? Math.max(0.02, activity.totalSeconds / topSeconds) : 0;

  return (
    <View style={[styles.denseRow, !isLast && styles.denseRowDivider]}>
      <Text style={styles.denseRank}>{rank}</Text>

      <View style={styles.denseMiddle}>
        <View style={styles.denseNameRow}>
          <View
            style={[styles.denseDot, { backgroundColor: activity.categoryColor }]}
          />
          <Text style={styles.denseName} numberOfLines={1}>
            {activity.activityName}
          </Text>
        </View>
        <View style={styles.denseBarTrack}>
          <View
            style={[
              styles.denseBarFill,
              {
                width: `${fillFraction * 100}%`,
                backgroundColor: activity.categoryColor,
              },
            ]}
          />
        </View>
      </View>

      <Text style={styles.denseDuration}>
        {formatDuration(activity.totalSeconds)}
      </Text>
    </View>
  );
}

// ──────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },

  // Eyebrow header
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  eyebrowTitle: {
    ...TYPOGRAPHY.labelUppercase,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    color: COLORS.onSurfaceVariant,
  },
  eyebrowMeta: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.outline,
  },
  emptyText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.onSurfaceVariant,
  },

  // Podium
  podiumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.sm,
    marginBottom: 14,
  },
  podiumCol: {
    flex: 1,
    alignItems: "center",
    minWidth: 0,
  },
  podiumRank: {
    fontFamily: FONTS.jakartaBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1,
    color: COLORS.outline,
  },
  podiumName: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurface,
    textAlign: "center",
    marginTop: 2,
    width: "100%",
  },
  podiumDuration: {
    fontFamily: FONTS.jakartaRegular,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 1,
    marginBottom: 6,
    fontVariant: ["tabular-nums"],
  },
  podiumBar: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },

  // Dense list
  denseList: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  denseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  denseRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outlineVariant,
  },
  denseRank: {
    width: 14,
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 11,
    lineHeight: 14,
    color: COLORS.outline,
    fontVariant: ["tabular-nums"],
  },
  denseMiddle: {
    flex: 1,
    minWidth: 0,
  },
  denseNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  denseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  denseName: {
    fontFamily: FONTS.jakartaMedium,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.onSurface,
    flexShrink: 1,
  },
  denseBarTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.outlineVariant,
    overflow: "hidden",
  },
  denseBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  denseDuration: {
    fontFamily: FONTS.jakartaSemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.onSurface,
    fontVariant: ["tabular-nums"],
  },
});

