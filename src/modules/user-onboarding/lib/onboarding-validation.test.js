import { describe, expect, it } from "vitest";
import {
  getTargetWeightValidationError,
  isNoWorkoutPlan,
} from "./onboarding-validation.js";

describe("onboarding validation helpers", () => {
  it("rejects a weight loss target that is not below current weight", () => {
    expect(
      getTargetWeightValidationError({
        goal: "lose",
        currentWeight: { value: "70", unit: "kg" },
        targetWeight: { value: "70", unit: "kg" },
        t: (key) => key,
      }),
    ).toBe("onboarding.targetWeight.errors.loseDirection");
  });

  it("rejects a weight gain target that is not above current weight", () => {
    expect(
      getTargetWeightValidationError({
        goal: "gain",
        currentWeight: { value: "70", unit: "kg" },
        targetWeight: { value: "69", unit: "kg" },
        t: (key) => key,
      }),
    ).toBe("onboarding.targetWeight.errors.gainDirection");
  });

  it("allows equal target weight for maintenance", () => {
    expect(
      getTargetWeightValidationError({
        goal: "maintain",
        currentWeight: { value: "70", unit: "kg" },
        targetWeight: { value: "70", unit: "kg" },
        t: (key) => key,
      }),
    ).toBeNull();
  });

  it("detects no-workout onboarding plans", () => {
    expect(isNoWorkoutPlan("0")).toBe(true);
    expect(isNoWorkoutPlan(0)).toBe(true);
    expect(isNoWorkoutPlan("4")).toBe(false);
  });
});
