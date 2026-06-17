import { describe, expect, it } from "vitest";
import {
  getDateKey,
  getDateQueryKey,
  getRelativeDateShortcuts,
  getSelectedDay,
  getTodayDate,
  getTomorrowKey,
  getYesterdayKey,
} from "./nutrition-date-state.js";

describe("nutrition date state helpers", () => {
  it("parses only ISO date query keys", () => {
    expect(getDateQueryKey("?date=2026-06-03")).toBe("2026-06-03");
    expect(getDateQueryKey("?date=03-06-2026")).toBeNull();
    expect(getDateQueryKey("?date=2026-02-31")).toBeNull();
    expect(getDateQueryKey("?tab=overview")).toBeNull();
  });

  it("builds stable date keys and Uzbek weekday labels", () => {
    const date = new Date("2026-06-03T12:00:00");

    expect(getDateKey(date)).toBe("2026-06-03");
    expect(getSelectedDay(date)).toBe("Chorshanba");
    expect(getYesterdayKey(date)).toBe("2026-06-02");
    expect(getTomorrowKey(date)).toBe("2026-06-04");
  });

  it("uses midday when building today max date", () => {
    const todayDate = getTodayDate("2026-06-03");

    expect(todayDate.getFullYear()).toBe(2026);
    expect(todayDate.getMonth()).toBe(5);
    expect(todayDate.getDate()).toBe(3);
    expect(todayDate.getHours()).toBe(12);
  });

  it("builds today, yesterday, and tomorrow overview shortcuts", () => {
    const selectedDate = new Date("2026-06-04T12:00:00");
    const shortcuts = getRelativeDateShortcuts(selectedDate, "2026-06-03");

    expect(shortcuts).toEqual([
      expect.objectContaining({
        id: "yesterday",
        label: "Kecha",
        dateKey: "2026-06-02",
        active: false,
      }),
      expect.objectContaining({
        id: "today",
        label: "Bugun",
        dateKey: "2026-06-03",
        active: false,
      }),
      expect.objectContaining({
        id: "tomorrow",
        label: "Ertaga",
        dateKey: "2026-06-04",
        active: true,
      }),
    ]);
    expect(shortcuts[2].date.getHours()).toBe(12);
  });
});
