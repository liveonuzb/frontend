import { describe, expect, it } from "vitest";
import {
  normalizeHealthGoals,
  resolveHealthGoalIntent,
  toHealthGoalsPayload,
} from "./use-health-goals";

describe("use-health-goals helpers", () => {
  it("prefers stored health goal over onboarding goal", () => {
    expect(
      resolveHealthGoalIntent({
        healthGoalGoal: "gain",
        onboardingGoal: "lose",
        goals: { calories: 1800 },
      }),
    ).toBe("gain");
  });

  it("falls back to maintain when goal inputs are ambiguous", () => {
    expect(
      resolveHealthGoalIntent({
        healthGoalGoal: null,
        onboardingGoal: null,
        goals: {},
      }),
    ).toBe("maintain");
  });

  it("includes goal in the normalized payload", () => {
    const normalized = normalizeHealthGoals({
      goal: "gain muscle",
      calories: 2800,
    });
    const payload = toHealthGoalsPayload(normalized);

    expect(normalized.goal).toBe("gain");
    expect(payload.goal).toBe("gain");
    expect(payload.calories).toBe(2800);
  });
});
