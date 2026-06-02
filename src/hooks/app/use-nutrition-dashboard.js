import React from "react";
import get from "lodash/get";
import isArray from "lodash/isArray";
import toNumber from "lodash/toNumber";
import { useGetQuery } from "@/hooks/api";
import { normalizeDateKey } from "@/modules/user/lib/nutrition-normalizers";

export const NUTRITION_DASHBOARD_QUERY_KEY = [
  "user",
  "nutrition",
  "dashboard",
];

export const getNutritionDashboardQueryKey = (date) => [
  ...NUTRITION_DASHBOARD_QUERY_KEY,
  normalizeDateKey(date),
];

const defaultDashboard = {
  date: normalizeDateKey(),
  calories: {
    current: 0,
    target: 2200,
    remaining: 2200,
    percent: 0,
  },
  macros: {
    protein: { current: 0, target: 150, percent: 0 },
    carbs: { current: 0, target: 250, percent: 0 },
    fat: { current: 0, target: 70, percent: 0 },
  },
  water: {
    currentMl: 0,
    targetMl: 2500,
    percent: 0,
  },
  meals: {
    completed: 0,
    total: 4,
    byType: {
      breakfast: { count: 0, calories: 0 },
      lunch: { count: 0, calories: 0 },
      dinner: { count: 0, calories: 0 },
      snack: { count: 0, calories: 0 },
    },
  },
  activePlan: null,
  feedback: {
    items: [],
  },
  streak: {
    currentDays: 0,
    bestDays: 0,
  },
  quickActions: [],
};

const resolvePayload = (response, fallback = defaultDashboard) =>
  get(response, "data.data", get(response, "data", fallback));

const toFiniteNumber = (value, fallback = 0) => {
  const numeric = toNumber(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeProgress = (value = {}, fallback = {}) => ({
  current: toFiniteNumber(value.current, fallback.current ?? 0),
  target: toFiniteNumber(value.target, fallback.target ?? 0),
  percent: toFiniteNumber(value.percent, fallback.percent ?? 0),
});

const normalizeMealTypeSummary = (value = {}) => ({
  count: toFiniteNumber(value.count, 0),
  calories: toFiniteNumber(value.calories, 0),
});

export const normalizeNutritionDashboard = (payload = {}) => {
  const source = payload && typeof payload === "object" ? payload : {};

  return {
    date: normalizeDateKey(source.date ?? defaultDashboard.date),
    calories: {
      ...normalizeProgress(source.calories, defaultDashboard.calories),
      remaining: toFiniteNumber(
        source.calories?.remaining,
        defaultDashboard.calories.remaining,
      ),
    },
    macros: {
      protein: normalizeProgress(
        source.macros?.protein,
        defaultDashboard.macros.protein,
      ),
      carbs: normalizeProgress(
        source.macros?.carbs,
        defaultDashboard.macros.carbs,
      ),
      fat: normalizeProgress(source.macros?.fat, defaultDashboard.macros.fat),
    },
    water: {
      currentMl: toFiniteNumber(
        source.water?.currentMl,
        defaultDashboard.water.currentMl,
      ),
      targetMl: toFiniteNumber(
        source.water?.targetMl,
        defaultDashboard.water.targetMl,
      ),
      percent: toFiniteNumber(
        source.water?.percent,
        defaultDashboard.water.percent,
      ),
    },
    meals: {
      completed: toFiniteNumber(
        source.meals?.completed,
        defaultDashboard.meals.completed,
      ),
      total: toFiniteNumber(source.meals?.total, defaultDashboard.meals.total),
      byType: {
        breakfast: normalizeMealTypeSummary(source.meals?.byType?.breakfast),
        lunch: normalizeMealTypeSummary(source.meals?.byType?.lunch),
        dinner: normalizeMealTypeSummary(source.meals?.byType?.dinner),
        snack: normalizeMealTypeSummary(source.meals?.byType?.snack),
      },
    },
    activePlan: source.activePlan ?? null,
    feedback: {
      items: isArray(source.feedback?.items) ? source.feedback.items : [],
    },
    streak: {
      currentDays: toFiniteNumber(source.streak?.currentDays, 0),
      bestDays: toFiniteNumber(source.streak?.bestDays, 0),
    },
    quickActions: isArray(source.quickActions) ? source.quickActions : [],
  };
};

export const useNutritionDashboard = (date, options = {}) => {
  const dateKey = normalizeDateKey(date);
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/dashboard",
    params: {
      date: dateKey,
    },
    queryProps: {
      queryKey: getNutritionDashboardQueryKey(dateKey),
      enabled: options.enabled ?? true,
    },
  });

  const dashboard = React.useMemo(
    () => normalizeNutritionDashboard(resolvePayload(data)),
    [data],
  );

  return {
    ...query,
    data,
    dateKey,
    dashboard,
  };
};

export default useNutritionDashboard;
