import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import {
  getCurrentLanguage,
  getLanguagePreference,
  resolveDeviceLanguage,
  setLanguagePreference,
  subscribeLanguage,
  type AppLanguage,
  type LanguagePreference,
} from "@/lib/i18n";

interface LanguageState {
  /** Language currently rendered. */
  language: AppLanguage;
  /** What the Settings picker binds to. */
  preference: LanguagePreference;
  /** Language "System" would resolve to right now. */
  systemLanguage: AppLanguage;
  setPreference: (next: LanguagePreference) => void;
}

/**
 * Reactive language state. Re-renders on language change (via
 * `useTranslation`) and on preference / OS-language change (via the
 * lib/i18n store). Non-UI consumers that bake strings into native state —
 * notifications, widget, Live Activity — list `language` in their effect
 * deps so they re-push on change.
 */
export function useLanguage(): LanguageState {
  useTranslation();
  const preference = useSyncExternalStore(subscribeLanguage, getLanguagePreference);
  const systemLanguage = useSyncExternalStore(subscribeLanguage, resolveDeviceLanguage);
  return {
    language: getCurrentLanguage(),
    preference,
    systemLanguage,
    setPreference: setLanguagePreference,
  };
}
