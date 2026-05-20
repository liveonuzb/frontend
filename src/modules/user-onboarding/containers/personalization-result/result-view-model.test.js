import { describe, expect, it } from "vitest";
import { get, reduce, replace, toPairs } from "lodash";
import uzLocale from "../../lib/locales/uz.json";
import { buildMetabolismResultViewModel } from "./result-view-model.js";

const t = (key, options = {}) => {
  const template = get(uzLocale, key, key);

  return reduce(
    toPairs(options),
    (result, [optionKey, value]) =>
      replace(result, new RegExp(`{{${optionKey}}}`, "g"), String(value)),
    template,
  );
};

const sampleResult = {
  dailyCalories: 2364,
  carbsGram: 263,
  proteinGram: 180,
  fatGram: 66,
  recommendedWaterMl: 4000,
  weightToChange: -10,
  weeklyWeightChangeGoal: 0.5,
  targetWeight: 80,
  bmr: 1880,
  tdee: 2914,
  bmi: 28,
  dailyStepsTarget: 12000,
  metabolicAge: 35,
  estimatedGoalDate: "2026-09-28T00:00:00.000Z",
  mealsPerDay: 3,
  weeklyWorkoutDays: 4,
  explanation:
    "Ozish maqsadi uchun kaloriya defitsiti, oqsil miqdori, faollik darajasi va haftalik sur'at hozirgi vazningiz asosida moslandi.",
  calculationReport: {
    formula: { bmr: "mifflin_st_jeor", version: "v1" },
    activity: { multiplier: 1.55, bmr: 1880, tdee: 2914 },
    calories: {
      goalAdjustment: -550,
      final: 2364,
      floorApplied: false,
      capApplied: false,
    },
    macros: {
      protein: { grams: 180, calories: 720, percent: 30.5 },
      carbs: { grams: 263, calories: 1052, percent: 44.5 },
      fat: { grams: 66, calories: 594, percent: 25.1 },
      totalCalories: 2366,
      calorieDelta: 2,
    },
    confidence: { level: "standard", reasons: [] },
    warnings: [],
  },
};

const sampleOnboarding = {
  currentWeight: { value: 90, unit: "kg" },
  targetWeight: { value: 80, unit: "kg" },
  goal: "lose",
  activityLevel: "moderately-active",
  foodBudgetTier: "medium",
};

describe("buildMetabolismResultViewModel", () => {
  it("maps API result data into the premium mobile display model", () => {
    const model = buildMetabolismResultViewModel(
      sampleResult,
      sampleOnboarding,
      t,
    );

    expect(model.dailyCalories).toBe("2,364");
    expect(model.currentWeight).toBe("90 kg");
    expect(model.targetWeight).toBe("80 kg");
    expect(model.weightDiff).toBe("-10 kg");
    expect(model.weeklyPace).toBe("0.5 kg/hafta");
    expect(model.bmr).toBe("1,880 kcal");
    expect(model.activityMultiplier).toBe("x1.55");
    expect(model.activityLabel).toBe("O'rtacha faol");
    expect(model.tdee).toBe("2,914 kcal");
    expect(model.goalAdjustment).toBe("-550 kcal");
    expect(model.waterLiters).toBe("4 L");
    expect(model.steps).toBe("12,000");
    expect(model.bmi).toBe("28");
    expect(model.metabolicAge).toBe("35 yosh");
    expect(model.targetDate).toBe("2026 M09 28");
    expect(model).not.toHaveProperty("meals");
    expect(model).not.toHaveProperty("workouts");
    expect(model).not.toHaveProperty("budget");
    expect(model).not.toHaveProperty("macroDelta");
  });

  it("uses report macro kcal and percent values without drifting from API output", () => {
    const model = buildMetabolismResultViewModel(
      sampleResult,
      sampleOnboarding,
      t,
    );

    expect(model.macros.protein).toMatchObject({
      label: "Oqsil",
      grams: "180 g",
      kcal: "720 kcal",
      percent: "30.5%",
      progress: 30.5,
    });
    expect(model.macros.carbs).toMatchObject({
      label: "Uglevod",
      grams: "263 g",
      kcal: "1,052 kcal",
      percent: "44.5%",
      progress: 44.5,
    });
    expect(model.macros.fat).toMatchObject({
      label: "Yog'",
      grams: "66 g",
      kcal: "594 kcal",
      percent: "25.1%",
      progress: 25.1,
    });
  });

  it("keeps optional missing metrics explicit instead of inventing fake values", () => {
    const model = buildMetabolismResultViewModel(
      {
        dailyCalories: 1900,
        proteinGram: 120,
        carbsGram: 180,
        fatGram: 55,
      },
      {},
      t,
    );

    expect(model.bmr).toBe("-");
    expect(model.tdee).toBe("-");
    expect(model.steps).toBe("-");
    expect(model.metabolicAge).toBe("-");
    expect(model.targetDate).toBe("-");
    expect(model.activityMultiplier).toBe("-");
  });

  it("humanizes calculation warning keys for display chips", () => {
    const model = buildMetabolismResultViewModel(
      {
        ...sampleResult,
        calculationReport: {
          ...sampleResult.calculationReport,
          warnings: ["metabolicAgeIsEstimatedIndicator"],
        },
      },
      sampleOnboarding,
      t,
    );

    expect(model.warningPills).toContain("Metabolik yosh taxminiy");
    expect(model.warningPills).not.toContain("metabolicAgeIsEstimatedIndicator");
  });
});
