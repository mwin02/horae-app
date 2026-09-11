/**
 * Shape every non-English translation must satisfy. Derived from `en.ts`
 * so a missing or misspelled key in any locale is a `tsc` error — that is
 * the "translated everywhere" check.
 *
 * Plural keys follow i18next's v4 JSON format (`key_one`, `key_other`).
 * English only uses one/other; a locale may add the extra CLDR categories
 * its grammar needs (`_two`, `_few`, `_many`). `_zero` is deliberately not
 * allowed — i18next only uses it as an explicit override and CLDR maps 0 to
 * `one` in Hindi.
 */
type PluralVariant = "two" | "few" | "many";

type PluralExtras<T> = {
  [K in keyof T as K extends `${infer Base}_other`
    ? `${Base}_${PluralVariant}`
    : never]?: string;
};

export type TranslationShape<T> = {
  [K in keyof T]: T[K] extends string ? string : TranslationShape<T[K]>;
} & PluralExtras<T>;
