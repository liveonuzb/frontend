import get from "lodash/get";

const catalogListRoutes = {
  foods: "/admin/foods/list",
  foodCategories: "/admin/food-categories/list",
  ingredients: "/admin/ingredients/list",
  cuisines: "/admin/cuisines/list",
  workouts: "/admin/workouts/list",
  workoutCategories: "/admin/workout-categories/list",
  workoutEquipments: "/admin/equipments/list",
  workoutMuscles: "/admin/workout-muscles",
  workoutBodyParts: "/admin/workout-body-parts",
  achievements: "/admin/achievements/list",
  healthConstraints: "/admin/health-constraints/list",
  userGoals: "/admin/user-goals/list",
  challenges: "/admin/challenges/list",
  equipments: "/admin/equipments/list",
  mealPlanTemplates: "/admin/meal-plans/list",
  mealPlanTemplatesWithoutMeals: "/admin/meal-plans/list",
  mealPlanTemplatesWithSparseCoverage: "/admin/meal-plans/list",
  mealPlanTemplatesWithCalorieIssues: "/admin/meal-plans/list",
  mealPlanTemplateDietaryConflicts: "/admin/meal-plans/list",
  foodImportValidationFailed: "/admin/foods/list",
  foodImportMacroWarnings: "/admin/foods/list",
  ingredientImportValidationFailed: "/admin/ingredients/list",
  ingredientImportMacroWarnings: "/admin/ingredients/list",
  ingredientImportMissingPrices: "/admin/ingredients/list",
  ingredientRegionalPriceImportValidationFailed: "/admin/ingredients/list",
  ingredientRegionalPriceImportMissingPrices: "/admin/ingredients/list",
};

const mealPlanTemplateQualityGroups = new Set([
  "mealPlanTemplatesWithoutMeals",
  "mealPlanTemplatesWithSparseCoverage",
  "mealPlanTemplatesWithCalorieIssues",
  "mealPlanTemplateDietaryConflicts",
]);

const importPreviewQualityGroups = new Set([
  "foodImportValidationFailed",
  "foodImportMacroWarnings",
  "ingredientImportValidationFailed",
  "ingredientImportMacroWarnings",
  "ingredientImportMissingPrices",
  "ingredientRegionalPriceImportValidationFailed",
  "ingredientRegionalPriceImportMissingPrices",
]);

export const getIssueActionPath = ({
  sectionKey,
  groupKey,
  issueId,
  action,
}) => {
  const explicitPath = get(action, "path");

  if (explicitPath) {
    return explicitPath;
  }

  if (sectionKey === "safety") {
    if (mealPlanTemplateQualityGroups.has(groupKey)) {
      return catalogListRoutes.mealPlanTemplates;
    }

    return issueId
      ? `${catalogListRoutes.workouts}/edit/${issueId}`
      : catalogListRoutes.workouts;
  }

  const listPath = catalogListRoutes[groupKey];

  if (!listPath || !issueId) {
    return listPath || "/admin/content-quality";
  }

  if (sectionKey === "translations") {
    const translationRoutes = new Set([
      "foods",
      "foodCategories",
      "ingredients",
      "cuisines",
      "achievements",
      "healthConstraints",
      "userGoals",
      "challenges",
    ]);

    return translationRoutes.has(groupKey)
      ? `${listPath}/translate/${issueId}`
      : listPath;
  }

  if (sectionKey === "images") {
    if (groupKey === "achievements") {
      return `${listPath}/images/${issueId}`;
    }

    return `${listPath}/edit/${issueId}`;
  }

  if (sectionKey === "prices") {
    if (importPreviewQualityGroups.has(groupKey)) {
      return listPath || catalogListRoutes.ingredients;
    }

    return `${catalogListRoutes.ingredients}/price/${issueId}`;
  }

  if (sectionKey === "nutrition") {
    if (importPreviewQualityGroups.has(groupKey)) {
      return listPath || catalogListRoutes.foods;
    }

    if (mealPlanTemplateQualityGroups.has(groupKey)) {
      return catalogListRoutes.mealPlanTemplates;
    }

    if (
      groupKey === "recipeFoodsWithoutItems" ||
      groupKey === "recipeFoodsWithUnknownCost" ||
      groupKey === "recipeFoodsWithInvalidNutrition"
    ) {
      return `${catalogListRoutes.foods}/recipe/${issueId}`;
    }

    if (
      groupKey === "ingredientsWithoutNutrition" ||
      groupKey === "ingredientsWithImpossibleCalories"
    ) {
      return `${catalogListRoutes.ingredients}/edit/${issueId}`;
    }

    return `${catalogListRoutes.foods}/edit/${issueId}`;
  }

  return listPath;
};
