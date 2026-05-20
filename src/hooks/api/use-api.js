import axios from "axios";
import { toast } from "sonner";
import useAuthStore from "@/store/auth-store";
import useLanguageStore from "@/store/language-store";
import { config } from "@/config.js";
import { queryClient } from "@/providers/query";
import { normalizeApiPath } from "./normalize-api-path.js";

import { get, some, includes } from "lodash";

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
  timeout: 15000,
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

    if (status === 403) {
      handleForbiddenResponse();
    }

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

export async function refreshAccessToken() {
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
        const responseData = get(res, "data.data", {});
        const accessToken = responseData.accessToken;

        if (accessToken) {
          completeAuthentication({
            ...responseData,
            refreshToken: responseData.refreshToken || refreshToken,
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
  queryClient.clear();
  window.location.assign("/auth/sign-in");
}

export function handleForbiddenResponse() {
  toast.error("Bu amal uchun ruxsat yo'q.", {
    id: "global-forbidden",
  });
}

const useApi = () => ({
  request: api,
});

export { api };
export default useApi;
