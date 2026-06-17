import { describe, expect, it } from "vitest";
import {
  buildRecipeCreatePayload,
  getIngredientNutritionIssues,
  getIngredientNutritionSourceLabel,
} from "./recipe-builder-payload.js";

const basicInfo = {
  title: "Yangi salat",
  description: "Proteinli tushlik",
  category: "Tushlik",
  difficulty: "Oson",
  prepTimeMinutes: "10",
  cookTimeMinutes: "15",
  totalTimeMinutes: "25",
  servings: "2",
  tags: ["high-protein"],
  allergens: ["gluten"],
};

const ingredients = [
  {
    id: "ingredient-1",
    name: "Tovuq filesi",
    quantity: 120,
    unit: "g",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sugar: 0,
    sodium: 74,
    nutritionSource: "manual",
    matchStatus: "manual",
    reviewNeeded: false,
    isRequired: true,
  },
];

describe("recipe builder payload", () => {
  it("flags ingredients without a trusted nutrition source", () => {
    expect(
      getIngredientNutritionIssues([
        {
          id: "unknown",
          name: "Noma'lum mahsulot",
          quantity: 50,
          unit: "g",
          calories: 0,
          reviewNeeded: true,
          matchStatus: "unmatched",
        },
      ]),
    ).toEqual([
      {
        id: "unknown",
        message: "Noma'lum mahsulot uchun oziqaviy manbani tasdiqlang.",
      },
    ]);
    expect(
      getIngredientNutritionSourceLabel({ reviewNeeded: true }),
    ).toBe("Tekshirish kerak");
  });

  it("builds an API-ready personal recipe payload", () => {
    expect(
      buildRecipeCreatePayload({
        basicInfo,
        ingredients,
        steps: [
          {
            id: "step-1",
            title: "Tayyorlang",
            description: "Hammasini aralashtiring.",
            durationMinutes: 5,
          },
        ],
        imageUrl: "/foods/salad.webp",
        visibility: "public",
        recipeStatus: "review_requested",
      }),
    ).toEqual(
      expect.objectContaining({
        title: "Yangi salat",
        recipeStatus: "review_requested",
        needsAdminReview: true,
        dietaryTags: ["high-protein"],
        allergenTags: ["gluten"],
        calories: 165,
        ingredients: [
          expect.objectContaining({
            name: "Tovuq filesi",
            grams: 120,
            nutritionSource: "manual",
            nutritionSnapshot: expect.objectContaining({
              calories: 165,
              protein: 31,
            }),
          }),
        ],
        instructions: [
          {
            stepNumber: 1,
            title: "Tayyorlang",
            body: "Hammasini aralashtiring.",
            durationMinutes: 5,
            mediaUrl: null,
          },
        ],
      }),
    );
  });
});
