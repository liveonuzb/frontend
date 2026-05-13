const fallbackBaseURL = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
  : "/api/v1";

const runtimeConfig = window.__APP_CONFIG__ ?? {};

const runtimeBaseURL =
  typeof runtimeConfig.VITE_API_BASE_URL === "string"
    ? runtimeConfig.VITE_API_BASE_URL.trim()
    : "";

const runtimeYandexMapsApiKey =
  typeof runtimeConfig.VITE_YANDEX_MAPS_API_KEY === "string"
    ? runtimeConfig.VITE_YANDEX_MAPS_API_KEY.trim()
    : "";

const runtimeRunningFeatureEnabled =
  typeof runtimeConfig.VITE_RUNNING_FEATURE_ENABLED === "string"
    ? runtimeConfig.VITE_RUNNING_FEATURE_ENABLED.trim()
    : "";

const resolveBooleanFlag = (value, fallback = true) => {
  if (value === "false" || value === "0") {
    return false;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  return fallback;
};

export const config = {
  baseURL:
    runtimeBaseURL || import.meta.env.VITE_API_BASE_URL || fallbackBaseURL,
  yandexMapsApiKey:
    runtimeYandexMapsApiKey || import.meta.env.VITE_YANDEX_MAPS_API_KEY || "",
  runningFeatureEnabled: resolveBooleanFlag(
    runtimeRunningFeatureEnabled || import.meta.env.VITE_RUNNING_FEATURE_ENABLED,
    true,
  ),
};
