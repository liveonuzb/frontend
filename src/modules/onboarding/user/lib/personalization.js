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

export const macroCalories = ({ proteinGram = 0, carbsGram = 0, fatGram = 0 }) =>
  Number(proteinGram) * 4 + Number(carbsGram) * 4 + Number(fatGram) * 9;

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
    : t("onboarding.postOnboarding.result.balanceLow", { value: Math.abs(diff) });
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
    const label = String(value ?? "").replace(/\s+/g, " ").trim();
    const key = label.toLocaleLowerCase("uz-UZ");

    if (!label || seen.has(key)) return acc;
    seen.add(key);
    acc.push(label);
    return acc;
  }, []);
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
