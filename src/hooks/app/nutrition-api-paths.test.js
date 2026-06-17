import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  NUTRITION_AI_API_ROOT,
  NUTRITION_CUSTOM_FOODS_API_ROOT,
  NUTRITION_DAYS_API_ROOT,
  NUTRITION_FOODS_API_ROOT,
  NUTRITION_HISTORY_API_ROOT,
  NUTRITION_MEAL_PLAN_TEMPLATES_API_ROOT,
  NUTRITION_MEAL_PLANS_API_ROOT,
  NUTRITION_MEALS_API_ROOT,
  NUTRITION_REPORTS_API_ROOT,
  NUTRITION_SAVED_MEALS_API_ROOT,
  NUTRITION_TRACKING_API_ROOT,
  NUTRITION_SHOPPING_LISTS_API_ROOT,
  nutritionApiPath,
} from "./nutrition-api-paths.js";

const runtimeRoots = [
  "src/hooks/app",
  "src/modules/user/containers/nutrition",
  "src/modules/user/containers/water",
  "src/modules/profile/containers/profile/tabs",
];

const runtimeExtensions = new Set([".js", ".jsx"]);
const ignoredRuntimeSegments = [
  ".test.",
  ".spec.",
  "recipe-runtime-data.js",
  "recipe-mock-data.js",
];
const forbiddenLegacyNutritionPaths = [
  "/daily-tracking",
  "/meal-plans",
  "/foods",
  "/user/tracking",
  "/user/meal-plans",
  "/user/foods",
  "/user/me/saved-meals",
  "/user/nutrition-ai",
];

const collectRuntimeFiles = (directory) =>
  readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return collectRuntimeFiles(filePath);
    }

    if (!runtimeExtensions.has(filePath.slice(filePath.lastIndexOf(".")))) {
      return [];
    }

    if (ignoredRuntimeSegments.some((segment) => filePath.includes(segment))) {
      return [];
    }

    return [filePath];
  });

describe("nutritionApiPath", () => {
  it("returns the root when the suffix is empty", () => {
    expect(nutritionApiPath(NUTRITION_TRACKING_API_ROOT)).toBe(
      "/user/nutrition/tracking",
    );
  });

  it("joins suffixes that already start with slash", () => {
    expect(nutritionApiPath(NUTRITION_FOODS_API_ROOT, "/catalog")).toBe(
      "/user/nutrition/foods/catalog",
    );
  });

  it("joins suffixes without adding duplicate slash characters", () => {
    expect(nutritionApiPath(NUTRITION_TRACKING_API_ROOT, "2026-06-03")).toBe(
      "/user/nutrition/tracking/2026-06-03",
    );
  });

  it("supports canonical meal resource paths", () => {
    expect(nutritionApiPath(NUTRITION_MEALS_API_ROOT, "batch")).toBe(
      "/user/nutrition/meals/batch",
    );
  });

  it("supports canonical nutrition AI paths", () => {
    expect(nutritionApiPath(NUTRITION_AI_API_ROOT, "pantry/scan")).toBe(
      "/user/nutrition/ai/pantry/scan",
    );
  });

  it("supports canonical day and history paths", () => {
    expect(nutritionApiPath(NUTRITION_DAYS_API_ROOT, "2026-06-06")).toBe(
      "/user/nutrition/days/2026-06-06",
    );
    expect(nutritionApiPath(NUTRITION_HISTORY_API_ROOT)).toBe(
      "/user/nutrition/history",
    );
  });

  it("supports canonical custom foods paths", () => {
    expect(nutritionApiPath(NUTRITION_CUSTOM_FOODS_API_ROOT)).toBe(
      "/user/nutrition/custom-foods",
    );
    expect(nutritionApiPath(NUTRITION_CUSTOM_FOODS_API_ROOT, "custom-1")).toBe(
      "/user/nutrition/custom-foods/custom-1",
    );
  });

  it("supports canonical meal plan template and shopping list paths", () => {
    expect(nutritionApiPath(NUTRITION_MEAL_PLANS_API_ROOT)).toBe(
      "/user/nutrition/meal-plans",
    );
    expect(nutritionApiPath(NUTRITION_MEAL_PLAN_TEMPLATES_API_ROOT)).toBe(
      "/user/nutrition/meal-plan-templates",
    );
    expect(
      nutritionApiPath(
        NUTRITION_MEAL_PLAN_TEMPLATES_API_ROOT,
        "template-1/apply",
      ),
    ).toBe("/user/nutrition/meal-plan-templates/template-1/apply");
    expect(
      nutritionApiPath(NUTRITION_SHOPPING_LISTS_API_ROOT, "list-1/items/item-1"),
    ).toBe("/user/nutrition/shopping-lists/list-1/items/item-1");
  });

  it("supports canonical saved meal and report paths", () => {
    expect(nutritionApiPath(NUTRITION_SAVED_MEALS_API_ROOT)).toBe(
      "/user/nutrition/saved-meals",
    );
    expect(nutritionApiPath(NUTRITION_REPORTS_API_ROOT, "summary")).toBe(
      "/user/nutrition/reports/summary",
    );
  });

  it("keeps nutrition runtime API calls off legacy route roots", () => {
    const offenders = runtimeRoots
      .flatMap(collectRuntimeFiles)
      .flatMap((filePath) => {
        const source = readFileSync(filePath, "utf8");

        return forbiddenLegacyNutritionPaths
          .filter(
            (legacyPath) =>
              source.includes(`"${legacyPath}`) ||
              source.includes(`'${legacyPath}`) ||
              source.includes(`\`${legacyPath}`),
          )
          .map((legacyPath) => `${filePath}: ${legacyPath}`);
      });

    expect(offenders).toEqual([]);
  });
});
