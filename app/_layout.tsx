import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { PowerSyncContext } from "@powersync/react";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme as NavigationTheme,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { loadLanguagePreference } from "@/lib/i18n";
import { SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import {
  seedNotificationPreferencesIfNeeded,
  seedPresetsIfNeeded,
  seedUserPreferencesIfNeeded,
} from "@/db/seed";
import { AuthProvider } from "@/hooks/useAuth";
import { useLiveActivity } from "@/hooks/useLiveActivity";
import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";
import { useTimerDeepLinks } from "@/hooks/useTimerDeepLinks";
import { useWidgetSnapshot, useWidgetStrings } from "@/hooks/useWidgetSnapshot";
import { TutorialProvider } from "@/hooks/useTutorial";
import { TutorialOverlay } from "@/components/tutorial/tutorial-overlay";
import { db } from "@/lib/powersync";
import { initSentry, wrap } from "@/lib/sentry";

initSentry();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default wrap(function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [dbStatus, setDbStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Initialize PowerSync database and seed presets
  useEffect(() => {
    async function initDB() {
      try {
        // Apply the in-app language choice before the splash hides so the
        // first frame is already in the right language.
        await loadLanguagePreference();
        console.log("[Horae] Starting DB init...");
        await db.init();
        console.log("[Horae] DB init complete, seeding...");
        await seedPresetsIfNeeded();
        await seedNotificationPreferencesIfNeeded();
        await seedUserPreferencesIfNeeded();
        console.log("[Horae] Seed complete");
        setDbStatus("ready");
      } catch (e) {
        console.error("[Horae] DB init failed:", e);
        setDbStatus("error");
      }
    }
    console.log("[Horae] useEffect fired");
    initDB();
  }, []);

  useEffect(() => {
    if (loaded && dbStatus !== "loading") {
      SplashScreen.hideAsync();
    }
  }, [loaded, dbStatus]);

  if (!loaded || dbStatus === "loading") {
    return null;
  }

  return (
    <ThemeProvider>
      {dbStatus === "error" ? <DBErrorScreen /> : <RootLayoutNav />}
    </ThemeProvider>
  );
});

function DBErrorScreen(): React.ReactElement {
  const { colors } = useTheme();
  const styles = useMemo(() => makeErrorStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("errors.dbTitle")}</Text>
      <Text style={styles.body}>{t("errors.dbBody")}</Text>
    </View>
  );
}

function makeErrorStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
      paddingHorizontal: SPACING.xl,
      justifyContent: "center",
      gap: SPACING.md,
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    body: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
  });
}

function buildNavigationTheme(
  colors: ThemeColors,
  isDark: boolean,
): NavigationTheme {
  const base = isDark ? NavDarkTheme : NavDefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      background: colors.surface,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.outlineVariant,
      primary: colors.primary,
      notification: colors.primary,
    },
  };
}

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const navTheme = useMemo(
    () => buildNavigationTheme(colors, isDark),
    [colors, isDark],
  );
  const back = t("common.back");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PowerSyncContext.Provider value={db}>
      <AuthProvider>
      <TutorialProvider>
      <NotificationSchedulerMount />
      <LiveActivityMount />
      <WidgetSnapshotMount />
      <TimerDeepLinksMount />
      <NavigationThemeProvider value={navTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false, presentation: "modal" }}
          />
          <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          <Stack.Screen
            name="manage-activities"
            options={{
              title: t("manageActivities.title"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="manage-categories"
            options={{
              title: t("manageCategories.title"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="manage-tags"
            options={{
              title: t("manageTags.title"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="ideal-allocations"
            options={{
              title: t("idealAllocations.title"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="notifications-settings"
            options={{
              title: t("settings.notifications"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="general-preferences"
            options={{
              title: t("settings.general"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="manage-data"
            options={{
              title: t("manageData.title"),
              headerBackTitle: back,
              headerTitle: "",
            }}
          />
        </Stack>
        <TutorialOverlay />
      </NavigationThemeProvider>
      </TutorialProvider>
      </AuthProvider>
    </PowerSyncContext.Provider>
    </GestureHandlerRootView>
  );
}

function NotificationSchedulerMount(): null {
  useNotificationScheduler();
  return null;
}

function LiveActivityMount(): null {
  useLiveActivity();
  return null;
}

function WidgetSnapshotMount(): null {
  useWidgetSnapshot();
  useWidgetStrings();
  return null;
}

function TimerDeepLinksMount(): null {
  useTimerDeepLinks();
  return null;
}
