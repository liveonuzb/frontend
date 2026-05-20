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
  activityLevel: "moderately-active",
};

const completeNutrition = {
  ...completeGoals,
  mealFrequency: "3",
  completedUserOnboardingSteps: ["diet-requirements"],
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

  it("resumes to activity level after weekly pace", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeProfile,
        weeklyPace: 0.5,
      }),
    ).toBe("activity-level");
  });

  it("resumes to meal frequency after activity level", () => {
    expect(getNextUserOnboardingPath(completeGoals)).toBe("meal-frequency");
  });

  it("resumes to diet requirements after meal frequency", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeGoals,
        mealFrequency: "3",
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

  it("ignores removed last visited steps before resuming", () => {
    expect(
      getResumeOnboardingPath(
        {
          ...completeGoals,
          lastVisitedPath: "food-budget",
        },
        false,
      ),
    ).toBe("meal-frequency");

    expect(
      getResumeOnboardingPath(
        {
          ...completeNutrition,
          lastVisitedPath: "allergies",
        },
        false,
      ),
    ).toBe("health-constraints");

    expect(
      getResumeOnboardingPath(
        {
          ...completeNutrition,
          lastVisitedPath: "workout-location",
        },
        false,
      ),
    ).toBe("health-constraints");
  });
});
