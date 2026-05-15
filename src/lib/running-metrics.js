export const formatRunningDistance = (meters = 0) => {
  const numericMeters = Number(meters) || 0;
  if (numericMeters < 1000) {
    return `${Math.round(numericMeters)} m`;
  }

  return `${(numericMeters / 1000).toFixed(1)} km`;
};

export const formatRunningDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  const parts =
    hours > 0
      ? [hours, minutes, remainingSeconds]
      : [minutes, remainingSeconds];

  return parts.map((part) => String(part).padStart(2, "0")).join(":");
};

export const formatRunningClockDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);

  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
};

export const formatRunningPace = (secondsPerKm) => {
  const pace = Number(secondsPerKm);
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

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const isValidCoordinate = (point) => {
  const latitude = Number(point?.latitude);
  const longitude = Number(point?.longitude);

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
  const leftTime = Date.parse(left?.sourceTimestamp ?? "");
  const rightTime = Date.parse(right?.sourceTimestamp ?? "");

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    const timeDiff = leftTime - rightTime;
    if (timeDiff !== 0) {
      return timeDiff;
    }
  }

  return (Number(left?.sequence) || 0) - (Number(right?.sequence) || 0);
};

export const calculatePointDistanceMeters = (fromPoint, toPoint) => {
  if (!isValidCoordinate(fromPoint) || !isValidCoordinate(toPoint)) {
    return 0;
  }

  const fromLatitude = toRadians(Number(fromPoint.latitude));
  const toLatitude = toRadians(Number(toPoint.latitude));
  const deltaLatitude = toRadians(
    Number(toPoint.latitude) - Number(fromPoint.latitude),
  );
  const deltaLongitude = toRadians(
    Number(toPoint.longitude) - Number(fromPoint.longitude),
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

export const calculateRunningDistanceMeters = (points = []) => {
  const orderedPoints = points
    .filter(isValidCoordinate)
    .slice()
    .sort(compareRunningPoints);

  return orderedPoints.reduce((total, point, index) => {
    if (index === 0) {
      return total;
    }

    return total + calculatePointDistanceMeters(orderedPoints[index - 1], point);
  }, 0);
};

export const calculateLiveRunningMetrics = ({
  baseMetrics = {},
  elapsedSeconds = 0,
  points = [],
} = {}) => {
  const baseDistanceMeters = Number(baseMetrics.distanceMeters ?? 0) || 0;
  const liveDistanceMeters = calculateRunningDistanceMeters(points);
  const distanceMeters = baseDistanceMeters + liveDistanceMeters;
  const durationSeconds = Math.max(
    Number(baseMetrics.durationSeconds ?? 0) || 0,
    Number(elapsedSeconds) || 0,
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
