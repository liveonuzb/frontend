import {
  map,
  filter,
  find,
  get,
  isArray,
  size,
  toLower,
  includes,
  trim,
  toNumber,
  fromPairs,
  parseInt as lodashParseInt,
} from "lodash";
import {
  createWorkoutSetTemplate,
  normalizeWorkoutTrackingType,
} from "@/lib/workout-tracking";

export const WEEK_DAYS = [
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
  "Yakshanba",
];

const WORKOUT_CATEGORY_TRANSLATION_KEYS = {
  general: "general",
  chest: "chest",
  back: "back",
  legs: "legs",
  core: "core",
  shoulders: "shoulders",
  arms: "arms",
  biceps: "biceps",
  triceps: "triceps",
  glutes: "glutes",
  hamstrings: "hamstrings",
  quadriceps: "quadriceps",
  calves: "calves",
  cardio: "cardio",
  "full body": "fullBody",
  "upper body": "upperBody",
  "lower body": "lowerBody",
  lats: "lats",
  "upper back": "upperBack",
  "lower back": "lowerBack",
  abs: "abs",
};

const normalizeCategoryLookupValue = (value = "") =>
  toLower(trim(String(value || ""))).replace(/\s+/g, " ");

export const getWorkoutCategoryLabel = (value, t) => {
  const normalizedValue = normalizeCategoryLookupValue(value);
  const translationKey = WORKOUT_CATEGORY_TRANSLATION_KEYS[normalizedValue];

  if (translationKey && t) {
    return t(`components.workoutPlanBuilder.categories.${translationKey}`);
  }

  if (trim(String(value || ""))) {
    return value;
  }

  return t
    ? t("components.workoutPlanBuilder.categories.general")
    : "General";
};

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getCatalogExerciseId = (exercise) => {
  const rawId =
    get(exercise, "exerciseId") ?? get(exercise, "catalogId") ?? get(exercise, "id");
  const id = toNumber(rawId);

  return Number.isFinite(id) && id > 0 ? id : null;
};

const getCustomExerciseId = (exercise) => {
  const directId = get(exercise, "customExerciseId");

  if (directId) {
    return String(directId);
  }

  const rawId = String(get(exercise, "id", ""));

  return rawId.startsWith("custom:") ? rawId.replace("custom:", "") : null;
};

export const buildExerciseItem = (exercise) => {
  const exerciseId = getCatalogExerciseId(exercise);
  const customExerciseId = getCustomExerciseId(exercise);

  return {
    id: `ex-${uid()}`,
    exerciseId,
    customExerciseId,
    source: customExerciseId ? "custom" : "catalog",
    isCustom: Boolean(customExerciseId),
    name: get(exercise, "name"),
    emoji: get(exercise, "emoji", "🏋️"),
    group: get(exercise, "category", "General"),
    groupLabel: get(exercise, "category", "General"),
    trackingType: normalizeWorkoutTrackingType(get(exercise, "trackingType")),
    defaultSets: get(exercise, "defaultSets", 3),
    defaultReps: get(exercise, "defaultReps", null),
    defaultDurationSeconds: get(exercise, "defaultDurationSeconds", null),
    defaultDistanceMeters: get(exercise, "defaultDistanceMeters", null),
    defaultRestSeconds: get(exercise, "defaultRestSeconds", null),
    imageUrl: get(exercise, "imageUrl", null),
    youtubeUrl: get(exercise, "youtubeUrl", null),
    equipment: get(exercise, "equipment", null),
    targetMuscles: get(exercise, "targetMuscles", []),
    bodyParts: get(exercise, "bodyParts", []),
    equipments: get(exercise, "equipments", []),
    secondaryMuscles: get(exercise, "secondaryMuscles", []),
    instructions: get(exercise, "instructions", []),
    equipmentImages: get(exercise, "equipmentImages", []),
    sets: Array.from(
      { length: get(exercise, "defaultSets", 3) },
      () => createWorkoutSetTemplate(exercise),
    ),
    rest:
      get(exercise, "defaultRest") || get(exercise, "defaultRestSeconds") || 60,
    unit: get(exercise, "unit", null),
  };
};

export const buildWeekDaySkeleton = () =>
  map(WEEK_DAYS, (dayName, index) => ({
    id: `day-${index}-${uid()}`,
    dayKey: `weekday-${index + 1}`,
    name: dayName,
    focus: "",
  }));

/**
 * Numbered-day skeleton ("1-kun", "2-kun", ...). Used for user-side plans
 * where days are sequential workout days, not weekdays. The actual label
 * formatting (i18n) is handled by the caller — `name` here stores a stable
 * string that the UI can localize via the `dayName` key.
 */
export const buildNumberedDaySkeleton = (count = 3, formatName) =>
  Array.from({ length: count }, (_, index) => ({
    id: `day-${index}-${uid()}`,
    dayKey: `day-${index + 1}`,
    name:
      typeof formatName === "function"
        ? formatName(index + 1)
        : `${index + 1}-kun`,
    focus: "",
  }));

export const initFromPlan = (plan, library = [], { lockWeekDays = false } = {}) => {
  const schedule = get(plan, "schedule", []);

  if (size(schedule) === 0 && !lockWeekDays) {
    return { days: [], exercises: {} };
  }

  const sourceSchedule = lockWeekDays
    ? map(WEEK_DAYS, (dayName) => {
        const matchedDay = find(schedule, (entry) => get(entry, "day") === dayName);
        return matchedDay || { day: dayName, focus: "", exercises: [] };
      })
    : schedule;

  const days = map(sourceSchedule, (s, i) => ({
    id: `day-${i}-${Date.now()}`,
    dayKey: get(s, "dayKey") || `day-${i + 1}`,
    name: get(s, "day"),
    focus: get(s, "focus", ""),
    orderIndex: toNumber(get(s, "orderIndex", i)) || i,
  }));

  const exercises = {};
  map(days, (day, i) => {
    const scheduleDay = get(sourceSchedule, [i]);
    const dayExercises = get(scheduleDay, "exercises", []);

    exercises[day.id] = map(dayExercises, (ex) => {
      const customExerciseId = getCustomExerciseId(ex);
      const catalogExerciseId = getCatalogExerciseId(ex);
      const found = find(library, (e) => {
        const libraryCustomId = getCustomExerciseId(e);
        const libraryCatalogId = getCatalogExerciseId(e);

        return (
          (customExerciseId && libraryCustomId === customExerciseId) ||
          (catalogExerciseId && libraryCatalogId === catalogExerciseId) ||
          toLower(get(e, "name")) === toLower(get(ex, "name"))
        );
      });

      const trackingType = normalizeWorkoutTrackingType(
        get(ex, "trackingType") || get(found, "trackingType"),
      );

      let sets = [];
      if (isArray(get(ex, "sets"))) {
        sets = map(get(ex, "sets"), (set) =>
          createWorkoutSetTemplate(
            { ...found, ...ex, trackingType },
            set,
          ),
        );
      } else {
        const setCount = lodashParseInt(get(ex, "sets")) || get(found, "defaultSets", 3);
        sets = Array.from({ length: setCount }, () =>
          createWorkoutSetTemplate(
            { ...found, ...ex, trackingType },
            ex,
          ),
        );
      }

      return {
        id: `ex-${i}-${Math.random().toString(36).slice(2, 7)}`,
        exerciseId: catalogExerciseId || getCatalogExerciseId(found),
        customExerciseId: customExerciseId || getCustomExerciseId(found),
        source:
          customExerciseId || getCustomExerciseId(found) ? "custom" : "catalog",
        isCustom: Boolean(customExerciseId || getCustomExerciseId(found)),
        name: get(ex, "name"),
        emoji: get(found, "emoji", "🏋️"),
        trackingType,
        group: get(found, "category", ""),
        groupLabel: get(found, "category", ""),
        defaultSets: get(found, "defaultSets") || get(ex, "defaultSets") || size(sets) || 1,
        defaultReps: get(found, "defaultReps", get(ex, "defaultReps", null)),
        defaultDurationSeconds: get(found, "defaultDurationSeconds", get(ex, "defaultDurationSeconds", null)),
        defaultDistanceMeters: get(found, "defaultDistanceMeters", get(ex, "defaultDistanceMeters", null)),
        imageUrl: get(ex, "imageUrl", get(found, "imageUrl", null)),
        youtubeUrl: get(ex, "youtubeUrl", get(found, "youtubeUrl", null)),
        equipment: get(ex, "equipment", get(found, "equipment", null)),
        targetMuscles: get(ex, "targetMuscles", get(found, "targetMuscles", [])),
        bodyParts: get(ex, "bodyParts", get(found, "bodyParts", [])),
        equipments: get(ex, "equipments", get(found, "equipments", [])),
        secondaryMuscles: get(ex, "secondaryMuscles", get(found, "secondaryMuscles", [])),
        instructions: get(ex, "instructions", get(found, "instructions", [])),
        equipmentImages: get(ex, "equipmentImages", get(found, "equipmentImages", [])),
        sets,
        rest: get(ex, "rest") || get(found, "defaultRest") || get(found, "defaultRestSeconds") || 60,
        unit: get(found, "unit", null),
      };
    });
  });

  return { days, exercises };
};

export const buildSavePlan = ({ planSource, planName, planDescription, trainDays, exercisesByDay }) => {
  const activeDays = filter(trainDays, (day) => {
    const dayExercises = get(exercisesByDay, [get(day, "id")], []);
    return size(dayExercises) > 0 || Boolean(trim(get(day, "focus")));
  });

  return {
    id: get(planSource, "id") || `custom-${Date.now()}`,
    name: trim(planName),
    description: trim(planDescription) || "Maxsus reja",
    daysPerWeek:
      size(activeDays) ||
      get(planSource, "daysPerWeek") ||
      Math.min(size(trainDays), 7),
    days: get(planSource, "days", 28),
    schedule: map(trainDays, (day, dayIndex) => ({
      day: get(day, "name"),
      dayKey: get(day, "dayKey") || `day-${dayIndex + 1}`,
      orderIndex: dayIndex,
      focus: get(day, "focus"),
      exercises: map(get(exercisesByDay, [get(day, "id")], []), (ex, exerciseIndex) => ({
        exerciseId: getCatalogExerciseId(ex),
        customExerciseId: getCustomExerciseId(ex),
        source: getCustomExerciseId(ex) ? "custom" : "catalog",
        isCustom: Boolean(getCustomExerciseId(ex)),
        orderIndex: exerciseIndex,
        name: get(ex, "name"),
        trackingType: get(ex, "trackingType"),
        defaultSets: get(ex, "defaultSets"),
        defaultReps: get(ex, "defaultReps"),
        defaultDurationSeconds: get(ex, "defaultDurationSeconds"),
        defaultDistanceMeters: get(ex, "defaultDistanceMeters"),
        defaultRestSeconds: get(ex, "defaultRestSeconds") || get(ex, "rest") || 60,
        sets: get(ex, "sets"),
        rest: get(ex, "rest"),
        imageUrl: get(ex, "imageUrl", null),
        youtubeUrl: get(ex, "youtubeUrl", null),
        equipment: get(ex, "equipment", null),
        targetMuscles: get(ex, "targetMuscles", []),
        bodyParts: get(ex, "bodyParts", []),
        equipments: get(ex, "equipments", []),
        secondaryMuscles: get(ex, "secondaryMuscles", []),
        instructions: get(ex, "instructions", []),
        equipmentImages: get(ex, "equipmentImages", []),
      })),
    })),
  };
};

export const filterExercises = (libraryExercises, search, selectedGroup) => {
  const q = toLower(trim(search));
  return filter(libraryExercises, (ex) => {
    const matchGroup = selectedGroup === "all" || get(ex, "category") === selectedGroup;
    if (!matchGroup) return false;
    if (!q) return true;
    return (
      includes(toLower(get(ex, "name", "")), q) ||
      includes(toLower(get(ex, "category", "")), q)
    );
  });
};

export const getCategories = (libraryExercises) => {
  const cats = new Set(
    filter(map(libraryExercises, (ex) => get(ex, "category")), Boolean),
  );
  return ["all", ...Array.from(cats)];
};
