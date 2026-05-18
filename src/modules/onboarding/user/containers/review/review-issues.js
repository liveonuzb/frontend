import { getTargetWeightValidationError } from "@/modules/onboarding/lib/onboarding-validation";

import { filter, includes, isArray, trim } from "lodash";

const hasValue = (value) => {
  if (isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && trim(String(value)) !== "";
};

const isHealthConstraintsStepCompleted = (state) =>
  isArray(state.completedUserOnboardingSteps) &&
  includes(state.completedUserOnboardingSteps, "health-constraints");

export const hasAnsweredHealthConstraints = (state) =>
  hasValue(state.healthConstraints) ||
  hasValue(state.customHealthConstraints) ||
  isHealthConstraintsStepCompleted(state);

export const getHealthConstraintsSummary = (state, t) => {
  const selectedCount =
    (filter(state.healthConstraints, (item) => item !== "none")?.length ?? 0) +
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
  if (!hasValue(state.mealFrequency)) {
    errors.push(t("onboarding.review.missing.mealFrequency"));
  }
  if (!hasAnsweredHealthConstraints(state)) {
    errors.push(t("onboarding.review.missing.healthConstraints"));
  }
  return errors;
};

export const getReviewRecommendations = () => [];
