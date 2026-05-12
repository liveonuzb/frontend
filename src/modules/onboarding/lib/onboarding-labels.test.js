import { describe, expect, it } from "vitest";
import { getDietRequirementLabel } from "./onboarding-labels.js";

const translations = {
  "onboarding.nutritionSteps.dietRequirements.options.glutenFree": "Glutensiz",
  "onboarding.nutritionSteps.dietRequirements.options.sugarFree": "Shakarsiz",
  "onboarding.nutritionSteps.dietRequirements.options.lactoseFree":
    "Laktozasiz",
};

const t = (key, options = {}) => translations[key] ?? options.defaultValue;

describe("onboarding labels", () => {
  it("localizes known diet requirement catalog labels", () => {
    expect(getDietRequirementLabel({ name: "Gluten free" }, "#1", t)).toBe(
      "Glutensiz",
    );
    expect(getDietRequirementLabel({ name: "Sugar free" }, "#2", t)).toBe(
      "Shakarsiz",
    );
    expect(getDietRequirementLabel({ name: "Lactose free" }, "#3", t)).toBe(
      "Laktozasiz",
    );
  });

  it("keeps unknown diet requirement names readable", () => {
    expect(getDietRequirementLabel({ name: "Low FODMAP" }, "#4", t)).toBe(
      "Low FODMAP",
    );
  });
});
