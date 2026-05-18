import { isArray, includes, trim } from "lodash";
import {
  ONBOARDING_STEPS,
  normalizeUserOnboardingStep,
} from "../constants";

const hasValue = (value) => {
  if (isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined && trim(String(value)) !== "";
};

const hasCompletedStep = (state, step) =>
  isArray(state.completedUserOnboardingSteps) &&
  includes(state.completedUserOnboardingSteps, step);

export const getNextUserOnboardingPath = (state) => {
  if (!hasValue(state.firstName)) {
    return "name";
  }

  if (!hasValue(state.gender)) {
    return "gender";
  }

  if (!hasValue(state.age)) {
    return "age";
  }

  if (!hasValue(state.height?.value)) {
    return "height";
  }

  if (!hasValue(state.currentWeight?.value)) {
    return "current-weight";
  }

  if (!hasValue(state.weightGoal) && !hasValue(state.goal)) {
    return "goal";
  }

  if (!hasValue(state.targetWeight?.value)) {
    return "target-weight";
  }

  if (!hasValue(state.weeklyPace)) {
    return "weekly-pace";
  }

  if (!hasCompletedStep(state, "other-goals")) {
    return "other-goals";
  }

  if (!hasValue(state.activityLevel)) {
    return "activity-level";
  }

  if (!hasValue(state.mealFrequency)) {
    return "meal-frequency";
  }

  if (
    !hasValue(state.dietRequirementIds) &&
    !hasValue(state.customDietRequirements) &&
    !hasValue(state.nutritionPreferenceKeys) &&
    !hasValue(state.nutritionPreferenceOtherText) &&
    !hasCompletedStep(state, "diet-requirements")
  ) {
    return "diet-requirements";
  }

  if (
    !hasValue(state.healthConstraints) &&
    !hasValue(state.customHealthConstraints) &&
    !hasCompletedStep(state, "health-constraints")
  ) {
    return "health-constraints";
  }

  return "review";
};

export const getResumeOnboardingPath = (state, onboardingCompleted) => {
  const lastVisitedStep = normalizeUserOnboardingStep(state.lastVisitedPath);
  if (includes(ONBOARDING_STEPS, lastVisitedStep)) {
    return lastVisitedStep;
  }

  if (onboardingCompleted) {
    return null;
  }

  return getNextUserOnboardingPath(state);
};
