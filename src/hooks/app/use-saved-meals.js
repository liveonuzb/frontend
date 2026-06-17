import React from "react";
import get from "lodash/get";
import find from "lodash/find";
import map from "lodash/map";
import trim from "lodash/trim";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteQuery, useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import {
  buildMealIngredientsPayload,
  getMealIngredientTotals,
} from "@/modules/user/containers/nutrition/meal-ingredients.js";
import { normalizeSavedMeal } from "@/modules/user/lib/nutrition-normalizers";
import { toast } from "sonner";
import {
  NUTRITION_SAVED_MEALS_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import {
  NUTRITION_SAVED_MEALS_QUERY_KEY,
  invalidateSavedMeals,
} from "@/hooks/app/nutrition-query-keys";

export const SAVED_MEALS_QUERY_KEY = NUTRITION_SAVED_MEALS_QUERY_KEY;
const nutritionSavedMealsPath = (path) =>
  nutritionApiPath(NUTRITION_SAVED_MEALS_API_ROOT, path);

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", null));

export { normalizeSavedMeal };

export const buildSavedMealPayload = (meal = {}) => ({
  name: trim(String(meal?.name || "")),
  source: meal?.source || null,
  imageUrl: meal?.imageUrl || null,
  ingredients: buildMealIngredientsPayload(meal?.ingredients),
});

export const useSavedMeals = (options = {}) => {
  const { data, ...query } = useGetQuery({
    url: nutritionSavedMealsPath(),
    queryProps: {
      queryKey: SAVED_MEALS_QUERY_KEY,
      enabled: options.enabled ?? true,
    },
  });

  const items = React.useMemo(
    () => map(getPayload(data)?.items, normalizeSavedMeal) || [],
    [data],
  );

  return {
    ...query,
    items,
  };
};

export const useSavedMealsActions = () => {
  const queryClient = useQueryClient();
  const postMutation = usePostQuery();
  const patchMutation = usePatchQuery();
  const deleteMutation = useDeleteQuery();

  const invalidate = React.useCallback(
    () => invalidateSavedMeals(queryClient),
    [queryClient],
  );

  const createSavedMeal = React.useCallback(
    async (meal) => {
      const payload = buildSavedMealPayload(meal);
      const totals = getMealIngredientTotals(payload.ingredients);
      const currentItems =
        map(
          getPayload(queryClient.getQueryData(SAVED_MEALS_QUERY_KEY))?.items,
          normalizeSavedMeal,
        ) || [];
      const duplicate = find(currentItems, (item) => {
        const sameName =
          toLower(trim(item.name)) === toLower(trim(payload.name));
        const closeCalories =
          Math.abs(toNumber(item.calories || 0) - toNumber(totals.calories || 0)) <=
          25;
        return sameName && closeCalories;
      });

      if (duplicate) {
        toast.warning(`Bunday ovqat allaqachon saqlangan: ${duplicate.name}`, {
          action: {
            label: "Ko'rish",
            onClick: () => undefined,
          },
        });
        return duplicate;
      }

      const response = await postMutation.mutateAsync({
        url: nutritionSavedMealsPath(),
        attributes: payload,
      });
      await invalidate();
      return normalizeSavedMeal(getPayload(response));
    },
    [invalidate, postMutation, queryClient],
  );

  const updateSavedMeal = React.useCallback(
    async (savedMealId, meal) => {
      const response = await patchMutation.mutateAsync({
        url: nutritionSavedMealsPath(savedMealId),
        attributes: buildSavedMealPayload(meal),
      });
      await invalidate();
      return normalizeSavedMeal(getPayload(response));
    },
    [invalidate, patchMutation],
  );

  const deleteSavedMeal = React.useCallback(
    async (savedMealId) => {
      await deleteMutation.mutateAsync({
        url: nutritionSavedMealsPath(savedMealId),
      });
      await invalidate();
    },
    [deleteMutation, invalidate],
  );

  return {
    createSavedMeal,
    updateSavedMeal,
    deleteSavedMeal,
    isSaving:
      postMutation.isPending || patchMutation.isPending || deleteMutation.isPending,
  };
};
