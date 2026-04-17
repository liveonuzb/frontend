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

export const buildExerciseItem = (exercise) => ({
  id: `ex-${uid()}`,
  exerciseId: get(exercise, "id"),
  name: get(exercise, "name"),
  emoji: get(exercise, "emoji", "🏋️"),
  group: get(exercise, "category", "General"),
  groupLabel: get(exercise, "category", "General"),
  trackingType: normalizeWorkoutTrackingType(get(exercise, "trackingType")),
  defaultSets: get(exercise, "defaultSets", 3),
  defaultReps: get(exercise, "defaultReps", null),
  defaultDurationSeconds: get(exercise, "defaultDurationSeconds", null),
  defaultDistanceMeters: get(exercise, "defaultDistanceMeters", null),
  sets: Array.from(
    { length: get(exercise, "defaultSets", 3) },
    () => createWorkoutSetTemplate(exercise),
  ),
  rest: get(exercise, "defaultRest") || get(exercise, "defaultRestSeconds") || 60,
  unit: get(exercise, "unit", null),
});

export const buildWeekDaySkeleton = () =>
  map(WEEK_DAYS, (dayName, index) => ({
    id: `day-${index}-${uid()}`,
    name: dayName,
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
    name: get(s, "day"),
    focus: get(s, "focus", ""),
  }));

  const exercises = {};
  map(days, (day, i) => {
    const scheduleDay = get(sourceSchedule, [i]);
    const dayExercises = get(scheduleDay, "exercises", []);

    exercises[day.id] = map(dayExercises, (ex) => {
      const found = find(library, (e) =>
        toLower(get(e, "name")) === toLower(get(ex, "name")),
      );

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
        const setCount = parseInt(get(ex, "sets")) || get(found, "defaultSets", 3);
        sets = Array.from({ length: setCount }, () =>
          createWorkoutSetTemplate(
            { ...found, ...ex, trackingType },
            ex,
          ),
        );
      }

      return {
        id: `ex-${i}-${Math.random().toString(36).slice(2, 7)}`,
        exerciseId: get(found, "id", null),
        name: get(ex, "name"),
        emoji: get(found, "emoji", "🏋️"),
        trackingType,
        group: get(found, "category", ""),
        groupLabel: get(found, "category", ""),
        defaultSets: get(found, "defaultSets") || get(ex, "defaultSets") || size(sets) || 1,
        defaultReps: get(found, "defaultReps", get(ex, "defaultReps", null)),
        defaultDurationSeconds: get(found, "defaultDurationSeconds", get(ex, "defaultDurationSeconds", null)),
        defaultDistanceMeters: get(found, "defaultDistanceMeters", get(ex, "defaultDistanceMeters", null)),
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
    schedule: map(trainDays, (day) => ({
      day: get(day, "name"),
      focus: get(day, "focus"),
      exercises: map(get(exercisesByDay, [get(day, "id")], []), (ex) => ({
        name: get(ex, "name"),
        trackingType: get(ex, "trackingType"),
        defaultSets: get(ex, "defaultSets"),
        defaultReps: get(ex, "defaultReps"),
        defaultDurationSeconds: get(ex, "defaultDurationSeconds"),
        defaultDistanceMeters: get(ex, "defaultDistanceMeters"),
        sets: get(ex, "sets"),
        rest: get(ex, "rest"),
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
