import { map, reduce } from "lodash";
export const DEFAULT_MEAL_TYPE = "breakfast";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_CONFIG = {
  breakfast: { label: "Nonushta", emoji: "🍳", time: "06:00 - 10:00" },
  lunch: { label: "Tushlik", emoji: "🥗", time: "12:00 - 14:00" },
  dinner: { label: "Kechki ovqat", emoji: "🍲", time: "18:00 - 21:00" },
  snack: { label: "Snack", emoji: "🥜", time: "Istalgan vaqt" },
};

export const MEAL_LABELS = reduce(MEAL_TYPES, (labels, type) => {
  labels[type] = MEAL_CONFIG[type].label;
  return labels;
}, {});

export const MEAL_ICONS = reduce(MEAL_TYPES, (icons, type) => {
  icons[type] = MEAL_CONFIG[type].emoji;
  return icons;
}, {});

export const MEAL_TYPE_OPTIONS = map(MEAL_TYPES, (type) => ({
  value: type,
  label: MEAL_CONFIG[type].label,
}));

export const MEAL_LABEL_TO_TYPE = reduce(MEAL_TYPES, (labels, type) => {
  labels[MEAL_CONFIG[type].label] = type;
  return labels;
}, {});

export const getMealConfig = (type, fallback = {}) =>
  MEAL_CONFIG[type] || fallback;
