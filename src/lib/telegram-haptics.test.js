import { beforeEach, describe, expect, it, vi } from "vitest";
import { triggerTelegramHapticFeedback } from "./telegram-haptics.js";

describe("Telegram haptic feedback", () => {
  beforeEach(() => {
    delete window.Telegram;
  });

  it("uses notification haptics for success, warning, and error states", () => {
    const notificationOccurred = vi.fn();
    window.Telegram = {
      WebApp: {
        HapticFeedback: {
          notificationOccurred,
        },
      },
    };

    triggerTelegramHapticFeedback("success");
    triggerTelegramHapticFeedback("warning");
    triggerTelegramHapticFeedback("error");

    expect(notificationOccurred).toHaveBeenCalledWith("success");
    expect(notificationOccurred).toHaveBeenCalledWith("warning");
    expect(notificationOccurred).toHaveBeenCalledWith("error");
  });

  it("falls back to impact haptics for generic interaction feedback", () => {
    const impactOccurred = vi.fn();
    window.Telegram = {
      WebApp: {
        HapticFeedback: {
          impactOccurred,
        },
      },
    };

    triggerTelegramHapticFeedback("impact", "medium");

    expect(impactOccurred).toHaveBeenCalledWith("medium");
  });
});
