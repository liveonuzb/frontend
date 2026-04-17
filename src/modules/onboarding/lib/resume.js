import { indexOf, isArray } from "lodash";
import {
  COACH_ONBOARDING_STEPS,
  isCoachOnboardingStep,
  isKnownOnboardingStep,
} from "../constants";

const hasValue = (value) => {
  if (isArray(value)) {
    return value.length > 0;
  }

  return value !== null && value !== undefined && String(value).trim() !== "";
};

export const getNextUserOnboardingPath = (state) => {
  if (!hasValue(state.firstName) || !hasValue(state.lastName)) {
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

  if (!hasValue(state.goal)) {
    return "goal";
  }

  if (!hasValue(state.targetWeight?.value)) {
    return "target-weight";
  }

  if (!hasValue(state.activityLevel)) {
    return "weekly-pace";
  }

  if (!hasValue(state.mealFrequency)) {
    return "meal-frequency";
  }

  if (!hasValue(state.waterHabits)) {
    return "water-habits";
  }

  if (!hasValue(state.dietRestrictions)) {
    return "diet-restrictions";
  }

  return "diet-restrictions";
};

export const getResumeOnboardingPath = (state, onboardingCompleted) => {
  if (isKnownOnboardingStep(state.lastVisitedPath)) {
    return state.lastVisitedPath;
  }

  if (onboardingCompleted) {
    return null;
  }

  return getNextUserOnboardingPath(state);
};

export const getNextCoachOnboardingPath = (state, coachApplicationStatus) => {
  if (coachApplicationStatus === "APPROVED") {
    return null;
  }

  if (!hasValue(state.coachCategory)) {
    return "coach/category";
  }

  if (!hasValue(state.experience)) {
    return "coach/experience";
  }

  if (!hasValue(state.specializations)) {
    return "coach/specialization";
  }

  if (!hasValue(state.targetAudience)) {
    return "coach/target-audience";
  }

  if (!hasValue(state.availability)) {
    return "coach/availability";
  }

  if (!hasValue(state.certificationType)) {
    return "coach/certification";
  }

  if (
    state.certificationType &&
    state.certificationType !== "none" &&
    !hasValue(state.certificationNumber)
  ) {
    return "coach/certification";
  }

  if (
    state.certificationType &&
    state.certificationType !== "none" &&
    !hasValue(state.certificateFiles)
  ) {
    return "coach/certification";
  }

  if (!hasValue(state.coachBio) || String(state.coachBio).trim().length < 10) {
    return "coach/bio";
  }

  if (!hasValue(state.coachLanguages)) {
    return "coach/languages";
  }

  if (state.wantsMarketplaceListing && !hasValue(state.coachAvatar)) {
    return "coach/avatar";
  }

  return "coach/avatar";
};

export const getResumeCoachOnboardingPath = (state, coachApplicationStatus) => {
  if (isCoachOnboardingStep(state.lastVisitedPath)) {
    return state.lastVisitedPath;
  }

  if (coachApplicationStatus === "APPROVED") {
    return null;
  }

  return getNextCoachOnboardingPath(state, coachApplicationStatus);
};

export const getCoachOnboardingStepIndex = (step) =>
  indexOf(COACH_ONBOARDING_STEPS, step);
