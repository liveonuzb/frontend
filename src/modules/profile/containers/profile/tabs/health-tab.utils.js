import {
  DropletIcon,
  FlameIcon,
  FootprintsIcon,
  HeartPulseIcon,
  MoonStarIcon,
  TargetIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react";

export const AUTO_SAVE_DELAY_MS = 700;

export const PERIOD_OPTIONS = [
  { value: 7, label: "7 kun" },
  { value: 14, label: "14 kun" },
  { value: 30, label: "30 kun" },
];

export const INTENSITY_OPTIONS = [
  {
    id: "slow",
    label: "Sekin",
    lossCalories: -200,
    gainCalories: 150,
    waterBoost: 100,
    stepBoost: 500,
  },
  {
    id: "medium",
    label: "O'rtacha",
    lossCalories: -350,
    gainCalories: 300,
    waterBoost: 250,
    stepBoost: 1500,
  },
  {
    id: "fast",
    label: "Tez",
    lossCalories: -500,
    gainCalories: 450,
    waterBoost: 400,
    stepBoost: 2500,
  },
];

export const PRESET_OPTIONS = [
  {
    id: "lose",
    icon: "🔥",
    label: "Ozish",
    description: "Kaloriya pasayadi, qadam ko'payadi.",
  },
  {
    id: "maintain",
    icon: "⚖️",
    label: "Saqlash",
    description: "Balans ushlab turiladi, ritm barqaror qoladi.",
  },
  {
    id: "gain",
    icon: "💪",
    label: "Massa",
    description: "Kaloriya ko'payadi, tiklanish kuchayadi.",
  },
];

export const METRIC_META = {
  calories: {
    label: "Kunlik kaloriya",
    unit: "KCAL",
    icon: FlameIcon,
    step: 50,
    min: 1200,
    max: 5000,
    cardClass:
      "bg-gradient-to-br from-orange-500/12 via-background to-background dark:from-orange-500/18 dark:via-card dark:to-card",
    iconClass: "bg-orange-500/10 text-orange-500",
    toneClass: "text-orange-500",
    ringClass: "ring-orange-500/10",
  },
  waterMl: {
    label: "Kunlik suv",
    unit: "ML",
    icon: DropletIcon,
    step: 100,
    min: 500,
    max: 7000,
    cardClass:
      "bg-gradient-to-br from-sky-500/12 via-background to-background dark:from-sky-500/18 dark:via-card dark:to-card",
    iconClass: "bg-sky-500/10 text-sky-500",
    toneClass: "text-sky-500",
    ringClass: "ring-sky-500/10",
  },
  steps: {
    label: "Kunlik qadam",
    unit: "QADAM",
    icon: FootprintsIcon,
    step: 500,
    min: 1000,
    max: 30000,
    cardClass:
      "bg-gradient-to-br from-emerald-500/12 via-background to-background dark:from-emerald-500/18 dark:via-card dark:to-card",
    iconClass: "bg-emerald-500/10 text-emerald-500",
    toneClass: "text-emerald-500",
    ringClass: "ring-emerald-500/10",
  },
};

export const STATUS_DOT_CLASS = {
  idle: null,
  saving: "bg-primary/80 animate-pulse",
  saved: "bg-emerald-500",
  error: "bg-destructive",
};

export const GOAL_THEME = {
  lose: {
    badge: "Ozish rejasi",
    title: "Ozish uchun bugungi panel",
    subtitle:
      "Kaloriya defitsiti, ko'proq harakat va suv ritmini shu yerda ushlang.",
    hint: "Defitsitni nazorat qiling va kunlik ritmni buzmasdan pastga tushing.",
    gradient:
      "bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_40%)]",
    badgeClass:
      "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-400",
    accentClass: "text-orange-500",
    mutedAccentClass: "text-orange-500/80",
    softClass: "bg-orange-500/10 text-orange-600",
    actionOrder: ["calories", "steps", "water", "protein", "workout", "sleep"],
  },
  maintain: {
    badge: "Saqlash rejasi",
    title: "Ritmingizni ushlab turish paneli",
    subtitle:
      "Ovqat, tiklanish va harakat muvozanatini kuzatib, keskin og'ishni kamaytiring.",
    hint: "Barqarorlik va recovery sifatini ushlash bu rejimning asosiy vazifasi.",
    gradient:
      "bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_42%)]",
    badgeClass:
      "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    accentClass: "text-sky-500",
    mutedAccentClass: "text-sky-500/80",
    softClass: "bg-sky-500/10 text-sky-600",
    actionOrder: ["calories", "protein", "sleep", "water", "steps", "workout"],
  },
  gain: {
    badge: "Massa rejasi",
    title: "Massa uchun bugungi panel",
    subtitle:
      "Kaloriya, oqsil va tiklanishni oshirib, sifatli o'sish uchun ritm tuzing.",
    hint: "Ortiqcha charchoqsiz ortiqcha energiya va recovery bu rejimning markazi.",
    gradient:
      "bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_42%)]",
    badgeClass:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accentClass: "text-emerald-500",
    mutedAccentClass: "text-emerald-500/80",
    softClass: "bg-emerald-500/10 text-emerald-600",
    actionOrder: ["protein", "calories", "water", "sleep", "workout", "steps"],
  },
};

export const ACTION_META = {
  calories: {
    label: "Kaloriya farqi",
    icon: FlameIcon,
    iconClass: "bg-orange-500/10 text-orange-500",
    targetUnit: "kcal",
  },
  water: {
    label: "Suv ritmi",
    icon: DropletIcon,
    iconClass: "bg-sky-500/10 text-sky-500",
    targetUnit: "ml",
  },
  steps: {
    label: "Harakat ritmi",
    icon: FootprintsIcon,
    iconClass: "bg-emerald-500/10 text-emerald-500",
    targetUnit: "qadam",
  },
  protein: {
    label: "Oqsil orientiri",
    icon: TargetIcon,
    iconClass: "bg-violet-500/10 text-violet-500",
    targetUnit: "g",
  },
  workout: {
    label: "Workout signali",
    icon: HeartPulseIcon,
    iconClass: "bg-rose-500/10 text-rose-500",
    targetUnit: "min",
  },
  sleep: {
    label: "Uyqu ritmi",
    icon: MoonStarIcon,
    iconClass: "bg-indigo-500/10 text-indigo-500",
    targetUnit: "soat",
  },
};

export const PROGRESS_META = {
  calories: {
    label: "Kaloriya",
    icon: FlameIcon,
    iconClass: "text-orange-500",
    format: (value) => `${formatNumber(value)} kcal`,
  },
  water: {
    label: "Suv",
    icon: DropletIcon,
    iconClass: "text-sky-500",
    format: (value) => `${formatLiters(value)}L`,
  },
  steps: {
    label: "Qadam",
    icon: FootprintsIcon,
    iconClass: "text-emerald-500",
    format: (value) => `${formatNumber(value)}`,
  },
  workout: {
    label: "Workout",
    icon: HeartPulseIcon,
    iconClass: "text-rose-500",
    format: (value) => `${formatNumber(value)} min`,
  },
  sleep: {
    label: "Uyqu",
    icon: MoonStarIcon,
    iconClass: "text-indigo-500",
    format: (value) =>
      `${Number(value || 0).toFixed(Number.isInteger(value || 0) ? 0 : 1)} soat`,
  },
};

export const BODY_CHANGE_PRIORITY = {
  lose: ["weight", "waist", "bodyFat", "hips", "chest", "thigh", "arm"],
  maintain: ["weight", "waist", "bodyFat", "hips", "chest", "arm", "thigh"],
  gain: ["weight", "chest", "arm", "thigh", "hips", "waist", "neck"],
};

export const createInitialForm = (goals) => ({
  weightUnit: goals.weightUnit,
  heightUnit: goals.heightUnit,
  waterUnit: goals.waterUnit,
  waterNotification: goals.waterNotification ?? true,
  calories: String(goals.calories),
  waterMl: String(goals.waterMl),
  steps: String(goals.steps),
});

export const toGoalsPayload = (form) => ({
  weightUnit: form.weightUnit,
  heightUnit: form.heightUnit,
  waterUnit: form.waterUnit,
  waterNotification: Boolean(form.waterNotification),
  calories: Number(form.calories) || 0,
  waterMl: Number(form.waterMl) || 0,
  steps: Number(form.steps) || 0,
});

export const clampMetricValue = (value, min, max) =>
  Math.min(Math.max(value, min), max);

export const roundToStep = (value, step) => Math.round(value / step) * step;

export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value) || 0);

export const formatLiters = (value) =>
  (Math.round((Number(value) || 0) / 100) / 10).toFixed(1);

export const formatMetricValue = (value, unit) => {
  if (unit === "ml") {
    return `${formatNumber(value)} ml`;
  }

  if (unit === "kcal") {
    return `${formatNumber(value)} kcal`;
  }

  if (unit === "soat") {
    const numeric = Number(value || 0);
    const fixed = Number.isInteger(numeric) ? numeric.toString() : numeric.toFixed(1);
    return `${fixed} soat`;
  }

  return `${formatNumber(value)} ${unit}`;
};

export const formatChange = (value, unit) => {
  const numeric = Number(value || 0);
  const sign = numeric > 0 ? "+" : "";

  if (unit === "kg" || unit === "cm" || unit === "%") {
    return `${sign}${numeric.toFixed(1)} ${unit}`;
  }

  if (unit === "soat") {
    return `${sign}${numeric.toFixed(1)} ${unit}`;
  }

  return `${sign}${formatNumber(Math.round(numeric))} ${unit}`;
};

export const vibrateSoft = () => {
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    navigator.vibrate(10);
  }
};

export const getSavedNumbers = (form) => ({
  calories: Number(form.calories) || 0,
  waterMl: Number(form.waterMl) || 0,
  steps: Number(form.steps) || 0,
});

export const inferPresetFromGoals = (goals) => {
  if (goals.calories <= 1950) {
    return "lose";
  }

  if (goals.calories >= 2400) {
    return "gain";
  }

  return "maintain";
};

export const inferIntensityFromGoals = (goals, presetId) => {
  if (presetId === "maintain") {
    return "medium";
  }

  const baseline = 2200;
  const delta = Math.abs((goals.calories || baseline) - baseline);

  if (delta < 250) {
    return "slow";
  }

  if (delta < 400) {
    return "medium";
  }

  return "fast";
};

export const resolveGoalPreset = ({
  hasOnboardingGoal,
  onboardingGoalIntent,
  goals,
  hasServerGoals,
  isDefaultGoalPreset,
}) => {
  if (
    hasOnboardingGoal &&
    ["lose", "maintain", "gain"].includes(onboardingGoalIntent)
  ) {
    return onboardingGoalIntent;
  }

  if (hasServerGoals && !isDefaultGoalPreset) {
    return inferPresetFromGoals(getSavedNumbers(goals));
  }

  return "lose";
};

export const buildPresetTargets = (baseGoals, presetId, intensityId) => {
  const intensity =
    INTENSITY_OPTIONS.find((item) => item.id === intensityId) ??
    INTENSITY_OPTIONS[1];
  const caloriesBase = baseGoals.calories || 2200;
  const waterBase = baseGoals.waterMl || 2500;
  const stepsBase = baseGoals.steps || 10000;

  if (presetId === "lose") {
    return {
      calories: clampMetricValue(
        roundToStep(caloriesBase + intensity.lossCalories, 50),
        METRIC_META.calories.min,
        METRIC_META.calories.max,
      ),
      waterMl: clampMetricValue(
        roundToStep(Math.max(waterBase, 2500) + intensity.waterBoost, 100),
        METRIC_META.waterMl.min,
        METRIC_META.waterMl.max,
      ),
      steps: clampMetricValue(
        roundToStep(Math.max(stepsBase, 8500) + intensity.stepBoost, 500),
        METRIC_META.steps.min,
        METRIC_META.steps.max,
      ),
    };
  }

  if (presetId === "gain") {
    return {
      calories: clampMetricValue(
        roundToStep(caloriesBase + intensity.gainCalories, 50),
        METRIC_META.calories.min,
        METRIC_META.calories.max,
      ),
      waterMl: clampMetricValue(
        roundToStep(Math.max(waterBase, 2400) + intensity.waterBoost, 100),
        METRIC_META.waterMl.min,
        METRIC_META.waterMl.max,
      ),
      steps: clampMetricValue(
        roundToStep(
          Math.max(
            7000,
            stepsBase - 1000 + Math.round(intensity.stepBoost * 0.4),
          ),
          500,
        ),
        METRIC_META.steps.min,
        METRIC_META.steps.max,
      ),
    };
  }

  const maintainOffset =
    intensityId === "slow" ? -50 : intensityId === "fast" ? 100 : 0;

  return {
    calories: clampMetricValue(
      roundToStep(caloriesBase + maintainOffset, 50),
      METRIC_META.calories.min,
      METRIC_META.calories.max,
    ),
    waterMl: clampMetricValue(
      roundToStep(
        Math.max(waterBase, 2500) + Math.round(intensity.waterBoost * 0.4),
        100,
      ),
      METRIC_META.waterMl.min,
      METRIC_META.waterMl.max,
    ),
    steps: clampMetricValue(
      roundToStep(
        Math.max(stepsBase, 9000) + Math.round(intensity.stepBoost * 0.35),
        500,
      ),
      METRIC_META.steps.min,
      METRIC_META.steps.max,
    ),
  };
};

export const getCaloriesChangeText = (current, target) => {
  const diff = target - current;

  if (diff === 0) {
    return "Hozirgi ritmingiz bilan mos keladi.";
  }

  return `${diff > 0 ? "+" : "-"}${formatNumber(Math.abs(diff))} kcal ${
    diff > 0 ? "oshirish kerak." : "kamaytirish kerak."
  }`;
};

const getProgressPercent = (value, target) => {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round((value / target) * 100)));
};

const getStatusTone = (average, target) => {
  if (!average || !target) {
    return "neutral";
  }

  const diffRatio = Math.abs(target - average) / Math.max(target, 1);

  if (diffRatio <= 0.08) {
    return "good";
  }

  return average < target ? "needs-more" : "needs-less";
};

const buildActionCopy = ({ goalPreset, key, average, target, gap }) => {
  if (!average) {
    const fallbackMap = {
      calories:
        goalPreset === "lose"
          ? "Bugungi menyuda porsiyani nazorat qiling."
          : goalPreset === "gain"
            ? "Bugungi ovqatlarga qo'shimcha energiya kiriting."
            : "Kaloriya ritmini barqaror saqlang.",
      water: "Kun davomida suvni teng bo'lib iching.",
      steps: "Kun oxirigacha yurish bloklarini bo'lib bajaring.",
      protein: "Har bir asosiy ovqatga oqsil manbasini qo'shing.",
      workout: "Qisqa bo'lsa ham harakat blokini rejalashtiring.",
      sleep: "Kecha uyqusi uchun oldindan ritm tuzing.",
    };

    return fallbackMap[key];
  }

  if (key === "calories") {
    if (goalPreset === "lose") {
      return average > target
        ? `O'rtacha ${formatNumber(Math.abs(gap))} kcal yuqori. Keyingi ovqatda porsiyani qisqartiring.`
        : "Defitsit nazoratda. Shu ritmni ushlab turing.";
    }

    if (goalPreset === "gain") {
      return average < target
        ? `Yana ${formatNumber(Math.abs(gap))} kcal kerak. Snack yoki katta porsiya qo'shing.`
        : "Energiya zaxirasi kerakli diapazonda.";
    }

    return Math.abs(gap) <= 80
      ? "Kaloriya ritmi barqaror."
      : `Ritmni ${formatNumber(Math.abs(gap))} kcal atrofida tekislang.`;
  }

  if (key === "water") {
    return average < target
      ? `Kun davomida yana ${formatNumber(Math.abs(gap))} ml suv ichishga yaqin ritm kerak.`
      : "Gidratsiya ritmi maqsadga yaqin.";
  }

  if (key === "steps") {
    return average < target
      ? `${formatNumber(Math.abs(gap))} qadam yetishmayapti. Yurishni qisqa bloklarga bo'ling.`
      : "Harakat ritmi maqsadni ushlab turibdi.";
  }

  if (key === "protein") {
    return average < target
      ? `Har kuni yana ${formatNumber(Math.abs(gap))} g oqsil qo'shish foydali.`
      : "Oqsil ritmi yetarli darajada.";
  }

  if (key === "workout") {
    return average < target
      ? `Haftalik ritm uchun kuniga yana ${formatNumber(Math.abs(gap))} min faol harakat yetishmayapti.`
      : "Harakat bloklari yaxshi ketmoqda.";
  }

  return average < target
    ? `Uyqu maqsadiga yana ${Math.abs(gap).toFixed(1)} soat yaqinlashish kerak.`
    : "Recovery ritmi yaxshi ko'rinmoqda.";
};

export const buildActionItems = ({
  goalPreset,
  currentNumbers,
  recommendedGoals,
  healthSummary,
  waterSummary,
}) => {
  const averageWater = Number(waterSummary?.averageMl) || Number(healthSummary?.avgWaterMl) || 0;
  const averageCalories = Number(healthSummary?.avgCalories) || 0;
  const averageSteps = Number(healthSummary?.avgSteps) || 0;
  const averageProtein = Number(healthSummary?.avgProtein) || 0;
  const averageWorkout = Number(healthSummary?.avgWorkoutMinutes) || 0;
  const averageSleep = Number(healthSummary?.avgSleepHours) || 0;

  const items = {
    calories: {
      id: "calories",
      average: averageCalories,
      target: currentNumbers.calories,
      value: `${formatNumber(averageCalories || currentNumbers.calories)} / ${formatNumber(currentNumbers.calories)} kcal`,
    },
    water: {
      id: "water",
      average: averageWater,
      target: currentNumbers.waterMl,
      value: `${formatLiters(averageWater || currentNumbers.waterMl)} / ${formatLiters(currentNumbers.waterMl)}L`,
    },
    steps: {
      id: "steps",
      average: averageSteps,
      target: currentNumbers.steps,
      value: `${formatNumber(averageSteps || currentNumbers.steps)} / ${formatNumber(currentNumbers.steps)}`,
    },
    protein: {
      id: "protein",
      average: averageProtein,
      target: Number(recommendedGoals?.protein) || 0,
      value: `${formatNumber(averageProtein || recommendedGoals?.protein)} / ${formatNumber(recommendedGoals?.protein)} g`,
    },
    workout: {
      id: "workout",
      average: averageWorkout,
      target: Number(recommendedGoals?.workoutMinutes) || 0,
      value: `${formatNumber(averageWorkout || recommendedGoals?.workoutMinutes)} / ${formatNumber(recommendedGoals?.workoutMinutes)} min`,
    },
    sleep: {
      id: "sleep",
      average: averageSleep,
      target: Number(recommendedGoals?.sleepHours) || 0,
      value: `${Number(averageSleep || recommendedGoals?.sleepHours || 0).toFixed(1)} / ${Number(recommendedGoals?.sleepHours || 0).toFixed(1)} soat`,
    },
  };

  return GOAL_THEME[goalPreset].actionOrder.map((key) => {
    const target = Number(items[key].target) || 0;
    const average = Number(items[key].average) || 0;
    const gap = target - average;
    const tone = getStatusTone(average, target);

    return {
      ...items[key],
      ...ACTION_META[key],
      gap,
      progress: getProgressPercent(average, target),
      tone,
      description: buildActionCopy({
        goalPreset,
        key,
        average,
        target,
        gap,
      }),
      statusLabel:
        tone === "good"
          ? "Ritm yaxshi"
          : tone === "needs-more"
            ? "Yana kerak"
            : tone === "needs-less"
              ? "Qisqartirish kerak"
              : "Kuzatish kerak",
    };
  });
};

export const buildProgressMetrics = ({
  summary,
  currentNumbers,
  waterSummary,
  recommendedGoals,
}) => [
  {
    id: "calories",
    current: Number(summary?.avgCalories) || 0,
    target: Number(currentNumbers?.calories) || 0,
    footnote: `${Number(summary?.caloriesGoalMet) || 0} kun maqsadga yaqin`,
  },
  {
    id: "water",
    current: Number(waterSummary?.averageMl) || Number(summary?.avgWaterMl) || 0,
    target: Number(currentNumbers?.waterMl) || 0,
    footnote: `${Number(waterSummary?.daysGoalMet) || Number(summary?.waterGoalMet) || 0} kun goal met`,
  },
  {
    id: "steps",
    current: Number(summary?.avgSteps) || 0,
    target: Number(currentNumbers?.steps) || 0,
    footnote: `${Number(summary?.stepsGoalMet) || 0} kun pace yetdi`,
  },
  {
    id: "workout",
    current: Number(summary?.avgWorkoutMinutes) || 0,
    target: Number(recommendedGoals?.workoutMinutes) || 0,
    footnote: `${Number(summary?.daysTracked) || 0} kun tracking`,
  },
  {
    id: "sleep",
    current: Number(summary?.avgSleepHours) || 0,
    target: Number(recommendedGoals?.sleepHours) || 0,
    footnote:
      Number(summary?.avgSleepHours) > 0
        ? "Recovery sifatini kuzatmoqda"
        : "Uyqu tracking hali kam",
  },
].map((item) => ({
  ...item,
  ...PROGRESS_META[item.id],
  progress: getProgressPercent(item.current, item.target),
}));

export const buildWeightTrendBars = (trend = []) => {
  const items = Array.isArray(trend) ? trend.filter((entry) => Number(entry?.weight) > 0) : [];

  if (!items.length) {
    return [];
  }

  const weights = items.map((item) => Number(item.weight));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const spread = Math.max(max - min, 0.6);

  return items.slice(-10).map((item) => ({
    date: item.date,
    weight: Number(item.weight),
    height: 26 + Math.round(((Number(item.weight) - min) / spread) * 58),
  }));
};

export const getWeightTrendSummary = (weight = {}, goalPreset = "lose") => {
  const trend = Array.isArray(weight?.trend) ? weight.trend.filter((item) => Number(item?.weight) > 0) : [];
  const current = Number(weight?.current);

  if (!trend.length && !current) {
    return null;
  }

  const first = Number(trend[0]?.weight || current || 0);
  const last = Number(trend[trend.length - 1]?.weight || current || 0);
  const delta = last - first;
  const isImproving =
    goalPreset === "lose"
      ? delta <= 0
      : goalPreset === "gain"
        ? delta >= 0
        : Math.abs(delta) <= 0.4;

  return {
    current: current || last || null,
    first,
    last,
    delta,
    isImproving,
    directionIcon: delta <= 0 ? TrendingDownIcon : TrendingUpIcon,
    summaryText:
      goalPreset === "lose"
        ? delta < 0
          ? `${Math.abs(delta).toFixed(1)} kg pastladi`
          : delta > 0
            ? `${delta.toFixed(1)} kg oshdi`
            : "Vazn barqaror"
        : goalPreset === "gain"
          ? delta > 0
            ? `${delta.toFixed(1)} kg oshdi`
            : delta < 0
              ? `${Math.abs(delta).toFixed(1)} kg pasaydi`
              : "Vazn barqaror"
          : Math.abs(delta) <= 0.4
            ? "Vazn barqaror"
            : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`,
  };
};

export const getBodyChangeHighlights = (trendsPayload, goalPreset) => {
  const trends = trendsPayload?.trends;

  if (!trends) {
    return [];
  }

  const priority = BODY_CHANGE_PRIORITY[goalPreset] || BODY_CHANGE_PRIORITY.lose;

  return priority
    .map((key) => ({
      id: key,
      metric: trends[key],
    }))
    .filter((item) => item.metric && item.metric.last !== null)
    .slice(0, 4)
    .map((item) => item);
};
