import { formatWeightDelta } from "../../lib/personalization.js";

import filter from "lodash/filter";
import isArray from "lodash/isArray";
import map from "lodash/map";
import padStart from "lodash/padStart";
import replace from "lodash/replace";
import startsWith from "lodash/startsWith";
import take from "lodash/take";
import toNumber from "lodash/toNumber";
import trim from "lodash/trim";

const fallbackResult = {
  dailyCalories: 2100,
  weightToChange: -10,
  weeklyWeightChangeGoal: 0.5,
  carbsGram: 230,
  proteinGram: 160,
  fatGram: 65,
  recommendedWaterMl: 2500,
  currentWeight: 70,
  goal: "lose",
  activityLevel: "moderately-active",
};

const resultLocalePrefix = "onboarding.postOnboarding.result";

const translateResult = (t, key, options) =>
  typeof t === "function"
    ? t(`${resultLocalePrefix}.${key}`, options)
    : `${resultLocalePrefix}.${key}`;

const goalOptionKeyMap = {
  lose: "lose",
  weight_loss: "lose",
  weightLoss: "lose",
  maintain: "maintain",
  gain: "gain",
  muscle_gain: "gain",
  healthy_lifestyle: "healthy_lifestyle",
  performance: "performance",
};

const activityOptionKeyMap = {
  sedentary: "sedentary",
  "lightly-active": "lightly-active",
  lightly_active: "lightly-active",
  "moderately-active": "moderately-active",
  moderately_active: "moderately-active",
  "very-active": "very-active",
  very_active: "very-active",
};

const getNumberOrFallback = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = toNumber(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const formatNumber = (value, fallback = "-") => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return fallback;
  return new Intl.NumberFormat("en-US").format(Math.round(numberValue));
};

const formatDecimal = (value, fractionDigits = 1, fallback = "-") => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return fallback;
  return numberValue.toFixed(fractionDigits).replace(/\.0$/, "");
};

const formatKcal = (value, fallback = "-") => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return fallback;
  return `${formatNumber(numberValue)} kcal`;
};

const formatSignedKcal = (value, fallback = "-") => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return fallback;
  const rounded = Math.round(numberValue);
  return `${rounded > 0 ? "+" : ""}${formatNumber(rounded)} kcal`;
};

const formatMultiplier = (value) => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return "-";
  return `x${numberValue.toFixed(2).replace(/\.?0+$/, "")}`;
};

const formatPercent = (value) => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return "-";
  return `${numberValue.toFixed(1).replace(/\.0$/, "")}%`;
};

const formatFormulaName = (value) => {
  if (value === "mifflin_st_jeor") return "Mifflin-St Jeor";
  if (value === "katch_mcardle") return "Katch-McArdle";
  return value ? String(value) : "Mifflin-St Jeor";
};

const warningTranslationKeyMap = {
  metabolicAgeIsEstimatedIndicator: "metabolicAgeEstimated",
  bmiIsEstimatedIndicator: "bmiEstimated",
  tdeeIsEstimatedIndicator: "tdeeEstimated",
  bmrIsEstimatedIndicator: "bmrEstimated",
};

const formatWarningLabel = (value, t) => {
  if (!value) return "";
  if (warningTranslationKeyMap[value]) {
    return translateResult(t, `warnings.${warningTranslationKeyMap[value]}`);
  }

  return trim(
    replace(
      replace(
        replace(String(value), /([a-z])([A-Z])/g, "$1 $2"),
        /[_-]+/g,
        " ",
      ),
      /\s+/g,
      " ",
    ),
  );
};

const formatLiters = (value) => {
  const numberValue = getNumberOrFallback(value, null);
  if (numberValue === null) return "-";
  const liters = numberValue >= 100 ? numberValue / 1000 : numberValue;
  const rounded = Math.round(liters * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} L`;
};

const formatTargetDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const month = padStart(String(date.getMonth() + 1), 2, "0");
  const day = padStart(String(date.getDate()), 2, "0");
  return `${date.getFullYear()} M${month} ${day}`;
};

const resolveGoalOptionKey = (goalKey) =>
  goalOptionKeyMap[goalKey] ?? fallbackResult.goal;

const resolveActivityOptionKey = (activityKey) =>
  activityOptionKeyMap[activityKey] ?? fallbackResult.activityLevel;

const resolveExplanation = (result = {}, goalKey, t) => {
  const explanation =
    typeof result?.explanation === "string" ? trim(result.explanation) : "";
  const optionKey = resolveGoalOptionKey(goalKey);
  return (
    explanation ||
    translateResult(t, `goalExplanations.${optionKey}`) ||
    translateResult(t, "fallbackExplanation")
  );
};

const normalizeProgress = (value) => {
  const numberValue = getNumberOrFallback(value, 0);
  return Math.max(0, Math.min(100, Math.round(numberValue * 10) / 10));
};

const buildMacro = ({ label, grams, report, caloriesPerGram }) => {
  const gramsValue = getNumberOrFallback(report?.grams ?? grams, grams);
  const kcalValue =
    getNumberOrFallback(report?.calories, null) ??
    (getNumberOrFallback(gramsValue, null) !== null
      ? gramsValue * caloriesPerGram
      : null);
  const percentValue =
    getNumberOrFallback(report?.percent, null) ??
    getNumberOrFallback(report?.percentage, null);

  return {
    label,
    grams: `${formatNumber(gramsValue)} g`,
    kcal: formatKcal(kcalValue),
    percent: formatPercent(percentValue),
    progress: normalizeProgress(percentValue),
  };
};

export const buildMetabolismResultViewModel = (
  result = {},
  onboarding = {},
  t,
) => {
  const calculationReport =
    result?.calculationReport && typeof result.calculationReport === "object"
      ? result.calculationReport
      : null;
  const macroReport = calculationReport?.macros ?? {};
  const calorieReport = calculationReport?.calories ?? {};
  const activityReport = calculationReport?.activity ?? {};
  const formulaName = formatFormulaName(calculationReport?.formula?.bmr);
  const providedGoalKey = onboarding?.goal ?? result?.goal;
  const goalKey = providedGoalKey ?? fallbackResult.goal;
  const activityKey =
    onboarding?.activityLevel ??
    result?.activityLevel ??
    fallbackResult.activityLevel;

  const currentWeight = getNumberOrFallback(
    onboarding?.currentWeight?.value ?? result?.currentWeight,
    fallbackResult.currentWeight,
  );
  const targetWeight = getNumberOrFallback(
    onboarding?.targetWeight?.value ?? result?.targetWeight,
    null,
  );
  const dailyCalories = getNumberOrFallback(
    calorieReport.final ?? result?.dailyCalories,
    fallbackResult.dailyCalories,
  );
  const proteinGram = getNumberOrFallback(
    macroReport.protein?.grams ?? result?.proteinGram,
    fallbackResult.proteinGram,
  );
  const carbsGram = getNumberOrFallback(
    macroReport.carbs?.grams ?? result?.carbsGram,
    fallbackResult.carbsGram,
  );
  const fatGram = getNumberOrFallback(
    macroReport.fat?.grams ?? result?.fatGram,
    fallbackResult.fatGram,
  );
  const bmr = getNumberOrFallback(activityReport.bmr ?? result?.bmr, null);
  const tdee = getNumberOrFallback(activityReport.tdee ?? result?.tdee, null);
  const activityMultiplier = getNumberOrFallback(
    activityReport.multiplier,
    null,
  );
  const goalAdjustment = getNumberOrFallback(
    calorieReport.goalAdjustment,
    null,
  );
  const weeklyRate = getNumberOrFallback(
    result?.weeklyWeightChangeGoal ?? onboarding?.weeklyPace,
    fallbackResult.weeklyWeightChangeGoal,
  );
  const waterMl = getNumberOrFallback(
    result?.recommendedWaterMl,
    fallbackResult.recommendedWaterMl,
  );
  const goalOptionKey = resolveGoalOptionKey(goalKey);
  const activityOptionKey = resolveActivityOptionKey(activityKey);
  const model = {
    title: translateResult(t, "heroTitle"),
    description: translateResult(t, "heroDescription"),
    aiAnalysis: resolveExplanation(result, providedGoalKey, t),
    currentWeight: `${formatNumber(currentWeight)} kg`,
    targetWeight: targetWeight !== null ? `${formatNumber(targetWeight)} kg` : "-",
    weightDiff: formatWeightDelta(
      getNumberOrFallback(result?.weightToChange, fallbackResult.weightToChange),
    ),
    weeklyPace: translateResult(t, "weeklyPaceValue", {
      value: formatDecimal(weeklyRate),
    }),
    bmr: formatKcal(bmr),
    activityMultiplier: formatMultiplier(activityMultiplier),
    activityLabel: translateResult(t, `options.activityLevel.${activityOptionKey}`),
    tdee: formatKcal(tdee),
    goalAdjustment: formatSignedKcal(goalAdjustment),
    dailyCalories: formatNumber(dailyCalories),
    dailyCaloriesWithUnit: formatKcal(dailyCalories),
    waterLiters: formatLiters(waterMl),
    steps: formatNumber(result?.dailyStepsTarget, "-"),
    bmi: formatDecimal(result?.bmi, 1),
    metabolicAge:
      getNumberOrFallback(result?.metabolicAge, null) !== null
        ? translateResult(t, "metabolicAgeValue", {
            value: formatNumber(result.metabolicAge),
          })
        : "-",
    targetDate: formatTargetDate(result?.estimatedGoalDate),
    goal: translateResult(t, `options.goal.${goalOptionKey}`),
    formulaName,
    hasCalculationReport: Boolean(calculationReport),
    warningPills: filter([
      calorieReport.floorApplied ? translateResult(t, "warnings.floorApplied") : null,
      calorieReport.capApplied ? translateResult(t, "warnings.capApplied") : null,
      ...(isArray(calculationReport?.warnings)
        ? map(take(calculationReport.warnings, 2), (warning) =>
            formatWarningLabel(warning, t),
          )
        : []),
    ], Boolean),
    macros: {
      protein: buildMacro({
        label: translateResult(t, "metrics.protein"),
        grams: proteinGram,
        report: macroReport.protein,
        caloriesPerGram: 4,
      }),
      carbs: buildMacro({
        label: translateResult(t, "metrics.carbs"),
        grams: carbsGram,
        report: macroReport.carbs,
        caloriesPerGram: 4,
      }),
      fat: buildMacro({
        label: translateResult(t, "metrics.fat"),
        grams: fatGram,
        report: macroReport.fat,
        caloriesPerGram: 9,
      }),
    },
  };

  model.heroStats = [
    {
      key: "currentWeight",
      label: translateResult(t, "preferences.currentWeight"),
      value: model.currentWeight,
    },
    {
      key: "targetWeight",
      label: translateResult(t, "preferences.targetWeight"),
      value: model.targetWeight,
    },
    {
      key: "weightDiff",
      label: translateResult(t, "weightDifference"),
      value: model.weightDiff,
      positive: startsWith(model.weightDiff, "-"),
    },
    {
      key: "weeklyPace",
      label: translateResult(t, "weeklyPace"),
      value: model.weeklyPace,
    },
  ];

  model.calculationSteps = [
    { key: "bmr", label: "BMR", value: model.bmr, caption: formulaName },
    {
      key: "activity",
      label: translateResult(t, "calculation.activity"),
      value: model.activityMultiplier,
      caption: model.activityLabel,
      operator: "+",
    },
    {
      key: "tdee",
      label: "TDEE",
      value: model.tdee,
      caption: translateResult(t, "calculation.tdeeCaption"),
      operator: "x",
    },
    {
      key: "adjustment",
      label: translateResult(t, "calculation.adjustment"),
      value: model.goalAdjustment,
      caption: translateResult(t, "calculation.adjustmentCaption"),
      operator: "-",
    },
    {
      key: "final",
      label: translateResult(t, "calculation.final"),
      value: model.dailyCaloriesWithUnit,
      caption: translateResult(t, "calculation.finalCaption"),
      operator: "=",
      highlighted: true,
    },
  ];

  model.dailyIndicators = [
    { key: "water", label: translateResult(t, "dailyIndicators.water"), value: model.waterLiters },
    { key: "steps", label: translateResult(t, "dailyIndicators.steps"), value: model.steps },
    { key: "bmr", label: "BMR", value: model.bmr },
    { key: "tdee", label: "TDEE", value: model.tdee },
    { key: "bmi", label: "BMI", value: model.bmi },
    {
      key: "age",
      label: translateResult(t, "dailyIndicators.metabolicAge"),
      value: model.metabolicAge,
    },
    {
      key: "date",
      label: translateResult(t, "dailyIndicators.targetDate"),
      value: model.targetDate,
    },
  ];

  model.profileSummary = [
    {
      key: "currentWeight",
      label: translateResult(t, "preferences.currentWeight"),
      value: model.currentWeight,
    },
    {
      key: "targetWeight",
      label: translateResult(t, "preferences.targetWeight"),
      value: model.targetWeight,
    },
    {
      key: "activity",
      label: translateResult(t, "preferences.activityLevel"),
      value: model.activityLabel,
    },
  ];

  return model;
};
