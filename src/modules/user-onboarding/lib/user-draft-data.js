import { fromPairs, isArray, some, trim, toPairs } from "lodash";
export const ACTIVE_USER_ONBOARDING_DRAFT_KEYS = new Set([
  "firstName",
  "lastName",
  "gender",
  "age",
  "height",
  "currentWeight",
  "goal",
  "weightGoal",
  "targetWeight",
  "weeklyPace",
  "activityLevel",
  "mealFrequency",
  "completedUserOnboardingSteps",
  "allergyIds",
  "allergyIngredientIds",
  "customAllergies",
  "dietRequirementIds",
  "customDietRequirements",
  "allergyOtherText",
  "healthConstraints",
  "customHealthConstraints",
]);

export function pickActiveUserDraftData(data = {}) {
  return fromPairs(Array.from(ACTIVE_USER_ONBOARDING_DRAFT_KEYS, (key) => [key, data[key]]));
}

const USER_DRAFT_DEFAULT_VALUES = {
  weeklyPace: 0.5,
};

function hasMeaningfulUserDraftValue(key, value) {
  if (value === null || value === undefined) return false;

  if (isArray(value)) return value.length > 0;

  if (typeof value === "string") {
    const trimmed = trim(value);
    return trimmed.length > 0 && USER_DRAFT_DEFAULT_VALUES[key] !== trimmed;
  }

  if (typeof value === "number") {
    return USER_DRAFT_DEFAULT_VALUES[key] !== value;
  }

  if (typeof value === "boolean") return value === true;

  if (typeof value === "object") {
    if (Object.prototype.hasOwnProperty.call(value, "value")) {
      return hasMeaningfulUserDraftValue(`${key}.value`, value.value);
    }

    return some(toPairs(value), ([childKey, childValue]) =>
      hasMeaningfulUserDraftValue(childKey, childValue));
  }

  return false;
}

export function isMeaningfulUserDraftData(data) {
  if (!data || typeof data !== "object" || isArray(data)) {
    return false;
  }

  return some(toPairs(data), ([key, value]) => {
    if (!ACTIVE_USER_ONBOARDING_DRAFT_KEYS.has(key)) return false;

    return hasMeaningfulUserDraftValue(key, value);
  });
}
