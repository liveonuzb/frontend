import { describe, expect, it } from "vitest";
import {
  CALORIE_FILTER_DEFAULT,
  buildNutritionTotals,
  buildPendingScanFoodsByType,
  buildPlannedByType,
  buildSortedMealSections,
  filterMealSections,
  getActiveMealType,
  getActiveNutritionFilterCount,
  getMealDateKey,
  mergePlannedAndLoggedMealItems,
  getWaterConsumedMl,
} from "./nutrition-meal-section-state.js";

describe("nutrition meal section state", () => {
  it("groups pending AI scan previews by meal type", () => {
    const grouped = buildPendingScanFoodsByType([
      {
        id: "scan-1",
        mealType: "lunch",
        imageUrl: "https://cdn.test/meal.jpg",
        status: "draft",
        item: {
          title: "Chicken bowl",
          nutrition: {
            calories: 420,
            protein: 32,
            carbs: 45,
            fat: 12,
          },
        },
      },
    ]);

    expect(grouped.lunch).toEqual([
      expect.objectContaining({
        id: "scan-1",
        source: "camera",
        name: "Chicken bowl",
        cal: 420,
        protein: 32,
        scanId: "scan-1",
      }),
    ]);
    expect(grouped.breakfast).toEqual([]);
  });

  it("sorts sections by active plan order and keeps logged-only meals visible", () => {
    const currentDayPlan = [
      {
        type: "Tushlik",
        time: "12:30",
        items: [{ name: "Planned soup" }],
      },
      {
        type: "Nonushta",
        items: [{ id: "planned-eggs", name: "Eggs" }],
      },
    ];
    const plannedByType = buildPlannedByType(currentDayPlan);
    const sections = buildSortedMealSections({
      currentDayPlan,
      plannedByType,
      meals: {
        lunch: [{ id: "logged-lunch", name: "Logged lunch" }],
        snack: [{ id: "logged-snack", name: "Yogurt" }],
      },
    });

    expect(sections.map(([type]) => type)).toEqual([
      "lunch",
      "breakfast",
      "snack",
    ]);
    expect(sections[0][1].plannedItems[0]).toMatchObject({
      id: "plan-Tushlik-Planned soup-0",
      colType: "Tushlik",
    });
  });

  it("filters foods by source, search, calories, date, and meal type", () => {
    const sections = [
      [
        "breakfast",
        {
          foods: [
            {
              id: "oats",
              name: "Protein oats",
              source: "manual",
              cal: 340,
              addedAt: "2026-06-03T08:00:00.000Z",
            },
            {
              id: "cake",
              name: "Cake",
              source: "camera",
              cal: 720,
              addedAt: "2026-06-01T08:00:00.000Z",
            },
          ],
          plannedItems: [{ id: "planned", name: "Plan oats", cal: 360 }],
        },
      ],
      [
        "lunch",
        {
          foods: [{ id: "soup", name: "Soup", source: "manual", cal: 220 }],
          plannedItems: [],
        },
      ],
    ];

    const filtered = filterMealSections({
      sortedMealSections: sections,
      mealFilter: "breakfast",
      sourceFilters: ["manual"],
      mealSearch: "oats",
      calorieRange: [300, 400],
      filterDateRange: { start: "2026-06-02", end: "2026-06-04" },
      dateKey: "2026-06-03",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0][0]).toBe("breakfast");
    expect(filtered[0][1].foods).toEqual([
      expect.objectContaining({ id: "oats" }),
    ]);
    expect(filtered[0][1].plannedItems).toEqual([]);
  });

  it("counts active filters and normalizes meal dates", () => {
    expect(
      getActiveNutritionFilterCount({
        sourceFilters: ["manual", "camera"],
        mealSearch: "  oats ",
        calorieRange: [100, 700],
        filterDateRange: { start: "2026-06-01", end: "" },
      }),
    ).toBe(5);
    expect(
      getActiveNutritionFilterCount({
        sourceFilters: [],
        mealSearch: "",
        calorieRange: CALORIE_FILTER_DEFAULT,
        filterDateRange: { start: "", end: "" },
      }),
    ).toBe(0);
    expect(getMealDateKey({ addedAt: "bad-date" }, "2026-06-03")).toBe(
      "2026-06-03",
    );
  });

  it("calculates rounded nutrition totals and water consumption", () => {
    expect(
      buildNutritionTotals({
        breakfast: [{ cal: 120.4, protein: 10.4, carbs: 20.1, fat: 4, qty: 2 }],
        lunch: [{ cal: 99.6, protein: 5.2, carbs: 8.8, fat: 3.2 }],
      }),
    ).toEqual({
      calories: 340,
      protein: 26,
      carbs: 49,
      fat: 11,
    });

    expect(
      getWaterConsumedMl({
        dayData: { waterLog: [{ amountMl: 300 }, { amountMl: 500 }] },
        goals: { cupSize: 250 },
      }),
    ).toBe(800);
    expect(
      getWaterConsumedMl({
        dayData: { waterCups: 3 },
        goals: { cupSize: 200 },
      }),
    ).toBe(600);
  });

  it("merges planned meals with matching logged items and keeps unlogged plan items visible", () => {
    const items = [
      { id: "logged-oats", name: "Protein oats", grams: 120, cal: 340 },
      { id: "logged-yogurt", name: "Yogurt", grams: 150, cal: 180 },
    ];
    const plannedItems = [
      { id: "planned-oats", name: "Protein oats", grams: 120, cal: 330 },
      { id: "planned-soup", name: "Soup", grams: 250, cal: 280 },
    ];

    expect(
      mergePlannedAndLoggedMealItems({ items, plannedItems }),
    ).toEqual([
      expect.objectContaining({
        id: "logged-oats",
        isConsumed: true,
        isFromPlanLinked: true,
      }),
      expect.objectContaining({
        id: "planned-soup",
        isConsumed: false,
        isFromPlanLinked: true,
        isPlanned: true,
      }),
      expect.objectContaining({
        id: "logged-yogurt",
        isConsumed: true,
        isFromPlanLinked: false,
      }),
    ]);
  });

  it("detects active meal type by current hour", () => {
    expect(getActiveMealType(new Date("2026-06-03T07:00:00"))).toBe(
      "breakfast",
    );
    expect(getActiveMealType(new Date("2026-06-03T12:00:00"))).toBe("lunch");
    expect(getActiveMealType(new Date("2026-06-03T16:00:00"))).toBe("snack");
    expect(getActiveMealType(new Date("2026-06-03T20:00:00"))).toBe("dinner");
  });
});
