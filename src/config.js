const fallbackBaseURL = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
  : "/api/v1";

const runtimeConfig = window.__APP_CONFIG__ ?? {};

const runtimeBaseURL =
  typeof runtimeConfig.VITE_API_BASE_URL === "string"
    ? runtimeConfig.VITE_API_BASE_URL.trim()
    : "";

export const config = {
  baseURL: runtimeBaseURL || import.meta.env.VITE_API_BASE_URL || fallbackBaseURL,
};
