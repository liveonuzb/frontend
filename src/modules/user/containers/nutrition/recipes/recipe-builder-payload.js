import compact from "lodash/compact";
import filter from "lodash/filter";
import get from "lodash/get";
import map from "lodash/map";
import some from "lodash/some";
import trim from "lodash/trim";
import toNumber from "lodash/toNumber";
import { getIngredientsNutrition, numberOrZero } from "./recipe-ui-utils.js";

const nutritionKeys = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
];

const toFiniteNumber = (value, fallback = 0) => {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : fallback;
};

const getIngredientQuantity = (ingredient) =>
  toFiniteNumber(ingredient.quantity ?? ingredient.displayAmount, 0);

const getIngredientNutritionSnapshot = (ingredient = {}) =>
  nutritionKeys.reduce(
    (snapshot, key) => ({
      ...snapshot,
      [key]: toFiniteNumber(ingredient[key], 0),
    }),
    {},
  );

export const hasIngredientNutritionSnapshot = (ingredient = {}) => {
  const snapshot = getIngredientNutritionSnapshot(ingredient);

  return some(nutritionKeys, (key) => snapshot[key] > 0);
};

export const getIngredientNutritionSourceLabel = (ingredient = {}) => {
  if (ingredient.reviewNeeded || ingredient.matchStatus === "unmatched") {
    return "Tekshirish kerak";
  }

  if (ingredient.ingredientId || get(ingredient, "matchedFood.ingredientId")) {
    return "Katalog";
  }

  if (ingredient.nutritionSource === "ai") {
    return "AI taxmin";
  }

  if (
    ingredient.nutritionSource === "manual" ||
    ingredient.matchStatus === "manual"
  ) {
    return "Manual";
  }

  return hasIngredientNutritionSnapshot(ingredient) ? "Manual" : "Noma'lum";
};

export const getIngredientNutritionIssues = (ingredients = []) => {
  if (!ingredients.length) {
    return [{ id: "__empty__", message: "Kamida bitta ingredient qo'shing." }];
  }

  return compact(
    map(ingredients, (ingredient, index) => {
      const name = trim(ingredient.name || "");
      const quantity = getIngredientQuantity(ingredient);
      const hasCatalogSource = Boolean(
        ingredient.ingredientId || get(ingredient, "matchedFood.ingredientId"),
      );
      const hasReviewIssue =
        Boolean(ingredient.reviewNeeded) ||
        ingredient.matchStatus === "unmatched";
      const hasTrustedSnapshot =
        hasIngredientNutritionSnapshot(ingredient) &&
        Boolean(ingredient.nutritionSource || ingredient.matchStatus);

      if (!name) {
        return {
          id: ingredient.id || `ingredient-${index}`,
          message: `${index + 1}-ingredient nomini tanlang.`,
        };
      }

      if (quantity <= 0) {
        return {
          id: ingredient.id || `ingredient-${index}`,
          message: `${name} uchun miqdor 0 dan katta bo'lishi kerak.`,
        };
      }

      if (!hasCatalogSource && (!hasTrustedSnapshot || hasReviewIssue)) {
        return {
          id: ingredient.id || `ingredient-${index}`,
          message: `${name} uchun oziqaviy manbani tasdiqlang.`,
        };
      }

      return null;
    }),
  );
};

export const hasIngredientNutritionIssues = (ingredients = []) =>
  getIngredientNutritionIssues(ingredients).length > 0;

const toRecipeInstructionPayload = (step, index) => ({
  stepNumber: index + 1,
  title: trim(step.title || "") || `Qadam ${index + 1}`,
  body: trim(step.description || step.body || ""),
  durationMinutes: toFiniteNumber(step.durationMinutes, null),
  mediaUrl: step.imageUrl || step.mediaUrl || null,
});

const toRecipeIngredientPayload = (ingredient, index) => {
  const quantity = getIngredientQuantity(ingredient);

  return {
    id: ingredient.id || `ingredient-${index}`,
    ingredientId:
      toFiniteNumber(
        ingredient.ingredientId ?? get(ingredient, "matchedFood.ingredientId"),
        null,
      ) || null,
    name: trim(ingredient.name || ""),
    grams:
      String(ingredient.unit || "").toLowerCase() === "g" ? quantity : null,
    displayAmount: quantity,
    displayUnit: ingredient.unit || "g",
    optional: !ingredient.isRequired,
    notes: trim(ingredient.note || "") || null,
    nutritionSource: ingredient.nutritionSource || "manual",
    matchStatus: ingredient.matchStatus || "manual",
    reviewNeeded: Boolean(ingredient.reviewNeeded),
    nutritionSnapshot: getIngredientNutritionSnapshot(ingredient),
    orderKey: (index + 1) * 1024,
  };
};

export const buildRecipeCreatePayload = ({
  basicInfo,
  ingredients,
  steps,
  imageUrl,
  visibility,
  recipeStatus,
}) => {
  const nutrition = getIngredientsNutrition(ingredients);
  const ingredientPayload = map(ingredients, toRecipeIngredientPayload);
  const instructionPayload = map(steps, toRecipeInstructionPayload);

  return {
    title: trim(basicInfo.title || ""),
    description: trim(basicInfo.description || "") || null,
    category: basicInfo.category || null,
    difficulty: basicInfo.difficulty || null,
    prepTimeMinutes: numberOrZero(basicInfo.prepTimeMinutes),
    cookTimeMinutes: numberOrZero(basicInfo.cookTimeMinutes),
    totalTimeMinutes: numberOrZero(basicInfo.totalTimeMinutes),
    servings: numberOrZero(basicInfo.servings) || 1,
    imageUrl: imageUrl || null,
    visibility,
    recipeStatus,
    dietaryTags: basicInfo.tags || [],
    allergenTags: basicInfo.allergens || [],
    nutrition,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: nutrition.fiber,
    sugar: nutrition.sugar,
    sodium: nutrition.sodium,
    ingredients: ingredientPayload,
    instructions: instructionPayload,
    recipeInstructions: instructionPayload,
    needsAdminReview: visibility === "public" && recipeStatus !== "draft",
    unmatchedIngredients: filter(
      ingredientPayload,
      (ingredient) => !ingredient.ingredientId,
    ),
  };
};
