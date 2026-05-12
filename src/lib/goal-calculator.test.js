import { describe, expect, it } from "vitest";
import { calculateGoals, normalizeGoal } from "./goal-calculator";

describe("goal-calculator", () => {
  const baseInput = {
    gender: "male",
    age: 30,
    heightValue: 180,
    currentWeightValue: 90,
    activityLevel: "moderately-active",
    weeklyPace: 0.5,
  };

  it("normalizes onboarding goal aliases", () => {
    expect(normalizeGoal("lose_weight")).toBe("lose");
    expect(normalizeGoal("gain muscle")).toBe("gain");
    expect(normalizeGoal("maintain")).toBe("maintain");
  });

  it("adjusts water and steps by user goal", () => {
    const lose = calculateGoals({ ...baseInput, goal: "lose" });
    const maintain = calculateGoals({ ...baseInput, goal: "maintain" });
    const gain = calculateGoals({ ...baseInput, goal: "gain" });

    expect(lose.waterMl).toBeGreaterThan(maintain.waterMl);
    expect(gain.waterMl).toBeGreaterThan(maintain.waterMl);
    expect(lose.steps).toBeGreaterThan(maintain.steps);
    expect(gain.steps).toBeLessThan(maintain.steps);
  });

  it("matches backend formula-first calorie and macro targets", () => {
    const result = calculateGoals({ ...baseInput, goal: "lose" });

    expect(result).toEqual(
      expect.objectContaining({
        calories: 2364,
        protein: 180,
        carbs: 263,
        fat: 66,
      }),
    );
  });

  it("uses backend goal-specific protein multipliers", () => {
    const maintain = calculateGoals({ ...baseInput, goal: "maintain" });
    const gain = calculateGoals({ ...baseInput, goal: "gain" });

    expect(maintain.protein).toBe(144);
    expect(gain.protein).toBe(162);
  });
});
