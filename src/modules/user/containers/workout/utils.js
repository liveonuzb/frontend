import { find, map, filter, values, get, isArray, max } from "lodash";
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
      values(value),
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
  const planDaysPerWeek =
    Number(get(plan, "daysPerWeek") ?? 0) ||
    countScheduleDays(get(plan, "schedule"));
  const totalDays = Number(get(plan, "days") ?? 28) || 28;

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
    Number(plan.daysPerWeek ?? 0) || countScheduleDays(plan.schedule);
  const completedWorkouts = max([0, Number(plan.completedWorkouts ?? 0) || 0]);

  const progress = plan.progress
    ? max([0, Math.min(100, Math.round(Number(plan.progress)))])
    : (() => {
        const targetWorkoutCount = getTargetWorkoutCount(plan);
        return targetWorkoutCount > 0
          ? Math.max(
              0,
              Math.min(
                100,
                Math.round(
                  (completedWorkouts /
                    max([
                      1,
                      (plan.daysPerWeek || 3) *
                        Math.ceil((plan.days || 28) / 7),
                    ])) *
                    100,
                ),
              ),
            )
          : 0;
      })();

  return {
    ...plan,
    completedWorkouts,
    progress,
    daysPerWeek: normalizedDaysPerWeek,
  };
};
