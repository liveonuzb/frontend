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
  "other-goals",
  "activity-level",
  "meal-frequency",
  "food-budget",
  "allergies",
  "diet-requirements",
  "preferred-cuisines",
  "disliked-foods",
  "preferred-ingredients",
  "disliked-ingredients",
  "health-constraints",
  "weekly-workout-count",
  "workout-experience",
  "workout-location",
  "workout-equipment",
  "workout-body-parts",
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

export const LEGACY_USER_ONBOARDING_STEP_REDIRECTS = {
  "injury-severity": "weekly-workout-count",
  "forbidden-exercises": "weekly-workout-count",
  medications: "weekly-workout-count",
  supplements: "weekly-workout-count",
  lifestyle: "meal-frequency",
  "exercise-preferences": "workout-location",
  "preferred-exercises": "workout-location",
  "disliked-exercises": "workout-location",
  "water-habits": "food-budget",
  "allergy-ingredients": "allergies",
  "nutrition-preferences": "diet-requirements",
  "diet-restrictions": "diet-requirements",
};

export const LEGACY_USER_ONBOARDING_STEPS = Object.keys(
  LEGACY_USER_ONBOARDING_STEP_REDIRECTS,
);

export const ALL_ONBOARDING_STEPS = [
  ...ONBOARDING_STEPS,
  ...LEGACY_USER_ONBOARDING_STEPS,
  ...COACH_ONBOARDING_STEPS,
];

export const isKnownOnboardingStep = (step) =>
  includes(ALL_ONBOARDING_STEPS, step);

export const isCoachOnboardingStep = (step) =>
  includes(COACH_ONBOARDING_STEPS, step);

export const normalizeUserOnboardingStep = (step) =>
  LEGACY_USER_ONBOARDING_STEP_REDIRECTS[step] ?? step;

export const getStepIndex = (step) =>
  indexOf(ONBOARDING_STEPS, normalizeUserOnboardingStep(step));

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
