import { describe, expect, it } from "vitest";
import {
  buildFoodQualitySummary,
  hasFoodMacroWarning,
} from "./food-quality.js";

const activeLanguages = [
  { code: "uz", isActive: true },
  { code: "ru", isActive: true },
  { code: "en", isActive: false },
];

describe("admin food quality summary", () => {
  it("scores complete manual foods as good", () => {
    const summary = buildFoodQualitySummary(
      {
        name: "Osh",
        translations: { uz: "Osh", ru: "Плов" },
        imageUrl: "https://cdn.example.com/osh.jpg",
        calories: 430,
        protein: 16,
        carbs: 58,
        fat: 15,
        categoryIds: [1],
        cuisineIds: [2],
        nutritionMode: "manual",
      },
      activeLanguages,
    );

    expect(summary).toMatchObject({
      score: 100,
      grade: "good",
      issues: [],
    });
  });

  it("reports missing coverage and recipe ingredients", () => {
    const summary = buildFoodQualitySummary(
      {
        name: "Draft recipe",
        translations: { uz: "Draft recipe" },
        imageUrl: null,
        calories: 500,
        protein: 1,
        carbs: 1,
        fat: 1,
        categoryIds: [],
        cuisineIds: [],
        nutritionMode: "recipe",
        recipeItems: [],
      },
      activeLanguages,
    );

    expect(summary.score).toBe(0);
    expect(summary.issues).toEqual([
      { code: "missing_translation", label: "Tarjima kam" },
      { code: "missing_image", label: "Rasm yo'q" },
      { code: "macro_warning", label: "Makro tekshirilsin" },
      { code: "missing_category", label: "Kategoriya yo'q" },
      { code: "missing_cuisine", label: "Oshxona yo'q" },
      { code: "recipe_missing_ingredients", label: "Recipe tarkibi yo'q" },
    ]);
  });

  it("flags macro-calorie mismatches", () => {
    expect(
      hasFoodMacroWarning({
        calories: 450,
        protein: 5,
        carbs: 5,
        fat: 5,
      }),
    ).toBe(true);
    expect(
      hasFoodMacroWarning({
        calories: 450,
        protein: 18,
        carbs: 54,
        fat: 18,
      }),
    ).toBe(false);
  });
});
