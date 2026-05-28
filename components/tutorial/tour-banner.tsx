import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { usePathname } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useTutorial } from "@/hooks/useTutorial";

/**
 * Normalize the current pathname to one of the tab roots the tour cares about.
 * Anything not on a recognized tab is treated as "off-tour" and the banner
 * shows a "go to <X>" hint until the user lands on the right screen.
 */
function normalizePath(pathname: string): string {
  if (pathname === "/" || pathname === "" || pathname.startsWith("/index")) {
    return "/";
  }
  if (pathname.startsWith("/timeline")) return "/timeline";
  if (pathname.startsWith("/insights")) return "/insights";
  if (pathname.startsWith("/settings")) return "/settings";
  return pathname;
}

export function TourBanner(): React.ReactElement | null {
  const { phase, step, stepIndex, totalSteps, next, skip } = useTutorial();
  const styles = useThemedStyles(makeStyles);
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  const currentPath = useMemo(() => normalizePath(pathname ?? "/"), [pathname]);

  if (phase !== "tour" || !step) return null;

  const onCorrectScreen = currentPath === step.path;

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={styles.cardShadow}>
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? "dark" : "light"}
          style={styles.blur}
        >
          <View style={styles.cardInner}>
            <View style={styles.header}>
              <Text style={styles.progress}>
                Step {stepIndex + 1} of {totalSteps}
              </Text>
              <Pressable
                onPress={skip}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Skip tour"
              >
                <Text style={styles.skip}>Skip tour</Text>
              </Pressable>
            </View>

            {onCorrectScreen ? (
              <>
                <Text style={styles.title}>{step.title}</Text>
                <Text style={styles.body}>{step.body}</Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>
                  Open the {step.destinationLabel} tab
                </Text>
                <Text style={styles.body}>
                  Tap{" "}
                  <Text style={styles.bodyEmphasis}>{step.destinationLabel}</Text>{" "}
                  below to continue the tour.
                </Text>
                <View style={styles.arrowRow}>
                  <Feather
                    name="arrow-down"
                    size={20}
                    color={colors.onSurfaceVariant}
                  />
                </View>
              </>
            )}

            <Pressable
              onPress={next}
              disabled={!onCorrectScreen}
              style={({ pressed }) => [
                styles.cta,
                !onCorrectScreen && styles.ctaDisabled,
                pressed && onCorrectScreen && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !onCorrectScreen }}
            >
              <Text
                style={[
                  styles.ctaText,
                  !onCorrectScreen && styles.ctaTextDisabled,
                ]}
              >
                {stepIndex + 1 === totalSteps ? "Finish" : "Next"}
              </Text>
              <Feather
                name="arrow-right"
                size={16}
                color={onCorrectScreen ? colors.onPrimary : colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      position: "absolute",
      left: 0,
      right: 0,
      // Sit above the tab bar (~83pt with safe area) with a margin.
      bottom: 96,
      paddingHorizontal: SPACING.lg,
    },
    cardShadow: {
      borderRadius: RADIUS.xl,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    blur: {
      borderRadius: RADIUS.xl,
      overflow: "hidden",
    },
    cardInner: {
      backgroundColor: c.surfaceContainerHigh + "F0",
      padding: SPACING.lg,
      gap: SPACING.sm,
      borderRadius: RADIUS.xl,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    progress: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.primary,
    },
    skip: {
      ...TYPOGRAPHY.labelSm,
      color: c.onSurfaceVariant,
      textTransform: "none",
      letterSpacing: 0,
    },
    title: {
      ...TYPOGRAPHY.heading,
      color: c.onSurface,
    },
    body: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
    bodyEmphasis: {
      color: c.onSurface,
      fontFamily: TYPOGRAPHY.button.fontFamily,
    },
    arrowRow: {
      alignItems: "center",
      paddingTop: SPACING.xs,
    },
    cta: {
      marginTop: SPACING.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      paddingVertical: 14,
      borderRadius: RADIUS.full,
      backgroundColor: c.primary,
    },
    ctaDisabled: {
      backgroundColor: c.surfaceContainerHighest,
    },
    ctaText: {
      ...TYPOGRAPHY.button,
      fontSize: 14,
      color: c.onPrimary,
    },
    ctaTextDisabled: {
      color: c.onSurfaceVariant,
    },
  });
}
