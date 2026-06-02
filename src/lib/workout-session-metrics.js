import get from "lodash/get";
import toNumber from "lodash/toNumber";

export const isOutdoorRunningSession = (session) =>
  get(session, "activityType") === "OUTDOOR_RUN" ||
  Boolean(get(session, "runningSessionId")) ||
  get(session, "source") === "running";

export const getWorkoutSessionDistanceMeters = (session) =>
  toNumber(get(
    session,
    "distanceMeters",
    get(
      session,
      "metrics.distanceMeters",
      get(session, "exerciseSummaries[0].distanceMeters", 0),
    ),
  )) || 0;

export const getWorkoutSessionPaceSecondsPerKm = (session) => {
  const explicitPace = get(
    session,
    "averagePaceSecondsPerKm",
    get(
      session,
      "metrics.averagePaceSecondsPerKm",
      get(session, "exerciseSummaries[0].averagePaceSecondsPerKm", null),
    ),
  );

  const numericPace = toNumber(explicitPace);
  if (Number.isFinite(numericPace) && numericPace > 0) {
    return numericPace;
  }

  const distanceKm = getWorkoutSessionDistanceMeters(session) / 1000;
  const durationSeconds = toNumber(get(session, "durationSeconds", 0)) || 0;
  if (distanceKm <= 0 || durationSeconds <= 0) {
    return null;
  }

  return durationSeconds / distanceKm;
};
