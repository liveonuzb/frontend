import React from "react";
import {
  filter,
  get,
  isArray,
  isFinite,
  isNil,
  isPlainObject,
  map,
  toLower,
  toNumber,
  trim,
} from "lodash";
import { useGetQuery } from "@/hooks/api";
import { normalizeDateKey } from "@/modules/user/lib/nutrition-normalizers";
import {
  NUTRITION_DASHBOARD_QUERY_KEY,
  getNutritionDashboardQueryKey,
} from "@/hooks/app/nutrition-query-keys";

export { NUTRITION_DASHBOARD_QUERY_KEY, getNutritionDashboardQueryKey };

const defaultDashboard = {
  date: normalizeDateKey(),
  timezone: "Asia/Tashkent",
  goals: {
    calories: 2200,
    protein: 150,
    carbs: 250,
    fat: 70,
    waterMl: 2500,
  },
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
  blockers: {
    items: [],
  },
};

const resolvePayload = (response, fallback = defaultDashboard) =>
  get(response, "data.data", get(response, "data", fallback));

const toFiniteNumber = (value, fallback = 0) => {
  if (isNil(value) || (typeof value === "string" && trim(value) === "")) {
    return fallback;
  }

  const numeric = toNumber(value);
  return isFinite(numeric) ? Math.max(0, Math.round(numeric)) : fallback;
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

const normalizeFeedbackItem = (item) => {
  if (!isPlainObject(item) || isNil(item.id)) {
    return null;
  }

  return {
    ...item,
    id: String(item.id),
    metric: String(item.metric ?? ""),
    severity: item.severity === "warning" ? "warning" : "info",
    actual: toFiniteNumber(item.actual, 0),
    ...(isNil(item.target) ? {} : { target: toFiniteNumber(item.target, 0) }),
  };
};

const normalizeQuickAction = (item) => {
  if (!isPlainObject(item) || isNil(item.id)) {
    return null;
  }

  const enabledValue =
    typeof item.enabled === "string" ? toLower(trim(item.enabled)) : item.enabled;
  const enabled =
    enabledValue === false || enabledValue === "false" || enabledValue === "0"
      ? false
      : true;

  return {
    id: String(item.id),
    label: String(item.label ?? item.id),
    target: String(item.target ?? ""),
    enabled,
  };
};

const normalizeGoals = (value = {}) => ({
  calories: toFiniteNumber(
    value.calories,
    defaultDashboard.goals.calories,
  ),
  protein: toFiniteNumber(value.protein, defaultDashboard.goals.protein),
  carbs: toFiniteNumber(value.carbs, defaultDashboard.goals.carbs),
  fat: toFiniteNumber(value.fat, defaultDashboard.goals.fat),
  waterMl: toFiniteNumber(value.waterMl, defaultDashboard.goals.waterMl),
});

const normalizeBlockerItem = (item) => {
  if (!isPlainObject(item) || isNil(item.id)) {
    return null;
  }

  const action = isPlainObject(item.action)
    ? {
        id: String(item.action.id ?? ""),
        label: String(item.action.label ?? ""),
        target: String(item.action.target ?? ""),
      }
    : undefined;

  return {
    id: String(item.id),
    type: String(item.type ?? ""),
    severity: item.severity === "warning" ? "warning" : "info",
    title: String(item.title ?? ""),
    message: String(item.message ?? ""),
    ...(action ? { action } : {}),
  };
};

export const normalizeNutritionDashboard = (payload = {}) => {
  const source = isPlainObject(payload) ? payload : {};
  const feedbackItems = isArray(get(source, "feedback.items"))
    ? filter(map(source.feedback.items, normalizeFeedbackItem), Boolean)
    : [];
  const quickActions = isArray(source.quickActions)
    ? filter(map(source.quickActions, normalizeQuickAction), Boolean)
    : [];
  const blockers = isArray(get(source, "blockers.items"))
    ? filter(map(source.blockers.items, normalizeBlockerItem), Boolean)
    : [];

  return {
    date: normalizeDateKey(source.date ?? defaultDashboard.date),
    timezone: String(source.timezone ?? defaultDashboard.timezone),
    goals: normalizeGoals(source.goals),
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
    activePlan: isPlainObject(source.activePlan) ? source.activePlan : null,
    feedback: {
      items: feedbackItems,
    },
    streak: {
      currentDays: toFiniteNumber(source.streak?.currentDays, 0),
      bestDays: toFiniteNumber(source.streak?.bestDays, 0),
    },
    quickActions,
    blockers: {
      items: blockers,
    },
  };
};

export const useNutritionDashboard = (date, options = {}) => {
  const dateKey = normalizeDateKey(date);
  const { data, ...query } = useGetQuery({
    url: "/user/nutrition/overview",
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
