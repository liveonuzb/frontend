import { describe, expect, it } from "vitest";
import {
  buildNutritionHistoryCsvFilename,
  buildNutritionHistoryCsvRows,
  filterHistoryMealsForView,
  flattenHistoryDayMeals,
  getHistoryDayTotals,
  getHistoryDayWaterMl,
} from "./history-filter-export-helpers.js";

describe("nutrition history filter and export helpers", () => {
  const day = {
    date: "2026-05-20",
    waterLog: [{ amountMl: "500" }, { amountMl: "bad" }],
    meals: {
      breakfast: [
        {
          id: "breakfast-1",
          name: '"Qatiq"',
          barcode: "ABC-1",
          source: "manual",
          cal: "120.8",
          protein: "8.4",
          carbs: "12.2",
          fat: "4.1",
        },
      ],
      lunch: [
        {
          id: "lunch-1",
          name: "Osh",
          source: "recipe",
          calories: "650.2",
          protein: "22.4",
          carbs: "78.2",
          fat: "24.2",
        },
      ],
      dinner: null,
    },
  };

  it("flattens days and filters by meal type, source, and search text", () => {
    const meals = flattenHistoryDayMeals(day);

    expect(meals).toHaveLength(2);
    expect(
      filterHistoryMealsForView(meals, {
        mealType: "breakfast",
        source: "manual",
        search: "qatiq abc nonushta",
      }),
    ).toEqual([
      expect.objectContaining({
        id: "breakfast-1",
        mealType: "breakfast",
      }),
    ]);
  });

  it("normalizes totals and water values for history cards", () => {
    expect(getHistoryDayTotals(flattenHistoryDayMeals(day))).toEqual({
      calories: 771,
      protein: 30.8,
      carbs: 90.4,
      fat: 28.3,
    });
    expect(getHistoryDayWaterMl(day)).toBe(500);
    expect(getHistoryDayWaterMl({ waterMl: "750.8" })).toBe(751);
  });

  it("builds filtered CSV rows and stable export filenames", () => {
    expect(
      buildNutritionHistoryCsvRows([day], {
        mealType: "all",
        source: "recipe",
        search: "osh",
      }),
    ).toEqual([
      [
        "date",
        "meal_type",
        "food_name",
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "water_ml",
      ],
      ["2026-05-20", "lunch", "Osh", 650, 22, 78, 24, 500],
    ]);

    expect(
      buildNutritionHistoryCsvRows([
        {
          date: "2026-05-21",
          waterMl: "1000",
          meals: { breakfast: [] },
        },
      ]),
    ).toEqual([
      [
        "date",
        "meal_type",
        "food_name",
        "calories",
        "protein_g",
        "carbs_g",
        "fat_g",
        "water_ml",
      ],
      ["2026-05-21", "", "", 0, 0, 0, 0, 1000],
    ]);

    expect(
      buildNutritionHistoryCsvFilename({
        startDate: "2026-05-20",
        endDate: "2026-05-25",
        mealType: "lunch",
        source: "recipe",
        search: "Osh palov!",
      }),
    ).toBe("nutrition-history-2026-05-20-2026-05-25-lunch-recipe-osh-palov.csv");
  });
});
