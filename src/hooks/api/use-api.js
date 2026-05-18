import axios from "axios";
import useAuthStore from "@/store/auth-store";
import useLanguageStore from "@/store/language-store";
import { config } from "@/config.js";
import { normalizeApiPath } from "./normalize-api-path.js";

import { some, includes } from "lodash";

let refreshPromise = null;

const AUTH_RETRY_BYPASS_PATHS = [
  "/auth/refresh",
  "/auth/login",
  "/auth/verify-otp",
  "/auth/resend-otp",
];

export const shouldSkipAuthRetry = (url) => {
  const path = String(url || "");
  return some(AUTH_RETRY_BYPASS_PATHS, (authPath) => includes(path, authPath));
};

/* ================= AXIOS INSTANCE ================= */
const api = axios.create({
  baseURL: config.baseURL,
  withCredentials: true,
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    const { currentLanguage } = useLanguageStore.getState();

    config.url = normalizeApiPath(config.url);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (currentLanguage) {
      config.headers = config.headers || {};
      config.headers["Accept-Language"] = currentLanguage;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !shouldSkipAuthRetry(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (!newToken) {
          forceLogout();
          return Promise.reject(error);
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (err) {
        forceLogout();
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

async function refreshAccessToken() {
  const { completeAuthentication, logout, refreshToken } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = api
      .post(
        "/auth/refresh",
        { refreshToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .then((res) => {
        const accessToken = res.data?.accessToken;

        if (accessToken) {
          completeAuthentication({
            ...res.data,
            refreshToken: res.data?.refreshToken || refreshToken,
          });
        }

        return accessToken ?? null;
      })
      .catch((err) => {
        logout();
        throw err;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function forceLogout() {
  const { logout } = useAuthStore.getState();
  logout();
  window.location.href = "/auth/sign-in";
}

const useApi = () => ({
  request: api,
});

export { api };
export default useApi;
