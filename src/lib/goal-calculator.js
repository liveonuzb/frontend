const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const roundToStep = (value, step) => Math.round(value / step) * step;

export const normalizeGoal = (goal) => {
  const normalized = String(goal ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  if (normalized.startsWith("lose")) {
    return "lose";
  }

  if (normalized.startsWith("gain")) {
    return "gain";
  }

  return "maintain";
};

export const normalizeActivityLevel = (activityLevel) => {
  const normalized = String(activityLevel ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  if (
    normalized === "lightly-active" ||
    normalized === "light-active" ||
    normalized === "light"
  ) {
    return "lightly-active";
  }

  if (
    normalized === "moderately-active" ||
    normalized === "moderate-active" ||
    normalized === "moderate"
  ) {
    return "moderately-active";
  }

  if (normalized === "very-active" || normalized === "heavy-active") {
    return "very-active";
  }

  if (normalized === "extra-active") {
    return "extra-active";
  }

  return "sedentary";
};

export const calculateGoals = (data = {}) => {
  const {
    gender = "male",
    age = 25,
    heightValue = 175,
    currentWeightValue = 70,
    goal = "maintain",
    activityLevel = "moderately-active",
    weeklyPace = 0.5,
  } = data;
  const normalizedGoal = normalizeGoal(goal);
  const normalizedActivityLevel = normalizeActivityLevel(activityLevel);

  let bmr =
    10 * (currentWeightValue || 70) +
    6.25 * (heightValue || 175) -
    5 * (age || 25);
  if (gender === "female") {
    bmr -= 161;
  } else {
    bmr += 5;
  }

  const activityMultipliers = {
    sedentary: 1.2,
    "lightly-active": 1.375,
    "moderately-active": 1.55,
    "very-active": 1.725,
    "extra-active": 1.9,
  };

  const multiplier = activityMultipliers[normalizedActivityLevel] || 1.2;
  const tdee = bmr * multiplier;

  let targetCalories = tdee;
  if (normalizedGoal === "lose") {
    const dailyDeficit = ((weeklyPace || 0.5) * 7700) / 7;
    targetCalories = tdee - dailyDeficit;
  } else if (normalizedGoal === "gain") {
    const dailySurplus = ((weeklyPace || 0.5) * 7700) / 7;
    targetCalories = tdee + dailySurplus;
  }

  const minCalories = gender === "female" ? 1200 : 1500;
  targetCalories = Math.max(Math.round(targetCalories), minCalories);

  const proteinGrams = Math.round((currentWeightValue || 70) * 2);
  const proteinCalories = proteinGrams * 4;
  const fatCalories = targetCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);
  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(Math.max(remainingCalories, 0) / 4);

  const waterPerKg =
    normalizedGoal === "lose" ? 38 : normalizedGoal === "gain" ? 37 : 35;
  const activityWaterBoost = {
    sedentary: 0,
    "lightly-active": 250,
    "moderately-active": 450,
    "very-active": 650,
    "extra-active": 850,
  }[normalizedActivityLevel];
  const paceWaterBoost =
    normalizedGoal === "maintain" ? 0 : Math.round((weeklyPace || 0.5) * 200);
  const waterMl = roundToStep(
    clamp(
      (currentWeightValue || 70) * waterPerKg +
        activityWaterBoost +
        paceWaterBoost,
      1800,
      5000,
    ),
    50,
  );

  const activityStepsBase = {
    sedentary: 6500,
    "lightly-active": 8500,
    "moderately-active": 10000,
    "very-active": 12000,
    "extra-active": 14000,
  }[normalizedActivityLevel];
  const paceStepBoost = roundToStep((weeklyPace || 0.5) * 1000, 250);
  const goalStepAdjustment =
    normalizedGoal === "lose"
      ? 1500 + paceStepBoost
      : normalizedGoal === "gain"
        ? -1000 + Math.round(paceStepBoost * 0.25)
        : Math.round(paceStepBoost * 0.25);
  const stepsFloor = normalizedGoal === "gain" ? 7000 : 6500;
  const steps = roundToStep(
    clamp(activityStepsBase + goalStepAdjustment, stepsFloor, 18000),
    500,
  );

  return {
    calories: targetCalories,
    protein: proteinGrams,
    carbs: carbGrams,
    fat: fatGrams,
    fiber: 30,
    waterMl,
    steps,
    sleepHours: 8,
    workoutMinutes: 60,
  };
};
