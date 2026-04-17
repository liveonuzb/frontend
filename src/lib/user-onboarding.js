import { isArray } from "lodash";
const toValueUnit = (field, unit, defaultUnit) => {
  if (!field && field !== 0) {
    return null;
  }

  if (typeof field === "object" && field !== null && "value" in field) {
    const value = field.value;
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return {
      value,
      unit: field.unit ?? defaultUnit,
    };
  }

  return {
    value: field,
    unit: unit ?? defaultUnit,
  };
};

export const normalizeUserOnboarding = (onboarding) => {
  if (!onboarding) {
    return null;
  }

  return {
    firstName: onboarding.firstName ?? null,
    lastName: onboarding.lastName ?? null,
    gender: onboarding.gender ?? null,
    age: onboarding.age ?? null,
    height: toValueUnit(
      onboarding.height ?? onboarding.heightValue,
      onboarding.heightUnit,
      "cm",
    ),
    currentWeight: toValueUnit(
      onboarding.currentWeight ?? onboarding.currentWeightValue,
      onboarding.currentWeightUnit,
      "kg",
    ),
    goal: onboarding.goal ?? null,
    targetWeight: toValueUnit(
      onboarding.targetWeight ?? onboarding.targetWeightValue,
      onboarding.targetWeightUnit,
      "kg",
    ),
    weeklyPace: onboarding.weeklyPace ?? null,
    activityLevel: onboarding.activityLevel ?? null,
    mealFrequency: onboarding.mealFrequency ?? null,
    waterHabits: onboarding.waterHabits ?? null,
    dietRestrictions: isArray(onboarding.dietRestrictions)
      ? onboarding.dietRestrictions
      : [],
  };
};

const hasValue = (field) =>
  Boolean(field) &&
  field.value !== "" &&
  field.value !== null &&
  field.value !== undefined;

export const toUserOnboardingPayload = (patch = {}) => {
  const payload = {};

  if ("firstName" in patch) payload.firstName = patch.firstName || undefined;
  if ("lastName" in patch) payload.lastName = patch.lastName || undefined;
  if ("gender" in patch) payload.gender = patch.gender || undefined;
  if ("age" in patch) {
    payload.age =
      patch.age === "" || patch.age === null || patch.age === undefined
        ? undefined
        : Number(patch.age);
  }
  if ("height" in patch) {
    payload.height = hasValue(patch.height)
      ? {
          value: Number(patch.height.value),
          unit: patch.height.unit ?? "cm",
        }
      : undefined;
  }
  if ("currentWeight" in patch) {
    payload.currentWeight = hasValue(patch.currentWeight)
      ? {
          value: Number(patch.currentWeight.value),
          unit: patch.currentWeight.unit ?? "kg",
        }
      : undefined;
  }
  if ("goal" in patch) payload.goal = patch.goal || undefined;
  if ("targetWeight" in patch) {
    payload.targetWeight = hasValue(patch.targetWeight)
      ? {
          value: Number(patch.targetWeight.value),
          unit: patch.targetWeight.unit ?? "kg",
        }
      : undefined;
  }
  if ("weeklyPace" in patch) {
    payload.weeklyPace =
      patch.weeklyPace === "" ||
      patch.weeklyPace === null ||
      patch.weeklyPace === undefined
        ? undefined
        : Number(patch.weeklyPace);
  }
  if ("activityLevel" in patch) {
    payload.activityLevel = patch.activityLevel || undefined;
  }
  if ("mealFrequency" in patch) {
    payload.mealFrequency = patch.mealFrequency || undefined;
  }
  if ("waterHabits" in patch) {
    payload.waterHabits = patch.waterHabits || undefined;
  }
  if ("dietRestrictions" in patch) {
    payload.dietRestrictions = isArray(patch.dietRestrictions)
      ? patch.dietRestrictions
      : undefined;
  }

  return payload;
};
