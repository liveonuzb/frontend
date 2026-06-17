import React from "react";
import {
  clamp,
  filter,
  floor,
  get,
  includes,
  isArray,
  isDate,
  isFinite as isFiniteNumber,
  isNil,
  isPlainObject,
  map,
  toLower,
  toNumber,
  trim,
} from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostFileQuery,
  usePostQuery,
} from "@/hooks/api";
import { getApiResponseData } from "@/lib/api-response.js";
import {
  AI_USAGE_STATUS_QUERY_KEY,
  useAiAccessInvalidation,
} from "@/hooks/app/use-ai-access";
import {
  NUTRITION_AI_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";

export const NUTRITION_AI_QUERY_KEY = ["user", "nutrition-ai"];
export const NUTRITION_AI_PANTRY_QUERY_KEY = [
  ...NUTRITION_AI_QUERY_KEY,
  "pantry",
];

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const responsePayload = (response, fallback = null) =>
  getApiResponseData(response, fallback);

const MAX_PANTRY_AMOUNT = 1000000;

const isBlankString = (value) =>
  typeof value === "string" && trim(value).length === 0;

const hasValue = (value) => !isNil(value) && !isBlankString(value);

const toFiniteNumberOrNull = (value) => {
  if (!hasValue(value)) {
    return null;
  }

  const numeric = toNumber(value);
  return isFiniteNumber(numeric) ? numeric : null;
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const numeric = toFiniteNumberOrNull(value);

  return isNil(numeric) ? fallback : clamp(numeric, 0, MAX_PANTRY_AMOUNT);
};

const toNullableNumber = (value) => {
  const numeric = toFiniteNumberOrNull(value);

  return isNil(numeric) ? null : clamp(numeric, 0, MAX_PANTRY_AMOUNT);
};

const toNullablePositiveInteger = (value) => {
  const numeric = toFiniteNumberOrNull(value);

  return !isNil(numeric) && numeric > 0 ? floor(numeric) : null;
};

const normalizeText = (value, fallback = "") => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = trim(value);
  return normalized || fallback;
};

const normalizeNullableText = (value) => {
  const normalized = normalizeText(value, "");

  return normalized || null;
};

const normalizeId = (value) => (hasValue(value) ? String(value) : null);

const normalizeDateValue = (value) => {
  if (!hasValue(value)) {
    return null;
  }

  const date = isDate(value) ? value : new Date(value);
  return isFiniteNumber(date.getTime()) ? date.toISOString() : null;
};

const normalizeConfidence = (value) => {
  const numeric = toFiniteNumberOrNull(value);

  return isNil(numeric) ? null : clamp(numeric, 0, 1);
};

const normalizeBoolean = (value) => {
  if (value === true || value === 1) {
    return true;
  }

  if (value === false || value === 0) {
    return false;
  }

  if (typeof value !== "string") {
    return false;
  }

  return includes(["true", "1", "yes"], toLower(trim(value)));
};

const getIngredientFallbackName = (ingredient) =>
  isPlainObject(ingredient)
    ? normalizeText(
        get(ingredient, "name") ||
          get(ingredient, "title") ||
          get(ingredient, "label"),
      )
    : "";

const getPantryItemsSource = (payload) => {
  if (isArray(payload)) {
    return payload;
  }

  if (isArray(get(payload, "items"))) {
    return get(payload, "items");
  }

  if (isArray(get(payload, "data"))) {
    return get(payload, "data");
  }

  return [];
};

const imageInputToFile = async (input, fallbackName = "pantry-scan") => {
  if (typeof File !== "undefined" && input instanceof File) {
    return input;
  }

  if (typeof Blob !== "undefined" && input instanceof Blob) {
    const extension = MIME_EXTENSION_MAP[input.type] ?? "jpg";
    return new File([input], `${fallbackName}.${extension}`, {
      type: input.type || "image/jpeg",
    });
  }

  throw new Error("Invalid pantry image input");
};

export const normalizePantryItem = (item = {}) => {
  if (!isPlainObject(item)) {
    return null;
  }

  const ingredient = isPlainObject(get(item, "ingredient"))
    ? get(item, "ingredient")
    : null;
  const name =
    normalizeText(get(item, "name")) || getIngredientFallbackName(ingredient);

  if (!name) {
    return null;
  }

  return {
    id: normalizeId(get(item, "id")),
    ingredientId: toNullablePositiveInteger(get(item, "ingredientId")),
    name,
    quantity: toNonNegativeNumber(get(item, "quantity")),
    unit: normalizeText(get(item, "unit")),
    grams: toNullableNumber(get(item, "grams")),
    source: normalizeText(get(item, "source"), "manual"),
    confidence: normalizeConfidence(get(item, "confidence")),
    expiresAt: normalizeDateValue(get(item, "expiresAt")),
    notes: normalizeNullableText(get(item, "notes")),
    ingredient,
  };
};

const normalizePantryScanSuggestion = (suggestion = {}) => {
  if (!isPlainObject(suggestion)) {
    return null;
  }

  const name =
    normalizeText(get(suggestion, "name")) ||
    normalizeText(get(suggestion, "ingredientName"));

  if (!name) {
    return null;
  }

  const normalized = {
    ...suggestion,
    name,
    ingredientId: toNullablePositiveInteger(get(suggestion, "ingredientId")),
    confidence: normalizeConfidence(get(suggestion, "confidence")),
  };

  if (hasValue(get(suggestion, "category"))) {
    normalized.category = normalizeText(get(suggestion, "category"));
  }

  if (!isNil(get(suggestion, "needsReview"))) {
    normalized.needsReview = normalizeBoolean(get(suggestion, "needsReview"));
  }

  return normalized;
};

export const normalizeNutritionAiCards = (cards = []) =>
  map(isArray(cards) ? cards : [], (card) => ({
    type: get(card, "type", "info"),
    title: get(card, "title", ""),
    items: isArray(get(card, "items")) ? get(card, "items") : [],
  }));

export const useNutritionAiPantry = (options = {}) => {
  const enabled = options.enabled ?? true;
  const queryClient = useQueryClient();
  const { invalidateAiAccess } = useAiAccessInvalidation();
  const pantryQuery = useGetQuery({
    url: nutritionApiPath(NUTRITION_AI_API_ROOT, "pantry"),
    queryProps: {
      queryKey: NUTRITION_AI_PANTRY_QUERY_KEY,
      enabled,
    },
  });
  const createMutation = usePostQuery({ queryKey: NUTRITION_AI_PANTRY_QUERY_KEY });
  const updateMutation = usePatchQuery({ queryKey: NUTRITION_AI_PANTRY_QUERY_KEY });
  const deleteMutation = useDeleteQuery({ queryKey: NUTRITION_AI_PANTRY_QUERY_KEY });
  const scanMutation = usePostFileQuery({ queryKey: NUTRITION_AI_PANTRY_QUERY_KEY });
  const recipeMutation = usePostQuery();
  const substitutionMutation = usePostQuery();

  const pantryItems = React.useMemo(() => {
    const payload = responsePayload(pantryQuery.data, {});
    return filter(map(getPantryItemsSource(payload), normalizePantryItem), Boolean);
  }, [pantryQuery.data]);

  const createPantryItem = React.useCallback(
    async (attributes) => {
      const response = await createMutation.mutateAsync({
        url: nutritionApiPath(NUTRITION_AI_API_ROOT, "pantry/items"),
        attributes,
      });
      return normalizePantryItem(responsePayload(response, {}));
    },
    [createMutation],
  );

  const updatePantryItem = React.useCallback(
    async (id, attributes) => {
      const response = await updateMutation.mutateAsync({
        url: nutritionApiPath(NUTRITION_AI_API_ROOT, `pantry/items/${id}`),
        attributes,
      });
      return normalizePantryItem(responsePayload(response, {}));
    },
    [updateMutation],
  );

  const deletePantryItem = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: nutritionApiPath(NUTRITION_AI_API_ROOT, `pantry/items/${id}`),
      }),
    [deleteMutation],
  );

  const scanPantryImage = React.useCallback(
    async (imageInput) => {
      const file = await imageInputToFile(imageInput);
      const formData = new FormData();
      formData.append("file", file);

      const response = await scanMutation.mutateAsync({
        url: nutritionApiPath(NUTRITION_AI_API_ROOT, "pantry/scan"),
        attributes: formData,
        config: {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      });
      const payload = responsePayload(response, {});
      await invalidateAiAccess();
      await queryClient.invalidateQueries({ queryKey: AI_USAGE_STATUS_QUERY_KEY });

      return {
        suggestions: filter(
          map(
            isArray(get(payload, "suggestions"))
              ? get(payload, "suggestions")
              : [],
            normalizePantryScanSuggestion,
          ),
          Boolean,
        ),
        reviewOnly: get(payload, "reviewOnly", true),
      };
    },
    [invalidateAiAccess, queryClient, scanMutation],
  );

  const getRecipeAssistant = React.useCallback(
    async (attributes) => {
      const response = await recipeMutation.mutateAsync({
        url: nutritionApiPath(NUTRITION_AI_API_ROOT, "recipe-assistant"),
        attributes,
      });
      const payload = responsePayload(response, {});
      await invalidateAiAccess();
      return {
        ...payload,
        cards: normalizeNutritionAiCards(get(payload, "cards", [])),
      };
    },
    [invalidateAiAccess, recipeMutation],
  );

  const getSubstitutions = React.useCallback(
    async (attributes) => {
      const response = await substitutionMutation.mutateAsync({
        url: nutritionApiPath(NUTRITION_AI_API_ROOT, "substitutions"),
        attributes,
      });
      const payload = responsePayload(response, {});
      await invalidateAiAccess();
      return {
        ...payload,
        substitutions: isArray(get(payload, "substitutions"))
          ? get(payload, "substitutions")
          : [],
      };
    },
    [invalidateAiAccess, substitutionMutation],
  );

  return {
    ...pantryQuery,
    pantryItems,
    createPantryItem,
    updatePantryItem,
    deletePantryItem,
    scanPantryImage,
    getRecipeAssistant,
    getSubstitutions,
    isCreatingPantryItem: createMutation.isPending,
    isUpdatingPantryItem: updateMutation.isPending,
    isDeletingPantryItem: deleteMutation.isPending,
    isScanningPantry: scanMutation.isPending,
    isRecipeAssistantPending: recipeMutation.isPending,
    isSubstitutionPending: substitutionMutation.isPending,
  };
};
