import React from "react";
import { get } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteQuery, useGetQuery, usePatchQuery, usePostQuery } from "@/hooks/api";
import {
  buildMealIngredientsPayload,
  getMealIngredientTotals,
  normalizeMealIngredients,
  normalizeMealNutrition,
  toNumber,
} from "@/modules/user/containers/nutrition/meal-ingredients.js";
import { toast } from "sonner";

export const SAVED_MEALS_QUERY_KEY = ["user", "saved-meals"];

const getPayload = (response) =>
  get(response, "data.data", get(response, "data", null));

export const normalizeSavedMeal = (item = {}) => {
  const ingredients = normalizeMealIngredients(item?.ingredients);
  const nutrition = normalizeMealNutrition({
    calories: item?.calories,
    protein: item?.protein,
    carbs: item?.carbs,
    fat: item?.fat,
    fiber: item?.fiber,
  });

  return {
    id: item?.id,
    name: item?.name || "Taom",
    source: item?.source || "saved-meal",
    imageUrl: item?.imageUrl || null,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fiber: nutrition.fiber,
    createdAt: item?.createdAt || null,
    updatedAt: item?.updatedAt || null,
    lastUsedAt: item?.lastUsedAt || null,
    ingredients,
    grams: ingredients.reduce(
      (sum, ingredient) => sum + Math.max(0, toNumber(ingredient.grams, 0)),
      0,
    ),
  };
};

const buildSavedMealPayload = (meal = {}) => ({
  name: String(meal?.name || "").trim(),
  source: meal?.source || null,
  imageUrl: meal?.imageUrl || null,
  ingredients: buildMealIngredientsPayload(meal?.ingredients),
});

export const useSavedMeals = (options = {}) => {
  const { data, ...query } = useGetQuery({
    url: "/users/me/saved-meals",
    queryProps: {
      queryKey: SAVED_MEALS_QUERY_KEY,
      enabled: options.enabled ?? true,
    },
  });

  const items = React.useMemo(
    () => getPayload(data)?.items?.map(normalizeSavedMeal) || [],
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
    () =>
      queryClient.invalidateQueries({
        queryKey: SAVED_MEALS_QUERY_KEY,
      }),
    [queryClient],
  );

  const createSavedMeal = React.useCallback(
    async (meal) => {
      const payload = buildSavedMealPayload(meal);
      const totals = getMealIngredientTotals(payload.ingredients);
      const currentItems =
        getPayload(queryClient.getQueryData(SAVED_MEALS_QUERY_KEY))?.items?.map(
          normalizeSavedMeal,
        ) || [];
      const duplicate = currentItems.find((item) => {
        const sameName =
          item.name.trim().toLowerCase() === payload.name.trim().toLowerCase();
        const closeCalories =
          Math.abs(Number(item.calories || 0) - Number(totals.calories || 0)) <=
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
        url: "/users/me/saved-meals",
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
        url: `/users/me/saved-meals/${savedMealId}`,
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
        url: `/users/me/saved-meals/${savedMealId}`,
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
