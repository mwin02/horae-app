import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance, type ColorSchemeName } from "react-native";

import {
  DARK_COLORS,
  LIGHT_COLORS,
  type ThemeColors,
} from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";

function normalizeScheme(
  scheme: ColorSchemeName | null | undefined,
): ResolvedScheme {
  return scheme === "dark" ? "dark" : "light";
}

const STORAGE_KEY = "horae.theme-mode.v1";

interface ThemeContextValue {
  /** User-chosen mode (what the Settings UI binds to). */
  mode: ThemeMode;
  /** Concrete scheme actually applied right now. */
  scheme: ResolvedScheme;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(mode: ThemeMode, system: ResolvedScheme): ResolvedScheme {
  if (mode === "system") return system;
  return mode;
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<ResolvedScheme>(() =>
    normalizeScheme(Appearance.getColorScheme()),
  );

  // Subscribe to OS appearance changes (active even when mode !== "system" so
  // toggling back to System reflects the current OS value immediately).
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(normalizeScheme(colorScheme));
    });
    return () => sub.remove();
  }, []);

  // Load persisted mode on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;
        if (raw === "light" || raw === "dark" || raw === "system") {
          setModeState(raw);
        }
      } catch {
        // Storage read failure is non-fatal — fall back to system.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Persistence failure is non-fatal; the in-memory state still applies.
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme = resolveScheme(mode, systemScheme);
    const colors = scheme === "dark" ? DARK_COLORS : LIGHT_COLORS;
    return {
      mode,
      scheme,
      isDark: scheme === "dark",
      colors,
      setMode,
    };
  }, [mode, systemScheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

/**
 * Build a memoized StyleSheet whose color tokens follow the active theme.
 * Pattern:
 *   const styles = useThemedStyles(makeStyles);
 *   function makeStyles(c: ThemeColors) {
 *     return StyleSheet.create({ container: { backgroundColor: c.surface } });
 *   }
 */
export function useThemedStyles<T>(factory: (c: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
