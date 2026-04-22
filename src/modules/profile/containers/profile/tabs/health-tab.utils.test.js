import { describe, expect, it } from "vitest";
import {
  buildActionItems,
  buildRecommendedGoals,
} from "./health-tab.utils.js";

describe("health-tab utils", () => {
  it("recalculates recommendation calories and carbs when selected goal changes", () => {
    const baseGoals = {
      goal: "maintain",
      calories: 2200,
      protein: 150,
      carbs: 250,
      fat: 70,
      fiber: 30,
      waterMl: 2500,
      steps: 10000,
      sleepHours: 8,
      workoutMinutes: 60,
    };
    const recommendationProfile = {
      gender: "male",
      age: 30,
      heightValue: 180,
      currentWeightValue: 90,
      activityLevel: "moderately-active",
    };

    const maintain = buildRecommendedGoals({
      baseGoals,
      recommendationProfile,
      presetId: "maintain",
      intensityId: "medium",
    });
    const gain = buildRecommendedGoals({
      baseGoals,
      recommendationProfile,
      presetId: "gain",
      intensityId: "medium",
    });

    expect(gain.goal).toBe("gain");
    expect(gain.calories).toBeGreaterThan(maintain.calories);
    expect(gain.carbs).toBeGreaterThan(maintain.carbs);
    expect(gain.waterMl).toBeGreaterThanOrEqual(maintain.waterMl);
  });

  it("falls back to preset offsets when onboarding profile is missing", () => {
    const maintain = buildRecommendedGoals({
      baseGoals: {
        goal: "maintain",
        calories: 2200,
        protein: 150,
        carbs: 250,
        fat: 70,
        fiber: 30,
        waterMl: 2500,
        steps: 10000,
        sleepHours: 8,
        workoutMinutes: 60,
      },
      recommendationProfile: {},
      presetId: "lose",
      intensityId: "medium",
    });

    expect(maintain.goal).toBe("lose");
    expect(maintain.calories).toBeLessThan(2200);
    expect(maintain.steps).toBeGreaterThan(10000);
    expect(maintain.protein).toBe(150);
    expect(maintain.fiber).toBe(30);
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
