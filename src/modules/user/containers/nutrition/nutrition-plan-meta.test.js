import { describe, expect, it } from "vitest";
import {
  buildPlanMetaBudgetPayload,
  getPlanBudgetFormDefaults,
  getPlanRescaleExplanation,
} from "./nutrition-plan-meta.js";

describe("nutrition plan meta helpers", () => {
  it("builds budget payload for manual plan create/edit flows", () => {
    expect(
      buildPlanMetaBudgetPayload({
        amount: "350000",
        period: "weekly",
        currency: "UZS",
        mode: "create",
      }),
    ).toEqual({
      budgetAmount: 350000,
      budgetPeriod: "weekly",
      budgetCurrency: "UZS",
    });

    expect(
      buildPlanMetaBudgetPayload({
        amount: "",
        period: "monthly",
        currency: "UZS",
        mode: "create",
      }),
    ).toEqual({});

    expect(
      buildPlanMetaBudgetPayload({
        amount: "",
        period: "daily",
        currency: "UZS",
        mode: "edit",
      }),
    ).toEqual({
      budgetAmount: 0,
      budgetPeriod: "daily",
      budgetCurrency: "UZS",
    });
  });

  it("prefills budget form state from an existing plan target", () => {
    expect(
      getPlanBudgetFormDefaults({
        budgetTarget: {
          amount: 120000,
          period: "daily",
          currency: "UZS",
        },
      }),
    ).toEqual({
      amount: "120000",
      period: "daily",
      currency: "UZS",
    });
  });

  it("formats plan calorie rescale explanations for success toasts", () => {
    expect(
      getPlanRescaleExplanation({
        rescaleSummary: {
          oldTargetCalories: 1900,
          newTargetCalories: 2400,
          averageFactor: 1.27,
          affectedMeals: 3,
          cannotRescaleReasons: [],
        },
      }),
    ).toBe("1 900 -> 2 400 kcal, faktor 1.27x, 3 ta meal o'zgardi");

    expect(
      getPlanRescaleExplanation({
        rescaleSummary: {
          newTargetCalories: 2100,
          cannotRescaleReasons: ["zero-calorie day"],
        },
      }),
    ).toBe("2 100 kcal target, moslanmagan: zero-calorie day");
  });
});
