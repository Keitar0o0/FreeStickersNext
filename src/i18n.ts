import { findByStoreName } from "@vendetta/metro";

import en from "./locales/en.json";
import zh from "./locales/zh-CN.json";

export function t(key: keyof typeof en): string {
  try {
    const store = findByStoreName("LocaleStore");
    const locale = typeof store?.getLocale === "function" ? store.getLocale() : store?.locale;
    if (typeof locale === "string" && /^zh(?:[-_]|$)/i.test(locale.trim())) return zh[key];
  } catch {}
  return en[key];
}
