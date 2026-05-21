export const RUNNING_GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15000,
};

export const RUNNING_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 5000,
  timeout: 15000,
};

export const RUNNING_LOCATION_ERROR = {
  permission: "permission",
  unavailable: "unavailable",
  timeout: "timeout",
  weak: "weak",
};

export const RUNNING_LOCATION_MAX_ACCURACY_METERS = 75;

export const getRunningLocationErrorStatus = (error) => {
  if (error?.code === RUNNING_LOCATION_ERROR.weak || error?.code === "weak") {
    return RUNNING_LOCATION_ERROR.weak;
  }

  if (error?.code === 1) {
    return RUNNING_LOCATION_ERROR.permission;
  }

  if (error?.code === 3) {
    return RUNNING_LOCATION_ERROR.timeout;
  }

  return RUNNING_LOCATION_ERROR.unavailable;
};

export const isUsableRunningPosition = (position) => {
  const accuracy = Number(position?.coords?.accuracy);

  return (
    !Number.isFinite(accuracy) ||
    accuracy <= RUNNING_LOCATION_MAX_ACCURACY_METERS
  );
};

export const requestFirstRunningPosition = ({
  geolocation = typeof navigator !== "undefined" ? navigator.geolocation : null,
  options = RUNNING_GEOLOCATION_OPTIONS,
} = {}) =>
  new Promise((resolve, reject) => {
    if (typeof geolocation?.getCurrentPosition !== "function") {
      reject({ code: 2, message: "Geolocation is unavailable" });
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        if (!isUsableRunningPosition(position)) {
          reject({
            code: RUNNING_LOCATION_ERROR.weak,
            accuracy: position.coords.accuracy,
          });
          return;
        }

        resolve(position);
      },
      reject,
      options,
    );
  });

export const buildRunningPointFromPosition = (
  position,
  { sequence, segmentIndex = 0 } = {},
) => ({
  sequence,
  segmentIndex,
  latitude: position.coords.latitude,
  longitude: position.coords.longitude,
  altitude: position.coords.altitude ?? undefined,
  accuracy: position.coords.accuracy ?? undefined,
  speed: position.coords.speed ?? undefined,
  heading: position.coords.heading ?? undefined,
  sourceTimestamp: new Date(position.timestamp).toISOString(),
});
