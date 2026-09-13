# Localization (i18n)

Horae uses **i18next + react-i18next** for UI strings, **`Intl`** for dates and
numbers, and **expo-localization** for the device language. English is the
source language; every other locale is a typed TypeScript object.

## Files

| File | Role |
| --- | --- |
| `locales/en.ts` | Canonical key set + English strings. |
| `locales/<tag>.ts` | One file per language, typed `Translation` — a missing or extra key fails `tsc`. |
| `locales/types.ts` | `TranslationShape` (derives the locale type from `en.ts`, allows extra CLDR plural forms). |
| `lib/i18n/index.ts` | Bootstrap, language resolution, in-app preference, `getIntlLocale()`. |
| `lib/i18n/format.ts` | Locale-aware display helpers (`formatWeekday`, `weekdayNames`). |
| `lib/i18n/preset-names.ts` | Display-time translation of preset category/activity names. |
| `hooks/useLanguage.ts` | Reactive language + preference for the Settings picker. |
| `scripts/check-i18n.js` | CI check for hard-coded user-facing strings (`npm run i18n:check`). |

## Choosing the language

1. Default is **"Match device"**: the first language in the OS preferred list
   that we ship. Chinese resolves by script — `Hant`, or region TW/HK/MO →
   `zh-Hant`; otherwise `zh-Hans`. Anything unsupported falls back to English.
2. **Settings → General → Language** overrides it. The choice is stored in
   AsyncStorage (`horae.language.v1`, device-local) and applied during root
   init, before the splash hides. The section is hidden until a second
   language ships.
3. The OS language is re-read when the app returns to the foreground.

## Writing UI code

- **Never render a string literal.** Use `const { t } = useTranslation()` in
  components; use `i18n.t` from `@/lib/i18n` only in non-React code
  (notifications, exports, helpers called from render).
- **Whole sentences, not fragments.** `t("x.body", { name })` — never
  `` `${t("remove")} "${name}"?` ``. Word order differs by language. When the
  grammar depends on a variable (daily vs weekly, today vs this week), use one
  key per variant instead of interpolating the word.
- **Plurals:** `key_one` / `key_other` + `t("key", { count })`. Locales may add
  `_two` / `_few` / `_many`; missing ones fall back to `_other` automatically.
- **Styled spans:** `<Trans i18nKey="…" components={{ em: <Text style={…} /> }} />`
  with `<em>…</em>` in the string.
- **Memoized strings:** a `useMemo`/`useCallback` that builds display text
  must list `t` (or `i18n.language`) in its deps, or it goes stale when the
  language changes without a data change.
- **Deliberate literals** (brand names, debug-only tools, developer-facing
  diagnostics): mark with `// i18n-ignore-next-line` or an
  `i18n-ignore-start` / `i18n-ignore-end` block so the checker skips them.

## Dates, times, durations

- Display **dates** use `getIntlLocale()` (the device locale for the active
  language, e.g. `en-GB`, `es-MX`, `zh-Hans-CN`; else a default region).
- **Clock times are not localized.** Every time of day (entry/gap labels, the
  timeline axis and now-pill, quiet hours, Day rhythm, the Live Activity
  "since" time) uses one English 12-hour format ("2:29 PM") via
  `formatClockTime()` / `formatTimeInTimezone()` / `formatHourLabel()` in
  `lib/timezone.ts`, and every `DateTimePicker` gets `locale={CLOCK_LOCALE}`.
  Never pass `getIntlLocale()` to a time format. Datetime-mode pickers
  therefore show English month names too.
- **Machine formatting stays pinned.** `toLocaleDateString('en-CA')`
  (YYYY-MM-DD keys) and the `en-US` `formatToParts` parsing in
  `lib/timezone.ts`, `useTimelineData`, `useDayRhythm`,
  `useDayOfWeekBreakdown`, `useRecommendedActivity` compute day boundaries and
  hours. Never localize those.
- Durations go through `formatDuration()` / the `duration.*` keys.
- Weekday names come from `weekdayNames()` / `formatWeekday()` — no hard-coded
  `["Mon", …]` arrays.

## Preset category & activity names

**Preset names stay English in the database.** Server preset ids are uuid v5
hashes of the English name (`supabase/seed.sql`), presets sync as one shared
read-only row for all users, and routine recommendations match on the English
activity name. Writing a translated name would break all three.

Instead, names are translated at display time:

- `localizeCategoryName(id, storedName)` / `localizeActivityName(id, storedName)`
  return the translation **only if** `id` is a preset (local slug id or Phase 3
  v5 id) **and** the stored name still equals the seeded English name.
  Renamed presets and custom rows show exactly what's stored.
- Hooks that map SQL rows (`useCategoriesWithActivities`, `useTimer`,
  `useTimelineData`, `useInsightsData`, …) apply these, so `name` /
  `categoryName` / `activityName` in models are **display names**. Queries
  must select `a.id` / `c.id` alongside names for this to work.
- **Edit forms only write `name` when the user changed the displayed text**
  (`edit-category-modal`, `create-activity-modal`). Otherwise saving a color
  change in Spanish would persist "Trabajo" and detach the preset from
  translation forever.
- The JSON backup exports raw DB values (English presets) so import stays
  lossless; the CSV export (for humans) uses display names.
- `presets.*` in `en.ts` must equal `constants/presets.ts`; a dev-only warning
  fires if they drift.

User-created names are stored exactly as typed in any script. Search in the
New Session modal matches against display names, so a Chinese user finds
"Work" by typing 工作.

## Native surfaces

- **Widget + Live Activity** text is pushed from JS (`useWidgetStrings` →
  `writeWidgetStrings` → App Group `widgetStrings`), because the in-app
  language may differ from the OS language the extension sees. Swift falls
  back to English per key. The Live Activity re-pushes on language change.
- **Notifications** bake their text in at schedule time.
  `useNotificationScheduler` re-queues the running entry's long-running and
  goal alerts on language change (the idle reminder fires within 30 min and is
  left alone).
- **`supportedLocales`** in the expo-localization plugin (`app.json`) lists
  shipped languages so they appear in the OS per-app language settings.

## Adding a language

1. Create `locales/<tag>.ts`: `const es: Translation = { … }` (copy `en.ts`'s
   structure; `tsc` lists every missing key). Translate `presets.*` too.
2. Register it in `lib/i18n/index.ts`: `RESOURCES`, `LANGUAGE_NATIVE_NAMES`
   (endonym), `DEFAULT_INTL_TAGS`. Import its plural data in
   `lib/i18n/intl-polyfills.ts` (`@formatjs/intl-pluralrules/locale-data/<lang>.js`
   — the `.js` suffix is required; both Chinese variants use `zh`). Hermes has
   no native `Intl.PluralRules`, so without this data plurals fall back wrong.
3. Add the tag to `supportedLocales.ios` / `.android` in `app.json`.
4. `npx tsc --noEmit && npm run i18n:check`, then rebuild (`npx expo run:ios`).
5. Verify on the simulator (below), with the language picked in Settings
   **and** via the OS language.

## Per-language verification checklist

1. **Translated everywhere** — walk every tab, settings screen, modal, the
   tutorial (reset it from debug tools), a notification, the widget and Live
   Activity. No English left (except brand "Horae" and user data).
2. **Nothing breaks** — no clipped or overflowing text (chips, pills, tab
   labels, headers); dates, weekdays and durations read naturally; timeline
   day boundaries unchanged; switching back to English restores preset names.
3. **User content in that script** — create a category + activity in the
   language, start/stop a timer, check timeline, insights, search, widget,
   CSV export, and a JSON export → wipe → import round-trip. Rename a preset
   and switch languages: the custom name must not change.

## Known gaps

- Supabase auth error messages pass through untranslated (server-provided).
- Widget-gallery name/description (`configurationDisplayName`) are still
  English — they need a String Catalog in the widget target.
- Hindi (Devanagari) typography: positive `letterSpacing` and tight
  `lineHeight` in `TYPOGRAPHY` can break or clip conjuncts; address in the
  Hindi PR with per-script overrides.
- Custom fonts (Manrope, Plus Jakarta Sans) have no CJK/Devanagari glyphs; iOS
  falls back to system fonts (PingFang / Kohinoor) for those scripts.
- **The CJK fallback face follows the OS language, not the in-app choice.**
  CoreText picks PingFang SC/TC/HK from the process's preferred languages, and
  React Native has no per-`Text` language attribute. So 繁體中文 picked in
  Settings on a non-Chinese device renders with PingFang SC glyphs (bottom-left
  `，。` instead of centred, mainland component shapes); picking it via the OS
  or iOS per-app language gives PingFang TC. Same in reverse for 简体中文 on a
  Traditional device.
- Em dashes (`——`) render from the Latin font, so the pair shows a small gap.
