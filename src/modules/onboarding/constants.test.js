import { describe, expect, it } from "vitest";
import {
  ONBOARDING_STEPS,
  getNextStep,
  getPrevStep,
  normalizeUserOnboardingStep,
} from "./constants";

describe("user onboarding step order", () => {
  it("keeps only nutrition safety before review", () => {
    expect(getNextStep("gender")).toBe("age");
    expect(getNextStep("goal")).toBe("target-weight");
    expect(getNextStep("weekly-pace")).toBe("other-goals");
    expect(getNextStep("activity-level")).toBe("meal-frequency");
    expect(getNextStep("meal-frequency")).toBe("diet-requirements");
    expect(getNextStep("diet-requirements")).toBe("health-constraints");
    expect(getNextStep("health-constraints")).toBe("review");
    expect(ONBOARDING_STEPS).not.toContain("allergies");
    expect(normalizeUserOnboardingStep("allergies")).toBe("diet-requirements");
  });

  it("keeps back navigation aligned with the reordered flow", () => {
    expect(getPrevStep("other-goals")).toBe("weekly-pace");
    expect(getPrevStep("meal-frequency")).toBe("activity-level");
    expect(getPrevStep("diet-requirements")).toBe("meal-frequency");
    expect(getPrevStep("health-constraints")).toBe("diet-requirements");
    expect(getPrevStep("review")).toBe("health-constraints");
  });
});
