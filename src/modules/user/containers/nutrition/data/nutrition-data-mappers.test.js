import { describe, expect, it } from "vitest";
import { buildNutritionDashboardMetrics } from "./nutrition-data-mappers.js";

describe("buildNutritionDashboardMetrics", () => {
  it("does not return a hardcoded streak metric", () => {
    const metrics = buildNutritionDashboardMetrics({
      roundedTotals: {},
      goals: {},
      waterConsumedMl: 0,
      waterGoalMl: 0,
    });

    expect(metrics).not.toHaveProperty("streakDays");
  });
});
