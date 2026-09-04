import { expect, mock, test } from "bun:test";
import en from "../src/locales/en.json";
import zh from "../src/locales/zh-CN.json";

let store;
mock.module("@vendetta/metro", () => ({ findByStoreName: () => store }));
const { t } = await import("../src/i18n.ts");

test("Translation dictionaries match and language follows LocaleStore", () => {
  expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort());
  for (const [locale, dictionary] of [["en-US", en], ["zh-CN", zh]]) {
    store = { locale };
    for (const [key, value] of Object.entries(dictionary)) {
      expect(value.trim().length).toBeGreaterThan(0);
      expect(t(key)).toBe(value);
    }
  }
  for (const locale of ["zh", "zh-CN", "zh-TW", "zh-Hant", "ZH_cn", " zh-CN "]) {
    store = { locale };
    expect(t("settings.general")).toBe("通用");
  }
  for (const locale of ["en-US", "en-GB", "ja", "zhx", "", null, 42]) {
    store = { locale };
    expect(t("settings.general")).toBe("General");
  }
  store = { getLocale: () => "zh-CN" };
  expect(t("settings.general")).toBe("通用");
  store.getLocale = () => "en-US";
  expect(t("settings.general")).toBe("General");
  store.getLocale = () => { throw new Error("Store failed"); };
  expect(t("settings.general")).toBe("General");
  store = undefined;
  expect(t("settings.general")).toBe("General");
});
