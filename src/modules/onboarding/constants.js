import { includes, indexOf } from "lodash";

export const ONBOARDING_STEPS = [
  "name",
  "gender",
  "age",
  "height",
  "current-weight",
  "goal",
  "target-weight",
  "weekly-pace",
  "activity-level",
  "meal-frequency",
  "water-habits",
  "diet-restrictions",
];

export const COACH_ONBOARDING_STEPS = [
  "coach/category",
  "coach/experience",
  "coach/specialization",
  "coach/target-audience",
  "coach/availability",
  "coach/certification",
  "coach/bio",
  "coach/pricing",
  "coach/languages",
  "coach/avatar",
];

export const ALL_ONBOARDING_STEPS = [
  ...ONBOARDING_STEPS,
  ...COACH_ONBOARDING_STEPS,
];

export const isKnownOnboardingStep = (step) =>
  includes(ALL_ONBOARDING_STEPS, step);

export const isCoachOnboardingStep = (step) =>
  includes(COACH_ONBOARDING_STEPS, step);

export const getStepIndex = (step) => indexOf(ONBOARDING_STEPS, step);

export const getNextStep = (step) => {
  const index = getStepIndex(step);
  if (index < ONBOARDING_STEPS.length - 1) {
    return ONBOARDING_STEPS[index + 1];
  }
  return null;
};

export const getPrevStep = (step) => {
  const index = getStepIndex(step);
  if (index > 0) {
    return ONBOARDING_STEPS[index - 1];
  }
  return null;
};
