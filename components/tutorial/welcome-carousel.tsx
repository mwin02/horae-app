import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { TFunction } from "i18next";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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

function buildSlides(t: TFunction): readonly Slide[] {
  return [
    {
      icon: "clock",
      eyebrow: t("tutorial.welcomeEyebrow"),
      title: t("tutorial.welcomeTitle"),
      body: t("tutorial.welcomeBody"),
    },
    {
      icon: "play-circle",
      eyebrow: t("tutorial.focusEyebrow"),
      title: t("tutorial.focusTitle"),
      body: t("tutorial.focusBody"),
      bullets: [
        { icon: "disc", text: t("tutorial.focusBullet1") },
        { icon: "zap", text: t("tutorial.focusBullet2") },
        { icon: "rotate-ccw", text: t("tutorial.focusBullet3") },
      ],
    },
    {
      icon: "sliders",
      eyebrow: t("tutorial.customizeEyebrow"),
      title: t("tutorial.customizeTitle"),
      body: t("tutorial.customizeBody"),
      bullets: [
        { icon: "grid", text: t("tutorial.customizeBullet1") },
        { icon: "edit-3", text: t("tutorial.customizeBullet2") },
        { icon: "tag", text: t("tutorial.customizeBullet3") },
      ],
    },
    {
      icon: "calendar",
      eyebrow: t("tutorial.timelineEyebrow"),
      title: t("tutorial.timelineTitle"),
      body: t("tutorial.timelineBody"),
      bullets: [
        { icon: "plus-circle", text: t("tutorial.timelineBullet1") },
        { icon: "edit-2", text: t("tutorial.timelineBullet2") },
        { icon: "trash-2", text: t("tutorial.timelineBullet3") },
      ],
    },
    {
      icon: "bar-chart-2",
      eyebrow: t("tutorial.insightsEyebrow"),
      title: t("tutorial.insightsTitle"),
      body: t("tutorial.insightsBody"),
      bullets: [
        { icon: "settings", text: t("tutorial.insightsBullet1") },
        { icon: "target", text: t("tutorial.insightsBullet2") },
        { icon: "trending-up", text: t("tutorial.insightsBullet3") },
      ],
    },
    {
      icon: "smartphone",
      eyebrow: t("tutorial.beyondEyebrow"),
      title: t("tutorial.beyondTitle"),
      body: t("tutorial.beyondBody"),
      bullets: [
        { icon: "grid", text: t("tutorial.beyondBullet1") },
        { icon: "activity", text: t("tutorial.beyondBullet2") },
        { icon: "bell", text: t("tutorial.beyondBullet3") },
      ],
    },
    {
      icon: "check-circle",
      eyebrow: t("tutorial.doneEyebrow"),
      title: t("tutorial.doneTitle"),
      body: t("tutorial.doneBody"),
    },
  ];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export function WelcomeCarousel(): React.ReactElement | null {
  const { phase, finish } = useTutorial();
  const styles = useThemedStyles(makeStyles);
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation();
  const SLIDES = useMemo(() => buildSlides(t), [t]);

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
  }, [pageIndex, finish, SLIDES.length]);

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
              accessibilityLabel={t("tutorial.skipIntro")}
            >
              <Text style={styles.skipText}>{t("tutorial.skip")}</Text>
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
                  {isLast ? t("tutorial.getStarted") : t("tutorial.next")}
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
