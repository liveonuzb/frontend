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
  ...parts.filter((part) => part !== undefined && part !== null),
];

export const normalizeOnboardingOptionsResponse = (
  response,
  resourceOrOptionsKey,
) => {
  const body = response?.data?.data ?? response?.data ?? response ?? null;

  if (Array.isArray(body)) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return [];
  }

  const optionsKey = Object.keys(RESOURCE_BY_OPTIONS_KEY).find(
    (key) => RESOURCE_BY_OPTIONS_KEY[key] === resourceOrOptionsKey,
  );
  const directValues = body?.[resourceOrOptionsKey];
  const mappedValues = optionsKey ? body?.[optionsKey] : undefined;
  const values = Array.isArray(directValues) ? directValues : mappedValues;

  return Array.isArray(values) ? values : [];
};
