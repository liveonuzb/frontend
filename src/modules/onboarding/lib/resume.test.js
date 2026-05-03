import { describe, expect, it } from "vitest";
import { getNextUserOnboardingPath } from "./resume";

const completeUntilActivity = {
  firstName: "Ali",
  lastName: "Valiyev",
  gender: "male",
  healthConstraints: ["none"],
  age: "30",
  height: { value: "180", unit: "cm" },
  currentWeight: { value: "82", unit: "kg" },
  weightGoal: "lose_weight",
  targetWeight: { value: "76", unit: "kg" },
};

describe("user onboarding resume", () => {
  it("resumes to activity-level when activity level is missing", () => {
    expect(getNextUserOnboardingPath(completeUntilActivity)).toBe(
      "activity-level",
    );
  });

  it("resumes to lifestyle when activity is present but lifestyle data is missing", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeUntilActivity,
        activityLevel: "moderately-active",
      }),
    ).toBe("lifestyle");
  });

  it("resumes to review after optional disliked ingredients are completed", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeUntilActivity,
        activityLevel: "moderately-active",
        weeklyWorkoutCount: "4",
        workoutExperience: "intermediate",
        completedUserOnboardingSteps: [
          "lifestyle",
          "workout-location",
          "workout-equipment",
          "workout-body-parts",
          "preferred-exercises",
          "disliked-exercises",
          "food-budget",
          "allergies",
          "diet-requirements",
          "disliked-foods",
          "preferred-ingredients",
          "disliked-ingredients",
        ],
        mealFrequency: "3",
        waterHabits: "6",
      }),
    ).toBe("review");
  });
});
