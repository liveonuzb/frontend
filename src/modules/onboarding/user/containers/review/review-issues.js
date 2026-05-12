import {
  getTargetWeightValidationError,
  isNoWorkoutPlan,
} from "@/modules/onboarding/lib/onboarding-validation";

const hasValue = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && String(value).trim() !== "";
};

const isHealthConstraintsStepCompleted = (state) =>
  Array.isArray(state.completedUserOnboardingSteps) &&
  state.completedUserOnboardingSteps.includes("health-constraints");

export const hasAnsweredHealthConstraints = (state) =>
  hasValue(state.healthConstraints) ||
  hasValue(state.customHealthConstraints) ||
  isHealthConstraintsStepCompleted(state);

export const getHealthConstraintsSummary = (state, t) => {
  const selectedCount =
    (state.healthConstraints?.filter((item) => item !== "none")?.length ?? 0) +
    (state.customHealthConstraints?.length ?? 0);

  if (selectedCount > 0) {
    return t("onboarding.review.countValue", { count: selectedCount });
  }

  if (hasAnsweredHealthConstraints(state)) {
    return t("onboarding.healthConstraints.noneSummary");
  }

  return t("onboarding.review.emptyValue");
};

export const getReviewBlockingErrors = (state, t) => {
  const errors = [];
  if (!hasValue(state.firstName))
    errors.push(t("onboarding.review.missing.name"));
  if (!hasValue(state.gender))
    errors.push(t("onboarding.review.missing.gender"));
  if (!hasValue(state.age)) errors.push(t("onboarding.review.missing.age"));
  if (!hasValue(state.height?.value)) {
    errors.push(t("onboarding.review.missing.height"));
  }
  if (!hasValue(state.currentWeight?.value)) {
    errors.push(t("onboarding.review.missing.currentWeight"));
  }
  if (!hasValue(state.goal) && !hasValue(state.weightGoal)) {
    errors.push(t("onboarding.review.missing.goal"));
  }
  if (!hasValue(state.targetWeight?.value)) {
    errors.push(t("onboarding.review.missing.targetWeight"));
  }
  const targetWeightError = getTargetWeightValidationError({
    goal: state.goal || state.weightGoal,
    currentWeight: state.currentWeight,
    targetWeight: state.targetWeight,
    t,
  });
  if (targetWeightError) {
    errors.push(targetWeightError);
  }
  if (!hasValue(state.weeklyPace)) {
    errors.push(t("onboarding.review.missing.weeklyPace"));
  }
  if (!hasValue(state.activityLevel)) {
    errors.push(t("onboarding.review.missing.activityLevel"));
  }
  if (!hasValue(state.weeklyWorkoutCount)) {
    errors.push(t("onboarding.review.missing.weeklyWorkoutCount"));
  }
  if (
    !isNoWorkoutPlan(state.weeklyWorkoutCount) &&
    !hasValue(state.workoutExperience)
  ) {
    errors.push(t("onboarding.review.missing.workoutExperience"));
  }
  if (!hasValue(state.mealFrequency)) {
    errors.push(t("onboarding.review.missing.mealFrequency"));
  }
  if (!hasAnsweredHealthConstraints(state)) {
    errors.push(t("onboarding.review.missing.healthConstraints"));
  }
  return errors;
};

export const getReviewRecommendations = (state, t) => {
  const recommendations = [];
  const allergyCount =
    (state.allergyIds?.length ?? 0) +
    (state.allergyIngredientIds?.length ?? 0) +
    (state.customAllergies?.length ?? 0);
  const preferredCuisineCount =
    (state.preferredCuisineIds?.length ?? 0) +
    (state.customPreferredCuisines?.length ?? 0);
  const equipmentCount =
    (state.equipmentIds?.length ?? 0) + (state.customEquipment?.length ?? 0);

  if (!hasValue(state.foodBudgetTier) && !hasValue(state.foodBudget)) {
    recommendations.push(t("onboarding.review.recommendations.foodBudget"));
  }

  if (allergyCount === 0) {
    recommendations.push(t("onboarding.review.recommendations.allergies"));
  }

  if (preferredCuisineCount === 0) {
    recommendations.push(
      t("onboarding.review.recommendations.preferredCuisines"),
    );
  }

  if (
    !isNoWorkoutPlan(state.weeklyWorkoutCount) &&
    state.workoutLocation !== "gym" &&
    equipmentCount === 0
  ) {
    recommendations.push(t("onboarding.review.recommendations.equipment"));
  }

  return recommendations;
};
