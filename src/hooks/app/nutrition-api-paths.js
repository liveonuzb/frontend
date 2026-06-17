export const NUTRITION_API_ROOT = "/user/nutrition";
export const NUTRITION_TRACKING_API_ROOT = `${NUTRITION_API_ROOT}/tracking`;
export const NUTRITION_DAYS_API_ROOT = `${NUTRITION_API_ROOT}/days`;
export const NUTRITION_HISTORY_API_ROOT = `${NUTRITION_API_ROOT}/history`;
export const NUTRITION_FOODS_API_ROOT = `${NUTRITION_API_ROOT}/foods`;
export const NUTRITION_CUSTOM_FOODS_API_ROOT = `${NUTRITION_API_ROOT}/custom-foods`;
export const NUTRITION_MEALS_API_ROOT = `${NUTRITION_API_ROOT}/meals`;
export const NUTRITION_MEAL_PLANS_API_ROOT = `${NUTRITION_API_ROOT}/meal-plans`;
export const NUTRITION_MEAL_PLAN_TEMPLATES_API_ROOT = `${NUTRITION_API_ROOT}/meal-plan-templates`;
export const NUTRITION_SAVED_MEALS_API_ROOT = `${NUTRITION_API_ROOT}/saved-meals`;
export const NUTRITION_SHOPPING_LISTS_API_ROOT = `${NUTRITION_API_ROOT}/shopping-lists`;
export const NUTRITION_REPORTS_API_ROOT = `${NUTRITION_API_ROOT}/reports`;
export const NUTRITION_AI_API_ROOT = `${NUTRITION_API_ROOT}/ai`;

export const nutritionApiPath = (root, path = "") => {
  const suffix = String(path || "");

  if (!suffix) {
    return root;
  }

  return `${root}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
};
