import { describe, expect, it } from "vitest";
import { buildShoppingList, getPlanShoppingDays } from "./shopping-list.jsx";

describe("shopping-list duration plans", () => {
  it("returns an empty list before a plan is loaded", () => {
    expect(buildShoppingList(null)).toEqual([]);
  });

  it("uses every canonical day in a 30-day plan instead of only weekdays", () => {
    const weeklyKanban = {
      "day-1": [
        {
          id: "breakfast-1",
          items: [{ name: "Tuxum", cal: 100, grams: 50, unit: "g" }],
        },
      ],
      "day-8": [
        {
          id: "breakfast-8",
          items: [{ name: "Tuxum", cal: 120, grams: 60, unit: "g" }],
        },
      ],
      "day-30": [
        {
          id: "snack-30",
          items: [{ name: "Olma", cal: 80, grams: 100, unit: "g" }],
        },
      ],
    };

    expect(getPlanShoppingDays({ weeklyKanban, durationDays: 30 })).toEqual([
      { key: "day-1", label: "1-kun" },
      { key: "day-2", label: "2-kun" },
      { key: "day-3", label: "3-kun" },
      { key: "day-4", label: "4-kun" },
      { key: "day-5", label: "5-kun" },
      { key: "day-6", label: "6-kun" },
      { key: "day-7", label: "7-kun" },
      { key: "day-8", label: "8-kun" },
      { key: "day-9", label: "9-kun" },
      { key: "day-10", label: "10-kun" },
      { key: "day-11", label: "11-kun" },
      { key: "day-12", label: "12-kun" },
      { key: "day-13", label: "13-kun" },
      { key: "day-14", label: "14-kun" },
      { key: "day-15", label: "15-kun" },
      { key: "day-16", label: "16-kun" },
      { key: "day-17", label: "17-kun" },
      { key: "day-18", label: "18-kun" },
      { key: "day-19", label: "19-kun" },
      { key: "day-20", label: "20-kun" },
      { key: "day-21", label: "21-kun" },
      { key: "day-22", label: "22-kun" },
      { key: "day-23", label: "23-kun" },
      { key: "day-24", label: "24-kun" },
      { key: "day-25", label: "25-kun" },
      { key: "day-26", label: "26-kun" },
      { key: "day-27", label: "27-kun" },
      { key: "day-28", label: "28-kun" },
      { key: "day-29", label: "29-kun" },
      { key: "day-30", label: "30-kun" },
    ]);

    expect(buildShoppingList({ weeklyKanban, durationDays: 30 })).toEqual([
      expect.objectContaining({
        name: "Tuxum",
        count: 2,
        totalAmount: 110,
        totalCal: 220,
      }),
      expect.objectContaining({
        name: "Olma",
        count: 1,
        totalAmount: 100,
        totalCal: 80,
      }),
    ]);
  });
});
