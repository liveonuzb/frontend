import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Telegram WebApp bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    document.documentElement.removeAttribute("style");
    document.documentElement.classList.remove("dark");
    delete window.Telegram;
  });

  it("applies Telegram theme params to app CSS variables and chrome", async () => {
    const handlers = {};
    const webApp = {
      colorScheme: "dark",
      viewportHeight: 720,
      viewportStableHeight: 700,
      safeAreaInset: {
        top: 12,
        right: 4,
        bottom: 20,
        left: 4,
      },
      contentSafeAreaInset: {
        top: 8,
        right: 0,
        bottom: 16,
        left: 0,
      },
      themeParams: {
        bg_color: "#101010",
        text_color: "#f8fafc",
        secondary_bg_color: "#1f2937",
        button_color: "#22c55e",
        button_text_color: "#052e16",
        hint_color: "#94a3b8",
        section_separator_color: "#334155",
      },
      ready: vi.fn(),
      expand: vi.fn(),
      setHeaderColor: vi.fn(),
      setBackgroundColor: vi.fn(),
      onEvent: vi.fn((event, handler) => {
        handlers[event] = handler;
      }),
    };
    window.Telegram = { WebApp: webApp };

    const { initTelegramWebApp } = await import("./telegram.js");
    initTelegramWebApp();

    const styles = document.documentElement.style;
    expect(webApp.ready).toHaveBeenCalledTimes(1);
    expect(webApp.expand).toHaveBeenCalledTimes(1);
    expect(webApp.setHeaderColor).toHaveBeenCalledWith("#101010");
    expect(webApp.setBackgroundColor).toHaveBeenCalledWith("#101010");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.dataset.telegramWebapp).toBe("true");
    expect(styles.getPropertyValue("--tg-viewport-height")).toBe("720px");
    expect(styles.getPropertyValue("--tg-viewport-stable-height")).toBe(
      "700px",
    );
    expect(styles.getPropertyValue("--tg-safe-area-inset-top")).toBe("12px");
    expect(styles.getPropertyValue("--tg-safe-area-inset-bottom")).toBe("20px");
    expect(styles.getPropertyValue("--tg-content-safe-area-inset-top")).toBe(
      "8px",
    );
    expect(styles.getPropertyValue("--tg-content-safe-area-inset-bottom")).toBe(
      "16px",
    );
    expect(styles.getPropertyValue("--tg-theme-bg-color")).toBe("#101010");
    expect(styles.getPropertyValue("--background")).toBe("#101010");
    expect(styles.getPropertyValue("--foreground")).toBe("#f8fafc");
    expect(styles.getPropertyValue("--card")).toBe("#1f2937");
    expect(styles.getPropertyValue("--primary")).toBe("#22c55e");
    expect(styles.getPropertyValue("--primary-foreground")).toBe("#052e16");
    expect(styles.getPropertyValue("--border")).toBe("#334155");

    webApp.themeParams.bg_color = "#ffffff";
    webApp.themeParams.text_color = "#111827";
    handlers.themeChanged();

    expect(webApp.setHeaderColor).toHaveBeenLastCalledWith("#ffffff");
    expect(styles.getPropertyValue("--background")).toBe("#ffffff");
    expect(styles.getPropertyValue("--foreground")).toBe("#111827");

    webApp.viewportHeight = 640;
    webApp.viewportStableHeight = 620;
    webApp.safeAreaInset.bottom = 24;
    handlers.viewportChanged();

    expect(styles.getPropertyValue("--tg-viewport-height")).toBe("640px");
    expect(styles.getPropertyValue("--tg-viewport-stable-height")).toBe(
      "620px",
    );
    expect(styles.getPropertyValue("--tg-safe-area-inset-bottom")).toBe("24px");
  });
});
