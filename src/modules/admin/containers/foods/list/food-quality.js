import every from "lodash/every";
import filter from "lodash/filter";
import includes from "lodash/includes";
import isArray from "lodash/isArray";
import map from "lodash/map";
import round from "lodash/round";
import size from "lodash/size";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const ISSUE_LABELS = {
  missing_translation: "Tarjima kam",
  missing_image: "Rasm yo'q",
  macro_warning: "Makro tekshirilsin",
  missing_category: "Kategoriya yo'q",
  missing_cuisine: "Oshxona yo'q",
  recipe_missing_ingredients: "Recipe tarkibi yo'q",
};

const getCollectionSize = (food, key, idKey) => {
  const collection = food?.[key];

  if (isArray(collection)) {
    return size(filter(collection, Boolean));
  }

  const ids = food?.[idKey];
  return isArray(ids) ? size(filter(ids, Boolean)) : 0;
};

const getActiveLanguageCodes = (activeLanguages = []) =>
  map(
    filter(activeLanguages, (language) => language?.isActive !== false),
    (language) => trim(String(language?.code || "")),
  ).filter(Boolean);

const hasTranslationCoverage = (food = {}, activeLanguages = []) => {
  const codes = getActiveLanguageCodes(activeLanguages);

  if (!codes.length) {
    return Boolean(trim(String(food.name || food.translations?.uz || "")));
  }

  return every(codes, (code) =>
    Boolean(trim(String(food.translations?.[code] || ""))),
  );
};

export const hasFoodMacroWarning = (food = {}) => {
  const calories = toNumber(food.calories);
  const protein = toNumber(food.protein);
  const carbs = toNumber(food.carbs);
  const fat = toNumber(food.fat);

  if (
    !Number.isFinite(calories) ||
    !Number.isFinite(protein) ||
    !Number.isFinite(carbs) ||
    !Number.isFinite(fat)
  ) {
    return true;
  }

  if (calories <= 0 || protein < 0 || carbs < 0 || fat < 0) {
    return true;
  }

  const macroCalories = protein * 4 + carbs * 4 + fat * 9;

  if (macroCalories <= 0) {
    return calories > 0;
  }

  return Math.abs(calories - macroCalories) > Math.max(50, calories * 0.25);
};

export const buildFoodQualitySummary = (food = {}, activeLanguages = []) => {
  const checks = [
    {
      code: "missing_translation",
      passed: hasTranslationCoverage(food, activeLanguages),
    },
    {
      code: "missing_image",
      passed: Boolean(food.imageUrl || food.imageId),
    },
    {
      code: "macro_warning",
      passed: !hasFoodMacroWarning(food),
    },
    {
      code: "missing_category",
      passed: getCollectionSize(food, "categories", "categoryIds") > 0,
    },
    {
      code: "missing_cuisine",
      passed: getCollectionSize(food, "cuisines", "cuisineIds") > 0,
    },
    ...(food.nutritionMode === "recipe"
      ? [
          {
            code: "recipe_missing_ingredients",
            passed:
              getCollectionSize(food, "recipeItems", "recipeItemIds") > 0,
          },
        ]
      : []),
  ];
  const issues = map(
    filter(checks, (check) => !check.passed),
    (check) => ({
      code: check.code,
      label: ISSUE_LABELS[check.code],
    }),
  );
  const passedCount = checks.length - issues.length;
  const score = checks.length
    ? Math.max(0, Math.min(100, round((passedCount / checks.length) * 100)))
    : 0;
  const grade = score >= 85 ? "good" : score >= 65 ? "warning" : "danger";

  return {
    score,
    grade,
    gradeLabel:
      grade === "good" ? "Yaxshi" : grade === "warning" ? "O'rta" : "Past",
    passedCount,
    totalCount: checks.length,
    issues,
    hasIssue: (code) => includes(map(issues, "code"), code),
  };
};
