import { describe, expect, it } from "vitest";

import { resolveFoodCreateNutritionMode } from "./index.jsx";

describe("food create drawer defaults", () => {
  it("can preselect recipe nutrition mode from route state", () => {
    expect(resolveFoodCreateNutritionMode("recipe")).toBe("recipe");
    expect(resolveFoodCreateNutritionMode("manual")).toBe("manual");
    expect(resolveFoodCreateNutritionMode("unknown")).toBe("manual");
  });
});
