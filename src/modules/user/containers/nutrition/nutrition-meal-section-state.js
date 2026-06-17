import {
  MEAL_CONFIG,
  MEAL_LABEL_TO_TYPE,
  MEAL_TYPES,
} from "@/modules/user/lib/meal-config";
import { getDraftNutritionPreview } from "./meal-draft-review-utils.js";

import filter from "lodash/filter";
import forEach from "lodash/forEach";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import keys from "lodash/keys";
import map from "lodash/map";
import reduce from "lodash/reduce";
import some from "lodash/some";
import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import toPairs from "lodash/toPairs";
import trim from "lodash/trim";
import lodashValues from "lodash/values";
import flatten from "lodash/flatten";

export const CALORIE_FILTER_DEFAULT = [0, 1000];

export const normalizeSearchText = (value) =>
  toLower(trim(String(value || "")));

export const getMealDateKey = (food, fallbackDateKey) => {
  const value =
    food?.addedAt || food?.createdAt || food?.date || fallbackDateKey;
  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return fallbackDateKey;
  }

  return parsed.toISOString().slice(0, 10);
};

export const getMealKey = (type) =>
  MEAL_LABEL_TO_TYPE[type] || toLower(String(type || ""));

export const getActiveMealType = (now = new Date()) => {
  const hour = now.getHours();
  if (hour >= 6 && hour < 10) return "breakfast";
  if (hour >= 10 && hour < 14) return "lunch";
  if (hour >= 14 && hour < 18) return "snack";
  if (hour >= 18 && hour < 23) return "dinner";
  return "snack";
};

export const buildPendingScanFoodsByType = (pendingScans = []) => {
  return reduce(
    pendingScans,
    (acc, scan) => {
      const preview = scan.item ? getDraftNutritionPreview(scan.item) : {};
      const food = {
        id: scan.id,
        status: scan.status,
        source: "camera",
        name: scan.item?.title || "",
        cal: preview.calories || 0,
        protein: preview.protein || 0,
        carbs: preview.carbs || 0,
        fat: preview.fat || 0,
        image: scan.imageUrl || scan.imageDataUrl,
        error: scan.error,
        scanId: scan.id,
      };
      const mealType = scan.mealType || "breakfast";
      acc[mealType] = [...(acc[mealType] || []), food];
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] },
  );
};

export const buildPlannedByType = (currentDayPlan = []) => {
  const result = {};
  forEach(currentDayPlan, (col) => {
    const key = getMealKey(col.type);
    if (key) {
      result[key] = [
        ...(result[key] || []),
        ...map(col.items || [], (item, idx) => ({
          ...item,
          id: item.id || `plan-${col.type}-${item.name}-${idx}`,
          colType: col.type,
        })),
      ];
    }
  });
  return result;
};

export const getMealIdentity = (item = {}) =>
  item.barcode ||
  filter(
    [item.name, item.grams ?? item.defaultAmount ?? "", item.unit ?? ""],
    Boolean,
  ).join(":");

export const mergePlannedAndLoggedMealItems = ({
  items = [],
  plannedItems = [],
} = {}) => {
  const loggedQueues = new Map();

  forEach(items, (item) => {
    const identity = getMealIdentity(item) || `logged:${item.id || item.name}`;
    const queue = loggedQueues.get(identity) || [];
    queue.push(item);
    loggedQueues.set(identity, queue);
  });

  const mergedItems = map(plannedItems, (plannedItem) => {
    const identity =
      getMealIdentity(plannedItem) || `planned:${plannedItem.id || plannedItem.name}`;
    const queue = loggedQueues.get(identity);

    if (queue?.length) {
      const consumedItem = queue.shift();
      return {
        ...consumedItem,
        isConsumed: true,
        isFromPlanLinked: true,
      };
    }

    return {
      ...plannedItem,
      isPlanned: true,
      isConsumed: false,
      isFromPlanLinked: true,
    };
  });

  loggedQueues.forEach((queue) => {
    forEach(queue, (item) => {
      mergedItems.push({
        ...item,
        isConsumed: true,
        isFromPlanLinked: false,
      });
    });
  });

  return mergedItems;
};

export const buildSortedMealSections = ({
  currentDayPlan = [],
  meals = {},
  pendingScanFoodsByType = {},
  plannedByType = {},
}) => {
  if (currentDayPlan.length === 0) {
    return map(toPairs(MEAL_CONFIG), ([type, config]) => [
      type,
      {
        ...config,
        name: config.label,
        foods: [
          ...(meals[type] || []),
          ...(pendingScanFoodsByType[type] || []),
        ],
        plannedItems: plannedByType[type] || [],
      },
    ]);
  }

  const plannedSections = reduce(
    currentDayPlan,
    (acc, col) => {
      const key = getMealKey(col.type);
      const config = MEAL_CONFIG[key];

      if (!config || acc[key]) {
        return acc;
      }

      acc[key] = {
        ...config,
        name: config.label,
        time: col.time || config.time,
        foods: [
          ...(meals[key] || []),
          ...(pendingScanFoodsByType[key] || []),
        ],
        plannedItems: plannedByType[key] || [],
      };

      return acc;
    },
    {},
  );

  const loggedOnlyKeys = filter(
    MEAL_TYPES,
    (key) =>
      !plannedSections[key] &&
      ((meals[key] || []).length > 0 ||
        (pendingScanFoodsByType[key] || []).length > 0),
  );

  return map([...keys(plannedSections), ...loggedOnlyKeys], (key) => [
    key,
    plannedSections[key] || {
      ...MEAL_CONFIG[key],
      name: MEAL_CONFIG[key].label,
      foods: [...(meals[key] || []), ...(pendingScanFoodsByType[key] || [])],
      plannedItems: plannedByType[key] || [],
    },
  ]);
};

export const filterMealSections = ({
  sortedMealSections = [],
  mealFilter = "all",
  sourceFilters = [],
  mealSearch = "",
  calorieRange = CALORIE_FILTER_DEFAULT,
  filterDateRange = {},
  dateKey,
}) => {
  const searchTerm = normalizeSearchText(mealSearch);
  const [minCalories, maxCalories] = calorieRange;
  const hasCalorieFilter =
    minCalories > CALORIE_FILTER_DEFAULT[0] ||
    maxCalories < CALORIE_FILTER_DEFAULT[1];
  const hasDateFilter = Boolean(filterDateRange.start || filterDateRange.end);

  const matchesSearch = (food) => {
    if (!searchTerm) return true;
    return some(
      filter(
        [
          food?.name,
          food?.title,
          food?.description,
          food?.barcode,
          ...(isArray(food?.ingredients)
            ? map(food.ingredients, (ingredient) => ingredient?.name)
            : []),
        ],
        Boolean,
      ),
      (value) => includes(toLower(String(value)), searchTerm),
    );
  };

  const matchesCalories = (food) => {
    if (!hasCalorieFilter) return true;
    const calories = Math.round(toNumber(food?.cal ?? food?.calories ?? 0));
    return calories >= minCalories && calories <= maxCalories;
  };

  const matchesDateRange = (food) => {
    if (!hasDateFilter) return true;
    const itemDateKey = getMealDateKey(food, dateKey);
    if (filterDateRange.start && itemDateKey < filterDateRange.start) {
      return false;
    }
    if (filterDateRange.end && itemDateKey > filterDateRange.end) {
      return false;
    }
    return true;
  };

  const matchesAdvancedFilters = (food) =>
    matchesSearch(food) && matchesCalories(food) && matchesDateRange(food);

  return reduce(
    sortedMealSections,
    (sections, [type, section]) => {
      if (mealFilter !== "all" && type !== mealFilter) {
        return sections;
      }

      const isActiveSource = (src) => {
        if (sourceFilters.length === 0) return true;
        return includes(sourceFilters, src);
      };

      const filteredFoods = filter(
        section.foods || [],
        (food) =>
          isActiveSource(food.source || "manual") &&
          matchesAdvancedFilters(food),
      );

      const filteredPlannedItems = isActiveSource("meal-plan")
        ? filter(section.plannedItems || [], (food) =>
            matchesAdvancedFilters(food),
          )
        : [];

      if (
        (sourceFilters.length > 0 ||
          searchTerm ||
          hasCalorieFilter ||
          hasDateFilter) &&
        filteredFoods.length === 0 &&
        filteredPlannedItems.length === 0
      ) {
        return sections;
      }

      sections.push([
        type,
        {
          ...section,
          foods: filteredFoods,
          plannedItems: filteredPlannedItems,
        },
      ]);
      return sections;
    },
    [],
  );
};

export const getActiveNutritionFilterCount = ({
  sourceFilters = [],
  mealSearch = "",
  calorieRange = CALORIE_FILTER_DEFAULT,
  filterDateRange = {},
}) => {
  let count = sourceFilters.length;
  if (normalizeSearchText(mealSearch)) count += 1;
  if (
    calorieRange[0] > CALORIE_FILTER_DEFAULT[0] ||
    calorieRange[1] < CALORIE_FILTER_DEFAULT[1]
  ) {
    count += 1;
  }
  if (filterDateRange.start || filterDateRange.end) count += 1;
  return count;
};

export const buildNutritionTotals = (meals = {}) => {
  const allFoods = flatten(lodashValues(meals));
  const totals = reduce(
    allFoods,
    (acc, f) => {
      const qty = f.qty ?? 1;
      return {
        calories: acc.calories + (f.cal ?? 0) * qty,
        protein: acc.protein + (f.protein ?? 0) * qty,
        carbs: acc.carbs + (f.carbs ?? 0) * qty,
        fat: acc.fat + (f.fat ?? 0) * qty,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fat: Math.round(totals.fat),
  };
};

export const getWaterConsumedMl = ({ dayData = {}, goals = {} }) => {
  const cupSize = toNumber(goals.cupSize || 250);
  const waterLog = isArray(dayData.waterLog) ? dayData.waterLog : [];

  if (waterLog.length > 0) {
    return reduce(
      waterLog,
      (sum, entry) => sum + toNumber(entry?.amountMl || cupSize || 0),
      0,
    );
  }

  return toNumber(dayData.waterCups || 0) * cupSize;
};
