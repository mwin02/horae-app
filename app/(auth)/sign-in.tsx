import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

export default function SignInScreen(): React.ReactElement {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await signInWithPassword(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  }, [email, password, signInWithPassword, router]);

  const goToSignUp = useCallback(() => {
    router.replace("/(auth)/sign-up");
  }, [router]);

  const goToForgot = useCallback(() => {
    router.push("/(auth)/forgot-password");
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to sync your time across devices.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
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
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                editable={!submitting}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <GradientButton
              shape="pill"
              label={submitting ? "Signing in…" : "Sign in"}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Feather name="log-in" size={18} color={colors.onPrimary} />
            </GradientButton>

            <Pressable onPress={goToForgot} style={styles.linkRow}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Pressable onPress={goToSignUp} hitSlop={8}>
              <Text style={styles.footerLink}>Sign up</Text>
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
    linkRow: {
      alignSelf: "center",
      paddingVertical: SPACING.sm,
    },
    linkText: {
      ...TYPOGRAPHY.body,
      color: c.primary,
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
