import { describe, expect, it } from "vitest";
import { normalizeApiPath } from "./normalize-api-path.js";

describe("normalizeApiPath", () => {
  it("leaves canonical nutrition routes untouched", () => {
    expect(normalizeApiPath("/user/nutrition/meals/batch")).toBe(
      "/user/nutrition/meals/batch",
    );
    expect(normalizeApiPath("/user/nutrition/reports/export")).toBe(
      "/user/nutrition/reports/export",
    );
  });

  it("does not hide legacy nutrition paths behind the global normalizer", () => {
    expect(normalizeApiPath("/meal-plans/active")).toBe("/meal-plans/active");
    expect(normalizeApiPath("/daily-tracking/2026-06-03")).toBe(
      "/daily-tracking/2026-06-03",
    );
    expect(normalizeApiPath("/foods/catalog")).toBe("/foods/catalog");
  });
});
