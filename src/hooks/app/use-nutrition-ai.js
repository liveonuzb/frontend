import React from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import map from "lodash/map";
import trim from "lodash/trim";
import toNumber from "lodash/toNumber";
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

const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = toNumber(value);
  return Number.isFinite(numeric) ? numeric : null;
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

export const normalizePantryItem = (item = {}) => ({
  id: get(item, "id"),
  ingredientId: get(item, "ingredientId", null),
  name: trim(String(get(item, "name", ""))),
  quantity: toNumber(get(item, "quantity"), 0),
  unit: get(item, "unit", ""),
  grams: toNullableNumber(get(item, "grams")),
  source: get(item, "source", "manual"),
  confidence: toNullableNumber(get(item, "confidence")),
  expiresAt: get(item, "expiresAt", null),
  notes: get(item, "notes", null),
  ingredient: get(item, "ingredient", null),
});

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
    url: "/user/nutrition-ai/pantry",
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
    const items = get(payload, "items", isArray(payload) ? payload : []);
    return map(isArray(items) ? items : [], normalizePantryItem);
  }, [pantryQuery.data]);

  const createPantryItem = React.useCallback(
    async (attributes) => {
      const response = await createMutation.mutateAsync({
        url: "/user/nutrition-ai/pantry/items",
        attributes,
      });
      return normalizePantryItem(responsePayload(response, {}));
    },
    [createMutation],
  );

  const updatePantryItem = React.useCallback(
    async (id, attributes) => {
      const response = await updateMutation.mutateAsync({
        url: `/user/nutrition-ai/pantry/items/${id}`,
        attributes,
      });
      return normalizePantryItem(responsePayload(response, {}));
    },
    [updateMutation],
  );

  const deletePantryItem = React.useCallback(
    async (id) =>
      deleteMutation.mutateAsync({
        url: `/user/nutrition-ai/pantry/items/${id}`,
      }),
    [deleteMutation],
  );

  const scanPantryImage = React.useCallback(
    async (imageInput) => {
      const file = await imageInputToFile(imageInput);
      const formData = new FormData();
      formData.append("file", file);

      const response = await scanMutation.mutateAsync({
        url: "/user/nutrition-ai/pantry/scan",
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
        suggestions: isArray(get(payload, "suggestions"))
          ? get(payload, "suggestions")
          : [],
        reviewOnly: get(payload, "reviewOnly", true),
      };
    },
    [invalidateAiAccess, queryClient, scanMutation],
  );

  const getRecipeAssistant = React.useCallback(
    async (attributes) => {
      const response = await recipeMutation.mutateAsync({
        url: "/user/nutrition-ai/recipe-assistant",
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
        url: "/user/nutrition-ai/substitutions",
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
