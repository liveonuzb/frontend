const USER_DRAFT_FIELD_KEYS = new Set([
  "firstName",
  "lastName",
  "gender",
  "age",
  "height",
  "currentWeight",
  "goal",
  "weightGoal",
  "goals",
  "targetWeight",
  "weeklyPace",
  "activityLevel",
  "weeklyWorkoutCount",
  "workoutExperience",
  "sleepHours",
  "workType",
  "fastFoodFrequency",
  "sweetDrinkHabit",
  "cookingTime",
  "cookingAccess",
  "mealFrequency",
  "foodBudget",
  "foodBudgetTier",
  "budgetPeriod",
  "budgetCurrency",
  "workoutLocation",
  "equipmentIds",
  "customEquipment",
  "workoutBodyPartIds",
  "customWorkoutBodyParts",
  "allergyIds",
  "allergyIngredientIds",
  "customAllergies",
  "dietRequirementIds",
  "customDietRequirements",
  "preferredCuisineIds",
  "customPreferredCuisines",
  "dislikedFoodIds",
  "customDislikedFoods",
  "preferredIngredientIds",
  "customPreferredIngredients",
  "dislikedIngredientIds",
  "customDislikedIngredients",
  "nutritionPreferenceKeys",
  "allergyOtherText",
  "dislikedOtherText",
  "nutritionPreferenceOtherText",
  "dietRestrictions",
  "healthConstraints",
  "customHealthConstraints",
  "injurySeverity",
  "forbiddenExercises",
  "medications",
  "supplements",
  "playsFootball",
  "cardioLevel",
  "notificationPreference",
]);

const USER_DRAFT_DEFAULT_VALUES = {
  weeklyPace: 0.5,
  budgetPeriod: "weekly",
  budgetCurrency: "UZS",
  workoutLocation: "home",
};

function hasMeaningfulUserDraftValue(key, value) {
  if (value === null || value === undefined) return false;

  if (Array.isArray(value)) return value.length > 0;

  if (typeof value === "string") {
    const trimmed = value.trim();
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

    return Object.entries(value).some(([childKey, childValue]) =>
      hasMeaningfulUserDraftValue(childKey, childValue),
    );
  }

  return false;
}

export function isMeaningfulUserDraftData(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return false;
  }

  return Object.entries(data).some(([key, value]) => {
    if (!USER_DRAFT_FIELD_KEYS.has(key)) return false;

    return hasMeaningfulUserDraftValue(key, value);
  });
}
