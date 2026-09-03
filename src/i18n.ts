import { findByStoreName } from "@vendetta/metro";

export function t(zh: string, en: string): string {
  try {
    const store = findByStoreName("LocaleStore");
    const locale = typeof store?.getLocale === "function" ? store.getLocale() : store?.locale;
    if (typeof locale === "string" && /^zh(?:[-_]|$)/i.test(locale.trim())) return zh;
  } catch {}
  return en;
}
