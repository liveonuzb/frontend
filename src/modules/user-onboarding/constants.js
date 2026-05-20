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
  "diet-requirements",
  "health-constraints",
  "review",
];

export const isKnownOnboardingStep = (step) =>
  includes(ONBOARDING_STEPS, step);

export const getStepIndex = (step) =>
  indexOf(ONBOARDING_STEPS, step);

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
