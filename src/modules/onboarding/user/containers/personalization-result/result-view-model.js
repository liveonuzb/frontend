import { formatWeightDelta } from "../../lib/personalization.js";

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
  explanation:
    "AI sizning maqsadingiz, hozirgi vazningiz, faollik darajangiz va ovqatlanish ritmingiz asosida boshlang'ich targetlarni tayyorladi.",
};

const goalLabels = {
  lose: "Ozish",
  weight_loss: "Ozish",
  weightLoss: "Ozish",
  maintain: "Vazn saqlash",
  gain: "Mushak yig'ish",
  muscle_gain: "Mushak yig'ish",
  healthy_lifestyle: "Sog'lom turmush",
  performance: "Performance",
};

const goalExplanationFallbacks = {
  lose:
    "Ozish maqsadi uchun kaloriya defitsiti, oqsil miqdori, faollik darajasi va haftalik sur'at hozirgi vazningiz asosida moslandi.",
  weight_loss:
    "Ozish maqsadi uchun kaloriya defitsiti, oqsil miqdori, faollik darajasi va haftalik sur'at hozirgi vazningiz asosida moslandi.",
  weightLoss:
    "Ozish maqsadi uchun kaloriya defitsiti, oqsil miqdori, faollik darajasi va haftalik sur'at hozirgi vazningiz asosida moslandi.",
  maintain:
    "Vazn saqlash maqsadi uchun kaloriyalar TDEE atrofida ushlab turildi, makrolar esa hozirgi vazn va faollik darajasiga moslandi.",
  gain:
    "Vazn olish maqsadi uchun kaloriya profitsiti, oqsil miqdori, faollik darajasi va haftalik sur'at hozirgi vazningiz asosida moslandi.",
  muscle_gain:
    "Vazn olish maqsadi uchun kaloriya profitsiti, oqsil miqdori, faollik darajasi va haftalik sur'at hozirgi vazningiz asosida moslandi.",
};

const activityLabels = {
  sedentary: "Passiv",
  "lightly-active": "Yengil faol",
  lightly_active: "Yengil faol",
  "moderately-active": "O'rtacha faol",
  moderately_active: "O'rtacha faol",
  "very-active": "Juda faol",
  very_active: "Juda faol",
};

const getNumberOrFallback = (value, fallback = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const numberValue = Number(value);
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

const warningLabelMap = {
  metabolicAgeIsEstimatedIndicator: "Metabolik yosh taxminiy",
  bmiIsEstimatedIndicator: "BMI taxminiy",
  tdeeIsEstimatedIndicator: "TDEE taxminiy",
  bmrIsEstimatedIndicator: "BMR taxminiy",
};

const formatWarningLabel = (value) => {
  if (!value) return "";
  if (warningLabelMap[value]) return warningLabelMap[value];

  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()} M${month} ${day}`;
};

const resolveExplanation = (result = {}, goalKey) => {
  const explanation =
    typeof result?.explanation === "string" ? result.explanation.trim() : "";
  return explanation || goalExplanationFallbacks[goalKey] || fallbackResult.explanation;
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
  const model = {
    title: "Metabolizm hisobingiz tayyor",
    description:
      "BMR, TDEE, kaloriya va makro formulalar asosida tahlil qilindi. Bu ko'rsatkichlar dashboard targetlari uchun ishlatiladi.",
    aiAnalysis: resolveExplanation(result, providedGoalKey),
    currentWeight: `${formatNumber(currentWeight)} kg`,
    targetWeight: targetWeight !== null ? `${formatNumber(targetWeight)} kg` : "-",
    weightDiff: formatWeightDelta(
      getNumberOrFallback(result?.weightToChange, fallbackResult.weightToChange),
    ),
    weeklyPace: `${formatDecimal(weeklyRate)} kg/hafta`,
    bmr: formatKcal(bmr),
    activityMultiplier: formatMultiplier(activityMultiplier),
    activityLabel: activityLabels[activityKey] ?? "O'rtacha faol",
    tdee: formatKcal(tdee),
    goalAdjustment: formatSignedKcal(goalAdjustment),
    dailyCalories: formatNumber(dailyCalories),
    dailyCaloriesWithUnit: formatKcal(dailyCalories),
    waterLiters: formatLiters(waterMl),
    steps: formatNumber(result?.dailyStepsTarget, "-"),
    bmi: formatDecimal(result?.bmi, 1),
    metabolicAge:
      getNumberOrFallback(result?.metabolicAge, null) !== null
        ? `${formatNumber(result.metabolicAge)} yosh`
        : "-",
    targetDate: formatTargetDate(result?.estimatedGoalDate),
    goal: goalLabels[goalKey] ?? "Ozish",
    formulaName,
    hasCalculationReport: Boolean(calculationReport),
    warningPills: [
      calorieReport.floorApplied ? "Minimal kaloriya floor qo'llandi" : null,
      calorieReport.capApplied ? "Sur'at cap qo'llandi" : null,
      ...(Array.isArray(calculationReport?.warnings)
        ? calculationReport.warnings.slice(0, 2).map(formatWarningLabel)
        : []),
    ].filter(Boolean),
    macros: {
      protein: buildMacro({
        label: "Oqsil",
        grams: proteinGram,
        report: macroReport.protein,
        caloriesPerGram: 4,
      }),
      carbs: buildMacro({
        label: "Uglevod",
        grams: carbsGram,
        report: macroReport.carbs,
        caloriesPerGram: 4,
      }),
      fat: buildMacro({
        label: "Yog'",
        grams: fatGram,
        report: macroReport.fat,
        caloriesPerGram: 9,
      }),
    },
  };

  model.heroStats = [
    { key: "currentWeight", label: "Hozirgi vazn", value: model.currentWeight },
    { key: "targetWeight", label: "Maqsad vazn", value: model.targetWeight },
    {
      key: "weightDiff",
      label: "Vazn farqi",
      value: model.weightDiff,
      positive: model.weightDiff.startsWith("-"),
    },
    { key: "weeklyPace", label: "Haftalik sur'at", value: model.weeklyPace },
  ];

  model.calculationSteps = [
    { key: "bmr", label: "BMR", value: model.bmr, caption: formulaName },
    {
      key: "activity",
      label: "Faollik",
      value: model.activityMultiplier,
      caption: model.activityLabel,
      operator: "+",
    },
    {
      key: "tdee",
      label: "TDEE",
      value: model.tdee,
      caption: "BMR x faollik",
      operator: "x",
    },
    {
      key: "adjustment",
      label: "Maqsad sozlamasi",
      value: model.goalAdjustment,
      caption: "Haftalik sur'at asosida",
      operator: "-",
    },
    {
      key: "final",
      label: "Yakuniy target",
      value: model.dailyCaloriesWithUnit,
      caption: "Dashboard uchun kunlik limit",
      operator: "=",
      highlighted: true,
    },
  ];

  model.dailyIndicators = [
    { key: "water", label: "Suv maqsadi", value: model.waterLiters },
    { key: "steps", label: "Qadam", value: model.steps },
    { key: "bmr", label: "BMR", value: model.bmr },
    { key: "tdee", label: "TDEE", value: model.tdee },
    { key: "bmi", label: "BMI", value: model.bmi },
    { key: "age", label: "Metabolik yosh", value: model.metabolicAge },
    { key: "date", label: "Maqsad sanasi", value: model.targetDate },
  ];

  model.profileSummary = [
    { key: "currentWeight", label: "Hozirgi vazn", value: model.currentWeight },
    { key: "targetWeight", label: "Maqsad vazn", value: model.targetWeight },
    {
      key: "activity",
      label: "Faollik darajasi",
      value: model.activityLabel,
    },
  ];

  return model;
};
