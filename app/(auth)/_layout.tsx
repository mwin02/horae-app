import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function AuthLayout(): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: t("common.back"),
        headerTitle: "",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="confirm-email" />
    </Stack>
  );
}
