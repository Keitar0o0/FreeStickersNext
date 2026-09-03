import { expect, mock, test } from "bun:test";

let store;
mock.module("@vendetta/metro", () => ({ findByStoreName: () => store }));
const { t } = await import("../src/i18n.ts");

test("Toast language follows LocaleStore", () => {
  for (const locale of ["zh", "zh-CN", "zh-TW", "zh-Hant", "ZH_cn", " zh-CN "]) {
    store = { locale };
    expect(t("中文", "English")).toBe("中文");
  }
  for (const locale of ["en-US", "en-GB", "ja", "zhx", "", null, 42]) {
    store = { locale };
    expect(t("中文", "English")).toBe("English");
  }
  store = { getLocale: () => "zh-CN" };
  expect(t("中文", "English")).toBe("中文");
  store.getLocale = () => "en-US";
  expect(t("中文", "English")).toBe("English");
  store.getLocale = () => { throw new Error("Store failed"); };
  expect(t("中文", "English")).toBe("English");
  store = undefined;
  expect(t("中文", "English")).toBe("English");
});
