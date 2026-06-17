import omitBy from "lodash/omitBy";
import { normalizeDateKey } from "@/modules/user/lib/nutrition-normalizers";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys.js";

export const compactNutritionQueryParams = (params = {}) =>
  omitBy(
    params,
    (value) => value === "" || value === null || value === undefined,
  );

export const NUTRITION_DASHBOARD_QUERY_KEY = [
  "user",
  "nutrition",
  "dashboard",
];
export const getNutritionDashboardQueryKey = (date) => [
  ...NUTRITION_DASHBOARD_QUERY_KEY,
  normalizeDateKey(date),
];

export const NUTRITION_DAY_QUERY_KEY = ["daily-tracking"];
export const getNutritionDayQueryKey = (date) => [
  ...NUTRITION_DAY_QUERY_KEY,
  normalizeDateKey(date),
];
export const getNutritionHistoryQueryKey = (params = {}) => [
  ...NUTRITION_DAY_QUERY_KEY,
  "history",
  params,
];

export const NUTRITION_REPORTS_QUERY_KEY = [
  "daily-tracking",
  "health-report",
];
export const getNutritionHealthReportQueryKey = (
  rangeMode,
  days,
  startDate,
  endDate,
) => [...NUTRITION_REPORTS_QUERY_KEY, rangeMode, days, startDate, endDate];
export const getNutritionHealthReportComparisonQueryKey = (
  period,
  startDate,
  endDate,
) => [
  ...NUTRITION_REPORTS_QUERY_KEY,
  "comparison",
  period,
  startDate,
  endDate,
];

export const NUTRITION_WATER_ANALYTICS_QUERY_KEY = ["water", "analytics"];
export const getNutritionWaterAnalyticsQueryKey = (...parts) => [
  ...NUTRITION_WATER_ANALYTICS_QUERY_KEY,
  ...parts,
];

export const NUTRITION_FOODS_CATALOG_QUERY_KEY = ["foods", "catalog"];
export const NUTRITION_FOODS_QUICK_ADD_QUERY_KEY = ["foods", "quick-add"];
export const NUTRITION_FOOD_RECIPE_QUERY_KEY = ["foods", "recipe"];
export const getNutritionFoodsByCategoryQueryKey = (
  categoryId,
  search,
  pageSize,
) => [
  ...NUTRITION_FOODS_CATALOG_QUERY_KEY,
  "category",
  categoryId,
  search,
  pageSize,
];
export const getNutritionFoodRecipeQueryKey = (foodId, language = "uz") => [
  ...NUTRITION_FOOD_RECIPE_QUERY_KEY,
  foodId,
  language,
];
export const NUTRITION_FOODS_AUDIO_TRANSCRIPT_HISTORY_QUERY_KEY = [
  "foods",
  "audio-transcript-history",
];

export const NUTRITION_SAVED_MEALS_QUERY_KEY = ["user", "saved-meals"];

export const NUTRITION_MEAL_PLAN_QUERY_KEY = ["meal-plans", "me"];
export const NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY = [
  "meal-plans",
  "templates",
];
export const getNutritionMealPlanTemplateDetailQueryKey = (templateId) => [
  ...NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY,
  "detail",
  templateId,
];
export const getNutritionMealPlanTemplateConflictPreviewQueryKey = (
  templateId,
) => [
  ...NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY,
  "conflict-preview",
  templateId || "none",
];
export const getNutritionMealPlanShoppingListsQueryKey = (planId) => [
  ...NUTRITION_MEAL_PLAN_QUERY_KEY,
  "shopping-lists",
  planId || "none",
];

export const NUTRITION_RECIPES_QUERY_KEY = ["user", "nutrition", "recipes"];
export const NUTRITION_RECIPE_DETAIL_QUERY_KEY = [
  "user",
  "nutrition",
  "recipe",
];
export const NUTRITION_RECIPE_FILTERS_QUERY_KEY = [
  "user",
  "nutrition",
  "recipe-filters",
];
export const NUTRITION_RECIPE_CATEGORIES_QUERY_KEY = [
  "user",
  "nutrition",
  "recipe-categories",
];
export const MY_NUTRITION_RECIPES_QUERY_KEY = [
  "user",
  "nutrition",
  "recipes",
  "mine",
];
export const NUTRITION_RECIPE_GALLERY_QUERY_KEY = [
  "user",
  "nutrition",
  "recipe-gallery",
];
export const NUTRITION_RECIPE_GENERATION_QUERY_KEY = [
  "user",
  "nutrition",
  "recipe-generation",
];
export const getNutritionRecipesQueryKey = (filters = {}, language = "uz") => [
  ...NUTRITION_RECIPES_QUERY_KEY,
  language,
  compactNutritionQueryParams(filters),
];
export const getNutritionRecipeDetailQueryKey = (id, language = "uz") => [
  ...NUTRITION_RECIPE_DETAIL_QUERY_KEY,
  language,
  id || null,
];
export const getNutritionRecipeFiltersQueryKey = (language = "uz") => [
  ...NUTRITION_RECIPE_FILTERS_QUERY_KEY,
  language,
];
export const getNutritionRecipeCategoriesQueryKey = (language = "uz") => [
  ...NUTRITION_RECIPE_CATEGORIES_QUERY_KEY,
  language,
];
export const getMyNutritionRecipesQueryKey = (
  filters = {},
  language = "uz",
) => [
  ...MY_NUTRITION_RECIPES_QUERY_KEY,
  language,
  compactNutritionQueryParams(filters),
];
export const getNutritionRecipeGalleryQueryKey = (language = "uz") => [
  ...NUTRITION_RECIPE_GALLERY_QUERY_KEY,
  language,
];

const invalidateQueryKey = (queryClient, queryKey) =>
  queryClient.invalidateQueries({ queryKey });

export const invalidateNutritionDashboard = (queryClient, date) =>
  invalidateQueryKey(
    queryClient,
    date ? getNutritionDashboardQueryKey(date) : NUTRITION_DASHBOARD_QUERY_KEY,
  );

export const invalidateNutritionDay = (queryClient, date) =>
  invalidateQueryKey(
    queryClient,
    date ? getNutritionDayQueryKey(date) : NUTRITION_DAY_QUERY_KEY,
  );

export const invalidateNutritionHistory = (queryClient) =>
  invalidateQueryKey(queryClient, [...NUTRITION_DAY_QUERY_KEY, "history"]);

export const invalidateNutritionReports = (queryClient) =>
  invalidateQueryKey(queryClient, NUTRITION_REPORTS_QUERY_KEY);

export const invalidateNutritionFoods = (queryClient) =>
  Promise.all([
    invalidateQueryKey(queryClient, NUTRITION_FOODS_CATALOG_QUERY_KEY),
    invalidateQueryKey(queryClient, NUTRITION_FOODS_QUICK_ADD_QUERY_KEY),
  ]);

export const invalidateNutritionQuickAdd = (queryClient) =>
  invalidateQueryKey(queryClient, NUTRITION_FOODS_QUICK_ADD_QUERY_KEY);

export const invalidateNutritionAudioTranscriptHistory = (queryClient) =>
  invalidateQueryKey(
    queryClient,
    NUTRITION_FOODS_AUDIO_TRANSCRIPT_HISTORY_QUERY_KEY,
  );

export const invalidateSavedMeals = (queryClient) =>
  invalidateQueryKey(queryClient, NUTRITION_SAVED_MEALS_QUERY_KEY);

export const invalidateNutritionMealPlans = (queryClient) =>
  Promise.all([
    invalidateQueryKey(queryClient, NUTRITION_MEAL_PLAN_QUERY_KEY),
    invalidateQueryKey(queryClient, NUTRITION_MEAL_PLAN_TEMPLATES_QUERY_KEY),
  ]);

export const invalidateNutritionRecipes = (queryClient) =>
  Promise.all([
    invalidateQueryKey(queryClient, NUTRITION_RECIPES_QUERY_KEY),
    invalidateQueryKey(queryClient, MY_NUTRITION_RECIPES_QUERY_KEY),
    invalidateQueryKey(queryClient, NUTRITION_RECIPE_DETAIL_QUERY_KEY),
    invalidateQueryKey(queryClient, NUTRITION_RECIPE_GALLERY_QUERY_KEY),
    invalidateQueryKey(queryClient, NUTRITION_RECIPE_GENERATION_QUERY_KEY),
  ]);

export const invalidateNutritionMealMutationQueries = (
  queryClient,
  { date, touchesSavedMeals = false } = {},
) =>
  Promise.all([
    invalidateNutritionDay(queryClient, date),
    invalidateNutritionDashboard(queryClient, date),
    invalidateNutritionHistory(queryClient),
    invalidateNutritionReports(queryClient),
    invalidateNutritionQuickAdd(queryClient),
    invalidateNutritionMealPlans(queryClient),
    invalidateNutritionRecipes(queryClient),
    invalidateQueryKey(queryClient, NUTRITION_WATER_ANALYTICS_QUERY_KEY),
    invalidateGamificationQueries(queryClient),
    ...(touchesSavedMeals ? [invalidateSavedMeals(queryClient)] : []),
  ]);
