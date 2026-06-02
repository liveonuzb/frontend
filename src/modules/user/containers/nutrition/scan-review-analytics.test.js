import { describe, expect, it } from "vitest";
import { buildNutritionScanReviewEventProperties } from "./scan-review-analytics.js";

describe("Nutrition scan review analytics", () => {
  it("summarizes reviewed AI draft items without storing full food names", () => {
    expect(
      buildNutritionScanReviewEventProperties({
        sourceType: "camera",
        action: "saved",
        items: [
          {
            confidence: 0.52,
            reviewNeeded: true,
            manualNutritionOverride: { calories: 200 },
            ingredients: [
              { nutritionSource: "ai", reviewNeeded: true },
              { nutritionSource: "catalog", reviewNeeded: false },
            ],
          },
          {
            confidence: 0.94,
            reviewNeeded: false,
            ingredients: [{ nutritionSource: "catalog", reviewNeeded: false }],
          },
        ],
      }),
    ).toEqual({
      sourceType: "camera",
      action: "saved",
      itemCount: 2,
      needsReviewCount: 1,
      confirmedItemCount: 1,
      editedItemCount: 1,
      aiEstimatedIngredientCount: 1,
      averageConfidence: 73,
    });
  });
});
