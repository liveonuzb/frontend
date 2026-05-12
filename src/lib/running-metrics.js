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
