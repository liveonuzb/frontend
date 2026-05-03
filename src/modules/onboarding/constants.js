import { includes, indexOf } from "lodash";

export const ONBOARDING_STEPS = [
  "name",
  "gender",
  "health-constraints",
  "age",
  "height",
  "current-weight",
  "goal",
  "other-goals",
  "target-weight",
  "weekly-pace",
  "activity-level",
  "lifestyle",
  "workout-location",
  "workout-equipment",
  "workout-body-parts",
  "preferred-exercises",
  "disliked-exercises",
  "meal-frequency",
  "water-habits",
  "food-budget",
  "allergies",
  "diet-requirements",
  "disliked-foods",
  "preferred-ingredients",
  "disliked-ingredients",
  "review",
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

export const LEGACY_USER_ONBOARDING_STEPS = ["exercise-preferences"];

export const ALL_ONBOARDING_STEPS = [
  ...ONBOARDING_STEPS,
  ...LEGACY_USER_ONBOARDING_STEPS,
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
