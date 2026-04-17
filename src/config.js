const fallbackBaseURL = import.meta.env.DEV
  ? "http://localhost:3000/api/v1"
  : "/api/v1";

export const config = {
  baseURL: import.meta.env.VITE_API_BASE_URL || fallbackBaseURL,
};
