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

  it("resumes to weekly workout count when activity is present but workout count is missing", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeUntilActivity,
        activityLevel: "moderately-active",
      }),
    ).toBe("weekly-workout-count");
  });

  it("resumes to workout experience when weekly workout count is present", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeUntilActivity,
        activityLevel: "moderately-active",
        weeklyWorkoutCount: "4",
      }),
    ).toBe("workout-experience");
  });

  it("resumes to injury severity when health constraints need details", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeUntilActivity,
        healthConstraints: ["knee_pain"],
      }),
    ).toBe("injury-severity");
  });

  it("skips optional health text screens and resumes to age after injury severity", () => {
    expect(
      getNextUserOnboardingPath({
        firstName: completeUntilActivity.firstName,
        lastName: completeUntilActivity.lastName,
        gender: completeUntilActivity.gender,
        healthConstraints: ["knee_pain"],
        injurySeverity: "mild",
      }),
    ).toBe("age");
  });

  it("resumes to review after optional disliked ingredients are completed", () => {
    expect(
      getNextUserOnboardingPath({
        ...completeUntilActivity,
        activityLevel: "moderately-active",
        weeklyWorkoutCount: "4",
        workoutExperience: "intermediate",
        completedUserOnboardingSteps: [
          "weekly-workout-count",
          "workout-experience",
          "workout-location",
          "workout-equipment",
          "workout-body-parts",
          "preferred-exercises",
          "disliked-exercises",
          "food-budget",
          "allergies",
          "diet-requirements",
          "preferred-cuisines",
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
