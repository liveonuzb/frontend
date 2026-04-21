import { isArray, keys } from "lodash";
import { useEffect, useRef } from "react";
import { useGetQuery } from "@/hooks/api";
import { useOnboardingStore } from "@/store";
import { mapCoachOnboardingDraftToStoreFields } from "./coach-onboarding-dto";

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
    !state.targetWeight?.value &&
    !state.activityLevel &&
    !state.mealFrequency &&
    !state.waterHabits &&
    (!isArray(state.dietRestrictions) ||
      state.dietRestrictions.length === 0)
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
    (!isArray(state.coachCategories) ||
      state.coachCategories.length === 0) &&
    (!isArray(state.targetAudience) ||
      state.targetAudience.length === 0) &&
    (!isArray(state.specializations) ||
      state.specializations.length === 0) &&
    !state.certificationType &&
    !state.certificationNumber &&
    (!isArray(state.certificateFiles) ||
      state.certificateFiles.length === 0) &&
    (!isArray(state.coachLanguages) ||
      state.coachLanguages.length === 0) &&
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
  if (serverData.mealFrequency) {
    fields.mealFrequency = serverData.mealFrequency;
  }
  if (serverData.waterHabits) {
    fields.waterHabits = serverData.waterHabits;
  }
  if (isArray(serverData.dietRestrictions)) {
    fields.dietRestrictions = serverData.dietRestrictions;
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
    url: `/onboarding/${type}/draft`,
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
