import { isArray, keys } from "lodash";
import { useEffect, useRef } from "react";
import { useGetQuery } from "@/hooks/api";
import { normalizeIngredientPreferencePair } from "@/lib/user-onboarding";
import { useOnboardingStore } from "@/store";
import { mapCoachOnboardingDraftToStoreFields } from "./coach-onboarding-dto";
import { getOnboardingDraftApiPath } from "./onboarding-api-paths";

/**
 * Checks whether the user-level onboarding fields in the local store
 * are all at their initial (empty) values.
 */
function isUserStoreEmpty(state) {
  return (
    !state.firstName &&
    !state.lastName &&
    !state.gender &&
    !state.age &&
    !state.height?.value &&
    !state.currentWeight?.value &&
    !state.goal &&
    !state.weightGoal &&
    (!isArray(state.goals) || state.goals.length === 0) &&
    !state.targetWeight?.value &&
    !state.activityLevel &&
    !state.weeklyWorkoutCount &&
    !state.workoutExperience &&
    !state.sleepHours &&
    !state.workType &&
    !state.fastFoodFrequency &&
    !state.sweetDrinkHabit &&
    !state.cookingTime &&
    !state.cookingAccess &&
    !state.mealFrequency &&
    !state.foodBudget &&
    !state.foodBudgetTier &&
    !(state.workoutLocation && state.workoutLocation !== "home") &&
    (!isArray(state.equipmentIds) || state.equipmentIds.length === 0) &&
    (!isArray(state.customEquipment) || state.customEquipment.length === 0) &&
    (!isArray(state.workoutBodyPartIds) ||
      state.workoutBodyPartIds.length === 0) &&
    (!isArray(state.customWorkoutBodyParts) ||
      state.customWorkoutBodyParts.length === 0) &&
    (!isArray(state.completedUserOnboardingSteps) ||
      state.completedUserOnboardingSteps.length === 0) &&
    (!isArray(state.allergyIds) || state.allergyIds.length === 0) &&
    (!isArray(state.allergyIngredientIds) ||
      state.allergyIngredientIds.length === 0) &&
    (!isArray(state.customAllergies) || state.customAllergies.length === 0) &&
    (!isArray(state.dietRequirementIds) ||
      state.dietRequirementIds.length === 0) &&
    (!isArray(state.customDietRequirements) ||
      state.customDietRequirements.length === 0) &&
    (!isArray(state.preferredCuisineIds) ||
      state.preferredCuisineIds.length === 0) &&
    (!isArray(state.customPreferredCuisines) ||
      state.customPreferredCuisines.length === 0) &&
    (!isArray(state.dislikedFoodIds) || state.dislikedFoodIds.length === 0) &&
    (!isArray(state.customDislikedFoods) ||
      state.customDislikedFoods.length === 0) &&
    (!isArray(state.preferredIngredientIds) ||
      state.preferredIngredientIds.length === 0) &&
    (!isArray(state.customPreferredIngredients) ||
      state.customPreferredIngredients.length === 0) &&
    (!isArray(state.dislikedIngredientIds) ||
      state.dislikedIngredientIds.length === 0) &&
    (!isArray(state.customDislikedIngredients) ||
      state.customDislikedIngredients.length === 0) &&
    (!isArray(state.nutritionPreferenceKeys) ||
      state.nutritionPreferenceKeys.length === 0) &&
    !state.allergyOtherText &&
    !state.dislikedOtherText &&
    !state.nutritionPreferenceOtherText &&
    (!isArray(state.dietRestrictions) || state.dietRestrictions.length === 0) &&
    (!isArray(state.healthConstraints) ||
      state.healthConstraints.length === 0) &&
    (!isArray(state.customHealthConstraints) ||
      state.customHealthConstraints.length === 0) &&
    !state.injurySeverity &&
    (!isArray(state.forbiddenExercises) ||
      state.forbiddenExercises.length === 0) &&
    !state.medications &&
    !state.supplements &&
    !state.playsFootball &&
    !state.cardioLevel &&
    !state.notificationPreference
  );
}

/**
 * Checks whether the coach-level onboarding fields in the local store
 * are all at their initial (empty) values.
 */
function isCoachStoreEmpty(state) {
  return (
    !state.experience &&
    !state.coachCategory &&
    (!isArray(state.coachCategories) || state.coachCategories.length === 0) &&
    (!isArray(state.targetAudience) || state.targetAudience.length === 0) &&
    (!isArray(state.specializations) || state.specializations.length === 0) &&
    !state.certificationType &&
    !state.certificationNumber &&
    (!isArray(state.certificateFiles) || state.certificateFiles.length === 0) &&
    (!isArray(state.coachLanguages) || state.coachLanguages.length === 0) &&
    !state.coachCity &&
    !state.coachWorkMode &&
    !state.coachWorkplace &&
    !state.coachMonthlyPrice &&
    !state.coachMinMonthlyPrice &&
    !state.coachMaxMonthlyPrice &&
    !state.coachBio &&
    !state.coachAvatar
  );
}

/**
 * Checks whether a vendor draft in the local store is empty.
 */
function isVendorDraftEmpty(draft) {
  if (!draft) return true;
  return !draft.name && !draft.phone && !draft.shortDescription;
}

/**
 * Merges server draft data into the local onboarding store.
 */
function mergeUserDraft(serverData, setFields) {
  if (!serverData) return;

  const fields = {};

  if (serverData.firstName) fields.firstName = serverData.firstName;
  if (serverData.lastName) fields.lastName = serverData.lastName;
  if (serverData.gender) fields.gender = serverData.gender;
  if (serverData.age) fields.age = String(serverData.age);
  if (serverData.height) {
    fields.height = {
      value: serverData.height?.value ? String(serverData.height.value) : "",
      unit: serverData.height?.unit ?? "cm",
    };
  }
  if (serverData.currentWeight) {
    fields.currentWeight = {
      value: serverData.currentWeight?.value
        ? String(serverData.currentWeight.value)
        : "",
      unit: serverData.currentWeight?.unit ?? "kg",
    };
  }
  if (serverData.goal) fields.goal = serverData.goal;
  if (serverData.weightGoal) fields.weightGoal = serverData.weightGoal;
  if (isArray(serverData.goals)) fields.goals = serverData.goals;
  if (serverData.targetWeight) {
    fields.targetWeight = {
      value: serverData.targetWeight?.value
        ? String(serverData.targetWeight.value)
        : "",
      unit: serverData.targetWeight?.unit ?? "kg",
    };
  }
  if (serverData.weeklyPace != null) {
    fields.weeklyPace = serverData.weeklyPace;
  }
  if (serverData.activityLevel) {
    fields.activityLevel = serverData.activityLevel;
  }
  if (
    serverData.weeklyWorkoutCount !== undefined &&
    serverData.weeklyWorkoutCount !== null
  ) {
    fields.weeklyWorkoutCount = String(serverData.weeklyWorkoutCount);
  }
  if (serverData.workoutExperience) {
    fields.workoutExperience = serverData.workoutExperience;
  }
  if (serverData.sleepHours !== undefined && serverData.sleepHours !== null) {
    fields.sleepHours = String(serverData.sleepHours);
  }
  if (serverData.workType) {
    fields.workType = serverData.workType;
  }
  if (serverData.fastFoodFrequency) {
    fields.fastFoodFrequency = serverData.fastFoodFrequency;
  }
  if (serverData.sweetDrinkHabit) {
    fields.sweetDrinkHabit = serverData.sweetDrinkHabit;
  }
  if (serverData.cookingTime) {
    fields.cookingTime = serverData.cookingTime;
  }
  if (serverData.cookingAccess) {
    fields.cookingAccess = serverData.cookingAccess;
  }
  if (serverData.mealFrequency) {
    fields.mealFrequency = serverData.mealFrequency;
  }
  if (serverData.foodBudget !== undefined && serverData.foodBudget !== null) {
    fields.foodBudget = String(serverData.foodBudget);
  }
  if (serverData.foodBudgetTier) {
    fields.foodBudgetTier = serverData.foodBudgetTier;
  }
  if (serverData.budgetPeriod) {
    fields.budgetPeriod = serverData.budgetPeriod;
  }
  if (serverData.budgetCurrency) {
    fields.budgetCurrency = serverData.budgetCurrency;
  }
  if (serverData.workoutLocation) {
    fields.workoutLocation = serverData.workoutLocation;
  }
  if (isArray(serverData.equipmentIds)) {
    fields.equipmentIds = serverData.equipmentIds;
  }
  if (isArray(serverData.customEquipment)) {
    fields.customEquipment = serverData.customEquipment;
  }
  if (isArray(serverData.workoutBodyPartIds)) {
    fields.workoutBodyPartIds = serverData.workoutBodyPartIds;
  }
  if (isArray(serverData.customWorkoutBodyParts)) {
    fields.customWorkoutBodyParts = serverData.customWorkoutBodyParts;
  }
  if (isArray(serverData.completedUserOnboardingSteps)) {
    fields.completedUserOnboardingSteps =
      serverData.completedUserOnboardingSteps;
  }
  if (isArray(serverData.allergyIds)) {
    fields.allergyIds = serverData.allergyIds;
  }
  if (isArray(serverData.allergyIngredientIds)) {
    fields.allergyIngredientIds = serverData.allergyIngredientIds;
    if (!isArray(serverData.allergyIds)) {
      fields.allergyIds = serverData.allergyIngredientIds;
    }
  }
  if (isArray(serverData.customAllergies)) {
    fields.customAllergies = serverData.customAllergies;
  }
  if (isArray(serverData.dietRequirementIds)) {
    fields.dietRequirementIds = serverData.dietRequirementIds;
  }
  if (isArray(serverData.customDietRequirements)) {
    fields.customDietRequirements = serverData.customDietRequirements;
  }
  if (isArray(serverData.preferredCuisineIds)) {
    fields.preferredCuisineIds = serverData.preferredCuisineIds;
  }
  if (isArray(serverData.customPreferredCuisines)) {
    fields.customPreferredCuisines = serverData.customPreferredCuisines;
  }
  if (isArray(serverData.dislikedFoodIds)) {
    fields.dislikedFoodIds = serverData.dislikedFoodIds;
  }
  if (isArray(serverData.customDislikedFoods)) {
    fields.customDislikedFoods = serverData.customDislikedFoods;
  }
  if (isArray(serverData.preferredIngredientIds)) {
    fields.preferredIngredientIds = serverData.preferredIngredientIds;
  }
  if (isArray(serverData.customPreferredIngredients)) {
    fields.customPreferredIngredients = serverData.customPreferredIngredients;
  }
  if (isArray(serverData.dislikedIngredientIds)) {
    fields.dislikedIngredientIds = serverData.dislikedIngredientIds;
  }
  if (isArray(serverData.customDislikedIngredients)) {
    fields.customDislikedIngredients = serverData.customDislikedIngredients;
  }
  if (isArray(serverData.nutritionPreferenceKeys)) {
    fields.nutritionPreferenceKeys = serverData.nutritionPreferenceKeys;
  }
  if (serverData.allergyOtherText) {
    fields.allergyOtherText = serverData.allergyOtherText;
  }
  if (serverData.dislikedOtherText) {
    fields.dislikedOtherText = serverData.dislikedOtherText;
  }
  if (serverData.nutritionPreferenceOtherText) {
    fields.nutritionPreferenceOtherText =
      serverData.nutritionPreferenceOtherText;
  }
  if (isArray(serverData.dietRestrictions)) {
    fields.dietRestrictions = serverData.dietRestrictions;
  }
  if (isArray(serverData.healthConstraints)) {
    fields.healthConstraints = serverData.healthConstraints;
  }
  if (isArray(serverData.customHealthConstraints)) {
    fields.customHealthConstraints = serverData.customHealthConstraints;
  }
  if (serverData.injurySeverity) {
    fields.injurySeverity = serverData.injurySeverity;
  }
  if (isArray(serverData.forbiddenExercises)) {
    fields.forbiddenExercises = serverData.forbiddenExercises;
  }
  if (serverData.medications) {
    fields.medications = serverData.medications;
  }
  if (serverData.supplements) {
    fields.supplements = serverData.supplements;
  }
  if (
    serverData.playsFootball !== undefined &&
    serverData.playsFootball !== null
  ) {
    fields.playsFootball = Boolean(serverData.playsFootball);
  }
  if (serverData.cardioLevel) {
    fields.cardioLevel = serverData.cardioLevel;
  }
  if (serverData.notificationPreference) {
    fields.notificationPreference = serverData.notificationPreference;
  }

  if (
    isArray(fields.preferredIngredientIds) ||
    isArray(fields.dislikedIngredientIds) ||
    isArray(fields.customPreferredIngredients) ||
    isArray(fields.customDislikedIngredients)
  ) {
    Object.assign(fields, normalizeIngredientPreferencePair(fields));
  }

  if (keys(fields).length > 0) {
    setFields(fields);
  }
}

function mergeCoachDraft(serverData, setFields) {
  if (!serverData) return;

  const fields = mapCoachOnboardingDraftToStoreFields(serverData);

  if (keys(fields).length > 0) {
    setFields(fields);
  }
}

function mergeVendorDraft(serverData, roleType, setVendorDraft) {
  if (!serverData) return;

  const fields = {};

  if (serverData.name) fields.name = serverData.name;
  if (serverData.phone) fields.phone = serverData.phone;
  if (serverData.city) fields.city = serverData.city;
  if (serverData.district) fields.district = serverData.district;
  if (serverData.addressLine) fields.addressLine = serverData.addressLine;
  if (serverData.shortDescription) {
    fields.shortDescription = serverData.shortDescription;
  }
  if (serverData.description) fields.description = serverData.description;
  if (serverData.telegramUrl) fields.telegramUrl = serverData.telegramUrl;
  if (serverData.websiteUrl) fields.websiteUrl = serverData.websiteUrl;
  if (serverData.logoUrl) fields.logoUrl = serverData.logoUrl;
  if (serverData.coverImageUrl) {
    fields.coverImageUrl = serverData.coverImageUrl;
  }
  if (serverData.shopMode) fields.shopMode = serverData.shopMode;
  if (serverData.wantsMarketplaceListing != null) {
    fields.wantsMarketplaceListing = serverData.wantsMarketplaceListing;
  }
  if (isArray(serverData.locations)) {
    fields.locations = serverData.locations;
  }

  if (keys(fields).length > 0) {
    setVendorDraft(roleType, fields);
  }
}

/**
 * Hook that fetches a server-side onboarding draft and restores it
 * into the local Zustand store if the local store is empty.
 * Enables cross-device resume.
 *
 * @param {string} type - "user" | "coach" | "gym" | "shop" | "food"
 * @param {object} options
 * @param {boolean} options.enabled - whether to fetch the draft (default true)
 */
export function useDraftRestore(type, { enabled = true } = {}) {
  const restoredRef = useRef(false);

  const { data: serverDraft, isLoading } = useGetQuery({
    url: getOnboardingDraftApiPath(type),
    queryProps: {
      queryKey: ["onboarding-draft", type],
      enabled,
      staleTime: 30000,
    },
  });

  const setFields = useOnboardingStore((s) => s.setFields);
  const setVendorDraft = useOnboardingStore((s) => s.setVendorDraft);

  useEffect(() => {
    if (restoredRef.current || isLoading || !serverDraft?.data) return;

    const state = useOnboardingStore.getState();
    const draftData = serverDraft.data;
    if (type === "user") {
      if (isUserStoreEmpty(state)) {
        mergeUserDraft(draftData, setFields);
      }
    } else if (type === "coach") {
      if (isCoachStoreEmpty(state)) {
        mergeCoachDraft(draftData, setFields);
      }
    } else {
      // Vendor types: gym, shop, food
      const vendorDraft = state.vendorDrafts?.[type];
      if (isVendorDraftEmpty(vendorDraft)) {
        mergeVendorDraft(draftData, type, setVendorDraft);
      }
    }

    restoredRef.current = true;
  }, [serverDraft, isLoading, type, setFields, setVendorDraft]);

  return { serverDraft, isLoading };
}
