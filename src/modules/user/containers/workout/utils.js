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

export const normalizePlanDayProgress = (dayProgress = [], schedule = []) => {
  const normalizedSchedule = isArray(schedule) ? schedule : [];

  return normalizedSchedule.map((day, dayIndex) => {
    const matched = find(dayProgress, (item) => Number(item?.dayIndex) === dayIndex);
    const exerciseCount = isArray(get(day, "exercises")) ? get(day, "exercises.length") : 0;

    return {
      dayIndex,
      completed: Boolean(get(matched, "completed")),
      completedAt: get(matched, "completedAt", null),
      exerciseCount: Number(get(matched, "exerciseCount") ?? exerciseCount) || exerciseCount,
    };
  });
};

export const getFirstWorkoutDayIndex = (schedule = []) =>
  isArray(schedule)
    ? schedule.findIndex((day) => isArray(get(day, "exercises")) && get(day, "exercises.length") > 0)
    : -1;

export const isWorkoutDayLocked = (plan, dayIndex) => {
  if (!plan || dayIndex <= 0) {
    return false;
  }

  const dayProgress = normalizePlanDayProgress(get(plan, "dayProgress", []), get(plan, "schedule", []));

  for (let index = 0; index < dayIndex; index += 1) {
    const previousDay = dayProgress[index];
    if (previousDay && previousDay.exerciseCount > 0 && !previousDay.completed) {
      return true;
    }
  }

  return false;
};

export const getNextStartableDayIndex = (plan) => {
  const schedule = isArray(get(plan, "schedule")) ? get(plan, "schedule") : [];
  const firstWorkoutDayIndex = getFirstWorkoutDayIndex(schedule);

  if (firstWorkoutDayIndex < 0) {
    return 0;
  }

  for (let dayIndex = firstWorkoutDayIndex; dayIndex < schedule.length; dayIndex += 1) {
    const exerciseCount = isArray(get(schedule[dayIndex], "exercises"))
      ? get(schedule[dayIndex], "exercises.length")
      : 0;

    if (exerciseCount === 0) {
      continue;
    }

    if (!isWorkoutDayLocked(plan, dayIndex)) {
      return dayIndex;
    }
  }

  return firstWorkoutDayIndex;
};
