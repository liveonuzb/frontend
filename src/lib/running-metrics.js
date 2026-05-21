import { filter, map, reduce, toNumber, slice } from "lodash";
export const formatRunningDistance = (meters = 0) => {
  const numericMeters = toNumber(meters) || 0;
  if (numericMeters < 1000) {
    return `${Math.round(numericMeters)} m`;
  }

  return `${(numericMeters / 1000).toFixed(1)} km`;
};

export const formatRunningDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, toNumber(seconds) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  const parts =
    hours > 0
      ? [hours, minutes, remainingSeconds]
      : [minutes, remainingSeconds];

  return map(parts, (part) => String(part).padStart(2, "0")).join(":");
};

export const formatRunningClockDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, toNumber(seconds) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  return map(
    [hours, minutes, remainingSeconds],
    (part) => String(part).padStart(2, "0"),
  )
    .join(":");
};

export const formatRunningPace = (secondsPerKm) => {
  const pace = toNumber(secondsPerKm);
  if (!Number.isFinite(pace) || pace <= 0) {
    return "--";
  }

  const minutes = Math.floor(pace / 60);
  const seconds = Math.round(pace % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
};

export const calculateLiveRunningDuration = (startedAt) => {
  const started = new Date(startedAt);
  if (Number.isNaN(started.getTime())) {
    return 0;
  }

  return Math.max(0, Math.round((Date.now() - started.getTime()) / 1000));
};

const EARTH_RADIUS_METERS = 6371000;
const LOW_ACCURACY_THRESHOLD_METERS = 75;
const IMPOSSIBLE_SPEED_THRESHOLD_MPS = 12;
const NEAR_DUPLICATE_DISTANCE_METERS = 3;
const NEAR_DUPLICATE_WINDOW_SECONDS = 15;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const isValidCoordinate = (point) => {
  const latitude = toNumber(point?.latitude);
  const longitude = toNumber(point?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
};

const compareRunningPoints = (left, right) => {
  const sequenceDiff =
    (toNumber(left?.sequence) || 0) - (toNumber(right?.sequence) || 0);
  if (sequenceDiff !== 0) {
    return sequenceDiff;
  }

  const leftTime = Date.parse(left?.sourceTimestamp ?? left?.timestamp ?? "");
  const rightTime = Date.parse(right?.sourceTimestamp ?? right?.timestamp ?? "");

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    const timeDiff = leftTime - rightTime;
    if (timeDiff !== 0) {
      return timeDiff;
    }
  }

  return 0;
};

const getPointTimestampMs = (point) => {
  const timestamp = Date.parse(point?.sourceTimestamp ?? point?.timestamp ?? "");
  return Number.isFinite(timestamp) ? timestamp : null;
};

const getPointSegmentIndex = (point) => toNumber(point?.segmentIndex ?? 0) || 0;

const isSameSegment = (left, right) =>
  getPointSegmentIndex(left) === getPointSegmentIndex(right);

const getElapsedSecondsBetweenPoints = (fromPoint, toPoint) => {
  const fromTime = getPointTimestampMs(fromPoint);
  const toTime = getPointTimestampMs(toPoint);

  if (fromTime === null || toTime === null) {
    return null;
  }

  return Math.max(0, (toTime - fromTime) / 1000);
};

export const calculatePointDistanceMeters = (fromPoint, toPoint) => {
  if (!isValidCoordinate(fromPoint) || !isValidCoordinate(toPoint)) {
    return 0;
  }

  const fromLatitude = toRadians(toNumber(fromPoint.latitude));
  const toLatitude = toRadians(toNumber(toPoint.latitude));
  const deltaLatitude = toRadians(
    toNumber(toPoint.latitude) - toNumber(fromPoint.latitude),
  );
  const deltaLongitude = toRadians(
    toNumber(toPoint.longitude) - toNumber(fromPoint.longitude),
  );
  const haversine =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(deltaLongitude / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
};

export const filterRunningRoutePoints = (points = []) => {
  const orderedPoints = slice(filter(points, isValidCoordinate)).sort(
    compareRunningPoints,
  );
  const acceptedPoints = [];
  const rejectedPoints = [];

  for (const point of orderedPoints) {
    const accuracy = toNumber(point?.accuracy);
    if (Number.isFinite(accuracy) && accuracy > LOW_ACCURACY_THRESHOLD_METERS) {
      rejectedPoints.push({ ...point, isFilteredOut: true, rejectionReason: "low_accuracy" });
      continue;
    }

    const previousPoint = acceptedPoints.at(-1);
    if (previousPoint && isSameSegment(previousPoint, point)) {
      const distanceMeters = calculatePointDistanceMeters(previousPoint, point);
      const elapsedSeconds = getElapsedSecondsBetweenPoints(previousPoint, point);

      if (
        elapsedSeconds !== null &&
        elapsedSeconds <= NEAR_DUPLICATE_WINDOW_SECONDS &&
        distanceMeters < NEAR_DUPLICATE_DISTANCE_METERS
      ) {
        rejectedPoints.push({ ...point, isFilteredOut: true, rejectionReason: "near_duplicate" });
        continue;
      }

      if (
        elapsedSeconds !== null &&
        elapsedSeconds > 0 &&
        distanceMeters / elapsedSeconds > IMPOSSIBLE_SPEED_THRESHOLD_MPS
      ) {
        rejectedPoints.push({ ...point, isFilteredOut: true, rejectionReason: "impossible_jump" });
        continue;
      }
    }

    acceptedPoints.push({ ...point, isFilteredOut: false });
  }

  return {
    acceptedPoints,
    rejectedPoints,
    filteredPointCount: rejectedPoints.length,
  };
};

export const getAcceptedRunningRoutePoints = (points = []) =>
  filterRunningRoutePoints(points).acceptedPoints;

export const calculateRunningDistanceMeters = (points = []) => {
  const orderedPoints = getAcceptedRunningRoutePoints(points);

  return reduce(orderedPoints, (total, point, index) => {
    if (index === 0) {
      return total;
    }

    const previousPoint = orderedPoints[index - 1];
    if (!isSameSegment(previousPoint, point)) {
      return total;
    }

    return total + calculatePointDistanceMeters(previousPoint, point);
  }, 0);
};

export const calculateLiveRunningMetrics = ({
  baseMetrics = {},
  elapsedSeconds = 0,
  points = [],
} = {}) => {
  const baseDistanceMeters = toNumber(baseMetrics.distanceMeters ?? 0) || 0;
  const liveDistanceMeters = calculateRunningDistanceMeters(points);
  const distanceMeters = baseDistanceMeters + liveDistanceMeters;
  const durationSeconds = Math.max(
    toNumber(baseMetrics.durationSeconds ?? 0) || 0,
    toNumber(elapsedSeconds) || 0,
  );

  return {
    ...baseMetrics,
    distanceMeters,
    durationSeconds,
    averagePaceSecondsPerKm:
      distanceMeters > 0 && durationSeconds > 0
        ? durationSeconds / (distanceMeters / 1000)
        : baseMetrics.averagePaceSecondsPerKm,
  };
};
