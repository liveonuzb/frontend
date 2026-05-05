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

const hasCompletedStep = (state, step) =>
  isArray(state.completedUserOnboardingSteps) &&
  state.completedUserOnboardingSteps.includes(step);

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
    !hasValue(state.foodBudgetTier) &&
    !hasValue(state.foodBudget) &&
    !hasCompletedStep(state, "food-budget")
  ) {
    return "food-budget";
  }

  if (
    !hasValue(state.allergyIds) &&
    !hasValue(state.allergyIngredientIds) &&
    !hasValue(state.customAllergies) &&
    !hasValue(state.allergyOtherText) &&
    !hasCompletedStep(state, "allergies")
  ) {
    return "allergies";
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
    !hasValue(state.preferredCuisineIds) &&
    !hasValue(state.customPreferredCuisines) &&
    !hasCompletedStep(state, "preferred-cuisines")
  ) {
    return "preferred-cuisines";
  }

  if (
    !hasValue(state.dislikedFoodIds) &&
    !hasValue(state.customDislikedFoods) &&
    !hasCompletedStep(state, "disliked-foods")
  ) {
    return "disliked-foods";
  }

  if (
    !hasValue(state.preferredIngredientIds) &&
    !hasValue(state.customPreferredIngredients) &&
    !hasCompletedStep(state, "preferred-ingredients")
  ) {
    return "preferred-ingredients";
  }

  if (
    !hasValue(state.dislikedIngredientIds) &&
    !hasValue(state.customDislikedIngredients) &&
    !hasCompletedStep(state, "disliked-ingredients")
  ) {
    return "disliked-ingredients";
  }

  if (
    !hasValue(state.healthConstraints) &&
    !hasValue(state.customHealthConstraints) &&
    !hasCompletedStep(state, "health-constraints")
  ) {
    return "health-constraints";
  }

  if (!hasValue(state.weeklyWorkoutCount)) {
    return "weekly-workout-count";
  }

  if (!hasValue(state.workoutExperience)) {
    return "workout-experience";
  }

  if (!hasCompletedStep(state, "workout-location")) {
    return "workout-location";
  }

  if (
    !hasValue(state.equipmentIds) &&
    !hasValue(state.customEquipment) &&
    !hasCompletedStep(state, "workout-equipment")
  ) {
    return "workout-equipment";
  }

  if (
    !hasValue(state.workoutBodyPartIds) &&
    !hasValue(state.customWorkoutBodyParts) &&
    !hasCompletedStep(state, "workout-body-parts")
  ) {
    return "workout-body-parts";
  }

  return "review";
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
