// Must load before i18next initializes — see the file for why.
import "./intl-polyfills";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales, type Locale } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { AppState } from "react-native";

import en from "@/locales/en";
import es from "@/locales/es";
import zhHans from "@/locales/zh-Hans";
import type { TranslationShape } from "@/locales/types";

/**
 * i18n bootstrap. Importing this module initializes i18next synchronously
 * with the device language, so the first render is already translated.
 * The in-app preference (AsyncStorage) is applied by
 * `loadLanguagePreference()` during the root layout's init, before the
 * splash screen hides.
 *
 * Adding a language: create `locales/<tag>.ts` typed as `Translation`,
 * register it in RESOURCES + LANGUAGE_NATIVE_NAMES + DEFAULT_INTL_TAGS,
 * and add the tag to expo-localization's `supportedLocales` in app.json.
 * See docs/LOCALIZATION.md.
 */

export type Translation = TranslationShape<typeof en>;

const RESOURCES = { en, es, "zh-Hans": zhHans } satisfies Record<string, Translation>;

export type AppLanguage = keyof typeof RESOURCES;
export type LanguagePreference = "system" | AppLanguage;

export const APP_LANGUAGES = Object.keys(RESOURCES) as AppLanguage[];

/** Endonyms — always shown in their own script, whatever the UI language. */
export const LANGUAGE_NATIVE_NAMES: Record<AppLanguage, string> = {
  en: "English",
  es: "Español",
  "zh-Hans": "简体中文",
};

/** Intl locale used when the device has no locale for the chosen language. */
const DEFAULT_INTL_TAGS: Record<AppLanguage, string> = {
  en: "en-US",
  es: "es-ES",
  "zh-Hans": "zh-Hans-CN",
};

const STORAGE_KEY = "horae.language.v1";

function isAppLanguage(value: string): value is AppLanguage {
  return Object.prototype.hasOwnProperty.call(RESOURCES, value);
}

/**
 * Map a device locale to a shipped language. Chinese is split by script:
 * an explicit `Hant`/`Hans` script wins, otherwise TW/HK/MO regions imply
 * Traditional and everything else Simplified.
 */
function matchLocale(locale: Locale): AppLanguage | null {
  const code = locale.languageCode?.toLowerCase();
  if (!code) return null;
  if (code === "zh") {
    const script =
      locale.languageScriptCode ??
      (["TW", "HK", "MO"].includes(locale.regionCode ?? "") ? "Hant" : "Hans");
    const tag = script === "Hant" ? "zh-Hant" : "zh-Hans";
    return isAppLanguage(tag) ? tag : null;
  }
  return isAppLanguage(code) ? code : null;
}

function readDeviceLocales(): Locale[] {
  try {
    return getLocales();
  } catch {
    return [];
  }
}

let deviceLocales: Locale[] = readDeviceLocales();
let preference: LanguagePreference = "system";
const listeners = new Set<() => void>();

/** First shipped language in the device's preferred-language list. */
export function resolveDeviceLanguage(): AppLanguage {
  for (const locale of deviceLocales) {
    const match = matchLocale(locale);
    if (match) return match;
  }
  return "en";
}

function resolveLanguage(): AppLanguage {
  return preference === "system" ? resolveDeviceLanguage() : preference;
}

/**
 * i18next falls back to the bare key (not `_other`) when a plural category
 * is missing, so copy `_other` into any `_two`/`_few`/`_many` a locale
 * didn't need to spell out (e.g. Spanish `many` for exact millions).
 */
type ResourceTree = { [key: string]: string | ResourceTree };

function withPluralFallbacks(tree: ResourceTree): ResourceTree {
  const out: ResourceTree = {};
  for (const [key, value] of Object.entries(tree)) {
    out[key] = typeof value === "string" ? value : withPluralFallbacks(value);
  }
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value !== "string" || !key.endsWith("_other")) continue;
    const base = key.slice(0, -"_other".length);
    for (const suffix of ["two", "few", "many"]) {
      const variant = `${base}_${suffix}`;
      if (!(variant in out)) out[variant] = value;
    }
  }
  return out;
}

// i18next resolves `_one` / `_other` plural keys via Intl.PluralRules
// (polyfilled on Hermes by ./intl-polyfills). Surface it loudly in dev if
// that ever regresses — every plural string would render wrong.
if (__DEV__) {
  const hasPluralRules = typeof Intl === "object" && typeof Intl.PluralRules === "function";
  console.log(
    `[i18n] Intl.PluralRules ${hasPluralRules ? "available" : "MISSING — plurals will break"}` +
      (hasPluralRules
        ? ` (en(1)=${new Intl.PluralRules("en").select(1)}, en(2)=${new Intl.PluralRules("en").select(2)})`
        : ""),
  );
}

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    Object.entries(RESOURCES).map(([lng, translation]) => [
      lng,
      { translation: withPluralFallbacks(translation as unknown as ResourceTree) },
    ]),
  ),
  lng: resolveDeviceLanguage(),
  fallbackLng: "en",
  supportedLngs: APP_LANGUAGES,
  interpolation: { escapeValue: false },
  initAsync: false,
});

function emit(): void {
  for (const listener of listeners) listener();
}

function applyLanguage(): void {
  const next = resolveLanguage();
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

// The OS language can change while the app is backgrounded (Android changes
// it live; iOS per-app language relaunches us). Re-resolve on foreground.
AppState.addEventListener("change", (state) => {
  if (state !== "active") return;
  deviceLocales = readDeviceLocales();
  applyLanguage();
  emit();
});

/** Load the persisted preference and apply it. Call once during app init. */
export async function loadLanguagePreference(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === "system" || (raw !== null && isAppLanguage(raw))) {
      preference = raw;
    }
  } catch {
    // Storage read failure is non-fatal — follow the device language.
  }
  applyLanguage();
  emit();
}

export function getLanguagePreference(): LanguagePreference {
  return preference;
}

export function setLanguagePreference(next: LanguagePreference): void {
  preference = next;
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
    // Persistence failure is non-fatal; the in-memory choice still applies.
  });
  applyLanguage();
  emit();
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The language currently rendered. */
export function getCurrentLanguage(): AppLanguage {
  const lng = i18n.resolvedLanguage ?? i18n.language;
  return lng && isAppLanguage(lng) ? lng : "en";
}

/**
 * BCP 47 tag for `Intl` / `toLocale*String` display formatting. Prefers the
 * device's own locale for the active language (so en-GB users keep
 * day-first dates), else a sensible default region.
 *
 * Only for *display*. Machine formats (the `en-CA` YYYY-MM-DD keys and the
 * `en-US` formatToParts parsing in lib/timezone.ts) must stay pinned.
 */
export function getIntlLocale(): string {
  const lang = getCurrentLanguage();
  const device = deviceLocales.find((locale) => matchLocale(locale) === lang);
  const tag = (device?.languageTag ?? DEFAULT_INTL_TAGS[lang]).split("-u-")[0];
  // Pin Gregorian calendar + Latin digits. All Horae data is Gregorian, and
  // some regions default to another era (TH → Buddhist, "2569") or native
  // digits; only the wording should follow the locale.
  return `${tag}-u-ca-gregory-nu-latn`;
}

export default i18n;
