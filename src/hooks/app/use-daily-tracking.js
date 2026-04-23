import React from "react";
import { get, clamp, map, filter, find } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import {
  useDeleteQuery,
  useGetQuery,
  usePatchQuery,
  usePostQuery,
  usePutQuery,
} from "@/hooks/api";
import { FOODS_QUICK_ADD_QUERY_KEY } from "@/hooks/app/use-food-catalog";
import { SAVED_MEALS_QUERY_KEY } from "@/hooks/app/use-saved-meals";
import { invalidateGamificationQueries } from "@/modules/user/lib/gamification-query-keys";
import {
  buildMealIngredientsPayload,
  getMealIngredientTotals,
  getMealIngredientsGrams,
  normalizeMealIngredients,
} from "@/modules/user/containers/nutrition/meal-ingredients.js";

const WORKOUT_OVERVIEW_QUERY_KEY = ["user", "workout", "overview"];
const WORKOUT_PLAN_QUERY_KEY = ["user", "workout", "plans"];

export const getTodayKey = () => new Date().toISOString().split("T")[0];

export const createEmptyDayData = () => ({
  date: "",
  waterCups: 0,
  waterLog: [],
  workoutLogs: [],
  meals: {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  },
  steps: 0,
  workoutMinutes: 0,
  burnedCalories: 0,
  sleepHours: 0,
  mood: null,
});

export const normalizeDateKey = (date) => {
  if (!date) return getTodayKey();
  if (typeof date === "string") {
    return date.includes("T") ? date.split("T")[0] : date;
  }
  return date.toISOString().split("T")[0];
};

const normalizeMealItem = (item = {}) => ({
  id: item.id,
  savedMealId: item.savedMealId ?? null,
  source: item.source ?? null,
  name: item.name ?? "",
  barcode: item.barcode ?? null,
  cal: item.cal ?? item.calories ?? 0,
  protein: item.protein ?? 0,
  carbs: item.carbs ?? 0,
  fat: item.fat ?? 0,
  fiber: item.fiber ?? 0,
  qty: item.qty ?? item.quantity ?? 1,
  image: item.image ?? item.imageUrl ?? null,
  grams:
    item.grams ??
    (Array.isArray(item.ingredients)
      ? getMealIngredientsGrams(item.ingredients)
      : null),
  ingredients: normalizeMealIngredients(item.ingredients),
  addedAt: item.addedAt ?? null,
});

const normalizeWorkoutLogItem = (item = {}) => ({
  id: item.id,
  source: item.source ?? null,
  logGroupKey: item.logGroupKey ?? null,
  name: item.name ?? "",
  exerciseId: item.exerciseId ?? null,
  sessionName: item.sessionName ?? null,
  trackingType: item.trackingType ?? "REPS_WEIGHT",
  sets: item.sets ?? item.totalSets ?? 1,
  totalSets: item.totalSets ?? item.sets ?? 1,
  reps: item.reps ?? 0,
  weight: item.weight ?? 0,
  durationSeconds: item.durationSeconds ?? 0,
  distanceMeters: item.distanceMeters ?? 0,
  durationMinutes: item.durationMinutes ?? 0,
  burnedCalories: item.burnedCalories ?? 0,
  image: item.image ?? item.imageUrl ?? null,
  addedAt: item.addedAt ?? null,
});

export const normalizeDayData = (payload = {}) => {
  const empty = createEmptyDayData();

  return {
    ...empty,
    date: normalizeDateKey(payload.date || empty.date),
    waterCups: payload.waterCups ?? payload.waterLog?.length ?? empty.waterCups,
    waterLog: Array.isArray(payload.waterLog)
      ? map(payload.waterLog, (entry) => ({
          id: entry.id,
          time: entry.time ?? new Date().toISOString(),
          amountMl: entry.amountMl ?? 0,
        }))
      : empty.waterLog,
    meals: {
      breakfast: Array.isArray(payload.meals?.breakfast)
        ? map(payload.meals.breakfast, normalizeMealItem)
        : empty.meals.breakfast,
      lunch: Array.isArray(payload.meals?.lunch)
        ? map(payload.meals.lunch, normalizeMealItem)
        : empty.meals.lunch,
      dinner: Array.isArray(payload.meals?.dinner)
        ? map(payload.meals.dinner, normalizeMealItem)
        : empty.meals.dinner,
      snack: Array.isArray(payload.meals?.snack)
        ? map(payload.meals.snack, normalizeMealItem)
        : empty.meals.snack,
    },
    workoutLogs: Array.isArray(payload.workoutLogs)
      ? map(payload.workoutLogs, normalizeWorkoutLogItem)
      : empty.workoutLogs,
    steps: payload.steps ?? empty.steps,
    workoutMinutes: payload.workoutMinutes ?? empty.workoutMinutes,
    burnedCalories: payload.burnedCalories ?? empty.burnedCalories,
    sleepHours: payload.sleepHours ?? empty.sleepHours,
    mood: payload.mood ?? empty.mood,
  };
};

const getTrackingPayload = (source, fallback = {}) =>
  get(source, "data.data", get(source, "data", fallback));

export const getDailyTrackingQueryKey = (date) => [
  "daily-tracking",
  normalizeDateKey(date),
];

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

export const useDailyTrackingDay = (date, options = {}) => {
  const dateKey = normalizeDateKey(date);
  const { data, ...query } = useGetQuery({
    url: `/daily-tracking/${dateKey}`,
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

export const useDailyTrackingActions = () => {
  const queryClient = useQueryClient();
  const postMutation = usePostQuery();
  const putMutation = usePutQuery();
  const patchMutation = usePatchQuery();
  const deleteMutation = useDeleteQuery();

  const syncResponse = React.useCallback(
    (response) => {
      const dayData = getTrackingPayload(response);
      return setTrackingCache(queryClient, dayData);
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
      const response = await postMutation.mutateAsync({
        url: `/daily-tracking/${normalizeDateKey(date)}/water`,
        attributes: { amountMl },
      });
      const dayData = syncResponse(response);
      await syncGamificationState();
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
        url: `/daily-tracking/${dateKey}/water/${entry.id}`,
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

      const entriesToRemove = dayData.waterLog.slice(safeCount).reverse();
      for (const entry of entriesToRemove) {
        await deleteMutation.mutateAsync({
          url: `/daily-tracking/${dateKey}/water/${entry.id}`,
        });
      }

      const refreshed = await putMutation.mutateAsync({
        url: `/daily-tracking/${dateKey}`,
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
      const response = await postMutation.mutateAsync({
        url: `/daily-tracking/${normalizeDateKey(date)}/meals`,
        attributes: buildMealPayload(mealType, food),
      });
      const dayData = syncResponse(response);
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: FOODS_QUICK_ADD_QUERY_KEY }),
        syncGamificationState(),
      ];
      if (food?.savedMealId) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: SAVED_MEALS_QUERY_KEY }),
        );
      }
      await Promise.all(invalidations);
      return dayData;
    },
    [postMutation, queryClient, syncGamificationState, syncResponse],
  );

  const removeMeal = React.useCallback(
    async (date = getTodayKey(), mealType, foodId) => {
      if (!foodId) {
        return getCachedDayData(queryClient, date);
      }

      const response = await deleteMutation.mutateAsync({
        url: `/daily-tracking/${normalizeDateKey(date)}/meals/${foodId}`,
      });
      const dayData = syncResponse(response);
      await queryClient.invalidateQueries({ queryKey: FOODS_QUICK_ADD_QUERY_KEY });
      return dayData;
    },
    [deleteMutation, queryClient, syncResponse],
  );

  const patchMeal = React.useCallback(
    async (date = getTodayKey(), mealType, foodId, patch) => {
      if (!foodId) {
        return getCachedDayData(queryClient, date);
      }

      const response = await patchMutation.mutateAsync({
        url: `/daily-tracking/${normalizeDateKey(date)}/meals/${foodId}`,
        attributes: buildMealPatchPayload(mealType, patch),
      });
      return syncResponse(response);
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
        url: `/daily-tracking/${normalizeDateKey(date)}`,
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
          (Number(dayData.workoutMinutes) || 0) + (Number(minutes) || 0),
        burnedCalories:
          (Number(dayData.burnedCalories) || 0) +
          (Number(burnedCalories) || 0),
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
