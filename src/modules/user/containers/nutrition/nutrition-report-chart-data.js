import {
  clamp,
  filter,
  isArray,
  isFinite as isFiniteNumber,
  isPlainObject,
  map,
  reduce,
  round,
  split,
  toNumber,
} from "lodash";

export const WEEKDAY_LABELS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = toNumber(value);
  return isFiniteNumber(numberValue) ? numberValue : fallback;
};

const toNonNegativeNumber = (value, fallback = 0, precision = 0) =>
  round(Math.max(0, toFiniteNumber(value, fallback)), precision);

export const isNutritionReportDateKey = (dateKey) => {
  const value = String(dateKey || "");
  if (!DATE_KEY_RE.test(value)) {
    return false;
  }

  const [year, month, day] = map(split(value, "-"), toNumber);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

export const formatNutritionReportDay = (dateKey) => {
  if (!isNutritionReportDateKey(dateKey)) {
    return null;
  }

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("uz-UZ", {
    month: "short",
    day: "numeric",
  });
};

const normalizeDailyChartRow = (entry) => {
  if (!isPlainObject(entry)) {
    return null;
  }

  const label = formatNutritionReportDay(entry.date);
  if (!label) {
    return null;
  }

  return {
    date: label,
    "Kaloriya": toNonNegativeNumber(entry.calories),
    "Oqsil (g)": toNonNegativeNumber(entry.protein, 0, 1),
    "Uglevod (g)": toNonNegativeNumber(entry.carbs, 0, 1),
    "Yog' (g)": toNonNegativeNumber(entry.fat, 0, 1),
    "Fiber (g)": toNonNegativeNumber(entry.fiber, 0, 1),
    "Suv (ml)": toNonNegativeNumber(entry.waterMl),
    "Ovqat soni": toNonNegativeNumber(entry.mealCount),
  };
};

export const buildNutritionReportChartData = (daily = []) =>
  filter(
    map(isArray(daily) ? daily : [], normalizeDailyChartRow),
    Boolean,
  );

const getComparisonLabels = (labels = {}) => ({
  current: labels.current || "Bu hafta",
  previous: labels.previous || "O'tgan hafta",
});

export const buildNutritionReportComparisonChartData = ({
  mode = "week",
  currentDaily = [],
  previousDaily = [],
  labels = {},
} = {}) => {
  const resolvedLabels = getComparisonLabels(labels);
  const currentRows = isArray(currentDaily) ? currentDaily : [];
  const previousRows = isArray(previousDaily) ? previousDaily : [];
  const periodLabels = filter(
    map(currentRows, (entry) => formatNutritionReportDay(entry?.date)),
    Boolean,
  );
  const rowLabels = mode === "week" ? WEEKDAY_LABELS : periodLabels;

  return map(rowLabels, (label, index) => ({
    date: label,
    [resolvedLabels.current]: toNonNegativeNumber(
      currentRows[index]?.calories,
    ),
    [resolvedLabels.previous]: toNonNegativeNumber(
      previousRows[index]?.calories,
    ),
  }));
};

export const getNutritionReportAverageCalories = (items = []) => {
  const logged = filter(
    isArray(items) ? items : [],
    (item) => toFiniteNumber(item?.calories) > 0,
  );

  if (!logged.length) {
    return 0;
  }

  return Math.round(
    reduce(
      logged,
      (sum, item) => sum + toFiniteNumber(item?.calories),
      0,
    ) / logged.length,
  );
};

const normalizeSourceChartRow = (item, getSourceLabel) => {
  if (!isPlainObject(item)) {
    return null;
  }

  const value = toNonNegativeNumber(item.count);
  if (value <= 0) {
    return null;
  }

  return {
    name: getSourceLabel(item.source),
    value,
    percent: round(clamp(toFiniteNumber(item.percent), 0, 100)),
  };
};

export const buildNutritionReportSourceChartData = (
  sourceBreakdown = [],
  getSourceLabel = (source) => source || "Manual",
) =>
  filter(
    map(isArray(sourceBreakdown) ? sourceBreakdown : [], (item) =>
      normalizeSourceChartRow(item, getSourceLabel),
    ),
    Boolean,
  );
