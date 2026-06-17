import {
  compact,
  every,
  filter,
  flatMap,
  includes,
  isArray,
  isFinite as isFiniteNumber,
  isPlainObject,
  join,
  kebabCase,
  map,
  reduce,
  replace,
  round,
  split,
  toLower,
  toNumber,
  toPairs,
  trim,
} from "lodash";
import { MEAL_LABELS } from "@/modules/user/lib/meal-config";

export const NUTRITION_HISTORY_CSV_HEADER = [
  "date",
  "meal_type",
  "food_name",
  "calories",
  "protein_g",
  "carbs_g",
  "fat_g",
  "water_ml",
];

const toFiniteNumber = (value, fallback = 0) => {
  const numberValue = toNumber(value);
  return isFiniteNumber(numberValue) ? numberValue : fallback;
};

const toRoundedNonNegative = (value, precision = 0) =>
  round(Math.max(0, toFiniteNumber(value)), precision);

const normalizeSearch = (value) => toLower(trim(String(value || "")));

const getSearchTokens = (value) =>
  compact(split(normalizeSearch(value), /\s+/));

export const getHistoryMealCalories = (meal) =>
  toRoundedNonNegative(meal?.cal ?? meal?.calories);

export const flattenHistoryDayMeals = (day) =>
  filter(
    flatMap(toPairs(day?.meals || {}), ([mealType, items]) =>
      map(isArray(items) ? items : [], (item) =>
        isPlainObject(item)
          ? {
              ...item,
              mealType,
            }
          : null,
      ),
    ),
    Boolean,
  );

export const getHistoryDayTotals = (meals = []) =>
  reduce(
    isArray(meals) ? meals : [],
    (totals, meal) => ({
      calories: totals.calories + getHistoryMealCalories(meal),
      protein: round(
        totals.protein + toRoundedNonNegative(meal?.protein, 1),
        1,
      ),
      carbs: round(totals.carbs + toRoundedNonNegative(meal?.carbs, 1), 1),
      fat: round(totals.fat + toRoundedNonNegative(meal?.fat, 1), 1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

export const getHistoryDayWaterMl = (day) => {
  const waterLog = isArray(day?.waterLog) ? day.waterLog : [];
  if (waterLog.length > 0) {
    return toRoundedNonNegative(
      reduce(
        waterLog,
        (sum, entry) => sum + toFiniteNumber(entry?.amountMl),
        0,
      ),
    );
  }

  return toRoundedNonNegative(day?.waterMl ?? day?.summary?.waterMl);
};

export const filterHistoryMealsForView = (
  meals = [],
  { mealType = "all", source = "all", search = "" } = {},
) => {
  const searchTokens = getSearchTokens(search);

  return filter(isArray(meals) ? meals : [], (meal) => {
    if (mealType && mealType !== "all" && meal.mealType !== mealType) {
      return false;
    }

    if (source && source !== "all" && meal.source !== source) {
      return false;
    }

    if (!searchTokens.length) {
      return true;
    }

    const haystack = normalizeSearch(
      join(
        compact([
          meal.name,
          meal.barcode,
          meal.source,
          MEAL_LABELS[meal.mealType],
        ]),
        " ",
      ),
    );

    return every(searchTokens, (token) => includes(haystack, token));
  });
};

const hasNarrowExportFilters = ({ mealType = "all", source = "all", search = "" } = {}) =>
  mealType !== "all" || source !== "all" || Boolean(trim(search));

const buildNutritionHistoryCsvRowsForDay = (day, filters = {}) => {
  const allMeals = flattenHistoryDayMeals(day);
  const meals = filterHistoryMealsForView(allMeals, filters);
  const waterMl = getHistoryDayWaterMl(day);

  if (!meals.length) {
    return allMeals.length === 0 && !hasNarrowExportFilters(filters)
      ? [[day?.date || "", "", "", 0, 0, 0, 0, waterMl]]
      : [];
  }

  return map(meals, (meal) => [
    day?.date || "",
    meal.mealType || "",
    trim(String(meal.name || "")),
    getHistoryMealCalories(meal),
    toRoundedNonNegative(meal.protein),
    toRoundedNonNegative(meal.carbs),
    toRoundedNonNegative(meal.fat),
    waterMl,
  ]);
};

export const buildNutritionHistoryCsvRows = (days = [], filters = {}) => [
  NUTRITION_HISTORY_CSV_HEADER,
  ...flatMap(isArray(days) ? days : [], (day) =>
    buildNutritionHistoryCsvRowsForDay(day, filters),
  ),
];

export const escapeNutritionHistoryCsvCell = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${replace(text, /"/g, '""')}"` : text;
};

export const buildNutritionHistoryCsvContent = (rows = []) =>
  `\uFEFF${join(
    map(rows, (row) =>
      join(map(isArray(row) ? row : [], escapeNutritionHistoryCsvCell), ","),
    ),
    "\r\n",
  )}`;

export const buildNutritionHistoryCsvFilename = ({
  startDate = "start",
  endDate = "end",
  mealType = "all",
  source = "all",
  search = "",
} = {}) => {
  const suffix = compact([
    mealType !== "all" ? kebabCase(mealType) : null,
    source !== "all" ? kebabCase(source) : null,
    trim(search) ? kebabCase(search) : null,
  ]);

  return `nutrition-history-${startDate}-${endDate}${
    suffix.length ? `-${join(suffix, "-")}` : ""
  }.csv`;
};
