import { describe, expect, it } from "vitest";
import {
  buildActionItems,
  resolveGoalPreset,
} from "./health-tab.utils.js";

describe("health-tab utils", () => {
  it("prefers onboarding goal when it exists", () => {
    expect(
      resolveGoalPreset({
        hasOnboardingGoal: true,
        onboardingGoalIntent: "gain",
        goals: { calories: 1800, waterMl: 2600, steps: 9000 },
        hasServerGoals: true,
        isDefaultGoalPreset: false,
      }),
    ).toBe("gain");
  });

  it("falls back to lose when onboarding and saved goals are ambiguous", () => {
    expect(
      resolveGoalPreset({
        hasOnboardingGoal: false,
        onboardingGoalIntent: "maintain",
        goals: { calories: 2200, waterMl: 2500, steps: 10000 },
        hasServerGoals: false,
        isDefaultGoalPreset: true,
      }),
    ).toBe("lose");
  });

  it("prioritizes protein first for gain action stack", () => {
    const items = buildActionItems({
      goalPreset: "gain",
      currentNumbers: { calories: 2800, waterMl: 3200, steps: 8000 },
      recommendedGoals: {
        protein: 170,
        workoutMinutes: 60,
        sleepHours: 8,
      },
      healthSummary: {
        avgCalories: 2300,
        avgProtein: 120,
        avgSteps: 7000,
        avgWorkoutMinutes: 35,
        avgSleepHours: 6.8,
      },
      waterSummary: {
        averageMl: 2400,
      },
    });

    expect(items[0]?.id).toBe("protein");
    expect(items.map((item) => item.id)).toEqual([
      "protein",
      "calories",
      "water",
      "sleep",
      "workout",
      "steps",
    ]);
  });
});
