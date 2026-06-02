import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatMealTime,
  getCameraDateOptions,
} from "./meal-date-time-utils.js";

describe("meal date time labels", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults date labels to Uzbek for the nutrition logging flow", () => {
    expect(getCameraDateOptions("2026-05-30")).toEqual([
      { dateKey: "2026-05-30", label: "Kecha" },
      { dateKey: "2026-05-31", label: "Bugun" },
    ]);

    expect(
      formatMealTime({
        dateKey: "2026-05-31",
        hour: 8,
        minute: 30,
        period: "AM",
      }),
    ).toBe("Bugun, 8:30 AM");
  });
});
