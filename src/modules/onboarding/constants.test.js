import { describe, expect, it } from "vitest";
import { getNextStep, getPrevStep } from "./constants";

describe("user onboarding step order", () => {
  it("keeps only nutrition safety before review", () => {
    expect(getNextStep("gender")).toBe("age");
    expect(getNextStep("goal")).toBe("target-weight");
    expect(getNextStep("weekly-pace")).toBe("other-goals");
    expect(getNextStep("activity-level")).toBe("meal-frequency");
    expect(getNextStep("meal-frequency")).toBe("allergies");
    expect(getNextStep("allergies")).toBe("diet-requirements");
    expect(getNextStep("diet-requirements")).toBe("health-constraints");
    expect(getNextStep("health-constraints")).toBe("review");
  });

  it("keeps back navigation aligned with the reordered flow", () => {
    expect(getPrevStep("other-goals")).toBe("weekly-pace");
    expect(getPrevStep("meal-frequency")).toBe("activity-level");
    expect(getPrevStep("allergies")).toBe("meal-frequency");
    expect(getPrevStep("diet-requirements")).toBe("allergies");
    expect(getPrevStep("health-constraints")).toBe("diet-requirements");
    expect(getPrevStep("review")).toBe("health-constraints");
  });
});
