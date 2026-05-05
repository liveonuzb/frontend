import { describe, expect, it } from "vitest";
import { getNextUserOnboardingPath } from "./resume";

const completeProfile = {
  firstName: "Ali",
  lastName: "Valiyev",
  gender: "male",
  age: "30",
  height: { value: "180", unit: "cm" },
  currentWeight: { value: "82", unit: "kg" },
  weightGoal: "lose_weight",
  targetWeight: { value: "76", unit: "kg" },
};

const completeGoals = {
  ...completeProfile,
  weeklyPace: 0.5,
  completedUserOnboardingSteps: ["other-goals"],
  activityLevel: "moderately-active",
};

const completeNutrition = {
  ...completeGoals,
  mealFrequency: "3",
  completedUserOnboardingSteps: [
    "other-goals",
    "food-budget",
    "allergies",
    "diet-requirements",
    "preferred-cuisines",
    "disliked-foods",
    "preferred-ingredients",
    "disliked-ingredients",
  ],
};

describe("user onboarding resume", () => {
  it("resumes to weekly pace after target weight", () => {
    expect(getNextUserOnboardingPath(completeProfile)).toBe("weekly-pace");
  });

  it("resumes to other goals after weekly pace until the optional step is completed", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeProfile,
        weeklyPace: 0.5,
      }),
    ).toBe("other-goals");
  });

  it("resumes to meal frequency after activity level because nutrition comes before workout", () => {
    expect(getNextUserOnboardingPath(completeGoals)).toBe("meal-frequency");
  });

  it("resumes through the nutrition preference block before health constraints", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeGoals,
        mealFrequency: "3",
        completedUserOnboardingSteps: ["other-goals", "food-budget"],
      }),
    ).toBe("allergies");
  });

  it("resumes to health constraints after disliked ingredients are completed", () => {
    expect(getNextUserOnboardingPath(completeNutrition)).toBe(
      "health-constraints",
    );
  });

  it("resumes to weekly workout count after health constraints are skipped", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeNutrition,
        healthConstraints: ["none"],
        completedUserOnboardingSteps: [
          ...completeNutrition.completedUserOnboardingSteps,
          "health-constraints",
        ],
      }),
    ).toBe("weekly-workout-count");
  });

  it("resumes to workout experience when weekly workout count is present", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeNutrition,
        healthConstraints: ["none"],
        completedUserOnboardingSteps: [
          ...completeNutrition.completedUserOnboardingSteps,
          "health-constraints",
        ],
        weeklyWorkoutCount: "4",
      }),
    ).toBe("workout-experience");
  });

  it("resumes to workout location after workout experience", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeNutrition,
        healthConstraints: ["none"],
        completedUserOnboardingSteps: [
          ...completeNutrition.completedUserOnboardingSteps,
          "health-constraints",
          "weekly-workout-count",
          "workout-experience",
        ],
        weeklyWorkoutCount: "4",
        workoutExperience: "intermediate",
      }),
    ).toBe("workout-location");
  });

  it("resumes to review after workout body parts are completed", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeNutrition,
        healthConstraints: ["none"],
        completedUserOnboardingSteps: [
          ...completeNutrition.completedUserOnboardingSteps,
          "health-constraints",
          "weekly-workout-count",
          "workout-experience",
          "workout-location",
          "workout-equipment",
          "workout-body-parts",
        ],
        weeklyWorkoutCount: "4",
        workoutExperience: "intermediate",
      }),
    ).toBe("review");
  });
});
