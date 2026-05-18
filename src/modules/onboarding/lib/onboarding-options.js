import { filter, find, isArray, keys } from "lodash";
const RESOURCE_BY_OPTIONS_KEY = {
  allergies: "allergies",
  dietRequirements: "diet-requirements",
  foods: "foods",
  cuisines: "cuisines",
  ingredients: "ingredients",
  equipment: "equipment",
  bodyParts: "body-parts",
  exercises: "exercises",
  goals: "goals",
  healthConstraints: "health-constraints",
};

export const getOnboardingOptionsResource = (resourceOrOptionsKey) =>
  RESOURCE_BY_OPTIONS_KEY[resourceOrOptionsKey] ?? resourceOrOptionsKey;

export const getOnboardingOptionsPath = (resourceOrOptionsKey) =>
  `/user/onboarding/options/${getOnboardingOptionsResource(resourceOrOptionsKey)}`;

export const getOnboardingOptionsQueryKey = (
  resourceOrOptionsKey,
  ...parts
) => [
  "onboarding",
  "options",
  getOnboardingOptionsResource(resourceOrOptionsKey),
  ...filter(parts, (part) => part !== undefined && part !== null),
];

export const normalizeOnboardingOptionsResponse = (
  response,
  resourceOrOptionsKey,
) => {
  const body = response?.data?.data ?? response?.data ?? response ?? null;

  if (isArray(body)) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return [];
  }

  const optionsKey = find(
    keys(RESOURCE_BY_OPTIONS_KEY),
    (key) => RESOURCE_BY_OPTIONS_KEY[key] === resourceOrOptionsKey,
  );
  const directValues = body?.[resourceOrOptionsKey];
  const mappedValues = optionsKey ? body?.[optionsKey] : undefined;
  const values = isArray(directValues) ? directValues : mappedValues;

  return isArray(values) ? values : [];
};
