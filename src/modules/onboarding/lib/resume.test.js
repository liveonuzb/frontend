import { describe, expect, it } from "vitest";
import {
  getNextUserOnboardingPath,
  getResumeOnboardingPath,
} from "./resume";

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
    "allergies",
    "diet-requirements",
  ],
};

describe("user onboarding resume", () => {
  it("does not require last name before resuming past the name step", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeProfile,
        lastName: "",
      }),
    ).toBe("weekly-pace");
  });

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

  it("resumes to meal frequency after activity level", () => {
    expect(getNextUserOnboardingPath(completeGoals)).toBe("meal-frequency");
  });

  it("resumes through nutrition safety before health constraints", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeGoals,
        mealFrequency: "3",
        completedUserOnboardingSteps: ["other-goals"],
      }),
    ).toBe("allergies");
  });

  it("resumes to diet requirements after allergies are completed", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeGoals,
        mealFrequency: "3",
        completedUserOnboardingSteps: ["other-goals", "allergies"],
      }),
    ).toBe("diet-requirements");
  });

  it("resumes to health constraints after diet requirements are completed", () => {
    expect(getNextUserOnboardingPath(completeNutrition)).toBe(
      "health-constraints",
    );
  });

  it("resumes to review after health constraints are skipped", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeNutrition,
        healthConstraints: ["none"],
        completedUserOnboardingSteps: [
          ...completeNutrition.completedUserOnboardingSteps,
          "health-constraints",
        ],
      }),
    ).toBe("review");
  });

  it("normalizes removed last visited steps before resuming", () => {
    expect(
      getResumeOnboardingPath(
        {
          ...completeGoals,
          lastVisitedPath: "food-budget",
        },
        false,
      ),
    ).toBe("allergies");

    expect(
      getResumeOnboardingPath(
        {
          ...completeGoals,
          lastVisitedPath: "workout-location",
        },
        false,
      ),
    ).toBe("health-constraints");
  });
});
