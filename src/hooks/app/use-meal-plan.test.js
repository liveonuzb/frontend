import { describe, expect, it } from "vitest";
import {
  buildMealPlanPayloadForTest,
  mealPlanDaysToKanbanForTest,
  normalizeMealPlanForTest,
  normalizeMealPlanDaysForTest,
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

describe("meal plan day normalization", () => {
  it("canonicalizes sparse day keys and sorts days without trusting malformed keys", () => {
    expect(
      normalizeMealPlanDaysForTest([
        { dayKey: " day-3 ", meals: [{ id: "day-3-breakfast" }] },
        { dayNumber: "2.9", columns: [{ id: "day-2-lunch" }] },
        { dayKey: "bad-key", dayNumber: "-7", meals: "bad" },
        null,
      ]),
    ).toEqual([
      { dayNumber: 1, dayKey: "day-1", meals: [] },
      { dayNumber: 2, dayKey: "day-2", meals: [{ id: "day-2-lunch" }] },
      {
        dayNumber: 3,
        dayKey: "day-3",
        meals: [{ id: "day-3-breakfast" }],
      },
      { dayNumber: 4, dayKey: "day-4", meals: [] },
    ]);

    expect(
      mealPlanDaysToKanbanForTest({
        "day-2": [{ id: "day-2-dinner" }],
        invalid: [{ id: "fallback-day" }],
      }),
    ).toEqual({
      "day-1": [{ id: "fallback-day" }],
      "day-2": [{ id: "day-2-dinner" }],
    });
  });
});

describe("meal plan shopping list normalization", () => {
  it("filters malformed rows and clamps shopping list numeric fields", () => {
    const list = normalizeMealPlanShoppingList({
      durationDays: "7.9",
      priceContext: { currency: "UZS" },
      items: [
        {
          name: "Guruch",
          grams: "-250",
          pricePer100g: "bad",
          estimatedCost: "-100",
          sources: [null, { foodId: 1, foodName: "Osh" }],
          isChecked: "true",
        },
        null,
      ],
      unmatchedFoods: [null, { foodId: 99, foodName: "Unknown recipe" }],
      totals: {
        estimatedCost: "-1",
        knownItems: "2.8",
        unknownItems: "bad",
      },
      budget: {
        amount: "-300000",
        period: "weekly",
        targetCost: "bad",
      },
      familyBudget: {
        groupId: "family-1",
        memberCount: "-1",
      },
    });

    expect(list.durationDays).toBe(7);
    expect(list.items).toEqual([
      expect.objectContaining({
        name: "Guruch",
        grams: 0,
        pricePer100g: null,
        estimatedCost: 0,
        isChecked: true,
        sources: [{ foodId: 1, foodName: "Osh" }],
      }),
    ]);
    expect(list.unmatchedFoods).toEqual([
      { foodId: 99, foodName: "Unknown recipe" },
    ]);
    expect(list.totals).toEqual({
      estimatedCost: 0,
      knownItems: 3,
      unknownItems: 0,
      currency: "UZS",
    });
    expect(list.budget).toBeNull();
    expect(list.familyBudget).toBeNull();
  });
});
