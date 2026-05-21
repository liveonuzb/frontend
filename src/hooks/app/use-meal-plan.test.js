import { describe, expect, it } from "vitest";
import { normalizeMealPlanTemplateForTest } from "./use-meal-plan.js";

describe("meal plan template normalization", () => {
  it("preserves 30-day compatibility and blocking metadata", () => {
    const template = normalizeMealPlanTemplateForTest({
      id: "template-30",
      name: "30 kunlik balans",
      days: 30,
      daysWithMeals: 30,
      mealsCount: 120,
      isCompatible: false,
      blockingReasons: [{ type: "disliked_food", foodId: 12 }],
      appliedTargetCalories: 2400,
      weeklyKanban: { "day-1": [] },
    });

    expect(template).toMatchObject({
      id: "template-30",
      title: "30 kunlik balans",
      days: 30,
      daysWithMeals: 30,
      mealsCount: 120,
      isCompatible: false,
      blockingReasons: [{ type: "disliked_food", foodId: 12 }],
      appliedTargetCalories: 2400,
      weeklyKanban: { "day-1": [] },
    });
  });
});
