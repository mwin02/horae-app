/**
 * Intl polyfills for Hermes. Hermes ships DateTimeFormat / NumberFormat but
 * not Intl.PluralRules, which i18next needs to pick `_one` / `_other` keys —
 * without it every plural string renders wrong. The non-`force` entry points
 * only install when the engine lacks the API, so a future Hermes with native
 * support takes over automatically.
 *
 * Order matters: PluralRules depends on getCanonicalLocales and Locale.
 * The `.js` suffixes are required — these packages' `exports` maps only
 * list the suffixed paths.
 *
 * Plural rules need per-language data. When adding a language, import
 * `@formatjs/intl-pluralrules/locale-data/<lang>.js` here (zh-Hans /
 * zh-Hant both use `zh`). See docs/LOCALIZATION.md.
 */
import "@formatjs/intl-getcanonicallocales/polyfill.js";
import "@formatjs/intl-locale/polyfill.js";
import "@formatjs/intl-pluralrules/polyfill.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/es.js";
