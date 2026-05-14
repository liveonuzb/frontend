import { describe, expect, it } from "vitest";
import { isMeaningfulUserDraftData } from "./user-draft-data";

describe("isMeaningfulUserDraftData", () => {
  it("treats empty/default user drafts as not meaningful", () => {
    expect(
      isMeaningfulUserDraftData({
        firstName: "",
        gender: "",
        weeklyPace: 0.5,
        budgetPeriod: "weekly",
        budgetCurrency: "UZS",
        workoutLocation: "home",
        height: { value: "", unit: "cm" },
        currentWeight: { value: "", unit: "kg" },
        goals: [],
      }),
    ).toBe(false);
  });

  it("detects persisted onboarding answers as meaningful", () => {
    expect(
      isMeaningfulUserDraftData({
        firstName: "Berlin",
        gender: "male",
        age: 33,
        height: { value: 173, unit: "cm" },
      }),
    ).toBe(true);
  });

  it("does not count store metadata as onboarding data", () => {
    expect(
      isMeaningfulUserDraftData({
        draftSaveStatus: "saved",
        lastVisitedPath: "review",
      }),
    ).toBe(false);
  });

  it("ignores removed meal and workout plan draft fields", () => {
    expect(
      isMeaningfulUserDraftData({
        weeklyWorkoutCount: 4,
        workoutExperience: "advanced",
        foodBudgetTier: "high",
        preferredCuisineIds: ["uzbek"],
        dislikedFoodIds: ["burger"],
        preferredIngredientIds: ["rice"],
        workoutLocation: "gym",
      }),
    ).toBe(false);
  });
});
