export const unwrapApiData = (response) =>
  response?.data?.data ?? response?.data ?? null;

export const personalizationLoadingSteps = [
  "bmr",
  "metabolicAge",
  "calories",
  "mealPlan",
  "workoutPlan",
  "finalizing",
];

export const personalizationChecklist = [
  "wellnessPlan",
  "bmrFormula",
  "metabolicAge",
  "calorieMacros",
  "mealPlan",
  "workoutPlan",
  "finalizing",
];

export const clampProgress = (value) =>
  Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export const formatNumber = (value, locale = "uz-UZ") => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";
  return new Intl.NumberFormat(locale).format(Math.round(numberValue));
};

export const formatWeightDelta = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "0 kg";
  if (numberValue === 0) return "0 kg";
  return `${numberValue > 0 ? "+" : ""}${Math.round(numberValue * 10) / 10} kg`;
};

export const macroCalories = ({
  proteinGram = 0,
  carbsGram = 0,
  fatGram = 0,
}) => Number(proteinGram) * 4 + Number(carbsGram) * 4 + Number(fatGram) * 9;

export const getMacroBalanceMessage = (result, t) => {
  const total = macroCalories(result);
  const target = Number(result?.dailyCalories) || 0;

  if (!target || !total) {
    return t("onboarding.postOnboarding.result.balanceUnknown");
  }

  const diff = Math.round(total - target);
  if (Math.abs(diff) <= 80) {
    return t("onboarding.postOnboarding.result.balanceGood");
  }

  return diff > 0
    ? t("onboarding.postOnboarding.result.balanceHigh", { value: diff })
    : t("onboarding.postOnboarding.result.balanceLow", {
        value: Math.abs(diff),
      });
};

export const normalizeEquipmentIds = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

export const normalizeCustomEquipment = (values) => {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).reduce((acc, value) => {
    const label = String(value ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const key = label.toLocaleLowerCase("uz-UZ");

    if (!label || seen.has(key)) return acc;
    seen.add(key);
    acc.push(label);
    return acc;
  }, []);
};

export const normalizeCatalogIds = normalizeEquipmentIds;
export const normalizeCustomItems = normalizeCustomEquipment;

export const splitTextList = (value) =>
  String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((item, index, list) => {
      const key = item.toLocaleLowerCase("uz-UZ");
      return (
        list.findIndex((next) => next.toLocaleLowerCase("uz-UZ") === key) ===
        index
      );
    });

export const onboardingPreferenceFields = new Set([
  "currentWeight",
  "goal",
  "activityLevel",
  "foodBudget",
  "allergies",
  "dietRequirements",
  "dislikedFoods",
  "workoutExperience",
  "sleepHours",
  "injurySeverity",
  "forbiddenExercises",
]);

export const isOnboardingPreferenceField = (key) =>
  onboardingPreferenceFields.has(key);

export const buildOnboardingPreferencePatch = (key, value, onboarding = {}) => {
  if (key === "allergies") {
    const allergyIds = normalizeCatalogIds(value?.ids);
    return {
      allergyIds,
      allergyIngredientIds: allergyIds,
      customAllergies: normalizeCustomItems(value?.customItems),
    };
  }

  if (key === "dietRequirements") {
    return {
      dietRequirementIds: normalizeCatalogIds(value?.ids),
      customDietRequirements: normalizeCustomItems(value?.customItems),
    };
  }

  if (key === "dislikedFoods") {
    return {
      dislikedFoodIds: normalizeCatalogIds(value?.ids),
      customDislikedFoods: normalizeCustomItems(value?.customItems),
    };
  }

  if (key === "currentWeight") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue)
      ? {
          currentWeight: {
            value: numberValue,
            unit: onboarding?.currentWeight?.unit ?? "kg",
          },
        }
      : {};
  }

  if (key === "foodBudget") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= 0
      ? {
          foodBudget: numberValue,
          budgetPeriod: onboarding?.budgetPeriod ?? "weekly",
          budgetCurrency: onboarding?.budgetCurrency ?? "UZS",
        }
      : { foodBudget: null };
  }

  if (key === "sleepHours") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0
      ? { sleepHours: numberValue }
      : { sleepHours: null };
  }

  if (key === "forbiddenExercises") {
    return { forbiddenExercises: splitTextList(value) };
  }

  if (
    ["goal", "activityLevel", "workoutExperience", "injurySeverity"].includes(
      key,
    )
  ) {
    return { [key]: value || null };
  }

  return {};
};

export const buildOnboardingSyncPatch = (key, value, onboarding = {}) => {
  if (key === "targetWeight") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue)
      ? {
          targetWeight: {
            value: numberValue,
            unit: onboarding?.targetWeight?.unit ?? "kg",
          },
        }
      : {};
  }

  if (key === "weeklyWeightChangeGoal") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? { weeklyPace: numberValue } : {};
  }

  if (key === "mealsPerDay") {
    const numberValue = Number(value);
    return Number.isInteger(numberValue)
      ? { mealFrequency: String(numberValue) }
      : {};
  }

  if (key === "weeklyWorkoutDays") {
    const numberValue = Number(value);
    return Number.isInteger(numberValue)
      ? { weeklyWorkoutCount: numberValue }
      : {};
  }

  if (key === "workoutLocation") {
    return value ? { workoutLocation: value } : {};
  }

  if (key === "equipment") {
    return {
      equipmentIds: normalizeEquipmentIds(value?.equipmentIds),
      customEquipment: normalizeCustomEquipment(value?.customEquipment),
    };
  }

  return {};
};

export const buildPersonalizationPatch = (key, value) => {
  if (key === "equipment") {
    return {
      equipmentIds: normalizeEquipmentIds(value?.equipmentIds),
      customEquipment: normalizeCustomEquipment(value?.customEquipment),
    };
  }

  if (value === "" || value === null || value === undefined) {
    return {};
  }

  if (["workoutLocation"].includes(key)) {
    return { [key]: value };
  }

  return { [key]: Number(value) };
};
