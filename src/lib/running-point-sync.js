export const RUNNING_POINT_QUEUE_MAX_SIZE = 600;
export const RUNNING_POINT_BATCH_MAX_SIZE = 24;
export const RUNNING_POINT_SYNC_INTERVAL_MS = 5000;
export const RUNNING_POINT_SYNC_MAX_BACKOFF_MS = 30000;

const toFiniteNumber = (value) => {
  const number = Number(value);
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

  return [...bySequence.values()].sort(
    (left, right) => left.sequence - right.sequence,
  );
};

export const trimRunningPointQueue = (points = []) => {
  const uniquePoints = dedupeRunningPoints(points);

  if (uniquePoints.length <= RUNNING_POINT_QUEUE_MAX_SIZE) {
    return uniquePoints;
  }

  return uniquePoints.slice(uniquePoints.length - RUNNING_POINT_QUEUE_MAX_SIZE);
};

export const buildRunningPointBatch = (points = []) =>
  dedupeRunningPoints(points).slice(0, RUNNING_POINT_BATCH_MAX_SIZE);

export const parseRetryAfterMs = (headers = {}) => {
  const value =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["retry-after-short"] ??
    headers["Retry-After-Short"];
  const seconds = Number(value);

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

  const exponent = Math.max(0, Number(failureCount) - 1);
  const computed = 1000 * 2 ** exponent;

  return Math.min(computed, RUNNING_POINT_SYNC_MAX_BACKOFF_MS);
};
