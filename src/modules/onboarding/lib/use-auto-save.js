import { useEffect, useRef } from "react";
import { debounce } from "lodash";
import useApi from "@/hooks/api/use-api.js";
import { useOnboardingStore } from "@/store";

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
      targetWeight: state.targetWeight,
      weeklyPace: state.weeklyPace,
      activityLevel: state.activityLevel,
      mealFrequency: state.mealFrequency,
      waterHabits: state.waterHabits,
      dietRestrictions: state.dietRestrictions,
    };
  }

  if (type === "coach") {
    return {
      coachCategory: state.coachCategory,
      coachCategories: state.coachCategories,
      targetAudience: state.targetAudience,
      availability: state.availability,
      experience: state.experience,
      specializations: state.specializations,
      certificationType: state.certificationType,
      certificationNumber: state.certificationNumber,
      certificateFiles: state.certificateFiles,
      coachLanguages: state.coachLanguages,
      coachCity: state.coachCity,
      coachWorkMode: state.coachWorkMode,
      coachWorkplace: state.coachWorkplace,
      coachMonthlyPrice: state.coachMonthlyPrice,
      coachMinMonthlyPrice: state.coachMinMonthlyPrice,
      coachMaxMonthlyPrice: state.coachMaxMonthlyPrice,
      coachBio: state.coachBio,
      coachAvatar: state.coachAvatar,
      wantsMarketplaceListing: state.wantsMarketplaceListing,
    };
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
      targetWeight: s.targetWeight,
      weeklyPace: s.weeklyPace,
      activityLevel: s.activityLevel,
      mealFrequency: s.mealFrequency,
      waterHabits: s.waterHabits,
      dietRestrictions: s.dietRestrictions,
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

      try {
        await request.put(`/onboarding/${typeRef.current}/draft`, {
          data,
          currentStep: stepRef.current,
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

    request
      .put(`/onboarding/${typeRef.current}/draft`, {
        data,
        currentStep: stepRef.current,
      })
      .catch(() => {
        // Silent fail
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
}
