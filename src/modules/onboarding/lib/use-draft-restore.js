import { isArray, keys } from "lodash";
import { useEffect, useRef } from "react";
import { useGetQuery } from "@/hooks/api";
import { useOnboardingStore } from "@/store";
import { mapCoachOnboardingDraftToStoreFields } from "./coach-onboarding-dto";
import { getOnboardingDraftApiPath } from "./onboarding-api-paths";
import {
  isMeaningfulUserDraftData,
  pickActiveUserDraftData,
} from "./user-draft-data";

/**
 * Checks whether the user-level onboarding fields in the local store
 * are all at their initial (empty) values.
 */
function isUserStoreEmpty(state) {
  return !isMeaningfulUserDraftData(pickActiveUserDraftData(state));
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

  const activeServerData = pickActiveUserDraftData(serverData);
  const fields = {};

  if (activeServerData.firstName) fields.firstName = activeServerData.firstName;
  if (activeServerData.lastName) fields.lastName = activeServerData.lastName;
  if (activeServerData.gender) fields.gender = activeServerData.gender;
  if (activeServerData.age) fields.age = String(activeServerData.age);
  if (activeServerData.height) {
    fields.height = {
      value: activeServerData.height?.value
        ? String(activeServerData.height.value)
        : "",
      unit: activeServerData.height?.unit ?? "cm",
    };
  }
  if (activeServerData.currentWeight) {
    fields.currentWeight = {
      value: activeServerData.currentWeight?.value
        ? String(activeServerData.currentWeight.value)
        : "",
      unit: activeServerData.currentWeight?.unit ?? "kg",
    };
  }
  if (activeServerData.goal) fields.goal = activeServerData.goal;
  if (activeServerData.weightGoal) fields.weightGoal = activeServerData.weightGoal;
  if (isArray(activeServerData.goals)) fields.goals = activeServerData.goals;
  if (activeServerData.targetWeight) {
    fields.targetWeight = {
      value: activeServerData.targetWeight?.value
        ? String(activeServerData.targetWeight.value)
        : "",
      unit: activeServerData.targetWeight?.unit ?? "kg",
    };
  }
  if (activeServerData.weeklyPace != null) {
    fields.weeklyPace = activeServerData.weeklyPace;
  }
  if (activeServerData.activityLevel) {
    fields.activityLevel = activeServerData.activityLevel;
  }
  if (activeServerData.mealFrequency) {
    fields.mealFrequency = activeServerData.mealFrequency;
  }
  if (isArray(activeServerData.completedUserOnboardingSteps)) {
    fields.completedUserOnboardingSteps =
      activeServerData.completedUserOnboardingSteps;
  }
  if (isArray(activeServerData.allergyIds)) {
    fields.allergyIds = activeServerData.allergyIds;
  }
  if (isArray(activeServerData.allergyIngredientIds)) {
    fields.allergyIngredientIds = activeServerData.allergyIngredientIds;
    if (!isArray(activeServerData.allergyIds)) {
      fields.allergyIds = activeServerData.allergyIngredientIds;
    }
  }
  if (isArray(activeServerData.customAllergies)) {
    fields.customAllergies = activeServerData.customAllergies;
  }
  if (isArray(activeServerData.dietRequirementIds)) {
    fields.dietRequirementIds = activeServerData.dietRequirementIds;
  }
  if (isArray(activeServerData.customDietRequirements)) {
    fields.customDietRequirements = activeServerData.customDietRequirements;
  }
  if (activeServerData.allergyOtherText) {
    fields.allergyOtherText = activeServerData.allergyOtherText;
  }
  if (isArray(activeServerData.healthConstraints)) {
    fields.healthConstraints = activeServerData.healthConstraints;
  }
  if (isArray(activeServerData.customHealthConstraints)) {
    fields.customHealthConstraints = activeServerData.customHealthConstraints;
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
      if (isUserStoreEmpty(state) && isMeaningfulUserDraftData(draftData)) {
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
