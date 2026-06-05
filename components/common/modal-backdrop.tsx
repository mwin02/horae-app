import React from "react";
import { Platform, Pressable, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";

interface ModalBackdropProps {
  /** Called when the user taps outside the sheet to dismiss. */
  onPress: () => void;
}

/**
 * Full-screen dismiss layer for bottom-sheet modals. Blurs the content behind
 * the sheet on iOS (matching the GlassCard treatment); falls back to a
 * translucent scrim on Android, where BlurView is unreliable/expensive.
 *
 * Rendered as an absolute-fill layer so the sheet's own flex layout (the
 * modal's `overlay` uses `justifyContent: "flex-end"`) is unaffected.
 */
export function ModalBackdrop({
  onPress,
}: ModalBackdropProps): React.ReactElement {
  const { isDark } = useTheme();

  if (Platform.OS === "ios") {
    return (
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <BlurView
          intensity={24}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[StyleSheet.absoluteFill, styles.androidScrim]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Close"
    />
  );
}

const styles = StyleSheet.create({
  androidScrim: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
});
