import trim from "lodash/trim";
const fallbackBaseURL = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
  : "/api/v1";

const runtimeConfig = window.__APP_CONFIG__ ?? {};

const runtimeBaseURL =
  typeof runtimeConfig.VITE_API_BASE_URL === "string"
    ? trim(runtimeConfig.VITE_API_BASE_URL)
    : "";

const runtimeMapStyleUrl =
  typeof runtimeConfig.VITE_MAP_STYLE_URL === "string"
    ? trim(runtimeConfig.VITE_MAP_STYLE_URL)
    : "";

const runtimeMapStyleUrlLight =
  typeof runtimeConfig.VITE_MAP_STYLE_URL_LIGHT === "string"
    ? trim(runtimeConfig.VITE_MAP_STYLE_URL_LIGHT)
    : "";

const runtimeMapStyleUrlDark =
  typeof runtimeConfig.VITE_MAP_STYLE_URL_DARK === "string"
    ? trim(runtimeConfig.VITE_MAP_STYLE_URL_DARK)
    : "";

const runtimeRunningFeatureEnabled =
  typeof runtimeConfig.VITE_RUNNING_FEATURE_ENABLED === "string"
    ? trim(runtimeConfig.VITE_RUNNING_FEATURE_ENABLED)
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
  mapStyleUrl:
    runtimeMapStyleUrl ||
    import.meta.env.VITE_MAP_STYLE_URL ||
    "https://tiles.openfreemap.org/styles/dark",
  mapStyleUrls: {
    light:
      runtimeMapStyleUrlLight ||
      import.meta.env.VITE_MAP_STYLE_URL_LIGHT ||
      runtimeMapStyleUrl ||
      import.meta.env.VITE_MAP_STYLE_URL ||
      "https://tiles.openfreemap.org/styles/bright",
    dark:
      runtimeMapStyleUrlDark ||
      import.meta.env.VITE_MAP_STYLE_URL_DARK ||
      runtimeMapStyleUrl ||
      import.meta.env.VITE_MAP_STYLE_URL ||
      "https://tiles.openfreemap.org/styles/dark",
  },
  runningFeatureEnabled: resolveBooleanFlag(
    runtimeRunningFeatureEnabled ||
      import.meta.env.VITE_RUNNING_FEATURE_ENABLED,
    true,
  ),
};
