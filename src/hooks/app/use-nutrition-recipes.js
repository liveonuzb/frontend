import React from "react";
import { get, isArray, map, omitBy, trim, toNumber } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostFileQuery,
  usePostQuery,
} from "@/hooks/api";
import {
  MEAL_PLAN_QUERY_KEY,
  normalizeMealPlanShoppingList,
} from "@/hooks/app/use-meal-plan.js";
import { getApiResponseData } from "@/lib/api-response.js";
import useLanguageStore from "@/store/language-store";

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
export const NUTRITION_RECIPE_FILTERS_STALE_TIME = 5 * 60 * 1000;

const toFiniteNumber = (value, fallback = 0) => {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : fallback;
};

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = translations[language];

    if (typeof direct === "string" && trim(direct)) {
      return trim(direct);
    }

    if (typeof translations.uz === "string" && trim(translations.uz)) {
      return trim(translations.uz);
    }
  }

  return fallback || "";
};

const compactParams = (params = {}) =>
  omitBy(
    params,
    (value) => value === "" || value === null || value === undefined,
  );

export const getNutritionRecipesQueryKey = (filters = {}, language = "uz") => [
  ...NUTRITION_RECIPES_QUERY_KEY,
  language,
  compactParams(filters),
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

export const getMyNutritionRecipesQueryKey = (filters = {}, language = "uz") => [
  ...MY_NUTRITION_RECIPES_QUERY_KEY,
  language,
  compactParams(filters),
];

export const getNutritionRecipeGalleryQueryKey = (language = "uz") => [
  ...NUTRITION_RECIPE_GALLERY_QUERY_KEY,
  language,
];

const normalizeFilterOption = (option = {}, language = "uz") => ({
  ...option,
  id: toFiniteNumber(option.id, option.id),
  label: resolveLabel(option.translations, option.name, language),
});

export const normalizeNutritionRecipe = (recipe = {}, language = "uz") => {
  const catalogFoodId = toFiniteNumber(
    recipe.catalogFoodId ?? recipe.foodId ?? recipe.id,
    null,
  );
  const servingSize = Math.max(1, toFiniteNumber(recipe.servingSize, 100));
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

const matchesRecipeCacheId = (recipe = {}, recipeId) => {
  const targetText = String(recipeId ?? "");
  const targetWithoutPrefix = targetText.replace(/^recipe-/, "");
  const targetNumericId = toFiniteNumber(
    recipeId,
    toFiniteNumber(targetWithoutPrefix, null),
  );
  const candidateValues = [recipe.catalogFoodId, recipe.foodId, recipe.id];

  return candidateValues.some((candidate) => {
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

const updateRecipeFavorite = (recipe, recipeId, isFavorite) => {
  if (!isCacheObject(recipe) || !matchesRecipeCacheId(recipe, recipeId)) {
    return recipe;
  }

  return {
    ...recipe,
    isFavorite,
  };
};

const updateRecipeFavoritePayload = (payload, recipeId, isFavorite) => {
  if (!isCacheObject(payload)) {
    return payload;
  }

  let nextPayload = payload;

  if (isArray(payload.recipes)) {
    nextPayload = {
      ...nextPayload,
      recipes: map(payload.recipes, (recipe) =>
        updateRecipeFavorite(recipe, recipeId, isFavorite),
      ),
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

const updateRecipeFavoriteCache = (cacheValue, recipeId, isFavorite) => {
  if (!isCacheObject(cacheValue)) {
    return cacheValue;
  }

  const wrappedPayload = get(cacheValue, "data.data");

  if (isCacheObject(wrappedPayload)) {
    return {
      ...cacheValue,
      data: {
        ...cacheValue.data,
        data: updateRecipeFavoritePayload(wrappedPayload, recipeId, isFavorite),
      },
    };
  }

  const directPayload = get(cacheValue, "data");

  if (isCacheObject(directPayload)) {
    return {
      ...cacheValue,
      data: updateRecipeFavoritePayload(directPayload, recipeId, isFavorite),
    };
  }

  return updateRecipeFavoritePayload(cacheValue, recipeId, isFavorite);
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
      map(get(payload, "categories", []), (option) =>
        normalizeFilterOption(option, currentLanguage),
      ),
    [currentLanguage, payload],
  );
  const cuisines = React.useMemo(
    () =>
      map(get(payload, "cuisines", []), (option) =>
        normalizeFilterOption(option, currentLanguage),
      ),
    [currentLanguage, payload],
  );

  return {
    ...query,
    categories,
    cuisines,
    dietaryTags: get(payload, "dietaryTags", []),
    allergenTags: get(payload, "allergenTags", []),
  };
};

export const useNutritionRecipeCategories = (options = {}) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const enabled = options.enabled ?? true;
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipe-categories",
    queryProps: {
      queryKey: getNutritionRecipeCategoriesQueryKey(currentLanguage),
      enabled,
      staleTime: NUTRITION_RECIPE_FILTERS_STALE_TIME,
    },
  });
  const payload = React.useMemo(() => getResponsePayload(data), [data]);
  const categories = React.useMemo(
    () =>
      map(get(payload, "categories", []), (option) =>
        normalizeFilterOption(option, currentLanguage),
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
  const params = React.useMemo(() => compactParams(filters), [filters]);
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes",
    params,
    queryProps: {
      queryKey: getNutritionRecipesQueryKey(filters, currentLanguage),
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
        ? map(get(payload, "activeFilters"), (filter) => ({
            key: filter.key,
            label: filter.label || filter.key,
            value: filter.value,
          }))
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
  const params = React.useMemo(() => compactParams(filters), [filters]);
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/recipes/mine",
    params,
    queryProps: {
      queryKey: getMyNutritionRecipesQueryKey(filters, currentLanguage),
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
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: NUTRITION_RECIPES_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
      }),
    ]);
  }, [queryClient]);

  const setOptimisticFavorite = React.useCallback(
    async (recipeId, isFavorite) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: NUTRITION_RECIPES_QUERY_KEY }),
        queryClient.cancelQueries({
          queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
        }),
      ]);

      const snapshots = [
        ...queryClient.getQueriesData({
          queryKey: NUTRITION_RECIPES_QUERY_KEY,
        }),
        ...queryClient.getQueriesData({
          queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
        }),
      ];
      const updateFavorite = (cacheValue) =>
        updateRecipeFavoriteCache(cacheValue, recipeId, isFavorite);

      queryClient.setQueriesData(
        { queryKey: NUTRITION_RECIPES_QUERY_KEY },
        updateFavorite,
      );
      queryClient.setQueriesData(
        { queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY },
        updateFavorite,
      );

      return snapshots;
    },
    [queryClient],
  );

  const restoreSnapshots = React.useCallback(
    (snapshots) => {
      snapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    [queryClient],
  );

  const addFavorite = React.useCallback(
    async (recipeId) => {
      const snapshots = await setOptimisticFavorite(recipeId, true);

      try {
        const response = await postMutation.mutateAsync({
          url: `/user/nutrition/recipes/${recipeId}/favorite`,
        });
        await invalidateRecipes();
        return response;
      } catch (error) {
        restoreSnapshots(snapshots);
        throw error;
      }
    },
    [invalidateRecipes, postMutation, restoreSnapshots, setOptimisticFavorite],
  );

  const removeFavorite = React.useCallback(
    async (recipeId) => {
      const snapshots = await setOptimisticFavorite(recipeId, false);

      try {
        const response = await deleteMutation.mutateAsync({
          url: `/user/nutrition/recipes/${recipeId}/favorite`,
        });
        await invalidateRecipes();
        return response;
      } catch (error) {
        restoreSnapshots(snapshots);
        throw error;
      }
    },
    [
      deleteMutation,
      invalidateRecipes,
      restoreSnapshots,
      setOptimisticFavorite,
    ],
  );

  const toggleFavorite = React.useCallback(
    async (recipe) => {
      if (!recipe?.catalogFoodId) {
        return null;
      }

      return recipe.isFavorite
        ? removeFavorite(recipe.catalogFoodId)
        : addFavorite(recipe.catalogFoodId);
    },
    [addFavorite, removeFavorite],
  );

  const addToMealLog = React.useCallback(
    async (recipeId, payload) => {
      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/${recipeId}/meal-log`,
        attributes: payload,
      });
      await Promise.all([
        invalidateRecipes(),
        queryClient.invalidateQueries({ queryKey: ["daily-tracking"] }),
        queryClient.invalidateQueries({
          queryKey: ["user", "nutrition", "dashboard"],
        }),
      ]);
      return response;
    },
    [invalidateRecipes, postMutation, queryClient],
  );

  const addToMealPlan = React.useCallback(
    async (recipeId, payload) => {
      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/${recipeId}/add-to-meal-plan`,
        attributes: payload,
      });
      await Promise.all([
        invalidateRecipes(),
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEY }),
      ]);
      return response;
    },
    [invalidateRecipes, postMutation, queryClient],
  );

  const createShoppingList = React.useCallback(
    async (recipeId, payload = {}) => {
      const response = await postMutation.mutateAsync({
        url: `/user/nutrition/recipes/${recipeId}/shopping-list`,
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
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: NUTRITION_RECIPES_QUERY_KEY }),
      queryClient.invalidateQueries({
        queryKey: MY_NUTRITION_RECIPES_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        queryKey: NUTRITION_RECIPE_DETAIL_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        queryKey: NUTRITION_RECIPE_GALLERY_QUERY_KEY,
      }),
      queryClient.invalidateQueries({
        queryKey: NUTRITION_RECIPE_GENERATION_QUERY_KEY,
      }),
    ]);
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
        url: "/user/nutrition/recipes/generate-from-products",
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
