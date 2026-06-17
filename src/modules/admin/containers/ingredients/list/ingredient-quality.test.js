import { afterEach, describe, expect, it, vi } from "vitest";
import { getIngredientQualityIssues } from "./ingredient-quality.js";

describe("getIngredientQualityIssues", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects pricing quality issues", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T00:00:00.000Z"));

    const issues = getIngredientQualityIssues({
      pricePer100g: 1000,
      priceUpdatedAt: "2025-01-01T00:00:00.000Z",
      regionalPrices: [{ regionKey: "uzbekistan", pricePer100g: 1000 }],
      calories: 100,
      protein: 1,
      carbs: 1,
      fat: 1,
      servingUnit: "g",
    });

    expect(issues.map((issue) => issue.code)).toEqual([
      "stale_price",
      "missing_regional_price",
      "macro_calorie_mismatch",
    ]);
  });

  it("detects missing and impossible price values", () => {
    expect(
      getIngredientQualityIssues({
        pricePer100g: null,
        regionalPrices: [],
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        servingUnit: "g",
      }).map((issue) => issue.code),
    ).toEqual(["missing_price", "missing_regional_price"]);

    expect(
      getIngredientQualityIssues({
        pricePer100g: 10000001,
        regionalPrices: [],
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        servingUnit: "g",
      }).map((issue) => issue.code),
    ).toContain("impossible_price");
  });

  it("detects nutrition quality issues", () => {
    expect(
      getIngredientQualityIssues({
        pricePer100g: 1000,
        priceUpdatedAt: "2026-06-01T00:00:00.000Z",
        regionalPrices: [
          { regionKey: "uzbekistan", pricePer100g: 1000 },
          { regionKey: "tashkent", pricePer100g: 1200 },
        ],
        calories: 1200,
        protein: 1,
        carbs: 1,
        fat: 1,
        servingUnit: "g",
      }).map((issue) => issue.code),
    ).toEqual(["impossible_calories", "macro_calorie_mismatch"]);
  });

  it("detects serving unit and dietary allergen conflicts", () => {
    expect(
      getIngredientQualityIssues({
        pricePer100g: 1000,
        priceUpdatedAt: "2026-06-01T00:00:00.000Z",
        regionalPrices: [
          { regionKey: "uzbekistan", pricePer100g: 1000 },
          { regionKey: "tashkent", pricePer100g: 1200 },
        ],
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        servingUnit: "",
        dietaryTags: ["gluten-free"],
        allergenTags: ["gluten"],
      }).map((issue) => issue.code),
    ).toEqual(["missing_serving_unit", "dietary_allergen_conflict"]);
  });
});
