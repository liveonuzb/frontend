import { describe, expect, it } from "vitest";
import { getNextStep, getPrevStep } from "./constants";

describe("user onboarding step order", () => {
  it("places health constraints after workout experience", () => {
    expect(getNextStep("gender")).toBe("age");
    expect(getNextStep("workout-experience")).toBe("health-constraints");
    expect(getNextStep("health-constraints")).toBe("workout-location");
  });

  it("keeps back navigation aligned with the new health constraints position", () => {
    expect(getPrevStep("health-constraints")).toBe("workout-experience");
    expect(getPrevStep("workout-location")).toBe("health-constraints");
  });
});
