import { describe, expect, it } from "vitest";

import { resolveFoodCreateNutritionMode } from "./food-create-utils.js";

describe("food create drawer defaults", () => {
  it("can preselect recipe nutrition mode from route state", () => {
    expect(resolveFoodCreateNutritionMode("recipe")).toBe("recipe");
    expect(resolveFoodCreateNutritionMode("manual")).toBe("manual");
    expect(resolveFoodCreateNutritionMode("unknown")).toBe("manual");
  });
});
