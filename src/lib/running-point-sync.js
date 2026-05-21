import { orderBy, toNumber, slice, take } from "lodash";
export const RUNNING_POINT_QUEUE_MAX_SIZE = 3000;
export const RUNNING_POINT_BATCH_MAX_SIZE = 24;
export const RUNNING_POINT_SYNC_INTERVAL_MS = 5000;
export const RUNNING_POINT_SYNC_MAX_BACKOFF_MS = 30000;

const toFiniteNumber = (value) => {
  const number = toNumber(value);
  return Number.isFinite(number) ? number : null;
};

export const normalizeRunningPoint = (point) => {
  const sequence = toFiniteNumber(point?.sequence);
  const latitude = toFiniteNumber(point?.latitude);
  const longitude = toFiniteNumber(point?.longitude);

  if (!sequence || sequence <= 0 || latitude === null || longitude === null) {
    return null;
  }

  return {
    ...point,
    sequence,
    latitude,
    longitude,
    segmentIndex: toFiniteNumber(point?.segmentIndex) ?? 0,
  };
};

export const dedupeRunningPoints = (points = []) => {
  const bySequence = new Map();

  for (const rawPoint of points) {
    const point = normalizeRunningPoint(rawPoint);

    if (!point) {
      continue;
    }

    bySequence.set(point.sequence, point);
  }

  return orderBy(Array.from(bySequence.values()), ["sequence"], ["asc"]);
};

export const trimRunningPointQueue = (points = []) => {
  const uniquePoints = dedupeRunningPoints(points);

  if (uniquePoints.length <= RUNNING_POINT_QUEUE_MAX_SIZE) {
    return uniquePoints;
  }

  return slice(uniquePoints, uniquePoints.length - RUNNING_POINT_QUEUE_MAX_SIZE);
};

export const buildRunningPointBatch = (points = []) =>
  take(dedupeRunningPoints(points), RUNNING_POINT_BATCH_MAX_SIZE);

export const parseRetryAfterMs = (headers = {}) => {
  const value =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["retry-after-short"] ??
    headers["Retry-After-Short"];
  const seconds = toNumber(value);

  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
};

export const computeRunningSyncBackoffMs = ({
  failureCount = 0,
  headers = {},
} = {}) => {
  const retryAfterMs = parseRetryAfterMs(headers);

  if (retryAfterMs !== null) {
    return Math.min(retryAfterMs, RUNNING_POINT_SYNC_MAX_BACKOFF_MS);
  }

  const exponent = Math.max(0, toNumber(failureCount) - 1);
  const computed = 1000 * 2 ** exponent;

  return Math.min(computed, RUNNING_POINT_SYNC_MAX_BACKOFF_MS);
};
