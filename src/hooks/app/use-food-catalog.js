import React from "react";
import { get, round } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePostFileQuery,
  usePostQuery,
} from "@/hooks/api";
import useLanguageStore from "@/store/language-store";

export const FOODS_CATALOG_QUERY_KEY = ["foods", "catalog"];
export const FOODS_QUICK_ADD_QUERY_KEY = ["foods", "quick-add"];
export const FOODS_AUDIO_TRANSCRIPT_HISTORY_QUERY_KEY = [
  "foods",
  "audio-transcript-history",
];

const GRAM_BASED_UNITS = new Set(["g", "ml"]);

// Stable empty references so consumers that use these in useMemo/useEffect deps
// don't get new references on every render and don't cause infinite loops.
const EMPTY_FOODS = [];
const EMPTY_FOOD_MAP = new Map();

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const imagePayload = ({ imageDataUrl, imageUrl }) =>
  imageUrl ? { imageUrl } : { imageDataUrl };

const imageInputToFile = async (input, fallbackName = "meal-capture") => {
  if (typeof File !== "undefined" && input instanceof File) {
    return input;
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    const extension = MIME_EXTENSION_MAP[input.type] ?? "jpg";
    return new File([input], `${fallbackName}.${extension}`, {
      type: input.type || "image/jpeg",
    });
  }

  if (typeof input === "string" && input.startsWith("data:image/")) {
    const response = await fetch(input);
    const blob = await response.blob();
    const extension = MIME_EXTENSION_MAP[blob.type] ?? "jpg";
    return new File([blob], `${fallbackName}.${extension}`, {
      type: blob.type || "image/jpeg",
    });
  }

  throw new Error("Invalid image input");
};

const toNumber = (value, fallback = 0) => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const formatAmount = (value) => {
  const normalized = toNumber(value);
  return Number.isInteger(normalized) ? String(normalized) : String(normalized);
};

const resolveLabel = (translations, fallback, language) => {
  if (translations && typeof translations === "object") {
    const direct = translations[language];
    if (typeof direct === "string" && direct.trim()) {
      return direct.trim();
    }

    const uz = translations.uz;
    if (typeof uz === "string" && uz.trim()) {
      return uz.trim();
    }
  }

  return fallback;
};

const getStepByUnit = (unit) => (GRAM_BASED_UNITS.has(unit) ? 10 : 1);

const getFoodAmount = (food) =>
  Math.max(1, toNumber(food?.servingSize ?? food?.defaultAmount, 100));

const getBaseMacros = (food) => ({
  cal: toNumber(food?.baseCal ?? food?.cal),
  protein: toNumber(food?.baseProtein ?? food?.protein),
  carbs: toNumber(food?.baseCarbs ?? food?.carbs),
  fat: toNumber(food?.baseFat ?? food?.fat),
});

const getResponsePayload = (response) =>
  get(response, "data.data", get(response, "data", null));

const deriveLoggedAmount = (item, catalogFood) => {
  if (item?.grams != null) {
    return toNumber(item.grams, getFoodAmount(catalogFood));
  }

  const baseAmount = getFoodAmount(catalogFood);
  const baseCalories = getBaseMacros(catalogFood).cal;

  if (baseCalories <= 0) {
    return baseAmount;
  }

  const currentCalories = toNumber(item?.cal, baseCalories);
  const factor = currentCalories > 0 ? currentCalories / baseCalories : 1;
  const step = catalogFood?.step ?? getStepByUnit(catalogFood?.unit);
  const derivedAmount = baseAmount * factor;

  return Math.max(step, round(derivedAmount / step) * step);
};

export const createCatalogFood = (food, language) => {
  const unit = food.servingUnit || "g";
  const defaultAmount = Math.max(1, toNumber(food.servingSize, 100));
  const categories = Array.isArray(food.categories)
    ? food.categories.map((category) => ({
        ...category,
        label: resolveLabel(category.translations, category.name, language),
      }))
    : [];
  const primaryCategory = categories[0] || null;
  const baseMacros = {
    cal: toNumber(food.calories),
    protein: toNumber(food.protein),
    carbs: toNumber(food.carbs),
    fat: toNumber(food.fat),
  };

  return {
    id: `food-${food.id}`,
    catalogFoodId: food.id,
    barcode: food.barcode || `food:${food.id}`,
    name: resolveLabel(food.translations, food.name, language),
    originalName: food.name,
    translations: food.translations || {},
    cal: baseMacros.cal,
    protein: baseMacros.protein,
    carbs: baseMacros.carbs,
    fat: baseMacros.fat,
    baseCal: baseMacros.cal,
    baseProtein: baseMacros.protein,
    baseCarbs: baseMacros.carbs,
    baseFat: baseMacros.fat,
    image: food.imageUrl || null,
    grams: defaultAmount,
    defaultAmount,
    unit,
    step: getStepByUnit(unit),
    serving: `${formatAmount(defaultAmount)} ${unit}`,
    maxIntake: food.maxIntake ?? null,
    category: primaryCategory?.label || "Boshqa",
    categoryId: primaryCategory?.id ?? null,
    categoryIds: Array.isArray(food.categoryIds) ? food.categoryIds : [],
    categories,
    isActive: Boolean(food.isActive),
  };
};

export const enrichTrackedMealItem = (item, foodMap) => {
  const catalogFood = item?.barcode ? foodMap.get(item.barcode) : null;

  if (!catalogFood) {
    return item;
  }

  return {
    ...catalogFood,
    ...item,
    image: item.image || catalogFood.image,
    grams: deriveLoggedAmount(item, catalogFood),
  };
};

const useFoodCatalog = () => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data, ...query } = useGetQuery({
    url: "/foods/catalog",
    queryProps: {
      queryKey: FOODS_CATALOG_QUERY_KEY,
    },
  });
  const { data: quickAddData, ...quickAddQuery } = useGetQuery({
    url: "/foods/quick-add",
    queryProps: {
      queryKey: FOODS_QUICK_ADD_QUERY_KEY,
    },
  });

  const categories = React.useMemo(
    () =>
      get(data, "data.data.categories", []).map((category) => ({
        ...category,
        label: resolveLabel(
          category.translations,
          category.name,
          currentLanguage,
        ),
      })),
    [data, currentLanguage],
  );

  const quickAdd = React.useMemo(
    () => get(quickAddData, "data.data", { favorites: [], recent: [] }),
    [quickAddData],
  );

  const favoriteIdSet = React.useMemo(
    () => new Set(get(quickAdd, "favorites", []).map((food) => food.id)),
    [quickAdd],
  );

  const favorites = React.useMemo(
    () =>
      get(quickAdd, "favorites", []).map((food) => ({
        ...createCatalogFood(food, currentLanguage),
        isFavorite: true,
      })),
    [currentLanguage, quickAdd],
  );

  const recentFoods = React.useMemo(
    () =>
      get(quickAdd, "recent", []).map((food) => ({
        ...createCatalogFood(food, currentLanguage),
        isFavorite: favoriteIdSet.has(food.id),
      })),
    [currentLanguage, favoriteIdSet, quickAdd],
  );

  return {
    ...query,
    quickAddQuery,
    categories,
    favorites,
    recentFoods,
    favoriteIdSet,
    // Kept for backward compat with components that haven't migrated to useFoodsByCategory.
    // Use stable module-level constants so consumers don't get new references on every render.
    foods: EMPTY_FOODS,
    foodMap: EMPTY_FOOD_MAP,
  };
};

export const useFoodsByCategory = (categoryId) => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const { data, ...query } = useGetQuery({
    url: "/foods/catalog",
    params: categoryId ? { categoryId } : undefined,
    queryProps: {
      queryKey: ["foods", "catalog", "category", categoryId],
      enabled: !!categoryId,
    },
  });

  const foods = React.useMemo(
    () =>
      get(data, "data.data.foods", []).map((food) =>
        createCatalogFood(food, currentLanguage),
      ),
    [data, currentLanguage],
  );

  return { ...query, foods };
};

export const useFoodQuickAddActions = () => {
  const queryClient = useQueryClient();
  const addFavoriteMutation = usePostQuery();
  const removeFavoriteMutation = useDeleteQuery();

  const invalidateQuickAdd = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: FOODS_QUICK_ADD_QUERY_KEY,
    });
  }, [queryClient]);

  const addFavoriteFood = React.useCallback(
    async (catalogFoodId) => {
      if (!catalogFoodId) {
        return;
      }

      await addFavoriteMutation.mutateAsync({
        url: `/foods/favorites/${catalogFoodId}`,
      });
      await invalidateQuickAdd();
    },
    [addFavoriteMutation, invalidateQuickAdd],
  );

  const removeFavoriteFood = React.useCallback(
    async (catalogFoodId) => {
      if (!catalogFoodId) {
        return;
      }

      await removeFavoriteMutation.mutateAsync({
        url: `/foods/favorites/${catalogFoodId}`,
      });
      await invalidateQuickAdd();
    },
    [invalidateQuickAdd, removeFavoriteMutation],
  );

  const toggleFavoriteFood = React.useCallback(
    async (food) => {
      if (!food?.catalogFoodId) {
        return;
      }

      if (food.isFavorite) {
        await removeFavoriteFood(food.catalogFoodId);
        return;
      }

      await addFavoriteFood(food.catalogFoodId);
    },
    [addFavoriteFood, removeFavoriteFood],
  );

  return {
    addFavoriteFood,
    removeFavoriteFood,
    toggleFavoriteFood,
    isUpdatingFavorite:
      addFavoriteMutation.isPending || removeFavoriteMutation.isPending,
  };
};

export const useFoodScan = () => {
  const currentLanguage = useLanguageStore((state) => state.currentLanguage);
  const postMutation = usePostQuery();
  const textMutation = usePostQuery();
  const draftImageMutation = usePostQuery();
  const draftTextMutation = usePostQuery();
  const ingredientMutation = usePostQuery();
  const uploadMutation = usePostFileQuery({});
  const audioMutation = usePostQuery();

  const normalizeScanItems = React.useCallback(
    (items = []) =>
      items
        .map((item, index) => {
          const food = get(item, "food");

          if (!food) {
            return null;
          }

          const catalogFood = createCatalogFood(food, currentLanguage);

          return {
            ...catalogFood,
            scanId: get(item, "id", `scan-${index + 1}`),
            grams: Math.max(
              catalogFood.step || 1,
              toNumber(get(item, "portionGrams"), catalogFood.defaultAmount),
            ),
            confidence: toNumber(get(item, "confidence"), 0),
            reason: get(item, "reason", null),
          };
        })
        .filter(Boolean),
    [currentLanguage],
  );

  const scanMealImage = React.useCallback(
    async ({ imageDataUrl, imageUrl }) => {
      const response = await postMutation.mutateAsync({
        url: "/foods/scan-meal",
        attributes: {
          ...imagePayload({ imageDataUrl, imageUrl }),
          mode: "ai",
        },
      });
      const payload = getResponsePayload(response);

      return normalizeScanItems(get(payload, "items", []));
    },
    [normalizeScanItems, postMutation],
  );

  const normalizeDraftIngredient = React.useCallback(
    (ingredient = {}, fallbackId = "ingredient-1") => {
      const grams = toNumber(
        get(ingredient, "grams"),
        toNumber(get(ingredient, "estimatedGrams"), 100),
      );
      const baseGrams = toNumber(
        get(ingredient, "baseGrams"),
        toNumber(get(ingredient, "estimatedGrams"), grams),
      );

      return {
        id: get(ingredient, "id", fallbackId),
        name: String(get(ingredient, "name", "Ingredient")).trim(),
        grams,
        baseGrams: baseGrams || grams,
        estimatedGrams: toNumber(get(ingredient, "estimatedGrams"), grams),
        estimatedQuantity:
          get(ingredient, "estimatedQuantity") == null
            ? null
            : toNumber(get(ingredient, "estimatedQuantity"), null),
        estimatedUnit: get(ingredient, "estimatedUnit", null),
        nutritionSource: get(ingredient, "nutritionSource", null),
        matchStatus: get(ingredient, "matchStatus", "unmatched"),
        reviewNeeded: Boolean(get(ingredient, "reviewNeeded")),
        matchedFood: get(ingredient, "matchedFood", null),
        nutrition: get(ingredient, "nutrition", null),
      };
    },
    [],
  );

  const normalizeDraftItems = React.useCallback(
    (items = []) =>
      items
        .map((item, index) => ({
          id: get(item, "id", `draft-${index + 1}`),
          title: String(get(item, "title", `Meal ${index + 1}`)).trim(),
          confidence: toNumber(get(item, "confidence"), 0),
          portionGrams: toNumber(get(item, "portionGrams"), 0),
          aiNotes: get(item, "aiNotes", null),
          reviewNeeded: Boolean(get(item, "reviewNeeded")),
          nutritionSource: get(item, "nutritionSource", "none"),
          nutrition: {
            calories: toNumber(get(item, "nutrition.calories"), 0),
            protein: toNumber(get(item, "nutrition.protein"), 0),
            carbs: toNumber(get(item, "nutrition.carbs"), 0),
            fat: toNumber(get(item, "nutrition.fat"), 0),
            fiber: toNumber(get(item, "nutrition.fiber"), 0),
          },
          ingredients: (Array.isArray(get(item, "ingredients"))
            ? get(item, "ingredients")
            : []
          ).map((ingredient, ingredientIndex) =>
            normalizeDraftIngredient(
              ingredient,
              `${get(item, "id", `draft-${index + 1}`)}-ingredient-${ingredientIndex + 1}`,
            ),
          ),
        }))
        .filter((item) => item.title),
    [normalizeDraftIngredient],
  );

  return {
    scanMealImage,
    analyzeMealImageDraft: async ({ imageDataUrl, imageUrl }) => {
      const response = await draftImageMutation.mutateAsync({
        url: "/foods/analyze-meal-image",
        attributes: {
          ...imagePayload({ imageDataUrl, imageUrl }),
          mode: "ai",
        },
      });
      const payload = getResponsePayload(response);

      return {
        source: get(payload, "source", "camera"),
        items: normalizeDraftItems(get(payload, "items", [])),
      };
    },
    scanMealText: async ({ text, mode = "text" }) => {
      const response = await textMutation.mutateAsync({
        url: "/foods/scan-meal-text",
        attributes: {
          text,
          mode,
        },
      });
      const payload = getResponsePayload(response);

      return normalizeScanItems(get(payload, "items", []));
    },
    analyzeMealTextDraft: async ({ text, mode = "text" }) => {
      const response = await draftTextMutation.mutateAsync({
        url: "/foods/analyze-meal-text",
        attributes: {
          text,
          mode,
        },
      });
      const payload = getResponsePayload(response);

      return {
        source: get(payload, "source", mode),
        items: normalizeDraftItems(get(payload, "items", [])),
      };
    },
    analyzeIngredient: async ({ name, grams }) => {
      const response = await ingredientMutation.mutateAsync({
        url: "/foods/analyze-ingredient",
        attributes: {
          name,
          grams,
        },
      });
      const payload = getResponsePayload(response);

      return normalizeDraftIngredient(
        get(payload, "ingredient", payload),
        "ingredient-1",
      );
    },
    uploadMealCapture: async (imageInput) => {
      const file = await imageInputToFile(imageInput);
      const formData = new FormData();
      formData.append("file", file);

      const response = await uploadMutation.mutateAsync({
        url: "/foods/upload-meal-capture",
        attributes: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
      const payload = getResponsePayload(response);

      return get(payload, "imageUrl", null);
    },
    transcribeMealAudio: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await audioMutation.mutateAsync({
        url: "/foods/transcribe-meal-audio",
        attributes: formData,
      });
      const payload = getResponsePayload(response);

      return {
        transcript: String(get(payload, "transcript", "")).trim(),
        confidence: toNumber(get(payload, "confidence"), 0),
      };
    },
    isScanning: postMutation.isPending,
    isScanningText: textMutation.isPending,
    isAnalyzingDraftImage: draftImageMutation.isPending,
    isAnalyzingDraftText: draftTextMutation.isPending,
    isAnalyzingIngredient: ingredientMutation.isPending,
    isUploadingCapture: uploadMutation.isPending,
    isTranscribingAudio: audioMutation.isPending,
  };
};

export const useFoodAudioTranscriptHistory = () => {
  const queryClient = useQueryClient();
  const { data, ...query } = useGetQuery({
    url: "/foods/audio-transcript-history",
    queryProps: {
      queryKey: FOODS_AUDIO_TRANSCRIPT_HISTORY_QUERY_KEY,
    },
  });
  const postMutation = usePostQuery();
  const deleteMutation = useDeleteQuery();

  const items = React.useMemo(
    () => get(data, "data.data.items", get(data, "data.items", [])),
    [data],
  );

  const invalidateHistory = React.useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: FOODS_AUDIO_TRANSCRIPT_HISTORY_QUERY_KEY,
    });
  }, [queryClient]);

  const saveHistoryItem = React.useCallback(
    async (payload) => {
      await postMutation.mutateAsync({
        url: "/foods/audio-transcript-history",
        attributes: payload,
      });
      await invalidateHistory();
    },
    [invalidateHistory, postMutation],
  );

  const removeHistoryItem = React.useCallback(
    async (historyId) => {
      if (!historyId) {
        return;
      }

      await deleteMutation.mutateAsync({
        url: `/foods/audio-transcript-history/${historyId}`,
      });
      await invalidateHistory();
    },
    [deleteMutation, invalidateHistory],
  );

  const clearHistory = React.useCallback(async () => {
    await deleteMutation.mutateAsync({
      url: "/foods/audio-transcript-history",
    });
    await invalidateHistory();
  }, [deleteMutation, invalidateHistory]);

  return {
    ...query,
    items,
    saveHistoryItem,
    removeHistoryItem,
    clearHistory,
    isSavingHistory: postMutation.isPending,
    isRemovingHistory: deleteMutation.isPending,
  };
};

export default useFoodCatalog;
