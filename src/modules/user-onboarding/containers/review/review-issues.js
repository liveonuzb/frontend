import { getTargetWeightValidationError } from "@/modules/user-onboarding/lib/onboarding-validation";

import { filter, includes, isArray, map, trim } from "lodash";

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

const REQUIRED_REVIEW_CHECKS = [
  {
    step: "name",
    getMessage: (state, t) =>
      hasValue(state.firstName) ? null : t("onboarding.review.missing.name"),
  },
  {
    step: "gender",
    getMessage: (state, t) =>
      hasValue(state.gender) ? null : t("onboarding.review.missing.gender"),
  },
  {
    step: "age",
    getMessage: (state, t) =>
      hasValue(state.age) ? null : t("onboarding.review.missing.age"),
  },
  {
    step: "height",
    getMessage: (state, t) =>
      hasValue(state.height?.value)
        ? null
        : t("onboarding.review.missing.height"),
  },
  {
    step: "current-weight",
    getMessage: (state, t) =>
      hasValue(state.currentWeight?.value)
        ? null
        : t("onboarding.review.missing.currentWeight"),
  },
  {
    step: "goal",
    getMessage: (state, t) =>
      hasValue(state.goal) || hasValue(state.weightGoal)
        ? null
        : t("onboarding.review.missing.goal"),
  },
  {
    step: "target-weight",
    getMessage: (state, t) =>
      hasValue(state.targetWeight?.value)
        ? null
        : t("onboarding.review.missing.targetWeight"),
  },
  {
    step: "target-weight",
    getMessage: (state, t) =>
      getTargetWeightValidationError({
        goal: state.goal || state.weightGoal,
        currentWeight: state.currentWeight,
        targetWeight: state.targetWeight,
        t,
      }),
  },
  {
    step: "weekly-pace",
    getMessage: (state, t) =>
      hasValue(state.weeklyPace)
        ? null
        : t("onboarding.review.missing.weeklyPace"),
  },
  {
    step: "activity-level",
    getMessage: (state, t) =>
      hasValue(state.activityLevel)
        ? null
        : t("onboarding.review.missing.activityLevel"),
  },
  {
    step: "meal-frequency",
    getMessage: (state, t) =>
      hasValue(state.mealFrequency)
        ? null
        : t("onboarding.review.missing.mealFrequency"),
  },
  {
    step: "health-constraints",
    getMessage: (state, t) =>
      hasAnsweredHealthConstraints(state)
        ? null
        : t("onboarding.review.missing.healthConstraints"),
  },
];

export const getReviewBlockingFixTargets = (state, t) =>
  filter(
    map(REQUIRED_REVIEW_CHECKS, ({ getMessage, step }) => {
      const message = getMessage(state, t);
      return message ? { message, step } : null;
    }),
    Boolean,
  );

export const getReviewBlockingErrors = (state, t) =>
  map(getReviewBlockingFixTargets(state, t), (target) => target.message);

export const getReviewRecommendations = () => [];
