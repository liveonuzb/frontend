import React from "react";

const STORAGE_KEY = "liveon:nutrition:saved-meal-templates:v1";
const RECURRING_STORAGE_KEY =
  "liveon:nutrition:recurring-meal-template-patterns:v1";

export const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

export const mealTypeToMealKey = (mealType = "") => {
  const normalized = String(mealType).toLowerCase();
  if (normalized.includes("nonushta")) return "breakfast";
  if (normalized.includes("tushlik")) return "lunch";
  if (normalized.includes("kechki")) return "dinner";
  return "snack";
};

export const getWeekdayNameFromDate = (date) => {
  const value = date instanceof Date ? date : new Date(`${date}T00:00:00`);
  if (Number.isNaN(value.getTime())) return WEEK_DAYS[0];
  return WEEK_DAYS[(value.getDay() + 6) % 7];
};

const createId = () =>
  `template-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const readStorageArray = (key) => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorageArray = (key, value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeTemplate = (template = {}) => ({
  id: template.id || createId(),
  name: String(template.name || "Mening shablonim").trim(),
  mealIds: Array.isArray(template.mealIds)
    ? [...new Set(template.mealIds.filter(Boolean))]
    : [],
  createdAt: template.createdAt || new Date().toISOString(),
  updatedAt: template.updatedAt || new Date().toISOString(),
});

const normalizeRecurringPattern = (pattern = {}) => ({
  id: pattern.id || createId(),
  weekday: WEEK_DAYS.includes(pattern.weekday) ? pattern.weekday : WEEK_DAYS[0],
  mealType: String(pattern.mealType || "Nonushta").trim(),
  mealKey: pattern.mealKey || mealTypeToMealKey(pattern.mealType),
  templateId: pattern.templateId || null,
  createdAt: pattern.createdAt || new Date().toISOString(),
  updatedAt: pattern.updatedAt || new Date().toISOString(),
});

export const buildPlanFoodFromSavedMeal = (savedMeal = {}, seed = "") => {
  const grams = Math.max(1, Number(savedMeal.grams) || 100);
  const per100 = (value) => Math.round((Number(value) || 0) / grams * 100);

  return {
    id: `saved-template-${savedMeal.id || seed}-${Date.now()}-${seed}`,
    name: savedMeal.name,
    source: "saved-meal-template",
    savedMealId: savedMeal.id,
    image: savedMeal.imageUrl,
    ingredients: savedMeal.ingredients || [],
    grams,
    defaultAmount: grams,
    unit: "g",
    step: 10,
    baseCal: per100(savedMeal.calories),
    baseProtein: per100(savedMeal.protein),
    baseCarbs: per100(savedMeal.carbs),
    baseFat: per100(savedMeal.fat),
    cal: Math.round(Number(savedMeal.calories) || 0),
    protein: Math.round(Number(savedMeal.protein) || 0),
    carbs: Math.round(Number(savedMeal.carbs) || 0),
    fat: Math.round(Number(savedMeal.fat) || 0),
    fiber: Math.round(Number(savedMeal.fiber) || 0),
  };
};

export const buildLoggedMealFromSavedMealTemplate = (savedMeal = {}) => ({
  name: savedMeal.name,
  source: "saved-meal-template",
  savedMealId: savedMeal.id,
  cal: savedMeal.calories,
  protein: savedMeal.protein,
  carbs: savedMeal.carbs,
  fat: savedMeal.fat,
  fiber: savedMeal.fiber,
  grams: savedMeal.grams,
  image: savedMeal.imageUrl,
  ingredients: savedMeal.ingredients,
});

export const useSavedMealTemplates = () => {
  const [templates, setTemplates] = React.useState(() =>
    readStorageArray(STORAGE_KEY).map(normalizeTemplate),
  );
  const [recurringPatterns, setRecurringPatterns] = React.useState(() =>
    readStorageArray(RECURRING_STORAGE_KEY).map(normalizeRecurringPattern),
  );

  React.useEffect(() => {
    writeStorageArray(STORAGE_KEY, templates);
  }, [templates]);

  React.useEffect(() => {
    writeStorageArray(RECURRING_STORAGE_KEY, recurringPatterns);
  }, [recurringPatterns]);

  const createTemplate = React.useCallback((template) => {
    const nextTemplate = normalizeTemplate({
      ...template,
      id: createId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setTemplates((current) => [nextTemplate, ...current]);
    return nextTemplate;
  }, []);

  const updateTemplate = React.useCallback((templateId, patch) => {
    const updatedAt = new Date().toISOString();
    setTemplates((current) =>
      current.map((template) =>
        template.id === templateId
          ? normalizeTemplate({ ...template, ...patch, updatedAt })
          : template,
      ),
    );
  }, []);

  const deleteTemplate = React.useCallback((templateId) => {
    setTemplates((current) =>
      current.filter((template) => template.id !== templateId),
    );
    setRecurringPatterns((current) =>
      current.filter((pattern) => pattern.templateId !== templateId),
    );
  }, []);

  const upsertRecurringPattern = React.useCallback((pattern) => {
    const nextPattern = normalizeRecurringPattern({
      ...pattern,
      id: pattern.id || createId(),
      updatedAt: new Date().toISOString(),
    });

    setRecurringPatterns((current) => {
      const existing = current.find(
        (item) =>
          item.weekday === nextPattern.weekday &&
          item.mealType === nextPattern.mealType,
      );

      if (!existing) {
        return [nextPattern, ...current];
      }

      return current.map((item) =>
        item.id === existing.id
          ? {
              ...nextPattern,
              id: existing.id,
              createdAt: existing.createdAt,
            }
          : item,
      );
    });
  }, []);

  const deleteRecurringPattern = React.useCallback((patternId) => {
    setRecurringPatterns((current) =>
      current.filter((pattern) => pattern.id !== patternId),
    );
  }, []);

  return {
    templates,
    recurringPatterns,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    upsertRecurringPattern,
    deleteRecurringPattern,
  };
};
