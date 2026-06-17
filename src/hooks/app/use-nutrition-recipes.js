import React from "react";
import {
  entries,
  filter,
  find,
  floor,
  forEach,
  get,
  includes,
  isArray,
  isFinite as isFiniteNumber,
  isNil,
  isPlainObject,
  map,
  max,
  reduce,
  some,
  toLower,
  toNumber,
  trim,
  uniq,
} from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostFileQuery,
  usePostQuery,
} from "@/hooks/api";
import { normalizeMealPlanShoppingList } from "@/hooks/app/use-meal-plan.js";
import {
  NUTRITION_FOODS_QUICK_ADD_QUERY_KEY as SHARED_NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
  MY_NUTRITION_RECIPES_QUERY_KEY as SHARED_MY_NUTRITION_RECIPES_QUERY_KEY,
  NUTRITION_RECIPE_CATEGORIES_QUERY_KEY as SHARED_NUTRITION_RECIPE_CATEGORIES_QUERY_KEY,
  NUTRITION_RECIPE_DETAIL_QUERY_KEY as SHARED_NUTRITION_RECIPE_DETAIL_QUERY_KEY,
  NUTRITION_RECIPE_FILTERS_QUERY_KEY as SHARED_NUTRITION_RECIPE_FILTERS_QUERY_KEY,
  NUTRITION_RECIPE_GALLERY_QUERY_KEY as SHARED_NUTRITION_RECIPE_GALLERY_QUERY_KEY,
  NUTRITION_RECIPE_GENERATION_QUERY_KEY as SHARED_NUTRITION_RECIPE_GENERATION_QUERY_KEY,
  NUTRITION_RECIPES_QUERY_KEY as SHARED_NUTRITION_RECIPES_QUERY_KEY,
  getMyNutritionRecipesQueryKey as getSharedMyNutritionRecipesQueryKey,
  getNutritionRecipeCategoriesQueryKey as getSharedNutritionRecipeCategoriesQueryKey,
  getNutritionRecipeDetailQueryKey as getSharedNutritionRecipeDetailQueryKey,
  getNutritionRecipeFiltersQueryKey as getSharedNutritionRecipeFiltersQueryKey,
  getNutritionRecipeGalleryQueryKey as getSharedNutritionRecipeGalleryQueryKey,
  getNutritionRecipesQueryKey as getSharedNutritionRecipesQueryKey,
  invalidateNutritionDashboard,
  invalidateNutritionMealMutationQueries,
  invalidateNutritionMealPlans,
  invalidateNutritionQuickAdd,
  invalidateNutritionRecipes,
} from "@/hooks/app/nutrition-query-keys";
import { getApiResponseData } from "@/lib/api-response.js";
import useLanguageStore from "@/store/language-store";

export const NUTRITION_RECIPES_QUERY_KEY =
  SHARED_NUTRITION_RECIPES_QUERY_KEY;
export const NUTRITION_RECIPE_DETAIL_QUERY_KEY =
  SHARED_NUTRITION_RECIPE_DETAIL_QUERY_KEY;
export const NUTRITION_RECIPE_FILTERS_QUERY_KEY =
  SHARED_NUTRITION_RECIPE_FILTERS_QUERY_KEY;
export const NUTRITION_RECIPE_CATEGORIES_QUERY_KEY =
  SHARED_NUTRITION_RECIPE_CATEGORIES_QUERY_KEY;
export const MY_NUTRITION_RECIPES_QUERY_KEY =
  SHARED_MY_NUTRITION_RECIPES_QUERY_KEY;
export const NUTRITION_RECIPE_GALLERY_QUERY_KEY =
  SHARED_NUTRITION_RECIPE_GALLERY_QUERY_KEY;
export const NUTRITION_RECIPE_GENERATION_QUERY_KEY =
  SHARED_NUTRITION_RECIPE_GENERATION_QUERY_KEY;
export const NUTRITION_FOODS_QUICK_ADD_QUERY_KEY =
  SHARED_NUTRITION_FOODS_QUICK_ADD_QUERY_KEY;
export const NUTRITION_RECIPE_FILTERS_STALE_TIME = 5 * 60 * 1000;

const RECIPE_INTEGER_FILTER_KEYS = [
  "page",
  "pageSize",
  "categoryId",
  "cuisineId",
];
const RECIPE_NUMBER_FILTER_KEYS = [
  "maxTotalTimeMinutes",
  "minProtein",
  "minCalories",
  "maxCalories",
];
const RECIPE_BOOLEAN_FILTER_KEYS = ["featuredOnly", "favoriteOnly"];

const isBlankString = (value) =>
  typeof value === "string" && trim(value).length === 0;

const hasFilterValue = (value) => !isNil(value) && !isBlankString(value);

const toFiniteNumber = (value, fallback = 0) => {
  const number = toNumber(value);
  return isFiniteNumber(number) ? number : fallback;
};

const toPositiveFilterNumber = (value, { integer = false } = {}) => {
  if (!hasFilterValue(value)) {
    return null;
  }

  const number = toNumber(value);

  if (!isFiniteNumber(number) || number <= 0) {
    return null;
  }

  return integer ? floor(number) : number;
};

const normalizeFilterBoolean = (value) => {
  if (value === true || value === 1) {
    return true;
  }

  if (typeof value !== "string") {
    return null;
  }

  return includes(["true", "1", "yes"], toLower(trim(value))) ? true : null;
};

const normalizeFilterString = (value) => {
  if (!hasFilterValue(value)) {
    return null;
  }

  return typeof value === "string" ? trim(value) : value;
};

const normalizeRecipeQueryFilters = (filters = {}) =>
  reduce(
    entries(filters),
    (result, [key, value]) => {
      if (includes(RECIPE_INTEGER_FILTER_KEYS, key)) {
        const normalized = toPositiveFilterNumber(value, { integer: true });

        if (!isNil(normalized)) {
          result[key] = normalized;
        }

        return result;
      }

      if (includes(RECIPE_NUMBER_FILTER_KEYS, key)) {
        const normalized = toPositiveFilterNumber(value);

        if (!isNil(normalized)) {
          result[key] = normalized;
        }

        return result;
      }

      if (includes(RECIPE_BOOLEAN_FILTER_KEYS, key)) {
        const normalized = normalizeFilterBoolean(value);

        if (!isNil(normalized)) {
          result[key] = normalized;
        }

        return result;
      }

      const normalized = normalizeFilterString(value);

      if (hasFilterValue(normalized)) {
        result[key] = normalized;
      }

      return result;
    },
    {},
  );

const resolveLabel = (translations, fallback, language) => {
  if (isPlainObject(translations)) {
    const direct = translations[language];

    if (typeof direct === "string" && trim(direct)) {
      return trim(direct);
    }

    if (typeof translations.uz === "string" && trim(translations.uz)) {
      return trim(translations.uz);
    }
  }

  return typeof fallback === "string" ? trim(fallback) : fallback || "";
};

export const getNutritionRecipesQueryKey = getSharedNutritionRecipesQueryKey;
export const getNutritionRecipeDetailQueryKey =
  getSharedNutritionRecipeDetailQueryKey;
export const getNutritionRecipeFiltersQueryKey =
  getSharedNutritionRecipeFiltersQueryKey;
export const getNutritionRecipeCategoriesQueryKey =
  getSharedNutritionRecipeCategoriesQueryKey;
export const getMyNutritionRecipesQueryKey =
  getSharedMyNutritionRecipesQueryKey;
export const getNutritionRecipeGalleryQueryKey =
  getSharedNutritionRecipeGalleryQueryKey;

const normalizeFilterOption = (option = {}, language = "uz") => {
  if (!isPlainObject(option)) {
    return null;
  }

  const id = toPositiveFilterNumber(option.id, { integer: true });
  const label = resolveLabel(
    option.translations,
    option.label || option.name,
    language,
  );

  if (isNil(id) || !hasFilterValue(label)) {
    return null;
  }

  return {
    ...option,
    id,
    label,
  };
};

const normalizeTagFilterValue = (option) => {
  if (typeof option === "string") {
    return normalizeFilterString(option);
  }

  if (!isPlainObject(option)) {
    return null;
  }

  const candidate = find(
    [option.value, option.key, option.slug, option.name, option.label],
    (value) => typeof value === "string" && Boolean(trim(value)),
  );

  return candidate ? trim(candidate) : null;
};

const normalizeTagFilterValues = (items) =>
  isArray(items)
    ? uniq(filter(map(items, normalizeTagFilterValue), Boolean))
    : [];

export const normalizeNutritionRecipe = (recipe = {}, language = "uz") => {
  const catalogFoodId = toFiniteNumber(
    recipe.catalogFoodId ?? recipe.foodId ?? recipe.id,
    null,
  );
  const servingSize = max([1, toFiniteNumber(recipe.servingSize, 100)]);
  const servingUnit = recipe.servingUnit || "g";
  const ingredients = isArray(recipe.ingredients)
    ? map(recipe.ingredients, (ingredient) => ({
        ...ingredient,
        name: resolveLabel(ingredient.translations, ingredient.name, language),
        grams: toFiniteNumber(
          ingredient.grams ?? ingredient.estimatedGrams,
          0,
        ),
        baseGrams: toFiniteNumber(
          ingredient.baseGrams ?? ingredient.grams ?? ingredient.estimatedGrams,
          0,
        ),
        displayAmount: toFiniteNumber(ingredient.displayAmount, null),
        baseDisplayAmount: toFiniteNumber(
          ingredient.baseDisplayAmount ?? ingredient.displayAmount,
          null,
        ),
        displayUnit: ingredient.displayUnit || ingredient.estimatedUnit || null,
        optional: Boolean(ingredient.optional),
        groupName: ingredient.groupName || null,
        notes: ingredient.notes || null,
      }))
    : [];
  const instructions = isArray(recipe.instructions)
    ? recipe.instructions
    : isArray(recipe.recipeInstructions)
      ? recipe.recipeInstructions
      : [];

  return {
    ...recipe,
    id: catalogFoodId ? `recipe-${catalogFoodId}` : recipe.id,
    catalogFoodId,
    title: resolveLabel(
      recipe.translations,
      recipe.title || recipe.name,
      language,
    ),
    description: recipe.description || "",
    calories: toFiniteNumber(recipe.calories),
    protein: toFiniteNumber(recipe.protein),
    carbs: toFiniteNumber(recipe.carbs),
    fat: toFiniteNumber(recipe.fat),
    fiber: toFiniteNumber(recipe.fiber),
    sugar: toFiniteNumber(recipe.sugar),
    sodium: toFiniteNumber(recipe.sodium),
    prepTimeMinutes: toFiniteNumber(recipe.prepTimeMinutes, null),
    cookTimeMinutes: toFiniteNumber(recipe.cookTimeMinutes, null),
    totalTimeMinutes: toFiniteNumber(recipe.totalTimeMinutes, null),
    servings: toFiniteNumber(recipe.servings, null),
    ratingAverage: toFiniteNumber(recipe.ratingAverage),
    ratingCount: toFiniteNumber(recipe.ratingCount),
    reviewCount: toFiniteNumber(recipe.reviewCount),
    viewCount: toFiniteNumber(recipe.viewCount),
    favoriteCount: toFiniteNumber(recipe.favoriteCount),
    difficulty: recipe.difficulty || null,
    isFeatured: Boolean(recipe.isFeatured),
    micronutrients: recipe.micronutrients || null,
    servingSize,
    servingUnit,
    servingLabel: `${servingSize} ${servingUnit}`,
    imageUrl: recipe.imageUrl || recipe.image || null,
    ingredients,
    instructions,
    recipeInstructions: instructions,
    ingredientsCount: toFiniteNumber(
      recipe.ingredientsCount,
      ingredients.length,
    ),
    stepsCount: toFiniteNumber(recipe.stepsCount, instructions.length),
    isFavorite: Boolean(recipe.isFavorite),
  };
};

const getResponsePayload = (response, fallback = {}) =>
  getApiResponseData(response, get(response, "data", fallback));

const isCacheObject = (value) =>
  Boolean(value) && typeof value === "object" && !isArray(value);

const getQueryKeyParams = (queryKey) => {
  if (!isArray(queryKey)) {
    return {};
  }

  const maybeParams = queryKey[queryKey.length - 1];

  return isCacheObject(maybeParams) ? maybeParams : {};
};

const isFavoriteOnlyRecipeQuery = (queryKey) => {
  const favoriteOnly = get(getQueryKeyParams(queryKey), "favoriteOnly", false);

  return favoriteOnly === true || favoriteOnly === "true";
};

const FAVORITE_CACHE_QUERY_KEYS = [
  NUTRITION_RECIPES_QUERY_KEY,
  NUTRITION_RECIPE_DETAIL_QUERY_KEY,
  NUTRITION_FOODS_QUICK_ADD_QUERY_KEY,
];

const matchesRecipeCacheId = (recipe = {}, recipeId) => {
  const targetText = String(recipeId ?? "");
  const targetWithoutPrefix = targetText.replace(/^recipe-/, "");
  const targetNumericId = toFiniteNumber(
    recipeId,
    toFiniteNumber(targetWithoutPrefix, null),
  );
  const candidateValues = [recipe.catalogFoodId, recipe.foodId, recipe.id];

  return some(candidateValues, (candidate) => {
    if (candidate === null || candidate === undefined) {
      return false;
    }

    const candidateNumericId = toFiniteNumber(candidate, null);
    const candidateText = String(candidate);

    return (
      (targetNumericId !== null && candidateNumericId === targetNumericId) ||
      candidateText === targetText ||
      candidateText === targetWithoutPrefix ||
      candidateText === `recipe-${targetWithoutPrefix}`
    );
  });
};

const getRecipeMutationId = (recipeOrId) => {
  const candidate =
    recipeOrId && typeof recipeOrId === "object"
      ? recipeOrId.catalogFoodId ?? recipeOrId.foodId ?? recipeOrId.id
      : recipeOrId;
  const normalized = String(candidate ?? "").replace(/^recipe-/, "");
  const numericId = toNumber(normalized);

  return isFiniteNumber(numericId) && numericId > 0 ? numericId : "";
};

const updateRecipeFavorite = (recipe, recipeId, isFavorite) => {
  if (!isCacheObject(recipe) || !matchesRecipeCacheId(recipe, recipeId)) {
    return recipe;
  }

  return {
    ...recipe,
    isFavorite,
  };
};

const updateRecipeFavoriteItems = (
  items,
  recipeId,
  isFavorite,
  { removeWhenUnfavorited = false } = {},
) => {
  if (!isArray(items)) {
    return items;
  }

  if (removeWhenUnfavorited && !isFavorite) {
    return filter(
      items,
      (recipe) => !matchesRecipeCacheId(recipe, recipeId),
    );
  }

  return map(items, (recipe) =>
    updateRecipeFavorite(recipe, recipeId, isFavorite),
  );
};

const updateRecipeFavoritePayload = (
  payload,
  recipeId,
  isFavorite,
  { removeRecipesWhenUnfavorited = false } = {},
) => {
  if (!isCacheObject(payload)) {
    return payload;
  }

  let nextPayload = payload;

  if (isArray(payload.recipes)) {
    nextPayload = {
      ...nextPayload,
      recipes: updateRecipeFavoriteItems(payload.recipes, recipeId, isFavorite, {
        removeWhenUnfavorited: removeRecipesWhenUnfavorited,
      }),
    };
  }

  if (isArray(payload.favorites)) {
    nextPayload = {
      ...nextPayload,
      favorites: updateRecipeFavoriteItems(
        payload.favorites,
        recipeId,
        isFavorite,
        {
          removeWhenUnfavorited: true,
        },
      ),
    };
  }

  if (isArray(payload.recent)) {
    nextPayload = {
      ...nextPayload,
      recent: updateRecipeFavoriteItems(payload.recent, recipeId, isFavorite),
    };
  }

  if (payload.recipe) {
    nextPayload = {
      ...nextPayload,
      recipe: updateRecipeFavorite(payload.recipe, recipeId, isFavorite),
    };
  }

  return nextPayload;
};

const updateRecipeFavoriteCache = (
  cacheValue,
  recipeId,
  isFavorite,
  options = {},
) => {
  if (isArray(cacheValue)) {
    return updateRecipeFavoriteItems(cacheValue, recipeId, isFavorite, {
      removeWhenUnfavorited: options.removeRecipesWhenUnfavorited,
    });
  }

  if (!isCacheObject(cacheValue)) {
    return cacheValue;
  }

  const wrappedPayload = get(cacheValue, "data.data");

  if (isCacheObject(wrappedPayload)) {
    return {
      ...cacheValue,
      data: {
        ...cacheValue.data,
        data: updateRecipeFavoritePayload(
          wrappedPayload,
          recipeId,
          isFavorite,
          options,
        ),
      },
    };
  }

  const directPayload = get(cacheValue, "data");

  if (isCacheObject(directPayload)) {
    return {
      ...cacheValue,
      data: updateRecipeFavoritePayload(
        directPayload,
        recipeId,
        isFavorite,
        options,
      ),
    };
  }

  return updateRecipeFavoritePayload(cacheValue, recipeId, isFavorite, options);
};

const getFavoriteCacheSnapshots = (queryClient) => {
  const snapshotsByKey = new Map();

  forEach(FAVORITE_CACHE_QUERY_KEYS, (queryKey) => {
    forEach(queryClient.getQueriesData({ queryKey }), (snapshot) => {
      snapshotsByKey.set(snapshot[0], snapshot);
    });
  });

  return [...snapshotsByKey.values()];
};

export const useNutritionRecipeFilters = (options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes/filters",
    queryProps: {
      queryKey: getNutritionRecipeFiltersQueryKey(currentLanguage),
      enabled,
      staleTime: NUTRITION_RECIPE_FILTERS_STALE_TIME,
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);

  const categories = React.useMemo(
    () =>
      filter(
        map(get(payload, "categories", []), (option) =>
          normalizeFilterOption(option, currentLanguage),
        ),
        Boolean,
      ),
    [currentLanguage, payload],
  );
  const cuisines = React.useMemo(
    () =>
      filter(
        map(get(payload, "cuisines", []), (option) =>
          normalizeFilterOption(option, currentLanguage),
        ),
        Boolean,
      ),
    [currentLanguage, payload],
  );

  return {
    ...query,
    categories,
    cuisines,
    dietaryTags: normalizeTagFilterValues(get(payload, "dietaryTags", [])),
    allergenTags: normalizeTagFilterValues(get(payload, "allergenTags", [])),
  };
};

export const useNutritionRecipeCategories = (options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes/categories",
    queryProps: {
      queryKey: getNutritionRecipeCategoriesQueryKey(currentLanguage),
      enabled,
      staleTime: NUTRITION_RECIPE_FILTERS_STALE_TIME,
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);
  const categories = React.useMemo(
    () =>
      filter(
        map(get(payload, "categories", []), (option) =>
          normalizeFilterOption(option, currentLanguage),
        ),
        Boolean,
      ),
    [currentLanguage, payload],
  );

  return {
    ...query,
    categories,
  };
};

export const useNutritionRecipes = (filters = {}, options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const params = React.useMemo(
    () => normalizeRecipeQueryFilters(filters),
    [filters],
  );
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes",
    params,
    queryProps: {
      queryKey: getNutritionRecipesQueryKey(params, currentLanguage),
      enabled,
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);

  const recipes = React.useMemo(
    () =>
      map(get(payload, "recipes", []), (recipe) =>
        normalizeNutritionRecipe(recipe, currentLanguage),
      ),
    [currentLanguage, payload],
  );

  const pagination = React.useMemo(
    () =>
      get(payload, "pagination", {
        page: 1,
        pageSize: 20,
        total: recipes.length,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      }),
    [payload, recipes.length],
  );
  const activeFilters = React.useMemo(
    () =>
      isArray(get(payload, "activeFilters"))
        ? filter(
            map(get(payload, "activeFilters"), (activeFilter) => {
              if (!isPlainObject(activeFilter)) {
                return null;
              }

              const key = normalizeFilterString(activeFilter.key);

              if (!key) {
                return null;
              }

              return {
                key,
                label: normalizeFilterString(activeFilter.label) || key,
                value: activeFilter.value,
              };
            }),
            Boolean,
          )
        : [],
    [payload],
  );

  return {
    ...query,
    recipes,
    pagination,
    activeFilters,
  };
};

export const useMyNutritionRecipes = (filters = {}, options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const params = React.useMemo(
    () => normalizeRecipeQueryFilters(filters),
    [filters],
  );
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes/mine",
    params,
    queryProps: {
      queryKey: getMyNutritionRecipesQueryKey(params, currentLanguage),
      enabled,
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);
  const recipes = React.useMemo(
    () =>
      map(get(payload, "recipes", []), (recipe) =>
        normalizeNutritionRecipe(recipe, currentLanguage),
      ),
    [currentLanguage, payload],
  );

  return {
    ...query,
    recipes,
    pagination: get(payload, "pagination", {
      page: 1,
      pageSize: 20,
      total: recipes.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }),
  };
};

export const useNutritionRecipeGallery = (options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes/gallery/images",
    queryProps: {
      queryKey: getNutritionRecipeGalleryQueryKey(currentLanguage),
      enabled,
      staleTime: NUTRITION_RECIPE_FILTERS_STALE_TIME,
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);

  return {
    ...query,
    images: map(get(payload, "images", []), (image) => ({
      id: image.id,
      label: image.label || image.originalName || "Recipe image",
      url: image.url || null,
      mimeType: image.mimeType || null,
      size: toFiniteNumber(image.size, 0),
      createdAt: image.createdAt || null,
    })),
  };
};

export const useNutritionRecipeDetail = (recipeId, options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: recipeId ? `/user/nutrition/recipes/${recipeId}` : "",
    queryProps: {
      queryKey: getNutritionRecipeDetailQueryKey(recipeId, currentLanguage),
      enabled: Boolean(recipeId && enabled),
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);
  const recipe = React.useMemo(() => {
    const rawRecipe = get(payload, "recipe", null);

    return rawRecipe
      ? normalizeNutritionRecipe(rawRecipe, currentLanguage)
      : null;
  }, [currentLanguage, payload]);

  return {
    ...query,
    recipe,
  };
};

export const useNutritionRecipeActions = () => {
  const queryClient = useQueryClient();
  const postMutation = usePostQuery();
  const deleteMutation = useDeleteQuery();

  const invalidateRecipes = React.useCallback(async () => {
    await invalidateNutritionRecipes(queryClient);
  }, [queryClient]);

  const invalidateFavoriteDomains = React.useCallback(async () => {
    await Promise.all([
      invalidateRecipes(),
      invalidateNutritionQuickAdd(queryClient),
      invalidateNutritionDashboard(queryClient),
    ]);
  }, [invalidateRecipes, queryClient]);

  const setOptimisticFavorite = React.useCallback(
    async (recipeId, isFavorite) => {
      await Promise.all(
        map(FAVORITE_CACHE_QUERY_KEYS, (queryKey) =>
          queryClient.cancelQueries({ queryKey }),
        ),
      );

      const snapshots = getFavoriteCacheSnapshots(queryClient);

      forEach(snapshots, ([queryKey, cacheValue]) => {
        queryClient.setQueryData(
          queryKey,
          updateRecipeFavoriteCache(cacheValue, recipeId, isFavorite, {
            removeRecipesWhenUnfavorited:
              isFavoriteOnlyRecipeQuery(queryKey),
          }),
        );
      });

      return snapshots;
    },
    [queryClient],
  );

  const restoreSnapshots = React.useCallback(
    (snapshots) => {
      forEach(snapshots, ([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    [queryClient],
  );

  const addFavorite = React.useCallback(
    async (recipeId) => {
      const actionId = getRecipeMutationId(recipeId);

      if (!actionId) {
        return null;
      }

      const snapshots = await setOptimisticFavorite(actionId, true);

      try {
        const response = await postMutation.mutateAsync({
          url: `/user/nutrition/recipes/${actionId}/favorite`,
        });
        await invalidateFavoriteDomains();
        return response;
      } catch (error) {
        restoreSnapshots(snapshots);
        throw error;
      }
    },
    [
      invalidateFavoriteDomains,
      postMutation,
      restoreSnapshots,
      setOptimisticFavorite,
    ],
  );

  const removeFavorite = React.useCallback(
    async (recipeId) => {
      const actionId = getRecipeMutationId(recipeId);

      if (!actionId) {
        return null;
      }

      const snapshots = await setOptimisticFavorite(actionId, false);

      try {
        const response = await deleteMutation.mutateAsync({
          url: `/user/nutrition/recipes/${actionId}/favorite`,
        });
        await invalidateFavoriteDomains();
        return response;
      } catch (error) {
        restoreSnapshots(snapshots);
        throw error;
      }
    },
    [
      deleteMutation,
      invalidateFavoriteDomains,
      restoreSnapshots,
      setOptimisticFavorite,
    ],
  );

  const toggleFavorite = React.useCallback(
    async (recipe) => {
      const actionId = getRecipeMutationId(recipe);

      if (!actionId) {
        return null;
      }

      return recipe.isFavorite
        ? removeFavorite(actionId)
        : addFavorite(actionId);
    },
    [addFavorite, removeFavorite],
  );

  const addToMealLog = React.useCallback(
    async (recipeId, payload) => {
      const actionId = getRecipeMutationId(recipeId);

      if (!actionId) {
        return null;
      }

      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/${actionId}/meal-log`,
        attributes: payload,
      });
      await Promise.all([
        invalidateRecipes(),
        invalidateNutritionMealMutationQueries(queryClient, {
          date: payload?.date,
        }),
      ]);
      return response;
    },
    [invalidateRecipes, postMutation, queryClient],
  );

  const addToMealPlan = React.useCallback(
    async (recipeId, payload) => {
      const actionId = getRecipeMutationId(recipeId);

      if (!actionId) {
        return null;
      }

      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/${actionId}/add-to-meal-plan`,
        attributes: payload,
      });
      await Promise.all([
        invalidateRecipes(),
        invalidateNutritionMealPlans(queryClient),
      ]);
      return response;
    },
    [invalidateRecipes, postMutation, queryClient],
  );

  const createShoppingList = React.useCallback(
    async (recipeId, payload = {}) => {
      const actionId = getRecipeMutationId(recipeId);

      if (!actionId) {
        return normalizeMealPlanShoppingList();
      }

      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/${actionId}/shopping-list`,
        attributes: payload,
      });
      await invalidateRecipes();
      return normalizeMealPlanShoppingList(
        get(response, "data.data", get(response, "data", {})),
      );
    },
    [invalidateRecipes, postMutation],
  );

  return {
    addFavorite,
    removeFavorite,
    toggleFavorite,
    addToMealLog,
    addToMealPlan,
    createShoppingList,
    isUpdating:
      Boolean(postMutation.isPending) || Boolean(deleteMutation.isPending),
  };
};

export const useNutritionRecipeBuilderActions = () => {
  const queryClient = useQueryClient();
  const postMutation = usePostQuery();
  const patchMutation = usePatchQuery({});
  const deleteMutation = useDeleteQuery();
  const fileMutation = usePostFileQuery({});

  const invalidateRecipeApp = React.useCallback(async () => {
    await invalidateNutritionRecipes(queryClient);
  }, [queryClient]);

  const createMyRecipe = React.useCallback(
    async (payload) => {
      const response = await postMutation.mutateAsync({
        url: "/user/nutrition/recipes/mine",
        attributes: payload,
      });
      await invalidateRecipeApp();
      const data = getResponsePayload(response);
      return {
        ...data,
        recipe: data.recipe
          ? normalizeNutritionRecipe(data.recipe)
          : data.recipe,
      };
    },
    [invalidateRecipeApp, postMutation],
  );

  const updateMyRecipe = React.useCallback(
    async (recipeId, payload) => {
      const response = await patchMutation.mutateAsync({
        url: `/user/nutrition/recipes/mine/${recipeId}`,
        attributes: payload,
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [invalidateRecipeApp, patchMutation],
  );

  const deleteMyRecipe = React.useCallback(
    async (recipeId) => {
      const response = await deleteMutation.mutateAsync({
        url: `/user/nutrition/recipes/mine/${recipeId}`,
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [deleteMutation, invalidateRecipeApp],
  );

  const requestPublication = React.useCallback(
    async (recipeId) => {
      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/mine/${recipeId}/request-publication`,
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [invalidateRecipeApp, postMutation],
  );

  const uploadMyRecipeImage = React.useCallback(
    async (file) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fileMutation.mutateAsync({
        url: "/user/nutrition/recipes/mine/image",
        attributes: formData,
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [fileMutation, invalidateRecipeApp],
  );

  const uploadRecipeProductImages = React.useCallback(
    async (files = []) => {
      const formData = new FormData();
      map(files, (file) => formData.append("images", file));
      const response = await fileMutation.mutateAsync({
        url: "/user/nutrition/recipes/product-images",
        attributes: formData,
      });
      const payload = getResponsePayload(response, []);
      return isArray(payload) ? payload : get(payload, "data", []);
    },
    [fileMutation],
  );

  const createRecipeGenerationJob = React.useCallback(
    async (payload) => {
      const response = await postMutation.mutateAsync({
        url: "/user/nutrition/recipe-generation-jobs",
        attributes: payload,
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [invalidateRecipeApp, postMutation],
  );

  const confirmRecipeGenerationProducts = React.useCallback(
    async (jobId, products) => {
      const response = await patchMutation.mutateAsync({
        url: `/user/nutrition/recipe-generation-jobs/${jobId}/products`,
        attributes: { products },
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [invalidateRecipeApp, patchMutation],
  );

  const saveGeneratedRecipeSuggestion = React.useCallback(
    async (jobId, payload) => {
      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipe-generation-jobs/${jobId}/save`,
        attributes: payload,
      });
      await invalidateRecipeApp();
      return getResponsePayload(response);
    },
    [invalidateRecipeApp, postMutation],
  );

  return {
    createMyRecipe,
    updateMyRecipe,
    deleteMyRecipe,
    requestPublication,
    uploadMyRecipeImage,
    uploadRecipeProductImages,
    createRecipeGenerationJob,
    confirmRecipeGenerationProducts,
    saveGeneratedRecipeSuggestion,
    isUpdating:
      Boolean(postMutation.isPending) ||
      Boolean(patchMutation.isPending) ||
      Boolean(deleteMutation.isPending) ||
      Boolean(fileMutation.isPending),
  };
};
