import { includes, some, map, filter, compact, join, take, clamp, times } from "lodash";

export const WORKOUT_TRACKING_TYPES = {
  REPS_WEIGHT: "REPS_WEIGHT",
  REPS_ONLY: "REPS_ONLY",
  DURATION_ONLY: "DURATION_ONLY",
  DISTANCE_ONLY: "DISTANCE_ONLY",
  DURATION_DISTANCE: "DURATION_DISTANCE",
};

export const getWorkoutTrackingOptions = (t) => [
  {
    value: WORKOUT_TRACKING_TYPES.REPS_WEIGHT,
    label: t("components.workoutPlanBuilder.tracking.repsWeight"),
  },
  {
    value: WORKOUT_TRACKING_TYPES.REPS_ONLY,
    label: t("components.workoutPlanBuilder.tracking.repsOnly"),
  },
  {
    value: WORKOUT_TRACKING_TYPES.DURATION_ONLY,
    label: t("components.workoutPlanBuilder.tracking.durationOnly"),
  },
  {
    value: WORKOUT_TRACKING_TYPES.DISTANCE_ONLY,
    label: t("components.workoutPlanBuilder.tracking.distanceOnly"),
  },
  {
    value: WORKOUT_TRACKING_TYPES.DURATION_DISTANCE,
    label: t("components.workoutPlanBuilder.tracking.durationDistance"),
  },
];

export const WORKOUT_TRACKING_OPTIONS = getWorkoutTrackingOptions((key) => {
  const fallbackLabels = {
    "components.workoutPlanBuilder.tracking.repsWeight": "Takror + vazn",
    "components.workoutPlanBuilder.tracking.repsOnly": "Faqat takror",
    "components.workoutPlanBuilder.tracking.durationOnly": "Faqat davomiylik",
    "components.workoutPlanBuilder.tracking.distanceOnly": "Faqat masofa",
    "components.workoutPlanBuilder.tracking.durationDistance":
      "Davomiylik + masofa",
  };

  return fallbackLabels[key] ?? key;
});

const getTrackingFields = (t) => ({
  [WORKOUT_TRACKING_TYPES.REPS_WEIGHT]: [
    { key: "reps", label: t("components.workoutPlanBuilder.tracking.reps"), placeholder: "0", step: 1, min: 0, type: "number" },
    {
      key: "weight",
      label: t("components.workoutPlanBuilder.tracking.weight"),
      placeholder: "0",
      step: 2.5,
      min: 0,
      type: "number"
    },
  ],
  [WORKOUT_TRACKING_TYPES.REPS_ONLY]: [
    { key: "reps", label: t("components.workoutPlanBuilder.tracking.reps"), placeholder: "0", step: 1, min: 0, type: "number" },
  ],
  [WORKOUT_TRACKING_TYPES.DURATION_ONLY]: [
    {
      key: "durationSeconds",
      label: t("components.workoutPlanBuilder.tracking.duration"),
      placeholder: "00:00",
      step: 10,
      min: 0,
      type: "time"
    },
  ],
  [WORKOUT_TRACKING_TYPES.DISTANCE_ONLY]: [
    {
      key: "distanceMeters",
      label: t("components.workoutPlanBuilder.tracking.distance"),
      placeholder: "0",
      step: 50,
      min: 0,
      type: "number"
    },
  ],
  [WORKOUT_TRACKING_TYPES.DURATION_DISTANCE]: [
    {
      key: "durationSeconds",
      label: t("components.workoutPlanBuilder.tracking.duration"),
      placeholder: "00:00",
      step: 10,
      min: 0,
      type: "time"
    },
    {
      key: "distanceMeters",
      label: t("components.workoutPlanBuilder.tracking.distance"),
      placeholder: "0",
      step: 50,
      min: 0,
      type: "number"
    },
  ],
});

const toNumber = (value, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

export const normalizeWorkoutTrackingType = (value) =>
  includes(Object.values(WORKOUT_TRACKING_TYPES), value)
    ? value
    : WORKOUT_TRACKING_TYPES.REPS_WEIGHT;

export const getWorkoutTrackingFields = (trackingType, t) => {
  const fields = getTrackingFields(t || ((key) => key));
  return fields[normalizeWorkoutTrackingType(trackingType)] ??
    fields[WORKOUT_TRACKING_TYPES.REPS_WEIGHT];
};

export const formatWorkoutDurationSeconds = (value, t) => {
  const totalSeconds = clamp(Math.round(toNumber(value)), 0, Infinity);
  const unitSec = t ? t("components.workoutPlanBuilder.units.seconds") : "sek";
  const unitMin = t ? t("components.workoutPlanBuilder.units.minutes") : "daq";
  const unitHr = t ? t("components.workoutPlanBuilder.units.hours") : "soat";

  if (totalSeconds < 60) {
    return `${totalSeconds} ${unitSec}`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours} ${unitHr} ${minutes} ${unitMin}`;
    }
    return `${hours} ${unitHr}`;
  }

  if (seconds > 0 && minutes < 5) {
    return `${minutes} ${unitMin} ${seconds} ${unitSec}`;
  }

  return `${minutes} ${unitMin}`;
};

export const formatWorkoutDistanceMeters = (value, t) => {
  const meters = clamp(Math.round(toNumber(value)), 0, Infinity);
  const unitM = t ? t("components.workoutPlanBuilder.units.meters") : "m";
  const unitKm = t ? t("components.workoutPlanBuilder.units.km") : "km";

  if (meters >= 1000) {
    const kilometers = meters / 1000;
    return `${Number.isInteger(kilometers) ? kilometers : kilometers.toFixed(1)} ${unitKm}`;
  }

  return `${meters} ${unitM}`;
};

export const formatWorkoutMetricValue = (metricKey, value, t) => {
  const safeValue = clamp(toNumber(value), 0, Infinity);
  const unitReps = t ? t("components.workoutPlanBuilder.units.reps") : "takror";
  const unitWeight = t ? t("components.workoutPlanBuilder.units.weight") : "kg";

  switch (metricKey) {
    case "reps":
      return `${safeValue} ${unitReps}`;
    case "weight":
      return `${safeValue} ${unitWeight}`;
    case "durationSeconds":
      return formatWorkoutDurationSeconds(safeValue, t);
    case "distanceMeters":
      return formatWorkoutDistanceMeters(safeValue, t);
    default:
      return `${safeValue}`;
  }
};

export const parseWorkoutDurationSeconds = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;

  const parts = map(value.split(":"), (p) => parseInt(p, 10));
  if (parts.length === 2) {
    const [min, sec] = parts;
    return (toNumber(min) * 60) + toNumber(sec);
  }
  
  return toNumber(value);
};

export const formatDurationInput = (seconds) => {
  const s = toNumber(seconds);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const resolveDefaultMetricValue = (exercise, metricKey) => {
  switch (metricKey) {
    case "reps":
      return toNumber(exercise?.defaultReps ?? exercise?.reps, 10);
    case "weight":
      return toNumber(exercise?.defaultWeight ?? exercise?.weight, 0);
    case "durationSeconds":
      return toNumber(exercise?.defaultDurationSeconds, 0);
    case "distanceMeters":
      return toNumber(exercise?.defaultDistanceMeters, 0);
    default:
      return 0;
  }
};

export const createWorkoutSetTemplate = (exercise = {}, previousSet = null) => {
  const trackingType = normalizeWorkoutTrackingType(exercise?.trackingType);
  const fields = getWorkoutTrackingFields(trackingType);

  return {
    reps: some(fields, (field) => field.key === "reps")
      ? toNumber(previousSet?.reps, resolveDefaultMetricValue(exercise, "reps"))
      : 0,
    weight: some(fields, (field) => field.key === "weight")
      ? toNumber(
          previousSet?.weight,
          resolveDefaultMetricValue(exercise, "weight"),
        )
      : 0,
    durationSeconds: some(fields, (field) => field.key === "durationSeconds")
      ? toNumber(
          previousSet?.durationSeconds,
          resolveDefaultMetricValue(exercise, "durationSeconds"),
        )
      : 0,
    distanceMeters: some(fields, (field) => field.key === "distanceMeters")
      ? toNumber(
          previousSet?.distanceMeters,
          resolveDefaultMetricValue(exercise, "distanceMeters"),
        )
      : 0,
    done: Boolean(previousSet?.done),
  };
};

export const getWorkoutDefaultSetCount = (exercise = {}) =>
  Array.isArray(exercise?.sets) && exercise.sets.length > 0
    ? exercise.sets.length
    : clamp(toNumber(exercise?.defaultSets ?? exercise?.sets, 3), 1, Infinity);

export const getWorkoutRestSeconds = (exercise = {}) =>
  clamp(
    toNumber(exercise?.defaultRestSeconds ?? exercise?.defaultRest ?? exercise?.rest, 60),
    0,
    Infinity,
  );

export const normalizeWorkoutSets = (exercise = {}, rawSets = exercise?.sets) => {
  if (Array.isArray(rawSets) && rawSets.length > 0) {
    return map(rawSets, (set) => createWorkoutSetTemplate(exercise, set));
  }

  return times(getWorkoutDefaultSetCount(exercise), () =>
    createWorkoutSetTemplate(exercise),
  );
};

const summarizeMetricValues = (sets, metricKey, t) => {
  const values = Array.from(
    new Set(
      filter(
        map(sets, (set) => toNumber(set?.[metricKey], 0)),
        (value) => value > 0,
      ),
    ),
  );

  if (!values.length) {
    return null;
  }

  if (values.length === 1) {
    return formatWorkoutMetricValue(metricKey, values[0], t);
  }

  return join(map(take(values, 3), (value) => formatWorkoutMetricValue(metricKey, value, t)), " / ");
};

export const getWorkoutExerciseSummary = (exercise = {}, t) => {
  const trackingType = normalizeWorkoutTrackingType(exercise?.trackingType);
  const sets = normalizeWorkoutSets(exercise);
  const unitSet = t ? t("components.workoutPlanBuilder.units.set") : "set";
  const parts = [`${sets.length} ${unitSet}`];

  getWorkoutTrackingFields(trackingType, t).forEach((field) => {
    const summary = summarizeMetricValues(sets, field.key, t);
    if (summary) {
      parts.push(summary);
    }
  });

  return join(parts, " • ");
};

export const getWorkoutSetSummary = (set = {}, trackingType, t) =>
  compact(
    map(getWorkoutTrackingFields(trackingType, t), (field) => {
      const value = toNumber(set?.[field.key], 0);
      return value > 0 ? formatWorkoutMetricValue(field.key, value, t) : null;
    }),
  );
