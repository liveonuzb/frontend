import { map } from "lodash";
import {
  getMealIngredientsGrams,
  normalizeMealIngredients,
  normalizeMealNutrition,
  toNumber,
} from "@/modules/user/containers/nutrition/meal-ingredients.js";

const formatLocalDateKey = (date) => {
  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    return formatLocalDateKey(new Date());
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getTodayKey = () => formatLocalDateKey(new Date());

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
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    return formatLocalDateKey(date);
  }
  return formatLocalDateKey(date);
};

export const normalizeMealItem = (item = {}) => ({
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
