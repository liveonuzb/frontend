import { describe, expect, it } from "vitest";
import { getNextStep, getPrevStep } from "./constants";

describe("user onboarding step order", () => {
  it("places other goals after weekly pace and nutrition before workout", () => {
    expect(getNextStep("gender")).toBe("age");
    expect(getNextStep("goal")).toBe("target-weight");
    expect(getNextStep("weekly-pace")).toBe("other-goals");
    expect(getNextStep("activity-level")).toBe("meal-frequency");
    expect(getNextStep("disliked-ingredients")).toBe("health-constraints");
    expect(getNextStep("health-constraints")).toBe("weekly-workout-count");
    expect(getNextStep("workout-experience")).toBe("workout-location");
    expect(getNextStep("workout-body-parts")).toBe("review");
  });

  it("keeps back navigation aligned with the reordered flow", () => {
    expect(getPrevStep("other-goals")).toBe("weekly-pace");
    expect(getPrevStep("meal-frequency")).toBe("activity-level");
    expect(getPrevStep("health-constraints")).toBe("disliked-ingredients");
    expect(getPrevStep("weekly-workout-count")).toBe("health-constraints");
    expect(getPrevStep("workout-location")).toBe("workout-experience");
  });
});
