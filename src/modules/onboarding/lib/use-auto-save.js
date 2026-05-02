import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import useApi from "@/hooks/api/use-api.js";
import { useOnboardingStore } from "@/store";
import {
  buildCoachOnboardingPayload,
  normalizeOnboardingStepForApi,
} from "./coach-onboarding-dto";

/**
 * Extracts draft data from the onboarding store based on onboarding type.
 */
function extractDraftData(state, type) {
  if (type === "user") {
    return {
      firstName: state.firstName,
      lastName: state.lastName,
      gender: state.gender,
      age: state.age,
      height: state.height,
      currentWeight: state.currentWeight,
      goal: state.goal,
      weightGoal: state.weightGoal,
      goals: state.goals,
      targetWeight: state.targetWeight,
      weeklyPace: state.weeklyPace,
      activityLevel: state.activityLevel,
      mealFrequency: state.mealFrequency,
      waterHabits: state.waterHabits,
      foodBudget: state.foodBudget,
      budgetPeriod: state.budgetPeriod,
      budgetCurrency: state.budgetCurrency,
      workoutLocation: state.workoutLocation,
      equipmentIds: state.equipmentIds,
      customEquipment: state.customEquipment,
      workoutBodyPartIds: state.workoutBodyPartIds,
      customWorkoutBodyParts: state.customWorkoutBodyParts,
      preferredExerciseIds: state.preferredExerciseIds,
      dislikedExerciseIds: state.dislikedExerciseIds,
      customPreferredExercises: state.customPreferredExercises,
      customDislikedExercises: state.customDislikedExercises,
      completedUserOnboardingSteps: state.completedUserOnboardingSteps,
      allergyIds: state.allergyIds,
      allergyIngredientIds: state.allergyIngredientIds,
      customAllergies: state.customAllergies,
      dietRequirementIds: state.dietRequirementIds,
      customDietRequirements: state.customDietRequirements,
      dislikedFoodIds: state.dislikedFoodIds,
      customDislikedFoods: state.customDislikedFoods,
      preferredIngredientIds: state.preferredIngredientIds,
      customPreferredIngredients: state.customPreferredIngredients,
      dislikedIngredientIds: state.dislikedIngredientIds,
      customDislikedIngredients: state.customDislikedIngredients,
      nutritionPreferenceKeys: state.nutritionPreferenceKeys,
      allergyOtherText: state.allergyOtherText,
      dislikedOtherText: state.dislikedOtherText,
      nutritionPreferenceOtherText: state.nutritionPreferenceOtherText,
      dietRestrictions: state.dietRestrictions,
      healthConstraints: state.healthConstraints,
    };
  }

  if (type === "coach") {
    return buildCoachOnboardingPayload(state);
  }

  // Vendor types: gym, shop, food
  return state.vendorDrafts?.[type] ?? {};
}

/**
 * Builds a Zustand selector for the given onboarding type so that we only
 * re-trigger auto-save when the relevant slice of state changes, instead
 * of subscribing to every field in the entire store.
 */
function buildSelector(type) {
  if (type === "user") {
    return (s) => ({
      firstName: s.firstName,
      lastName: s.lastName,
      gender: s.gender,
      age: s.age,
      height: s.height,
      currentWeight: s.currentWeight,
      goal: s.goal,
      weightGoal: s.weightGoal,
      goals: s.goals,
      targetWeight: s.targetWeight,
      weeklyPace: s.weeklyPace,
      activityLevel: s.activityLevel,
      mealFrequency: s.mealFrequency,
      waterHabits: s.waterHabits,
      foodBudget: s.foodBudget,
      budgetPeriod: s.budgetPeriod,
      budgetCurrency: s.budgetCurrency,
      workoutLocation: s.workoutLocation,
      equipmentIds: s.equipmentIds,
      customEquipment: s.customEquipment,
      workoutBodyPartIds: s.workoutBodyPartIds,
      customWorkoutBodyParts: s.customWorkoutBodyParts,
      preferredExerciseIds: s.preferredExerciseIds,
      dislikedExerciseIds: s.dislikedExerciseIds,
      customPreferredExercises: s.customPreferredExercises,
      customDislikedExercises: s.customDislikedExercises,
      completedUserOnboardingSteps: s.completedUserOnboardingSteps,
      allergyIds: s.allergyIds,
      allergyIngredientIds: s.allergyIngredientIds,
      customAllergies: s.customAllergies,
      dietRequirementIds: s.dietRequirementIds,
      customDietRequirements: s.customDietRequirements,
      dislikedFoodIds: s.dislikedFoodIds,
      customDislikedFoods: s.customDislikedFoods,
      preferredIngredientIds: s.preferredIngredientIds,
      customPreferredIngredients: s.customPreferredIngredients,
      dislikedIngredientIds: s.dislikedIngredientIds,
      customDislikedIngredients: s.customDislikedIngredients,
      nutritionPreferenceKeys: s.nutritionPreferenceKeys,
      allergyOtherText: s.allergyOtherText,
      dislikedOtherText: s.dislikedOtherText,
      nutritionPreferenceOtherText: s.nutritionPreferenceOtherText,
      dietRestrictions: s.dietRestrictions,
      healthConstraints: s.healthConstraints,
    });
  }

  if (type === "coach") {
    return (s) => ({
      coachCategory: s.coachCategory,
      coachCategories: s.coachCategories,
      targetAudience: s.targetAudience,
      availability: s.availability,
      experience: s.experience,
      specializations: s.specializations,
      certificationType: s.certificationType,
      certificationNumber: s.certificationNumber,
      certificateFiles: s.certificateFiles,
      coachLanguages: s.coachLanguages,
      coachCity: s.coachCity,
      coachWorkMode: s.coachWorkMode,
      coachWorkplace: s.coachWorkplace,
      coachMonthlyPrice: s.coachMonthlyPrice,
      coachMinMonthlyPrice: s.coachMinMonthlyPrice,
      coachMaxMonthlyPrice: s.coachMaxMonthlyPrice,
      coachBio: s.coachBio,
      coachAvatar: s.coachAvatar,
      wantsMarketplaceListing: s.wantsMarketplaceListing,
    });
  }

  // Vendor types: gym, shop, food
  return (s) => s.vendorDrafts?.[type];
}

/**
 * Hook that subscribes to the Zustand onboarding store and auto-saves
 * draft data to the server when relevant state changes.
 *
 * Uses raw axios instead of usePutQuery to avoid React Query re-renders
 * and query invalidation that caused loading spinners on every keystroke.
 *
 * @param {string} type - "user" | "coach" | "gym" | "shop" | "food"
 * @param {string} step - current step identifier (e.g. "name", "gender", "profile")
 * @param {object} options
 * @param {number} options.debounceMs - debounce delay in ms (default 5000)
 * @param {boolean} options.enabled - whether auto-save is active (default true)
 */
export function useOnboardingAutoSave(
  type,
  step,
  { debounceMs = 5000, enabled = true } = {},
) {
  const { request } = useApi();

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const stepRef = useRef(step);
  stepRef.current = step;

  const typeRef = useRef(type);
  typeRef.current = type;

  useEffect(() => {
    if (!enabled) return;

    const save = debounce(async () => {
      if (!enabledRef.current) return;

      const state = useOnboardingStore.getState();
      const data = extractDraftData(state, typeRef.current);
      const currentStep = normalizeOnboardingStepForApi(
        typeRef.current,
        stepRef.current,
      );

      try {
        await request.put(`/onboarding/${typeRef.current}/draft`, {
          data,
          currentStep,
        });
      } catch {
        // Silent fail -- auto-save should not block UX
      }
    }, debounceMs);

    // Subscribe only to the relevant slice using subscribeWithSelector
    const selector = buildSelector(type);

    const unsubscribe = useOnboardingStore.subscribe(
      selector,
      () => {
        save();
      },
      {
        equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b),
      },
    );

    return () => {
      unsubscribe();
      save.cancel();
    };
  }, [enabled, type, debounceMs, request]);

  // Also save when the step changes (user navigated forward/back)
  useEffect(() => {
    if (!enabled) return;

    const state = useOnboardingStore.getState();
    const data = extractDraftData(state, typeRef.current);
    const currentStep = normalizeOnboardingStepForApi(
      typeRef.current,
      stepRef.current,
    );

    request
      .put(`/onboarding/${typeRef.current}/draft`, {
        data,
        currentStep,
      })
      .catch(() => {
        // Silent fail
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
}
