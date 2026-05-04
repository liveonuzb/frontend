import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import useApi from "@/hooks/api/use-api.js";
import { useOnboardingStore } from "@/store";
import {
  buildCoachOnboardingPayload,
  normalizeOnboardingStepForApi,
} from "./coach-onboarding-dto";
import { getOnboardingDraftApiPath } from "./onboarding-api-paths";

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
      weeklyWorkoutCount: state.weeklyWorkoutCount,
      workoutExperience: state.workoutExperience,
      sleepHours: state.sleepHours,
      workType: state.workType,
      fastFoodFrequency: state.fastFoodFrequency,
      sweetDrinkHabit: state.sweetDrinkHabit,
      cookingTime: state.cookingTime,
      cookingAccess: state.cookingAccess,
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
      preferredCuisineIds: state.preferredCuisineIds,
      customPreferredCuisines: state.customPreferredCuisines,
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
      customHealthConstraints: state.customHealthConstraints,
      injurySeverity: state.injurySeverity,
      forbiddenExercises: state.forbiddenExercises,
      medications: state.medications,
      supplements: state.supplements,
      playsFootball: state.playsFootball,
      cardioLevel: state.cardioLevel,
      notificationPreference: state.notificationPreference,
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
      weeklyWorkoutCount: s.weeklyWorkoutCount,
      workoutExperience: s.workoutExperience,
      sleepHours: s.sleepHours,
      workType: s.workType,
      fastFoodFrequency: s.fastFoodFrequency,
      sweetDrinkHabit: s.sweetDrinkHabit,
      cookingTime: s.cookingTime,
      cookingAccess: s.cookingAccess,
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
      preferredCuisineIds: s.preferredCuisineIds,
      customPreferredCuisines: s.customPreferredCuisines,
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
      customHealthConstraints: s.customHealthConstraints,
      injurySeverity: s.injurySeverity,
      forbiddenExercises: s.forbiddenExercises,
      medications: s.medications,
      supplements: s.supplements,
      playsFootball: s.playsFootball,
      cardioLevel: s.cardioLevel,
      notificationPreference: s.notificationPreference,
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
  const stepRef = useRef(step);
  const typeRef = useRef(type);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    typeRef.current = type;
  }, [type]);

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
      const setDraftSaveStatus =
        useOnboardingStore.getState().setDraftSaveStatus;

      try {
        setDraftSaveStatus?.("saving");
        await request.put(getOnboardingDraftApiPath(typeRef.current), {
          data,
          currentStep,
        });
        setDraftSaveStatus?.("saved", {
          lastSavedAt: new Date().toISOString(),
          error: null,
        });
      } catch (error) {
        setDraftSaveStatus?.("error", {
          error: error instanceof Error ? error.message : "Auto-save failed",
        });
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
    const setDraftSaveStatus = useOnboardingStore.getState().setDraftSaveStatus;

    setDraftSaveStatus?.("saving");
    request
      .put(getOnboardingDraftApiPath(typeRef.current), {
        data,
        currentStep,
      })
      .then(() => {
        setDraftSaveStatus?.("saved", {
          lastSavedAt: new Date().toISOString(),
          error: null,
        });
      })
      .catch((error) => {
        setDraftSaveStatus?.("error", {
          error: error instanceof Error ? error.message : "Auto-save failed",
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
}
