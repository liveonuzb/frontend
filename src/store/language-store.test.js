import { beforeEach, describe, expect, it, vi } from "vitest";

const changeLanguage = vi.hoisted(() => vi.fn());

vi.mock("@/lib/i18n", () => ({
  default: {
    changeLanguage,
  },
}));

const importLanguageStore = async () => {
  vi.resetModules();
  return import("./language-store.js");
};

describe("language store", () => {
  beforeEach(() => {
    localStorage.clear();
    changeLanguage.mockClear();
    document.documentElement.removeAttribute("lang");
    document.title = "Old title";
  });

  it("syncs i18n and the document language with the persisted language during hydration", async () => {
    localStorage.setItem(
      "language-storage",
      JSON.stringify({
        state: {
          currentLanguage: "uz",
          hasSelectedLanguage: true,
        },
        version: 0,
      }),
    );

    const { default: useLanguageStore } = await importLanguageStore();

    expect(useLanguageStore.getState().currentLanguage).toBe("uz");
    expect(changeLanguage).toHaveBeenCalledWith("uz");
    expect(document.documentElement).toHaveAttribute("lang", "uz");
    expect(document.title).toBe(
      "LiveOn - 60 soniyada AI ovqatlanish va mashg'ulot rejasi",
    );
  });

  it("syncs i18n and the document language when the active language changes", async () => {
    const { default: useLanguageStore } = await importLanguageStore();

    useLanguageStore.getState().setCurrentLanguage("en");

    expect(changeLanguage).toHaveBeenLastCalledWith("en");
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.title).toBe(
      "LiveOn - AI meal and workout plan in 60 seconds",
    );
  });
});
