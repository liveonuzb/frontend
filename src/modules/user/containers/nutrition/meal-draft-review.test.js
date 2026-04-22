import { describe, expect, it } from "vitest";
import {
  buildMealPayloadFromDraft,
  getDraftNutritionPreview,
} from "./meal-draft-review.jsx";
import {
  addMealIngredient,
  removeMealIngredient,
  updateMealIngredient,
} from "./meal-ingredients.js";

describe("meal draft review helpers", () => {
  it("recalculates totals from edited ingredient grams", () => {
    const item = {
      title: "Chicken rice",
      ingredients: [
        {
          id: "rice",
          name: "Rice",
          estimatedGrams: 150,
          grams: 225,
          nutrition: {
            calories: 200,
            protein: 4,
            carbs: 44,
            fat: 0.4,
            fiber: 0.6,
          },
        },
        {
          id: "chicken",
          name: "Chicken",
          estimatedGrams: 100,
          grams: 50,
          nutrition: {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
          },
        },
      ],
    };

    expect(getDraftNutritionPreview(item)).toEqual({
      calories: 383,
      protein: 21.5,
      carbs: 66,
      fat: 2.4,
      fiber: 0.9,
    });
  });

  it("builds meal payload with ingredient snapshot and saved meal link", () => {
    const payload = buildMealPayloadFromDraft(
      {
        title: "Salad bowl",
        ingredients: [
          {
            id: "tomato",
            name: "Tomato",
            estimatedGrams: 100,
            grams: 120,
            nutrition: {
              calories: 18,
              protein: 0.9,
              carbs: 3.9,
              fat: 0.2,
              fiber: 1.2,
            },
          },
        ],
      },
      {
        source: "camera",
        image: "https://cdn.example.com/salad.jpg",
        savedMealId: "saved-1",
      },
    );

    expect(payload).toMatchObject({
      name: "Salad bowl",
      source: "camera",
      savedMealId: "saved-1",
      image: "https://cdn.example.com/salad.jpg",
      ingredients: [
        expect.objectContaining({
          name: "Tomato",
          grams: 120,
        }),
      ],
    });
    expect(payload.cal).toBe(22);
  });

  it("adds a custom ingredient and includes it in draft totals", () => {
    const ingredients = addMealIngredient([], {
      id: "avocado",
      name: "Avocado",
      grams: 80,
      nutrition: {
        calories: 128,
        protein: 1.6,
        carbs: 6.8,
        fat: 11.8,
        fiber: 5.4,
      },
      matchStatus: "ai-estimated",
      nutritionSource: "ai",
    });

    expect(ingredients).toHaveLength(1);
    expect(getDraftNutritionPreview({ ingredients })).toEqual({
      calories: 128,
      protein: 1.6,
      carbs: 6.8,
      fat: 11.8,
      fiber: 5.4,
    });
  });

  it("updates edited ingredient macros and removes deleted ingredients", () => {
    const original = [
      {
        id: "egg",
        name: "Egg",
        grams: 50,
        nutrition: {
          calories: 72,
          protein: 6.3,
          carbs: 0.4,
          fat: 4.8,
          fiber: 0,
        },
      },
      {
        id: "oil",
        name: "Oil",
        grams: 10,
        nutrition: {
          calories: 90,
          protein: 0,
          carbs: 0,
          fat: 10,
          fiber: 0,
        },
      },
    ];

    const updated = updateMealIngredient(original, "egg", {
      grams: 100,
      nutrition: {
        calories: 144,
        protein: 12.6,
        carbs: 0.8,
        fat: 9.6,
        fiber: 0,
      },
    });
    const remaining = removeMealIngredient(updated, "oil");

    expect(remaining).toHaveLength(1);
    expect(getDraftNutritionPreview({ ingredients: remaining })).toEqual({
      calories: 144,
      protein: 12.6,
      carbs: 0.8,
      fat: 9.6,
      fiber: 0,
    });
  });
});
