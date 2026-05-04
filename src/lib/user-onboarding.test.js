import { describe, expect, it } from "vitest";
import {
  normalizeCustomTextArray,
  normalizeExercisePreferencePair,
  normalizeIngredientPreferencePair,
  normalizeUserOnboarding,
  toUserOnboardingPayload,
} from "./user-onboarding";

describe("user onboarding payload", () => {
  it("maps new food preference fields to the backend payload", () => {
    expect(
      toUserOnboardingPayload({
        foodBudget: "250000",
        budgetPeriod: "weekly",
        budgetCurrency: "UZS",
        weeklyWorkoutCount: "4",
        workoutExperience: "intermediate",
        sleepHours: "7.5",
        workType: "mixed",
        fastFoodFrequency: "weekly",
        sweetDrinkHabit: "rarely",
        cookingTime: "15-30",
        cookingAccess: "home-cooking",
        workoutLocation: "gym",
        equipmentIds: ["7", 7, "bad"],
        customEquipment: [" Kettlebell ", "kettlebell"],
        workoutBodyPartIds: ["5", 5],
        customWorkoutBodyParts: [" Lower body ", "lower body"],
        preferredExerciseIds: ["8"],
        dislikedExerciseIds: ["9"],
        customPreferredExercises: [" Burpee "],
        customDislikedExercises: [" Jump squat "],
        allergyIds: ["1", 1, "bad"],
        customAllergies: [" Peanut ", "peanut", ""],
        dietRequirementIds: ["2"],
        customDietRequirements: ["No pork", " no pork "],
        preferredCuisineIds: ["6", 6, "bad"],
        customPreferredCuisines: [" Uzbek ", "uzbek"],
        dislikedFoodIds: ["3"],
        customDislikedFoods: [" Liver "],
        preferredIngredientIds: ["12"],
        customPreferredIngredients: [" Tomato "],
        dislikedIngredientIds: ["4"],
        customDislikedIngredients: [" Cilantro "],
        injurySeverity: "mild",
        forbiddenExercises: [" Heavy squat ", "heavy squat"],
        medications: "Ibuprofen",
        supplements: "Creatine",
        playsFootball: true,
        cardioLevel: "medium",
        notificationPreference: "morning",
      }),
    ).toEqual(
      expect.objectContaining({
        foodBudget: 250000,
        budgetPeriod: "weekly",
        budgetCurrency: "UZS",
        weeklyWorkoutCount: 4,
        workoutExperience: "intermediate",
        sleepHours: 7.5,
        workType: "mixed",
        fastFoodFrequency: "weekly",
        sweetDrinkHabit: "rarely",
        cookingTime: "15-30",
        cookingAccess: "home-cooking",
        workoutLocation: "gym",
        equipmentIds: [7],
        customEquipment: ["Kettlebell"],
        workoutBodyPartIds: [5],
        customWorkoutBodyParts: ["Lower body"],
        preferredExerciseIds: [8],
        dislikedExerciseIds: [9],
        customPreferredExercises: ["Burpee"],
        customDislikedExercises: ["Jump squat"],
        allergyIds: [1],
        allergyIngredientIds: [1],
        customAllergies: ["Peanut"],
        dietRequirementIds: [2],
        customDietRequirements: ["No pork"],
        preferredCuisineIds: [6],
        customPreferredCuisines: ["Uzbek"],
        dislikedFoodIds: [3],
        customDislikedFoods: ["Liver"],
        preferredIngredientIds: [12],
        customPreferredIngredients: ["Tomato"],
        dislikedIngredientIds: [4],
        customDislikedIngredients: ["Cilantro"],
        injurySeverity: "mild",
        forbiddenExercises: ["Heavy squat"],
        medications: "Ibuprofen",
        supplements: "Creatine",
        playsFootball: true,
        cardioLevel: "medium",
        notificationPreference: "morning",
      }),
    );
  });

  it("dedupes custom chip labels case-insensitively", () => {
    expect(normalizeCustomTextArray([" halal ", "Halal", "no sugar"])).toEqual([
      "halal",
      "no sugar",
    ]);
  });

  it("removes disliked exercise conflicts when normalizing preferences", () => {
    expect(
      normalizeExercisePreferencePair({
        preferredExerciseIds: [1, "2"],
        dislikedExerciseIds: [2, 3],
        customPreferredExercises: [" Push up "],
        customDislikedExercises: ["push up", "Burpee"],
      }),
    ).toEqual({
      preferredExerciseIds: [1, 2],
      dislikedExerciseIds: [3],
      customPreferredExercises: ["Push up"],
      customDislikedExercises: ["Burpee"],
    });
  });

  it("removes disliked ingredient conflicts when normalizing preferences", () => {
    expect(
      normalizeIngredientPreferencePair({
        preferredIngredientIds: [1, "2"],
        dislikedIngredientIds: [2, 3],
        customPreferredIngredients: [" Tomato "],
        customDislikedIngredients: ["tomato", "Cilantro"],
      }),
    ).toEqual({
      preferredIngredientIds: [1, 2],
      dislikedIngredientIds: [3],
      customPreferredIngredients: ["Tomato"],
      customDislikedIngredients: ["Cilantro"],
    });
  });

  it("normalizes restored onboarding exercise conflicts from disliked side", () => {
    const normalized = normalizeUserOnboarding({
      preferredExerciseIds: [10],
      dislikedExerciseIds: [10, 11],
      customPreferredExercises: ["Row"],
      customDislikedExercises: ["row", "Sprint"],
      preferredIngredientIds: [20],
      dislikedIngredientIds: [20, 21],
      customPreferredIngredients: ["Tomato"],
      customDislikedIngredients: ["tomato", "Onion"],
    });

    expect(normalized).toEqual(
      expect.objectContaining({
        preferredExerciseIds: [10],
        dislikedExerciseIds: [11],
        customPreferredExercises: ["Row"],
        customDislikedExercises: ["Sprint"],
        preferredIngredientIds: [20],
        dislikedIngredientIds: [21],
        customPreferredIngredients: ["Tomato"],
        customDislikedIngredients: ["Onion"],
      }),
    );
  });
});
