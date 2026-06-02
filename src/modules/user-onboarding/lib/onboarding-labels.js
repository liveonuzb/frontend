import toLower from "lodash/toLower";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";
const ACTIVITY_LABEL_KEYS = {
  sedentary: "sedentary",
  "lightly-active": "lightlyActive",
  lightly_active: "lightlyActive",
  "moderately-active": "moderatelyActive",
  moderately_active: "moderatelyActive",
  "very-active": "veryActive",
  very_active: "veryActive",
};

const WORKOUT_COUNT_KEYS = {
  0: "none",
  2: "light",
  4: "balanced",
  6: "active",
  7: "daily",
};

const DIET_REQUIREMENT_LABEL_KEYS = {
  halal: "halal",
  halol: "halal",
  vegetarian: "vegetarian",
  vegan: "vegan",
  keto: "keto",
  "gluten free": "glutenFree",
  "gluten-free": "glutenFree",
  glutensiz: "glutenFree",
  "sugar free": "sugarFree",
  "sugar-free": "sugarFree",
  shakarsiz: "sugarFree",
  "no sugar": "sugarFree",
  "lactose free": "lactoseFree",
  "lactose-free": "lactoseFree",
  laktozasiz: "lactoseFree",
  "diabet uchun mos": "diabeticFriendly",
  "diabetic friendly": "diabeticFriendly",
  "diabetes friendly": "diabeticFriendly",
  "kam tuz": "lowSalt",
  "low salt": "lowSalt",
  "low sodium": "lowSalt",
  "high protein": "highProtein",
  "protein rich": "highProtein",
  "proteinli": "highProtein",
};

const normalizeLabelKey = (value) =>
  toLower(trim(String(value ?? "")))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const getOnboardingValueLabel = (type, value, t) => {
  if (value === null || value === undefined || value === "") {
    return t("onboarding.review.emptyValue");
  }

  const normalized = String(value);

  switch (type) {
    case "gender":
      return t(`onboarding.gender.${normalized}`, { defaultValue: normalized });
    case "goal":
      return t(`onboarding.goal.${normalized}`, { defaultValue: normalized });
    case "activityLevel": {
      const key = ACTIVITY_LABEL_KEYS[normalized] ?? normalized;
      return t(`onboarding.activityLevel.${key}`, { defaultValue: normalized });
    }
    case "weeklyWorkoutCount": {
      const key = WORKOUT_COUNT_KEYS[normalized];
      return key
        ? t(`onboarding.lifestyle.weeklyWorkoutCountOptions.${key}.title`)
        : t("onboarding.lifestyle.weeklyWorkoutCountOption", {
            count: normalized,
          });
    }
    case "workoutExperience":
      return t(`onboarding.lifestyle.workoutExperiences.${normalized}`, {
        defaultValue: normalized,
      });
    case "workoutLocation":
      return t(`onboarding.workoutSteps.location.options.${normalized}.label`, {
        defaultValue: normalized,
      });
    case "foodBudgetTier":
      return t(`onboarding.foodBudget.tiers.${normalized}.summary`, {
        defaultValue: normalized,
      });
    default:
      return normalized;
  }
};

export const getCountSummary = (count, t, emptyKey = "onboarding.review.none") =>
  toNumber(count) > 0
    ? t("onboarding.review.countValue", { count })
    : t(emptyKey);

export const getDietRequirementLabel = (option, fallback, t) => {
  const rawLabel = option?.name ?? fallback;
  const labelKey = DIET_REQUIREMENT_LABEL_KEYS[normalizeLabelKey(rawLabel)];

  if (!labelKey) {
    return rawLabel;
  }

  return t(`onboarding.nutritionSteps.dietRequirements.options.${labelKey}`, {
    defaultValue: rawLabel,
  });
};
