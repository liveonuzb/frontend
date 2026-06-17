import toNumber from "lodash/toNumber";

export const GRAM_BASED_UNITS = new Set(["g", "ml"]);

export const normalizeNutritionNumber = (value, fallback = 0) => {
  const normalized = toNumber(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

export const getFoodItemUnit = (item) =>
  item?.unit || item?.servingUnit || "g";

export const calculateFoodPortionMacros = (food, amount) => {
  const unit = getFoodItemUnit(food);
  const isUnit = unit && !GRAM_BASED_UNITS.has(unit);
  const factor = isUnit ? amount / (food?.defaultAmount || 1) : amount / 100;

  return {
    cal: Math.round(
      normalizeNutritionNumber(food?.baseCal ?? food?.cal ?? food?.calories) *
        factor,
    ),
    protein: Math.round(
      normalizeNutritionNumber(food?.baseProtein ?? food?.protein) * factor,
    ),
    carbs: Math.round(
      normalizeNutritionNumber(food?.baseCarbs ?? food?.carbs) * factor,
    ),
    fat: Math.round(
      normalizeNutritionNumber(food?.baseFat ?? food?.fat) * factor,
    ),
  };
};

export const getFoodSliderMax = (food) => {
  const unit = getFoodItemUnit(food);
  const isUnit = unit && !GRAM_BASED_UNITS.has(unit);
  return isUnit ? (food?.step || 1) * 20 : 1000;
};
