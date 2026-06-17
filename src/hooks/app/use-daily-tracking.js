import React from "react";
import get from "lodash/get";
import clamp from "lodash/clamp";
import find from "lodash/find";
import filter from "lodash/filter";
import map from "lodash/map";
import some from "lodash/some";
import split from "lodash/split";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
import slice from "lodash/slice";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
  usePutQuery,
} from "@/hooks/api";
import { trackCampaignConversion } from "@/lib/analytics.js";
import {
  NUTRITION_DAYS_API_ROOT,
  NUTRITION_HISTORY_API_ROOT,
  NUTRITION_MEALS_API_ROOT,
  NUTRITION_TRACKING_API_ROOT,
  nutritionApiPath,
} from "@/hooks/app/nutrition-api-paths";
import {
  getNutritionDayQueryKey,
  getNutritionHistoryQueryKey,
  invalidateNutritionDashboard,
  invalidateNutritionMealMutationQueries,
} from "@/hooks/app/nutrition-query-keys";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import {
  buildMealIngredientsPayload,
  getMealIngredientTotals,
} from "@/modules/user/containers/nutrition/meal-ingredients.js";
import {
  trackNutritionMealDeleted,
  trackNutritionMealEdited,
  trackNutritionMealLogged,
} from "@/modules/user/containers/nutrition/scan-review-analytics.js";
import {
  createEmptyDayData,
  normalizeDateKey,
  normalizeDayData,
  normalizeMealItem,
} from "@/modules/user/lib/nutrition-normalizers";

const WORKOUT_OVERVIEW_QUERY_KEY = ["user", "workout", "overview"];
const WORKOUT_PLAN_QUERY_KEY = ["user", "workout", "plans"];
const nutritionMealsPath = (path) =>
  nutritionApiPath(NUTRITION_MEALS_API_ROOT, path);
const nutritionDaysPath = (path) =>
  nutritionApiPath(NUTRITION_DAYS_API_ROOT, path);
const nutritionHistoryPath = (path = "") =>
  nutritionApiPath(NUTRITION_HISTORY_API_ROOT, path);
const nutritionTrackingPath = (path) =>
  nutritionApiPath(NUTRITION_TRACKING_API_ROOT, path);

let duplicateMealConfirmHandler = null;

export const setMealDuplicateConfirmHandler = (handler) => {
  duplicateMealConfirmHandler = handler;

  return () => {
    if (duplicateMealConfirmHandler === handler) {
      duplicateMealConfirmHandler = null;
    }
  };
};

export const getTodayKey = () => split(new Date().toISOString(), "T")[0];

export { createEmptyDayData, normalizeDateKey, normalizeDayData };

const getTrackingPayload = (source, fallback = {}) =>
  get(source, "data.data", get(source, "data", fallback));

export const getDailyTrackingQueryKey = getNutritionDayQueryKey;

const setTrackingCache = (queryClient, dayData) => {
  const normalized = normalizeDayData(dayData);
  queryClient.setQueryData(getDailyTrackingQueryKey(normalized.date), {
    data: normalized,
  });
  return normalized;
};

const getCachedDayData = (queryClient, date) =>
  normalizeDayData(getTrackingPayload(queryClient.getQueryData(getDailyTrackingQueryKey(date))));

const buildMealPayload = (mealType, food = {}) => {
  const ingredientPayload = buildMealIngredientsPayload(food.ingredients);
  const ingredientTotals = ingredientPayload.length
    ? getMealIngredientTotals(ingredientPayload)
    : null;

  return {
    mealType,
    source: food.source ?? null,
    savedMealId: food.savedMealId ?? null,
    name: food.name,
    barcode: food.barcode ?? null,
    calories: ingredientTotals?.calories ?? food.cal ?? 0,
    protein: ingredientTotals?.protein ?? food.protein ?? 0,
    carbs: ingredientTotals?.carbs ?? food.carbs ?? 0,
    fat: ingredientTotals?.fat ?? food.fat ?? 0,
    fiber: ingredientTotals?.fiber ?? food.fiber ?? 0,
    quantity: food.qty ?? 1,
    imageUrl: food.image ?? null,
    ...(ingredientPayload.length ? { ingredients: ingredientPayload } : {}),
    addedAt: food.addedAt ?? undefined,
  };
};

const buildMealPatchPayload = (mealType, patch = {}) => {
  const payload = {};

  if (mealType) payload.mealType = mealType;
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.barcode !== undefined) payload.barcode = patch.barcode;
  if (patch.source !== undefined) payload.source = patch.source;
  if (patch.savedMealId !== undefined) payload.savedMealId = patch.savedMealId;
  if (patch.cal !== undefined) payload.calories = patch.cal;
  if (patch.protein !== undefined) payload.protein = patch.protein;
  if (patch.carbs !== undefined) payload.carbs = patch.carbs;
  if (patch.fat !== undefined) payload.fat = patch.fat;
  if (patch.fiber !== undefined) payload.fiber = patch.fiber;
  if (patch.qty !== undefined) payload.quantity = patch.qty;
  if (patch.image !== undefined) payload.imageUrl = patch.image;
  if (patch.ingredients !== undefined) {
    payload.ingredients = buildMealIngredientsPayload(patch.ingredients);
    if (payload.ingredients.length) {
      const totals = getMealIngredientTotals(payload.ingredients);
      payload.calories = totals.calories;
      payload.protein = totals.protein;
      payload.carbs = totals.carbs;
      payload.fat = totals.fat;
      payload.fiber = totals.fiber;
    }
  }
  if (patch.addedAt !== undefined) payload.addedAt = patch.addedAt;

  return payload;
};

const normalizeMealDuplicateName = (value) =>
  toLower(trim(String(value || "")));

const getCatalogFoodDuplicateId = (meal = {}) => {
  const direct = trim(String(meal.catalogFoodId ?? meal.foodId ?? ""));

  if (direct) {
    return direct;
  }

  const barcode = trim(String(meal.barcode || ""));
  const catalogBarcodeMatch = barcode.match(/^food:(.+)$/);

  return catalogBarcodeMatch?.[1] || null;
};

const normalizeMealDuplicateGrams = (meal = {}) => {
  const grams = toNumber(
    meal.grams ?? meal.defaultAmount ?? meal.servingSize,
    null,
  );

  if (!Number.isFinite(grams)) {
    return null;
  }

  return Math.round(grams * 100) / 100;
};

export const buildMealDuplicateKey = (meal = {}, mealType = "unknown") => {
  const normalizedMealType = trim(String(mealType || "unknown"));

  if (meal.savedMealId) {
    return `saved:${normalizedMealType}:${meal.savedMealId}`;
  }

  const grams = normalizeMealDuplicateGrams(meal);

  if (grams == null) {
    return null;
  }

  const catalogFoodId = getCatalogFoodDuplicateId(meal);

  if (catalogFoodId) {
    return `catalog:${normalizedMealType}:${catalogFoodId}:${grams}`;
  }

  const name = normalizeMealDuplicateName(meal.name);

  return name ? `name:${normalizedMealType}:${name}:${grams}` : null;
};

const isDuplicateMeal = (currentMeals = [], nextMeal = {}, mealType) => {
  const nextKey = buildMealDuplicateKey(nextMeal, mealType);

  return Boolean(nextKey) &&
    some(
      currentMeals,
      (meal) => buildMealDuplicateKey(meal, mealType) === nextKey,
    );
};

const confirmDuplicateMeal = async (context) => {
  if (duplicateMealConfirmHandler) {
    return duplicateMealConfirmHandler(context);
  }

  return typeof window === "undefined"
    ? true
    : window.confirm(
        "Bu ovqat bugun shu bo'limga allaqachon qo'shilgan. Yana qo'shishni xohlaysizmi?",
      );
};

export const useDailyTrackingDay = (date, options = {}) => {
  const dateKey = normalizeDateKey(date);
  const { data, ...query } = useGetQuery({
    url: nutritionDaysPath(dateKey),
    queryProps: {
      queryKey: getDailyTrackingQueryKey(dateKey),
      enabled: options.enabled ?? true,
    },
  });

  const dayData = React.useMemo(
    () => normalizeDayData(getTrackingPayload(data, { date: dateKey })),
    [data, dateKey],
  );

  return {
    ...query,
    data,
    dateKey,
    dayData,
  };
};

export const useDailyTrackingHistory = (params = {}) => {
  const queryParams = React.useMemo(
    () => ({
      startDate: params.startDate || undefined,
      endDate: params.endDate || undefined,
      mealType:
        params.mealType && params.mealType !== "all"
          ? params.mealType
          : undefined,
      source:
        params.source && params.source !== "all" ? params.source : undefined,
      q: trim(params.q) || undefined,
      page: params.page || undefined,
      limit: params.limit || undefined,
    }),
    [
      params.endDate,
      params.limit,
      params.mealType,
      params.page,
      params.q,
      params.source,
      params.startDate,
    ],
  );

  const { data, ...query } = useGetQuery({
    url: nutritionHistoryPath(),
    params: queryParams,
    queryProps: {
      queryKey: getNutritionHistoryQueryKey(queryParams),
      enabled: params.enabled ?? true,
    },
  });

  const days = React.useMemo(
    () =>
      map(get(data, "data.data.days", get(data, "data.days", [])), (day) =>
        normalizeDayData(day)),
    [data],
  );

  const meta = React.useMemo(
    () => get(data, "data.data.meta", get(data, "data.meta", null)),
    [data],
  );

  return {
    ...query,
    data,
    days,
    meta,
  };
};


export const useDailyTrackingActions = () => {
  const queryClient = useQueryClient();
  const postMutation = usePostQuery();
  const putMutation = usePutQuery();
  const patchMutation = usePatchQuery();
  const deleteMutation = useDeleteQuery();

  const syncResponse = React.useCallback(
    (response) => {
      const dayData = getTrackingPayload(response);
      const normalized = setTrackingCache(queryClient, dayData);
      void invalidateNutritionDashboard(queryClient, normalized.date);
      return normalized;
    },
    [queryClient],
  );

  const invalidateWorkoutDerivedQueries = React.useCallback(
    async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: WORKOUT_OVERVIEW_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: WORKOUT_PLAN_QUERY_KEY }),
      ]);
    },
    [queryClient],
  );

  const syncGamificationState = React.useCallback(
    async () => invalidateGamificationQueries(queryClient),
    [queryClient],
  );

  const addWaterCup = React.useCallback(
    async (date = getTodayKey(), amountMl = 250) => {
      const dateKey = normalizeDateKey(date);
      const response = await postMutation.mutateAsync({
        url: nutritionTrackingPath(`${dateKey}/water`),
        attributes: { amountMl },
      });
      const dayData = syncResponse(response);
      await syncGamificationState();
      void trackCampaignConversion("water_log", { date: dateKey, amountMl });
      return dayData;
    },
    [postMutation, syncGamificationState, syncResponse],
  );

  const removeWaterLogEntry = React.useCallback(
    async (date = getTodayKey(), index) => {
      const dateKey = normalizeDateKey(date);
      const dayData = getCachedDayData(queryClient, dateKey);
      const entry = dayData.waterLog[index];

      if (!entry?.id) {
        return dayData;
      }

      const response = await deleteMutation.mutateAsync({
        url: nutritionTrackingPath(`${dateKey}/water/${entry.id}`),
      });
      return syncResponse(response);
    },
    [deleteMutation, queryClient, syncResponse],
  );

  const removeLastWaterCup = React.useCallback(
    async (date = getTodayKey()) => {
      const dayData = getCachedDayData(queryClient, date);
      if (dayData.waterLog.length === 0) {
        return dayData;
      }

      return removeWaterLogEntry(date, dayData.waterLog.length - 1);
    },
    [queryClient, removeWaterLogEntry],
  );

  const setWaterCups = React.useCallback(
    async (date = getTodayKey(), count, cupSize = 250) => {
      const dateKey = normalizeDateKey(date);
      const dayData = getCachedDayData(queryClient, dateKey);
      const safeCount = clamp(count, 0, Infinity);

      if (safeCount === dayData.waterLog.length) {
        return dayData;
      }

      if (safeCount > dayData.waterLog.length) {
        const toAdd = safeCount - dayData.waterLog.length;
        for (let index = 0; index < toAdd; index += 1) {
          await addWaterCup(dateKey, cupSize);
        }
        return getCachedDayData(queryClient, dateKey);
      }

      const entriesToRemove = slice(dayData.waterLog, safeCount).reverse();
      for (const entry of entriesToRemove) {
        await deleteMutation.mutateAsync({
          url: nutritionTrackingPath(`${dateKey}/water/${entry.id}`),
        });
      }

      const refreshed = await putMutation.mutateAsync({
        url: nutritionDaysPath(dateKey),
        attributes: {
          steps: dayData.steps,
          workoutMinutes: dayData.workoutMinutes,
          burnedCalories: dayData.burnedCalories,
          sleepHours: dayData.sleepHours,
          mood: dayData.mood,
        },
      });

      return syncResponse(refreshed);
    },
    [addWaterCup, deleteMutation, putMutation, queryClient, syncResponse],
  );

  const addMeal = React.useCallback(
    async (date = getTodayKey(), mealType, food) => {
      const dateKey = normalizeDateKey(date);
      const queryKey = getDailyTrackingQueryKey(dateKey);
      const previousQueryData = queryClient.getQueryData(queryKey);
      const previousDayData = {
        ...getCachedDayData(queryClient, dateKey),
        date: dateKey,
      };
      const optimisticMeal = normalizeMealItem({
        ...food,
        id: `optimistic-${dateKey}-${mealType}-${Date.now()}`,
        source: food?.source ?? null,
        addedAt: food?.addedAt ?? new Date().toISOString(),
      });

      if (
        isDuplicateMeal(
          previousDayData.meals?.[mealType] || [],
          optimisticMeal,
          mealType,
        )
      ) {
        const shouldContinue = await confirmDuplicateMeal({
          dateKey,
          mealType,
          food: optimisticMeal,
        });

        if (!shouldContinue) {
          return previousDayData;
        }
      }

      setTrackingCache(queryClient, {
        ...previousDayData,
        meals: {
          ...previousDayData.meals,
          [mealType]: [...(previousDayData.meals?.[mealType] || []), optimisticMeal],
        },
      });

      try {
        const response = await postMutation.mutateAsync({
          url: nutritionMealsPath(),
          attributes: {
            date: dateKey,
            ...buildMealPayload(mealType, food),
          },
        });
        const dayData = syncResponse(response);
        await Promise.all([
          invalidateNutritionMealMutationQueries(queryClient, {
            date: dateKey,
            touchesSavedMeals: Boolean(food?.savedMealId),
          }),
        ]);
        void trackCampaignConversion("meal_log", {
          date: dateKey,
          mealType,
          source: food?.source ?? null,
        });
        void trackNutritionMealLogged({
          date: dateKey,
          mealType,
          source: food?.source ?? null,
          savedMealId: food?.savedMealId ?? null,
          hasIngredientSnapshot: Boolean(food?.ingredients?.length),
        });
        return dayData;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousQueryData);
        toast.error("Ovqat qo'shilmadi — o'zgarish qaytarildi");
        throw error;
      }
    },
    [postMutation, queryClient, syncResponse],
  );

  const addMealsBatch = React.useCallback(
    async (date = getTodayKey(), items = []) => {
      const dateKey = normalizeDateKey(date);
      const payloadItems = map(filter(items, (item) => item?.mealType && item?.food), (item) => buildMealPayload(item.mealType, item.food));

      if (payloadItems.length === 0) {
        return getCachedDayData(queryClient, dateKey);
      }

      const response = await postMutation.mutateAsync({
        url: nutritionMealsPath("batch"),
        attributes: { date: dateKey, items: payloadItems },
      });
      const dayData = syncResponse(response);
      await Promise.all([
        invalidateNutritionMealMutationQueries(queryClient, {
          date: dateKey,
          touchesSavedMeals: some(payloadItems, (item) => item.savedMealId),
        }),
      ]);
      void trackCampaignConversion("meal_log", {
        date: dateKey,
        mealCount: payloadItems.length,
      });
      void trackNutritionMealLogged({
        date: dateKey,
        mealType:
          payloadItems.length === 1 ? payloadItems[0].mealType : "batch",
        source: "batch",
        itemCount: payloadItems.length,
        hasSavedMeal: some(payloadItems, (item) => Boolean(item.savedMealId)),
        hasIngredientSnapshot: some(payloadItems, (item) =>
          Boolean(item.ingredients?.length),
        ),
      });
      return dayData;
    },
    [postMutation, queryClient, syncResponse],
  );

  const copyMeals = React.useCallback(
    async ({ from, to = getTodayKey(), mealType } = {}) => {
      const targetDateKey = normalizeDateKey(to);
      if (!from) {
        return getCachedDayData(queryClient, targetDateKey);
      }

      const response = await postMutation.mutateAsync({
        url: nutritionMealsPath("copy"),
        attributes: {
          from: normalizeDateKey(from),
          to: targetDateKey,
          ...(mealType ? { mealType } : {}),
        },
      });
      const dayData = syncResponse(response);
      await Promise.all([
        invalidateNutritionMealMutationQueries(queryClient, {
          date: targetDateKey,
        }),
      ]);
      return dayData;
    },
    [postMutation, queryClient, syncResponse],
  );

  const removeMeal = React.useCallback(
    async (date = getTodayKey(), mealType, foodId) => {
      if (!foodId) {
        return getCachedDayData(queryClient, date);
      }

      const dateKey = normalizeDateKey(date);
      const queryKey = getDailyTrackingQueryKey(dateKey);
      const previousQueryData = queryClient.getQueryData(queryKey);
      const previousDayData = {
        ...getCachedDayData(queryClient, dateKey),
        date: dateKey,
      };

      setTrackingCache(queryClient, {
        ...previousDayData,
        meals: {
          ...previousDayData.meals,
          [mealType]: filter((previousDayData.meals?.[mealType] || []), (item) => item.id !== foodId),
        },
      });

      try {
        const response = await deleteMutation.mutateAsync({
          url: nutritionMealsPath(foodId),
          config: { params: { date: dateKey } },
        });
        const dayData = syncResponse(response);
        await invalidateNutritionMealMutationQueries(queryClient, {
          date: dateKey,
        });
        void trackNutritionMealDeleted({
          date: dateKey,
          mealType,
        });
        return dayData;
      } catch (error) {
        queryClient.setQueryData(queryKey, previousQueryData);
        toast.error("Ovqat o'chirilmadi — o'zgarish qaytarildi");
        throw error;
      }
    },
    [deleteMutation, queryClient, syncResponse],
  );

  const patchMeal = React.useCallback(
    async (date = getTodayKey(), mealType, foodId, patch) => {
      if (!foodId) {
        return getCachedDayData(queryClient, date);
      }

      const dateKey = normalizeDateKey(date);
      const response = await patchMutation.mutateAsync({
        url: nutritionMealsPath(foodId),
        attributes: {
          date: dateKey,
          ...buildMealPatchPayload(mealType, patch),
        },
      });
      const dayData = syncResponse(response);
      await invalidateNutritionMealMutationQueries(queryClient, {
        date: dateKey,
        touchesSavedMeals: patch?.savedMealId !== undefined,
      });
      void trackNutritionMealEdited({
        date: dateKey,
        mealType,
        hasSavedMeal: patch?.savedMealId !== undefined,
        hasIngredientSnapshot: patch?.ingredients !== undefined,
        changedFields: Object.keys(patch || {}),
      });
      return dayData;
    },
    [patchMutation, queryClient, syncResponse],
  );

  const updateMealImage = React.useCallback(
    async (date = getTodayKey(), mealType, foodId, imageUrl) =>
      patchMeal(date, mealType, foodId, { image: imageUrl }),
    [patchMeal],
  );

  const updateMealQty = React.useCallback(
    async (date = getTodayKey(), mealType, foodId, delta) => {
      const dayData = getCachedDayData(queryClient, date);
      const currentItem = find(get(dayData, ["meals", mealType], []), (item) => item.id === foodId);

      if (!currentItem) {
        return dayData;
      }

      return patchMeal(date, mealType, foodId, {
        qty: clamp((currentItem.qty ?? 1) + delta, 1, Infinity),
      });
    },
    [patchMeal, queryClient],
  );

  const updateSummary = React.useCallback(
    async (date = getTodayKey(), patch) => {
      const response = await putMutation.mutateAsync({
        url: nutritionDaysPath(normalizeDateKey(date)),
        attributes: patch,
      });
      const dayData = syncResponse(response);
      if (
        patch?.workoutMinutes !== undefined ||
        patch?.burnedCalories !== undefined
      ) {
        await invalidateWorkoutDerivedQueries();
      }
      return dayData;
    },
    [invalidateWorkoutDerivedQueries, putMutation, syncResponse],
  );

  const setSteps = React.useCallback(
    async (date = getTodayKey(), steps) => updateSummary(date, { steps }),
    [updateSummary],
  );

  const setWorkout = React.useCallback(
    async (date = getTodayKey(), minutes, burnedCalories) =>
      updateSummary(date, {
        workoutMinutes: minutes,
        burnedCalories,
      }),
    [updateSummary],
  );

  const addWorkout = React.useCallback(
    async (date = getTodayKey(), minutes = 0, burnedCalories = 0) => {
      const dayData = getCachedDayData(queryClient, date);
      return updateSummary(date, {
        workoutMinutes:
          (toNumber(dayData.workoutMinutes) || 0) + (toNumber(minutes) || 0),
        burnedCalories:
          (toNumber(dayData.burnedCalories) || 0) +
          (toNumber(burnedCalories) || 0),
      });
    },
    [queryClient, updateSummary],
  );

  const setSleep = React.useCallback(
    async (date = getTodayKey(), sleepHours) =>
      updateSummary(date, { sleepHours }),
    [updateSummary],
  );

  const setMood = React.useCallback(
    async (date = getTodayKey(), mood) => updateSummary(date, { mood }),
    [updateSummary],
  );

  return {
    addWaterCup,
    removeLastWaterCup,
    removeWaterLogEntry,
    setWaterCups,
    addMeal,
    addMealsBatch,
    copyMeals,
    removeMeal,
    patchMeal,
    updateMealImage,
    updateMealQty,
    updateSummary,
    setSteps,
    setWorkout,
    addWorkout,
    setSleep,
    setMood,
  };
};
