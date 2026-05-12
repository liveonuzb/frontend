import { describe, expect, it } from "vitest";
import {
  getOnboardingOptionsPath,
  getOnboardingOptionsQueryKey,
  normalizeOnboardingOptionsResponse,
} from "./onboarding-options";

describe("onboarding options helpers", () => {
  it("builds canonical resource paths and query keys from legacy option keys", () => {
    expect(getOnboardingOptionsPath("dietRequirements")).toBe(
      "/user/onboarding/options/diet-requirements",
    );
    expect(getOnboardingOptionsPath("bodyParts")).toBe(
      "/user/onboarding/options/body-parts",
    );
    expect(getOnboardingOptionsQueryKey("foods", "disliked-foods", "rice")).toEqual(
      ["onboarding", "options", "foods", "disliked-foods", "rice"],
    );
  });

  it("normalizes new resource responses and old aggregate responses", () => {
    expect(
      normalizeOnboardingOptionsResponse(
        { data: { data: [{ id: 1, name: "Osh" }], meta: {} } },
        "foods",
      ),
    ).toEqual([{ id: 1, name: "Osh" }]);

    expect(
      normalizeOnboardingOptionsResponse(
        { data: { allergies: [{ id: 2, name: "Sut" }] } },
        "allergies",
      ),
    ).toEqual([{ id: 2, name: "Sut" }]);

    expect(
      normalizeOnboardingOptionsResponse(
        { data: { dietRequirements: [{ id: 3, name: "Halol" }] } },
        "diet-requirements",
      ),
    ).toEqual([{ id: 3, name: "Halol" }]);
  });
});
