import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GradientButton } from "@/components/common/gradient-button";
import { RADIUS, SPACING, TYPOGRAPHY, type ThemeColors } from "@/constants/theme";
import { useTheme, useThemedStyles } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export default function SignUpScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError(t("auth.missingEmailAndPassword"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.signUp.passwordTooShort"));
      return;
    }
    if (password !== confirm) {
      setError(t("auth.signUp.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await signUp(trimmedEmail, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.alreadyExists) {
      setError(t("auth.signUp.alreadyExists"));
      return;
    }
    if (result.needsConfirmation) {
      router.replace({
        pathname: "/(auth)/confirm-email",
        params: { email: trimmedEmail },
      });
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  }, [email, password, confirm, signUp, router, t]);

  const goToSignIn = useCallback(() => {
    router.replace("/(auth)/sign-in");
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t("auth.signUp.title")}</Text>
            <Text style={styles.subtitle}>{t("auth.signUp.subtitle")}</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.emailLabel")}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={t("auth.emailPlaceholder")}
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.passwordLabel")}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={t("auth.signUp.passwordPlaceholder")}
                placeholderTextColor={colors.onSurfaceVariant}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!submitting}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.signUp.confirmLabel")}</Text>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder={t("auth.signUp.confirmPlaceholder")}
                placeholderTextColor={colors.onSurfaceVariant}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                editable={!submitting}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton
              shape="pill"
              label={
                submitting ? t("auth.signUp.submitting") : t("auth.signUp.submit")
              }
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Feather name="user-plus" size={18} color={colors.onPrimary} />
            </GradientButton>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("auth.signUp.haveAccount")}</Text>
            <Pressable onPress={goToSignIn} hitSlop={8}>
              <Text style={styles.footerLink}>{t("auth.signUp.signInLink")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.surface,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING["3xl"],
    },
    header: {
      gap: SPACING.xs,
      marginBottom: SPACING["2xl"],
    },
    title: {
      ...TYPOGRAPHY.headingXl,
      color: c.onSurface,
    },
    subtitle: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
    form: {
      gap: SPACING.lg,
    },
    field: {
      gap: SPACING.xs,
    },
    label: {
      ...TYPOGRAPHY.labelUppercase,
      color: c.onSurfaceVariant,
    },
    input: {
      ...TYPOGRAPHY.body,
      color: c.onSurface,
      backgroundColor: c.surfaceContainerLow,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
    },
    error: {
      ...TYPOGRAPHY.bodySmall,
      color: c.error,
    },
    footer: {
      flexDirection: "row",
      gap: SPACING.xs,
      justifyContent: "center",
      alignItems: "center",
      marginTop: SPACING["2xl"],
    },
    footerText: {
      ...TYPOGRAPHY.body,
      color: c.onSurfaceVariant,
    },
    footerLink: {
      ...TYPOGRAPHY.titleMd,
      color: c.primary,
    },
  });
}
