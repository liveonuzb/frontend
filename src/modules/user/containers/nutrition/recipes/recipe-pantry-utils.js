import compact from "lodash/compact";
import filter from "lodash/filter";
import find from "lodash/find";
import includes from "lodash/includes";
import lowerCase from "lodash/lowerCase";
import map from "lodash/map";
import size from "lodash/size";
import take from "lodash/take";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const EXPIRING_WINDOW_DAYS = 3;

const normalizeName = (value) => lowerCase(trim(value || ""));

const getIngredientName = (ingredient = {}) =>
  trim(ingredient.name || ingredient.title || ingredient.label || "");

const getIngredientId = (ingredient = {}) => {
  const id = toNumber(ingredient.ingredientId || ingredient.id);

  return Number.isInteger(id) && id > 0 ? id : null;
};

const isNameMatch = (left, right) => {
  const normalizedLeft = normalizeName(left);
  const normalizedRight = normalizeName(right);

  if (!normalizedLeft || !normalizedRight) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight ||
    includes(normalizedLeft, normalizedRight) ||
    includes(normalizedRight, normalizedLeft)
  );
};

export const findPantryMatchForIngredient = (ingredient = {}, pantryItems = []) => {
  const ingredientId = getIngredientId(ingredient);
  const ingredientName = getIngredientName(ingredient);

  return find(pantryItems, (item) => {
    const pantryIngredientId = getIngredientId(item);

    if (ingredientId && pantryIngredientId && ingredientId === pantryIngredientId) {
      return true;
    }

    return isNameMatch(ingredientName, item.name);
  });
};

const isExpiringSoon = (item = {}, now = new Date()) => {
  if (!item.expiresAt) {
    return false;
  }

  const expiresAt = new Date(item.expiresAt);

  if (Number.isNaN(expiresAt.getTime())) {
    return false;
  }

  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  return diffDays <= EXPIRING_WINDOW_DAYS;
};

const getRequiredRecipeIngredients = (recipe = {}) =>
  filter(recipe.ingredients || [], (ingredient) => ingredient.isRequired !== false);

export const getRecipePantryMatch = (
  recipe = {},
  pantryItems = [],
  now = new Date(),
) => {
  const requiredIngredients = getRequiredRecipeIngredients(recipe);
  const matchedEntries = compact(
    map(requiredIngredients, (ingredient) => {
      const pantryItem = findPantryMatchForIngredient(ingredient, pantryItems);

      return pantryItem ? { ingredient, pantryItem } : null;
    }),
  );
  const missingIngredients = filter(
    requiredIngredients,
    (ingredient) => !findPantryMatchForIngredient(ingredient, pantryItems),
  );
  const matchedPantryIds = new Set(map(matchedEntries, "pantryItem.id"));
  const substitutionPantryItems = filter(
    pantryItems,
    (item) => !matchedPantryIds.has(item.id),
  );
  const substitutions = compact(
    map(missingIngredients, (ingredient) => {
      const suggestions = take(substitutionPantryItems, 2);

      if (!size(suggestions)) {
        return null;
      }

      return {
        missingName: getIngredientName(ingredient),
        suggestionNames: map(suggestions, "name"),
      };
    }),
  );
  const expiringItems = filter(
    map(matchedEntries, "pantryItem"),
    (item) => isExpiringSoon(item, now),
  );

  return {
    matchedCount: size(matchedEntries),
    requiredCount: size(requiredIngredients),
    missingIngredients,
    substitutions,
    expiringItems,
    hasAnyMatch: size(matchedEntries) > 0,
    hasAllRequired:
      size(requiredIngredients) > 0 && size(missingIngredients) === 0,
  };
};

export const decorateRecipesWithPantry = (recipes = [], pantryItems = []) =>
  map(recipes, (recipe) => ({
    ...recipe,
    pantryMatch: size(pantryItems)
      ? getRecipePantryMatch(recipe, pantryItems)
      : null,
  }));

export const filterRecipesByPantry = (recipes = [], pantryOnly = false) =>
  pantryOnly ? filter(recipes, (recipe) => recipe.pantryMatch?.hasAllRequired) : recipes;
