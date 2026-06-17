import { describe, expect, it, vi } from "vitest";
import {
  GAMIFICATION_ACHIEVEMENTS_QUERY_KEY,
  GAMIFICATION_ACHIEVEMENT_CATEGORIES_QUERY_KEY,
  GAMIFICATION_XP_HISTORY_QUERY_KEY,
  ME_QUERY_KEY,
  USER_NOTIFICATIONS_QUERY_KEY,
} from "@/modules/user/lib/gamification-query-keys.js";
import {
  NUTRITION_FOODS_CATALOG_QUERY_KEY,
  NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
  NUTRITION_MEAL_PLAN_QUERY_KEY,
  NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY,
  NUTRITION_RECIPE_DETAIL_QUERY_KEY,
  NUTRITION_RECIPE_GALLERY_QUERY_KEY,
  NUTRITION_RECIPE_GENERATION_QUERY_KEY,
  NUTRITION_RECIPES_QUERY_KEY,
  NUTRITION_SAVED_MEALS_QUERY_KEY,
  NUTRITION_WATER_ANALYTICS_QUERY_KEY,
  MY_NUTRITION_RECIPES_QUERY_KEY,
  getNutritionDayQueryKey,
  getNutritionFoodRecipeQueryKey,
  getNutritionHealthReportComparisonQueryKey,
  getNutritionMealPlanShoppingListsQueryKey,
  getNutritionRecipesQueryKey,
  invalidateNutritionMealMutationQueries,
} from "./nutrition-query-keys.js";

describe("nutrition query keys", () => {
  it("keeps existing production key values stable", () => {
    expect(getNutritionDayQueryKey("2026-06-03")).toEqual([
      "daily-tracking",
      "2026-06-03",
    ]);
    expect(NUTRITION_FOODS_CATALOG_QUERY_KEY).toEqual(["foods", "catalog"]);
    expect(NUTRITION_FOODS_QUICK_ADD_QUERY_KEY).toEqual([
      "foods",
      "quick-add",
    ]);
    expect(NUTRITION_SAVED_MEALS_QUERY_KEY).toEqual(["user", "saved-meals"]);
    expect(NUTRITION_MEAL_PLAN_QUERY_KEY).toEqual(["meal-plans", "me"]);
    expect(NUTRITION_RECIPES_QUERY_KEY).toEqual([
      "user",
      "nutrition",
      "recipes",
    ]);
    expect(NUTRITION_RECIPE_DETAIL_QUERY_KEY).toEqual([
      "user",
      "nutrition",
      "recipe",
    ]);
  });

  it("builds dynamic keys with response-changing inputs", () => {
    expect(getNutritionFoodRecipeQueryKey(12, "uz")).toEqual([
      "foods",
      "recipe",
      12,
      "uz",
    ]);
    expect(getNutritionMealPlanShoppingListsQueryKey("plan-1")).toEqual([
      "meal-plans",
      "me",
      "shopping-lists",
      "plan-1",
    ]);
    expect(
      getNutritionHealthReportComparisonQueryKey(
        "current",
        "2026-06-01",
        "2026-06-07",
      ),
    ).toEqual([
      "daily-tracking",
      "health-report",
      "comparison",
      "current",
      "2026-06-01",
      "2026-06-07",
    ]);
  });

  it("compacts empty recipe filter params", () => {
    expect(
      getNutritionRecipesQueryKey(
        { search: "", category: "dinner", page: undefined },
        "en",
      ),
    ).toEqual([
      "user",
      "nutrition",
      "recipes",
      "en",
      { category: "dinner" },
    ]);
  });

  it("invalidates all meal mutation dependent domains", async () => {
    const queryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    };

    await invalidateNutritionMealMutationQueries(queryClient, {
      date: "2026-06-03",
      touchesSavedMeals: true,
    });

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["daily-tracking", "2026-06-03"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["user", "nutrition", "dashboard", "2026-06-03"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["daily-tracking", "history"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["daily-tracking", "health-report"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["foods", "quick-add"],
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["user", "saved-meals"],
    });
  });

  it("centralizes every meal mutation invalidation domain", async () => {
    const queryClient = {
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    };

    await invalidateNutritionMealMutationQueries(queryClient, {
      date: "2026-06-03",
      touchesSavedMeals: true,
    });

    const invalidatedKeys = queryClient.invalidateQueries.mock.calls.map(
      ([call]) => call.queryKey,
    );

    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        ["daily-tracking", "2026-06-03"],
        ["user", "nutrition", "dashboard", "2026-06-03"],
        ["daily-tracking", "history"],
        ["daily-tracking", "health-report"],
        NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
        NUTRITION_MEAL_PLAN_QUERY_KEY,
        NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY,
        NUTRITION_RECIPES_QUERY_KEY,
        MY_NUTRITION_RECIPES_QUERY_KEY,
        NUTRITION_RECIPE_DETAIL_QUERY_KEY,
        NUTRITION_RECIPE_GALLERY_QUERY_KEY,
        NUTRITION_RECIPE_GENERATION_QUERY_KEY,
        NUTRITION_WATER_ANALYTICS_QUERY_KEY,
        NUTRITION_SAVED_MEALS_QUERY_KEY,
        ME_QUERY_KEY,
        GAMIFICATION_ACHIEVEMENTS_QUERY_KEY,
        GAMIFICATION_ACHIEVEMENT_CATEGORIES_QUERY_KEY,
        GAMIFICATION_XP_HISTORY_QUERY_KEY,
        USER_NOTIFICATIONS_QUERY_KEY,
      ]),
    );
  });
});
