import { describe, expect, it, vi } from "vitest";
import {
  buildOnboardingPreferencePatch,
  buildOnboardingSyncPatch,
  buildPersonalizationPatch,
  clampProgress,
  formatWeightDelta,
  getMacroBalanceMessage,
  normalizeCustomEquipment,
  normalizeEquipmentIds,
  splitTextList,
} from "./personalization";

describe("post-onboarding personalization helpers", () => {
  it("normalizes equipment ids and custom equipment for patch payloads", () => {
    expect(
      buildPersonalizationPatch("equipment", {
        equipmentIds: ["1", 1, "bad", 2, 0],
        customEquipment: [" Gantel ", "gantel", "", "Yoga mat"],
      }),
    ).toEqual({
      equipmentIds: [1, 2],
      customEquipment: ["Gantel", "Yoga mat"],
    });
  });

  it("keeps numeric edit payloads numeric and ignores blank values", () => {
    expect(buildPersonalizationPatch("dailyCalories", "2100")).toEqual({
      dailyCalories: 2100,
    });
    expect(buildPersonalizationPatch("dailyCalories", "")).toEqual({});
    expect(buildPersonalizationPatch("workoutLocation", "gym")).toEqual({
      workoutLocation: "gym",
    });
  });

  it("dedupes equipment values case-insensitively", () => {
    expect(normalizeEquipmentIds(["3", 3, "4", -1])).toEqual([3, 4]);
    expect(normalizeCustomEquipment([" Bands ", "bands", " Mat "])).toEqual([
      "Bands",
      "Mat",
    ]);
  });

  it("builds onboarding preference patches for post-onboarding edits", () => {
    expect(
      buildOnboardingPreferencePatch("currentWeight", "82", {
        currentWeight: { unit: "kg" },
      }),
    ).toEqual({ currentWeight: { value: 82, unit: "kg" } });
    expect(buildOnboardingPreferencePatch("foodBudget", "350000")).toEqual({
      foodBudget: 350000,
      budgetPeriod: "weekly",
      budgetCurrency: "UZS",
    });
    expect(
      buildOnboardingPreferencePatch(
        "forbiddenExercises",
        "heavy squat, jump\nHeavy squat",
      ),
    ).toEqual({ forbiddenExercises: ["heavy squat", "jump"] });
    expect(
      buildOnboardingPreferencePatch("allergies", {
        ids: ["1", 1, "bad", 2],
        customItems: [" Peanut ", "peanut"],
      }),
    ).toEqual({
      allergyIds: [1, 2],
      allergyIngredientIds: [1, 2],
      customAllergies: ["Peanut"],
    });
    expect(
      buildOnboardingPreferencePatch("dietRequirements", {
        ids: ["3"],
        customItems: ["No pork"],
      }),
    ).toEqual({
      dietRequirementIds: [3],
      customDietRequirements: ["No pork"],
    });
    expect(
      buildOnboardingPreferencePatch("dislikedFoods", {
        ids: ["4"],
        customItems: ["Liver"],
      }),
    ).toEqual({
      dislikedFoodIds: [4],
      customDislikedFoods: ["Liver"],
    });
  });

  it("builds onboarding sync patches for personalization result edits", () => {
    expect(
      buildOnboardingSyncPatch("targetWeight", "76", {
        targetWeight: { unit: "kg" },
      }),
    ).toEqual({ targetWeight: { value: 76, unit: "kg" } });
    expect(buildOnboardingSyncPatch("weeklyWorkoutDays", "4")).toEqual({
      weeklyWorkoutCount: 4,
    });
    expect(buildOnboardingSyncPatch("mealsPerDay", "3")).toEqual({
      mealFrequency: "3",
    });
    expect(
      buildOnboardingSyncPatch("equipment", {
        equipmentIds: ["2", 2],
        customEquipment: [" Band ", "band"],
      }),
    ).toEqual({ equipmentIds: [2], customEquipment: ["Band"] });
  });

  it("splits comma and newline separated text lists", () => {
    expect(splitTextList("Run, Jump\nrun")).toEqual(["Run", "Jump"]);
  });

  it("formats progress, weight deltas, and macro balance messages", () => {
    expect(clampProgress(140)).toBe(100);
    expect(clampProgress(-4)).toBe(0);
    expect(formatWeightDelta(-16.24)).toBe("-16.2 kg");
    expect(formatWeightDelta(5)).toBe("+5 kg");

    const t = vi.fn((key, values) => `${key}:${values?.value ?? ""}`);
    expect(
      getMacroBalanceMessage(
        {
          dailyCalories: 2000,
          proteinGram: 140,
          carbsGram: 200,
          fatGram: 70,
        },
        t,
      ),
    ).toBe("onboarding.postOnboarding.result.balanceGood:");
  });
});
