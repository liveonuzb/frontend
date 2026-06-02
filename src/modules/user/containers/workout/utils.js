import find from "lodash/find";
import map from "lodash/map";
import filter from "lodash/filter";
import lodashValues from "lodash/values";
import get from "lodash/get";
import isArray from "lodash/isArray";
import max from "lodash/max";
import toNumber from "lodash/toNumber";
import {
  getWorkoutDefaultSetCount,
  getWorkoutExerciseSummary,
  getWorkoutRestSeconds,
  getWorkoutTrackingFields,
  normalizeWorkoutSets,
} from "@/lib/workout-tracking";

const formatPrimitive = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    const firstValue = find(
      lodashValues(value),
      (item) => item !== undefined && item !== null && item !== "",
    );
    return firstValue !== undefined ? String(firstValue) : "";
  }

  return "";
};

export const getExerciseRestSeconds = (exercise) =>
  getWorkoutRestSeconds(exercise);

export const normalizeExerciseSets = (exercise) =>
  map(normalizeWorkoutSets(exercise), (set) => ({
    reps: formatPrimitive(set.reps),
    weight: formatPrimitive(set.weight),
    durationSeconds: formatPrimitive(set.durationSeconds),
    distanceMeters: formatPrimitive(set.distanceMeters),
    done: Boolean(set.done),
  }));

export const getExerciseSetCount = (exercise) =>
  getWorkoutDefaultSetCount(exercise);

export const getExerciseRepLabel = (exercise) => {
  const repsField = find(
    getWorkoutTrackingFields(get(exercise, "trackingType")),
    (field) => field.key === "reps",
  );

  if (!repsField) {
    return "—";
  }

  const sets = normalizeWorkoutSets(exercise);
  const uniqueReps = Array.from(
    new Set(
      filter(
        map(sets, (set) => formatPrimitive(get(set, "reps"))),
        Boolean,
      ),
    ),
  );

  if (uniqueReps.length === 1) {
    return uniqueReps[0];
  }

  if (uniqueReps.length > 1) {
    return uniqueReps.join(" / ");
  }

  return "—";
};

export const getExerciseDisplaySummary = (exercise) =>
  getWorkoutExerciseSummary(exercise);

const countScheduleDays = (schedule = []) =>
  isArray(schedule)
    ? filter(
        schedule,
        (day) =>
          isArray(get(day, "exercises")) && get(day, "exercises.length") > 0,
      ).length
    : 0;

const getTargetWorkoutCount = (plan) => {
  const explicitTarget = toNumber(get(plan, "targetWorkouts"));
  if (explicitTarget > 0) {
    return explicitTarget;
  }

  const planDaysPerWeek =
    toNumber(get(plan, "daysPerWeek") ?? 0) ||
    countScheduleDays(get(plan, "schedule"));
  const totalDays = toNumber(get(plan, "days") ?? 28) || 28;

  if (planDaysPerWeek > 0) {
    return max([1, Math.ceil((totalDays / 7) * planDaysPerWeek)]);
  }

  return max([1, totalDays]);
};

export const deriveWorkoutPlanMetrics = (plan) => {
  if (!plan) {
    return null;
  }

  const normalizedDaysPerWeek =
    toNumber(plan.daysPerWeek ?? 0) || countScheduleDays(plan.schedule);
  const completedWorkouts = max([0, toNumber(plan.completedWorkouts ?? 0) || 0]);
  const targetWorkouts = getTargetWorkoutCount(plan);

  const progress = plan.progress !== undefined && plan.progress !== null
    ? max([0, Math.min(100, Math.round(toNumber(plan.progress)))])
    : (() => {
        return targetWorkouts > 0
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round((completedWorkouts / max([1, targetWorkouts])) * 100),
              ),
            )
          : 0;
      })();

  return {
    ...plan,
    completedWorkouts,
    targetWorkouts,
    progress,
    daysPerWeek: normalizedDaysPerWeek,
  };
};

export const normalizePlanDayProgress = (dayProgress = [], schedule = []) => {
  const normalizedSchedule = isArray(schedule) ? schedule : [];

  return map(normalizedSchedule, (day, dayIndex) => {
    const matched = find(dayProgress, (item) => toNumber(item?.dayIndex) === dayIndex);
    const exerciseCount = isArray(get(day, "exercises")) ? get(day, "exercises.length") : 0;

    return {
      dayIndex,
      completed: Boolean(get(matched, "completed")),
      completedAt: get(matched, "completedAt", null),
      skipped: Boolean(get(matched, "skipped")),
      skippedAt: get(matched, "skippedAt", null),
      exerciseCount: toNumber(get(matched, "exerciseCount") ?? exerciseCount) || exerciseCount,
    };
  });
};

export const getFirstWorkoutDayIndex = (schedule = []) =>
  isArray(schedule)
    ? schedule.findIndex((day) => isArray(get(day, "exercises")) && get(day, "exercises.length") > 0)
    : -1;

export const isWorkoutDayLocked = (plan, dayIndex) => {
  const schedule = isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];
  if (!Number.isInteger(dayIndex) || dayIndex < 0 || dayIndex >= schedule.length) {
    return false;
  }

  const dayProgress = normalizePlanDayProgress(get(plan, "dayProgress", []), schedule);
  const exerciseCount = isArray(get(schedule[dayIndex], "exercises"))
    ? get(schedule[dayIndex], "exercises.length")
    : 0;

  return (
    exerciseCount > 0 &&
    (Boolean(get(dayProgress[dayIndex], "completed")) ||
      Boolean(get(dayProgress[dayIndex], "skipped")))
  );
};

export const getNextStartableDayIndex = (plan) => {
  const schedule = isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];
  const backendNextDayIndex = toNumber(get(plan, "nextWorkout.dayIndex"));
  if (
    Number.isInteger(backendNextDayIndex) &&
    backendNextDayIndex >= 0 &&
    backendNextDayIndex < schedule.length
  ) {
    return backendNextDayIndex;
  }

  const firstWorkoutDayIndex = getFirstWorkoutDayIndex(schedule);

  if (firstWorkoutDayIndex < 0) {
    return 0;
  }

  const dayProgress = normalizePlanDayProgress(get(plan, "dayProgress", []), schedule);

  for (let dayIndex = firstWorkoutDayIndex; dayIndex < schedule.length; dayIndex += 1) {
    const exerciseCount = isArray(get(schedule[dayIndex], "exercises"))
      ? get(schedule[dayIndex], "exercises.length")
      : 0;

    if (exerciseCount === 0) {
      continue;
    }

    if (
      !get(dayProgress[dayIndex], "completed") &&
      !get(dayProgress[dayIndex], "skipped")
    ) {
      return dayIndex;
    }
  }

  return firstWorkoutDayIndex;
};
