import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";

import { setActivityFavorite } from "@/db/queries";
import { useTheme } from "@/hooks/useTheme";

/** Amber used for the filled (favorited) star. Reads well on light and dark. */
const FAVORITE_COLOR = "#F5B301";

interface FavoriteStarProps {
  activityId: string;
  isFavorite: boolean;
  size?: number;
}

/**
 * Tap target that toggles an activity's favorite flag. Filled amber star when
 * favorited, outline star otherwise. Owns its own write so callers just pass
 * the current state; the reactive queries re-sort once the flag flips.
 */
export function FavoriteStar({
  activityId,
  isFavorite,
  size = 20,
}: FavoriteStarProps): React.ReactElement {
  const { colors } = useTheme();

  const handlePress = useCallback((): void => {
    setActivityFavorite(activityId, !isFavorite).catch((err) => {
      console.error("Failed to toggle favorite", err);
    });
  }, [activityId, isFavorite]);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={styles.button}
      accessibilityRole="button"
      accessibilityState={{ selected: isFavorite }}
      accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Ionicons
        name={isFavorite ? "star" : "star-outline"}
        size={size}
        color={isFavorite ? FAVORITE_COLOR : colors.onSurfaceVariant}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
