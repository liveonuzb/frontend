export const DEFAULT_MEAL_TYPE = "breakfast";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_CONFIG = {
  breakfast: { label: "Nonushta", emoji: "🍳", time: "06:00 - 10:00" },
  lunch: { label: "Tushlik", emoji: "🥗", time: "12:00 - 14:00" },
  dinner: { label: "Kechki ovqat", emoji: "🍲", time: "18:00 - 21:00" },
  snack: { label: "Snack", emoji: "🥜", time: "Istalgan vaqt" },
};

export const MEAL_LABELS = MEAL_TYPES.reduce((labels, type) => {
  labels[type] = MEAL_CONFIG[type].label;
  return labels;
}, {});

export const MEAL_ICONS = MEAL_TYPES.reduce((icons, type) => {
  icons[type] = MEAL_CONFIG[type].emoji;
  return icons;
}, {});

export const MEAL_TYPE_OPTIONS = MEAL_TYPES.map((type) => ({
  value: type,
  label: MEAL_CONFIG[type].label,
}));

export const MEAL_LABEL_TO_TYPE = MEAL_TYPES.reduce((labels, type) => {
  labels[MEAL_CONFIG[type].label] = type;
  return labels;
}, {});

export const getMealConfig = (type, fallback = {}) =>
  MEAL_CONFIG[type] || fallback;
