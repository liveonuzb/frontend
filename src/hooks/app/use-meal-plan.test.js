import { describe, expect, it } from "vitest";
import {
  normalizeMealPlanTemplateDetailResponseForTest,
  normalizeMealPlanTemplateForTest,
  normalizeMealPlanTemplateLibraryResponseForTest,
} from "./use-meal-plan.js";

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

  it("reads templates from the global response wrapper list shape", () => {
    const library = normalizeMealPlanTemplateLibraryResponseForTest({
      data: {
        data: [
          {
            id: "template-from-wrapper",
            title: "Admin template",
            days: 30,
            mealsCount: 120,
          },
        ],
        meta: {
          total: 1,
          goals: [{ value: "maintenance", label: "Balans" }],
        },
      },
    });

    expect(library.templates).toMatchObject([
      {
        id: "template-from-wrapper",
        title: "Admin template",
        days: 30,
        mealsCount: 120,
        weeklyKanban: {},
      },
    ]);
    expect(library.goals).toEqual([{ value: "maintenance", label: "Balans" }]);
    expect(library.meta).toMatchObject({ total: 1 });
  });

  it("preserves weekly kanban from the template detail response", () => {
    const template = normalizeMealPlanTemplateDetailResponseForTest({
      data: {
        data: {
          id: "template-detail",
          title: "Template detail",
          weeklyKanban: {
            "day-1": [{ id: "breakfast", items: [] }],
          },
        },
      },
    });

    expect(template).toMatchObject({
      id: "template-detail",
      title: "Template detail",
      weeklyKanban: {
        "day-1": [{ id: "breakfast", items: [] }],
      },
    });
  });
});
