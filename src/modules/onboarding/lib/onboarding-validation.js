const toFiniteNumber = (value) => {
  const raw =
    value && typeof value === "object" && "value" in value
      ? value.value
      : value;
  const numberValue = Number(raw);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const isNoWorkoutPlan = (weeklyWorkoutCount) =>
  String(weeklyWorkoutCount) === "0";

export const getTargetWeightValidationError = ({
  goal,
  currentWeight,
  targetWeight,
  t,
}) => {
  const current = toFiniteNumber(currentWeight);
  const target = toFiniteNumber(targetWeight);

  if (current === null || target === null) {
    return null;
  }

  if (goal === "lose" && target >= current) {
    return t("onboarding.targetWeight.errors.loseDirection");
  }

  if (goal === "gain" && target <= current) {
    return t("onboarding.targetWeight.errors.gainDirection");
  }

  return null;
};
