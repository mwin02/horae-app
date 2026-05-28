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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  type ThemeColors,
} from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useTutorial } from "@/hooks/useTutorial";

interface Bullet {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}

interface Slide {
  icon: keyof typeof Feather.glyphMap;
  eyebrow: string;
  title: string;
  body: string;
  bullets?: readonly Bullet[];
}

const SLIDES: readonly Slide[] = [
  {
    icon: "clock",
    eyebrow: "Welcome",
    title: "Meet Horae",
    body: "Horae helps you see where your hours actually go. Track in real time, fill in the past, and watch the picture sharpen day by day.",
  },
  {
    icon: "play-circle",
    eyebrow: "Focus tab",
    title: "Start an activity",
    body: "Begin tracking the moment something starts — no setup required.",
    bullets: [
      { icon: "disc", text: "Tap start activity to select an activity" },
      {
        icon: "zap",
        text: "Click on any activity under quick start to switch or start with one tap",
      },
      {
        icon: "rotate-ccw",
        text: "Forgot to stop the timer? You can edit it later in the timeline",
      },
    ],
  },
  {
    icon: "sliders",
    eyebrow: "Make it yours",
    title: "Customize activities",
    body: "Your day doesn't look like anyone else's — your tracker shouldn't either.",
    bullets: [
      {
        icon: "grid",
        text: "Create the activities that matter to you, delete the ones that don't",
      },
      {
        icon: "edit-3",
        text: "Recolor or set custom icons for any activity",
      },
      {
        icon: "tag",
        text: "Use tags for cross-cutting context like client, project, or place",
      },
    ],
  },
  {
    icon: "calendar",
    eyebrow: "Timeline tab",
    title: "Backfill & edit your day",
    body: "Life happens away from the phone. Patch the gaps whenever you remember.",
    bullets: [
      {
        icon: "plus-circle",
        text: "Tap any empty gap on the timeline to log past time",
      },
      {
        icon: "edit-2",
        text: "Tap an existing entry to tweak its time",
      },
      {
        icon: "trash-2",
        text: "Delete any entry that doesn't belong — it won't mess with your stats or goals",
      },
    ],
  },
  {
    icon: "bar-chart-2",
    eyebrow: "Insights tab",
    title: "See what matters to you",
    body: "Pin the charts that answer your questions and hide the rest.",
    bullets: [
      {
        icon: "settings",
        text: "Customize your insights dashboard with the metrics that matter to you",
      },
      {
        icon: "target",
        text: "Set goals per category to compare ideal vs actual",
      },
      {
        icon: "trending-up",
        text: "Watch streaks and week-over-week trends build up",
      },
    ],
  },
  {
    icon: "smartphone",
    eyebrow: "Beyond the app",
    title: "Track from anywhere on your phone",
    body: "Horae lives on your Home Screen and Lock Screen so you never have to open the app to start, stop, or check in.",
    bullets: [
      {
        icon: "grid",
        text: "Add the Home Screen widget to start a session in one tap",
      },
      {
        icon: "activity",
        text: "A Live Activity keeps the running timer on your Lock Screen and Dynamic Island",
      },
      {
        icon: "bell",
        text: "Optional reminders nudge you if a timer's been running too long",
      },
    ],
  },
  {
    icon: "check-circle",
    eyebrow: "You're set",
    title: "Start tracking",
    body: "That's the tour. Now go find your hours.",
  },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function WelcomeCarousel(): React.ReactElement | null {
  const { phase, finish } = useTutorial();
  const styles = useThemedStyles(makeStyles);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
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
      finish();
    }
  }, [pageIndex, finish]);

  const isLast = pageIndex === SLIDES.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={finish}
    >
      <LinearGradient
        colors={
          isDark
            ? [colors.surface, colors.surfaceContainer]
            : [colors.surface, colors.surfaceContainerLow]
        }
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safe} edges={["bottom"]}>
          <View
            style={[
              styles.topBar,
              { paddingTop: Math.max(insets.top, SPACING.md) + SPACING.sm },
            ]}
          >
            <Pressable
              onPress={finish}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Skip intro"
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
              <ScrollView
                key={i}
                style={styles.slide}
                contentContainerStyle={styles.slideContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.iconWrap}>
                  <Feather name={slide.icon} size={48} color={colors.primary} />
                </View>
                <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.body}>{slide.body}</Text>
                {slide.bullets ? (
                  <View style={styles.bullets}>
                    {slide.bullets.map((b, bi) => (
                      <View key={bi} style={styles.bulletRow}>
                        <View style={styles.bulletIcon}>
                          <Feather
                            name={b.icon}
                            size={16}
                            color={colors.primary}
                          />
                        </View>
                        <Text style={styles.bulletText}>{b.text}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            ))}
          </ScrollView>

          <View style={styles.bottom}>
            <View style={styles.dots}>
              {SLIDES.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === pageIndex && styles.dotActive]}
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
                  {isLast ? "Get started" : "Next"}
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
    },
    skipText: {
      ...TYPOGRAPHY.button,
      fontSize: 14,
      color: c.onSurfaceVariant,
    },
    scroll: { flex: 1 },
    slide: {
      width: SCREEN_WIDTH,
    },
    slideContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING["3xl"],
      paddingTop: SPACING["4xl"],
      paddingBottom: SPACING.xl,
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.md,
    },
    iconWrap: {
      width: 96,
      height: 96,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: SPACING.sm,
    },
    eyebrow: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.primary,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
      textAlign: "center",
    },
    body: {
      ...TYPOGRAPHY.body,
      fontSize: 15,
      lineHeight: 22,
      color: c.onSurfaceVariant,
      textAlign: "center",
    },
    bullets: {
      width: "100%",
      marginTop: SPACING.lg,
      gap: SPACING.md,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
      paddingHorizontal: SPACING.sm,
    },
    bulletIcon: {
      width: 28,
      height: 28,
      borderRadius: RADIUS.full,
      backgroundColor: c.surfaceContainerHigh,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
    },
    bulletText: {
      ...TYPOGRAPHY.body,
      color: c.onSurface,
      flex: 1,
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
