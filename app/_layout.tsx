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
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { COLORS, SPACING, TYPOGRAPHY } from "@/constants/theme";

import { useColorScheme } from "@/components/useColorScheme";
import {
  seedNotificationPreferencesIfNeeded,
  seedPresetsIfNeeded,
  seedUserPreferencesIfNeeded,
} from "@/db/seed";
import { AuthProvider } from "@/hooks/useAuth";
import { useLiveActivity } from "@/hooks/useLiveActivity";
import { useNotificationScheduler } from "@/hooks/useNotificationScheduler";
import { useTimerDeepLinks } from "@/hooks/useTimerDeepLinks";
import { useWidgetSnapshot } from "@/hooks/useWidgetSnapshot";
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

  if (dbStatus === "error") {
    return <DBErrorScreen />;
  }

  return <RootLayoutNav />;
});

function DBErrorScreen(): React.ReactElement {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Couldn&apos;t open your data</Text>
      <Text style={errorStyles.body}>
        Horae ran into a problem reading from local storage. Your tracked
        time is still saved on this device. Please force-quit the app and
        reopen it. If this keeps happening, contact support from your last
        working session or reinstall the app.
      </Text>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    justifyContent: "center",
    gap: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.headingXl,
    color: COLORS.onSurface,
  },
  body: {
    ...TYPOGRAPHY.body,
    color: COLORS.onSurfaceVariant,
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PowerSyncContext.Provider value={db}>
      <AuthProvider>
      <NotificationSchedulerMount />
      <LiveActivityMount />
      <WidgetSnapshotMount />
      <TimerDeepLinksMount />
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
              title: "Manage Activities",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="manage-categories"
            options={{
              title: "Manage Categories",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="manage-tags"
            options={{
              title: "Manage Tags",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="ideal-allocations"
            options={{
              title: "Ideal Allocations",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="notifications-settings"
            options={{
              title: "Notifications",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="general-preferences"
            options={{
              title: "General",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
          <Stack.Screen
            name="manage-data"
            options={{
              title: "Manage data",
              headerBackTitle: "Back",
              headerTitle: "",
            }}
          />
        </Stack>
      </ThemeProvider>
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
  return null;
}

function TimerDeepLinksMount(): null {
  useTimerDeepLinks();
  return null;
}
