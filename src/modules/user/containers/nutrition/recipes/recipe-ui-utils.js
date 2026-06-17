import round from "lodash/round";
import sumBy from "lodash/sumBy";
import toNumber from "lodash/toNumber";

const asArray = (value) => (Array.isArray(value) ? value : []);

const getRelationLabel = (item) => {
  if (typeof item === "string") {
    return item;
  }

  if (!item || typeof item !== "object") {
    return "";
  }

  return item.label || item.translations?.uz || item.name || item.title || "";
};

const getRelationLabels = (items) =>
  asArray(items)
    .map(getRelationLabel)
    .filter(Boolean);

export const normalizeRecipeForUi = (recipe = {}) => {
  const dietaryTags = asArray(recipe.dietaryTags);
  const allergenTags = asArray(recipe.allergenTags);
  const tags = asArray(recipe.tags);
  const allergens = asArray(recipe.allergens);
  const categories = asArray(recipe.categories);
  const cuisines = asArray(recipe.cuisines);
  const categoryLabels = getRelationLabels(categories);
  const cuisineLabels = getRelationLabels(cuisines);

  return {
    ...recipe,
    id: recipe.id || String(recipe.catalogFoodId || recipe.title),
    slug:
      recipe.slug || recipe.id || String(recipe.catalogFoodId || recipe.title),
    caloriesPerServing: recipe.caloriesPerServing ?? recipe.calories ?? 0,
    proteinPerServing: recipe.proteinPerServing ?? recipe.protein ?? 0,
    carbsPerServing: recipe.carbsPerServing ?? recipe.carbs ?? 0,
    fatPerServing: recipe.fatPerServing ?? recipe.fat ?? 0,
    fiberPerServing: recipe.fiberPerServing ?? recipe.fiber ?? 0,
    sugarPerServing: recipe.sugarPerServing ?? recipe.sugar ?? 0,
    sodiumPerServing: recipe.sodiumPerServing ?? recipe.sodium ?? 0,
    tags: tags.length ? tags : dietaryTags,
    allergens: allergens.length ? allergens : allergenTags,
    dietaryTags,
    allergenTags,
    categories,
    categoryLabels,
    category: recipe.category || categoryLabels[0] || "",
    cuisines,
    cuisineLabels,
    ingredients: recipe.ingredients || [],
    steps: recipe.steps || recipe.instructions || [],
    instructions: recipe.instructions || recipe.steps || [],
    totalTimeMinutes:
      recipe.totalTimeMinutes ??
      (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0),
    servings: recipe.servings || 1,
  };
};

export const getRecipeKey = (recipe) =>
  String(recipe?.id || recipe?.catalogFoodId || recipe?.slug || "");

export const getRecipeActionId = (recipe) => {
  if (!recipe) {
    return "";
  }

  const candidate =
    recipe.catalogFoodId ?? recipe.foodId ?? String(recipe.id || "");
  const normalized = String(candidate || "").replace(/^recipe-/, "");
  const numericId = toNumber(normalized);

  if (Number.isFinite(numericId) && numericId > 0) {
    return numericId;
  }

  return "";
};

export const numberOrZero = (value) => {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : 0;
};

export const formatNumber = (value, maximumFractionDigits = 1) => {
  const rounded = round(numberOrZero(value), maximumFractionDigits);

  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

export const formatQuantity = (quantity, unit, multiplier = 1) => {
  const value = numberOrZero(quantity) * numberOrZero(multiplier || 1);
  const rounded = round(value, 1);
  const display = Number.isInteger(rounded) ? rounded.toFixed(0) : rounded;
  const normalizedUnit = unit || "g";
  const separator = ["g", "kg", "ml", "l"].includes(
    String(normalizedUnit).toLowerCase(),
  )
    ? " "
    : " ";

  return `${display}${separator}${normalizedUnit}`;
};

export const getRecipeNutrition = (recipe = {}, servings = 1) => ({
  calories: Math.round(
    numberOrZero(recipe.caloriesPerServing ?? recipe.calories) * servings,
  ),
  protein: round(
    numberOrZero(recipe.proteinPerServing ?? recipe.protein) * servings,
    1,
  ),
  carbs: round(
    numberOrZero(recipe.carbsPerServing ?? recipe.carbs) * servings,
    1,
  ),
  fat: round(numberOrZero(recipe.fatPerServing ?? recipe.fat) * servings, 1),
  fiber: round(
    numberOrZero(recipe.fiberPerServing ?? recipe.fiber) * servings,
    1,
  ),
  sugar: round(
    numberOrZero(recipe.sugarPerServing ?? recipe.sugar) * servings,
    1,
  ),
  sodium: Math.round(
    numberOrZero(recipe.sodiumPerServing ?? recipe.sodium) * servings,
  ),
});

const getIngredientScale = (ingredient) => {
  const baseQuantity = Math.max(
    0.01,
    numberOrZero(ingredient.baseQuantity || ingredient.quantity || 1),
  );

  return numberOrZero(ingredient.quantity) / baseQuantity;
};

export const getIngredientsNutrition = (ingredients = []) => ({
  calories: Math.round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.calories) * getIngredientScale(ingredient),
    ),
  ),
  protein: round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.protein) * getIngredientScale(ingredient),
    ),
    1,
  ),
  carbs: round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.carbs) * getIngredientScale(ingredient),
    ),
    1,
  ),
  fat: round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.fat) * getIngredientScale(ingredient),
    ),
    1,
  ),
  fiber: round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.fiber) * getIngredientScale(ingredient),
    ),
    1,
  ),
  sugar: round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.sugar) * getIngredientScale(ingredient),
    ),
    1,
  ),
  sodium: Math.round(
    sumBy(
      ingredients,
      (ingredient) => numberOrZero(ingredient.sodium) * getIngredientScale(ingredient),
    ),
  ),
});
