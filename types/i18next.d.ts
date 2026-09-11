import "i18next";

import type en from "@/locales/en";

// Types `t()` keys (and interpolation values) against the English source so
// a missing or misspelled key fails `tsc`.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
  }
}
