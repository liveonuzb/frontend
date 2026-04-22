import { round } from "lodash";

export const toNumber = (value, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

export const normalizeMealNutrition = (nutrition = {}) => ({
  calories: Math.max(0, toNumber(nutrition?.calories ?? nutrition?.cal, 0)),
  protein: Math.max(0, toNumber(nutrition?.protein, 0)),
  carbs: Math.max(0, toNumber(nutrition?.carbs, 0)),
  fat: Math.max(0, toNumber(nutrition?.fat, 0)),
  fiber: Math.max(0, toNumber(nutrition?.fiber, 0)),
});

export const normalizeMealIngredient = (ingredient = {}, index = 0) => {
  const baseGrams = Math.max(
    0,
    toNumber(
      ingredient?.baseGrams ??
        ingredient?.estimatedGrams ??
        ingredient?.grams ??
        0,
      0,
    ),
  );
  const grams = Math.max(
    0,
    toNumber(
      ingredient?.grams,
      baseGrams || toNumber(ingredient?.estimatedGrams, 0),
    ),
  );

  return {
    id: ingredient?.id || `ingredient-${index + 1}`,
    name: String(ingredient?.name || "").trim(),
    grams,
    baseGrams: baseGrams || grams,
    estimatedGrams: Math.max(0, toNumber(ingredient?.estimatedGrams, grams)),
    estimatedQuantity:
      ingredient?.estimatedQuantity == null
        ? null
        : Math.max(0, toNumber(ingredient?.estimatedQuantity, 0)),
    estimatedUnit: ingredient?.estimatedUnit || null,
    nutritionSource: ingredient?.nutritionSource || null,
    matchStatus: ingredient?.matchStatus || null,
    reviewNeeded: Boolean(ingredient?.reviewNeeded),
    matchedFood: ingredient?.matchedFood || null,
    nutrition: normalizeMealNutrition(ingredient?.nutrition),
  };
};

export const normalizeMealIngredients = (ingredients = []) =>
  (Array.isArray(ingredients) ? ingredients : [])
    .map(normalizeMealIngredient)
    .filter((ingredient) => ingredient.name);

export const getIngredientNutritionPreview = (ingredient = {}) => {
  const normalized = normalizeMealIngredient(ingredient);
  const baseGrams =
    normalized.baseGrams > 0 ? normalized.baseGrams : normalized.grams;
  const scale = baseGrams > 0 ? normalized.grams / baseGrams : 1;

  return {
    calories: Math.round(normalized.nutrition.calories * scale),
    protein: round(normalized.nutrition.protein * scale, 1),
    carbs: round(normalized.nutrition.carbs * scale, 1),
    fat: round(normalized.nutrition.fat * scale, 1),
    fiber: round(normalized.nutrition.fiber * scale, 1),
  };
};

export const getMealIngredientTotals = (
  ingredients = [],
  fallbackNutrition = null,
) => {
  const normalized = normalizeMealIngredients(ingredients);

  if (!normalized.length) {
    return normalizeMealNutrition(fallbackNutrition);
  }

  return normalized.reduce(
    (totals, ingredient) => {
      const preview = getIngredientNutritionPreview(ingredient);
      return {
        calories: totals.calories + preview.calories,
        protein: round(totals.protein + preview.protein, 1),
        carbs: round(totals.carbs + preview.carbs, 1),
        fat: round(totals.fat + preview.fat, 1),
        fiber: round(totals.fiber + preview.fiber, 1),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
};

export const getMealIngredientsGrams = (ingredients = []) =>
  normalizeMealIngredients(ingredients).reduce(
    (sum, ingredient) => sum + Math.max(0, toNumber(ingredient.grams, 0)),
    0,
  );

export const buildMealIngredientsPayload = (ingredients = []) =>
  normalizeMealIngredients(ingredients).map((ingredient) => ({
    id: ingredient.id,
    name: ingredient.name,
    grams: ingredient.grams,
    estimatedGrams: ingredient.estimatedGrams,
    estimatedQuantity: ingredient.estimatedQuantity,
    estimatedUnit: ingredient.estimatedUnit,
    nutritionSource: ingredient.nutritionSource,
    matchStatus: ingredient.matchStatus,
    reviewNeeded: ingredient.reviewNeeded,
    matchedFood: ingredient.matchedFood,
    nutrition: getIngredientNutritionPreview(ingredient),
  }));

export const applyIngredientGramsChange = (
  ingredients = [],
  ingredientId,
  grams,
) =>
  normalizeMealIngredients(ingredients).map((ingredient) =>
    ingredient.id === ingredientId
      ? {
          ...ingredient,
          grams: Math.max(0, toNumber(grams, ingredient.grams)),
        }
      : ingredient,
  );

export const createMealIngredientId = () =>
  `ingredient-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export const normalizeIngredientForEdit = (ingredient = {}) => {
  const normalized = normalizeMealIngredient(ingredient);
  const grams = Math.max(1, Math.round(toNumber(normalized.grams, 100)));

  return {
    ...normalized,
    id: normalized.id || createMealIngredientId(),
    grams,
    baseGrams: Math.max(1, toNumber(normalized.baseGrams, grams)),
    estimatedGrams: Math.max(1, toNumber(normalized.estimatedGrams, grams)),
    nutrition: normalizeMealNutrition(normalized.nutrition),
  };
};

export const commitEditedIngredient = (ingredient = {}) => {
  const normalized = normalizeIngredientForEdit(ingredient);
  const grams = Math.max(1, Math.round(toNumber(normalized.grams, 100)));

  return {
    ...normalized,
    grams,
    baseGrams: grams,
    estimatedGrams: grams,
    nutrition: normalizeMealNutrition(normalized.nutrition),
    reviewNeeded: false,
    matchStatus: normalized.matchStatus || "manual",
    nutritionSource: normalized.nutritionSource || "manual",
  };
};

export const addMealIngredient = (ingredients = [], ingredient = {}) => [
  ...normalizeMealIngredients(ingredients),
  commitEditedIngredient({
    ...ingredient,
    id: ingredient.id || createMealIngredientId(),
  }),
];

export const updateMealIngredient = (
  ingredients = [],
  ingredientId,
  patch = {},
) =>
  normalizeMealIngredients(ingredients).map((ingredient) =>
    ingredient.id === ingredientId
      ? commitEditedIngredient({
          ...ingredient,
          ...patch,
          id: ingredient.id,
        })
      : ingredient,
  );

export const removeMealIngredient = (ingredients = [], ingredientId) =>
  normalizeMealIngredients(ingredients).filter(
    (ingredient) => ingredient.id !== ingredientId,
  );

export const hasIngredientBreakdown = (item = {}) =>
  normalizeMealIngredients(item?.ingredients).length > 0;

export const formatIngredientHint = (ingredient = {}) => {
  const normalized = normalizeMealIngredient(ingredient);
  if (
    normalized.estimatedQuantity == null ||
    !String(normalized.estimatedUnit || "").trim()
  ) {
    return null;
  }

  return `${normalized.estimatedQuantity} ${normalized.estimatedUnit}`;
};
