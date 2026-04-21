import { isArray } from "lodash";

const COACH_API_STEP_BY_UI_STEP = {
  "coach/category": "marketplace",
  "coach/experience": "experience",
  "coach/specialization": "specialization",
  "coach/target-audience": "marketplace",
  "coach/availability": "marketplace",
  "coach/certification": "certification",
  "coach/bio": "bio",
  "coach/pricing": "pricing",
  "coach/languages": "languages",
  "coach/avatar": "marketplace",
};

const optionalNumber = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const optionalString = (value) => {
  if (value === null || value === undefined) return undefined;
  const stringValue = String(value).trim();
  return stringValue ? stringValue : undefined;
};

export const normalizeCoachStepForApi = (step) =>
  COACH_API_STEP_BY_UI_STEP[step] ?? step;

export const normalizeOnboardingStepForApi = (type, step) =>
  type === "coach" ? normalizeCoachStepForApi(step) : step;

export const buildCoachOnboardingPayload = (state) => ({
  category: optionalString(state.coachCategory ?? state.category),
  categories: isArray(state.coachCategories ?? state.categories)
    ? state.coachCategories ?? state.categories
    : undefined,
  targetAudience: isArray(state.targetAudience)
    ? state.targetAudience
    : undefined,
  availability: state.availability,
  experience: optionalString(state.experience),
  specializations: isArray(state.specializations)
    ? state.specializations
    : undefined,
  certificationType: optionalString(state.certificationType),
  certificationNumber: optionalString(state.certificationNumber),
  certificateFiles: isArray(state.certificateFiles)
    ? state.certificateFiles
    : undefined,
  languages: isArray(state.coachLanguages ?? state.languages)
    ? state.coachLanguages ?? state.languages
    : undefined,
  city: optionalString(state.coachCity ?? state.city),
  workMode: optionalString(state.coachWorkMode ?? state.workMode),
  workplace: optionalString(state.coachWorkplace ?? state.workplace),
  monthlyPrice: optionalNumber(state.coachMonthlyPrice ?? state.monthlyPrice),
  minMonthlyPrice: optionalNumber(
    state.coachMinMonthlyPrice ?? state.minMonthlyPrice,
  ),
  maxMonthlyPrice: optionalNumber(
    state.coachMaxMonthlyPrice ?? state.maxMonthlyPrice,
  ),
  bio: optionalString(state.coachBio ?? state.bio),
  avatar: optionalString(state.coachAvatar ?? state.avatar),
  wantsMarketplaceListing: Boolean(state.wantsMarketplaceListing),
});

export const mapCoachOnboardingDraftToStoreFields = (serverData) => {
  if (!serverData) return {};

  const fields = {};
  const category = serverData.coachCategory ?? serverData.category;
  const categories = serverData.coachCategories ?? serverData.categories;
  const languages = serverData.coachLanguages ?? serverData.languages;
  const city = serverData.coachCity ?? serverData.city;
  const workMode = serverData.coachWorkMode ?? serverData.workMode;
  const workplace = serverData.coachWorkplace ?? serverData.workplace;
  const monthlyPrice = serverData.coachMonthlyPrice ?? serverData.monthlyPrice;
  const minMonthlyPrice =
    serverData.coachMinMonthlyPrice ?? serverData.minMonthlyPrice;
  const maxMonthlyPrice =
    serverData.coachMaxMonthlyPrice ?? serverData.maxMonthlyPrice;
  const bio = serverData.coachBio ?? serverData.bio;
  const avatar = serverData.coachAvatar ?? serverData.avatar;

  if (category) fields.coachCategory = category;
  if (isArray(categories)) fields.coachCategories = categories;
  if (isArray(serverData.targetAudience)) {
    fields.targetAudience = serverData.targetAudience;
  }
  if (serverData.availability) fields.availability = serverData.availability;
  if (serverData.experience) fields.experience = serverData.experience;
  if (isArray(serverData.specializations)) {
    fields.specializations = serverData.specializations;
  }
  if (serverData.certificationType) {
    fields.certificationType = serverData.certificationType;
  }
  if (serverData.certificationNumber) {
    fields.certificationNumber = serverData.certificationNumber;
  }
  if (isArray(serverData.certificateFiles)) {
    fields.certificateFiles = serverData.certificateFiles;
  }
  if (isArray(languages)) fields.coachLanguages = languages;
  if (city) fields.coachCity = city;
  if (workMode) fields.coachWorkMode = workMode;
  if (workplace) fields.coachWorkplace = workplace;
  if (monthlyPrice !== null && monthlyPrice !== undefined) {
    fields.coachMonthlyPrice = String(monthlyPrice);
  }
  if (minMonthlyPrice !== null && minMonthlyPrice !== undefined) {
    fields.coachMinMonthlyPrice = String(minMonthlyPrice);
  }
  if (maxMonthlyPrice !== null && maxMonthlyPrice !== undefined) {
    fields.coachMaxMonthlyPrice = String(maxMonthlyPrice);
  }
  if (bio) fields.coachBio = bio;
  if (avatar) fields.coachAvatar = avatar;
  if (serverData.wantsMarketplaceListing !== null && serverData.wantsMarketplaceListing !== undefined) {
    fields.wantsMarketplaceListing = Boolean(
      serverData.wantsMarketplaceListing,
    );
  }

  return fields;
};
