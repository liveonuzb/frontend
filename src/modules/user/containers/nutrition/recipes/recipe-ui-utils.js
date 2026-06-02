export const normalizeRecipeForUi = (recipe = {}) => ({
  ...recipe,
  id: recipe.id || String(recipe.catalogFoodId || recipe.title),
  slug: recipe.slug || recipe.id || String(recipe.catalogFoodId || recipe.title),
  caloriesPerServing: recipe.caloriesPerServing ?? recipe.calories ?? 0,
  proteinPerServing: recipe.proteinPerServing ?? recipe.protein ?? 0,
  carbsPerServing: recipe.carbsPerServing ?? recipe.carbs ?? 0,
  fatPerServing: recipe.fatPerServing ?? recipe.fat ?? 0,
  fiberPerServing: recipe.fiberPerServing ?? recipe.fiber ?? 0,
  sugarPerServing: recipe.sugarPerServing ?? recipe.sugar ?? 0,
  sodiumPerServing: recipe.sodiumPerServing ?? recipe.sodium ?? 0,
  tags: recipe.tags || [],
  allergens: recipe.allergens || [],
  ingredients: recipe.ingredients || [],
  steps: recipe.steps || recipe.instructions || [],
  instructions: recipe.instructions || recipe.steps || [],
  totalTimeMinutes:
    recipe.totalTimeMinutes ??
    (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
  servings: recipe.servings || 1,
});

export const getRecipeKey = (recipe) =>
  String(recipe?.id || recipe?.catalogFoodId || recipe?.slug || "");

export const getRecipeActionId = (recipe) => {
  if (!recipe) {
    return "";
  }

  if (recipe.catalogFoodId) {
    return recipe.catalogFoodId;
  }

  return String(recipe.id || "").replace(/^recipe-/, "");
};
