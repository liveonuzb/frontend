import { describe, expect, it } from "vitest";
import { NUTRITION_NAV_ITEMS } from "./nutrition-nav-items.js";
import { NUTRITION_VISUAL_ROUTES } from "./nutrition-visual-routes.js";

describe("NUTRITION_VISUAL_ROUTES", () => {
  it("covers each primary nutrition navigation route with a stable screenshot target", () => {
    expect(NUTRITION_VISUAL_ROUTES).toHaveLength(NUTRITION_NAV_ITEMS.length);
    expect(NUTRITION_VISUAL_ROUTES.map((route) => route.path)).toEqual(
      NUTRITION_NAV_ITEMS.map((item) => item.to),
    );
    expect(NUTRITION_VISUAL_ROUTES).toEqual([
      expect.objectContaining({
        key: "overview",
        path: "/user/nutrition/overview",
        expectedText: "Bugungi Kaloriya",
        screenshotName: "nutrition-overview.png",
      }),
      expect.objectContaining({
        key: "plans",
        path: "/user/nutrition/plans",
        expectedText: "Rejalar",
        screenshotName: "nutrition-plans.png",
      }),
      expect.objectContaining({
        key: "recipes",
        path: "/user/nutrition/recipes",
        expectedText: "Tovuqli quinoa salatasi",
        screenshotName: "nutrition-recipes.png",
      }),
      expect.objectContaining({
        key: "history",
        path: "/user/nutrition/history",
        expectedText: "Tuxumli nonushta",
        screenshotName: "nutrition-history.png",
      }),
      expect.objectContaining({
        key: "report",
        path: "/user/nutrition/report",
        expectedText: "Hisobot",
        screenshotName: "nutrition-report.png",
      }),
    ]);
  });

  it("uses unique visual keys and screenshot names", () => {
    const keys = NUTRITION_VISUAL_ROUTES.map((route) => route.key);
    const screenshotNames = NUTRITION_VISUAL_ROUTES.map(
      (route) => route.screenshotName,
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(screenshotNames).size).toBe(screenshotNames.length);
  });
});
