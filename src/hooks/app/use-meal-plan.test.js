import { describe, expect, it } from "vitest";
import {
  buildMealPlanPayloadForTest,
  normalizeMealPlanForTest,
  normalizeMealPlanShoppingList,
  normalizeMealPlanTemplateDetailResponseForTest,
  normalizeMealPlanTemplateForTest,
  normalizeMealPlanTemplateLibraryResponseForTest,
} from "./use-meal-plan.js";

describe("meal plan template normalization", () => {
  it("preserves 30-day compatibility and blocking metadata", () => {
    const template = normalizeMealPlanTemplateForTest({
      id: "template-30",
      name: "30 kunlik balans",
      durationDays: 30,
      daysWithMeals: 30,
      mealsCount: 120,
      isCompatible: false,
      blockingReasons: [{ type: "disliked_food", foodId: 12 }],
      appliedTargetCalories: 2400,
      days: [{ dayNumber: 1, meals: [] }],
    });

    expect(template).toMatchObject({
      id: "template-30",
      title: "30 kunlik balans",
      durationDays: 30,
      days: [{ dayNumber: 1, meals: [] }],
      daysWithMeals: 30,
      mealsCount: 120,
      isCompatible: false,
      blockingReasons: [{ type: "disliked_food", foodId: 12 }],
      appliedTargetCalories: 2400,
    });
    expect(template).not.toHaveProperty("weeklyKanban");
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
        durationDays: 30,
        mealsCount: 120,
        days: [],
      },
    ]);
    expect(library.goals).toEqual([{ value: "maintenance", label: "Balans" }]);
    expect(library.meta).toMatchObject({ total: 1 });
  });

  it("preserves sequential days from the template detail response", () => {
    const template = normalizeMealPlanTemplateDetailResponseForTest({
      data: {
        data: {
          id: "template-detail",
          title: "Template detail",
          days: [{ dayNumber: 1, meals: [{ id: "breakfast", items: [] }] }],
        },
      },
    });

    expect(template).toMatchObject({
      id: "template-detail",
      title: "Template detail",
      days: [{ dayNumber: 1, meals: [{ id: "breakfast", items: [] }] }],
    });
    expect(template).not.toHaveProperty("weeklyKanban");
  });

  it("uses Uzbek admin translations before raw template names for user cards", () => {
    const template = normalizeMealPlanTemplateForTest({
      id: "template-translated",
      name: "Healthy lifestyle",
      description: "A starter admin template.",
      translations: [
        {
          language: "uz",
          name: "Sog'lom turmush",
          description: "Uzbekcha tavsif.",
        },
        {
          language: "ru",
          name: "Здоровый образ жизни",
          description: "Русское описание.",
        },
      ],
    });

    expect(template.title).toBe("Sog'lom turmush");
    expect(template.name).toBe("Sog'lom turmush");
    expect(template.description).toBe("Uzbekcha tavsif.");
  });
});

describe("meal plan budget normalization", () => {
  it("preserves plan budget targets and shopping-list adherence summaries", () => {
    expect(
      normalizeMealPlanForTest({
        id: "plan-1",
        name: "Byudjetli reja",
        days: [],
        budgetTarget: {
          amount: 350000,
          period: "weekly",
          currency: "UZS",
          targetCost: 350000,
        },
      }),
    ).toMatchObject({
      id: "plan-1",
      budgetTarget: {
        amount: 350000,
        period: "weekly",
        currency: "UZS",
        targetCost: 350000,
      },
    });

    expect(
      normalizeMealPlanShoppingList({
        id: "shopping-list-1",
        totals: { estimatedCost: 400000, currency: "UZS" },
        budget: {
          amount: 350000,
          period: "weekly",
          currency: "UZS",
          targetCost: 350000,
          estimatedCost: 400000,
          difference: 50000,
          usagePercent: 114,
          status: "over_budget",
        },
        familyBudget: {
          groupId: "family-1",
          name: "Karimovlar oilasi",
          memberCount: 3,
          maxMembers: 4,
          perPersonEstimatedCost: 400000,
          familyEstimatedCost: 1200000,
          perPersonTargetCost: 350000,
          familyTargetCost: 1050000,
          familyDifference: 150000,
          familyUsagePercent: 114,
          status: "over_budget",
          currency: "UZS",
        },
      }),
    ).toMatchObject({
      budget: {
        targetCost: 350000,
        estimatedCost: 400000,
        difference: 50000,
        usagePercent: 114,
        status: "over_budget",
      },
      familyBudget: {
        groupId: "family-1",
        memberCount: 3,
        familyEstimatedCost: 1200000,
        familyTargetCost: 1050000,
        familyDifference: 150000,
        status: "over_budget",
      },
    });
  });
});

describe("meal plan payload normalization", () => {
  it("sends sequential days instead of weeklyKanban", () => {
    const payload = buildMealPlanPayloadForTest({
      name: "Ketma-ket reja",
      days: [
        {
          dayNumber: 1,
          meals: [{ id: "breakfast", type: "Nonushta", items: [] }],
        },
      ],
      weeklyKanban: {
        "day-1": [{ id: "legacy", type: "Legacy", items: [] }],
      },
      durationDays: 1,
      source: "manual",
    });

    expect(payload).toMatchObject({
      name: "Ketma-ket reja",
      durationDays: 1,
      source: "manual",
      days: [
        {
          dayNumber: 1,
          dayKey: "day-1",
          meals: [{ id: "breakfast", type: "Nonushta", items: [] }],
        },
      ],
    });
    expect(payload).not.toHaveProperty("weeklyKanban");
  });
});
