import { get, join, trim, some, filter, isArray, map } from "lodash";
import { config } from "@/config.js";
import {
  canAccessUserDashboard,
  getPostOnboardingPath,
  getUserOnboardingPath,
} from "@/lib/app-paths.js";

const normalizeAuthErrorMessage = (message) => {
  if (isArray(message)) {
    const messages = filter(map(
      message,
      (item) => (typeof item === "string" ? item : get(item, "message")),
    ), (item) => typeof item === "string" && trim(item));

    return messages.length > 0 ? join(messages, ", ") : null;
  }

  if (typeof message === "string" && trim(message)) {
    return message;
  }

  return null;
};

export const getAuthErrorMessage = (error, fallbackMessage) => {
  const message =
    normalizeAuthErrorMessage(get(error, "response.data.error.details")) ??
    normalizeAuthErrorMessage(get(error, "response.data.error.message")) ??
    normalizeAuthErrorMessage(get(error, "response.data.message")) ??
    normalizeAuthErrorMessage(get(error, "message"));

  if (message) {
    return message;
  }

  return fallbackMessage;
};

export const getAuthResponseData = (response) => {
  return get(response, "data.data") ?? get(response, "data") ?? response;
};

export const getOtpToastDescription = (responseData, t) => {
  const otpCode = get(responseData, "otpCode");
  if (!otpCode || typeof t !== "function") {
    return undefined;
  }

  return t("auth.devOtpCode", { code: otpCode });
};

export const getPostAuthRoute = (user) => {
  if (get(user, "passwordSetupRequired")) {
    return "/auth/set-password";
  }

  const roles = get(user, "roles", []);

  if (some(roles, (role) => role === "SUPER_ADMIN")) {
    return "/admin/dashboard";
  }

  if (
    get(user, "onboardingCompleted") &&
    canAccessUserDashboard(
      get(user, "onboardingFlowStatus"),
      get(user, "onboardingCompleted"),
    )
  ) {
    return "/user";
  }

  if (get(user, "onboardingCompleted")) {
    return getPostOnboardingPath(user);
  }

  return getUserOnboardingPath();
};

export const getSocialAuthUrl = (provider) => {
  return `${config.baseURL}/auth/login/${provider}`;
};

export const handleSocialLogin = (provider) => {
  window.location.href = getSocialAuthUrl(provider);
};
