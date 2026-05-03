import { SuggestedCard } from "@/components/home/suggested-card";
import { COLORS, SPACING, TYPOGRAPHY } from "@/constants/theme";
import type { RecommendedActivity } from "@/db/models";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

interface SuggestedRowProps {
  recommendations: RecommendedActivity[];
  onSelect: (activityId: string) => void;
}

/**
 * Section header + horizontally-scrollable row of recommendation cards.
 * Renders nothing if there are no qualifying recommendations.
 */
export function SuggestedRow({
  recommendations,
  onSelect,
}: SuggestedRowProps): React.ReactElement | null {
  if (recommendations.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Suggested for you</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map((rec) => (
          <SuggestedCard
            key={rec.activityId}
            activityName={rec.activityName}
            categoryName={rec.categoryName}
            categoryColor={rec.categoryColor}
            categoryIcon={rec.categoryIcon}
            subtitle={rec.subtitle}
            onPress={() => onSelect(rec.activityId)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING["3xl"],
    // Bleed the row to the screen edges so cards can scroll under the
    // padding of the parent ScrollView.
    marginHorizontal: -SPACING.lg,
  },
  heading: {
    ...TYPOGRAPHY.heading,
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
});
