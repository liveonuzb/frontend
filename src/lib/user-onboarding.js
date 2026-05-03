import { isArray } from "lodash";
const toValueUnit = (field, unit, defaultUnit) => {
  if (!field && field !== 0) {
    return null;
  }

  if (typeof field === "object" && field !== null && "value" in field) {
    const value = field.value;
    if (value === "" || value === null || value === undefined) {
      return null;
    }

    return {
      value,
      unit: field.unit ?? defaultUnit,
    };
  }

  return {
    value: field,
    unit: unit ?? defaultUnit,
  };
};

export const normalizeUserOnboarding = (onboarding) => {
  if (!onboarding) {
    return null;
  }
  const exercisePreferences = normalizeExercisePreferencePair({
    preferredExerciseIds: onboarding.preferredExerciseIds,
    dislikedExerciseIds: onboarding.dislikedExerciseIds,
    customPreferredExercises: onboarding.customPreferredExercises,
    customDislikedExercises: onboarding.customDislikedExercises,
  });
  const ingredientPreferences = normalizeIngredientPreferencePair({
    preferredIngredientIds: onboarding.preferredIngredientIds,
    dislikedIngredientIds: onboarding.dislikedIngredientIds,
    customPreferredIngredients: onboarding.customPreferredIngredients,
    customDislikedIngredients: onboarding.customDislikedIngredients,
  });

  return {
    firstName: onboarding.firstName ?? null,
    lastName: onboarding.lastName ?? null,
    gender: onboarding.gender ?? null,
    age: onboarding.age ?? null,
    height: toValueUnit(
      onboarding.height ?? onboarding.heightValue,
      onboarding.heightUnit,
      "cm",
    ),
    currentWeight: toValueUnit(
      onboarding.currentWeight ?? onboarding.currentWeightValue,
      onboarding.currentWeightUnit,
      "kg",
    ),
    goal: onboarding.goal ?? null,
    weightGoal: onboarding.weightGoal ?? null,
    goals: isArray(onboarding.goals) ? onboarding.goals : [],
    targetWeight: toValueUnit(
      onboarding.targetWeight ?? onboarding.targetWeightValue,
      onboarding.targetWeightUnit,
      "kg",
    ),
    weeklyPace: onboarding.weeklyPace ?? null,
    activityLevel: onboarding.activityLevel ?? null,
    weeklyWorkoutCount: onboarding.weeklyWorkoutCount ?? null,
    workoutExperience: onboarding.workoutExperience ?? null,
    sleepHours: onboarding.sleepHours ?? null,
    workType: onboarding.workType ?? null,
    fastFoodFrequency: onboarding.fastFoodFrequency ?? null,
    sweetDrinkHabit: onboarding.sweetDrinkHabit ?? null,
    cookingTime: onboarding.cookingTime ?? null,
    cookingAccess: onboarding.cookingAccess ?? null,
    mealFrequency: onboarding.mealFrequency ?? null,
    waterHabits: onboarding.waterHabits ?? null,
    foodBudget: onboarding.foodBudget ?? null,
    budgetPeriod: onboarding.budgetPeriod ?? null,
    budgetCurrency: onboarding.budgetCurrency ?? "UZS",
    workoutLocation: onboarding.workoutLocation ?? "home",
    equipmentIds: isArray(onboarding.equipmentIds)
      ? onboarding.equipmentIds
      : [],
    customEquipment: isArray(onboarding.customEquipment)
      ? onboarding.customEquipment
      : [],
    workoutBodyPartIds: isArray(onboarding.workoutBodyPartIds)
      ? onboarding.workoutBodyPartIds
      : [],
    customWorkoutBodyParts: isArray(onboarding.customWorkoutBodyParts)
      ? onboarding.customWorkoutBodyParts
      : [],
    preferredExerciseIds: exercisePreferences.preferredExerciseIds,
    dislikedExerciseIds: exercisePreferences.dislikedExerciseIds,
    customPreferredExercises: exercisePreferences.customPreferredExercises,
    customDislikedExercises: exercisePreferences.customDislikedExercises,
    allergyIds: isArray(onboarding.allergyIds)
      ? onboarding.allergyIds
      : isArray(onboarding.allergyIngredientIds)
        ? onboarding.allergyIngredientIds
        : [],
    allergyIngredientIds: isArray(onboarding.allergyIngredientIds)
      ? onboarding.allergyIngredientIds
      : [],
    customAllergies: isArray(onboarding.customAllergies)
      ? onboarding.customAllergies
      : onboarding.allergyOtherText
        ? [onboarding.allergyOtherText]
        : [],
    dietRequirementIds: isArray(onboarding.dietRequirementIds)
      ? onboarding.dietRequirementIds
      : [],
    customDietRequirements: isArray(onboarding.customDietRequirements)
      ? onboarding.customDietRequirements
      : onboarding.nutritionPreferenceOtherText
        ? [onboarding.nutritionPreferenceOtherText]
        : [],
    dislikedFoodIds: isArray(onboarding.dislikedFoodIds)
      ? onboarding.dislikedFoodIds
      : [],
    customDislikedFoods: isArray(onboarding.customDislikedFoods)
      ? onboarding.customDislikedFoods
      : [],
    preferredIngredientIds: ingredientPreferences.preferredIngredientIds,
    customPreferredIngredients:
      ingredientPreferences.customPreferredIngredients,
    dislikedIngredientIds: ingredientPreferences.dislikedIngredientIds,
    customDislikedIngredients:
      ingredientPreferences.customDislikedIngredients.length > 0
        ? ingredientPreferences.customDislikedIngredients
        : onboarding.dislikedOtherText
          ? [onboarding.dislikedOtherText]
          : [],
    nutritionPreferenceKeys: isArray(onboarding.nutritionPreferenceKeys)
      ? onboarding.nutritionPreferenceKeys
      : [],
    allergyOtherText: onboarding.allergyOtherText ?? "",
    dislikedOtherText: onboarding.dislikedOtherText ?? "",
    nutritionPreferenceOtherText: onboarding.nutritionPreferenceOtherText ?? "",
    dietRestrictions: isArray(onboarding.dietRestrictions)
      ? onboarding.dietRestrictions
      : [],
    healthConstraints: isArray(onboarding.healthConstraints)
      ? onboarding.healthConstraints
      : [],
    injurySeverity: onboarding.injurySeverity ?? null,
    forbiddenExercises: isArray(onboarding.forbiddenExercises)
      ? onboarding.forbiddenExercises
      : [],
    medications: onboarding.medications ?? "",
    supplements: onboarding.supplements ?? "",
    playsFootball: onboarding.playsFootball ?? false,
    cardioLevel: onboarding.cardioLevel ?? null,
    notificationPreference: onboarding.notificationPreference ?? null,
    flowStatus: onboarding.flowStatus ?? null,
    skippedSteps: isArray(onboarding.skippedSteps) ? onboarding.skippedSteps : [],
    activatedAt: onboarding.activatedAt ?? null,
    latestPersonalizationJobId: onboarding.latestPersonalizationJobId ?? null,
    latestPlanGenerationJobId: onboarding.latestPlanGenerationJobId ?? null,
  };
};

const hasValue = (field) =>
  Boolean(field) &&
  field.value !== "" &&
  field.value !== null &&
  field.value !== undefined;

const toNumberArray = (values) =>
  isArray(values)
    ? Array.from(
        new Set(
          values
            .map((value) => Number(value))
            .filter((value) => Number.isInteger(value) && value > 0),
        ),
      )
    : undefined;

export const normalizeCustomTextArray = (values) => {
  if (!isArray(values)) {
    return undefined;
  }

  const seen = new Set();
  return values.reduce((acc, value) => {
    const label = String(value ?? "").replace(/\s+/g, " ").trim();
    const key = label.toLocaleLowerCase("uz-UZ");

    if (!label || seen.has(key)) {
      return acc;
    }

    seen.add(key);
    acc.push(label);
    return acc;
  }, []);
};

export const normalizeExercisePreferencePair = ({
  preferredExerciseIds,
  dislikedExerciseIds,
  customPreferredExercises,
  customDislikedExercises,
} = {}) => {
  const preferredIds = toNumberArray(preferredExerciseIds) ?? [];
  const preferredIdSet = new Set(preferredIds);
  const dislikedIds = (toNumberArray(dislikedExerciseIds) ?? []).filter(
    (id) => !preferredIdSet.has(id),
  );
  const preferredCustom = normalizeCustomTextArray(customPreferredExercises) ?? [];
  const preferredCustomSet = new Set(
    preferredCustom.map((value) => value.toLocaleLowerCase("uz-UZ")),
  );
  const dislikedCustom = (
    normalizeCustomTextArray(customDislikedExercises) ?? []
  ).filter((value) => !preferredCustomSet.has(value.toLocaleLowerCase("uz-UZ")));

  return {
    preferredExerciseIds: preferredIds,
    dislikedExerciseIds: dislikedIds,
    customPreferredExercises: preferredCustom,
    customDislikedExercises: dislikedCustom,
  };
};

export const normalizeIngredientPreferencePair = ({
  preferredIngredientIds,
  dislikedIngredientIds,
  customPreferredIngredients,
  customDislikedIngredients,
} = {}) => {
  const preferredIds = toNumberArray(preferredIngredientIds) ?? [];
  const preferredIdSet = new Set(preferredIds);
  const dislikedIds = (toNumberArray(dislikedIngredientIds) ?? []).filter(
    (id) => !preferredIdSet.has(id),
  );
  const preferredCustom =
    normalizeCustomTextArray(customPreferredIngredients) ?? [];
  const preferredCustomSet = new Set(
    preferredCustom.map((value) => value.toLocaleLowerCase("uz-UZ")),
  );
  const dislikedCustom = (
    normalizeCustomTextArray(customDislikedIngredients) ?? []
  ).filter((value) => !preferredCustomSet.has(value.toLocaleLowerCase("uz-UZ")));

  return {
    preferredIngredientIds: preferredIds,
    dislikedIngredientIds: dislikedIds,
    customPreferredIngredients: preferredCustom,
    customDislikedIngredients: dislikedCustom,
  };
};

const toNullableBudget = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

export const toUserOnboardingPayload = (patch = {}) => {
  const payload = {};

  if ("firstName" in patch) payload.firstName = patch.firstName || undefined;
  if ("lastName" in patch) payload.lastName = patch.lastName || undefined;
  if ("gender" in patch) payload.gender = patch.gender || undefined;
  if ("age" in patch) {
    payload.age =
      patch.age === "" || patch.age === null || patch.age === undefined
        ? undefined
        : Number(patch.age);
  }
  if ("height" in patch) {
    payload.height = hasValue(patch.height)
      ? {
          value: Number(patch.height.value),
          unit: patch.height.unit ?? "cm",
        }
      : undefined;
  }
  if ("currentWeight" in patch) {
    payload.currentWeight = hasValue(patch.currentWeight)
      ? {
          value: Number(patch.currentWeight.value),
          unit: patch.currentWeight.unit ?? "kg",
        }
      : undefined;
  }
  if ("goal" in patch) payload.goal = patch.goal || undefined;
  if ("weightGoal" in patch) payload.weightGoal = patch.weightGoal || undefined;
  if ("goals" in patch) {
    payload.goals = isArray(patch.goals) ? patch.goals : undefined;
  }
  if ("targetWeight" in patch) {
    payload.targetWeight = hasValue(patch.targetWeight)
      ? {
          value: Number(patch.targetWeight.value),
          unit: patch.targetWeight.unit ?? "kg",
        }
      : undefined;
  }
  if ("weeklyPace" in patch) {
    payload.weeklyPace =
      patch.weeklyPace === "" ||
      patch.weeklyPace === null ||
      patch.weeklyPace === undefined
        ? undefined
        : Number(patch.weeklyPace);
  }
  if ("activityLevel" in patch) {
    payload.activityLevel = patch.activityLevel || undefined;
  }
  if ("weeklyWorkoutCount" in patch) {
    payload.weeklyWorkoutCount =
      patch.weeklyWorkoutCount === "" ||
      patch.weeklyWorkoutCount === null ||
      patch.weeklyWorkoutCount === undefined
        ? undefined
        : Number(patch.weeklyWorkoutCount);
  }
  if ("workoutExperience" in patch) {
    payload.workoutExperience = patch.workoutExperience || undefined;
  }
  if ("sleepHours" in patch) {
    payload.sleepHours =
      patch.sleepHours === "" ||
      patch.sleepHours === null ||
      patch.sleepHours === undefined
        ? undefined
        : Number(patch.sleepHours);
  }
  if ("workType" in patch) {
    payload.workType = patch.workType || undefined;
  }
  if ("fastFoodFrequency" in patch) {
    payload.fastFoodFrequency = patch.fastFoodFrequency || undefined;
  }
  if ("sweetDrinkHabit" in patch) {
    payload.sweetDrinkHabit = patch.sweetDrinkHabit || undefined;
  }
  if ("cookingTime" in patch) {
    payload.cookingTime = patch.cookingTime || undefined;
  }
  if ("cookingAccess" in patch) {
    payload.cookingAccess = patch.cookingAccess || undefined;
  }
  if ("mealFrequency" in patch) {
    payload.mealFrequency = patch.mealFrequency || undefined;
  }
  if ("waterHabits" in patch) {
    payload.waterHabits = patch.waterHabits || undefined;
  }
  if ("foodBudget" in patch) {
    payload.foodBudget = toNullableBudget(patch.foodBudget);
  }
  if ("budgetPeriod" in patch) {
    payload.budgetPeriod = patch.budgetPeriod || null;
  }
  if ("budgetCurrency" in patch) {
    payload.budgetCurrency = patch.budgetCurrency || "UZS";
  }
  if ("workoutLocation" in patch) {
    payload.workoutLocation = patch.workoutLocation || "home";
  }
  if ("equipmentIds" in patch) {
    payload.equipmentIds = toNumberArray(patch.equipmentIds);
  }
  if ("customEquipment" in patch) {
    payload.customEquipment = normalizeCustomTextArray(patch.customEquipment);
  }
  if ("workoutBodyPartIds" in patch) {
    payload.workoutBodyPartIds = toNumberArray(patch.workoutBodyPartIds);
  }
  if ("customWorkoutBodyParts" in patch) {
    payload.customWorkoutBodyParts = normalizeCustomTextArray(
      patch.customWorkoutBodyParts,
    );
  }
  if ("preferredExerciseIds" in patch) {
    payload.preferredExerciseIds = toNumberArray(patch.preferredExerciseIds);
  }
  if ("dislikedExerciseIds" in patch) {
    payload.dislikedExerciseIds = toNumberArray(patch.dislikedExerciseIds);
  }
  if ("customPreferredExercises" in patch) {
    payload.customPreferredExercises = normalizeCustomTextArray(
      patch.customPreferredExercises,
    );
  }
  if ("customDislikedExercises" in patch) {
    payload.customDislikedExercises = normalizeCustomTextArray(
      patch.customDislikedExercises,
    );
  }
  if (
    "preferredExerciseIds" in patch ||
    "dislikedExerciseIds" in patch ||
    "customPreferredExercises" in patch ||
    "customDislikedExercises" in patch
  ) {
    const normalizedExercisePreferences = normalizeExercisePreferencePair({
      preferredExerciseIds:
        payload.preferredExerciseIds ?? patch.preferredExerciseIds,
      dislikedExerciseIds:
        payload.dislikedExerciseIds ?? patch.dislikedExerciseIds,
      customPreferredExercises:
        payload.customPreferredExercises ?? patch.customPreferredExercises,
      customDislikedExercises:
        payload.customDislikedExercises ?? patch.customDislikedExercises,
    });

    if ("preferredExerciseIds" in patch) {
      payload.preferredExerciseIds =
        normalizedExercisePreferences.preferredExerciseIds;
    }
    if ("dislikedExerciseIds" in patch) {
      payload.dislikedExerciseIds =
        normalizedExercisePreferences.dislikedExerciseIds;
    }
    if ("customPreferredExercises" in patch) {
      payload.customPreferredExercises =
        normalizedExercisePreferences.customPreferredExercises;
    }
    if ("customDislikedExercises" in patch) {
      payload.customDislikedExercises =
        normalizedExercisePreferences.customDislikedExercises;
    }
  }
  if ("allergyIds" in patch || "allergyIngredientIds" in patch) {
    const allergyIds = toNumberArray(
      "allergyIds" in patch ? patch.allergyIds : patch.allergyIngredientIds,
    );
    payload.allergyIds = allergyIds;
    payload.allergyIngredientIds = allergyIds;
  }
  if ("customAllergies" in patch) {
    payload.customAllergies = normalizeCustomTextArray(patch.customAllergies);
  }
  if ("dietRequirementIds" in patch) {
    payload.dietRequirementIds = toNumberArray(patch.dietRequirementIds);
  }
  if ("customDietRequirements" in patch) {
    payload.customDietRequirements = normalizeCustomTextArray(
      patch.customDietRequirements,
    );
  }
  if ("dislikedFoodIds" in patch) {
    payload.dislikedFoodIds = toNumberArray(patch.dislikedFoodIds);
  }
  if ("customDislikedFoods" in patch) {
    payload.customDislikedFoods = normalizeCustomTextArray(
      patch.customDislikedFoods,
    );
  }
  if ("preferredIngredientIds" in patch) {
    payload.preferredIngredientIds = toNumberArray(patch.preferredIngredientIds);
  }
  if ("dislikedIngredientIds" in patch) {
    payload.dislikedIngredientIds = toNumberArray(patch.dislikedIngredientIds);
  }
  if ("customPreferredIngredients" in patch) {
    payload.customPreferredIngredients = normalizeCustomTextArray(
      patch.customPreferredIngredients,
    );
  }
  if ("customDislikedIngredients" in patch) {
    payload.customDislikedIngredients = normalizeCustomTextArray(
      patch.customDislikedIngredients,
    );
  }
  if (
    "preferredIngredientIds" in patch ||
    "dislikedIngredientIds" in patch ||
    "customPreferredIngredients" in patch ||
    "customDislikedIngredients" in patch
  ) {
    const normalizedIngredientPreferences = normalizeIngredientPreferencePair({
      preferredIngredientIds:
        payload.preferredIngredientIds ?? patch.preferredIngredientIds,
      dislikedIngredientIds:
        payload.dislikedIngredientIds ?? patch.dislikedIngredientIds,
      customPreferredIngredients:
        payload.customPreferredIngredients ?? patch.customPreferredIngredients,
      customDislikedIngredients:
        payload.customDislikedIngredients ?? patch.customDislikedIngredients,
    });

    if ("preferredIngredientIds" in patch) {
      payload.preferredIngredientIds =
        normalizedIngredientPreferences.preferredIngredientIds;
    }
    if ("dislikedIngredientIds" in patch) {
      payload.dislikedIngredientIds =
        normalizedIngredientPreferences.dislikedIngredientIds;
    }
    if ("customPreferredIngredients" in patch) {
      payload.customPreferredIngredients =
        normalizedIngredientPreferences.customPreferredIngredients;
    }
    if ("customDislikedIngredients" in patch) {
      payload.customDislikedIngredients =
        normalizedIngredientPreferences.customDislikedIngredients;
    }
  }
  if ("nutritionPreferenceKeys" in patch) {
    payload.nutritionPreferenceKeys = isArray(patch.nutritionPreferenceKeys)
      ? patch.nutritionPreferenceKeys
      : undefined;
  }
  if ("allergyOtherText" in patch) {
    payload.allergyOtherText = patch.allergyOtherText || undefined;
  }
  if ("dislikedOtherText" in patch) {
    payload.dislikedOtherText = patch.dislikedOtherText || undefined;
  }
  if ("nutritionPreferenceOtherText" in patch) {
    payload.nutritionPreferenceOtherText =
      patch.nutritionPreferenceOtherText || undefined;
  }
  if ("dietRestrictions" in patch) {
    payload.dietRestrictions = isArray(patch.dietRestrictions)
      ? patch.dietRestrictions
      : undefined;
  }
  if ("healthConstraints" in patch) {
    payload.healthConstraints = isArray(patch.healthConstraints)
      ? patch.healthConstraints.filter((item) => item !== "none")
      : undefined;
  }
  if ("injurySeverity" in patch) {
    payload.injurySeverity = patch.injurySeverity || undefined;
  }
  if ("forbiddenExercises" in patch) {
    payload.forbiddenExercises = normalizeCustomTextArray(
      patch.forbiddenExercises,
    );
  }
  if ("medications" in patch) {
    payload.medications = patch.medications || undefined;
  }
  if ("supplements" in patch) {
    payload.supplements = patch.supplements || undefined;
  }
  if ("playsFootball" in patch) {
    payload.playsFootball = Boolean(patch.playsFootball);
  }
  if ("cardioLevel" in patch) {
    payload.cardioLevel = patch.cardioLevel || undefined;
  }
  if ("notificationPreference" in patch) {
    payload.notificationPreference = patch.notificationPreference || undefined;
  }

  return payload;
};
