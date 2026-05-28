import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useTutorial } from "@/hooks/useTutorial";

interface Slide {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  body: string;
}

const SLIDES: readonly Slide[] = [
  {
    icon: "clock",
    title: "Welcome to Horae",
    body: "Track how you spend your day in real time. Every minute you log becomes a clearer picture of where your time goes.",
  },
  {
    icon: "sliders",
    title: "Built around you",
    body: "Customize categories, activities, and the charts that show up in Insights so the app reflects how you actually live.",
  },
  {
    icon: "compass",
    title: "A quick tour",
    body: "We'll walk you through the five things most people want to know first. It takes less than a minute — and you can skip anytime.",
  },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function WelcomeCarousel(): React.ReactElement | null {
  const { phase, beginTour, skip } = useTutorial();
  const styles = useThemedStyles(makeStyles);
  const { colors, isDark } = useTheme();
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const visible = phase === "welcome";

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
      if (i !== pageIndex) setPageIndex(i);
    },
    [pageIndex],
  );

  const goNext = useCallback(() => {
    if (pageIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({
        x: (pageIndex + 1) * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      beginTour();
    }
  }, [pageIndex, beginTour]);

  const isLast = pageIndex === SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <LinearGradient
        colors={
          isDark
            ? [colors.surface, colors.surfaceContainer]
            : [colors.surface, colors.surfaceContainerLow]
        }
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <Pressable
              onPress={skip}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
            >
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.scroll}
          >
            {SLIDES.map((slide, i) => (
              <View key={i} style={styles.slide}>
                <View style={styles.iconWrap}>
                  <Feather
                    name={slide.icon}
                    size={56}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.body}>{slide.body}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.bottom}>
            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === pageIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.cta,
                pressed && { opacity: 0.85 },
              ]}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaText}>
                  {isLast ? "Start tour" : "Next"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    gradient: { flex: 1 },
    safe: { flex: 1 },
    topBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.md,
    },
    skipText: {
      ...TYPOGRAPHY.button,
      fontSize: 14,
      color: c.onSurfaceVariant,
    },
    scroll: { flex: 1 },
    slide: {
      width: SCREEN_WIDTH,
      paddingHorizontal: SPACING["3xl"],
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.lg,
    },
    iconWrap: {
      width: 120,
      height: 120,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.lg,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
      textAlign: "center",
    },
    body: {
      ...TYPOGRAPHY.body,
      fontSize: 16,
      lineHeight: 24,
      color: c.onSurfaceVariant,
      textAlign: "center",
    },
    bottom: {
      paddingHorizontal: SPACING.xl,
      paddingBottom: SPACING.lg,
      gap: SPACING.lg,
    },
    dots: {
      flexDirection: "row",
      gap: SPACING.sm,
      justifyContent: "center",
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerHighest,
    },
    dotActive: {
      backgroundColor: c.primary,
      width: 24,
    },
    cta: {
      borderRadius: RADIUS.full,
      overflow: "hidden",
    },
    ctaGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    ctaText: {
      ...TYPOGRAPHY.button,
      color: c.onPrimary,
    },
  });
}
