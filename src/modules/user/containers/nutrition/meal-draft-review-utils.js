import round from "lodash/round";
import filter from "lodash/filter";
import reduce from "lodash/reduce";
import some from "lodash/some";
import {
  buildMealIngredientsPayload,
  getMealIngredientTotals,
  getMealIngredientsGrams,
  normalizeMealIngredients,
  normalizeMealNutrition,
  toNumber,
} from "./meal-ingredients.js";

export const formatConfidence = (confidence = 0) =>
  `${Math.max(0, Math.min(100, Math.round(toNumber(confidence) * 100)))}%`;

export const getDraftPortion = (item = {}) => {
  const ingredients = normalizeMealIngredients(item?.ingredients);
  if (ingredients.length) {
    return Math.max(0, Math.round(getMealIngredientsGrams(ingredients)));
  }

  return Math.max(
    20,
    Math.round(
      toNumber(item.grams ?? item.portionGrams ?? item.defaultAmount, 100),
    ),
  );
};

export const getDraftNutritionPreview = (item = {}) => {
  const totals = getMealIngredientTotals(item?.ingredients, item?.nutrition);

  // Backend may return ingredients without nutrition data yet (e.g. matchStatus=unmatched).
  // In that case the ingredient sum is all-zero, so fall back to item-level nutrition
  // which the AI always provides on the scan response.
  if (
    totals.calories === 0 &&
    totals.protein === 0 &&
    totals.carbs === 0 &&
    totals.fat === 0
  ) {
    const fallback = normalizeMealNutrition(item?.nutrition);
    if (fallback.calories > 0) {
      return fallback;
    }
  }

  return totals;
};

export const isDraftReviewNeeded = (item = {}) =>
  Boolean(item?.reviewNeeded) ||
  some(normalizeMealIngredients(item?.ingredients), (ingredient) =>
    ingredient.reviewNeeded || ingredient.matchStatus === "unmatched");

export const getDraftReviewCount = (items = []) =>
  filter(items, isDraftReviewNeeded).length;

export const getDraftTotals = (items = []) =>
  reduce(items, (acc, item) => {
    const preview = getDraftNutritionPreview(item);
    acc.calories += preview.calories;
    acc.protein = round(acc.protein + preview.protein, 1);
    acc.carbs = round(acc.carbs + preview.carbs, 1);
    acc.fat = round(acc.fat + preview.fat, 1);
    acc.fiber = round(acc.fiber + preview.fiber, 1);
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

export const getDraftMaxCalories = (items = []) =>
  reduce(items, (acc, item) => {
    const totals = getDraftNutritionPreview(item);
    return acc + totals.calories;
  }, 0);

export const buildMealPayloadFromDraft = (
  item,
  { source = "ai", image = null, addedAt = undefined, savedMealId = null } = {},
) => {
  const preview = getDraftNutritionPreview(item);
  const ingredients = buildMealIngredientsPayload(item?.ingredients);

  return {
    name: item?.title || "Ovqat",
    source,
    savedMealId,
    qty: 1,
    grams: getDraftPortion(item),
    cal: preview.calories,
    protein: preview.protein,
    carbs: preview.carbs,
    fat: preview.fat,
    fiber: preview.fiber,
    image,
    ...(ingredients.length ? { ingredients } : {}),
    addedAt,
  };
};

export const getDraftImageUrl = (item = {}) =>
  item?.imageUrl || item?.image || null;
